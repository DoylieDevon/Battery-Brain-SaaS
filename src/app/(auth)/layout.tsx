import Link from "next/link";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F7FAF8" }}>
      <div className="flex-1">
        {children}
      </div>
      <footer className="border-t border-[#EEF3F0] py-4">
        <div className="max-w-sm mx-auto px-6 flex items-center justify-between text-xs text-[#9FB0A7]">
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
