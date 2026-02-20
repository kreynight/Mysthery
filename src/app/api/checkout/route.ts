import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { dropId, quantity = 1 } = await req.json();

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
