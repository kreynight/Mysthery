import type { Metadata } from "next";
import Image from "next/image";
import { getPublicTeas } from "@/lib/teas";
import type { PublicTea } from "@/lib/mix";
import { LeafSprig } from "@/components/Botanicals";
import { PHOTOS } from "@/lib/photos";
import { SITE_NAME } from "@/lib/constants";
import TeaLibrary from "@/components/TeaLibrary";
import { formatPrice } from "@/lib/format";
import { SHIPPING_SINGLE, TEA_PRICE } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Tea Library | ${SITE_NAME}`,
  description: "Every tea and botanical on the Mysthérie shelf right now, from black and pu-erh to Haitian bush teas.",
};

export default async function TeaLibraryPage() {
  let teas: PublicTea[] = [];
  try {
    teas = await getPublicTeas();
  } catch {
    teas = [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
      <section className="relative rounded-3xl overflow-hidden bg-[#3d4a3a] min-h-[200px] md:min-h-[280px] flex items-end mb-6 md:mb-10">
        <Image src={PHOTOS.library} alt="" fill priority className="object-cover opacity-60" sizes="1150px" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e2a1c]/90 via-[#1e2a1c]/50 to-transparent" />
        <LeafSprig className="absolute right-6 top-4 w-24 opacity-70" color="#d3dec6" />
        <div className="relative p-6 md:p-12 max-w-xl">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#d9c3a5] mb-2">{teas.length} on the shelf</p>
          <h1 className="font-display text-3xl md:text-5xl font-light text-[#f5f7ef] mb-2 md:mb-3">The tea library</h1>
          <p className="text-sm text-[#e3eadb] leading-relaxed">
            The teas on our shelf right now, by type. Buy a single pouch of any of them, or let the mix generator
            pour you something new.
          </p>
        </div>
      </section>

      <p className="text-xs text-stone-500 mb-2">
        Single pouches from {formatPrice(TEA_PRICE)}. Rare, low-stock teas come as small tasting pouches.{" "}
        {formatPrice(SHIPPING_SINGLE)} shipping.
      </p>

      {teas.length === 0 ? (
        <p className="text-sm text-stone-500 text-center py-16">The library is being restocked. Check back soon.</p>
      ) : (
        <TeaLibrary teas={teas} />
      )}
    </div>
  );
}
