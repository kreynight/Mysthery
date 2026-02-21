import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  let drops: Awaited<ReturnType<typeof prisma.drop.findMany>> = [];
  let dbError = false;

  try {
    drops = await prisma.drop.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    dbError = true;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-14">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-2">
          Limited Batches
        </p>
        <h1 className="text-2xl md:text-3xl font-light tracking-wide text-stone-800">
          Current Drops
        </h1>
        <p className="text-sm text-stone-400 mt-3 max-w-md mx-auto">
          {SITE_TAGLINE}
        </p>
      </div>

      {dbError ? (
        <div className="text-center py-20 max-w-md mx-auto">
          <p className="text-stone-800 text-sm font-medium mb-2">
            {SITE_NAME} is almost ready.
          </p>
          <p className="text-stone-400 text-sm mb-6">
            The database hasn&apos;t been set up yet. If you&apos;re the admin, go to the admin
            panel to create the tables and load sample data.
          </p>
          <Link
            href="/admin"
            className="inline-block border border-[#3d4a3a] px-6 py-2.5 text-xs tracking-widest uppercase text-[#3d4a3a] hover:bg-[#3d4a3a] hover:text-white transition-colors"
          >
            Go to Admin
          </Link>
        </div>
      ) : drops.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-400 text-sm">No drops available right now. Check back soon.</p>
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
