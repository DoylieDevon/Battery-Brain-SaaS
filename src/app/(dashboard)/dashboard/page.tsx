"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SocChart } from "@/components/dashboard/SocChart";

interface BrainData {
  ts: string;
  latest: {
    battery: { percent: number; power: number };
    solar: { power: number };
    consumption: number;
    grid: { power: number };
    status: string;
  } | null;
  flows: { start_time: string; data: Record<string, number> }[];
  brain: {
    mode: string;
    decision: { action: string; reason: string };
    plan: { t: number; socPct: number; cls: string; rate: number; action: string; kwh: number }[];
    topup: { shortfallKwh: number; peakNeedKwh: number } | null;
  } | null;
  alerts: { sev: string; msg: string }[];
  config: { capKwh: number; cheapMax: number; peakMin: number };
  rates: { valid_from: string; valid_to: string | null; value_inc_vat: number }[];
}

function fmt(n: number, dp = 1) { return n.toFixed(dp); }
function fmtKw(w: number) { return `${fmt(Math.abs(w) / 1000)} kW`; }
function fmtGbp(p: number) { return `£${fmt(p, 2)}`; }
function fmtP(p: number) { return `${fmt(p, 1)}p`; }

function currentRate(rates: BrainData["rates"]) {
  const now = Date.now();
  return rates.find(r => {
    const from = Date.parse(r.valid_from);
    const to = r.valid_to ? Date.parse(r.valid_to) : Infinity;
    return now >= from && now < to;
  })?.value_inc_vat ?? null;
}

function todaySavings(flows: BrainData["flows"], rates: BrainData["rates"], config: BrainData["config"]) {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  const rateAt = (ms: number) => rates.find(r => {
    const from = Date.parse(r.valid_from);
    const to = r.valid_to ? Date.parse(r.valid_to) : Infinity;
    return ms >= from && ms < to;
  })?.value_inc_vat ?? 33.7;

  let chargeKwh = 0, chargeCost = 0, dischPeakVal = 0, dischOtherVal = 0;
  for (const s of flows) {
    if (!s.start_time.startsWith(todayStr)) continue;
    const t = new Date(s.start_time.replace(" ", "T")).getTime();
    const r = rateAt(t);
    const gridChg = s.data["4"] || 0;
    const dis = s.data["5"] || 0;
    if (gridChg > 0) { chargeKwh += gridChg; chargeCost += gridChg * r / 100; }
    if (dis > 0) { r >= config.peakMin ? (dischPeakVal += dis * r / 100) : (dischOtherVal += dis * r / 100); }
  }
  return { chargeKwh, netSaved: dischPeakVal + dischOtherVal - chargeCost };
}

function statusText(lat: BrainData["latest"], decision: { action: string; reason: string } | undefined) {
  if (!lat) return { headline: "Connecting to your battery…", sub: "Fetching inverter data" };
  const batt = lat.battery;
  if (decision?.action === "charge") return { headline: "Charging on cheap power", sub: `Battery at ${batt.percent}% · ${fmtKw(batt.power)} in` };
  if (decision?.action === "topup") return { headline: "Topping up before peak", sub: `Battery at ${batt.percent}% · ${fmtKw(batt.power)} in` };
  if (decision?.action === "discharge" || (batt.power < -50)) return { headline: "Running your home on battery", sub: `${batt.percent}% remaining · ${fmtKw(batt.power)} out` };
  return { headline: "Holding charge for peak", sub: `Battery at ${batt.percent}% · ready for this evening` };
}

function rateColour(rate: number, cheapMax: number, peakMin: number) {
  if (rate <= cheapMax) return { bg: "#D8F1E1", text: "#0E6645", label: "CHEAP" };
  if (rate >= peakMin) return { bg: "#FFE0D6", text: "#B84330", label: "PEAK" };
  return { bg: "#EEF3F0", text: "#51635C", label: "STD" };
}

function londonHHMM(ms: number) {
  return new Date(ms).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false });
}

const ACTION_DOT: Record<string, string> = {
  charge: "#18C172",
  topup: "#F59E0B",
  discharge: "#0E9C7A",
  idle: "#DDE7E1",
};

