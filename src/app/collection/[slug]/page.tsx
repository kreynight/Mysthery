import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/ImageGallery";
import BuyButton from "@/components/BuyButton";
import { FlowerSprig } from "@/components/Botanicals";
import Link from "next/link";
import { formatPrice, formatRemaining } from "@/lib/format";
import { batchCaffeine, packLabel } from "@/lib/recipe";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function extractBatchNo(dropNotes: string | null): string | null {
  if (!dropNotes) return null;
  const match = dropNotes.match(/Batch\s*#?(\d+)/i);
  return match ? match[1] : null;
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;

  let drop;
  try {
    drop = await prisma.drop.findUnique({ where: { slug } });
  } catch {
    notFound();
  }

  if (!drop || !drop.isActive) notFound();

  const batchNo = extractBatchNo(drop.dropNotes);
  
  // Descriptive but never names the teas: the recipe stays in the admin.
  const caffeine = batchCaffeine(drop.caffeine);
  const highlights: { label: string; value: string }[] = [];
  if (drop.mood || drop.effectType) highlights.push({ label: "Mood", value: drop.mood || drop.effectType || "" });
  if (drop.flavorDirection || drop.tastingNotes)
    highlights.push({ label: "Flavor", value: drop.flavorDirection || drop.tastingNotes || "" });
  if (caffeine) highlights.push({ label: "Caffeine", value: caffeine });
  if (drop.bestTime) highlights.push({ label: "Best time", value: drop.bestTime });

  const details: { label: string; value: string }[] = [];
  details.push({ label: "Pouch", value: packLabel(drop.packGrams || 28) });
  details.push({ label: "Batch size", value: `${drop.batchQuantityTotal} pouches, then it's gone` });
  if (drop.tastingNotes && drop.flavorDirection) details.push({ label: "Tasting notes", value: drop.tastingNotes });
  if (drop.ingredientMayInclude) details.push({ label: "May include", value: drop.ingredientMayInclude });
  if (drop.steepGuide) details.push({ label: "Steep guide", value: drop.steepGuide });
  if (drop.allergenNote) details.push({ label: "Allergens", value: drop.allergenNote });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
        {/* Images */}
        <ImageGallery images={drop.images} name={drop.name} />

        {/* Info */}
        <div className="flex flex-col justify-start">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#7a5a3c] mb-2">
              {batchNo ? `Batch No. ${batchNo.padStart(3, "0")}` : "Limited batch"}
              {drop.effectType ? ` · ${drop.effectType}` : ""}
            </p>
            <FlowerSprig className="w-14 -mt-2 shrink-0" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-light text-[#2b3a28] mb-3">
            {drop.name}
          </h1>
          {drop.vibeLine && (
            <p className="text-base italic text-stone-500 mb-4">{drop.vibeLine}</p>
          )}
          {drop.description && (
            <p className="text-sm text-stone-600 leading-relaxed mb-5">{drop.description}</p>
          )}
          {highlights.length > 0 && (
            <dl className="grid grid-cols-2 gap-3 mb-6">
              {highlights.map((h) => (
                <div key={h.label} className="rounded-2xl bg-[#e1e9d6] px-4 py-3">
                  <dt className="text-[10px] tracking-[0.2em] uppercase text-[#7a5a3c]">{h.label}</dt>
                  <dd className="text-sm text-[#2b3a28] mt-0.5">{h.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-2xl font-medium text-[#5b4532]">{formatPrice(drop.price)}</span>
          </div>

          <p
            className={`text-sm tracking-wide uppercase mb-6 ${
              drop.batchQuantityRemaining <= 0
                ? "text-stone-400"
                : drop.batchQuantityRemaining <= 5
                ? "text-[#8b6e4e] font-medium"
                : "text-[#3d4a3a]"
            }`}
          >
            {formatRemaining(drop.batchQuantityRemaining)}
          </p>

          <BuyButton
            dropId={drop.id}
            price={drop.price}
            remaining={drop.batchQuantityRemaining}
          />

          {/* Detail items */}
          {details.length > 0 && (
            <div className="mt-10 border-t border-stone-200 pt-6 space-y-4">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between text-sm">
                  <span className="text-stone-500 uppercase tracking-wide text-xs">
                    {d.label}
                  </span>
                  <span className="text-stone-700 text-right max-w-[60%]">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/mix"
            className="mt-10 block rounded-2xl bg-[#e1e9d6] px-6 py-5 text-sm text-[#2b3a28] hover:bg-[#d3dec6] transition-colors"
          >
            <span className="font-display text-lg">Want one made for your mood?</span>
            <span className="block text-stone-500 mt-1">Try the mix generator.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
