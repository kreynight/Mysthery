// Pack sizes, prices and shipping. Safe to import from client components.

export const PACK_SIZES = [1, 3, 5] as const;
export type PackSize = (typeof PACK_SIZES)[number];

/** Flat shipping on a single pouch, in cents. Orders of FREE_SHIP_FROM pouches or more ship free. */
export const SHIPPING_SINGLE = 600;
export const FREE_SHIP_FROM = 3;

export type PriceTiers = Record<PackSize, number>;

function roundDollar(cents: number): number {
  return Math.round(cents / 100) * 100;
}

/** Prices for 1, 3 and 5 pouches. Missing 3 and 5 pouch prices fall back to a small bundle discount. */
export function priceTiers(single: number, price3?: number | null, price5?: number | null): PriceTiers {
  return {
    1: single,
    3: price3 && price3 > 0 ? price3 : roundDollar(single * 3 * 0.89),
    5: price5 && price5 > 0 ? price5 : roundDollar(single * 5 * 0.8),
  };
}

export function parseSize(value: unknown): PackSize | null {
  const n = Number(value);
  return (PACK_SIZES as readonly number[]).includes(n) ? (n as PackSize) : null;
}

export function shippingFor(pouches: number): number {
  return pouches >= FREE_SHIP_FROM ? 0 : SHIPPING_SINGLE;
}

export function perPouch(tiers: PriceTiers, size: PackSize): number {
  return Math.round(tiers[size] / size);
}

export function sizeLabel(size: PackSize): string {
  return size === 1 ? "1 pouch" : `${size} pouches`;
}

/** Stripe Checkout shipping option for an order of this many pouches. */
export function shippingOption(pouches: number) {
  const amount = shippingFor(pouches);
  return {
    shipping_rate_data: {
      type: "fixed_amount" as const,
      fixed_amount: { amount, currency: "usd" },
      display_name: amount === 0 ? "Free shipping (USPS)" : "USPS Ground Advantage",
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: 2 },
        maximum: { unit: "business_day" as const, value: 5 },
      },
    },
  };
}
