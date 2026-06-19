"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  status: string;
  trial_ends_at: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  trialing: "Free trial",
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Cancelled",
  incomplete: "Incomplete",
};

const STATUS_COLOR: Record<string, string> = {
  trialing: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-green-100 text-green-800 border-green-200",
  past_due: "bg-red-100 text-red-800 border-red-200",
  canceled: "bg-gray-100 text-gray-600 border-gray-200",
  incomplete: "bg-amber-100 text-amber-800 border-amber-200",
};

function daysLeft(isoDate: string | null) {
  if (!isoDate) return null;
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 864e5));
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "1") {
      setSuccess(true);
      window.history.replaceState({}, "", "/billing");
    }
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single();
      setSub(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function startCheckout() {
    setCheckoutLoading(true);
    const r = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await r.json();
    if (url) window.location.href = url;
    else setCheckoutLoading(false);
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;

  const status = sub?.status ?? "none";
  const isActive = status === "active" || status === "trialing";
  const trialDays = daysLeft(sub?.trial_ends_at ?? null);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your Battery Brain subscription.</p>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          <strong>You&apos;re subscribed!</strong> Battery Brain is now active. Thanks for supporting the project.
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Battery Brain · £4.99/month</CardTitle>
            {sub && (
              <Badge className={`border ${STATUS_COLOR[status] ?? "bg-gray-100 border-gray-200"}`}>
                {STATUS_LABEL[status] ?? status}
              </Badge>
            )}
          </div>
          <CardDescription>
            {status === "trialing" && trialDays !== null
              ? `Free trial — ${trialDays} day${trialDays !== 1 ? "s" : ""} remaining. Card will be charged £4.99/month after.`
              : status === "active"
              ? sub?.cancel_at_period_end
                ? "Your subscription will cancel at the end of the billing period."
                : "Your subscription renews monthly. Cancel any time."
              : status === "canceled"
              ? "Your subscription has ended. Resubscribe to restore access."
              : "Subscribe to keep Battery Brain running your charge schedule."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isActive ? (
            <Button className="w-full bg-[#00b47a] hover:bg-[#009e6c] text-white" onClick={startCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Redirecting…" : status === "canceled" ? "Resubscribe — £4.99/month" : "Start 30-day free trial"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 border p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span>Battery Brain Monthly</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price</span><span>£4.99/month</span></div>
                {sub?.trial_ends_at && (
                  <div className="flex justify-between"><span className="text-gray-500">Trial ends</span>
                    <span>{new Date(sub.trial_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center">
                To cancel or update payment details, email{" "}
                <a href="mailto:andy@zerofluff.co.uk" className="underline">andy@zerofluff.co.uk</a>
                {" "}or use the{" "}
                <a href="https://billing.stripe.com" target="_blank" rel="noreferrer" className="underline">Stripe customer portal</a>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100">
        <CardContent className="pt-5">
          <p className="text-sm font-medium mb-3">Everything included</p>
          <ul className="space-y-1.5 text-sm text-gray-600">
            {[
              "Full dashboard with live inverter data",
              "Half-hourly brain ticks, 24/7",
              "14-day learning period + active charge control",
              "Solar-aware charging",
              "Savings tracking — see every penny saved",
              "Alerts when something goes wrong",
            ].map(l => (
              <li key={l} className="flex gap-2">
                <span className="text-[#00b47a] font-bold shrink-0">✓</span>{l}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
