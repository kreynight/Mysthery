"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EFFECT_TYPES, CAFFEINE_OPTIONS, BATCH_SIZE, PACK_GRAMS } from "@/lib/constants";
import { blockingRule, toPublicTea, type RuleLike } from "@/lib/mix";
import { buildOrderRecipe, packLabel, type RecipeItem } from "@/lib/recipe";

interface DropFormData {
  name: string;
  slug: string;
  price: string;
  price3: string;
  price5: string;
  images: string[];
  vibeLine: string;
  effectType: string;
  caffeine: string;
  tastingNotes: string;
  ingredientMayInclude: string;
  steepGuide: string;
  allergenNote: string;
  dropNotes: string;
  batchQuantityTotal: string;
  batchQuantityRemaining: string;
  dropStartDate: string;
  isActive: boolean;
  mood: string;
  flavorDirection: string;
  bestTime: string;
  description: string;
  packGrams: string;
  recipe: RecipeItem[];
}

interface InventoryRow {
  id: string;
  inventoryNo: number | null;
  name: string;
  brand: string | null;
  category: string | null;
  caffeineLevel: string | null;
  flavorNotes: string | null;
  wellnessFunction: string | null;
  mixFamily: string | null;
  inStock: boolean;
}

function RecipeEditor({
  value,
  packGrams,
  onChange,
}: {
  value: RecipeItem[];
  packGrams: number;
  onChange: (v: RecipeItem[]) => void;
}) {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [rules, setRules] = useState<RuleLike[]>([]);

  useEffect(() => {
    fetch("/api/admin/inventory")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setInventory(Array.isArray(d) ? d : []))
      .catch(() => setInventory([]));
    fetch("/api/admin/mix-rules")
      .then((r) => (r.ok ? r.json() : { rules: [] }))
      .then((d) => setRules(d.rules || []))
      .catch(() => setRules([]));
  }, []);

  const byId = useMemo(() => new Map(inventory.map((i) => [i.id, i])), [inventory]);
  const recipe = buildOrderRecipe(
    value.map((v) => ({ inventoryNo: byId.get(v.ingredientId)?.inventoryNo ?? null, name: v.name, brand: null, parts: v.parts })),
    packGrams,
    1
  );

  const warnings: string[] = [];
  const pub = value.map((v) => byId.get(v.ingredientId)).filter(Boolean).map((r) => toPublicTea(r as InventoryRow));
  for (let i = 0; i < pub.length; i++) {
    for (let j = i + 1; j < pub.length; j++) {
      const r = blockingRule(pub[i], pub[j], rules);
      if (r) warnings.push(`${pub[i].name} and ${pub[j].name} break a mix rule${r.reason ? `: ${r.reason}` : "."}`);
    }
  }
  for (const v of value) {
    const row = byId.get(v.ingredientId);
    if (row && !row.inStock) warnings.push(`${row.name} is marked out of stock.`);
  }

  const choices = inventory.filter((i) => i.inStock || value.some((v) => v.ingredientId === i.id));
  const update = (idx: number, patch: Partial<RecipeItem>) =>
    onChange(value.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  return (
    <div className="border border-stone-300 p-4 space-y-3 bg-stone-50">
      <p className="text-xs text-stone-500">
        Only you see this. Every order of this batch saves this recipe, so the Orders page tells you exactly what to
        blend.
      </p>
      {value.map((item, idx) => (
        <div key={idx} className="flex flex-wrap items-center gap-2">
          <select
            value={item.ingredientId}
            onChange={(e) => {
              const row = byId.get(e.target.value);
              if (row) update(idx, { ingredientId: row.id, name: row.name });
            }}
            className="flex-1 min-w-[12rem] border border-stone-300 px-3 py-2 text-sm bg-white"
          >
            {!byId.has(item.ingredientId) && <option value={item.ingredientId}>{item.name}</option>}
            {choices.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.inventoryNo} {c.name}
                {c.inStock ? "" : " (out of stock)"}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-stone-500">
            <input
              type="number"
              min={1}
              max={10}
              value={item.parts}
              onChange={(e) => update(idx, { parts: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
              className="w-16 border border-stone-300 px-2 py-2 text-sm bg-white"
            />
            parts
          </label>
          <span className="text-xs text-stone-600 w-14">{recipe.lines[idx]?.grams} g</span>
          <button type="button" onClick={() => onChange(value.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700">
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={choices.length === 0}
        onClick={() => {
          const first = choices.find((c) => !value.some((v) => v.ingredientId === c.id));
          if (first) onChange([...value, { ingredientId: first.id, name: first.name, parts: 1 }]);
        }}
        className="text-xs tracking-wide uppercase text-[#3d4a3a] underline underline-offset-2"
      >
        Add a tea
      </button>
      {warnings.map((w) => (
        <p key={w} className="text-xs text-orange-700">
          {w}
        </p>
      ))}
    </div>
  );
}

interface DropFormProps {
  initial?: Partial<DropFormData>;
  dropId?: string;
}

const defaultData: DropFormData = {
  name: "",
  slug: "",
  price: "",
  price3: "",
  price5: "",
  images: [],
  vibeLine: "",
  effectType: "",
  caffeine: "",
  tastingNotes: "",
  ingredientMayInclude: "",
  steepGuide: "",
  allergenNote: "",
  dropNotes: "",
  batchQuantityTotal: String(BATCH_SIZE),
  batchQuantityRemaining: String(BATCH_SIZE),
  dropStartDate: "",
  isActive: true,
  mood: "",
  flavorDirection: "",
  bestTime: "",
  description: "",
  packGrams: String(PACK_GRAMS),
  recipe: [],
};

export default function DropForm({ initial, dropId }: DropFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DropFormData>({ ...defaultData, ...initial });
  const [imageInput, setImageInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!dropId;

  const set = (field: keyof DropFormData, value: string | boolean | string[] | RecipeItem[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const autoSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (url && !form.images.includes(url)) {
      set("images", [...form.images, url]);
      setImageInput("");
    }
  };

  const removeImage = (idx: number) => {
    set(
      "images",
      form.images.filter((_, i) => i !== idx)
    );
  };

  const handleSizeChange = (total: string) => {
    set("batchQuantityTotal", total);
    if (!isEdit) set("batchQuantityRemaining", total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      price: Math.round(parseFloat(form.price) * 100), // dollars to cents
      price3: form.price3 ? Math.round(parseFloat(form.price3) * 100) : null,
      price5: form.price5 ? Math.round(parseFloat(form.price5) * 100) : null,
    };

    try {
      const url = isEdit ? `/api/admin/drops/${dropId}` : "/api/admin/drops";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save.");
      }

      router.push("/admin/drops");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</div>
      )}

      {/* Name + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!isEdit) set("slug", autoSlug(e.target.value));
            }}
            className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
            Slug *
          </label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Price + Batch Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
            1 pouch price (USD) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.50"
            required
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            className="w-full border border-stone-300 px-3 py-2.5 text-sm"
            placeholder="18.00"
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-[11px] uppercase tracking-wide text-stone-500">
              3 pouches
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={form.price3}
                onChange={(e) => set("price3", e.target.value)}
                className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm normal-case"
                placeholder="48.00"
              />
            </label>
            <label className="text-[11px] uppercase tracking-wide text-stone-500">
              5 pouches
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={form.price5}
                onChange={(e) => set("price5", e.target.value)}
                className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm normal-case"
                placeholder="72.00"
              />
            </label>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Shipping is $6 on 1 pouch and free on 3 or more.</p>
        </div>
        <div>
          <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
            Pouches in this batch *
          </label>
          <input
            type="number"
            min="1"
            max="500"
            required
            value={form.batchQuantityTotal}
            onChange={(e) => handleSizeChange(e.target.value)}
            className="w-full border border-stone-300 px-3 py-2.5 text-sm"
            placeholder={String(BATCH_SIZE)}
          />
        </div>
        {isEdit && (
          <div>
            <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
              Remaining
            </label>
            <input
              type="number"
              min="0"
              max={form.batchQuantityTotal}
              value={form.batchQuantityRemaining}
              onChange={(e) => set("batchQuantityRemaining", e.target.value)}
              className="w-full border border-stone-300 px-3 py-2.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* Vibe Line */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          Vibe Line (6-10 words)
        </label>
        <input
          type="text"
          value={form.vibeLine}
          onChange={(e) => set("vibeLine", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          placeholder="A quiet evening in a warm cup."
        />
      </div>

      {/* Descriptive, still mysterious */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">Mood</label>
          <input
            type="text"
            value={form.mood}
            onChange={(e) => set("mood", e.target.value)}
            className="w-full border border-stone-300 px-3 py-2.5 text-sm"
            placeholder="Unwinding"
          />
        </div>
        <div>
          <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">Best time</label>
          <input
            type="text"
            value={form.bestTime}
            onChange={(e) => set("bestTime", e.target.value)}
            className="w-full border border-stone-300 px-3 py-2.5 text-sm"
            placeholder="Evening, before bed"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">Flavor direction</label>
        <input
          type="text"
          value={form.flavorDirection}
          onChange={(e) => set("flavorDirection", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          placeholder="Floral and honeyed, soft finish"
        />
      </div>
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          Description (2 or 3 sentences, never name the teas)
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
        />
      </div>

      {/* Recipe (admin only) */}
      <div>
        <div className="flex items-end justify-between gap-4 mb-1">
          <label className="block text-xs tracking-wide uppercase text-stone-500">Recipe (private)</label>
          <label className="flex items-center gap-2 text-xs text-stone-500">
            Pouch grams
            <input
              type="number"
              min={5}
              max={500}
              value={form.packGrams}
              onChange={(e) => set("packGrams", e.target.value)}
              className="w-20 border border-stone-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <RecipeEditor
          value={form.recipe}
          packGrams={Number(form.packGrams) || PACK_GRAMS}
          onChange={(v) => set("recipe", v)}
        />
        <p className="text-xs text-stone-400 mt-1">{packLabel(Number(form.packGrams) || PACK_GRAMS)}</p>
      </div>

      {/* Images */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          Image URLs
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            className="flex-1 border border-stone-300 px-3 py-2.5 text-sm"
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={addImage}
            className="px-4 py-2.5 bg-[#3d4a3a] text-white text-xs tracking-wide uppercase hover:bg-[#2f3a2d]"
          >
            Add
          </button>
        </div>
        {form.images.length > 0 && (
          <div className="space-y-1">
            {form.images.map((img, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-stone-500 bg-stone-50 px-2 py-1.5"
              >
                <span className="truncate flex-1">{img}</span>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="text-red-500 hover:text-red-700 shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Effect + Caffeine */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
            Effect Type
          </label>
          <select
            value={form.effectType}
            onChange={(e) => set("effectType", e.target.value)}
            className="w-full border border-stone-300 px-3 py-2.5 text-sm bg-transparent"
          >
            <option value="">Select...</option>
            {EFFECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
            Caffeine
          </label>
          <select
            value={form.caffeine}
            onChange={(e) => set("caffeine", e.target.value)}
            className="w-full border border-stone-300 px-3 py-2.5 text-sm bg-transparent"
          >
            <option value="">Select...</option>
            {CAFFEINE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasting Notes */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          Tasting Notes
        </label>
        <input
          type="text"
          value={form.tastingNotes}
          onChange={(e) => set("tastingNotes", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          placeholder="Earthy, floral, hint of citrus"
        />
      </div>

      {/* Ingredient May Include */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          May Include (ingredient families)
        </label>
        <input
          type="text"
          value={form.ingredientMayInclude}
          onChange={(e) => set("ingredientMayInclude", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          placeholder="Green teas, herbs, dried flowers"
        />
      </div>

      {/* Steep Guide */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          Steep Guide
        </label>
        <input
          type="text"
          value={form.steepGuide}
          onChange={(e) => set("steepGuide", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          placeholder="200F / 3-5 min"
        />
      </div>

      {/* Allergen Note */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          Allergen Note
        </label>
        <input
          type="text"
          value={form.allergenNote}
          onChange={(e) => set("allergenNote", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          placeholder="Processed in a facility that handles nuts and citrus"
        />
      </div>

      {/* Collection Notes */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          Batch number (shown publicly)
        </label>
        <input
          type="text"
          value={form.dropNotes}
          onChange={(e) => set("dropNotes", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
          placeholder="Batch #001 Spring 2026"
        />
      </div>

      {/* Release Date */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-stone-500 mb-1">
          Release Date
        </label>
        <input
          type="date"
          value={form.dropStartDate}
          onChange={(e) => set("dropStartDate", e.target.value)}
          className="w-full border border-stone-300 px-3 py-2.5 text-sm"
        />
      </div>

      {/* Active */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm text-stone-700">Active (visible on site)</span>
      </label>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#3d4a3a] text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#2f3a2d] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Update Collection" : "Create Collection"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/drops")}
          className="px-8 py-3 text-xs tracking-widest uppercase border border-stone-200 hover:border-stone-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
