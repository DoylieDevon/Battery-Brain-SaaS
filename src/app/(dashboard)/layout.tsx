import Link from "next/link";
import { APP_VERSION, APP_NAME } from "@/lib/version";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function HumWordmark() {
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 28, height: 28, borderRadius: 9, background: "linear-gradient(145deg, #18C172, #0E9C7A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 13c0-4 3-7 7-7s7 3 7 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M8.5 13c0-2 1.6-3.4 3.5-3.4S15.5 11 15.5 13" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="13" r="1.5" fill="#fff" />
        </svg>
      </div>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#0E2A24", letterSpacing: "-.02em" }}>Hum</span>
    </div>
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F7FAF8" }}>
      {/* Top nav */}
      <header className="bg-white border-b border-[#EEF3F0] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <HumWordmark />
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className="text-sm font-medium text-[#51635C] hover:text-[#0E2A24] px-3 py-1.5 rounded-lg hover:bg-[#F7FAF8] transition-colors">Today</Link>
            <Link href="/savings" className="text-sm font-medium text-[#51635C] hover:text-[#0E2A24] px-3 py-1.5 rounded-lg hover:bg-[#F7FAF8] transition-colors">Savings</Link>
            <Link href="/settings" className="text-sm font-medium text-[#51635C] hover:text-[#0E2A24] px-3 py-1.5 rounded-lg hover:bg-[#F7FAF8] transition-colors">Settings</Link>
            <Link href="/billing" className="text-sm font-medium text-[#51635C] hover:text-[#0E2A24] px-3 py-1.5 rounded-lg hover:bg-[#F7FAF8] transition-colors">Billing</Link>
            <form action="/auth/signout" method="post" className="ml-2">
              <button type="submit" className="text-sm font-medium text-[#9FB0A7] hover:text-[#51635C] px-3 py-1.5 rounded-lg hover:bg-[#F7FAF8] transition-colors">Sign out</button>
            </form>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EEF3F0] py-4">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-[#9FB0A7]">
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>{APP_NAME}</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#0E9C7A] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#0E9C7A] transition-colors">Terms</Link>
            <Link href="/changelog" target="_blank" className="hover:text-[#0E9C7A] transition-colors font-medium">
              v{APP_VERSION}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
