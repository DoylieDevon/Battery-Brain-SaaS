import Link from "next/link";
import { APP_VERSION, APP_NAME } from "@/lib/version";

const CHANGELOG = [
  {
    version: "0.2.5",
    date: "2026-06-22",
    title: "Private beta lockdown + trial clock",
    description:
      "Hum is invite-only for now — the signup page shows a friendly 'private beta' message, and any account not on the allowlist gets bounced before it can touch anything. A trial countdown banner now appears in the dashboard so you always know how many days are left before the free period ends. And if you're still in shadow mode, a new weekly card shows you exactly what Hum would have saved each day — daily charging cost vs. the cheapest available rate — so you can see the case for going active building up in real time.",
    changes: [
      "New: private beta mode — signup shows waitlist message, no new accounts can be created",
      "New: server-side email allowlist in middleware (ALLOWED_EMAILS env var) blocks any non-permitted accounts",
      "New: /beta page shown to non-allowlisted users who somehow get a session",
      "New: trial countdown banner in the dashboard layout — shows days remaining, turns urgent (amber) inside 7 days",
      "New: 'What Hum would have saved' card on the dashboard — 7-day shadow mode missed savings breakdown with bar chart",
      "Improved: missed savings calculation uses the actual cheapest rate available each day vs. what was paid",
    ],
  },
  {
    version: "0.2.4",
    date: "2026-06-20",
    title: "The dashboard grew up",
    description:
      "The original Battery Brain dashboard had more numbers than a spreadsheet — Hum's was a bit sparse by comparison. Fixed. You now get kWh totals for everything, a full savings breakdown showing what you spent charging vs what you avoided paying at peak, the brain's full decision reason, live weather with a note on how the temperature affects your battery, and 12 plan slots instead of 8.",
    changes: [
      "New: energy stats row — live W + kWh today for Battery, Grid, Home, and Solar",
      "New: savings breakdown — charge cost vs peak avoidance vs net saved",
      "New: brain decision card with full reason text and inverter schedule details",
      "New: live weather widget using Open-Meteo (no API key, uses your location)",
      "New: temperature effect note — warns if cold (<10°C) or very hot (>38°C) conditions will affect battery charging speed or capacity",
      "Improved: plan timeline now shows 12 half-hour slots instead of 8",
    ],
  },
  {
    version: "0.2.3",
    date: "2026-06-20",
    title: "The housekeeping release",
    description:
      "Three bugs stomped, a logo born, and the app finally looks like a grown-up product. Signup was invisible (white text, green background — oops), the GivEnergy verify call was being blocked by CORS, and onboarding refused to save because we forgot to tell Supabase whose data it was. Also: custom domain live, Google OAuth looking polished, and this very changelog you're reading.",
    changes: [
      "Fixed: signup page — white-on-green text replaced with readable dark-on-light layout",
      "Fixed: GivEnergy verify now routes server-side to avoid CORS block",
      "Fixed: onboarding RLS error — user_id now included in profile upsert",
      "New: Hum logo (SVG + PNG) at gethum.co.uk/hum-logo.png",
      "New: custom domain gethum.co.uk with automatic SSL",
      "New: Google OAuth consent screen shows 'Hum' with logo",
      "New: this changelog page",
      "New: Privacy Policy and Terms of Service pages",
      "New: persistent footer with privacy/terms links on all pages",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-06-20",
    title: "Hum. It has a name now.",
    description:
      "Battery Brain got a glow-up. Meet Hum — the same smart charging engine, wrapped in a design that actually feels like something you'd invite into your home. New brand, new fonts (Bricolage Grotesque, since you asked), a proper consumer-friendly landing page, and a dashboard that doesn't look like a spreadsheet on a bad day.",
    changes: [
      "Full rebrand to Hum — new name, new logo, new green",
      "Landing page redesign: hero with live plan card, savings band, feature tiles",
      "Dashboard redesigned: SOC ring, status card, vertical plan timeline",
      "New Savings page: weekly bar chart, best day callout, daily history list",
      "Settings page redesigned with toggle rows and Hum styling",
      "Login + signup pages redesigned with green gradient header",
      "New fonts: Bricolage Grotesque (display) + Hanken Grotesk (body)",
      "Hum colour tokens added: #0E2A24 dark, #0E9C7A green, #18C172 bright",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-06-19",
    title: "It begins. The battery has a brain.",
    description:
      "The first commit. The product exists. It doesn't do much yet, but the foundation is solid — landing page, email/Google login, onboarding wizard, and the core brain logic. Shadow mode by default: learning, watching, not touching anything.",
    changes: [
      "Landing page with feature rundown and pricing",
      "Email magic-link + Google OAuth login",
      "Onboarding wizard (GivEnergy + Octopus setup)",
      "Core brain engine: half-hourly forecast, cheap-window charging, top-up logic",
      "Shadow mode by default — 14-day learning period",
      "Live dashboard with GivEnergy data, plan table, savings tracker",
      "Stripe billing with 30-day free trial",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-body)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <Link href="/" className="text-sm text-[#0E9C7A] hover:underline font-medium">← Back to {APP_NAME}</Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "#0E2A24", letterSpacing: "-.03em", marginTop: 16, marginBottom: 8 }}>Changelog</h1>
          <p className="text-[#7C8A83]">What&apos;s changed, when, and why it matters.</p>
        </div>

        <div className="space-y-10">
          {CHANGELOG.map(entry => (
            <div key={entry.version} className="border-l-2 border-[#18C172] pl-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-mono font-bold text-[#0E9C7A]">v{entry.version}</span>
                <span className="text-sm text-[#9FB0A7]">{entry.date}</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "#0E2A24", marginBottom: 10 }}>{entry.title}</h2>
              <p className="text-[#51635C] mb-4 leading-relaxed text-sm">{entry.description}</p>
              <ul className="space-y-1.5">
                {entry.changes.map(c => (
                  <li key={c} className="flex items-start gap-2 text-sm text-[#51635C]">
                    <span className="text-[#18C172] font-bold mt-0.5 shrink-0">+</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[#EEF3F0] text-center text-sm text-[#9FB0A7]">
          <p>Built by humans. Typed by Claude.</p>
          <p className="mt-1" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#C2CFC8" }}>{APP_NAME} {APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
