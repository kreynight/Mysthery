import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";
import { getStockMap, orderFitsStock, takeFromStock } from "@/lib/teas";
import { parseOrderRecipe } from "@/lib/recipe";

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
    const paidFields = {
      email: session.customer_details?.email || null,
      stripePaymentId: (session.payment_intent as string) || null,
    };

    try {
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        select: { status: true, recipe: true },
      });
      if (!order) {
        console.error(`No order for session ${session.id}`);
        return NextResponse.json({ received: true });
      }
      // Stripe can resend an event; only a pending order is counted once.
      if (order.status !== "pending") return NextResponse.json({ received: true });

      const recipe = parseOrderRecipe(order.recipe);
      const stock = await getStockMap();
      const teaShort = recipe ? !orderFitsStock(recipe, stock) : false;

      const dropId = session.metadata?.kind ? null : session.metadata?.dropId;
      const quantity = parseInt(session.metadata?.quantity || "1", 10);
      let batchShort = false;
      if (dropId) {
        const drop = await prisma.drop.findUnique({ where: { id: dropId } });
        batchShort = !drop || drop.batchQuantityRemaining < quantity;
      }

      if (teaShort || batchShort) {
        // Paid but the shelf can't cover it: hold for review instead of counting stock down.
        await prisma.order.update({ where: { stripeSessionId: session.id }, data: { status: "review", ...paidFields } });
        console.error(`Not enough stock for session ${session.id}. Order marked for review.`);
        return NextResponse.json({ received: true });
      }

      if (dropId) {
        await prisma.$transaction([
          prisma.drop.update({ where: { id: dropId }, data: { batchQuantityRemaining: { decrement: quantity } } }),
          prisma.order.update({ where: { stripeSessionId: session.id }, data: { status: "paid", ...paidFields } }),
        ]);
      } else {
        await prisma.order.update({ where: { stripeSessionId: session.id }, data: { status: "paid", ...paidFields } });
      }
      if (recipe) await takeFromStock(recipe);
    } catch (err) {
      console.error("Error processing webhook:", err);
      return NextResponse.json({ error: "Processing error." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
