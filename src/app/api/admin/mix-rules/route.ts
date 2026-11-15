import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { deriveFamily, FAMILIES, TAGS } from "@/lib/mix";

const VALID_KEYS = new Set([...Object.keys(FAMILIES), ...Object.keys(TAGS)]);

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const [rules, setting, teas] = await Promise.all([
    prisma.mixRule.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.mixSetting.findUnique({ where: { id: "default" } }),
    prisma.inventoryIngredient.findMany({
      orderBy: { inventoryNo: "asc" },
      select: { id: true, inventoryNo: true, name: true, category: true, caffeineLevel: true, wellnessFunction: true, flavorNotes: true, mixFamily: true, inStock: true },
    }),
  ]);
  return NextResponse.json({
    rules,
    setting: setting || { id: "default", minTeas: 2, maxTeas: 3, price: 1600, isEnabled: true },
    teas: teas.map((t) => ({
      id: t.id,
      inventoryNo: t.inventoryNo,
      name: t.name,
      category: t.category,
      inStock: t.inStock,
      mixFamily: t.mixFamily,
      autoFamily: deriveFamily({ ...t, mixFamily: null }),
    })),
  });
}

// Actions: addRule, deleteRule, saveSetting, setFamily
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const body = await req.json();
    switch (body.action) {
      case "addRule": {
        const a = String(body.familyA || "");
        const b = String(body.familyB || "");
        if (!VALID_KEYS.has(a) || !(VALID_KEYS.has(b) || b === "*")) {
          return NextResponse.json({ error: "Pick two tea families." }, { status: 400 });
        }
        const rule = await prisma.mixRule.create({
          data: { familyA: a, familyB: b, reason: body.reason ? String(body.reason).slice(0, 300) : null },
        });
        return NextResponse.json(rule);
      }
      case "deleteRule": {
        await prisma.mixRule.delete({ where: { id: String(body.id) } });
        return NextResponse.json({ ok: true });
      }
      case "saveSetting": {
        const minTeas = Math.max(1, Math.min(6, Number(body.minTeas) || 2));
        const maxTeas = Math.max(minTeas, Math.min(6, Number(body.maxTeas) || 3));
        const price = Math.max(100, Math.min(100000, Math.round(Number(body.price) || 1600)));
        const data = { minTeas, maxTeas, price, isEnabled: !!body.isEnabled };
        const setting = await prisma.mixSetting.upsert({
          where: { id: "default" },
          update: data,
          create: { id: "default", ...data },
        });
        return NextResponse.json(setting);
      }
      case "setFamily": {
        const fam = body.mixFamily ? String(body.mixFamily) : null;
        if (fam && fam !== "none" && !(fam in FAMILIES)) {
          return NextResponse.json({ error: "Unknown family." }, { status: 400 });
        }
        await prisma.inventoryIngredient.update({ where: { id: String(body.id) }, data: { mixFamily: fam } });
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    console.error("Mix rules error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
