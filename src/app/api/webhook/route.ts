import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";
import { getStockMap, orderFitsStock, returnToStock, takeFromStock } from "@/lib/teas";
import { parseOrderRecipe } from "@/lib/recipe";
import { sendOrderConfirmation } from "@/lib/email";
import { createShippoOrder, orderContents, parcelGrams, shipToFromSession } from "@/lib/shippo";
import { shippingFor } from "@/lib/pricing";
import type { OrderRecipe } from "@/lib/recipe";

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
    const shipTo = shipToFromSession(session);
    const paidFields = {
      ...(shipTo ? { shippingAddress: { ...shipTo } } : {}),
      email: session.customer_details?.email || null,
      stripePaymentId: (session.payment_intent as string) || null,
      // What was actually charged, after any promo code.
      ...(typeof session.amount_total === "number" ? { totalAmount: session.amount_total } : {}),
    };

    try {
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        select: { id: true, status: true, recipe: true },
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
      await sendConfirmation(session);
      await sendToShippo(session, order.id, recipe, quantity);
    } catch (err) {
      console.error("Error processing webhook:", err);
      return NextResponse.json({ error: "Processing error." }, { status: 500 });
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    // Only a full refund puts tea back; a partial refund is left as is.
    if (charge.amount_refunded < charge.amount) return NextResponse.json({ received: true });
    try {
      await handleRefund(charge);
    } catch (err) {
      console.error("Error processing refund:", err);
      return NextResponse.json({ error: "Processing error." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

const ORDER_FIELDS = { id: true, status: true, recipe: true, dropId: true, quantity: true } as const;

async function handleRefund(charge: Stripe.Charge) {
  const paymentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentId) return;

  let order = await prisma.order.findFirst({ where: { stripePaymentId: paymentId }, select: ORDER_FIELDS });
  if (!order) {
    // An order the site never saw as paid has no payment id yet; find it through its checkout session.
    const sessions = await getStripe().checkout.sessions.list({ payment_intent: paymentId, limit: 1 });
    const sessionId = sessions.data[0]?.id;
    if (sessionId) order = await prisma.order.findUnique({ where: { stripeSessionId: sessionId }, select: ORDER_FIELDS });
  }
  if (!order) {
    console.error(`No order for refunded payment ${paymentId}`);
    return;
  }
  if (order.status === "refunded") return;

  // Claim the order first so a resent event can't put the stock back twice.
  const claimed = await prisma.order.updateMany({
    where: { id: order.id, status: order.status },
    data: { status: "refunded", stripePaymentId: paymentId },
  });
  if (claimed.count === 0) return;

  // Only a paid order took stock off, so only a paid order puts it back.
  if (order.status !== "paid") return;
  if (order.dropId) {
    await prisma.drop.update({
      where: { id: order.dropId },
      data: { batchQuantityRemaining: { increment: order.quantity } },
    });
  }
  const recipe = parseOrderRecipe(order.recipe);
  if (recipe) await returnToStock(recipe);
}


/** Emails the buyer their order confirmation. Any failure is logged, never thrown. */
async function sendConfirmation(session: Stripe.Checkout.Session) {
  const to = session.customer_details?.email;
  if (!to || !process.env.RESEND_API_KEY) return;
  try {
    const items = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 20 });
    await sendOrderConfirmation({
      to,
      name: session.customer_details?.name,
      lines: items.data.map((i) => ({ description: i.description || "Tea", quantity: i.quantity || 1 })),
      totalCents: session.amount_total ?? 0,
    });
  } catch (err) {
    console.error("Confirmation email failed:", err);
  }
}

/** Puts a paid order in Shippo, ready for a label. Any failure is logged, never thrown. */
async function sendToShippo(session: Stripe.Checkout.Session, orderId: string, recipe: OrderRecipe | null, quantity: number) {
  if (!process.env.SHIPPO_API_TOKEN) return;
  const shipTo = shipToFromSession(session);
  if (!shipTo) {
    console.error(`No shipping address on session ${session.id}; not sent to Shippo.`);
    return;
  }
  try {
    const items = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 20 });
    const { pouches, teaGrams } = orderContents(recipe, quantity);
    const shippingCents = session.total_details?.amount_shipping ?? shippingFor(pouches);
    const shippoId = await createShippoOrder({
      orderNumber: orderId.slice(0, 8).toUpperCase(),
      placedAt: new Date((session.created || Date.now() / 1000) * 1000),
      email: session.customer_details?.email || null,
      shipTo,
      lines: items.data.map((i) => ({
        title: i.description || "Tea",
        quantity: i.quantity || 1,
        totalCents: i.amount_total ?? 0,
      })),
      shippingCents,
      totalCents: session.amount_total ?? 0,
      grams: parcelGrams(pouches, teaGrams),
    });
    if (shippoId) await prisma.order.update({ where: { id: orderId }, data: { shippoOrderId: shippoId } });
  } catch (err) {
    console.error("Sending order to Shippo failed:", err);
  }
}
