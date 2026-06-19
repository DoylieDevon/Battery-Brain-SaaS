import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sub = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await supabase.from("subscriptions").upsert({
        stripe_customer_id: customerId,
        stripe_sub_id: sub.id,
        status: sub.status,
        trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: "stripe_sub_id" });
      break;
    }
    case "customer.subscription.deleted": {
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await supabase.from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription && session.client_reference_id) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const fullSub = await stripe.subscriptions.retrieve(subId);
        const customerId = typeof fullSub.customer === "string" ? fullSub.customer : fullSub.customer.id;
        await supabase.from("subscriptions").upsert({
          user_id: session.client_reference_id,
          stripe_customer_id: customerId,
          stripe_sub_id: subId,
          status: fullSub.status,
          trial_ends_at: fullSub.trial_end ? new Date(fullSub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: fullSub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: "stripe_customer_id" });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
