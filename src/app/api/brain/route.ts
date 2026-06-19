import { createClient } from "@/lib/supabase/server";
import { runBrain, UserConfig } from "@/lib/brain";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile?.ge_serial) {
    return NextResponse.json({ error: "onboarding_required" }, { status: 400 });
  }

  const cfg: UserConfig = {
    geToken: profile.ge_token,
    serial: profile.ge_serial,
    octopusProduct: profile.octopus_product,
    octopusRegion: profile.octopus_region,
    capKwh: profile.cap_kwh,
    reserveKwh: profile.reserve_kwh,
    chgHalfKwh: profile.chg_half_kwh,
    mode: profile.mode ?? "shadow",
  };

  const result = await runBrain(cfg);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
