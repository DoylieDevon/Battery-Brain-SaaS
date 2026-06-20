import Link from "next/link";

export const metadata = { title: "Terms of Service — Hum" };

const UPDATED = "20 June 2026";
const EMAIL = "hello@gethum.co.uk";

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F7FAF8" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[#0E9C7A] font-semibold hover:underline">← Back to Hum</Link>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "#0E2A24", marginTop: 32, marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p className="text-sm text-[#9FB0A7] mb-10">Last updated: {UPDATED}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[#51635C]">

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">The service</h2>
            <p>Hum is provided by Zero Fluff Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;Hum&rdquo;). By creating an account you agree to these terms. If you don&apos;t agree, don&apos;t use the service.</p>
            <p className="mt-2">Hum is a software service that reads data from your GivEnergy inverter and recommends or automates charging decisions to reduce your energy costs. In shadow mode, it never writes to your inverter — it only observes and advises.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Your account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be 18 or over to use Hum.</li>
              <li>You are responsible for keeping your account credentials secure.</li>
              <li>You must provide accurate information during onboarding, including your GivEnergy API token and inverter serial number.</li>
              <li>You may only connect inverters that you own or are authorised to manage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Subscription and billing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Hum offers a 30-day free trial. No credit card is required to start.</li>
              <li>After the trial, the service costs £4.99/month, billed monthly via Stripe.</li>
              <li>You may cancel at any time. Your access continues until the end of the current billing period.</li>
              <li>We do not offer refunds for partial months.</li>
              <li>Prices may change with 30 days&apos; notice by email.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use Hum to access inverters you don&apos;t own or aren&apos;t authorised to control.</li>
              <li>Attempt to reverse-engineer, copy, or resell the service.</li>
              <li>Use the service in a way that could damage hardware or void your inverter warranty.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Disclaimer</h2>
            <p>Hum is provided &ldquo;as is&rdquo;. We make every effort to optimise your battery correctly, but we cannot guarantee specific savings. Electricity prices, tariff structures, and inverter behaviour are outside our control.</p>
            <p className="mt-2">In active mode (when Hum writes charging schedules to your inverter), you accept that automated decisions may occasionally be suboptimal. Shadow mode carries no such risk as it never changes your settings.</p>
            <p className="mt-2">We are not liable for any costs, damages, or losses arising from use of the service, to the maximum extent permitted by UK law.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Termination</h2>
            <p>We may suspend or close accounts that violate these terms. You may delete your account at any time from the Settings page.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Governing law</h2>
            <p>These terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0E2A24] mb-3">Contact</h2>
            <p>Questions? Email <a href={`mailto:${EMAIL}`} className="text-[#0E9C7A]">{EMAIL}</a>.</p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-[#DCE9E2] flex gap-4 text-sm">
          <Link href="/privacy" className="text-[#0E9C7A] hover:underline">Privacy Policy</Link>
          <Link href="/changelog" className="text-[#0E9C7A] hover:underline">Changelog</Link>
        </div>
      </div>
    </div>
  );
}
