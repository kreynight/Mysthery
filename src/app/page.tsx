import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { LeafSprig, FlowerSprig, VineDivider } from "@/components/Botanicals";
import { PHOTOS } from "@/lib/photos";
import { batchCaffeine } from "@/lib/recipe";
import { FREE_SHIP_FROM, SHIPPING_SINGLE, priceTiers, withRare } from "@/lib/pricing";
import { getRareIds, recipeHasRare } from "@/lib/teas";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

function extractBatchNo(dropNotes: string | null): string | null {
  if (!dropNotes) return null;
  const match = dropNotes.match(/Batch\s*#?(\d+)/i);
  return match ? match[1] : null;
}

export default async function Home() {
  let drops: Awaited<ReturnType<typeof prisma.drop.findMany>> = [];
  let teaCount = 0;
  let dbError = false;
  let rareIds = new Set<string>();

  try {
    [drops, teaCount, rareIds] = await Promise.all([
      prisma.drop.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
      prisma.inventoryIngredient.count({ where: { inStock: true } }),
      getRareIds(),
    ]);
  } catch {
    dbError = true;
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-8 md:pt-12">
          <div className="relative rounded-3xl overflow-hidden bg-[#2b3a28] min-h-[380px] md:min-h-[540px] flex items-end">
            <Image
              src={PHOTOS.hero}
              alt="A glass cup of tea surrounded by loose leaves and herbs"
              fill
              priority
              className="object-cover opacity-80"
              sizes="(max-width: 1200px) 100vw, 1150px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e2a1c]/90 via-[#1e2a1c]/40 to-transparent" />
            <LeafSprig className="absolute right-6 top-6 w-24 md:w-32 opacity-70" color="#d3dec6" />
            <div className="relative p-6 md:p-12 max-w-xl">
              <p className="text-[11px] tracking-[0.3em] uppercase text-[#d9c3a5] mb-3">
                Limited batches, now pouring
              </p>
              <h1 className="font-display text-4xl md:text-6xl font-light leading-[1.05] text-[#f5f7ef] mb-4">
                Pick a mood.<br />We pick the tea.
              </h1>
              <p className="text-sm md:text-base text-[#e3eadb] leading-relaxed mb-7 max-w-md">
                Mystery blends poured in tiny, numbered batches of about a dozen pouches. Each one
                is new, so you taste it before you know what&apos;s inside.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#batches"
                  className="inline-block rounded-full bg-[#f5f7ef] text-[#2b3a28] px-7 py-3.5 text-xs tracking-widest uppercase font-semibold hover:bg-white transition-colors"
                >
                  Shop the batches
                </a>
                <Link
                  href="/mix"
                  className="inline-block rounded-full border border-[#f5f7ef]/70 text-[#f5f7ef] px-7 py-3.5 text-xs tracking-widest uppercase font-semibold hover:bg-[#f5f7ef]/10 transition-colors"
                >
                  Make your own mix
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Batches */}
      <section id="batches" className="max-w-6xl mx-auto px-4 pt-10 md:pt-16 scroll-mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5 md:mb-8">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#7a5a3c] mb-1.5">The current pour</p>
            <h2 className="font-display text-2xl md:text-4xl font-light text-[#2b3a28]">Available batches</h2>
            <p className="text-xs text-stone-500 mt-1.5">
              1, 3 or 5 pouches of 1 oz each. Free shipping on {FREE_SHIP_FROM} or more, {formatPrice(SHIPPING_SINGLE)} on a single.
            </p>
          </div>
          <FlowerSprig className="w-20 hidden sm:block" />
        </div>

        {dbError ? (
          <p className="text-stone-500 text-sm py-16 text-center">
            The batches are being restocked. Check back shortly.
          </p>
        ) : drops.length === 0 ? (
          <p className="text-stone-500 text-sm py-16 text-center">No batches available right now. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {drops.map((drop) => (
              <ProductCard
                key={drop.id}
                slug={drop.slug}
                name={drop.name}
                tiers={withRare(priceTiers(drop.price, drop.price3, drop.price5), recipeHasRare(drop.recipe, rareIds))}
                rare={recipeHasRare(drop.recipe, rareIds)}
                remaining={drop.batchQuantityRemaining}
                total={drop.batchQuantityTotal}
                vibeLine={drop.vibeLine}
                image={drop.images[0]}
                batchNo={extractBatchNo(drop.dropNotes)}
                mood={drop.mood || drop.effectType}
                caffeine={batchCaffeine(drop.caffeine)}
              />
            ))}
          </div>
        )}
      </section>

      <VineDivider className="max-w-6xl mx-auto px-4 my-12 md:my-20" />

      {/* Make a mix + tea library */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <Link href="/mix" className="group relative rounded-3xl overflow-hidden min-h-[240px] md:min-h-[340px] flex items-end bg-[#5b4532]">
          <Image
            src={PHOTOS.mix}
            alt="Loose teas and dried herbs on wooden spoons"
            fill
            className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a1f15]/90 via-[#2a1f15]/30 to-transparent" />
          <div className="relative p-6 md:p-8">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#e5cfae] mb-2">Mix generator</p>
            <h3 className="font-display text-3xl font-light text-[#fbf6ef] mb-2">Make a mix</h3>
            <p className="text-sm text-[#efe6da] max-w-sm">
              Tap what you like, pull the lever, and get a one-of-a-kind blend made to order.
            </p>
          </div>
        </Link>
        <Link href="/teas" className="group relative rounded-3xl overflow-hidden min-h-[240px] md:min-h-[340px] flex items-end bg-[#3d4a3a]">
          <Image
            src={PHOTOS.library}
            alt="Assorted herbal teas and spices"
            fill
            className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e2a1c]/90 via-[#1e2a1c]/30 to-transparent" />
          <div className="relative p-6 md:p-8">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#d3dec6] mb-2">
              {teaCount > 0 ? `${teaCount} teas and botanicals` : "Teas and botanicals"}
            </p>
            <h3 className="font-display text-3xl font-light text-[#f5f7ef] mb-2">The tea library</h3>
            <p className="text-sm text-[#e3eadb] max-w-sm">
              Everything on our shelf right now: black, green, pu-erh, mate, herbal and Haitian bush teas.
            </p>
          </div>
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 mt-12 md:mt-20">
        <div className="relative rounded-3xl bg-[#e1e9d6] px-6 py-8 md:px-8 md:py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 overflow-hidden">
          <LeafSprig className="absolute -right-4 -bottom-10 w-32 opacity-50" />
          {[
            ["01", "Pick a mood", "Calming, energizing or balancing."],
            ["02", "We blend in small batches", "Teas from Yunnan and beyond, never the same twice."],
            ["03", "Unbox the mystery", "Steep it, sip it, and guess what's inside."],
          ].map(([n, t, d]) => (
            <div key={n} className="relative">
              <p className="text-xs font-semibold text-[#7a5a3c] mb-1">{n}</p>
              <p className="font-display text-xl text-[#2b3a28] mb-1">{t}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
