import { prisma } from "@/lib/prisma";
import { buildOrderRecipe, parseRecipeItems, type OrderRecipe, type RecipeItem } from "@/lib/recipe";
import { LOW_STOCK_GRAMS } from "@/lib/pricing";
import { DEFAULT_RULES, toPublicTea, type MixSettingLike, type PublicTea, type RuleLike } from "@/lib/mix";

const DEFAULT_SETTING: MixSettingLike = { minTeas: 2, maxTeas: 3, price: 1600, price3: null, price5: null, isEnabled: true, packGrams: 28 };

/** In-stock teas, with only the fields that are safe to show customers. */
export async function getPublicTeas(): Promise<PublicTea[]> {
  const rows = await prisma.inventoryIngredient.findMany({
    where: { inStock: true },
    orderBy: [{ inventoryNo: "asc" }],
    select: {
      id: true,
      inventoryNo: true,
      name: true,
      category: true,
      caffeineLevel: true,
      flavorNotes: true,
      wellnessFunction: true,
      mixFamily: true,
      culturalRoots: true,
      gramsOnHand: true,
      rare: true,
    },
  });
  return rows.map(toPublicTea);
}

export async function getMixRules(): Promise<RuleLike[]> {
  try {
    const rules = await prisma.mixRule.findMany({ orderBy: { createdAt: "asc" } });
    return rules.map((r) => ({ id: r.id, familyA: r.familyA, familyB: r.familyB, reason: r.reason }));
  } catch {
    return DEFAULT_RULES;
  }
}

export async function getMixSetting(): Promise<MixSettingLike> {
  try {
    const s = await prisma.mixSetting.findUnique({ where: { id: "default" } });
    return s
      ? { minTeas: s.minTeas, maxTeas: s.maxTeas, price: s.price, price3: s.price3, price5: s.price5, isEnabled: s.isEnabled, packGrams: s.packGrams || 28 }
      : DEFAULT_SETTING;
  } catch {
    return DEFAULT_SETTING;
  }
}

/**
 * Turns recipe parts into an order snapshot with grams per pouch, using the inventory's own records.
 * Unknown ids are kept with the name given so an order never loses a line.
 */
export async function snapshotRecipe(
  items: RecipeItem[],
  packGrams: number,
  pouches: number
): Promise<OrderRecipe | null> {
  if (!items.length) return null;
  const rows = await prisma.inventoryIngredient.findMany({
    where: { id: { in: items.map((i) => i.ingredientId) } },
    select: { id: true, inventoryNo: true, name: true, brand: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return buildOrderRecipe(
    items.map((i) => {
      const row = byId.get(i.ingredientId);
      return {
        ingredientId: i.ingredientId,
        inventoryNo: row?.inventoryNo ?? null,
        name: row?.name || i.name,
        brand: row?.brand || null,
        parts: i.parts,
      };
    }),
    packGrams,
    pouches
  );
}

/** Ids of teas that are low stock or marked rare. */
export async function getRareIds(): Promise<Set<string>> {
  try {
    const rows = await prisma.inventoryIngredient.findMany({
      where: { OR: [{ rare: true }, { gramsOnHand: { lt: LOW_STOCK_GRAMS } }] },
      select: { id: true },
    });
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

/** True when a batch recipe uses a rare tea. */
export function recipeHasRare(recipe: unknown, rareIds: Set<string>): boolean {
  return parseRecipeItems(recipe).some((i) => !!i.ingredientId && rareIds.has(i.ingredientId));
}
