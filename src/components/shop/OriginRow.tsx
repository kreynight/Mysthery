"use client";

import Flag from "@/components/shop/Flag";
import { setOrigin, useCart } from "@/lib/cart";

const LABEL: Record<string, string> = { UK: "England", USA: "USA" };

export default function OriginRow({ origins }: { origins: string[] }) {
  const { origin } = useCart();
  const pick = (c: string | null) => {
    setOrigin(c);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const all: (string | null)[] = [null, ...origins];

  return (
    <section id="origins" className="max-w-6xl mx-auto pt-10 md:pt-14 scroll-mt-20">
      <div className="px-5 flex items-end justify-between mb-5">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#7a5a3c] mb-1">Shop by origin</p>
          <h2 className="font-display text-3xl md:text-4xl text-[#2b3a28]">Where it grows</h2>
        </div>
      </div>
      <div className="flex gap-4 md:gap-7 overflow-x-auto px-5 pb-3 snap-x [scrollbar-width:none] md:justify-between">
        {all.map((country) => {
          const active = origin === country;
          return (
            <button
              key={country || "all"}
              type="button"
              onClick={() => pick(country)}
              aria-pressed={active}
              className="snap-start shrink-0 flex flex-col items-center gap-2 w-[76px] group"
            >
              <span
                className={`rounded-full p-1 transition-all ${
                  active ? "ring-2 ring-[#7a5a3c] ring-offset-2 ring-offset-[#eef2e6]" : "ring-1 ring-[#2b3a28]/15 group-hover:ring-[#7a5a3c]/60"
                }`}
              >
                <Flag country={country} size={60} className="block rounded-full" />
              </span>
              <span className="text-[13px] text-[#2b3a28] leading-tight">{country ? LABEL[country] || country : "All teas"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
