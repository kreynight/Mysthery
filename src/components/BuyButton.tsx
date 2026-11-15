"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import SizePicker from "@/components/SizePicker";
import { FREE_SHIP_FROM, SHIPPING_SINGLE, type PackSize, type PriceTiers } from "@/lib/pricing";

interface BuyButtonProps {
  dropId: string;
  tiers: PriceTiers;
  remaining: number;
  initialSize?: PackSize;
}

export default function BuyButton({ dropId, tiers, remaining, initialSize = 1 }: BuyButtonProps) {
  const [size, setSize] = useState<PackSize>(initialSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const soldOut = remaining <= 0;

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dropId, size }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!soldOut && <SizePicker tiers={tiers} value={size} onChange={setSize} remaining={remaining} />}
      <button
        onClick={handleBuy}
        disabled={soldOut || loading}
        className={`w-full py-4 rounded-full text-sm tracking-widest uppercase transition-colors ${
          soldOut
            ? "bg-stone-200 text-stone-500 cursor-not-allowed"
            : "bg-[#3d4a3a] text-[#f5f7ef] hover:bg-[#2b3a28]"
        }`}
      >
        {loading ? "Processing..." : soldOut ? "Sold Out" : `Buy ${size === 1 ? "1 pouch" : `${size} pouches`} · ${formatPrice(tiers[size])}`}
      </button>
      {!soldOut && (
        <p className="text-xs text-stone-500 text-center">
          {size >= FREE_SHIP_FROM
            ? "Free shipping"
            : `${formatPrice(SHIPPING_SINGLE)} shipping. Free on ${FREE_SHIP_FROM} or more.`}
        </p>
      )}
      {error && <p className="text-sm text-[#8b3a2b] text-center">{error}</p>}
    </div>
  );
}
