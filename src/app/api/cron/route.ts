import { createClient } from "@supabase/supabase-js";
import { runBrain, UserConfig } from "@/lib/brain";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Service-role client to read all active users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("*")
    .not("ge_serial", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = await Promise.allSettled(
    (profiles ?? []).map(async (profile) => {
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

      // Log tick to brain_ticks table
      await supabase.from("brain_ticks").insert({
        user_id: profile.user_id,
        ts: result.ts,
        mode: result.brain?.mode ?? "shadow",
        action: result.brain?.decision?.action ?? "idle",
        reason: result.brain?.decision?.reason ?? null,
        soc_pct: (result.latest as { battery?: { percent?: number } } | null)?.battery?.percent ?? null,
        alerts: result.alerts,
      });

      return { user_id: profile.user_id, action: result.brain?.decision?.action };
    })
  );

  const summary = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { user_id: (profiles ?? [])[i]?.user_id, error: String((r as PromiseRejectedResult).reason) }
  );

  console.log(`[Brain cron] ${new Date().toISOString()} | ${summary.length} users processed`);

  return NextResponse.json({ ts: new Date().toISOString(), processed: summary.length, summary });
}
