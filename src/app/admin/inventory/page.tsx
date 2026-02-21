"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Ingredient {
  id: string;
  inventoryNo: number | null;
  name: string;
  brand: string | null;
  teaNumber: string | null;
  category: string | null;
  ingredientsKey: string | null;
  flavorNotes: string | null;
  wellnessFunction: string | null;
  caffeineLevel: string | null;
  culturalRoots: string | null;
  format: string | null;
  verificationLevel: string | null;
  notes: string | null;
  inStock: boolean;
}

const EMPTY_FORM = {
  name: "",
  brand: "",
  teaNumber: "",
  category: "",
  ingredientsKey: "",
  flavorNotes: "",
  wellnessFunction: "",
  caffeineLevel: "",
  culturalRoots: "",
  format: "",
  notes: "",
  inStock: true,
};

const CATEGORY_OPTIONS = [
  "Herbal",
  "Black Tea",
  "Green Tea",
  "White Tea",
  "Rooibos",
  "Yerba Mate",
  "Pu-erh",
  "Oolong",
  "Spice Blend",
  "Specialty / Wellness",
];

const CAFFEINE_OPTIONS = ["None", "Low", "Medium", "High", "Decaf", "VERIFY_ON_PACK"];

export default function AdminInventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchIngredients = () => {
    fetch("/api/admin/inventory")
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/admin";
          return [];
        }
        return r.json();
      })
      .then((d) => setIngredients(d || []))
      .finally(() => setLoading(false));
  };

  useEffect(fetchIngredients, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    fetchIngredients();
  };

  const toggleStock = async (ing: Ingredient) => {
    await fetch("/api/admin/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ing.id, inStock: !ing.inStock }),
    });
    fetchIngredients();
  };

  const categories = [...new Set(ingredients.map((i) => i.category).filter(Boolean))];

  const filtered = ingredients.filter((ing) => {
    const matchesSearch =
      !filter ||
      ing.name.toLowerCase().includes(filter.toLowerCase()) ||
      (ing.flavorNotes || "").toLowerCase().includes(filter.toLowerCase()) ||
      (ing.brand || "").toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = !categoryFilter || ing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-light tracking-wide text-stone-800">Inventory</h1>
          <p className="text-xs text-stone-400 mt-1">
            {ingredients.length} ingredients &middot; {ingredients.filter((i) => i.inStock).length} in stock
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/batch-generator"
            className="border border-[#3d4a3a] text-[#3d4a3a] px-5 py-2.5 text-xs tracking-widest uppercase hover:bg-[#3d4a3a] hover:text-white transition-colors"
          >
            Generate Batch
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#3d4a3a] text-white px-5 py-2.5 text-xs tracking-widest uppercase hover:bg-[#2f3a2d] transition-colors"
          >
            {showForm ? "Cancel" : "Add Ingredient"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="border border-stone-200 p-5 mb-6 space-y-4">
          <p className="text-xs tracking-[0.2em] uppercase text-stone-400">New Ingredient</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            />
            <input
              type="text"
              placeholder="Brand"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            />
            <input
              type="text"
              placeholder="Tea Number"
              value={form.teaNumber}
              onChange={(e) => setForm({ ...form, teaNumber: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            >
              <option value="">Category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Flavor Notes"
              value={form.flavorNotes}
              onChange={(e) => setForm({ ...form, flavorNotes: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            />
            <input
              type="text"
              placeholder="Wellness Function"
              value={form.wellnessFunction}
              onChange={(e) => setForm({ ...form, wellnessFunction: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            />
            <select
              value={form.caffeineLevel}
              onChange={(e) => setForm({ ...form, caffeineLevel: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            >
              <option value="">Caffeine Level</option>
              {CAFFEINE_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Cultural Roots"
              value={form.culturalRoots}
              onChange={(e) => setForm({ ...form, culturalRoots: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            />
            <input
              type="text"
              placeholder="Ingredients Key"
              value={form.ingredientsKey}
              onChange={(e) => setForm({ ...form, ingredientsKey: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            />
            <input
              type="text"
              placeholder="Format (e.g. tea bags, loose leaf)"
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
              className="border border-stone-300 px-3 py-2 text-sm bg-transparent"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-stone-300 px-3 py-2 text-sm bg-transparent"
            rows={2}
          />
          <button
            type="submit"
            className="bg-[#3d4a3a] text-white px-6 py-2.5 text-xs tracking-widest uppercase hover:bg-[#2f3a2d] transition-colors"
          >
            Add Ingredient
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, flavor, or brand..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-stone-200 px-3 py-2 text-sm flex-1 bg-transparent"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-stone-200 px-3 py-2 text-sm bg-transparent"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c!}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-stone-400 py-8 text-center">
          {ingredients.length === 0
            ? "No ingredients yet. Add some or load sample data from the dashboard."
            : "No ingredients match your search."}
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((ing) => (
            <div key={ing.id} className="border border-stone-200/60">
              <div
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-stone-50/50 transition-colors"
                onClick={() => setExpanded(expanded === ing.id ? null : ing.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {ing.inventoryNo && (
                    <span className="text-[10px] text-stone-400 font-mono w-6 shrink-0">
                      #{ing.inventoryNo}
                    </span>
                  )}
                  <span className="text-sm text-stone-800 truncate">{ing.name}</span>
                  {ing.category && (
                    <span className="text-[10px] tracking-wider uppercase text-stone-400 bg-stone-100 px-2 py-0.5 shrink-0">
                      {ing.category}
                    </span>
                  )}
                  {ing.caffeineLevel && ing.caffeineLevel !== "None" && (
                    <span className="text-[10px] text-[#8b6e4e] shrink-0">
                      {ing.caffeineLevel} caffeine
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStock(ing);
                    }}
                    className={`text-[10px] tracking-wider uppercase px-2 py-1 border transition-colors ${
                      ing.inStock
                        ? "text-green-700 border-green-200 hover:bg-green-50"
                        : "text-stone-400 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {ing.inStock ? "In Stock" : "Out"}
                  </button>
                  <span className="text-stone-300 text-xs">{expanded === ing.id ? "−" : "+"}</span>
                </div>
              </div>

              {expanded === ing.id && (
                <div className="px-4 pb-4 border-t border-stone-100 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                    {ing.brand && <Detail label="Brand" value={ing.brand} />}
                    {ing.teaNumber && <Detail label="Tea #" value={ing.teaNumber} />}
                    {ing.flavorNotes && <Detail label="Flavor" value={ing.flavorNotes} />}
                    {ing.wellnessFunction && <Detail label="Wellness" value={ing.wellnessFunction} />}
                    {ing.culturalRoots && <Detail label="Origins" value={ing.culturalRoots} />}
                    {ing.ingredientsKey && <Detail label="Ingredients" value={ing.ingredientsKey} />}
                    {ing.format && <Detail label="Format" value={ing.format} />}
                    {ing.verificationLevel && <Detail label="Verification" value={ing.verificationLevel} />}
                    {ing.notes && <Detail label="Notes" value={ing.notes} />}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-800 transition-colors">
          &larr; Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-stone-400">{label}: </span>
      <span className="text-stone-600">{value}</span>
    </div>
  );
}
