"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_profiles").select("onboarded_at").eq("user_id", user.id).single();
      if (!data?.onboarded_at) return;
      const trialEnd = new Date(data.onboarded_at).getTime() + 30 * 864e5;
      const left = Math.ceil((trialEnd - Date.now()) / 864e5);
      if (left > 0 && left <= 30) setDaysLeft(left);
    }
    load();
  }, []);

  if (daysLeft === null) return null;

  const urgent = daysLeft <= 7;

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 text-sm ${urgent ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-[#EEF6F1] border-[#C8E6D4] text-[#4E635A]"}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-base">{urgent ? "⏰" : "🎁"}</span>
        <span>
          <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</strong> in your free trial.
          {urgent ? " Add payment details to keep Hum running." : " No card needed yet."}
        </span>
      </div>
      <Link href="/billing" className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${urgent ? "bg-amber-200 hover:bg-amber-300 text-amber-900" : "bg-[#18C172] hover:bg-[#0E9C7A] text-white"}`}>
        {urgent ? "Add card →" : "View plan"}
      </Link>
    </div>
  );
}
