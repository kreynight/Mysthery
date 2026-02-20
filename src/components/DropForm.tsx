"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EFFECT_TYPES, CAFFEINE_OPTIONS } from "@/lib/constants";

interface DropFormData {
  name: string;
  slug: string;
  price: string;
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
}

interface DropFormProps {
  initial?: Partial<DropFormData>;
  dropId?: string;
}

const defaultData: DropFormData = {
  name: "",
  slug: "",
  price: "",
  images: [],
  vibeLine: "",
  effectType: "",
  caffeine: "",
  tastingNotes: "",
  ingredientMayInclude: "",
  steepGuide: "",
  allergenNote: "",
  dropNotes: "",
  batchQuantityTotal: "",
  batchQuantityRemaining: "",
  dropStartDate: "",
  isActive: true,
};

export default function DropForm({ initial, dropId }: DropFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DropFormData>({ ...defaultData, ...initial });
  const [imageInput, setImageInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!dropId;

  const set = (field: keyof DropFormData, value: string | boolean | string[]) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      price: Math.round(parseFloat(form.price) * 100), // dollars to cents
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
          <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
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
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
            Slug *
          </label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Price + Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
            Price (USD) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.50"
            required
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
            placeholder="12.00"
          />
        </div>
        <div>
          <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
            Batch Total *
          </label>
          <input
            type="number"
            min="1"
            required
            value={form.batchQuantityTotal}
            onChange={(e) => {
              set("batchQuantityTotal", e.target.value);
              if (!isEdit) set("batchQuantityRemaining", e.target.value);
            }}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          />
        </div>
        {isEdit && (
          <div>
            <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
              Remaining
            </label>
            <input
              type="number"
              min="0"
              value={form.batchQuantityRemaining}
              onChange={(e) => set("batchQuantityRemaining", e.target.value)}
              className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* Vibe Line */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
          Vibe Line (6-10 words)
        </label>
        <input
          type="text"
          value={form.vibeLine}
          onChange={(e) => set("vibeLine", e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          placeholder="A quiet evening in a warm cup."
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
          Image URLs
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            className="flex-1 border border-neutral-300 px-3 py-2.5 text-sm"
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={addImage}
            className="px-4 py-2.5 bg-neutral-900 text-white text-xs tracking-wide uppercase hover:bg-neutral-800"
          >
            Add
          </button>
        </div>
        {form.images.length > 0 && (
          <div className="space-y-1">
            {form.images.map((img, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 px-2 py-1.5"
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
          <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
            Effect Type
          </label>
          <select
            value={form.effectType}
            onChange={(e) => set("effectType", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm bg-white"
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
          <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
            Caffeine
          </label>
          <select
            value={form.caffeine}
            onChange={(e) => set("caffeine", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm bg-white"
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
        <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
          Tasting Notes
        </label>
        <input
          type="text"
          value={form.tastingNotes}
          onChange={(e) => set("tastingNotes", e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          placeholder="Earthy, floral, hint of citrus"
        />
      </div>

      {/* Ingredient May Include */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
          May Include (ingredient families)
        </label>
        <input
          type="text"
          value={form.ingredientMayInclude}
          onChange={(e) => set("ingredientMayInclude", e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          placeholder="Green teas, herbs, dried flowers"
        />
      </div>

      {/* Steep Guide */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
          Steep Guide
        </label>
        <input
          type="text"
          value={form.steepGuide}
          onChange={(e) => set("steepGuide", e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          placeholder="200°F / 3-5 min"
        />
      </div>

      {/* Allergen Note */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
          Allergen Note
        </label>
        <input
          type="text"
          value={form.allergenNote}
          onChange={(e) => set("allergenNote", e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          placeholder="Processed in a facility that handles nuts and citrus"
        />
      </div>

      {/* Drop Notes */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
          Drop Notes
        </label>
        <input
          type="text"
          value={form.dropNotes}
          onChange={(e) => set("dropNotes", e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          placeholder="Batch #001 — Spring 2026"
        />
      </div>

      {/* Drop Start Date */}
      <div>
        <label className="block text-xs tracking-wide uppercase text-neutral-500 mb-1">
          Drop Start Date
        </label>
        <input
          type="date"
          value={form.dropStartDate}
          onChange={(e) => set("dropStartDate", e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
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
        <span className="text-sm text-neutral-700">Active (visible on site)</span>
      </label>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-neutral-900 text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Update Drop" : "Create Drop"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/drops")}
          className="px-8 py-3 text-xs tracking-widest uppercase border border-neutral-200 hover:border-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
