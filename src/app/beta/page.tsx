export const metadata = { title: "Hum — Private Beta" };

export default function BetaPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F7FAF8" }}>
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #0E9C7A, #18C172)" }} />
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="flex flex-col items-center mb-8">
            <div style={{ width: 68, height: 68, borderRadius: 20, background: "#E4F6EC", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M5 13c0-4 3-7 7-7s7 3 7 7" stroke="#0E9C7A" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M8.5 13c0-2 1.6-3.4 3.5-3.4S15.5 11 15.5 13" stroke="#0E9C7A" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="12" cy="13" r="1.5" fill="#0E9C7A" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, letterSpacing: "-.02em", color: "#0E2A24" }}>Hum</div>
          </div>
          <div className="bg-white rounded-3xl p-7 shadow-lg border border-[#EAF1ED]">
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "#0E2A24", marginBottom: 10 }}>
              Private beta
            </h2>
            <p className="text-sm text-[#7C8A83] leading-relaxed">
              Hum is currently invite-only while we make sure everything works properly. We&apos;ll be opening up soon.
            </p>
            <p className="text-sm text-[#7C8A83] mt-3">
              Already have an account? <a href="/login" className="text-[#0E9C7A] font-semibold hover:underline">Log in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
