// Sends paid orders to Shippo, so they show up under Orders there, ready for a label.
// Only runs when SHIPPO_API_TOKEN is set. Shippo's own default sender address is used,
// and no label is bought here: the label is bought by hand in Shippo.

import type Stripe from "stripe";
import type { OrderRecipe } from "@/lib/recipe";
import { TEA_POUCH_GRAMS } from "@/lib/pricing";

export interface ShipTo {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
}

/** Packaging allowance: the pouch itself, and the mailer around the whole order. */
const GRAMS_PER_POUCH_PACKAGING = 15;
const GRAMS_PER_MAILER = 40;

/** Where a paid Checkout Session ships to, whichever API version Stripe answered with. */
export function shipToFromSession(session: Stripe.Checkout.Session): ShipTo | null {
  const s = session as Stripe.Checkout.Session & {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
    collected_information?: { shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null } | null;
  };
  const details = s.collected_information?.shipping_details || s.shipping_details || null;
  const address = details?.address;
  if (!address?.line1) return null;
  return {
    name: details?.name || session.customer_details?.name || null,
    line1: address.line1 || null,
    line2: address.line2 || null,
    city: address.city || null,
    state: address.state || null,
    postalCode: address.postal_code || null,
    country: address.country || "US",
    phone: session.customer_details?.phone || null,
  };
}

/** Pouches in an order and the grams of tea they hold, from its saved recipe. */
export function orderContents(recipe: OrderRecipe | null, quantity: number): { pouches: number; teaGrams: number } {
  if (!recipe) return { pouches: quantity, teaGrams: quantity * TEA_POUCH_GRAMS };
  const pouches = recipe.parts?.length
    ? recipe.parts.reduce((n, p) => n + (p.recipe.pouches || 1), 0)
    : recipe.pouches || 1;
  return { pouches, teaGrams: Math.round(recipe.packGrams * (recipe.pouches || 1)) };
}

export function parcelGrams(pouches: number, teaGrams: number): number {
  return Math.round(teaGrams + pouches * GRAMS_PER_POUCH_PACKAGING + GRAMS_PER_MAILER);
}

export interface ShippoOrderInput {
  orderNumber: string;
  placedAt: Date;
  email: string | null;
  shipTo: ShipTo;
  lines: { title: string; quantity: number; totalCents: number }[];
  shippingCents: number;
  totalCents: number;
  grams: number;
}

const dollars = (cents: number) => (cents / 100).toFixed(2);

export function shippoOrderBody(o: ShippoOrderInput) {
  const lineGrams = o.lines.length ? Math.max(1, Math.round(o.grams / o.lines.length)) : o.grams;
  return {
    order_number: o.orderNumber,
    order_status: "PAID",
    placed_at: o.placedAt.toISOString(),
    to_address: {
      name: o.shipTo.name || "Customer",
      street1: o.shipTo.line1,
      street2: o.shipTo.line2 || "",
      city: o.shipTo.city,
      state: o.shipTo.state,
      zip: o.shipTo.postalCode,
      country: o.shipTo.country || "US",
      email: o.email || "",
      phone: o.shipTo.phone || "",
    },
    line_items: o.lines.map((l) => ({
      title: l.title,
      quantity: l.quantity,
      total_price: dollars(l.totalCents),
      currency: "USD",
      weight: String(lineGrams),
      weight_unit: "g",
    })),
    weight: String(o.grams),
    weight_unit: "g",
    shipping_cost: dollars(o.shippingCents),
    shipping_cost_currency: "USD",
    subtotal_price: dollars(Math.max(0, o.totalCents - o.shippingCents)),
    total_price: dollars(o.totalCents),
    currency: "USD",
  };
}

/** Creates the order in Shippo. Returns its Shippo id, or null when Shippo isn't set up. Throws on a Shippo error. */
export async function createShippoOrder(o: ShippoOrderInput): Promise<string | null> {
  const token = process.env.SHIPPO_API_TOKEN;
  if (!token) return null;
  const res = await fetch("https://api.goshippo.com/orders/", {
    method: "POST",
    headers: { Authorization: `ShippoToken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(shippoOrderBody(o)),
  });
  const data = (await res.json().catch(() => ({}))) as { object_id?: string };
  if (!res.ok || !data.object_id) {
    throw new Error(`Shippo order failed (${res.status}): ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data.object_id;
}
