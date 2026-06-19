"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function rateClass(rate: number, cheapMax: number, peakMin: number) {
  if (rate <= cheapMax) return "bg-blue-100 text-blue-800 border-blue-200";
  if (rate >= peakMin) return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function rateLabel(rate: number, cheapMax: number, peakMin: number) {
  if (rate <= cheapMax) return "CHEAP";
  if (rate >= peakMin) return "PEAK";
  return "STD";
}

function currentRate(rates: BrainData["rates"]) {
  const now = Date.now();
  const r = rates.find(r => {
    const from = Date.parse(r.valid_from);
    const to = r.valid_to ? Date.parse(r.valid_to) : Infinity;
    return now >= from && now < to;
  });
  return r?.value_inc_vat ?? null;
}

function todaySavings(flows: BrainData["flows"], rates: BrainData["rates"], config: BrainData["config"]) {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/London" }); // YYYY-MM-DD

  const rateAt = (ms: number) => {
    const r = rates.find(r => {
      const from = Date.parse(r.valid_from);
      const to = r.valid_to ? Date.parse(r.valid_to) : Infinity;
      return ms >= from && ms < to;
    });
    return r?.value_inc_vat ?? 33.7;
  };

  let chargeKwh = 0, chargeCost = 0, dischPeakKwh = 0, dischPeakVal = 0, dischOtherVal = 0;

  for (const s of flows) {
    if (!s.start_time.startsWith(todayStr)) continue;
    const t = new Date(s.start_time.replace(" ", "T")).getTime();
    const r = rateAt(t);
    const isPeak = r >= config.peakMin;
    const gridChg = s.data["4"] || 0;
    const dis = s.data["5"] || 0;
    if (gridChg > 0) { chargeKwh += gridChg; chargeCost += gridChg * r / 100; }
    if (dis > 0) {
      if (isPeak) { dischPeakKwh += dis; dischPeakVal += dis * r / 100; }
      else { dischOtherVal += dis * r / 100; }
    }
  }

  const grossSaved = dischPeakVal + dischOtherVal;
  const netSaved = grossSaved - chargeCost;
  const avgChargeP = chargeKwh > 0 ? (chargeCost / chargeKwh) * 100 : 0;

  return { chargeKwh, chargeCost, avgChargeP, dischPeakKwh, dischPeakVal, netSaved };
}

