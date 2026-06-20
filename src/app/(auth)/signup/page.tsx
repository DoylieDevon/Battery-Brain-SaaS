"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "pin";

function GreenButton({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-60 transition-opacity"
      style={{ background: "linear-gradient(145deg, #18C172, #0E9C7A)", boxShadow: "0 8px 18px rgba(14,156,122,.28)" }}>
      {children}
    </button>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function sendPin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) { setError(error.message); setLoading(false); return; }
    setStep("pin");
    setLoading(false);
  }

  async function verifyPin(e: React.FormEvent) {
    e.preventDefault();
    const pin = (e.currentTarget as HTMLFormElement).pin.value;
    setLoading(true); setError("");
    const { error } = await supabase.auth.verifyOtp({ email, token: pin, type: "email" });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = "/onboarding";
  }

  async function signUpWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "linear-gradient(170deg, #0E9C7A 0%, #11A877 28%, #F7FAF8 28%, #F7FAF8 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Header on green */}
        <div className="text-center mb-8 text-white px-4">
          <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255,255,255,.16)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M5 13c0-4 3-7 7-7s7 3 7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M8.5 13c0-2 1.6-3.4 3.5-3.4S15.5 11 15.5 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="13" r="1.5" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, letterSpacing: "-.02em" }}>Hum</div>
          <p className="text-sm opacity-90 mt-1">Your home battery, on autopilot.</p>
        </div>

        {/* Sheet */}
        <div className="bg-white rounded-3xl p-7 shadow-2xl">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "#0E2A24", marginBottom: 4 }}>
            {step === "email" ? "Get started free" : "Check your email"}
          </h2>
          <p className="text-sm text-[#7C8A83] mb-6">
            {step === "email" ? "No password needed — we'll email you a code." : `We sent a 6-digit code to ${email}.`}
          </p>

          {step === "email" ? (
            <>
              <form onSubmit={sendPin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6B63] block mb-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@home.co.uk"
                    className="w-full bg-[#F4F8F5] border border-[#E5EDE8] rounded-2xl px-4 py-4 text-sm text-[#0E2A24] placeholder:text-[#B6C2BB] outline-none focus:border-[#18C172] transition-colors" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <GreenButton type="submit" disabled={loading}>{loading ? "Sending…" : "Get started free"}</GreenButton>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#E5EDE8]" />
                <span className="text-xs text-[#B6C2BB]">or</span>
                <div className="flex-1 h-px bg-[#E5EDE8]" />
              </div>

              <button onClick={signUpWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-[#F4F8F5] border border-[#E5EDE8] rounded-2xl py-3.5 text-sm font-semibold text-[#0E2A24] hover:bg-[#EEF3F0] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Continue with Google
              </button>

              <p className="text-xs text-center text-[#9FB0A7] mt-5">
                No credit card needed for first 30 days. £4.99/mo after.
              </p>
            </>
          ) : (
            <form onSubmit={verifyPin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#5A6B63] block mb-2">6-digit code</label>
                <input name="pin" type="text" inputMode="numeric" maxLength={6} placeholder="123456" required
                  className="w-full bg-[#F4F8F5] border border-[#E5EDE8] rounded-2xl px-4 py-4 text-xl tracking-widest text-center text-[#0E2A24] placeholder:text-[#B6C2BB] outline-none focus:border-[#18C172] transition-colors" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <GreenButton type="submit" disabled={loading}>{loading ? "Verifying…" : "Create account"}</GreenButton>
              <button type="button" onClick={() => { setStep("email"); setError(""); }}
                className="w-full text-sm text-[#7C8A83] hover:text-[#51635C] transition-colors">
                ← Different email
              </button>
            </form>
          )}

          <p className="text-center text-sm text-[#7C8A83] mt-6">
            Already have an account? <Link href="/login" className="text-[#0E9C7A] font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
