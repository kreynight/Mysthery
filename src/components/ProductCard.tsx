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
}

export default function ProductCard({
  slug,
  name,
  price,
  remaining,
  vibeLine,
  image,
}: ProductCardProps) {
  const soldOut = remaining <= 0;

  return (
    <Link href={`/drop/${slug}`} className="group block">
      <div className="relative aspect-square bg-stone-200/50 overflow-hidden mb-3">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-6xl font-light">
            ?
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-[#f5f2ed]/70 flex items-center justify-center">
            <span className="text-sm tracking-widest uppercase text-stone-500">Sold Out</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-stone-800 mb-1">{name}</h3>
      <p className="text-sm text-stone-600 mb-1">{formatPrice(price)}</p>
      <p
        className={`text-xs tracking-wide uppercase ${
          soldOut ? "text-stone-400" : remaining <= 5 ? "text-[#8b6e4e] font-medium" : "text-[#3d4a3a]"
        }`}
      >
        {formatRemaining(remaining)}
      </p>
      {vibeLine && (
        <p className="text-xs text-stone-400 mt-1 italic">{vibeLine}</p>
      )}
    </Link>
  );
}
