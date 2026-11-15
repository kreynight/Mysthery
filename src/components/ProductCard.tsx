import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { PACK_SIZES, type PriceTiers } from "@/lib/pricing";

interface ProductCardProps {
  slug: string;
  name: string;
  tiers: PriceTiers;
  remaining: number;
  total?: number;
  vibeLine?: string | null;
  image?: string;
  batchNo?: string | null;
  mood?: string | null;
  caffeine?: string | null;
}

/** Compact batch card: a row on phones, a short tile on larger screens. Sizes and prices at a glance. */
export default function ProductCard({
  slug,
  name,
  tiers,
  remaining,
  total,
  vibeLine,
  image,
  batchNo,
  mood,
  caffeine,
}: ProductCardProps) {
  const soldOut = remaining <= 0;
  const meta = [mood, caffeine].filter(Boolean).join(" · ");
  const href = `/collection/${slug}`;

  return (
    <article className="rounded-2xl bg-[#fbf8f2] ring-1 ring-stone-200 overflow-hidden flex sm:flex-col">
      <Link
        href={href}
        className="relative shrink-0 w-28 sm:w-full aspect-square sm:aspect-[16/10] bg-stone-200 overflow-hidden group"
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-4xl font-light">?</div>
        )}
        {batchNo && (
          <span className="absolute left-2 top-2 bg-[#f5f7ef]/95 text-[#2b3a28] text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full">
            No. {batchNo.padStart(3, "0")}
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-[#2b3a28]/60 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-[#f5f7ef]">Sold out</span>
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 p-3 sm:p-4 flex flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <Link href={href} className="min-w-0">
            <h3 className="font-display text-lg sm:text-xl text-[#2b3a28] leading-tight truncate">{name}</h3>
          </Link>
          {!soldOut && (
            <span
              className={`shrink-0 text-[10px] font-semibold tracking-wider uppercase ${
                remaining <= 5 ? "text-[#8b6e4e]" : "text-stone-500"
              }`}
            >
              {total ? `${remaining}/${total} left` : `${remaining} left`}
            </span>
          )}
        </div>
        {meta && <p className="text-xs text-stone-500 mt-0.5 truncate">{meta}</p>}
        {vibeLine && <p className="hidden sm:block text-sm text-stone-500 italic mt-1 line-clamp-1">{vibeLine}</p>}

        <div className="mt-auto pt-2.5 grid grid-cols-3 gap-1.5">
          {PACK_SIZES.map((size) => {
            const off = soldOut || size > remaining;
            const cls = `rounded-xl border text-center py-1.5 leading-tight ${
              off
                ? "border-stone-200 text-stone-300 pointer-events-none"
                : "border-stone-300 text-[#2b3a28] hover:border-[#2b3a28] hover:bg-[#e1e9d6] transition-colors"
            }`;
            return (
              <Link key={size} href={`${href}?size=${size}`} aria-disabled={off} className={cls}>
                <span className="block text-[10px] uppercase tracking-wider text-stone-500">
                  {size === 1 ? "1 pouch" : `${size} pack`}
                </span>
                <span className="block text-sm font-semibold">{formatPrice(tiers[size]).replace(".00", "")}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </article>
  );
}
