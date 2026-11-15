import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getMixRules, getMixSetting, getPublicTeas, snapshotRecipe } from "@/lib/teas";
import { validateMix } from "@/lib/mix";
import { parseRecipeItems, recipeText } from "@/lib/recipe";
import { parseSize, priceTiers, shippingFor, shippingOption, sizeLabel, type PackSize } from "@/lib/pricing";

/** Accepts ["id", ...] (older pages) or [{ id, parts }, ...]. Parts are 1 to 3. */
function parseMix(mix: unknown): { id: string; parts: number }[] | null {
  if (!Array.isArray(mix) || mix.length === 0 || mix.length > 10) return null;
  const out: { id: string; parts: number }[] = [];
  for (const x of mix) {
    if (typeof x === "string") out.push({ id: x, parts: 1 });
    else if (x && typeof x === "object" && typeof (x as { id: unknown }).id === "string") {
      const parts = Math.round(Number((x as { parts?: unknown }).parts) || 1);
      out.push({ id: (x as { id: string }).id, parts: Math.min(3, Math.max(1, parts)) });
    } else return null;
  }
  return out;
}

async function mixCheckout(req: NextRequest, mix: unknown, size: PackSize) {
  const wanted = parseMix(mix);
  if (!wanted) return NextResponse.json({ error: "Invalid mix." }, { status: 400 });
  const [teas, rules, setting] = await Promise.all([getPublicTeas(), getMixRules(), getMixSetting()]);
  const byId = new Map(teas.map((t) => [t.id, t]));
  const picked = wanted.map((w) => byId.get(w.id));
  if (picked.some((t) => !t)) {
    return NextResponse.json({ error: "One of those teas just went out of stock." }, { status: 400 });
  }
  const chosen = picked as NonNullable<(typeof picked)[number]>[];
  const problem = validateMix(chosen, rules, setting);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const recipe = await snapshotRecipe(
    chosen.map((t, i) => ({ ingredientId: t.id, name: t.name, parts: wanted[i].parts })),
    setting.packGrams,
    size
  );
  const amount = priceTiers(setting.price, setting.price3, setting.price5)[size];
  const names = chosen
    .map((t, i) => (wanted[i].parts > 1 ? `${t.name} (${wanted[i].parts} parts)` : t.name))
    .join(" + ");
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Custom Mysthérie mix, ${sizeLabel(size)}`,
            description: names.slice(0, 500),
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "mix",
      pouches: String(size),
      teaIds: chosen.map((t) => t.id).join(",").slice(0, 500),
      blend: recipe ? recipeText(recipe) : "",
    },
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [shippingOption(size)],
    success_url: `${origin}/success`,
    cancel_url: `${origin}/mix`,
  });

  await prisma.order.create({
    data: {
      dropId: null,
      mixItems: names,
      recipe: recipe ? (recipe as object) : undefined,
      quantity: size,
      stripeSessionId: session.id,
      totalAmount: amount + shippingFor(size),
      status: "pending",
    },
  });

  return NextResponse.json({ url: session.url });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const size = parseSize(body?.size ?? 1);
    if (!size) return NextResponse.json({ error: "Pick 1, 3 or 5 pouches." }, { status: 400 });
    if (body && body.mix !== undefined) return await mixCheckout(req, body.mix, size);

    const { dropId } = body;
    const quantity: number = size;

    if (!dropId) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const drop = await prisma.drop.findUnique({ where: { id: dropId } });

    if (!drop || !drop.isActive) {
      return NextResponse.json({ error: "Drop not found." }, { status: 404 });
    }

    if (drop.batchQuantityRemaining < quantity) {
      return NextResponse.json(
        { error: `Only ${drop.batchQuantityRemaining} pouches left in this batch.` },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "";
    const recipe = await snapshotRecipe(parseRecipeItems(drop.recipe), drop.packGrams || 28, quantity);
    const amount = priceTiers(drop.price, drop.price3, drop.price5)[size];

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${drop.name}, ${sizeLabel(size)}`,
              description: drop.vibeLine || "Mystery tea drop",
              images: drop.images.length > 0 ? [drop.images[0]] : [],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        dropId: drop.id,
        quantity: String(quantity),
        blend: recipe ? recipeText(recipe) : "",
      },
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [shippingOption(quantity)],
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
    });

    // Create pending order
    await prisma.order.create({
      data: {
        dropId: drop.id,
        quantity,
        recipe: recipe ? (recipe as object) : undefined,
        stripeSessionId: session.id,
        totalAmount: amount + shippingFor(quantity),
        status: "pending",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
