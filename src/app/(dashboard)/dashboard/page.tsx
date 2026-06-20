"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SocChart } from "@/components/dashboard/SocChart";

interface FlowSlot { start_time: string; data: Record<string, number>; }
interface RateSlot { valid_from: string; valid_to: string | null; value_inc_vat: number; }
interface BrainData {
  ts: string;
  latest: { battery: { percent: number; power: number }; solar?: { power: number }; consumption: number; grid: { power: number }; status: string } | null;
  flows: FlowSlot[];
  brain: { mode: string; decision: { action: string; reason: string }; plan: { t: number; socPct: number; cls: string; rate: number; action: string; kwh: number }[]; topup: { shortfallKwh: number; peakNeedKwh: number } | null } | null;
  alerts: { sev: string; msg: string }[];
  config: { capKwh: number; cheapMax: number; peakMin: number };
  rates: RateSlot[];
  settings: { start: string | null; end: string | null; enabled: boolean | null; target: number | null };
}
interface WeatherData { temp: number; maxTemp: number; minTemp: number; code: number; windKph: number; }

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number, dp = 1) { return n.toFixed(dp); }
function fmtKw(w: number) { return `${fmt(Math.abs(w) / 1000)} kW`; }
function fmtGbp(p: number) { return `£${fmt(p, 2)}`; }
function fmtP(p: number) { return `${fmt(p, 1)}p`; }
function londonHHMM(ms: number) { return new Date(ms).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false }); }

function currentRate(rates: RateSlot[]) {
  const now = Date.now();
  return rates.find(r => { const from = Date.parse(r.valid_from); const to = r.valid_to ? Date.parse(r.valid_to) : Infinity; return now >= from && now < to; })?.value_inc_vat ?? null;
}

function rateColour(rate: number, cheapMax: number, peakMin: number) {
  if (rate <= cheapMax) return { bg: "#D8F1E1", text: "#0E6645", label: "CHEAP" };
  if (rate >= peakMin) return { bg: "#FFE0D6", text: "#B84330", label: "PEAK" };
  return { bg: "#EEF3F0", text: "#51635C", label: "STD" };
}

function todaySavings(flows: FlowSlot[], rates: RateSlot[], config: BrainData["config"]) {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  const rateAt = (ms: number) => rates.find(r => { const f = Date.parse(r.valid_from); const t = r.valid_to ? Date.parse(r.valid_to) : Infinity; return ms >= f && ms < t; })?.value_inc_vat ?? 33.7;
  let chargeKwh = 0, chargeCost = 0, dischPeakKwh = 0, dischPeakVal = 0, dischOtherVal = 0;
  for (const s of flows) {
    if (!s.start_time.startsWith(todayStr)) continue;
    const t = new Date(s.start_time.replace(" ", "T")).getTime();
    const r = rateAt(t);
    const gridChg = s.data["4"] || 0;
    const dis = s.data["5"] || 0;
    if (gridChg > 0) { chargeKwh += gridChg; chargeCost += gridChg * r / 100; }
    if (dis > 0) { if (r >= config.peakMin) { dischPeakKwh += dis; dischPeakVal += dis * r / 100; } else { dischOtherVal += dis * r / 100; } }
  }
  return { chargeKwh: +chargeKwh.toFixed(1), chargeCost, dischPeakKwh: +dischPeakKwh.toFixed(1), dischPeakVal, dischOtherVal, netSaved: dischPeakVal + dischOtherVal - chargeCost };
}

function todayTotals(flows: FlowSlot[]) {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  let solar = 0, home = 0, gridImp = 0, battChg = 0, battDis = 0;
  for (const s of flows) {
    if (!s.start_time.startsWith(todayStr)) continue;
    const f = s.data;
    solar += (f["1"] || 0) + (f["2"] || 0);
    home  += (f["0"] || 0) + (f["3"] || 0) + (f["5"] || 0);
    gridImp += (f["0"] || 0) + (f["4"] || 0);
    battChg += f["4"] || 0;
    battDis += f["5"] || 0;
  }
  return { solar: +solar.toFixed(1), home: +home.toFixed(1), gridImp: +gridImp.toFixed(1), battChg: +battChg.toFixed(1), battDis: +battDis.toFixed(1) };
}

