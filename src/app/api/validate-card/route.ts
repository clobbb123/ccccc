import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
// In production, use environment variable: process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the payment method to validate it
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Check if the card is valid
    if (paymentMethod && paymentMethod.card) {
      const card = paymentMethod.card;

      // Validate card properties
      const isValid = 
        card.exp_month !== undefined &&
        card.exp_year !== undefined &&
        card.last4 !== undefined &&
        card.brand !== undefined;

      // Check if card is expired
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const isExpired =
        card.exp_year < currentYear ||
        (card.exp_year === currentYear && card.exp_month < currentMonth);

      if (isExpired) {
        return NextResponse.json(
          {
            valid: false,
            brand: card.brand,
            error: "Card has expired",
            last4: card.last4,
          },
          { status: 200 }
        );
      }

      if (isValid) {
        return NextResponse.json(
          {
            valid: true,
            brand: card.brand,
            last4: card.last4,
            expMonth: card.exp_month,
            expYear: card.exp_year,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          valid: false,
          error: "Invalid card details",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Unable to validate card" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Card validation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
