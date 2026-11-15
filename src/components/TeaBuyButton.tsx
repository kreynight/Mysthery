"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

/** One-tap checkout for a single pouch of a library tea. */
export default function TeaBuyButton({ teaId, price, label }: { teaId: string; price: number; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tea: teaId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Something went wrong.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        aria-label={`Buy ${label} for ${formatPrice(price)}`}
        className="rounded-full bg-[#3d4a3a] text-[#f5f7ef] px-3.5 py-2 text-xs font-semibold tracking-wide hover:bg-[#2b3a28] transition-colors disabled:opacity-70 min-h-[36px]"
      >
        {loading ? "..." : formatPrice(price).replace(".00", "")}
      </button>
      <p className="text-[10px] text-stone-400 mt-1">{label}</p>
      {error && <p className="text-[10px] text-[#8b3a2b] mt-1 max-w-[120px]">{error}</p>}
    </div>
  );
}
