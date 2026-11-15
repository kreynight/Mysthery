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

// ---- Single pouches from the Tea Library ----

export const TEA_POUCH_GRAMS = 28;
export const TASTING_GRAMS = 10;
/** Under this many grams on hand a tea is low stock, rare, and sold as a tasting pouch. */
export const LOW_STOCK_GRAMS = 30;
export const TEA_PRICE = 1600;
export const TEA_PREMIUM_PRICE = 2200; // Haitian and Chinese teas
export const RARE_EXTRA = 800; // a full pouch of a tea marked rare
export const TASTING_PRICE = 1400;
export const TASTING_PREMIUM_PRICE = 1800;
/** Added per pouch when a batch or generated mix includes a rare tea. */
export const RARE_BLEND_EXTRA = 400;
/** Added to a tasting pouch of a tea marked rare by hand (very rare, like Bwa Dinn or Mabi). */
export const VERY_RARE_TASTING_EXTRA = 600;
/** No tasting pouch sells for less than this, however small. */
export const TASTING_MIN_PRICE = 800;

export interface TeaOffer {
  grams: number;
  price: number;
  premium: boolean;
  rare: boolean;
  lowStock: boolean;
  tasting: boolean;
}

export function isPremiumOrigin(roots: string | null | undefined): boolean {
  const r = (roots || "").toLowerCase();
  return /haiti|china|chinese|yunnan/.test(r) && !/france/.test(r);
}

export function isLowStock(gramsOnHand: number | null | undefined): boolean {
  return gramsOnHand != null && gramsOnHand < LOW_STOCK_GRAMS;
}

/** What one pouch of a library tea costs and weighs. Null when there is too little left to sell. */
export function teaOffer(t: { gramsOnHand: number | null; rare: boolean; premium: boolean }): TeaOffer | null {
  const lowStock = isLowStock(t.gramsOnHand);
  const rare = t.rare || lowStock;
  if (lowStock) {
    const grams = Math.min(TASTING_GRAMS, t.gramsOnHand ?? 0);
    if (grams < 4) return null;
    // A full 10 g tasting pouch costs the tasting price; a smaller one costs its share, rounded to the dollar.
    const base = t.premium ? TASTING_PREMIUM_PRICE : TASTING_PRICE;
    const scaled = Math.max(TASTING_MIN_PRICE, Math.round((base * grams) / TASTING_GRAMS / 100) * 100);
    const price = scaled + (t.rare ? VERY_RARE_TASTING_EXTRA : 0);
    return { grams, price, premium: t.premium, rare, lowStock, tasting: true };
  }
  return {
    grams: TEA_POUCH_GRAMS,
    price: (t.premium ? TEA_PREMIUM_PRICE : TEA_PRICE) + (rare ? RARE_EXTRA : 0),
    premium: t.premium,
    rare,
    lowStock,
    tasting: false,
  };
}

/** Price tiers with the rare premium added when a blend includes a rare tea. */
export function withRare(tiers: PriceTiers, hasRare: boolean): PriceTiers {
  if (!hasRare) return tiers;
  return { 1: tiers[1] + RARE_BLEND_EXTRA, 3: tiers[3] + RARE_BLEND_EXTRA * 3, 5: tiers[5] + RARE_BLEND_EXTRA * 5 };
}
