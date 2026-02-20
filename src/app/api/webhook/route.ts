import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const dropId = session.metadata?.dropId;
    const quantity = parseInt(session.metadata?.quantity || "1", 10);

    if (!dropId) {
      console.error("No dropId in session metadata");
      return NextResponse.json({ received: true });
    }

    try {
      // Recheck remaining to prevent overselling
      const drop = await prisma.drop.findUnique({ where: { id: dropId } });

      if (!drop || drop.batchQuantityRemaining < quantity) {
        // Mark order for manual review instead of decrementing
        await prisma.order.update({
          where: { stripeSessionId: session.id },
          data: {
            status: "review",
            email: session.customer_details?.email || null,
            stripePaymentId: session.payment_intent as string || null,
          },
        });
        console.error(`Insufficient stock for drop ${dropId}. Order marked for review.`);
        return NextResponse.json({ received: true });
      }

      // Decrement remaining and update order atomically
      await prisma.$transaction([
        prisma.drop.update({
          where: { id: dropId },
          data: {
            batchQuantityRemaining: { decrement: quantity },
          },
        }),
        prisma.order.update({
          where: { stripeSessionId: session.id },
          data: {
            status: "paid",
            email: session.customer_details?.email || null,
            stripePaymentId: session.payment_intent as string || null,
          },
        }),
      ]);
    } catch (err) {
      console.error("Error processing webhook:", err);
      return NextResponse.json({ error: "Processing error." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
