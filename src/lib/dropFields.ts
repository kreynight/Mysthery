import type { Prisma } from "@prisma/client";
import { parseRecipeItems } from "@/lib/recipe";

/** The batch fields the admin form can set, cleaned. */
export function dropFields(data: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const cents = (v: unknown) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= 50 ? Math.min(n, 500000) : null;
  };
  return {
    mood: str(data.mood),
    flavorDirection: str(data.flavorDirection),
    bestTime: str(data.bestTime),
    description: str(data.description),
    price3: cents(data.price3),
    price5: cents(data.price5),
    packGrams: Math.max(5, Math.min(500, Math.round(Number(data.packGrams) || 28))),
    recipe: parseRecipeItems(data.recipe) as unknown as Prisma.InputJsonValue,
  };
}
