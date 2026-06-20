import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Check if already subscribed
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("user_id", user.id)
    .single();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: {
      trial_period_days: sub ? undefined : 30,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://battery-brain-saas.vercel.app"}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://battery-brain-saas.vercel.app"}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