const ACTION_COLOUR: Record<string, string> = {
  charge: "text-blue-600",
  topup: "text-amber-600",
  discharge: "text-green-600",
  idle: "text-gray-400",
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
      const d = await r.json();
      setData(d);
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
        <div className="w-8 h-8 border-2 border-[#00b47a] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Talking to your inverter…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
      <strong>Could not load data:</strong> {error}
    </div>
  );

  if (!data) return null;

  const { latest, flows, brain, alerts, config, rates } = data;
  const savings = todaySavings(flows, rates, config);
  const nowRate = currentRate(rates);
  const mode = brain?.mode ?? "shadow";
  const decision = brain?.decision;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              {" · "}
              <button onClick={fetchData} className="text-[#00b47a] hover:underline">Refresh</button>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {nowRate !== null && (
            <Badge className={`border ${rateClass(nowRate, config.cheapMax, config.peakMin)}`}>
              {rateLabel(nowRate, config.cheapMax, config.peakMin)} {fmtP(nowRate)}
            </Badge>
          )}
          <Badge className={mode === "active" ? "bg-green-100 text-green-800 border-green-200 border" : "bg-amber-100 text-amber-800 border-amber-200 border"}>
            {mode === "active" ? "Active" : "Shadow mode"}
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`rounded-lg border p-3 text-sm ${a.sev === "err" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              {a.sev === "err" ? "⚠ " : "ℹ "}{a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Battery",
            value: latest ? `${latest.battery.percent}%` : "—",
            sub: latest ? (latest.battery.power < -50 ? `Charging ${fmtKw(latest.battery.power)}` : latest.battery.power > 50 ? `Discharging ${fmtKw(latest.battery.power)}` : "Idle") : "",
            color: "text-blue-600",
            icon: "🔋",
          },
          {
            label: "Solar",
            value: latest?.solar ? fmtKw(latest.solar.power) : "—",
            sub: latest?.solar ? `${fmt(latest.solar.power / 1000)} kW generating` : "No solar data",
            color: "text-amber-500",
            icon: "☀️",
          },
          {
            label: "Home",
            value: latest ? fmtKw(latest.consumption) : "—",
            sub: latest ? `${fmt(latest.consumption / 1000)} kW consuming` : "",
            color: "text-green-600",
            icon: "🏠",
          },
          {
            label: "Grid",
            value: latest ? fmtKw(latest.grid.power) : "—",
            sub: latest ? (latest.grid.power > 0 ? "Importing" : latest.grid.power < 0 ? "Exporting" : "Neutral") : "",
            color: latest?.grid.power !== undefined ? (latest.grid.power > 100 ? "text-red-500" : latest.grid.power < -100 ? "text-emerald-600" : "text-gray-500") : "text-gray-500",
            icon: "⚡",
          },
        ].map(k => (
          <Card key={k.label} className="shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg">{k.icon}</span>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{k.label}</p>
              </div>
              <p className={`text-3xl font-extrabold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brain decision */}
      {decision && (
        <Card className="shadow-sm border-l-4 border-l-[#00b47a]">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🧠</span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Brain decision now</p>
                <p className={`font-bold text-base ${ACTION_COLOUR[decision.action] ?? "text-gray-700"}`}>
                  {decision.action.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{decision.reason}</p>
                {brain?.topup && (
                  <p className="text-xs text-amber-700 mt-1.5">
                    Top-up: {brain.topup.peakNeedKwh} kWh needed at peak, {brain.topup.shortfallKwh} kWh short
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's savings */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today&apos;s savings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Charged today</p>
              <p className="text-2xl font-bold">{fmt(savings.chargeKwh)} kWh</p>
              <p className="text-xs text-gray-400 mt-0.5">avg {fmtP(savings.avgChargeP)} · cost {fmtGbp(savings.chargeCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Discharged at peak</p>
              <p className="text-2xl font-bold">{fmt(savings.dischPeakKwh)} kWh</p>
              <p className="text-xs text-gray-400 mt-0.5">valued {fmtGbp(savings.dischPeakVal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Net saved today</p>
              <p className={`text-2xl font-bold ${savings.netSaved > 0 ? "text-[#00b47a]" : "text-gray-400"}`}>
                {fmtGbp(savings.netSaved)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">vs peak import</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOC / flow chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Battery activity · last 24h + projected</CardTitle>
        </CardHeader>
        <CardContent className="pr-2">
          <SocChart flows={flows} plan={brain?.plan} capKwh={config.capKwh} />
        </CardContent>
      </Card>

      {/* Today's plan table */}
      {brain?.plan && brain.plan.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today&apos;s plan — now to midnight</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-2">Time</th>
                    <th className="text-left px-4 py-2">Rate</th>
                    <th className="text-left px-4 py-2">Window</th>
                    <th className="text-left px-4 py-2">Action</th>
                    <th className="text-right px-4 py-2">kWh</th>
                    <th className="text-right px-4 py-2">SOC</th>
                  </tr>
                </thead>
                <tbody>
                  {brain.plan.map((slot, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i === 0 ? "bg-[#f0fdf4]" : ""}`}>
                      <td className="px-4 py-1.5 font-mono text-xs">
                        {new Date(slot.t).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                      <td className="px-4 py-1.5">{fmtP(slot.rate)}</td>
                      <td className="px-4 py-1.5">
                        <span className={`text-xs font-medium ${slot.cls === "cheap" ? "text-blue-600" : slot.cls === "peak" ? "text-red-600" : "text-gray-500"}`}>
                          {slot.cls.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-4 py-1.5 font-medium ${ACTION_COLOUR[slot.action] ?? "text-gray-500"}`}>
                        {slot.action}
                      </td>
                      <td className="px-4 py-1.5 text-right font-mono text-xs">{slot.kwh > 0 ? "+" : ""}{fmt(slot.kwh)}</td>
                      <td className="px-4 py-1.5 text-right font-mono text-xs">{slot.socPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shadow mode notice */}
      {mode === "shadow" && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <strong>Shadow mode.</strong> Brain is watching and building your usage profile. The plan above shows what it <em>would</em> do — your inverter is still controlled by whatever scheduled it last (e.g. WonderWatt). Once you&apos;re happy, switch to active mode in{" "}
          <a href="/settings" className="underline font-medium">Settings</a>.
        </div>
      )}
    </div>
  );
}
