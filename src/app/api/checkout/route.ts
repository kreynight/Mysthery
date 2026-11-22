import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  batchPouchesLeft,
  getMixRules,
  getMixSetting,
  getPublicTeas,
  getRareIds,
  getStockMap,
  orderFitsStock,
  recipeHasRare,
  snapshotRecipe,
} from "@/lib/teas";
import { validateMix } from "@/lib/mix";
import { parseRecipeItems, recipeText, type OrderRecipe, type RecipeLine } from "@/lib/recipe";
import { parseSize, priceTiers, shippingFor, shippingOption, sizeLabel, withRare, type PackSize } from "@/lib/pricing";

const MIX_ONLY_ERROR = (name: string) =>
  `${name} is down to its last few grams, so it's only sold inside a Mysthérie mix. Remove it and blend it into a mix instead.`;

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
    chosen.map((t, i) => ({ ingredientId: t.id, name: t.name, parts: wanted[i].parts, accent: t.mixOnly })),
    setting.packGrams,
    size
  );
  if (!recipe || !orderFitsStock(recipe, await getStockMap())) {
    return NextResponse.json(
      { error: size > 1 ? "There isn't enough of these teas for that many pouches. Try fewer." : "One of those teas just ran low. Pull again." },
      { status: 400 }
    );
  }
  const amount = withRare(priceTiers(setting.price, setting.price3, setting.price5), chosen.some((t) => t.rare))[size];
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
    allow_promotion_codes: true,
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

