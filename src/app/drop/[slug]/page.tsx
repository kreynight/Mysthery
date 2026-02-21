import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/ImageGallery";
import BuyButton from "@/components/BuyButton";
import Disclaimers from "@/components/Disclaimers";
import { formatPrice, formatRemaining } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DropPage({ params }: PageProps) {
  const { slug } = await params;

  let drop;
  try {
    drop = await prisma.drop.findUnique({ where: { slug } });
  } catch {
    notFound();
  }

  if (!drop || !drop.isActive) notFound();

  const details: { label: string; value: string }[] = [];
  if (drop.effectType) details.push({ label: "Effect", value: drop.effectType });
  if (drop.caffeine) details.push({ label: "Caffeine", value: drop.caffeine });
  if (drop.tastingNotes) details.push({ label: "Tasting Notes", value: drop.tastingNotes });
  if (drop.ingredientMayInclude)
    details.push({ label: "May Include", value: drop.ingredientMayInclude });
  if (drop.steepGuide) details.push({ label: "Steep Guide", value: drop.steepGuide });
  if (drop.allergenNote) details.push({ label: "Allergens", value: drop.allergenNote });
  if (drop.dropNotes) details.push({ label: "Drop Notes", value: drop.dropNotes });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
        {/* Images */}
        <ImageGallery images={drop.images} name={drop.name} />

        {/* Info */}
        <div className="flex flex-col justify-start">
          <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-2">
            Limited Drop
          </p>
          <h1 className="text-2xl md:text-3xl font-light tracking-wide text-neutral-900 mb-2">
            {drop.name}
          </h1>
          {drop.vibeLine && (
            <p className="text-sm italic text-neutral-400 mb-4">{drop.vibeLine}</p>
          )}

          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-xl text-neutral-900">{formatPrice(drop.price)}</span>
          </div>

          <p
            className={`text-sm tracking-wide uppercase mb-6 ${
              drop.batchQuantityRemaining <= 0
                ? "text-neutral-400"
                : drop.batchQuantityRemaining <= 5
                ? "text-amber-700 font-medium"
                : "text-neutral-500"
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
            <div className="mt-10 border-t border-neutral-200 pt-6 space-y-4">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between text-sm">
                  <span className="text-neutral-400 uppercase tracking-wide text-xs">
                    {d.label}
                  </span>
                  <span className="text-neutral-700 text-right max-w-[60%]">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <Disclaimers />
        </div>
      </div>
    </div>
  );
}
