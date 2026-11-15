import type { Prisma } from "@prisma/client";
import { parseRecipeItems } from "@/lib/recipe";

/** The batch fields the admin form can set, cleaned. */
export function dropFields(data: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    mood: str(data.mood),
    flavorDirection: str(data.flavorDirection),
    bestTime: str(data.bestTime),
    description: str(data.description),
    packGrams: Math.max(5, Math.min(500, Math.round(Number(data.packGrams) || 28))),
    recipe: parseRecipeItems(data.recipe) as unknown as Prisma.InputJsonValue,
  };
}
