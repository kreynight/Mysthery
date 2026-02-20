import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { SITE_TAGLINE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Home() {
  const drops = await prisma.drop.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-14">
        <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-2">
          Limited Batches
        </p>
        <h1 className="text-2xl md:text-3xl font-light tracking-wide text-neutral-900">
          Current Drops
        </h1>
        <p className="text-sm text-neutral-400 mt-3 max-w-md mx-auto">
          {SITE_TAGLINE}
        </p>
      </div>

      {drops.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-400 text-sm">No drops available right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {drops.map((drop) => (
            <ProductCard
              key={drop.id}
              slug={drop.slug}
              name={drop.name}
              price={drop.price}
              remaining={drop.batchQuantityRemaining}
              vibeLine={drop.vibeLine}
              image={drop.images[0]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
