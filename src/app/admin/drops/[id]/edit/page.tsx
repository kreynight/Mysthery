"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import DropForm from "@/components/DropForm";
import { parseRecipeItems } from "@/lib/recipe";

interface EditDropPageProps {
  params: Promise<{ id: string }>;
}

export default function EditDropPage({ params }: EditDropPageProps) {
  const { id } = use(params);
  const [drop, setDrop] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/drops/${id}`)
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/admin";
          return null;
        }
        return r.json();
      })
      .then((d) => setDrop(d))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!drop) return null;

  const initial = {
    name: drop.name as string,
    slug: drop.slug as string,
    price: ((drop.price as number) / 100).toFixed(2),
    price3: drop.price3 ? ((drop.price3 as number) / 100).toFixed(2) : "",
    price5: drop.price5 ? ((drop.price5 as number) / 100).toFixed(2) : "",
    images: (drop.images as string[]) || [],
    vibeLine: (drop.vibeLine as string) || "",
    effectType: (drop.effectType as string) || "",
    caffeine: (drop.caffeine as string) || "",
    tastingNotes: (drop.tastingNotes as string) || "",
    ingredientMayInclude: (drop.ingredientMayInclude as string) || "",
    steepGuide: (drop.steepGuide as string) || "",
    allergenNote: (drop.allergenNote as string) || "",
    dropNotes: (drop.dropNotes as string) || "",
    batchQuantityTotal: String(drop.batchQuantityTotal),
    batchQuantityRemaining: String(drop.batchQuantityRemaining),
    dropStartDate: drop.dropStartDate
      ? new Date(drop.dropStartDate as string).toISOString().split("T")[0]
      : "",
    isActive: drop.isActive as boolean,
    mood: (drop.mood as string) || "",
    flavorDirection: (drop.flavorDirection as string) || "",
    bestTime: (drop.bestTime as string) || "",
    description: (drop.description as string) || "",
    packGrams: String((drop.packGrams as number) || 28),
    recipe: parseRecipeItems(drop.recipe),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href="/admin/drops"
          className="text-xs text-stone-400 hover:text-stone-800 transition-colors"
        >
          &larr; Back to collections
        </Link>
      </div>
      <h1 className="text-xl font-light tracking-wide text-stone-800 mb-8">
        Edit: {drop.name as string}
      </h1>
      <DropForm initial={initial} dropId={id} />
    </div>
  );
}
