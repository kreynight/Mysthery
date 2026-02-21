import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Create tables using raw SQL — equivalent to `prisma db push`
    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS "Drop" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "price" INTEGER NOT NULL,
        "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "vibeLine" TEXT,
        "effectType" TEXT,
        "caffeine" TEXT,
        "tastingNotes" TEXT,
        "ingredientMayInclude" TEXT,
        "steepGuide" TEXT,
        "allergenNote" TEXT,
        "dropNotes" TEXT,
        "batchQuantityTotal" INTEGER NOT NULL,
        "batchQuantityRemaining" INTEGER NOT NULL,
        "dropStartDate" TIMESTAMP(3),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Drop_pkey" PRIMARY KEY ("id")
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "Drop_slug_key" ON "Drop"("slug");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "dropId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "email" TEXT,
        "stripeSessionId" TEXT NOT NULL,
        "stripePaymentId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "totalAmount" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Order_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "Drop"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InventoryIngredient" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "category" TEXT,
        "origin" TEXT,
        "notes" TEXT,
        "inStock" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InventoryIngredient_pkey" PRIMARY KEY ("id")
      );
    `);

    return NextResponse.json({
      ok: true,
      message: "Database tables created successfully.",
    });
  } catch (error) {
    console.error("Setup error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create tables: ${msg}` }, { status: 500 });
  }
}
