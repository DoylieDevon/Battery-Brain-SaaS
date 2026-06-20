"use client";

import { useEffect, useState, useCallback } from "react";

interface BrainData {
  flows: { start_time: string; data: Record<string, number> }[];
  config: { capKwh: number; cheapMax: number; peakMin: number };
  rates: { valid_from: string; valid_to: string | null; value_inc_vat: number }[];
}

function fmt(n: number, dp = 2) { return n.toFixed(dp); }
function fmtGbp(p: number) { return `£${fmt(p)}`; }

function dailySavings(flows: BrainData["flows"], rates: BrainData["rates"], config: BrainData["config"]) {
  const rateAt = (ms: number) => rates.find(r => {
    const from = Date.parse(r.valid_from);
    const to = r.valid_to ? Date.parse(r.valid_to) : Infinity;
    return ms >= from && ms < to;
  })?.value_inc_vat ?? 33.7;

  const byDay = new Map<string, { chargeKwh: number; chargeCost: number; dischPeakVal: number; dischOtherVal: number }>();

  for (const s of flows) {
    const t = new Date(s.start_time.replace(" ", "T"));
    const day = t.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
    const r = rateAt(t.getTime());
    const gridChg = s.data["4"] || 0;
    const dis = s.data["5"] || 0;

    if (!byDay.has(day)) byDay.set(day, { chargeKwh: 0, chargeCost: 0, dischPeakVal: 0, dischOtherVal: 0 });
    const d = byDay.get(day)!;
    if (gridChg > 0) { d.chargeKwh += gridChg; d.chargeCost += gridChg * r / 100; }
    if (dis > 0) { r >= config.peakMin ? (d.dischPeakVal += dis * r / 100) : (d.dischOtherVal += dis * r / 100); }
  }

  return Array.from(byDay.entries())
    .map(([day, d]) => ({
      day,
      net: Math.max(0, d.dischPeakVal + d.dischOtherVal - d.chargeCost),
      chargeKwh: d.chargeKwh,
      covered: d.dischPeakVal > 0,
    }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

export default function SavingsPage() {
  const [data, setData] = useState<BrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch("/api/brain", { cache: "no-store" });
      if (r.status === 400) { window.location.href = "/onboarding"; return; }
      if (!r.ok) throw new Error(`API ${r.status}`);
      setData(await r.json());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#18C172] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>
  );

  if (!data) return null;

  const days = dailySavings(data.flows, data.rates, data.config);
  const last7 = days.slice(0, 7);
  const weekTotal = last7.reduce((s, d) => s + d.net, 0);
  const monthTotal = days.slice(0, 30).reduce((s, d) => s + d.net, 0);
  const coveredDays = last7.filter(d => d.covered).length;
  const bestDay = last7.reduce((best, d) => d.net > (best?.net ?? 0) ? d : best, last7[0]);
  const maxBar = Math.max(...last7.map(d => d.net), 0.01);

  const dayLabel = (iso: string) => {
    const d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  const weekdayInitial = (iso: string) => {
    const d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("en-GB", { weekday: "short" }).charAt(0);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "#0E2A24", letterSpacing: "-.02em" }}>Savings</h1>

      {/* Week total + bar chart */}
      <div className="bg-white border border-[#EAF1ED] rounded-3xl p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-[#7C8A83]">This week</span>
          {last7.length >= 2 && (
            <span className="text-xs font-semibold text-[#0E9C7A] bg-[#E4F6EC] px-2.5 py-1 rounded-full">
              {weekTotal > 0 ? "↑" : "↓"} vs last week
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, color: "#0E2A24", letterSpacing: "-.03em" }}>
          {fmtGbp(weekTotal)}
        </div>

        {/* Bar chart */}
        <div className="flex items-end justify-between gap-2 mt-5 h-24">
          {last7.slice().reverse().map((d, i) => {
            const height = Math.max(4, (d.net / maxBar) * 80);
            const isToday = d.day === new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-lg transition-all"
                  style={{ height, background: isToday ? "#0E9C7A" : "#BDEBD2" }} />
                <span className="text-xs" style={{ color: isToday ? "#0E9C7A" : "#9FB0A7", fontWeight: isToday ? 700 : 400 }}>
                  {weekdayInitial(d.day)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#EAF1ED] rounded-2xl p-5">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "#0E2A24" }}>{coveredDays}/7</div>
          <div className="text-xs text-[#7C8A83] mt-0.5">days fully covered</div>
        </div>
        <div className="bg-white border border-[#EAF1ED] rounded-2xl p-5">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "#0E2A24" }}>{fmtGbp(monthTotal)}</div>
          <div className="text-xs text-[#7C8A83] mt-0.5">saved this month</div>
        </div>
      </div>

      {/* Best day callout */}
      {bestDay && bestDay.net > 0 && (
        <div className="bg-[#EAF6EF] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#18C172] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 16 9 9l3 4 3-7 4 10H5Z" fill="#fff" /></svg>
          </div>
          <div>
            <div className="text-sm font-bold text-[#0E2A24]">{dayLabel(bestDay.day)} was your best day</div>
            <div className="text-xs text-[#5E7068] mt-0.5">{fmtGbp(bestDay.net)} saved</div>
          </div>
        </div>
      )}

      {/* Day list */}
      {days.length === 0 ? (
        <div className="bg-white border border-[#EAF1ED] rounded-2xl p-6 text-center text-sm text-[#9FB0A7]">
          No savings data yet — check back after a few brain ticks have run.
        </div>
      ) : (
        <div className="bg-white border border-[#EAF1ED] rounded-2xl overflow-hidden">
          {days.slice(0, 14).map((d, i, arr) => (
            <div key={d.day} className={`flex items-center justify-between px-5 py-3.5 ${i < arr.length - 1 ? "border-b border-[#F0F4F1]" : ""}`}>
              <div>
                <div className="text-sm font-semibold text-[#0E2A24]">{dayLabel(d.day)}</div>
                <div className="text-xs text-[#9FB0A7] mt-0.5">{d.covered ? "Fully covered" : d.chargeKwh > 0 ? "Partially charged" : "No data"}</div>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: d.net > 0 ? "#0E9C7A" : "#C2CFC8" }}>
                {d.net > 0 ? `+${fmtGbp(d.net)}` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
