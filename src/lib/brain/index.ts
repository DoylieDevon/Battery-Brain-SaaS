// Battery Brain — core charging logic
// Multi-user: all config passed in, no process.env references here.

export interface UserConfig {
  geToken: string;
  serial: string;
  octopusProduct: string; // e.g. "COSY-FIX-12M-26-03-23" or "GO-VAR-22-10-14"
  octopusRegion: string;  // DNO region letter e.g. "L"
  capKwh: number;         // usable battery capacity
  reserveKwh: number;     // floor kWh (~4%)
  chgHalfKwh: number;     // kWh added per 30-min slot (derived from inverter model)
  mode: "shadow" | "active";
}

export interface BrainDecision {
  action: "charge" | "topup" | "discharge" | "idle";
  reason: string;
}

export interface PlanSlot {
  t: number;
  i: number;
  cls: "cheap" | "std" | "peak";
  rate: number;
  action: string;
  kwh: number;
  socPct: number;
}

export interface TopupInfo {
  shortfallKwh: number;
  peakNeedKwh: number;
  slots: number;
}

export interface BrainOutput {
  mode: "shadow" | "active";
  decision: BrainDecision;
  topup: TopupInfo | null;
  plan: PlanSlot[];
}

export interface Alert {
  sev: "err" | "warn" | "ok";
  msg: string;
}

export interface BrainResult {
  ts: string;
  latest: Record<string, unknown> | null;
  settings: { start: string | null; end: string | null; enabled: boolean | null; target: number | null };
  rates: unknown[];
  flows: unknown[];
  forecast: number[];
  brain: BrainOutput | null;
  alerts: Alert[];
  config: { capKwh: number; cheapMax: number; peakMin: number; product: string; region: string };
}

const GE_BASE = "https://api.givenergy.cloud/v1";

async function fetchJson(url: string, opts?: RequestInit): Promise<unknown> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8500);
    const r = await fetch(url, { signal: c.signal, ...opts });
    clearTimeout(t);
    return await r.json();
  } catch {
    return null;
  }
}

function londonTime(d: Date) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const g = (t: string) => p.find(x => x.type === t)!.value;
  return {
    date: `${g("year")}-${g("month")}-${g("day")}`,
    hh: +g("hour") % 24,
    mm: +g("minute"),
  };
}

