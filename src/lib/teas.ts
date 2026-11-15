import { prisma } from "@/lib/prisma";
import { DEFAULT_RULES, toPublicTea, type MixSettingLike, type PublicTea, type RuleLike } from "@/lib/mix";

const DEFAULT_SETTING: MixSettingLike = { minTeas: 2, maxTeas: 3, price: 1600, isEnabled: true };

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
      culturalRoots: true,
      wellnessFunction: true,
      mixFamily: true,
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
    return s ? { minTeas: s.minTeas, maxTeas: s.maxTeas, price: s.price, isEnabled: s.isEnabled } : DEFAULT_SETTING;
  } catch {
    return DEFAULT_SETTING;
  }
}
