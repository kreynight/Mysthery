"use client";

import { formatPrice } from "@/lib/format";
import { PACK_SIZES, FREE_SHIP_FROM, perPouch, type PackSize, type PriceTiers } from "@/lib/pricing";

interface SizePickerProps {
  tiers: PriceTiers;
  value: PackSize;
  onChange: (size: PackSize) => void;
  remaining?: number;
  dark?: boolean;
}

/** Three tap targets: 1, 3 or 5 pouches, each with its price. */
export default function SizePicker({ tiers, value, onChange, remaining = Infinity, dark = false }: SizePickerProps) {
  return (
    <div role="radiogroup" aria-label="How many pouches" className="grid grid-cols-3 gap-2">
      {PACK_SIZES.map((size) => {
        const disabled = size > remaining;
        const active = value === size;
        const base = dark
          ? active
            ? "bg-[#f5f7ef] text-[#2b3a28] border-[#f5f7ef]"
            : "bg-transparent text-[#f5f7ef] border-[#f5f7ef]/40"
          : active
          ? "bg-[#2b3a28] text-[#f5f7ef] border-[#2b3a28]"
          : "bg-[#fbf8f2] text-[#2b3a28] border-stone-300";
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(size)}
            className={`relative rounded-2xl border px-2 py-3 text-center transition-colors min-h-[72px] ${base} ${
              disabled ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            {size === 5 && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#7a5a3c] text-[#fbf6ef] text-[9px] tracking-wider uppercase px-2 py-0.5">
                Best value
              </span>
            )}
            <span className="block text-[11px] tracking-wider uppercase opacity-80">
              {size === 1 ? "1 pouch" : `${size} pouches`}
            </span>
            <span className="block text-base font-semibold mt-0.5">{formatPrice(tiers[size])}</span>
            {size > 1 && (
              <span className="block text-[10px] opacity-70">{formatPrice(perPouch(tiers, size))} each</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
