"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const STEPS = ["GivEnergy", "Octopus", "Inverter", "Done"];

const OCTOPUS_TARIFFS = [
  { id: "COSY", label: "Cosy Octopus" },
  { id: "GO", label: "Octopus Go" },
];

const BATTERY_MODELS = [
  { id: "GIV-AC-3.0", label: "GIV-AC-3.0 (9.5 kWh)", cap: 9.2 },
  { id: "GIV-AC-5.0", label: "GIV-AC-5.0 (13.5 kWh)", cap: 13.2 },
];

const DNO_REGIONS = [
  { id: "A", label: "A — East England" },
  { id: "B", label: "B — East Midlands" },
  { id: "C", label: "C — London" },
  { id: "D", label: "D — North Wales & Mersey" },
  { id: "E", label: "E — West Midlands" },
  { id: "F", label: "F — North East England" },
  { id: "G", label: "G — North West England" },
  { id: "H", label: "H — Southern England" },
  { id: "J", label: "J — South East England" },
  { id: "K", label: "K — South West England" },
  { id: "L", label: "L — South England" },
  { id: "M", label: "M — Yorkshire" },
  { id: "N", label: "N — South Scotland" },
  { id: "P", label: "P — North Scotland" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    geToken: "",
    geSerial: "",
    octopusProduct: "",
    octopusRegion: "L",
    batteryModel: "GIV-AC-3.0",
    hasSolar: false,
  });

  const supabase = createClient();

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function detectInverter() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/verify-ge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: form.geToken, serial: form.geSerial }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Could not connect — check your API key and inverter serial.");
      setStep(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection failed");
    }
    setLoading(false);
  }

  async function save() {
    setLoading(true); setError("");
    const model = BATTERY_MODELS.find(m => m.id === form.batteryModel)!;

    const octopusTariff = form.octopusProduct === "COSY"
      ? "COSY-FIX-12M-26-03-23"
      : "GO-VAR-22-10-14";

    const { error } = await supabase.from("user_profiles").upsert({
      ge_token: form.geToken,
      ge_serial: form.geSerial,
      octopus_product: octopusTariff,
      octopus_region: form.octopusRegion,
      battery_model: form.batteryModel,
      cap_kwh: model.cap,
      reserve_kwh: 0.4,
      chg_half_kwh: 1.4,
      has_solar: form.hasSolar,
      mode: "shadow",
      onboarded_at: new Date().toISOString(),
    });

    if (error) { setError(error.message); setLoading(false); return; }
    setStep(3);
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? "bg-[#00b47a] text-white" : "bg-gray-200 text-gray-400"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-sm ${i === step ? "font-semibold" : "text-gray-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect your GivEnergy inverter</CardTitle>
            <CardDescription>You need a GivEnergy cloud account with API access enabled. Find your API key at portal.givenergy.cloud → Settings → API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>GivEnergy API key</Label>
              <Input type="password" placeholder="Bearer token from GivEnergy portal" value={form.geToken} onChange={e => set("geToken", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Inverter serial number</Label>
              <Input placeholder="e.g. CE2240G646" value={form.geSerial} onChange={e => set("geSerial", e.target.value.toUpperCase())} />
              <p className="text-xs text-gray-400">Found on the sticker on your inverter or in the GivEnergy app.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full bg-[#00b47a] hover:bg-[#009e6c] text-white" onClick={detectInverter} disabled={loading || !form.geToken || !form.geSerial}>
              {loading ? "Connecting…" : "Connect & verify →"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Octopus tariff</CardTitle>
            <CardDescription>Battery Brain needs your tariff to know when cheap and peak windows are. Cosy Octopus and Octopus Go are supported.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tariff</Label>
              <div className="grid grid-cols-2 gap-3">
                {OCTOPUS_TARIFFS.map(t => (
                  <button key={t.id} type="button" onClick={() => set("octopusProduct", t.id)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${form.octopusProduct === t.id ? "border-[#00b47a] bg-[#f0fdf4] text-[#166534]" : "border-gray-200 hover:border-gray-300"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>DNO region</Label>
              <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.octopusRegion} onChange={e => set("octopusRegion", e.target.value)}>
                {DNO_REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <p className="text-xs text-gray-400">This affects the exact pence-per-kWh rates. Check Octopus app → Meter details if unsure.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full bg-[#00b47a] hover:bg-[#009e6c] text-white" onClick={() => setStep(2)} disabled={!form.octopusProduct}>
              Next →
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Your battery setup</CardTitle>
            <CardDescription>A couple of details about your system so Brain can size things correctly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Battery model</Label>
              <div className="space-y-2">
                {BATTERY_MODELS.map(m => (
                  <button key={m.id} type="button" onClick={() => set("batteryModel", m.id)}
                    className={`w-full p-3 rounded-lg border text-sm font-medium text-left transition-colors ${form.batteryModel === m.id ? "border-[#00b47a] bg-[#f0fdf4] text-[#166534]" : "border-gray-200 hover:border-gray-300"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input id="solar" type="checkbox" checked={form.hasSolar} onChange={e => set("hasSolar", e.target.checked)} className="w-4 h-4 accent-[#00b47a]" />
              <Label htmlFor="solar">I have solar panels</Label>
            </div>
            <p className="text-xs text-gray-400">Solar-aware mode uses your 14-day generation history to avoid over-charging on sunny days.</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full bg-[#00b47a] hover:bg-[#009e6c] text-white" onClick={save} disabled={loading}>
              {loading ? "Saving…" : "Start learning my battery →"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>You&apos;re all set!</CardTitle>
            <CardDescription>Battery Brain is now watching your usage in shadow mode.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] p-4 text-sm text-[#166534]">
              <p className="font-semibold mb-2">What happens next</p>
              <ul className="space-y-1.5">
                <li>✓ Brain runs every 30 minutes, 24/7</li>
                <li>✓ It builds a profile of your home&apos;s usage over 14 days</li>
                <li>✓ Your dashboard shows what it would do — but it won&apos;t touch anything yet</li>
                <li>✓ After 14 days, you can switch to active mode with one click</li>
              </ul>
            </div>
            <a href="/dashboard" className={cn(buttonVariants(), "w-full bg-[#00b47a] hover:bg-[#009e6c] text-white justify-center")}>
              Go to my dashboard →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
