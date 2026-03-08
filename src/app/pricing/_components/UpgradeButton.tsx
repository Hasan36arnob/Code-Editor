"use client";

import { Zap, CreditCard } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
//this is the upgrade button component
export default function UpgradeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "lemon">("stripe");
  const { user } = useUser();
  
  const createStripeSession = useMutation(api.stripe.createCheckoutSession);

  const LEMON_CHECKOUT_URL =
    "https://ytprogrammingstore.lemonsqueezy.com/buy/d459dddb-a233-4060-9e72-90a1a7740552";

  const handleStripeCheckout = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress || !user?.id) {
      alert("Please sign in first");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createStripeSession({
        email: user.emailAddresses[0].emailAddress,
        userId: user.id,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      // Fallback to Lemon Squeezy if Stripe fails
      window.location.href = LEMON_CHECKOUT_URL;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => setPaymentMethod("stripe")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            paymentMethod === "stripe"
              ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Pay with bKash/Nagad/Card
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("lemon")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            paymentMethod === "lemon"
              ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          <Zap className="w-4 h-4" />
          International Card
        </button>
      </div>

      {paymentMethod === "stripe" ? (
        <button
          onClick={handleStripeCheckout}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white 
            bg-gradient-to-r from-green-500 to-green-600 rounded-lg 
            hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Upgrade to Pro - ৳3,900 (BDT)
            </>
          )}
        </button>
      ) : (
        <a
          href={LEMON_CHECKOUT_URL}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white 
            bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg 
            hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <Zap className="w-5 h-5" />
          Upgrade to Pro - $39 (USD)
        </a>
      )}

      <p className="text-center text-gray-500 text-sm">
        🔒 Secure payment powered by Stripe • 30-day money back guarantee
      </p>
    </div>
  );
}
