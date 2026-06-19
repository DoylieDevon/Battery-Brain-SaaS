"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface FlowSlot {
  start_time: string;
  data: Record<string, number>;
}

interface Props {
  flows: FlowSlot[];
  plan?: { t: number; socPct: number; cls: string }[];
  capKwh?: number;
}

function londonHHMM(isoOrSpaced: string): string {
  const d = new Date(isoOrSpaced.replace(" ", "T"));
  return d.toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function SocChart({ flows, plan, capKwh = 9.2 }: Props) {
  // Build SOC history from flows (last 24h, field "soc" if present; else approximate from charge/discharge)
  const now = Date.now();
  const dayAgo = now - 864e5;

  const history: { label: string; soc: number; type: "history" }[] = [];
  const recent = flows
    .filter(s => {
      const t = new Date(s.start_time.replace(" ", "T")).getTime();
      return t >= dayAgo && t <= now;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Try to derive SOC from battery power (discharge = field 5, charge = field 4)
  // GivEnergy doesn't expose SOC directly in energy-flows; use net kWh relative to capacity
  // Just show charged/discharged kWh per slot as a proxy bar
  for (const slot of recent) {
    const d = slot.data;
    const net = (d["4"] || 0) - (d["5"] || 0); // charge positive, discharge negative
    history.push({
      label: londonHHMM(slot.start_time),
      soc: +((net / capKwh) * 100).toFixed(1),
      type: "history",
    });
  }

  // Today's plan projected SOC
  const futurePlan = (plan ?? [])
    .filter(p => p.t > now)
    .map(p => ({
      label: new Date(p.t).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false }),
      soc: p.socPct,
      cls: p.cls,
    }));

  const chartData = [
    ...history.map(h => ({ label: h.label, history: h.soc })),
    ...futurePlan.map(f => ({ label: f.label, projected: f.soc, cls: f.cls })),
  ];

  if (chartData.length === 0) return (
    <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data yet — check back once the brain has run a few ticks.</div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00b47a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00b47a" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis domain={[-50, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v, name) => [`${v}%`, name === "history" ? "Net battery %" : "Projected SOC"]} />
        <ReferenceLine y={0} stroke="#e5e7eb" />
        <Area type="monotone" dataKey="history" stroke="#00b47a" fill="url(#histGrad)" strokeWidth={2} dot={false} connectNulls />
        <Area type="monotone" dataKey="projected" stroke="#6366f1" fill="url(#projGrad)" strokeWidth={2} strokeDasharray="4 2" dot={false} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}
