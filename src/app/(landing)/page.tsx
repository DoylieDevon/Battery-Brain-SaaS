import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function HumLogo({ size = 32 }: { size?: number }) {
  const r = size * 0.44;
  return (
    <div
      style={{ width: size, height: size, borderRadius: size * 0.33, background: "linear-gradient(145deg, #18C172, #0E9C7A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(14,156,122,.35)" }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
        <path d="M5 13c0-4 3-7 7-7s7 3 7 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <path d={`M8.5 13c0-2 1.6-3.4 3.5-3.4S15.5 11 15.5 13`} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="13" r={r * 0.38} fill="#fff" />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#0E2A24]" style={{ fontFamily: "var(--font-body)" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#F7FAF8]/95 backdrop-blur border-b border-[#DDE7E1]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HumLogo size={32} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21, color: "#0E2A24", letterSpacing: "-.02em" }}>Hum</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-[#51635C] hover:text-[#0E2A24] transition-colors">How it works</a>
            <a href="#savings" className="text-sm font-medium text-[#51635C] hover:text-[#0E2A24] transition-colors">Savings</a>
            <a href="#compatibility" className="text-sm font-medium text-[#51635C] hover:text-[#0E2A24] transition-colors">Compatibility</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-[#0E2A24] hover:text-[#0E9C7A] transition-colors">Log in</Link>
            <Link href="/signup" className={cn(buttonVariants(), "rounded-full bg-[#0E2A24] hover:bg-[#103D31] text-white text-sm font-semibold px-5")}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#E4F6EC] rounded-full px-3.5 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18C172]" />
              <span className="text-xs font-semibold text-[#0E9C7A]">For GivEnergy batteries on Octopus · UK only</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(40px, 5vw, 58px)", lineHeight: 1.02, letterSpacing: "-.035em", color: "#0E2A24", marginBottom: 20 }}>
              Your home battery,<br />on autopilot.
            </h1>
            <p className="text-lg leading-relaxed text-[#51635C] max-w-md mb-8">
              Hum quietly charges your battery when power is cheapest, then runs your home through the expensive evening peak. You save money every day — without lifting a finger.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "rounded-full text-white font-semibold px-7 text-base")} style={{ background: "linear-gradient(145deg, #18C172, #0E9C7A)", boxShadow: "0 8px 20px rgba(14,156,122,.32)" }}>
                Connect my battery
              </Link>
              <a href="#how-it-works" className="text-base font-semibold text-[#0E2A24] flex items-center gap-2 hover:text-[#0E9C7A] transition-colors">
                See a live day
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
            <div className="flex items-center gap-5">
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "#0E2A24" }}>£17<span style={{ fontSize: 17 }}>/wk</span></div>
                <div className="text-xs text-[#8A988F]">typical saving</div>
              </div>
              <div className="w-px h-9 bg-[#DDE7E1]" />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "#0E2A24" }}>0</div>
                <div className="text-xs text-[#8A988F]">settings to fiddle with</div>
              </div>
            </div>
          </div>

          {/* Hero card — Today's plan */}
          <div className="bg-white rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0E2A24" }}>Today&apos;s plan</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E9C7A] bg-[#E4F6EC] px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18C172] animate-pulse" />
                Live
              </span>
            </div>
            <svg viewBox="0 0 480 200" className="w-full h-auto mb-4 block">
              <defs>
                <linearGradient id="socfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#18C172" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#18C172" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect x="0" y="8" width="480" height="158" rx="12" fill="#F4F7F5" />
              <rect x="80" y="8" width="60" height="158" fill="#D8F1E1" />
              <rect x="260" y="8" width="60" height="158" fill="#D8F1E1" />
              <rect x="440" y="8" width="40" height="158" fill="#D8F1E1" />
              <rect x="320" y="8" width="60" height="158" fill="#FFE0D6" />
              <path d="M0 124 L80 126 L140 56 L200 82 L260 99 L320 24 L340 53 L360 85 L380 111 L420 137 L440 137 L480 99 L480 166 L0 166 Z" fill="url(#socfill)" />
              <path d="M0 124 L80 126 L140 56 L200 82 L260 99 L320 24 L340 53 L360 85 L380 111 L420 137 L440 137 L480 99" fill="none" stroke="#0E9C7A" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx="320" cy="24" r="5" fill="#0E9C7A" stroke="#fff" strokeWidth="2.5" />
              <text x="348" y="22" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#0E9C7A">100% by 4pm</text>
              <text x="0" y="186" fontFamily="inherit" fontSize="11" fill="#9FB0A7">12am</text>
              <text x="218" y="186" fontFamily="inherit" fontSize="11" fill="#9FB0A7">noon</text>
              <text x="333" y="186" fontFamily="inherit" fontSize="11" fontWeight="700" fill="#D86A4A">peak</text>
              <text x="446" y="186" fontFamily="inherit" fontSize="11" fill="#9FB0A7">12am</text>
            </svg>
            <div className="flex gap-4 mb-5">
              <span className="flex items-center gap-1.5 text-xs text-[#6B7A73]"><span className="w-2.5 h-2.5 rounded-sm bg-[#D8F1E1]" />Cheap power</span>
              <span className="flex items-center gap-1.5 text-xs text-[#6B7A73]"><span className="w-2.5 h-2.5 rounded-sm bg-[#FFE0D6]" />Pricey peak</span>
            </div>
            <div className="bg-[#F2FBF6] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#18C172] flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="#fff" /></svg>
              </div>
              <div>
                <div className="font-bold text-sm text-[#0E2A24]">You&apos;re covered until ~9pm tonight</div>
                <div className="text-xs text-[#6B7A73] mt-0.5">Charged on cheap power. Zero from the grid at peak.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#0E9C7A]">How it works</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, letterSpacing: "-.03em", color: "#0E2A24", marginTop: 10 }}>Set it once. Save every day.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "STEP 1",
                title: "Connect in 2 minutes",
                body: "Sign in to your GivEnergy and Octopus accounts. No installer, no wiring — Hum talks to them for you.",
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M9 7 4 12l5 5M15 7l5 5-5 5" stroke="#0E9C7A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
              },
              {
                step: "STEP 2",
                title: "Hum learns your home",
                body: "It studies your usage and tomorrow's Octopus prices, then plans the perfect charge — full before peak, every time.",
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="6.5" stroke="#0E9C7A" strokeWidth="2.2" /><path d="M12 7V4M5 12H3M21 12h-2" stroke="#0E9C7A" strokeWidth="2.2" strokeLinecap="round" /><path d="M12 10v3l2 1" stroke="#0E9C7A" strokeWidth="2.2" strokeLinecap="round" /></svg>,
              },
              {
                step: "STEP 3",
                title: "Relax — you're covered",
                body: "Run on your own stored power through the pricey evening. Check in anytime to see what you saved.",
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" fill="#0E9C7A" /></svg>,
              },
            ].map(({ step, title, body, icon }) => (
              <div key={step} className="bg-[#F7FAF8] rounded-3xl p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#E4F6EC] flex items-center justify-center mb-5">{icon}</div>
                <div className="text-xs font-bold text-[#0E9C7A] mb-1.5">{step}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "#0E2A24", marginBottom: 8 }}>{title}</h3>
                <p className="text-sm leading-relaxed text-[#51635C]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Savings band */}
      <section id="savings" style={{ background: "linear-gradient(160deg, #0E2A24, #103D31)" }} className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#6FE3A8]">The payoff</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, letterSpacing: "-.03em", color: "#fff", margin: "10px 0 16px", lineHeight: 1.08 }}>Never pay peak prices again.</h2>
              <p className="text-base leading-relaxed text-[#B7CABF] mb-7">A fully-cycled battery on the Octopus Cosy tariff is worth up to <b className="text-white">£2.80 a day</b>. Hum makes sure none of that value is left on the table.</p>
              <div className="flex gap-8">
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "#fff" }}>£17.40</div>
                  <div className="text-xs text-[#8FA89B]">saved this week</div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "#fff" }}>6/7</div>
                  <div className="text-xs text-[#8FA89B]">days fully covered</div>
                </div>
              </div>
            </div>
            <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-7">
              <div className="flex items-end justify-between h-36 gap-3 mb-4">
                {[78, 118, 92, 104, 70, 60, 88].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full rounded-lg" style={{ height: h, background: "#4FD597" }} />
                    <span className="text-xs text-[#8FA89B]">{["M","T","W","T","F","S","S"][i]}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3.5 text-xs text-[#8FA89B]">Daily savings · last 7 days</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="compatibility" className="bg-[#F7FAF8] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Thinks ahead", body: "Reads tomorrow's prices and tops up early if a cheap window won't be enough.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3a5 5 0 0 0-5 5c0 1.5.7 2.4 1.2 3 .5.7.8 1.2.8 2.5h6c0-1.3.3-1.8.8-2.5.5-.6 1.2-1.5 1.2-3a5 5 0 0 0-5-5Z" stroke="#0E9C7A" strokeWidth="1.8" strokeLinejoin="round" /><path d="M10 19h4M10.5 21.5h3" stroke="#0E9C7A" strokeWidth="1.8" strokeLinecap="round" /></svg> },
              { title: "Peak protection", body: "Holds your charge for the 4–7pm window so you never import at the top rate.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4-7-10V6l7-3 7 3v5c0 6-7 10-7 10Z" stroke="#0E9C7A" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 11.5l2 2 4-4.5" stroke="#0E9C7A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> },
              { title: "Friendly nudges", body: "A gentle heads-up if your battery ever goes quiet — in plain English, not error codes.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1Z" stroke="#0E9C7A" strokeWidth="1.8" strokeLinejoin="round" /></svg> },
              { title: "No guesswork", body: "See exactly what Hum did and what it saved — every single day, in pounds.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 13a8 8 0 0 1 16 0" stroke="#0E9C7A" strokeWidth="1.8" strokeLinecap="round" /><path d="M12 13l4-2.5" stroke="#0E9C7A" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="13" r="1.5" fill="#0E9C7A" /><path d="M4 17h16" stroke="#0E9C7A" strokeWidth="1.8" strokeLinecap="round" /></svg> },
            ].map(({ title, body, icon }) => (
              <div key={title} className="bg-white border border-[#EAF1ED] rounded-2xl p-6">
                <div className="w-11 h-11 rounded-xl bg-[#E4F6EC] flex items-center justify-center mb-4">{icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0E2A24", marginBottom: 6 }}>{title}</h3>
                <p className="text-sm leading-relaxed text-[#6B7A73]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 text-center border-t border-[#EEF3F0]">
        <div className="max-w-xl mx-auto px-6">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 40, letterSpacing: "-.03em", color: "#0E2A24", marginBottom: 14 }}>Put your battery to work.</h2>
          <p className="text-base text-[#51635C] mb-8">Free to try. Connects in two minutes. Cancel anytime.</p>
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "rounded-full text-white font-semibold px-8 text-base")} style={{ background: "linear-gradient(145deg, #18C172, #0E9C7A)", boxShadow: "0 8px 20px rgba(14,156,122,.32)" }}>
            Connect my battery
          </Link>
          <p className="text-sm text-[#9FB0A7] mt-5">30-day free trial · £4.99/month after · Cancel any time</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EEF3F0] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#9FB0A7]">
          <div className="flex items-center gap-2">
            <HumLogo size={22} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#C2CFC8" }}>Hum</span>
          </div>
          <span>© 2026 · Works with GivEnergy + Octopus · UK only</span>
          <span>Built by humans. Typed by Claude.</span>
        </div>
      </footer>
    </div>
  );
}