function weatherIcon(code: number) {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

function batteryTempNote(temp: number): string | null {
  if (temp < 5)  return `At ${temp}°C your battery may charge up to 30% slower and hold less capacity than usual. GivEnergy cells work best above 10°C.`;
  if (temp < 10) return `At ${temp}°C expect slightly slower charging. Battery efficiency picks up as it warms through the day.`;
  if (temp > 38) return `At ${temp}°C the battery management system may throttle charging to protect the cells.`;
  return null;
}

function statusText(lat: BrainData["latest"], decision?: { action: string; reason: string }) {
  if (!lat) return { headline: "Connecting to your battery…", sub: "Fetching inverter data" };
  const b = lat.battery;
  if (decision?.action === "charge") return { headline: "Charging on cheap power", sub: `${b.percent}% · ${fmtKw(b.power)} flowing in` };
  if (decision?.action === "topup")  return { headline: "Topping up before peak", sub: `${b.percent}% · ${fmtKw(b.power)} flowing in` };
  if (decision?.action === "discharge" || b.power < -50) return { headline: "Running your home on battery", sub: `${b.percent}% remaining · ${fmtKw(b.power)} out` };
  return { headline: "Holding charge for peak", sub: `${b.percent}% · ready for this evening` };
}

const ACTION_DOT: Record<string, string> = { charge: "#18C172", topup: "#F59E0B", discharge: "#0E9C7A", idle: "#DDE7E1" };

// ── Component ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData]         = useState<BrainData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [weather, setWeather]   = useState<WeatherData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch("/api/brain", { cache: "no-store" });
      if (r.status === 400) { window.location.href = "/onboarding"; return; }
      if (!r.ok) throw new Error(`API ${r.status}`);
      setData(await r.json()); setLastUpdated(new Date()); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FLondon&forecast_days=1`);
        const d = await r.json();
        setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code, windKph: Math.round(d.current.wind_speed_10m), maxTemp: Math.round(d.daily.temperature_2m_max[0]), minTemp: Math.round(d.daily.temperature_2m_min[0]) });
      } catch { /* silent */ }
    };
    const fallback = () => fetchWeather(51.5, -1.5);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(p => fetchWeather(p.coords.latitude, p.coords.longitude), fallback, { timeout: 5000 });
    } else { fallback(); }
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#18C172] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#7C8A83]">Talking to your battery…</p>
      </div>
    </div>
  );
  if (error) return <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800"><strong>Could not load data:</strong> {error}</div>;
  if (!data) return null;

  const { latest, flows, brain, alerts, config, rates, settings } = data;
  const savings = todaySavings(flows, rates, config);
  const totals  = todayTotals(flows);
  const nowRate = currentRate(rates);
  const mode    = brain?.mode ?? "shadow";
  const decision = brain?.decision;
  const { headline, sub } = statusText(latest, decision);
  const soc  = latest?.battery.percent ?? 0;
  const rateInfo = nowRate !== null ? rateColour(nowRate, config.cheapMax, config.peakMin) : null;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (soc / 100) * circumference;
  const tempNote = weather ? batteryTempNote(weather.temp) : null;

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#7C8A83]">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "#0E2A24", letterSpacing: "-.02em" }}>Today</h1>
        </div>
        <div className="flex items-center gap-2">
          {rateInfo && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: rateInfo.bg, color: rateInfo.text }}>{rateInfo.label} {nowRate && fmtP(nowRate)}</span>}
          {lastUpdated && <button onClick={fetchData} className="text-xs text-[#9FB0A7] hover:text-[#0E9C7A] transition-colors">{lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} ↺</button>}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => <div key={i} className={`rounded-2xl border p-3.5 text-sm ${a.sev === "err" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>{a.msg}</div>)}
        </div>
      )}

      {/* Hero card */}
      <div className="rounded-3xl p-6 text-white" style={{ background: "linear-gradient(160deg, #0E9C7A, #11A877)" }}>
        <div className="flex items-center gap-5 mb-5">
          <svg width="92" height="92" viewBox="0 0 100 100" className="shrink-0">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 50 50)" />
            <text x="50" y="47" textAnchor="middle" fontFamily="inherit" fontWeight="800" fontSize="24" fill="#fff">{soc}%</text>
            <text x="50" y="63" textAnchor="middle" fontFamily="inherit" fontSize="10" fill="rgba(255,255,255,.8)">charged</text>
          </svg>
          <div>
            <div className="text-xs opacity-80 mb-1">Right now</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{headline}</div>
            <div className="text-sm opacity-90 mt-1">{sub}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,.14)" }}>
            <div className="text-xs opacity-80 mb-0.5">Cost from grid now</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              {latest ? (latest.grid.power > 50 ? fmtGbp(latest.grid.power / 1000 * (nowRate ?? 33.7) / 100 / 2) : "£0.00") : "—"}
              <span className="text-xs font-normal opacity-70">/hr</span>
            </div>
          </div>
          <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,.14)" }}>
            <div className="text-xs opacity-80 mb-0.5">Saved today</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{fmtGbp(Math.max(0, savings.netSaved))}</div>
          </div>
          {latest?.solar && latest.solar.power > 50
            ? <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,.14)" }}><div className="text-xs opacity-80 mb-0.5">Solar now</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{fmtKw(latest.solar.power)}</div></div>
            : <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,.14)" }}><div className="text-xs opacity-80 mb-0.5">Battery power</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{latest ? fmtKw(latest.battery.power) : "—"}</div></div>
          }
        </div>
      </div>

      {/* Energy stats row */}
      {latest && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "⚡", label: "Battery", live: `${latest.battery.power < -50 ? "Charging" : latest.battery.power > 50 ? "Discharging" : "Idle"} · ${fmtKw(latest.battery.power)}`, today: `+${totals.battChg} / −${totals.battDis} kWh`, todayLabel: "charged / discharged today" },
            { icon: "🔌", label: "Grid", live: `${latest.grid.power > 50 ? "Importing" : latest.grid.power < -50 ? "Exporting" : "Idle"} · ${fmtKw(latest.grid.power)}`, today: `${totals.gridImp} kWh`, todayLabel: "imported today" },
            { icon: "🏠", label: "Home", live: `${fmtKw(latest.consumption)} consuming`, today: `${totals.home} kWh`, todayLabel: "consumed today" },
            ...(totals.solar > 0 || (latest.solar && latest.solar.power > 50) ? [{ icon: "☀️", label: "Solar", live: latest.solar && latest.solar.power > 50 ? `${fmtKw(latest.solar.power)} generating` : "Idle", today: `${totals.solar} kWh`, todayLabel: "generated today" }] : []),
          ].map(k => (
            <div key={k.label} className="bg-white border border-[#EAF1ED] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{k.icon}</span>
                <span className="text-xs font-bold text-[#9FB0A7] uppercase tracking-wide">{k.label}</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0E2A24" }}>{k.live}</div>
              <div className="text-xs text-[#9FB0A7] mt-0.5">{k.today} {k.todayLabel}</div>
            </div>
          ))}
        </div>
      )}

      {/* Savings breakdown */}
      <div className="bg-white border border-[#EAF1ED] rounded-3xl p-6">
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0E2A24", marginBottom: 14 }}>Today&apos;s savings</div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#51635C]">Charged from grid</span>
            <span className="text-[#9FB0A7]">{savings.chargeKwh} kWh · cost <span className="text-[#0E2A24] font-semibold">{fmtGbp(savings.chargeCost)}</span></span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#51635C]">Discharged at peak</span>
            <span className="text-[#9FB0A7]">{savings.dischPeakKwh} kWh · avoided <span className="text-[#0E6645] font-semibold">{fmtGbp(savings.dischPeakVal)}</span></span>
          </div>
          <div className="h-px bg-[#EEF3F0]" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-[#0E2A24]">Net saved today</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: savings.netSaved > 0 ? "#0E6645" : "#51635C" }}>{fmtGbp(Math.max(0, savings.netSaved))}</span>
          </div>
        </div>
      </div>

      {/* Brain decision */}
      {decision && (
        <div className="bg-white border border-[#EAF1ED] rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: ACTION_DOT[decision.action] ?? "#DDE7E1" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13c0-4 3-7 7-7s7 3 7 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0E2A24" }}>Hum&apos;s decision</span>
            <span className="text-xs text-[#9FB0A7] ml-auto">{mode === "shadow" ? "shadow mode" : "active"}</span>
          </div>
          <p className="text-sm text-[#51635C] leading-relaxed">{decision.reason}</p>
          {settings.start && (
            <div className="mt-3 pt-3 border-t border-[#EEF3F0] flex gap-4 text-xs text-[#9FB0A7]">
              <span>Charge schedule: <span className="text-[#51635C] font-medium">{settings.start} – {settings.end}</span></span>
              {settings.target && <span>Target SOC: <span className="text-[#51635C] font-medium">{settings.target}%</span></span>}
              <span>Enabled: <span className="text-[#51635C] font-medium">{settings.enabled ? "yes" : "no"}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Weather */}
      {weather && (
        <div className="bg-white border border-[#EAF1ED] rounded-3xl p-6">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0E2A24", marginBottom: 14 }}>Outside conditions</div>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl">{weatherIcon(weather.code)}</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "#0E2A24", lineHeight: 1 }}>{weather.temp}°C</div>
              <div className="text-xs text-[#9FB0A7] mt-0.5">
                {weather.minTemp}° – {weather.maxTemp}° today · {weather.windKph} km/h wind
              </div>
            </div>
          </div>
          {tempNote && (
            <div className="rounded-2xl bg-[#FFF8E8] border border-[#F5E4A0] p-3 text-xs text-[#7A5C00]">
              <strong>Battery note:</strong> {tempNote}
            </div>
          )}
          {!tempNote && (
            <div className="text-xs text-[#9FB0A7]">
              Temperature in the ideal range for battery performance — charging and capacity running at full efficiency.
            </div>
          )}
        </div>
      )}

      {/* Plan timeline */}
      {brain?.plan && brain.plan.length > 0 && (
        <div className="bg-white border border-[#EAF1ED] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0E2A24" }}>Today&apos;s plan</span>
            <span className="text-xs font-semibold text-[#0E9C7A]">{mode === "shadow" ? "Shadow — watching only" : "Active"}</span>
          </div>
          <div className="space-y-0">
            {brain.plan.slice(0, 12).map((slot, i, arr) => {
              const colour = ACTION_DOT[slot.action] ?? "#DDE7E1";
              const isLast = i === arr.length - 1;
              const isCurrent = i === 0;
              return (
                <div key={i} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full shrink-0 mt-0.5 border-2 border-white" style={{ background: colour, boxShadow: isCurrent ? `0 0 0 3px ${colour}30` : "none" }} />
                    {!isLast && <div className="w-0.5 flex-1 mt-1" style={{ background: "#E5EDE8" }} />}
                  </div>
                  <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-[#0E2A24]">{slot.action.charAt(0).toUpperCase() + slot.action.slice(1)}</span>
                      <span className="text-xs text-[#9FB0A7] font-medium">· {londonHHMM(slot.t)}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: slot.cls === "cheap" ? "#D8F1E1" : slot.cls === "peak" ? "#FFE0D6" : "#EEF3F0", color: slot.cls === "cheap" ? "#0E6645" : slot.cls === "peak" ? "#B84330" : "#51635C" }}>{fmtP(slot.rate)}</span>
                    </div>
                    <div className="text-xs text-[#7C8A83] mt-0.5">SOC {slot.socPct}% {slot.kwh !== 0 && `· ${slot.kwh > 0 ? "+" : ""}${fmt(slot.kwh)} kWh`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SOC chart */}
      <div className="bg-white border border-[#EAF1ED] rounded-3xl p-6">
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0E2A24", marginBottom: 16 }}>Battery activity · 24h</div>
        <SocChart flows={flows} plan={brain?.plan} capKwh={config.capKwh} />
      </div>

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
