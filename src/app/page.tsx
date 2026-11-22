import { getMixRules, getMixSetting, getPublicTeas } from "@/lib/teas";
import { FAMILY_ORDER, isMixable, type PublicTea } from "@/lib/mix";
import { PHOTOS, teaPhoto } from "@/lib/photos";
import { FREE_SHIP_FROM, SHIPPING_SINGLE, TEA_PRICE } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import HeroSlides, { type Slide } from "@/components/shop/HeroSlides";
import OriginRow from "@/components/shop/OriginRow";
import ShopGrid, { type ShopTea } from "@/components/shop/ShopGrid";
import { FLAG_COUNTRIES } from "@/components/shop/Flag";
import MixGenerator from "@/components/MixGenerator";

export const dynamic = "force-dynamic";

const SLIDES: Slide[] = [
  {
    image: PHOTOS.hero,
    alt: "A glass cup of tea surrounded by loose leaves and herbs",
    eyebrow: "The blend machine",
    title: "Pick a mood. We pick the tea.",
    body: "Tap what you like, pull the lever, and we blend something one of a kind from our shelf.",
    cta: "Pull the lever",
    href: "#mix",
    tint: "#1e2a1c",
  },
  {
    image: PHOTOS.origins,
    alt: "Rows of tea bushes on a green hillside",
    eyebrow: "Shop by origin",
    title: "From Yunnan to Darjeeling to Kyoto.",
    body: "Pu-erh, Darjeeling, gyokuro, Earl Grey, Haitian bush teas and more, sold by the pouch.",
    cta: "Where it grows",
    href: "#origins",
    tint: "#1e2a1c",
  },
  {
    image: PHOTOS.library,
    alt: "Assorted herbal teas and spices on wooden spoons",
    eyebrow: "Single pouches",
    title: "Every tea on our shelf.",
    body: `From ${formatPrice(TEA_PRICE).replace(".00", "")} a pouch. Free shipping on ${FREE_SHIP_FROM} or more.`,
    cta: "Shop teas",
    href: "#shop",
    origin: null,
    tint: "#1e2a1c",
  },
];

/** Mixes the shelf so the first rows show a spread of styles and origins, not one country or family. */
function interleave(teas: PublicTea[]): PublicTea[] {
  const groups = new Map<string, PublicTea[]>();
  for (const t of [...teas].sort((a, b) => a.name.localeCompare(b.name))) {
    const g = groups.get(t.family) || [];
    g.push(t);
    groups.set(t.family, g);
  }
  // Within each family, alternate countries so no one origin bunches up.
  const spread = [...groups.values()].map((g) => {
    const byCountry = new Map<string, PublicTea[]>();
    for (const t of g) byCountry.set(t.country || "", [...(byCountry.get(t.country || "") || []), t]);
    const lanes = [...byCountry.values()];
    const out: PublicTea[] = [];
    for (let i = 0; out.length < g.length; i++) for (const l of lanes) if (l[i]) out.push(l[i]);
    return out;
  });
  const order = FAMILY_ORDER.filter((f) => groups.has(f));
  const lanes = [...order.map((f) => spread[[...groups.keys()].indexOf(f)]), ...[...groups.keys()].filter((f) => !order.includes(f)).map((f) => spread[[...groups.keys()].indexOf(f)])];
  const out: PublicTea[] = [];
  for (let i = 0; out.length < teas.length; i++) for (const l of lanes) if (l[i]) out.push(l[i]);
  return out;
}

export default async function Home() {
  let teas: PublicTea[] = [];
  const [rules, setting] = await Promise.all([getMixRules(), getMixSetting()]);
  try {
    teas = await getPublicTeas();
  } catch {
    teas = [];
  }
  const mixable = teas.filter((t) => isMixable(t, rules));
  // Mix-only teas (last few grams) still show, with a note, as long as they can go in a mix.
  const forSale: ShopTea[] = interleave(teas.filter((t) => t.offer || (t.mixOnly && isMixable(t, rules)))).map((t) => ({ ...t, photo: teaPhoto(t) }));
  const origins = FLAG_COUNTRIES.filter((c) => forSale.some((t) => t.country === c)).sort((a, b) =>
    (a === "UK" ? "England" : a).localeCompare(b === "UK" ? "England" : b)
  );

  return (
    <div>
      <HeroSlides slides={SLIDES} />

      {forSale.length > 0 && <OriginRow origins={origins} />}

      <section id="mix" className="scroll-mt-20 mt-12 md:mt-20 bg-[#e4e9da]">
        <div className="max-w-6xl mx-auto px-5 py-12 md:py-16">
          <div className="text-center mb-7">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#7a5a3c] mb-1">Make your own mix</p>
            <h2 className="font-display text-3xl md:text-5xl text-[#2b3a28]">Pull the lever</h2>
            <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
              A one-of-a-kind blend from what&apos;s on our shelf, mixed by hand when you order. Don&apos;t love it? Pull again.
            </p>
          </div>
          {!setting.isEnabled ? (
            <p className="text-sm text-stone-500 text-center py-10">Custom mixes are paused right now. Check back soon.</p>
          ) : mixable.length < 2 ? (
            <p className="text-sm text-stone-500 text-center py-10">The shelf is being restocked. Check back soon.</p>
          ) : (
            <MixGenerator teas={mixable} rules={rules} setting={setting} />
          )}
        </div>
      </section>

      {forSale.length === 0 ? (
        <p className="text-sm text-stone-500 text-center py-16">The shelf is being restocked. Check back soon.</p>
      ) : (
        <ShopGrid teas={forSale} />
      )}

      <section className="max-w-6xl mx-auto px-5 mt-16 md:mt-24">
        <div className="rounded-3xl bg-[#2b3a28] text-[#eef2e6] px-6 py-8 md:px-10 md:py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            ["Hand-blended", "Every pouch is weighed and sealed by hand when you order."],
            ["Shipping", `${formatPrice(SHIPPING_SINGLE)} on one pouch, free on ${FREE_SHIP_FROM} or more. US only for now.`],
            ["The library", "Want the full shelf with notes and caffeine levels? It's in the menu under Tea Library."],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-display text-xl text-[#e9dcc6] mb-1">{t}</p>
              <p className="text-sm text-[#cfd9c3] leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
