import Link from "next/link";

export const metadata = { title: "Privacy Policy — Hum" };

const UPDATED = "20 June 2026";
const EMAIL = "hello@gethum.co.uk";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F7FAF8" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[#0E9C7A] font-semibold hover:underline">← Back to Hum</Link>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "#0E2A24", marginTop: 32, marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-[#9FB0A7] mb-10">Last updated: {UPDATED}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[#51635C]">

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Who we are</h2>
            <p>Hum is a home battery optimisation service operated by Zero Fluff Ltd, registered in England and Wales. Our service is available at <strong>gethum.co.uk</strong>. If you have questions about this policy, email us at <a href={`mailto:${EMAIL}`} className="text-[#0E9C7A]">{EMAIL}</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">What data we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account data:</strong> your email address, collected when you sign up or sign in via Google.</li>
              <li><strong>Inverter configuration:</strong> your GivEnergy API token, inverter serial number, Octopus Energy tariff, and battery capacity. You provide these during onboarding.</li>
              <li><strong>Battery telemetry:</strong> state of charge, charge/discharge events, and energy flows fetched from the GivEnergy API on your behalf, every 30 minutes.</li>
              <li><strong>Billing data:</strong> Stripe handles all payment processing. We store your Stripe customer ID and subscription status, but never your card details.</li>
              <li><strong>Usage logs:</strong> brain tick records (what decision Hum made each half-hour, and why) stored against your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Why we collect it</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide the service: optimise your battery charging schedule and show you savings.</li>
              <li>To authenticate you securely using Supabase Auth.</li>
              <li>To process your subscription via Stripe.</li>
              <li>To improve accuracy of the brain over time.</li>
            </ul>
            <p className="mt-3">We do not sell your data. We do not use it for advertising.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Third parties</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase</strong> — authentication and database hosting (EU West, London).</li>
              <li><strong>Vercel</strong> — hosting and serverless functions.</li>
              <li><strong>Stripe</strong> — payment processing.</li>
              <li><strong>GivEnergy</strong> — inverter data API, accessed on your behalf using credentials you provide.</li>
              <li><strong>Octopus Energy</strong> — tariff rate data, accessed via their public API.</li>
            </ul>
            <p className="mt-3">Each of these processors has their own privacy policy and data processing agreements in place.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Data retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, all personal data is deleted within 30 days. Brain tick logs older than 12 months are automatically purged.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Your rights</h2>
            <p>Under UK GDPR you have the right to access, correct, export, or delete your personal data. Email <a href={`mailto:${EMAIL}`} className="text-[#0E9C7A]">{EMAIL}</a> and we'll respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Cookies</h2>
            <p>We use a single session cookie to keep you logged in. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Changes</h2>
            <p>If we materially change this policy, we'll notify you by email before the change takes effect.</p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-[#DCE9E2] flex gap-4 text-sm">
          <Link href="/terms" className="text-[#0E9C7A] hover:underline">Terms of Service</Link>
          <Link href="/changelog" className="text-[#0E9C7A] hover:underline">Changelog</Link>
        </div>
      </div>
    </div>
  );
}
