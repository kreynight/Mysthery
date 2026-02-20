"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  origin: string | null;
  notes: string | null;
  inStock: boolean;
}

export default function AdminInventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    origin: "",
    notes: "",
    inStock: true,
  });

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
    setForm({ name: "", category: "", origin: "", notes: "", inStock: true });
    setShowForm(false);
    fetchIngredients();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-light tracking-wide text-neutral-900">Inventory</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Placeholder module — manage ingredient library for future use.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-neutral-900 text-white px-5 py-2.5 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors"
        >
          {showForm ? "Cancel" : "Add Ingredient"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="border border-neutral-200 p-4 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Category (herb, spice, tea...)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Origin"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              className="border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-neutral-900 text-white px-6 py-2 text-xs tracking-widest uppercase hover:bg-neutral-800"
          >
            Add
          </button>
        </form>
      )}

      {ingredients.length === 0 ? (
        <p className="text-sm text-neutral-400">No ingredients yet. Add some or run the seed script.</p>
      ) : (
        <div className="space-y-2">
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="border border-neutral-200 px-4 py-3 flex items-center justify-between"
            >
              <div>
                <span className="text-sm text-neutral-900">{ing.name}</span>
                {ing.category && (
                  <span className="text-xs text-neutral-400 ml-2">{ing.category}</span>
                )}
                {ing.origin && (
                  <span className="text-xs text-neutral-400 ml-2">&middot; {ing.origin}</span>
                )}
              </div>
              <span
                className={`text-xs ${
                  ing.inStock ? "text-green-600" : "text-neutral-400"
                }`}
              >
                {ing.inStock ? "In Stock" : "Out"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors">
          &larr; Back to dashboard
        </Link>
      </div>
    </div>
  );
}
