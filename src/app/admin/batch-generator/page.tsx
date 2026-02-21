"use client";

import { useState } from "react";
import Link from "next/link";

interface Ingredient {
  id: string;
  inventoryNo: number | null;
  name: string;
  brand: string | null;
  category: string | null;
  flavorNotes: string | null;
  wellnessFunction: string | null;
  caffeineLevel: string | null;
  culturalRoots: string | null;
}

interface BlendSuggestion {
  name: string;
  vibeLine: string;
  effectType: string;
  caffeine: string;
  tastingNotes: string;
  ingredientMayInclude: string;
  steepGuide: string;
  ingredients: Ingredient[];
}

export default function BatchGeneratorPage() {
  const [suggestions, setSuggestions] = useState<BlendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState<number | null>(null);
  const [created, setCreated] = useState<Record<number, string>>({});
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<BlendSuggestion>>({});

  const generate = async () => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    setCreated({});
    setEditIndex(null);

    try {
      const res = await fetch("/api/admin/generate-batch", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          window.location.href = "/admin";
          return;
        }
        setError(data.error || "Failed to generate.");
        return;
      }
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setError("Failed to connect.");
    } finally {
      setLoading(false);
    }
  };

  const createDrop = async (index: number) => {
    const suggestion = suggestions[index];
    const data = editIndex === index ? { ...suggestion, ...editForm } : suggestion;

    setCreating(index);
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const res = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          slug,
          price: 1499, // default $14.99
          images: [],
          vibeLine: data.vibeLine,
          effectType: data.effectType,
          caffeine: data.caffeine,
          tastingNotes: data.tastingNotes,
          ingredientMayInclude: data.ingredientMayInclude,
          steepGuide: data.steepGuide,
          allergenNote:
            "Contains botanicals. Cross-contact with herbs, spices, and citrus is possible.",
          dropNotes: `Generated batch — ${data.ingredients.map((i) => i.name).join(", ")}`,
          batchQuantityTotal: 50,
          isActive: false, // start inactive so admin can review
        }),
      });

      if (res.ok) {
        const drop = await res.json();
        setCreated({ ...created, [index]: drop.id });
        setEditIndex(null);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to create drop.");
      }
    } catch {
      setError("Failed to create drop.");
    } finally {
      setCreating(null);
    }
  };

  const startEdit = (index: number) => {
    const s = suggestions[index];
    setEditIndex(index);
    setEditForm({
      name: s.name,
      vibeLine: s.vibeLine,
      effectType: s.effectType,
      caffeine: s.caffeine,
      tastingNotes: s.tastingNotes,
      steepGuide: s.steepGuide,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-light tracking-wide text-stone-800">
            Batch Generator
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Generate mystery blend suggestions from your current inventory.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="bg-[#3d4a3a] text-white px-6 py-2.5 text-xs tracking-widest uppercase hover:bg-[#2f3a2d] transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : suggestions.length > 0 ? "Regenerate" : "Generate Blends"}
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {suggestions.length === 0 && !loading && !error && (
        <div className="text-center py-20 border border-stone-200/60">
          <p className="text-stone-400 text-sm mb-2">
            No suggestions yet.
          </p>
          <p className="text-stone-400 text-xs">
            Click &ldquo;Generate Blends&rdquo; to analyze your in-stock inventory
            and get mystery batch suggestions.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-20">
          <p className="text-stone-400 text-sm">
            Analyzing inventory and finding complementary blends...
          </p>
        </div>
      )}

      <div className="space-y-6">
        {suggestions.map((suggestion, i) => (
          <div
            key={i}
            className={`border transition-colors ${
              created[i]
                ? "border-green-300 bg-green-50/30"
                : "border-stone-200"
            }`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">
                    Suggestion {i + 1}
                  </p>
                  {editIndex === i ? (
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="text-lg font-light text-stone-800 border border-stone-300 px-2 py-1 bg-transparent w-full"
                    />
                  ) : (
                    <h2 className="text-lg font-light text-stone-800">
                      {suggestion.name}
                    </h2>
                  )}
                </div>
                {created[i] ? (
                  <Link
                    href={`/admin/drops/${created[i]}/edit`}
                    className="text-xs text-green-700 border border-green-300 px-3 py-1.5 hover:bg-green-100 transition-colors"
                  >
                    Edit Drop &rarr;
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    {editIndex !== i && (
                      <button
                        onClick={() => startEdit(i)}
                        className="text-xs text-stone-500 border border-stone-200 px-3 py-1.5 hover:border-stone-400 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {editIndex === i && (
                      <button
                        onClick={() => setEditIndex(null)}
                        className="text-xs text-stone-400 border border-stone-200 px-3 py-1.5 hover:border-stone-400 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => createDrop(i)}
                      disabled={creating === i}
                      className="text-xs text-white bg-[#3d4a3a] px-4 py-1.5 hover:bg-[#2f3a2d] transition-colors disabled:opacity-50"
                    >
                      {creating === i ? "Creating..." : "Create Drop"}
                    </button>
                  </div>
                )}
              </div>

              {editIndex === i ? (
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-stone-400">
                        Vibe Line
                      </label>
                      <input
                        type="text"
                        value={editForm.vibeLine || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, vibeLine: e.target.value })
                        }
                        className="w-full border border-stone-300 px-2 py-1.5 text-sm bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-stone-400">
                        Effect Type
                      </label>
                      <select
                        value={editForm.effectType || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            effectType: e.target.value,
                          })
                        }
                        className="w-full border border-stone-300 px-2 py-1.5 text-sm bg-transparent"
                      >
                        <option value="Calming">Calming</option>
                        <option value="Energizing">Energizing</option>
                        <option value="Balancing">Balancing</option>
                        <option value="Neutral">Neutral</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-stone-400">
                        Caffeine
                      </label>
                      <select
                        value={editForm.caffeine || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, caffeine: e.target.value })
                        }
                        className="w-full border border-stone-300 px-2 py-1.5 text-sm bg-transparent"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="MayContain">May Contain</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-stone-400">
                        Steep Guide
                      </label>
                      <input
                        type="text"
                        value={editForm.steepGuide || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            steepGuide: e.target.value,
                          })
                        }
                        className="w-full border border-stone-300 px-2 py-1.5 text-sm bg-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-stone-400">
                      Tasting Notes
                    </label>
                    <input
                      type="text"
                      value={editForm.tastingNotes || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          tastingNotes: e.target.value,
                        })
                      }
                      className="w-full border border-stone-300 px-2 py-1.5 text-sm bg-transparent"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-stone-500 italic mb-4">
                    &ldquo;{suggestion.vibeLine}&rdquo;
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs mb-4">
                    <div>
                      <span className="text-stone-400">Effect: </span>
                      <span className="text-stone-700">{suggestion.effectType}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Caffeine: </span>
                      <span className="text-stone-700">{suggestion.caffeine}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Steep: </span>
                      <span className="text-stone-700">{suggestion.steepGuide}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-stone-400">Tasting notes: </span>
                      <span className="text-stone-700">{suggestion.tastingNotes}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Ingredients used */}
              <div className="border-t border-stone-100 pt-3">
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-2">
                  Ingredients ({suggestion.ingredients.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestion.ingredients.map((ing) => (
                    <span
                      key={ing.id}
                      className="text-[11px] px-2.5 py-1 bg-stone-100 text-stone-600 border border-stone-200/60"
                    >
                      {ing.name}
                      {ing.category && (
                        <span className="text-stone-400 ml-1">
                          ({ing.category})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {created[i] && (
              <div className="bg-green-50 border-t border-green-200 px-5 py-2.5 text-xs text-green-700">
                Drop created (inactive). Go to the drop editor to add images, set price, and activate.
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/admin/inventory"
          className="text-xs text-stone-400 hover:text-stone-800 transition-colors"
        >
          &larr; Back to inventory
        </Link>
        <Link
          href="/admin"
          className="text-xs text-stone-400 hover:text-stone-800 transition-colors"
        >
          &larr; Dashboard
        </Link>
      </div>
    </div>
  );
}
