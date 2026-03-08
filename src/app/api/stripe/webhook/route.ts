import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import Stripe from "stripe";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});
//this is the stripe webhook route
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;

    if (userId) {
      try {
        await convex.mutation("users:upgradeToProByClerkId", {
          userId: userId,
          stripeCustomerId: session.customer as string,
          stripeSessionId: session.id,
        });
      } catch (error) {
        console.error("Error upgrading user:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
