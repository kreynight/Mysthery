// Blend recipes: what goes in a pouch, in parts and grams. Safe to import from client components.

import { ACCENT_GRAMS } from "@/lib/pricing";

export interface RecipeItem {
  ingredientId: string;
  name: string;
  parts: number;
  /** A mix-only tea: a fixed small accent in each pouch instead of a share by parts. */
  accent?: boolean;
}

export interface RecipeLine {
  ingredientId?: string;
  inventoryNo: number | null;
  name: string;
  brand: string | null;
  parts: number;
  /** Grams of this tea in one pouch. */
  grams: number;
}

export interface OrderRecipe {
  packGrams: number;
  pouches: number;
  lines: RecipeLine[];
  /** A cart order: what to pack, item by item. `lines` then holds the total grams of each tea for the whole order. */
  parts?: { label: string; recipe: OrderRecipe }[];
}

const roundHalf = (n: number) => Math.round(n * 2) / 2;

export function buildOrderRecipe(
  items: (Omit<RecipeLine, "grams"> & { accent?: boolean })[],
  packGrams: number,
  pouches: number
): OrderRecipe {
  const grams = gramsPerPouch(items, packGrams);
  return {
    packGrams,
    pouches,
    lines: items.map((i, k) => {
      const line: RecipeLine & { accent?: boolean } = { ...i, grams: grams[k].grams };
      delete line.accent;
      return line;
    }),
  };
}

/** Reads a recipe stored as JSON on a Drop, dropping anything malformed. */
export function parseRecipeItems(value: unknown): RecipeItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is RecipeItem =>
        !!v && typeof v === "object" && typeof (v as RecipeItem).ingredientId === "string"
    )
    .map((v) => ({
      ingredientId: v.ingredientId,
      name: typeof v.name === "string" ? v.name : "",
      parts: Math.min(10, Math.max(1, Math.round(Number(v.parts) || 1))),
    }));
}

export function parseOrderRecipe(value: unknown): OrderRecipe | null {
  if (!value || typeof value !== "object") return null;
  const r = value as OrderRecipe;
  if (!Array.isArray(r.lines) || !r.lines.length) return null;
  return r;
}

/** One line per tea, for Stripe metadata (seen in the Stripe dashboard, not by customers). */
export function recipeText(r: OrderRecipe): string {
  return r.lines
    .map((l) => `${l.grams}g ${l.inventoryNo ? `#${l.inventoryNo} ` : ""}${l.name}`)
    .join("; ")
    .slice(0, 480);
}

export function packLabel(grams: number): string {
  const oz = grams / 28.35;
  const ozText = Math.abs(oz - Math.round(oz)) < 0.05 ? `${Math.round(oz)} oz` : `${oz.toFixed(1)} oz`;
  const cups = Math.max(1, Math.floor(grams / 2));
  return `${ozText} pouch (${grams} g), about ${cups} cups`;
}

/** Customer-facing caffeine text for a batch. */
export function batchCaffeine(value: string | null): string | null {
  switch ((value || "").toLowerCase()) {
    case "":
      return null;
    case "no":
      return "Caffeine free";
    case "low":
      return "Low caffeine";
    case "medium":
      return "Medium caffeine";
    case "high":
      return "High caffeine";
    case "yes":
      return "Caffeinated";
    case "may contain":
      return "Some caffeine";
    default:
      return value;
  }
}

/** Most whole orders-worth of pouches the stock can fill. Teas with no gram count never limit it. */
export const UNLIMITED = 999;
export function pouchesCovered(lines: { grams: number; stock: number | null }[]): number {
  let n = UNLIMITED;
  for (const l of lines) {
    if (l.stock == null || l.grams <= 0) continue;
    n = Math.min(n, Math.floor(l.stock / l.grams + 1e-9));
  }
  return Math.max(0, n);
}

/**
 * Grams per pouch for each tea in a recipe of parts. An accent (mix-only) tea gets ACCENT_GRAMS and the
 * other teas share the rest by parts. With no other tea to carry the pouch, accents fall back to parts.
 */
export function gramsPerPouch(items: { ingredientId?: string; parts: number; accent?: boolean }[], packGrams: number) {
  const accents = items.filter((i) => i.accent).length;
  const useAccent = accents > 0 && accents < items.length;
  const share = items.filter((i) => !useAccent || !i.accent);
  const total = share.reduce((s, i) => s + i.parts, 0) || 1;
  const rest = useAccent ? packGrams - ACCENT_GRAMS * accents : packGrams;
  return items.map((i) => ({
    ingredientId: i.ingredientId,
    grams: useAccent && i.accent ? ACCENT_GRAMS : roundHalf((rest * i.parts) / total),
  }));
}
