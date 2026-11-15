import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getMixRules, getMixSetting, getPublicTeas } from "@/lib/teas";
import { validateMix } from "@/lib/mix";

async function mixCheckout(req: NextRequest, mix: unknown) {
  if (!Array.isArray(mix) || mix.length === 0 || mix.length > 10 || !mix.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "Invalid mix." }, { status: 400 });
  }
  const [teas, rules, setting] = await Promise.all([getPublicTeas(), getMixRules(), getMixSetting()]);
  const byId = new Map(teas.map((t) => [t.id, t]));
  const picked = (mix as string[]).map((id) => byId.get(id));
  if (picked.some((t) => !t)) {
    return NextResponse.json({ error: "One of those teas just went out of stock." }, { status: 400 });
  }
  const chosen = picked as NonNullable<(typeof picked)[number]>[];
  const problem = validateMix(chosen, rules, setting);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const names = chosen.map((t) => t.name).join(" + ");
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Custom Mysthérie mix",
            description: names.slice(0, 500),
          },
          unit_amount: setting.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "mix",
      teaIds: chosen.map((t) => t.id).join(",").slice(0, 500),
    },
    shipping_address_collection: { allowed_countries: ["US"] },
    success_url: `${origin}/success`,
    cancel_url: `${origin}/mix`,
  });

  await prisma.order.create({
    data: {
      dropId: null,
      mixItems: names,
      quantity: 1,
      stripeSessionId: session.id,
      totalAmount: setting.price,
      status: "pending",
    },
  });

  return NextResponse.json({ url: session.url });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body && body.mix !== undefined) return await mixCheckout(req, body.mix);

    const { dropId, quantity = 1 } = body;

    if (!dropId || quantity < 1 || quantity > 10) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const drop = await prisma.drop.findUnique({ where: { id: dropId } });

    if (!drop || !drop.isActive) {
      return NextResponse.json({ error: "Drop not found." }, { status: 404 });
    }

    if (drop.batchQuantityRemaining < quantity) {
      return NextResponse.json(
        { error: `Only ${drop.batchQuantityRemaining} remaining.` },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: drop.name,
              description: drop.vibeLine || "Mystery tea drop",
              images: drop.images.length > 0 ? [drop.images[0]] : [],
            },
            unit_amount: drop.price,
          },
          quantity,
        },
      ],
      metadata: {
        dropId: drop.id,
        quantity: String(quantity),
      },
      shipping_address_collection: { allowed_countries: ["US"] },
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
    });

    // Create pending order
    await prisma.order.create({
      data: {
        dropId: drop.id,
        quantity,
        stripeSessionId: session.id,
        totalAmount: drop.price * quantity,
        status: "pending",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
