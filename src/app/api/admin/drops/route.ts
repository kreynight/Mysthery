import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drops = await prisma.drop.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(drops);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    // Validate required fields
    if (!data.name || !data.slug || !data.price || !data.batchQuantityTotal) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const drop = await prisma.drop.create({
      data: {
        name: data.name,
        slug: data.slug,
        price: parseInt(data.price, 10),
        images: data.images || [],
        vibeLine: data.vibeLine || null,
        effectType: data.effectType || null,
        caffeine: data.caffeine || null,
        tastingNotes: data.tastingNotes || null,
        ingredientMayInclude: data.ingredientMayInclude || null,
        steepGuide: data.steepGuide || null,
        allergenNote: data.allergenNote || null,
        dropNotes: data.dropNotes || null,
        batchQuantityTotal: parseInt(data.batchQuantityTotal, 10),
        batchQuantityRemaining: parseInt(data.batchQuantityTotal, 10),
        dropStartDate: data.dropStartDate ? new Date(data.dropStartDate) : null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(drop);
  } catch (error) {
    console.error("Create drop error:", error);
    return NextResponse.json({ error: "Failed to create drop." }, { status: 500 });
  }
}
