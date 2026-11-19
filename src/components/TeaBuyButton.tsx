"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { addTea } from "@/lib/cart";

/** Adds a single pouch of a library tea to the cart. */
export default function TeaBuyButton({
  teaId,
  name,
  price,
  label,
  image,
}: {
  teaId: string;
  name: string;
  price: number;
  label: string;
  image?: string;
}) {
  const [added, setAdded] = useState(false);
  const add = () => {
    addTea({ teaId, name, label, price, image });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={add}
        aria-label={`Add ${name} to cart, ${formatPrice(price)}`}
        className="rounded-full bg-[#3d4a3a] text-[#f5f7ef] px-3.5 py-2 text-xs font-semibold tracking-wide hover:bg-[#2b3a28] transition-colors min-h-[36px]"
      >
        {added ? "Added ✓" : `+ ${formatPrice(price).replace(".00", "")}`}
      </button>
      <p className="text-[10px] text-stone-400 mt-1">{label}</p>
    </div>
  );
}