export async function runBrain(cfg: UserConfig): Promise<BrainResult> {
  const H = {
    Authorization: `Bearer ${cfg.geToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const GE = GE_BASE;
  const now = new Date();
  const np = londonTime(now);
  const startD = londonTime(new Date(now.getTime() - 14 * 864e5)).date;
  const endD = londonTime(new Date(now.getTime() + 864e5)).date;
  const ratesFrom = new Date(now.getTime() - 9 * 864e5).toISOString();
  const ratesTo = new Date(now.getTime() + 864e5).toISOString();
  const tariff = `E-1R-${cfg.octopusProduct}-${cfg.octopusRegion}`;

  const [latest, flows, ratesJ, s64, s65, s66, s77] = await Promise.all([
    fetchJson(`${GE}/inverter/${cfg.serial}/system-data/latest`, { headers: H }),
    fetchJson(`${GE}/inverter/${cfg.serial}/energy-flows`, {
      method: "POST", headers: H,
      body: JSON.stringify({ start_time: startD, end_time: endD, grouping: 0 }),
    }),
    fetchJson(`https://api.octopus.energy/v1/products/${cfg.octopusProduct}/electricity-tariffs/${tariff}/standard-unit-rates/?period_from=${ratesFrom}&period_to=${ratesTo}&page_size=1500`),
    fetchJson(`${GE}/inverter/${cfg.serial}/settings/64/read`, { method: "POST", headers: H, body: "{}" }),
    fetchJson(`${GE}/inverter/${cfg.serial}/settings/65/read`, { method: "POST", headers: H, body: "{}" }),
    fetchJson(`${GE}/inverter/${cfg.serial}/settings/66/read`, { method: "POST", headers: H, body: "{}" }),
    fetchJson(`${GE}/inverter/${cfg.serial}/settings/77/read`, { method: "POST", headers: H, body: "{}" }),
  ]);

  // Rates
  const ratesData = (ratesJ as { results?: { valid_from: string; valid_to: string | null; value_inc_vat: number }[] } | null);
  const rates = (ratesData?.results || []).map(r => ({
    from: Date.parse(r.valid_from),
    to: r.valid_to ? Date.parse(r.valid_to) : Infinity,
    p: r.value_inc_vat,
  }));
  const ps = rates.map(r => r.p);
  const cheapMax = ps.length ? Math.min(...ps) + 1 : 15.8;
  const peakMin  = ps.length ? Math.max(...ps) - 1 : 51.2;
  const rateAt = (ms: number) => { for (const r of rates) if (ms >= r.from && ms < r.to) return r.p; return 33.7; };
  const clsAt  = (ms: number): "cheap" | "std" | "peak" => { const r = rateAt(ms); return r <= cheapMax ? "cheap" : r >= peakMin ? "peak" : "std"; };

  // Consumption + solar forecast (14-day half-hour averages)
  const flowsData = flows as { data?: Record<string, { start_time: string; data: Record<string, number> }> } | null;
  const allSlots = flowsData?.data ? Object.values(flowsData.data) : [];
  const sums = Array(48).fill(0), counts = Array(48).fill(0);
  const solarSums = Array(48).fill(0), solarCounts = Array(48).fill(0);
  for (const s of allSlots) {
    const t = s.start_time.slice(11, 16);
    const idx = (+t.slice(0, 2)) * 2 + (t.slice(3) === "30" ? 1 : 0);
    const f = s.data;
    const cons = (f["0"] || 0) + (f["3"] || 0) + (f["5"] || 0);
    if (cons > 0.01) { sums[idx] += cons; counts[idx]++; }
    // solar generation to battery + grid (for solar users)
    const solar = (f["1"] || 0) + (f["2"] || 0);
    if (solar > 0) { solarSums[idx] += solar; solarCounts[idx]++; }
  }
  const forecast = sums.map((s, i) => counts[i] >= 3 ? +(s / counts[i]).toFixed(3) : 0.4);
  const solarForecast = solarSums.map((s, i) => solarCounts[i] >= 3 ? +(s / solarCounts[i]).toFixed(3) : 0);

  // Brain simulation
  const latestData = latest as { data?: { battery: { percent: number; power: number }; solar?: { power: number }; grid: { power: number }; consumption: number; status: string; time: string } } | null;
  const socPct = latestData?.data?.battery.percent ?? null;
  let brain: BrainOutput | null = null;

  if (socPct !== null) {
    const curIdx = np.hh * 2 + (np.mm >= 30 ? 1 : 0);
    const slot0 = new Date(now);
    slot0.setMinutes(np.mm >= 30 ? 30 : 0, 0, 0);
    const base = slot0.getTime();
    const CAP = cfg.capKwh, RESERVE = cfg.reserveKwh, CHG_HALF = cfg.chgHalfKwh;

    const simulate = (topup: Set<number>): PlanSlot[] => {
      let proj = CAP * socPct / 100;
      const plan: PlanSlot[] = [];
      for (let i = curIdx; i < 48; i++) {
        const ms = base + (i - curIdx) * 1800e3;
        const cls = clsAt(ms);
        // Effective charge available from solar this slot
        const solarAvail = solarForecast[i] || 0;
        let action: string, kwh: number;
        if (cls === "cheap" && proj < CAP - 0.05) {
          kwh = Math.min(CHG_HALF + solarAvail, CAP - proj); proj += kwh; action = "charge";
        } else if (topup.has(i) && proj < CAP - 0.05) {
          kwh = Math.min(CHG_HALF, CAP - proj); proj += kwh; action = "topup";
        } else {
          const use = Math.min(forecast[i], Math.max(0, proj - RESERVE));
          const solarOffset = Math.min(solarAvail, use);
          proj -= (use - solarOffset); kwh = -(use - solarOffset);
          action = use > 0.01 ? "discharge" : "idle";
        }
        plan.push({ t: ms, i, cls, rate: +rateAt(ms).toFixed(2), action, kwh: +kwh.toFixed(2), socPct: Math.round(100 * proj / CAP) });
      }
      return plan;
    };

    let plan = simulate(new Set());
    const firstPeak = plan.find(p => p.cls === "peak");
    let topupInfo: TopupInfo | null = null;

    if (firstPeak) {
      const peakNeed = plan.filter(p => p.cls === "peak").reduce((a, p) => a + forecast[p.i], 0);
      const socAtPeak = firstPeak.socPct / 100 * CAP;
      const shortfall = peakNeed - (socAtPeak - RESERVE);
      if (shortfall > 0.3) {
        const stdBefore = plan.filter(p => p.cls === "std" && p.t < firstPeak.t).map(p => p.i).reverse();
        const need = Math.ceil(shortfall / CHG_HALF);
        const topupSet = new Set(stdBefore.slice(0, need));
        if (topupSet.size) {
          plan = simulate(topupSet);
          topupInfo = { shortfallKwh: +shortfall.toFixed(1), peakNeedKwh: +peakNeed.toFixed(1), slots: topupSet.size };
        }
      }
    }

    const d0 = plan[0];
    let reason: string;
    if (d0.action === "charge")  reason = `Cheap window (${d0.rate}p) — charge to 100%`;
    else if (d0.action === "topup") reason = `TOP-UP at standard rate: projected SOC won't cover forecast peak usage (${topupInfo?.peakNeedKwh} kWh needed, ${topupInfo?.shortfallKwh} kWh short). Charging now at ${d0.rate}p beats importing at peak.`;
    else if (d0.cls === "peak")  reason = `PEAK (${d0.rate}p) — run on battery, never charge`;
    else reason = `Standard rate (${d0.rate}p) — run on battery; projected to ${topupInfo ? "need a top-up later" : "cover the peak without topping up"}`;

    brain = { mode: cfg.mode, decision: { action: d0.action as BrainDecision["action"], reason }, topup: topupInfo, plan };
  }

  // Alerts
  const alerts: Alert[] = [];
  if (!latestData?.data) {
    alerts.push({ sev: "err", msg: "GivEnergy API unreachable — check your API token and that your GivEnergy cloud subscription is active." });
  } else {
    const d = latestData.data;
    if (String(d.status).toLowerCase() === "lost") alerts.push({ sev: "err", msg: `Inverter OFFLINE (last seen ${d.time}) — cannot control charging until it reconnects.` });
    const nowCls = clsAt(now.getTime());
    if (nowCls === "cheap" && d.battery.percent < 95 && d.battery.power > -100) alerts.push({ sev: "warn", msg: `In a cheap window with battery at ${d.battery.percent}% but NOT charging.` });
    if (nowCls === "peak" && d.battery.percent <= 8) alerts.push({ sev: "err", msg: "Battery empty during PEAK — importing at high rate." });
  }
  const dayAgo = now.getTime() - 864e5;
  let recent = 0;
  for (const s of allSlots) { const t = Date.parse(s.start_time.replace(" ", "T")); if (t > dayAgo) recent += (s.data["4"] || 0) + (s.data["5"] || 0); }
  if (recent < 0.3) alerts.push({ sev: "err", msg: "Battery has been idle for 24h+ — no significant charge or discharge." });

  const cut = londonTime(new Date(now.getTime() - 7 * 864e5)).date;
  const flows8 = allSlots.filter(s => s.start_time.slice(0, 10) >= cut);
  const s64d = s64 as { data?: { value: string } } | null;
  const s65d = s65 as { data?: { value: string } } | null;
  const s66d = s66 as { data?: { value: boolean } } | null;
  const s77d = s77 as { data?: { value: number } } | null;

  return {
    ts: now.toISOString(),
    latest: latestData?.data ?? null,
    settings: { start: s64d?.data?.value ?? null, end: s65d?.data?.value ?? null, enabled: s66d?.data?.value ?? null, target: s77d?.data?.value ?? null },
    rates: ratesData?.results || [],
    flows: flows8,
    forecast,
    brain,
    alerts,
    config: { capKwh: cfg.capKwh, cheapMax: +cheapMax.toFixed(2), peakMin: +peakMin.toFixed(2), product: cfg.octopusProduct, region: cfg.octopusRegion },
  };
}
