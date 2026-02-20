import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const drop = await prisma.drop.findUnique({ where: { id } });
  if (!drop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(drop);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await req.json();

    const drop = await prisma.drop.update({
      where: { id },
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
        batchQuantityRemaining: parseInt(data.batchQuantityRemaining, 10),
        dropStartDate: data.dropStartDate ? new Date(data.dropStartDate) : null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(drop);
  } catch (error) {
    console.error("Update drop error:", error);
    return NextResponse.json({ error: "Failed to update drop." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.drop.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete drop error:", error);
    return NextResponse.json({ error: "Failed to delete drop." }, { status: 500 });
  }
}
