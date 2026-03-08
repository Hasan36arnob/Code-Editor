"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export const createCheckoutSession = internalAction({
  args: {
    email: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "bd_bkash", "bd_nagad"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: "CodeCraft Pro - Lifetime Access",
              description: "Unlock all pro features and unlimited code executions",
            },
            unit_amount: 3900 * 100, // 3900 BDT
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customer_email: args.email,
      metadata: {
        userId: args.userId,
      },
    });

    return { url: session.url };
  },
});

export const verifyStripeWebhook = internalAction({
  args: {
    payload: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        args.payload,
        args.signature,
        webhookSecret
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Update user to pro in database
      const userId = session.metadata?.userId;
      const customerEmail = session.customer_email;

      if (userId && customerEmail) {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), userId))
          .first();

        if (user) {
          await ctx.db.patch(user._id, {
            isPro: true,
            proSince: Date.now(),
            stripeCustomerId: session.customer as string,
            stripeSessionId: session.id,
          });
        }
      }
    }

    return { success: true };
  },
});
