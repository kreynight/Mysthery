import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Auto-backfill any ingredients missing an inventoryNo
    const missing = await prisma.inventoryIngredient.findMany({
      where: { inventoryNo: null },
      orderBy: { createdAt: "asc" },
    });
    if (missing.length > 0) {
      const maxResult = await prisma.inventoryIngredient.aggregate({
        _max: { inventoryNo: true },
      });
      let nextNo = (maxResult._max.inventoryNo || 0) + 1;
      for (const ing of missing) {
        await prisma.inventoryIngredient.update({
          where: { id: ing.id },
          data: { inventoryNo: nextNo },
        });
        nextNo++;
      }
    }

    const ingredients = await prisma.inventoryIngredient.findMany({
      orderBy: { inventoryNo: "asc" },
    });
    return NextResponse.json(ingredients);
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

    // Auto-assign next inventoryNo
    const maxResult = await prisma.inventoryIngredient.aggregate({
      _max: { inventoryNo: true },
    });
    const nextNo = (maxResult._max.inventoryNo || 0) + 1;

    const ingredient = await prisma.inventoryIngredient.create({
      data: {
        inventoryNo: nextNo,
        name: data.name,
        brand: data.brand || null,
        teaNumber: data.teaNumber || null,
        category: data.category || null,
        ingredientsKey: data.ingredientsKey || null,
        flavorNotes: data.flavorNotes || null,
        wellnessFunction: data.wellnessFunction || null,
        caffeineLevel: data.caffeineLevel || null,
        culturalRoots: data.culturalRoots || null,
        format: data.format || null,
        verificationLevel: data.verificationLevel || null,
        notes: data.notes || null,
        inStock: data.inStock ?? true,
      },
    });

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error("Create ingredient error:", error);
    return NextResponse.json({ error: "Failed to create ingredient." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { id, ...fields } = data;

    const ingredient = await prisma.inventoryIngredient.update({
      where: { id },
      data: fields,
    });

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error("Update ingredient error:", error);
    return NextResponse.json({ error: "Failed to update ingredient." }, { status: 500 });
  }
}
