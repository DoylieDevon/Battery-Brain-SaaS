import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile?.ge_serial) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Inverter: {profile.ge_serial}</p>
        </div>
        <Badge className={profile.mode === "active" ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
          {profile.mode === "active" ? "Active mode" : "Shadow mode"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Current SOC", value: "—", unit: "%", color: "text-blue-600" },
          { label: "Solar now", value: "—", unit: "kW", color: "text-amber-500" },
          { label: "Home load", value: "—", unit: "kW", color: "text-green-600" },
          { label: "Grid", value: "—", unit: "kW", color: "text-gray-600" },
        ].map(k => (
          <Card key={k.label} className="shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className={`text-3xl font-extrabold ${k.color}`}>{k.value}<span className="text-base font-normal text-gray-400 ml-1">{k.unit}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s savings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Charged today</p>
              <p className="text-2xl font-bold">— kWh</p>
              <p className="text-xs text-gray-400 mt-0.5">at —p avg</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Discharged at peak</p>
              <p className="text-2xl font-bold">— kWh</p>
              <p className="text-xs text-gray-400 mt-0.5">valued at —</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Net saved today</p>
              <p className="text-2xl font-bold text-[#00b47a]">£—</p>
              <p className="text-xs text-gray-400 mt-0.5">vs peak import</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <strong>Shadow mode active.</strong> Battery Brain is watching your usage and learning your patterns. It will suggest when it&apos;s ready to take over — or you can switch to active mode in Settings whenever you&apos;re comfortable.
      </div>
    </div>
  );
}
