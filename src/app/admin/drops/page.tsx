"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Drop {
  id: string;
  name: string;
  slug: string;
  price: number;
  batchQuantityTotal: number;
  batchQuantityRemaining: number;
  isActive: boolean;
}

export default function AdminDropsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrops = () => {
    fetch("/api/admin/drops")
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/admin";
          return [];
        }
        return r.json();
      })
      .then((d) => setDrops(d || []))
      .finally(() => setLoading(false));
  };

  useEffect(fetchDrops, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/drops/${id}`, { method: "DELETE" });
    fetchDrops();
  };

  const toggleActive = async (drop: Drop) => {
    await fetch(`/api/admin/drops/${drop.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...drop, isActive: !drop.isActive }),
    });
    fetchDrops();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-light tracking-wide text-stone-800">Collections</h1>
        <Link
          href="/admin/drops/new"
          className="bg-[#3d4a3a] text-white px-5 py-2.5 text-xs tracking-widest uppercase hover:bg-[#2f3a2d] transition-colors"
        >
          New Collection
        </Link>
      </div>

      {drops.length === 0 ? (
        <p className="text-sm text-stone-400">No collections yet.</p>
      ) : (
        <div className="space-y-3">
          {drops.map((drop) => (
            <div
              key={drop.id}
              className="border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      drop.isActive ? "bg-green-500" : "bg-stone-300"
                    }`}
                  />
                  <h2 className="text-sm font-medium text-stone-800">{drop.name}</h2>
                </div>
                <p className="text-xs text-stone-400">
                  ${(drop.price / 100).toFixed(2)} &middot;{" "}
                  {drop.batchQuantityRemaining}/{drop.batchQuantityTotal} remaining
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(drop)}
                  className="text-xs px-3 py-1.5 border border-stone-200 hover:border-stone-400 transition-colors"
                >
                  {drop.isActive ? "Deactivate" : "Activate"}
                </button>
                <Link
                  href={`/admin/drops/${drop.id}/edit`}
                  className="text-xs px-3 py-1.5 border border-stone-200 hover:border-stone-400 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(drop.id, drop.name)}
                  className="text-xs px-3 py-1.5 border border-red-200 text-red-600 hover:border-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
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
