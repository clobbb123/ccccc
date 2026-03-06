"use client";

import { useState } from "react";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe with your publishable key
// In production, use environment variable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
);

const elementStyles = {
  base: {
    color: "#1a1a1a",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSmoothing: "antialiased",
    fontSize: "16px",
    "::placeholder": {
      color: "#6b7280",
    },
  },
  invalid: {
    color: "#dc2626",
    iconColor: "#dc2626",
  },
};

const elementOptions = {
  style: elementStyles,
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    brand?: string;
    error?: string;
  } | null>(null);

  const handleValidation = async () => {
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setValidationResult({ valid: false, error: "Card element not found" });
      return;
    }

    // Use Stripe's validation
    const result = await stripe.createToken(cardElement);

    if (result.error) {
      setValidationResult({
        valid: false,
        error: result.error.message,
      });
    } else {
      setValidationResult({
        valid: true,
        brand: result.token.card?.brand || "unknown",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setError("Card element not found");
      setProcessing(false);
      return;
    }

    // Create payment method (for validation without charging)
    const { error: submitError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (submitError) {
      setError(submitError.message || "An error occurred");
      setProcessing(false);
      return;
    }

    // Send payment method to your server for validation
    try {
      const response = await fetch("/api/validate-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Card validation failed");
      } else {
        setSucceeded(true);
        setValidationResult({
          valid: data.valid,
          brand: data.brand,
        });
      }
    } catch {
      setError("Network error occurred");
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Number
        </label>
        <div className="p-3 border border-gray-300 rounded-md bg-white">
          <CardNumberElement options={elementOptions} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date
          </label>
          <div className="p-3 border border-gray-300 rounded-md bg-white">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVC
          </label>
          <div className="p-3 border border-gray-300 rounded-md bg-white">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {validationResult && (
        <div
          className={`p-3 rounded-md ${
            validationResult.valid
              ? "bg-green-50 border border-green-200"
              : "bg-yellow-50 border border-yellow-200"
          }`}
        >
          <p className={`text-sm ${validationResult.valid ? "text-green-700" : "text-yellow-700"}`}>
            {validationResult.valid
              ? `✓ Card is valid (${validationResult.brand})`
              : `⚠ ${validationResult.error || "Card validation warning"}`}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleValidation}
          disabled={!stripe || processing}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Validate Card
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {processing ? "Processing..." : "Submit"}
        </button>
      </div>

      {succeeded && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            ✓ Card validated successfully! Payment method created.
          </p>
        </div>
      )}
    </form>
  );
}

export default function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
