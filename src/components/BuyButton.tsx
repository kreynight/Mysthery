"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

interface BuyButtonProps {
  dropId: string;
  price: number;
  remaining: number;
}

export default function BuyButton({ dropId, price, remaining }: BuyButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const soldOut = remaining <= 0;
  const maxQty = Math.min(remaining, 10);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dropId, quantity }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!soldOut && maxQty > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-xs tracking-wide uppercase text-neutral-500">Qty</label>
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border border-neutral-300 px-3 py-2 text-sm bg-white"
          >
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        onClick={handleBuy}
        disabled={soldOut || loading}
        className={`w-full py-3.5 text-sm tracking-widest uppercase transition-colors ${
          soldOut
            ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`}
      >
        {loading
          ? "Processing..."
          : soldOut
          ? "Sold Out"
          : `Buy Now — ${formatPrice(price * quantity)}`}
      </button>
    </div>
  );
}
