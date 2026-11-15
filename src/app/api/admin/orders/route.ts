import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { snapshotRecipe } from "@/lib/teas";
import { buildOrderRecipe, parseOrderRecipe, parseRecipeItems, type OrderRecipe } from "@/lib/recipe";

type BlendSource = "order" | "batch" | "names" | "none";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: { drop: { select: { name: true, slug: true, recipe: true, packGrams: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Orders placed before recipes were recorded fall back to the batch's current recipe,
    // or to the tea names saved on a custom mix (equal parts).
    const out = await Promise.all(
      orders.map(async (o) => {
        let blend: OrderRecipe | null = parseOrderRecipe(o.recipe);
        let blendSource: BlendSource = blend ? "order" : "none";
        if (!blend && o.drop) {
          blend = await snapshotRecipe(parseRecipeItems(o.drop.recipe), o.drop.packGrams || 28, o.quantity);
          if (blend) blendSource = "batch";
        }
        if (!blend && o.mixItems) {
          const names = o.mixItems.split(" + ").map((n) => n.trim()).filter(Boolean);
          const rows = await prisma.inventoryIngredient.findMany({
            where: { name: { in: names } },
            select: { name: true, inventoryNo: true, brand: true },
          });
          const byName = new Map(rows.map((r) => [r.name, r]));
          blend = buildOrderRecipe(
            names.map((name) => ({
              name,
              inventoryNo: byName.get(name)?.inventoryNo ?? null,
              brand: byName.get(name)?.brand ?? null,
              parts: 1,
            })),
            28,
            o.quantity
          );
          blendSource = "names";
        }
        const { drop, recipe: _recipe, ...rest } = o;
        void _recipe;
        return { ...rest, drop: drop ? { name: drop.name, slug: drop.slug } : null, blend, blendSource };
      })
    );
    return NextResponse.json(out);
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json([]);
  }
}
