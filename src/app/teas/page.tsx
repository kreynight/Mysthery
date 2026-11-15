import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicTeas } from "@/lib/teas";
import { FAMILIES, FAMILY_ORDER, FAMILY_TINT, type PublicTea } from "@/lib/mix";
import { LeafSprig } from "@/components/Botanicals";
import { PHOTOS } from "@/lib/photos";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Tea Library | ${SITE_NAME}`,
  description: "Every tea and botanical on the Mysthérie shelf right now, from black and pu-erh to Haitian bush teas.",
};

function TeaCard({ tea }: { tea: PublicTea }) {
  const tint = FAMILY_TINT[tea.family] || "#55634a";
  return (
    <li className="rounded-2xl bg-[#f5f7ef] ring-1 ring-stone-200 px-5 py-4 flex items-start gap-3">
      <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tint }} aria-hidden="true" />
      <div className="min-w-0">
        <h3 className="font-display text-lg leading-snug text-[#2b3a28]">{tea.name}</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          {[tea.category, tea.note].filter(Boolean).join(" · ") || FAMILIES[tea.family]?.label}
        </p>
      </div>
    </li>
  );
}

export default async function TeaLibraryPage() {
  let teas: PublicTea[] = [];
  try {
    teas = await getPublicTeas();
  } catch {
    teas = [];
  }

  const groups = FAMILY_ORDER.map((f) => ({ family: f, teas: teas.filter((t) => t.family === f) })).filter(
    (g) => g.teas.length > 0
  );
  const known = new Set(FAMILY_ORDER);
  const other = teas.filter((t) => !known.has(t.family));
  if (other.length) groups.push({ family: "other", teas: other });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
      <section className="relative rounded-3xl overflow-hidden bg-[#3d4a3a] min-h-[280px] flex items-end mb-12">
        <Image src={PHOTOS.library} alt="" fill priority className="object-cover opacity-60" sizes="1150px" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e2a1c]/90 via-[#1e2a1c]/50 to-transparent" />
        <LeafSprig className="absolute right-6 top-4 w-24 opacity-70" color="#d3dec6" />
        <div className="relative p-8 md:p-12 max-w-xl">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#d9c3a5] mb-2">{teas.length} on the shelf</p>
          <h1 className="font-display text-4xl md:text-5xl font-light text-[#f5f7ef] mb-3">The tea library</h1>
          <p className="text-sm text-[#e3eadb] leading-relaxed">
            The teas on our shelf right now, by type. Browse them, then let the mix generator pour you something new.
          </p>
        </div>
      </section>

      {groups.length > 0 && (
        <nav aria-label="Tea families" className="flex flex-wrap gap-2 mb-12">
          {groups.map((g) => (
            <a
              key={g.family}
              href={`#${g.family}`}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-wide text-[#2b3a28] hover:bg-[#e1e9d6] transition-colors"
            >
              {FAMILIES[g.family]?.label || "Other"} · {g.teas.length}
            </a>
          ))}
          <Link
            href="/mix"
            className="rounded-full bg-[#3d4a3a] px-4 py-2 text-xs uppercase tracking-wide text-[#f5f7ef] hover:bg-[#2b3a28] transition-colors"
          >
            Make a mix
          </Link>
        </nav>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-stone-500 text-center py-16">The library is being restocked. Check back soon.</p>
      ) : (
        <div className="space-y-14">
          {groups.map((g) => (
            <section key={g.family} id={g.family} className="scroll-mt-6">
              <div className="flex items-baseline gap-4 mb-5 flex-wrap">
                <h2 className="font-display text-2xl md:text-3xl font-light text-[#2b3a28]">
                  {FAMILIES[g.family]?.label || "Other"}
                </h2>
                {FAMILIES[g.family] && <p className="text-sm text-stone-500">{FAMILIES[g.family].blurb}</p>}
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4">
                {g.teas.map((t) => (
                  <TeaCard key={t.id} tea={t} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
