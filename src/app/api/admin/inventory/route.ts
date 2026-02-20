import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ingredients = await prisma.inventoryIngredient.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(ingredients);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    const ingredient = await prisma.inventoryIngredient.create({
      data: {
        name: data.name,
        category: data.category || null,
        origin: data.origin || null,
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
