import Link from "next/link";
import { APP_VERSION, APP_NAME } from "@/lib/version";

const CHANGELOG = [
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