export default function DashboardPage() {
  const [data, setData] = useState<BrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch("/api/brain", { cache: "no-store" });
      if (r.status === 400) { window.location.href = "/onboarding"; return; }
      if (!r.ok) throw new Error(`API ${r.status}`);
      setData(await r.json());
      setLastUpdated(new Date());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#18C172] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#7C8A83]">Talking to your battery…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
      <strong>Could not load data:</strong> {error}
    </div>
  );

  if (!data) return null;

  const { latest, flows, brain, alerts, config, rates } = data;
  const savings = todaySavings(flows, rates, config);
  const nowRate = currentRate(rates);
  const mode = brain?.mode ?? "shadow";
  const decision = brain?.decision;
  const { headline, sub } = statusText(latest, decision);
  const soc = latest?.battery.percent ?? 0;
  const rateInfo = nowRate !== null ? rateColour(nowRate, config.cheapMax, config.peakMin) : null;

  // SOC ring
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (soc / 100) * circumference;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#7C8A83]">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "#0E2A24", letterSpacing: "-.02em" }}>Today</h1>
        </div>
        <div className="flex items-center gap-2">
          {rateInfo && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: rateInfo.bg, color: rateInfo.text }}>
              {rateInfo.label} {nowRate && fmtP(nowRate)}
            </span>
          )}
          {lastUpdated && (
            <button onClick={fetchData} className="text-xs text-[#9FB0A7] hover:text-[#0E9C7A] transition-colors">
              {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} ↺
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`rounded-2xl border p-3.5 text-sm ${a.sev === "err" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Big status card */}
      <div className="rounded-3xl p-6 text-white" style={{ background: "linear-gradient(160deg, #0E9C7A, #11A877)" }}>
        <div className="flex items-center gap-5 mb-5">
          {/* SOC ring */}
          <svg width="92" height="92" viewBox="0 0 100 100" className="shrink-0">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 50 50)" />
            <text x="50" y="47" textAnchor="middle" fontFamily="inherit" fontWeight="800" fontSize="24" fill="#fff">{soc}%</text>
            <text x="50" y="63" textAnchor="middle" fontFamily="inherit" fontSize="10" fill="rgba(255,255,255,.8)">charged</text>
          </svg>
          <div>
            <div className="text-xs opacity-80 mb-1">Right now</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{headline}</div>
            <div className="text-sm opacity-90 mt-1">{sub}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl p-3" style={{ background: "rgba(255,255,255,.14)" }}>
            <div className="text-xs opacity-80 mb-0.5">From grid now</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              {latest ? (latest.grid.power > 50 ? fmtGbp(latest.grid.power / 1000 * (nowRate ?? 33.7) / 100 / 2) : "£0.00") : "—"}
            </div>
          </div>
          <div className="flex-1 rounded-2xl p-3" style={{ background: "rgba(255,255,255,.14)" }}>
            <div className="text-xs opacity-80 mb-0.5">Saved today</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              {fmtGbp(Math.max(0, savings.netSaved))}
            </div>
          </div>
          {latest?.solar && latest.solar.power > 50 && (
            <div className="flex-1 rounded-2xl p-3" style={{ background: "rgba(255,255,255,.14)" }}>
              <div className="text-xs opacity-80 mb-0.5">Solar now</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{fmtKw(latest.solar.power)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Plan timeline */}
      {brain?.plan && brain.plan.length > 0 && (
        <div className="bg-white border border-[#EAF1ED] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0E2A24" }}>Today&apos;s plan</span>
            <span className="text-xs font-semibold text-[#0E9C7A]">
              {mode === "shadow" ? "Shadow — watching only" : "All on track"}
            </span>
          </div>
          <div className="space-y-0">
            {brain.plan.slice(0, 8).map((slot, i, arr) => {
              const colour = ACTION_DOT[slot.action] ?? "#DDE7E1";
              const isLast = i === arr.length - 1;
              const isCurrent = i === 0;
              return (
                <div key={i} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full shrink-0 mt-0.5 border-2 border-white"
                      style={{ background: colour, boxShadow: isCurrent ? `0 0 0 3px ${colour}30` : "none" }} />
                    {!isLast && <div className="w-0.5 flex-1 mt-1" style={{ background: "#E5EDE8" }} />}
                  </div>
                  <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold" style={{ color: isCurrent && slot.action === "discharge" ? "#B84330" : "#0E2A24" }}>
                        {slot.action.charAt(0).toUpperCase() + slot.action.slice(1)}
                      </span>
                      <span className="text-xs text-[#9FB0A7] font-medium">· {londonHHMM(slot.t)}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                        background: slot.cls === "cheap" ? "#D8F1E1" : slot.cls === "peak" ? "#FFE0D6" : "#EEF3F0",
                        color: slot.cls === "cheap" ? "#0E6645" : slot.cls === "peak" ? "#B84330" : "#51635C"
                      }}>{fmtP(slot.rate)}</span>
                    </div>
                    <div className="text-xs text-[#7C8A83] mt-0.5">
                      SOC {slot.socPct}% {slot.kwh !== 0 && `· ${slot.kwh > 0 ? "+" : ""}${fmt(slot.kwh)} kWh`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SOC chart */}
      <div className="bg-white border border-[#EAF1ED] rounded-3xl p-6">
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0E2A24", marginBottom: 16 }}>
          Battery activity · 24h
        </div>
        <SocChart flows={flows} plan={brain?.plan} capKwh={config.capKwh} />
      </div>

      {/* Live stats row */}
      {latest && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Solar", value: latest.solar ? fmtKw(latest.solar.power) : "—", icon: "☀️" },
            { label: "Home", value: fmtKw(latest.consumption), icon: "🏠" },
            { label: "Grid", value: fmtKw(latest.grid.power), icon: latest.grid.power > 50 ? "↓" : latest.grid.power < -50 ? "↑" : "—" },
          ].map(k => (
            <div key={k.label} className="bg-white border border-[#EAF1ED] rounded-2xl p-4 text-center">
              <div className="text-lg mb-1">{k.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#0E2A24" }}>{k.value}</div>
              <div className="text-xs text-[#9FB0A7] mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Shadow mode notice */}
      {mode === "shadow" && (
        <div className="rounded-2xl bg-[#EEF6F1] border border-[#C8E6D4] p-4 text-sm text-[#4E635A]">
          <svg className="inline w-4 h-4 mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 5 7 10 7 10s7-5 7-10V6l-7-3Z" stroke="#0E9C7A" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          <strong>Shadow mode —</strong> Hum is watching but not controlling your inverter. The plan above shows what it <em>would</em> do.{" "}
          <Link href="/settings" className="font-semibold text-[#0E9C7A] underline">Switch to active in Settings</Link>.
        </div>
      )}
    </div>
  );
}