async function teaCheckout(req: NextRequest, teaId: unknown) {
  if (typeof teaId !== "string") return NextResponse.json({ error: "Invalid tea." }, { status: 400 });
  const teas = await getPublicTeas();
  const tea = teas.find((t) => t.id === teaId);
  if (tea?.mixOnly) return NextResponse.json({ error: MIX_ONLY_ERROR(tea.name) }, { status: 400 });
  if (!tea || !tea.offer) {
    return NextResponse.json({ error: "That tea just sold out." }, { status: 400 });
  }
  const offer = tea.offer;
  const recipe = await snapshotRecipe([{ ingredientId: tea.id, name: tea.name, parts: 1 }], offer.grams, 1);
  const label = offer.tasting ? `${offer.grams} g tasting pouch` : "1 oz pouch";
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tea.name}, ${label}`,
            description: offer.rare ? "Rare, low-stock tea from the Mysthérie library" : "From the Mysthérie tea library",
          },
          unit_amount: offer.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "tea",
      teaId: tea.id,
      grams: String(offer.grams),
      blend: recipe ? recipeText(recipe) : "",
    },
    allow_promotion_codes: true,
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [shippingOption(1)],
    success_url: `${origin}/success`,
    cancel_url: `${origin}/teas`,
  });

  await prisma.order.create({
    data: {
      dropId: null,
      mixItems: `Single pouch: ${tea.name} (${offer.grams} g)`,
      recipe: recipe ? (recipe as object) : undefined,
      quantity: 1,
      stripeSessionId: session.id,
      totalAmount: offer.price + shippingFor(1),
      status: "pending",
    },
  });

  return NextResponse.json({ url: session.url });
}

// ---- A cart of single pouches and generated mixes, paid in one checkout ----

type CartInput =
  | { type: "tea"; id: string; qty: number }
  | { type: "mix"; mix: { id: string; parts: number }[]; size: PackSize; qty: number };

function parseCart(value: unknown): CartInput[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return null;
  const out: CartInput[] = [];
  for (const x of value) {
    if (!x || typeof x !== "object") return null;
    const v = x as Record<string, unknown>;
    const qty = Math.round(Number(v.qty) || 1);
    if (qty < 1 || qty > 5) return null;
    if (v.type === "tea" && typeof v.id === "string") out.push({ type: "tea", id: v.id, qty });
    else if (v.type === "mix") {
      const mix = parseMix(v.mix);
      const size = parseSize(v.size);
      if (!mix || !size) return null;
      out.push({ type: "mix", mix, size, qty });
    } else return null;
  }
  return out;
}

const roundHalf = (n: number) => Math.round(n * 2) / 2;

/** One recipe for the whole order: total grams of each tea, plus each item's own recipe for packing. */
function combineRecipes(parts: { label: string; recipe: OrderRecipe }[]): OrderRecipe {
  const totals = new Map<string, RecipeLine>();
  for (const { recipe } of parts) {
    for (const l of recipe.lines) {
      const key = l.ingredientId || `name:${l.name}`;
      const grams = l.grams * recipe.pouches;
      const prev = totals.get(key);
      totals.set(key, prev ? { ...prev, grams: prev.grams + grams } : { ...l, parts: 1, grams });
    }
  }
  const lines = [...totals.values()].map((l) => ({ ...l, grams: roundHalf(l.grams) }));
  return { packGrams: lines.reduce((s, l) => s + l.grams, 0), pouches: 1, lines, parts };
}

async function cartCheckout(req: NextRequest, value: unknown) {
  const cart = parseCart(value);
  if (!cart) return NextResponse.json({ error: "Your cart looks off. Try removing an item." }, { status: 400 });
  const [teas, rules, setting] = await Promise.all([getPublicTeas(), getMixRules(), getMixSetting()]);
  const byId = new Map(teas.map((t) => [t.id, t]));

  const lineItems: { name: string; description: string; amount: number; qty: number }[] = [];
  const parts: { label: string; recipe: OrderRecipe }[] = [];
  let pouches = 0;

  for (const item of cart) {
    if (item.type === "tea") {
      const tea = byId.get(item.id);
      if (tea?.mixOnly) return NextResponse.json({ error: MIX_ONLY_ERROR(tea.name) }, { status: 400 });
      if (!tea || !tea.offer) {
        return NextResponse.json({ error: `${tea?.name || "One of your teas"} just sold out. Remove it to continue.` }, { status: 400 });
      }
      const offer = tea.offer;
      const label = offer.tasting ? `${offer.grams} g tasting pouch` : "1 oz pouch";
      const recipe = await snapshotRecipe([{ ingredientId: tea.id, name: tea.name, parts: 1 }], offer.grams, item.qty);
      if (!recipe) return NextResponse.json({ error: "One of your teas just sold out." }, { status: 400 });
      parts.push({ label: `${item.qty} x ${tea.name} (${label})`, recipe });
      lineItems.push({
        name: `${tea.name}, ${label}`,
        description: offer.rare ? "Rare, low-stock tea from the Mysthérie library" : "From the Mysthérie tea library",
        amount: offer.price,
        qty: item.qty,
      });
      pouches += item.qty;
    } else {
      if (!setting.isEnabled) return NextResponse.json({ error: "Custom mixes are paused right now." }, { status: 400 });
      const picked = item.mix.map((w) => byId.get(w.id));
      if (picked.some((t) => !t)) {
        return NextResponse.json({ error: "A tea in one of your mixes just went out of stock. Remove the mix and pull again." }, { status: 400 });
      }
      const chosen = picked as NonNullable<(typeof picked)[number]>[];
      const problem = validateMix(chosen, rules, setting);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });
      const count = item.size * item.qty;
      const recipe = await snapshotRecipe(
        chosen.map((t, i) => ({ ingredientId: t.id, name: t.name, parts: item.mix[i].parts, accent: t.mixOnly })),
        setting.packGrams,
        count
      );
      if (!recipe) return NextResponse.json({ error: "One of your mixes couldn't be made." }, { status: 400 });
      const names = chosen.map((t, i) => (item.mix[i].parts > 1 ? `${t.name} (${item.mix[i].parts} parts)` : t.name)).join(" + ");
      parts.push({ label: `${item.qty} x custom mix, ${sizeLabel(item.size)}: ${names}`, recipe });
      lineItems.push({
        name: `Custom Mysthérie mix, ${sizeLabel(item.size)}`,
        description: names.slice(0, 500),
        amount: withRare(priceTiers(setting.price, setting.price3, setting.price5), chosen.some((t) => t.rare))[item.size],
        qty: item.qty,
      });
      pouches += count;
    }
  }

  const combined = combineRecipes(parts);
  if (!orderFitsStock(combined, await getStockMap())) {
    return NextResponse.json(
      { error: "We don't have enough tea on the shelf for all of that. Try fewer pouches of one item." },
      { status: 400 }
    );
  }

  const subtotal = lineItems.reduce((s, l) => s + l.amount * l.qty, 0);
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "";
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems.map((l) => ({
      price_data: {
        currency: "usd",
        product_data: { name: l.name, description: l.description },
        unit_amount: l.amount,
      },
      quantity: l.qty,
    })),
    metadata: {
      kind: "cart",
      pouches: String(pouches),
      blend: recipeText(combined),
    },
    allow_promotion_codes: true,
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [shippingOption(pouches)],
    success_url: `${origin}/success`,
    cancel_url: `${origin}/`,
  });

  await prisma.order.create({
    data: {
      dropId: null,
      mixItems: `Cart: ${parts.map((p) => p.label).join("; ")}`.slice(0, 2000),
      recipe: combined as object,
      quantity: pouches,
      stripeSessionId: session.id,
      totalAmount: subtotal + shippingFor(pouches),
      status: "pending",
    },
  });

  return NextResponse.json({ url: session.url });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body && body.cart !== undefined) return await cartCheckout(req, body.cart);
    const size = parseSize(body?.size ?? 1);
    if (!size) return NextResponse.json({ error: "Pick 1, 3 or 5 pouches." }, { status: 400 });
    if (body && body.tea !== undefined) return await teaCheckout(req, body.tea);
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

    const left = batchPouchesLeft(drop, await getStockMap());
    if (left < quantity) {
      return NextResponse.json(
        { error: left > 0 ? `Only ${left} ${left === 1 ? "pouch" : "pouches"} left in this batch.` : "This batch just sold out." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "";
    const recipe = await snapshotRecipe(parseRecipeItems(drop.recipe), drop.packGrams || 28, quantity);
    const amount = withRare(
      priceTiers(drop.price, drop.price3, drop.price5),
      recipeHasRare(drop.recipe, await getRareIds())
    )[size];

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
      allow_promotion_codes: true,
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
