import Link from "next/link";
import { APP_VERSION, APP_NAME } from "@/lib/version";

const CHANGELOG = [
  {
    version: "0.1.0",
    date: "2026-06-19",
    title: "It begins. The battery has a brain.",
    description:
      "The first commit. The product exists. It doesn't do much yet, but the foundation is solid — landing page, email/Google login, onboarding wizard skeleton, and the core brain logic ported from the original single-page proof of concept. We're in shadow mode for now: learning, watching, not touching anything.",
    changes: [
      "Landing page with full feature rundown and pricing",
      "Email magic-link + Google OAuth login",
      "New account onboarding wizard (GivEnergy + Octopus setup)",
      "Core brain engine: half-hourly consumption forecast, cheap-window charging, top-up logic, solar awareness",
      "Shadow mode by default — 14-day learning period before active control",
      "Dashboard placeholder (real data coming in the next release)",
      "Changelog. Obviously.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <Link href="/" className="text-sm text-[#00b47a] hover:underline">← Back to {APP_NAME}</Link>
          <h1 className="text-3xl font-extrabold mt-4 mb-2">Changelog</h1>
          <p className="text-gray-500">What&apos;s changed, when, and why it matters.</p>
        </div>

        <div className="space-y-10">
          {CHANGELOG.map(entry => (
            <div key={entry.version} className="border-l-2 border-[#00b47a] pl-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-mono text-lg font-bold">v{entry.version}</span>
                <span className="text-sm text-gray-400">{entry.date}</span>
              </div>
              <h2 className="text-xl font-semibold mb-3">{entry.title}</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">{entry.description}</p>
              <ul className="space-y-1.5">
                {entry.changes.map(c => (
                  <li key={c} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-[#00b47a] font-bold mt-0.5 shrink-0">+</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
          <p>Built by humans. Typed by Claude.</p>
          <p className="mt-1">{APP_NAME} {APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
