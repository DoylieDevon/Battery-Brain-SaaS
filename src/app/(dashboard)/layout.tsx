import Link from "next/link";
import { APP_VERSION, APP_NAME } from "@/lib/version";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00b47a] flex items-center justify-center text-white text-sm font-bold">⚡</div>
            <span className="font-bold tracking-tight">Battery Brain</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
            <Link href="/billing" className="text-gray-600 hover:text-gray-900">Billing</Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-gray-400 hover:text-gray-600">Sign out</button>
            </form>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <span>{APP_NAME}</span>
          <Link href="/changelog" target="_blank" className="hover:text-[#00b47a] transition-colors">
            v{APP_VERSION}
          </Link>
        </div>
      </footer>
    </div>
  );
}
