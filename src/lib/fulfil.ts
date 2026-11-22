// What happens to an order after it's paid:
// 1. Right away: a row in the orders sheet, and a new-order email to the shop.
// 2. After the hold (an hour by default): the order goes to Shippo, ready for a label.
//    A refund during the hold stops it, so a test or a cancelled order never reaches Shippo.
// 3. A refund after it reached Shippo: the sheet says so and the shop gets a "don't ship" email.

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { parseOrderRecipe } from "@/lib/recipe";
import { formatPrice } from "@/lib/format";
import { shippingFor } from "@/lib/pricing";
import { createShippoOrder, orderContents, parcelGrams, type ShipTo } from "@/lib/shippo";
import { sendShopAlert } from "@/lib/shopAlerts";
import { postOrderRow, type SheetRow } from "@/lib/orderSheet";

/** Minutes a paid order waits before it goes to Shippo. */
export function holdMinutes(): number {
  const n = Number(process.env.SHIP_HOLD_MINUTES);
  return Number.isFinite(n) && n >= 0 ? n : 60;
}

const SENDING = "sending";

type OrderRow = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

async function loadOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { drop: { select: { name: true } } },
  });
}

export function orderNumber(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function parseShipTo(v: unknown): ShipTo | null {
  if (!v || typeof v !== "object") return null;
  const a = v as ShipTo;
  return a.line1 ? a : null;
}

function addressLine(a: ShipTo | null): string {
  if (!a) return "";
  return [a.line1, a.line2, a.city, [a.state, a.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

function etTime(d: Date): string {
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface StripeBits {
  lines: { title: string; quantity: number; totalCents: number }[];
  shippingCents: number | null;
  livemode: boolean;
  phone: string | null;
}

async function stripeBits(sessionId: string): Promise<StripeBits> {
  const stripe = getStripe();
  const [session, items] = await Promise.all([
    stripe.checkout.sessions.retrieve(sessionId),
    stripe.checkout.sessions.listLineItems(sessionId, { limit: 20 }),
  ]);
  return {
    lines: items.data.map((i) => ({
      title: i.description || "Tea",
      quantity: i.quantity || 1,
      totalCents: i.amount_total ?? 0,
    })),
    shippingCents: session.total_details?.amount_shipping ?? null,
    livemode: session.livemode,
    phone: session.customer_details?.phone || null,
  };
}

function statusLabel(o: OrderRow): string {
  if (o.status === "refunded") return o.shippoOrderId && o.shippoOrderId !== SENDING ? "Refunded: in Shippo, don't ship" : "Refunded";
  if (o.status === "review") return "Paid: short on stock, check before shipping";
  if (o.status !== "paid") return o.status;
  if (o.shippoOrderId && o.shippoOrderId !== SENDING) return "In Shippo: buy label";
  return "Paid: on hold";
}

function sheetRow(o: OrderRow, bits: StripeBits | null): SheetRow {
  const recipe = parseOrderRecipe(o.recipe);
  const { pouches, teaGrams } = orderContents(recipe, o.quantity);
  const shipTo = parseShipTo(o.shippingAddress);
  const paidAt = o.paidAt ?? o.createdAt;
  const items = bits?.lines.length
    ? bits.lines.map((l) => `${l.quantity > 1 ? `${l.quantity} x ` : ""}${l.title}`).join("; ")
    : o.drop?.name || o.mixItems || "";
  const shipping = bits?.shippingCents ?? shippingFor(pouches);
  return {
    order: orderNumber(o.id),
    placed: etTime(paidAt),
    status: statusLabel(o),
    customer: shipTo?.name || "",
    email: o.email || "",
    shipTo: addressLine(shipTo),
    items,
    pouches,
    weightGrams: parcelGrams(pouches, teaGrams),
    shippingPaid: formatPrice(shipping),
    total: formatPrice(o.totalAmount),
    toShippoAt: o.status === "paid" ? etTime(new Date(paidAt.getTime() + holdMinutes() * 60_000)) : "",
    shippoOrder: o.shippoOrderId && o.shippoOrderId !== SENDING ? o.shippoOrderId : "",
    mode: bits && !bits.livemode ? "Test" : "Live",
    updated: etTime(new Date()),
  };
}

async function syncSheet(o: OrderRow, bits: StripeBits | null) {
  try {
    await postOrderRow(sheetRow(o, bits));
  } catch (err) {
    console.error("Orders sheet update failed:", err);
  }
}

async function safeBits(sessionId: string): Promise<StripeBits | null> {
  try {
    return await stripeBits(sessionId);
  } catch (err) {
    console.error("Could not read the Stripe session:", err);
    return null;
  }
}

/** Right after payment: sheet row and the shop's new-order email. Never throws. */
export async function onOrderPaid(orderId: string): Promise<void> {
  const o = await loadOrder(orderId);
  if (!o) return;
  const bits = await safeBits(o.stripeSessionId);
  await syncSheet(o, bits);
  const row = sheetRow(o, bits);
  const held = o.status === "paid";
  await sendShopAlert({
    subject: `New order #${row.order}: ${row.total}, ${row.pouches} ${row.pouches === 1 ? "pouch" : "pouches"}${row.mode === "Test" ? " (test)" : ""}`,
    lines: [
      `Order #${row.order}, ${row.placed} ET`,
      `Items: ${row.items}`,
      `Total: ${row.total} (shipping ${row.shippingPaid})`,
      `Ship to: ${row.customer}${row.shipTo ? `, ${row.shipTo}` : ""}`,
      `Customer email: ${row.email}`,
      held
        ? `It goes to Shippo at ${row.toShippoAt} ET. To cancel, refund it in Stripe before then and it won't go to Shippo.`
        : "Short on stock: it's held for review in admin Orders and won't go to Shippo by itself.",
    ],
  });
}

/** After a full refund. Never throws. */
export async function onOrderRefunded(orderId: string): Promise<void> {
  const o = await loadOrder(orderId);
  if (!o) return;
  const bits = await safeBits(o.stripeSessionId);
  await syncSheet(o, bits);
  const row = sheetRow(o, bits);
  const inShippo = !!row.shippoOrder;
  await sendShopAlert({
    subject: inShippo ? `Refunded #${row.order}: don't ship, it's in Shippo` : `Refunded #${row.order}: stopped before Shippo`,
    lines: [
      `Order #${row.order} (${row.total}) was refunded in full.`,
      inShippo
        ? "It had already gone to Shippo. Don't buy a label for it. If you already did, void the label in Shippo for a refund of the postage."
        : "It never reached Shippo, so there's nothing to undo there.",
    ],
  });
}

/** Sends every paid order whose hold is over to Shippo. Safe to call as often as you like. */
export async function releaseReadyOrders(): Promise<{ sent: number; failed: number }> {
  if (!process.env.SHIPPO_API_TOKEN) return { sent: 0, failed: 0 };
  const cutoff = new Date(Date.now() - holdMinutes() * 60_000);
  const ready = await prisma.order.findMany({
    where: { status: "paid", shippoOrderId: null, paidAt: { lte: cutoff } },
    select: { id: true },
    take: 20,
  });
  let sent = 0;
  let failed = 0;
  for (const { id } of ready) {
    // Claim it first, so two runs at once can't send it twice.
    const claim = await prisma.order.updateMany({
      where: { id, status: "paid", shippoOrderId: null },
      data: { shippoOrderId: SENDING },
    });
    if (claim.count === 0) continue;
    try {
      const o = await loadOrder(id);
      const shipTo = parseShipTo(o?.shippingAddress);
      if (!o || !shipTo) throw new Error(`Order ${id} has no shipping address`);
      const bits = await stripeBits(o.stripeSessionId);
      const recipe = parseOrderRecipe(o.recipe);
      const { pouches, teaGrams } = orderContents(recipe, o.quantity);
      const shippoId = await createShippoOrder({
        orderNumber: orderNumber(o.id),
        placedAt: o.paidAt ?? o.createdAt,
        email: o.email,
        shipTo: { ...shipTo, phone: shipTo.phone || bits.phone },
        lines: bits.lines,
        shippingCents: bits.shippingCents ?? shippingFor(pouches),
        totalCents: o.totalAmount,
        grams: parcelGrams(pouches, teaGrams),
      });
      // A refund can land while Shippo is answering; keep whatever status the order has now.
      await prisma.order.update({ where: { id }, data: { shippoOrderId: shippoId } });
      const now = await loadOrder(id);
      if (now) {
        await syncSheet(now, bits);
        if (now.status === "refunded") await onOrderRefunded(id);
      }
      sent++;
    } catch (err) {
      console.error(`Sending order ${id} to Shippo failed:`, err);
      await prisma.order.updateMany({ where: { id, shippoOrderId: SENDING }, data: { shippoOrderId: null } });
      failed++;
    }
  }
  return { sent, failed };
}
