import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: "🧠",
    title: "Learns your home",
    body: "Watches your actual usage for 14 days before touching anything. Builds a half-hourly consumption and solar profile unique to you.",
  },
  {
    icon: "⚡",
    title: "Charges at the right time",
    body: "Automatically fills your battery in cheap Octopus windows. If they won't be enough, it tops up at standard rate before you hit the peak.",
  },
  {
    icon: "☀️",
    title: "Solar-aware",
    body: "Knows how much your panels typically generate each half-hour. Won't waste a cheap-rate charge slot that solar is already covering.",
  },
  {
    icon: "📊",
    title: "Shows your savings",
    body: "Every pound saved vs importing at peak is tracked. You see exactly what the battery earns you — charge cost, value delivered, net per day.",
  },
  {
    icon: "🔒",
    title: "Safe by design",
    body: "Starts in shadow mode. You approve the switch to active control. If the GivEnergy API goes down, registers stay as-is — it never leaves you stranded.",
  },
  {
    icon: "🔌",
    title: "GivEnergy AC range",
    body: "Built specifically for GIV-AC-3.0 and GIV-AC-5.0 on Octopus Cosy or Go. No generic support, no fudged assumptions — it knows your inverter.",
  },
];

const STEPS = [
  { n: "1", title: "Connect", body: "Paste in your GivEnergy API key and Octopus account details. We auto-detect your inverter model, battery size, and tariff region." },
  { n: "2", title: "Learn (14 days)", body: "Battery Brain watches in shadow mode — monitoring your usage and solar generation without touching the inverter. You see exactly what it would do." },
  { n: "3", title: "Take over", body: "After 14 days, one click switches to active mode. Battery Brain programmes your charge schedule every 30 minutes, around the clock." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00b47a] flex items-center justify-center text-white text-sm font-bold">⚡</div>
            <span className="font-bold text-base tracking-tight">Battery Brain</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Sign in</Link>
            <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "bg-[#00b47a] hover:bg-[#009e6c] text-white")}>
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="mb-6 bg-[#f0fdf4] text-[#166534] border-[#bbf7d0] hover:bg-[#f0fdf4]">
          GivEnergy · Octopus Cosy &amp; Go · UK only
        </Badge>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-5">
          Your battery.<br className="hidden sm:block" /> Finally working for you.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Battery Brain learns your home, then automatically charges your GivEnergy battery at the cheapest possible times — so you&apos;re always full before Octopus peak rates kick in.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "bg-[#00b47a] hover:bg-[#009e6c] text-white text-base px-8")}>
            Start your free month
          </Link>
          <Link href="#how-it-works" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "text-base px-8")}>
            See how it works
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">No credit card needed for the first 30 days.</p>
      </section>

      <Separator className="max-w-5xl mx-auto" />

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map(s => (
            <div key={s.n} className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#00b47a] text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">{s.n}</div>
              <h3 className="font-semibold text-base mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="max-w-5xl mx-auto" />

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Everything WonderWatt doesn&apos;t do</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <Card key={f.title} className="border-gray-100 shadow-sm">
              <CardContent className="pt-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="max-w-5xl mx-auto" />

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Simple pricing</h2>
        <p className="text-gray-500 mb-10">One plan. Everything included. Pays for itself in a few days of peak savings.</p>
        <div className="max-w-sm mx-auto">
          <Card className="border-[#00b47a] border-2 shadow-md">
            <CardContent className="pt-8 pb-8">
              <div className="text-5xl font-extrabold tracking-tight mb-1">£4.99</div>
              <div className="text-gray-500 text-sm mb-6">per month · cancel any time</div>
              <ul className="text-sm text-left space-y-2 mb-8 text-gray-600">
                {[
                  "30-day free trial, no card required",
                  "Full dashboard with savings tracking",
                  "14-day learning period",
                  "Active inverter control (Cosy & Go)",
                  "Solar-aware charging",
                  "Half-hourly brain ticks, 24/7",
                  "Alerts when something goes wrong",
                ].map(l => (
                  <li key={l} className="flex items-start gap-2">
                    <span className="text-[#00b47a] font-bold mt-0.5">✓</span>{l}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "w-full bg-[#00b47a] hover:bg-[#009e6c] text-white block text-center")}>
                Start free — no card needed
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-[#00b47a] font-bold">⚡</span>
            <span>Battery Brain</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
          </div>
          <span>Built by humans. Typed by Claude.</span>
        </div>
      </footer>
    </div>
  );
}

