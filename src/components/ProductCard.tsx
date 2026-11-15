import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatRemaining } from "@/lib/format";

interface ProductCardProps {
  slug: string;
  name: string;
  price: number;
  remaining: number;
  vibeLine?: string | null;
  image?: string;
  batchNo?: string | null;
}

export default function ProductCard({
  slug,
  name,
  price,
  remaining,
  vibeLine,
  image,
  batchNo,
}: ProductCardProps) {
  const soldOut = remaining <= 0;

  return (
    <Link href={`/collection/${slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-stone-200 overflow-hidden rounded-2xl mb-4 ring-1 ring-stone-200">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-6xl font-light">
            ?
          </div>
        )}
        <div className="absolute inset-x-0 top-0 p-3 flex justify-between gap-2">
          {batchNo && (
            <span className="bg-[#f5f7ef]/95 text-[#2b3a28] text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full">
              No. {batchNo.padStart(3, "0")}
            </span>
          )}
          {!soldOut && (
            <span
              className={`ml-auto text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full ${
                remaining <= 5 ? "bg-[#7a5a3c] text-[#fbf6ef]" : "bg-[#2b3a28]/90 text-[#f5f7ef]"
              }`}
            >
              {formatRemaining(remaining)}
            </span>
          )}
        </div>
        {soldOut && (
          <div className="absolute inset-0 bg-[#2b3a28]/60 flex items-center justify-center">
            <span className="text-sm tracking-widest uppercase text-[#f5f7ef]">Sold Out</span>
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-[#2b3a28] mb-0.5">{name}</h3>
          {vibeLine && <p className="text-sm text-stone-500 italic">{vibeLine}</p>}
        </div>
        <p className="text-base font-medium text-[#5b4532] whitespace-nowrap">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}
