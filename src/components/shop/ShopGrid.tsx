"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Flag from "@/components/shop/Flag";
import { FAMILIES, type PublicTea } from "@/lib/mix";
import { formatPrice } from "@/lib/format";
import { addTea, setOrigin, useCart } from "@/lib/cart";
import type { TeaPhoto } from "@/lib/photos";

export type ShopTea = PublicTea & { photo: TeaPhoto };

const FIRST = 12;
const LABEL: Record<string, string> = { UK: "England" };

function price(cents: number) {
  return formatPrice(cents).replace(".00", "");
}

function Card({ tea, priority }: { tea: ShopTea; priority: boolean }) {
  const offer = tea.offer!;
  const [added, setAdded] = useState(false);
  const label = offer.tasting ? `${offer.grams} g tasting pouch` : "1 oz pouch";
  const add = () => {
    addTea({ teaId: tea.id, name: tea.name, label, price: offer.price, image: tea.photo.src.startsWith("/") ? tea.photo.src : tea.photo.src.replace("w=800", "w=200") });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };
  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#dfe6d3]">
        <Image
          src={tea.photo.src}
          alt={tea.photo.own ? `${tea.name} plant` : ""}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ objectPosition: tea.photo.position }}
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {offer.rare && <span className="rounded-full bg-[#7a5a3c] text-[#fbf6ef] text-[9.5px] tracking-wider uppercase px-2 py-1">Rare</span>}
          {offer.tasting && <span className="rounded-full bg-[#fbf6ef]/90 text-[#5b4532] text-[9.5px] tracking-wider uppercase px-2 py-1">Tasting size</span>}
        </div>
        {tea.country && (
          <span className="absolute top-2 right-2 rounded-full bg-[#fbf6ef]/90 p-0.5 shadow-sm" title={tea.country}>
            <Flag country={tea.country} size={22} className="block rounded-full" />
          </span>
        )}
        <button
          type="button"
          onClick={add}
          aria-label={`Add ${tea.name} to cart, ${price(offer.price)}`}
          className="absolute bottom-2 right-2 h-10 min-w-10 px-3 rounded-full bg-[#2b3a28] text-[#f5f7ef] text-xs font-semibold tracking-wide shadow-md hover:bg-[#1e2a1c] transition-colors"
        >
          {added ? "Added ✓" : "+ Add"}
        </button>
      </div>
      <div className="pt-2.5 px-0.5">
        <h3 className="text-[15px] leading-snug text-[#2b3a28] font-medium">{tea.name}</h3>
        <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
          {[tea.category, tea.note].filter(Boolean).join(" · ") || FAMILIES[tea.family]?.label}
        </p>
        <p className="text-sm text-[#5b4532] font-semibold mt-1">
          {price(offer.price)} <span className="text-[11px] font-normal text-stone-500">· {offer.tasting ? `${offer.grams} g` : "1 oz"}</span>
        </p>
      </div>
    </article>
  );
}

export default function ShopGrid({ teas }: { teas: ShopTea[] }) {
  const { origin } = useCart();
  const [family, setFamily] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const families = useMemo(() => {
    const seen = new Map<string, number>();
    for (const t of teas) if (!origin || t.country === origin) seen.set(t.family, (seen.get(t.family) || 0) + 1);
    return [...seen.entries()].filter(([f]) => FAMILIES[f] && f !== "unverified").sort((a, b) => b[1] - a[1]);
  }, [teas, origin]);

  const list = teas.filter((t) => (!origin || t.country === origin) && (!family || t.family === family));
  const shown = showAll ? list : list.slice(0, FIRST);

  return (
    <section id="shop" className="max-w-6xl mx-auto px-5 pt-12 md:pt-20 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#7a5a3c] mb-1">Single pouches</p>
          <h2 className="font-display text-3xl md:text-4xl text-[#2b3a28]">
            {origin ? `Teas from ${LABEL[origin] || origin}` : "Shop every tea"}
          </h2>
        </div>
        {origin && (
          <button type="button" onClick={() => setOrigin(null)} className="text-xs text-stone-600 underline underline-offset-2">
            Show all origins
          </button>
        )}
      </div>

      <div className="-mx-5 px-5 flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none]">
        {[{ key: null as string | null, label: "All" }, ...families.map(([f]) => ({ key: f, label: FAMILIES[f].label }))].map((c) => (
          <button
            key={c.key || "all"}
            type="button"
            aria-pressed={family === c.key}
            onClick={() => {
              setFamily(c.key);
              setShowAll(false);
            }}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] border transition-colors ${
              family === c.key ? "bg-[#2b3a28] text-[#f5f7ef] border-[#2b3a28]" : "border-[#2b3a28]/20 text-[#2b3a28] hover:border-[#2b3a28]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-stone-500 py-12 text-center">Nothing from here in this style right now.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-7 md:gap-x-5 md:gap-y-10">
          {shown.map((t, n) => (
            <Card key={t.id} tea={t} priority={n < 4} />
          ))}
        </div>
      )}

      {list.length > shown.length && (
        <div className="text-center mt-10">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-full border border-[#2b3a28] text-[#2b3a28] px-8 py-3.5 text-xs tracking-[0.2em] uppercase hover:bg-[#2b3a28] hover:text-[#f5f7ef] transition-colors"
          >
            View all {list.length} teas
          </button>
        </div>
      )}
    </section>
  );
}
