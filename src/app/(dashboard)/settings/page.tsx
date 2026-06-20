"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold tracking-widest uppercase text-[#9FB0A7] mb-2.5 px-1">{title}</div>
      <div className="bg-white border border-[#EAF1ED] rounded-2xl overflow-hidden">{children}</div>
    </div>
  );
}

function Row({ label, sub, right, borderBottom = true }: { label: string; sub?: string; right: React.ReactNode; borderBottom?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${borderBottom ? "border-b border-[#F0F4F1]" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#0E2A24]">{label}</div>
        {sub && <div className="text-xs text-[#7C8A83] mt-0.5">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className="relative shrink-0 w-11 h-6 rounded-full transition-colors"
      style={{ background: on ? "#18C172" : "#DDE7E1" }}>
      <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: on ? "calc(100% - 22px)" : 2 }} />
    </button>
  );
}

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
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#18C172] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const mode = (profile?.mode as string) ?? "shadow";
  const onboardedAt = profile?.onboarded_at ? new Date(profile.onboarded_at as string) : null;
  const daysSince = onboardedAt ? Math.floor((Date.now() - onboardedAt.getTime()) / 864e5) : 0;
  const readyForActive = daysSince >= 14;

  return (
    <div className="space-y-5 max-w-lg">
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "#0E2A24", letterSpacing: "-.02em" }}>Settings</h1>

      {error && <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-800">{error}</div>}

      {/* How Hum runs */}
      <Section title="How Hum runs">
        <Row
          label="Autopilot"
          sub="Let Hum manage your charging"
          right={<Toggle on={mode === "active"} onChange={() => switching ? null : switchMode(mode === "active" ? "shadow" : "active")} />}
        />
        <Row
          label="Comfort buffer"
          sub="Keep a little extra for cold snaps"
          right={<span className="text-xs font-bold text-[#0E9C7A] bg-[#E4F6EC] px-3 py-1.5 rounded-full">Balanced ›</span>}
          borderBottom={false}
        />
      </Section>

      {!readyForActive && mode === "shadow" && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          Shadow mode has been running for {daysSince} day{daysSince !== 1 ? "s" : ""}. Hum recommends at least 14 days before switching to autopilot — {Math.max(0, 14 - daysSince)} more to go.
        </div>
      )}

      {/* Connections */}
      <Section title="Connections">
        <Row
          label="GivEnergy"
          sub="Battery & inverter"
          right={
            <span className="flex items-center gap-1.5 text-xs text-[#7C8A83] font-medium">
              <span className="w-2 h-2 rounded-full" style={{ background: profile?.ge_serial ? "#18C172" : "#DDE7E1" }} />
              {profile?.ge_serial ? "Connected" : "Not set"}
              <span className="text-[#C2CFC8]">›</span>
            </span>
          }
        />
        <Row
          label={`Octopus · ${form.octopus_region}`}
          sub="Tariff & prices"
          right={
            <span className="flex items-center gap-1.5 text-xs text-[#7C8A83] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#18C172]" />
              Connected <span className="text-[#C2CFC8]">›</span>
            </span>
          }
          borderBottom={false}
        />
      </Section>

      {/* Config form */}
      <form onSubmit={save}>
        <Section title="Inverter & tariff">
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#5A6B63] block mb-2">Inverter serial</label>
              <input
                value={form.ge_serial}
                onChange={e => setForm(f => ({ ...f, ge_serial: e.target.value.toUpperCase() }))}
                placeholder="CE2240G646"
                className="w-full bg-[#F4F8F5] border border-[#E5EDE8] rounded-xl px-4 py-3 text-sm text-[#0E2A24] placeholder:text-[#B6C2BB] outline-none focus:border-[#18C172] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6B63] block mb-2">DNO region</label>
              <select
                value={form.octopus_region}
                onChange={e => setForm(f => ({ ...f, octopus_region: e.target.value }))}
                className="w-full bg-[#F4F8F5] border border-[#E5EDE8] rounded-xl px-4 py-3 text-sm text-[#0E2A24] outline-none focus:border-[#18C172] transition-colors"
              >
                {DNO_REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6B63] block mb-2">Battery model</label>
              <div className="space-y-2">
                {BATTERY_MODELS.map(m => (
                  <button key={m.id} type="button" onClick={() => setForm(f => ({ ...f, battery_model: m.id }))}
                    className="w-full p-3 rounded-xl border text-sm font-medium text-left transition-colors"
                    style={{
                      borderColor: form.battery_model === m.id ? "#18C172" : "#E5EDE8",
                      background: form.battery_model === m.id ? "#EAF6EF" : "#F4F8F5",
                      color: form.battery_model === m.id ? "#0E6645" : "#51635C",
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.has_solar} onChange={e => setForm(f => ({ ...f, has_solar: e.target.checked }))}
                className="w-4 h-4 accent-[#18C172]" />
              <span className="text-sm font-semibold text-[#0E2A24]">I have solar panels</span>
            </label>

            {saved && (
              <div className="flex items-center gap-2 text-sm text-[#0E9C7A] font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#18C172" /><path d="m8 12 3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Saved
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(145deg, #18C172, #0E9C7A)" }}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </Section>
      </form>
    </div>
  );
}
