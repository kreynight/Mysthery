"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TeaBuyButton from "@/components/TeaBuyButton";
import { FAMILIES, FAMILY_ORDER, FAMILY_TINT, type PublicTea } from "@/lib/mix";

type Sort = "type" | "price-low" | "price-high" | "name";
type Caffeine = "any" | "none" | "some" | "high";

const SORTS: { key: Sort; label: string }[] = [
  { key: "type", label: "By type" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
  { key: "name", label: "Name" },
];

const CAFFEINE: { key: Caffeine; label: string }[] = [
  { key: "any", label: "Any caffeine" },
  { key: "none", label: "Caffeine free" },
  { key: "some", label: "A little" },
  { key: "high", label: "Full kick" },
];

function caffeineMatch(t: PublicTea, c: Caffeine): boolean {
  if (c === "any") return true;
  if (c === "none") return t.caffeineTier === "none";
  if (c === "high") return t.caffeineTier === "high";
  return t.caffeineTier === "low" || t.caffeineTier === "medium";
}

/** The shelf with a few light controls: sort, country and caffeine. */
export default function TeaLibrary({ teas }: { teas: PublicTea[] }) {
  const [sort, setSort] = useState<Sort>("type");
  const [country, setCountry] = useState("all");
  const [caffeine, setCaffeine] = useState<Caffeine>("any");

  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of teas) if (t.country) counts.set(t.country, (counts.get(t.country) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [teas]);

  const shown = useMemo(
    () => teas.filter((t) => (country === "all" || t.country === country) && caffeineMatch(t, caffeine)),
    [teas, country, caffeine]
  );

  const filtered = country !== "all" || caffeine !== "any";
  const grouped = sort === "type";

  const groups = useMemo(() => {
    const out = FAMILY_ORDER.map((f) => ({ family: f, teas: shown.filter((t) => t.family === f) })).filter(
      (g) => g.teas.length > 0
    );
    const known = new Set(FAMILY_ORDER);
    const other = shown.filter((t) => !known.has(t.family));
    if (other.length) out.push({ family: "other", teas: other });
    return out;
  }, [shown]);

  const flat = useMemo(() => {
    const price = (t: PublicTea) => t.offer?.price ?? Number.POSITIVE_INFINITY;
    const list = [...shown];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-low") list.sort((a, b) => price(a) - price(b) || a.name.localeCompare(b.name));
    if (sort === "price-high")
      list.sort((a, b) => {
        // Sold out teas stay at the bottom either way.
        if (!a.offer || !b.offer) return (a.offer ? 0 : 1) - (b.offer ? 0 : 1);
        return b.offer.price - a.offer.price || a.name.localeCompare(b.name);
      });
    return list;
  }, [shown, sort]);

  const select =
    "w-full min-w-0 appearance-none rounded-full border border-stone-300 bg-[#fbf8f2] pl-3 pr-7 py-2 text-xs text-[#2b3a28] focus:outline-none focus:ring-2 focus:ring-[#3d4a3a]/30";

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2.5 mb-4 md:mb-6 bg-[#eef2e6]/95 backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-2 max-w-xl">
          <Picker label="Sort" value={sort} onChange={(v) => setSort(v as Sort)} className={select}>
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Picker>
          <Picker label="Country" value={country} onChange={setCountry} className={select}>
            <option value="all">All countries</option>
            {countries.map(([c]) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Picker>
          <Picker label="Caffeine" value={caffeine} onChange={(v) => setCaffeine(v as Caffeine)} className={select}>
            {CAFFEINE.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Picker>
        </div>
        {(filtered || !grouped) && (
          <p className="mt-2 text-[11px] text-stone-500">
            <button
              type="button"
              onClick={() => {
                setSort("type");
                setCountry("all");
                setCaffeine("any");
              }}
              className="underline underline-offset-2 hover:text-[#2b3a28]"
            >
              Clear filters
            </button>
          </p>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-stone-500 text-center py-12">No teas match that. Try another country or caffeine level.</p>
      ) : grouped ? (
        <>
          {!filtered && (
            <nav aria-label="Tea families" className="hidden sm:flex flex-wrap gap-2 mb-8 md:mb-12">
              {groups.map((g) => (
                <a
                  key={g.family}
                  href={`#${g.family}`}
                  className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-wide text-[#2b3a28] hover:bg-[#e1e9d6] transition-colors"
                >
                  {FAMILIES[g.family]?.label || "Other"}
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
          <div className="space-y-10 md:space-y-14">
            {groups.map((g) => (
              <section key={g.family} id={g.family} className="scroll-mt-16">
                <div className="flex items-baseline gap-4 mb-4 md:mb-5 flex-wrap">
                  <h2 className="font-display text-2xl md:text-3xl font-light text-[#2b3a28]">
                    {FAMILIES[g.family]?.label || "Other"}
                  </h2>
                  {FAMILIES[g.family] && <p className="text-sm text-stone-500">{FAMILIES[g.family].blurb}</p>}
                </div>
                <TeaGrid teas={g.teas} />
              </section>
            ))}
          </div>
        </>
      ) : (
        <TeaGrid teas={flat} />
      )}
    </>
  );
}

function Picker({
  label,
  value,
  onChange,
  className,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
        {children}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-stone-400">
        ▼
      </span>
    </label>
  );
}

function TeaGrid({ teas }: { teas: PublicTea[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4">
      {teas.map((t) => (
        <TeaCard key={t.id} tea={t} />
      ))}
    </ul>
  );
}

function TeaCard({ tea }: { tea: PublicTea }) {
  const tint = FAMILY_TINT[tea.family] || "#55634a";
  const offer = tea.offer;
  return (
    <li className="rounded-2xl bg-[#f5f7ef] ring-1 ring-stone-200 px-4 py-3.5 md:px-5 md:py-4 flex items-start gap-3">
      <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tint }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg leading-snug text-[#2b3a28]">{tea.name}</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          {[tea.category, tea.note].filter(Boolean).join(" · ") || FAMILIES[tea.family]?.label}
        </p>
        <p className="mt-1.5 flex flex-wrap gap-1">
          {tea.country && <Badge tone="outline">{tea.country}</Badge>}
          {!offer && <Badge tone="muted">Sold out</Badge>}
          {offer?.lowStock && <Badge tone="warm">Low stock</Badge>}
          {offer?.rare && <Badge tone="warm">Rare</Badge>}
        </p>
      </div>
      {offer && (
        <TeaBuyButton teaId={tea.id} price={offer.price} label={offer.tasting ? `${offer.grams} g tasting` : "1 oz pouch"} />
      )}
    </li>
  );
}

function Badge({ tone, children }: { tone: "warm" | "outline" | "muted"; children: React.ReactNode }) {
  const cls =
    tone === "warm"
      ? "bg-[#7a5a3c] text-[#fbf6ef]"
      : tone === "outline"
      ? "border border-[#3d4a3a]/30 text-[#3d4a3a]"
      : "bg-stone-200 text-stone-500";
  return <span className={`rounded-full text-[9px] tracking-wider uppercase px-2 py-0.5 ${cls}`}>{children}</span>;
}
