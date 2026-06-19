"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BATTERY_MODELS = [
  { id: "GIV-AC-3.0", label: "GIV-AC-3.0 (9.5 kWh)", cap: 9.2 },
  { id: "GIV-AC-5.0", label: "GIV-AC-5.0 (13.5 kWh)", cap: 13.2 },
];

const DNO_REGIONS = [
  { id: "A", label: "A — East England" }, { id: "B", label: "B — East Midlands" },
  { id: "C", label: "C — London" }, { id: "D", label: "D — North Wales & Mersey" },
  { id: "E", label: "E — West Midlands" }, { id: "F", label: "F — North East England" },
  { id: "G", label: "G — North West England" }, { id: "H", label: "H — Southern England" },
  { id: "J", label: "J — South East England" }, { id: "K", label: "K — South West England" },
  { id: "L", label: "L — South England" }, { id: "M", label: "M — Yorkshire" },
  { id: "N", label: "N — South Scotland" }, { id: "P", label: "P — North Scotland" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ ge_serial: "", octopus_region: "L", battery_model: "GIV-AC-3.0", has_solar: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setProfile(data);
        setForm({
          ge_serial: data.ge_serial ?? "",
          octopus_region: data.octopus_region ?? "L",
          battery_model: data.battery_model ?? "GIV-AC-3.0",
          has_solar: data.has_solar ?? false,
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const model = BATTERY_MODELS.find(m => m.id === form.battery_model)!;
    const { error } = await supabase.from("user_profiles").update({
      ge_serial: form.ge_serial,
      octopus_region: form.octopus_region,
      battery_model: form.battery_model,
      cap_kwh: model.cap,
      has_solar: form.has_solar,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
    if (error) setError(error.message);
    else setSaved(true);
    setSaving(false);
  }

  async function switchMode(to: "shadow" | "active") {
    setSwitching(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_profiles").update({ mode: to, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    if (error) setError(error.message);
    else setProfile(p => p ? { ...p, mode: to } : p);
    setSwitching(false);
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;

  const mode = (profile?.mode as string) ?? "shadow";
  const onboardedAt = profile?.onboarded_at ? new Date(profile.onboarded_at as string) : null;
  const daysSince = onboardedAt ? Math.floor((Date.now() - onboardedAt.getTime()) / 864e5) : 0;
  const readyForActive = daysSince >= 14;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Update your inverter and tariff configuration.</p>
      </div>

      {/* Mode switcher */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Control mode</CardTitle>
            <Badge className={mode === "active" ? "bg-green-100 text-green-800 border border-green-200" : "bg-amber-100 text-amber-800 border border-amber-200"}>
              {mode === "active" ? "Active" : "Shadow"}
            </Badge>
          </div>
          <CardDescription>
            {mode === "shadow"
              ? "Battery Brain is watching but not controlling your inverter."
              : "Battery Brain is actively programming your charge schedule every 30 minutes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "shadow" ? (
            <div className="space-y-3">
              {!readyForActive && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {daysSince < 14
                    ? `Shadow mode has been running for ${daysSince} day${daysSince !== 1 ? "s" : ""}. The brain recommends at least 14 days of data before switching to active — ${14 - daysSince} more to go.`
                    : "Shadow mode has enough data to switch."}
                </p>
              )}
              <Button
                className="bg-[#00b47a] hover:bg-[#009e6c] text-white w-full"
                onClick={() => switchMode("active")}
                disabled={switching}
              >
                {switching ? "Switching…" : readyForActive ? "Switch to active mode" : "Switch anyway (not recommended)"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => switchMode("shadow")} disabled={switching}>
              {switching ? "Switching…" : "Switch back to shadow mode"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Inverter settings */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inverter &amp; tariff</CardTitle>
          <CardDescription>These are read-only fields — to change your API key, contact support.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Inverter serial</Label>
              <Input value={form.ge_serial} onChange={e => setForm(f => ({ ...f, ge_serial: e.target.value.toUpperCase() }))} placeholder="CE2240G646" />
            </div>
            <div className="space-y-1.5">
              <Label>DNO region</Label>
              <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.octopus_region} onChange={e => setForm(f => ({ ...f, octopus_region: e.target.value }))}>
                {DNO_REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Battery model</Label>
              <div className="space-y-2">
                {BATTERY_MODELS.map(m => (
                  <button key={m.id} type="button" onClick={() => setForm(f => ({ ...f, battery_model: m.id }))}
                    className={`w-full p-2.5 rounded-lg border text-sm font-medium text-left transition-colors ${form.battery_model === m.id ? "border-[#00b47a] bg-[#f0fdf4] text-[#166534]" : "border-gray-200 hover:border-gray-300"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input id="solar" type="checkbox" checked={form.has_solar} onChange={e => setForm(f => ({ ...f, has_solar: e.target.checked }))} className="w-4 h-4 accent-[#00b47a]" />
              <Label htmlFor="solar">I have solar panels</Label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-green-600">Saved ✓</p>}
            <Button type="submit" className="w-full bg-[#00b47a] hover:bg-[#009e6c] text-white" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
