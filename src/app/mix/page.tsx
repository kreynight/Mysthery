import type { Metadata } from "next";
import Image from "next/image";
import { getMixRules, getMixSetting, getPublicTeas } from "@/lib/teas";
import { isMixable, keyLabel, type PublicTea } from "@/lib/mix";
import MixBuilder from "@/components/MixBuilder";
import { FlowerSprig } from "@/components/Botanicals";
import { PHOTOS } from "@/lib/photos";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Make a Mix | ${SITE_NAME}`,
  description: "Build your own tea blend from the Mysthérie library, with pairings we know brew well together.",
};

export default async function MixPage() {
  let teas: PublicTea[] = [];
  const [rules, setting] = await Promise.all([getMixRules(), getMixSetting()]);
  try {
    teas = await getPublicTeas();
  } catch {
    teas = [];
  }
  const mixable = teas.filter((t) => isMixable(t, rules));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <section className="relative rounded-3xl overflow-hidden bg-[#5b4532] min-h-[280px] flex items-end mb-10">
        <Image src={PHOTOS.mix} alt="" fill priority className="object-cover opacity-60" sizes="1150px" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2a1f15]/90 via-[#2a1f15]/50 to-transparent" />
        <FlowerSprig className="absolute right-6 top-4 w-24 opacity-80" color="#e3b3a6" stem="#d3dec6" />
        <div className="relative p-8 md:p-12 max-w-xl">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#e5cfae] mb-2">Build your own</p>
          <h1 className="font-display text-4xl md:text-5xl font-light text-[#fbf6ef] mb-3">Make a mix</h1>
          <p className="text-sm text-[#efe6da] leading-relaxed">
            Pick {setting.minTeas === setting.maxTeas ? setting.minTeas : `${setting.minTeas} to ${setting.maxTeas}`} teas
            from the library. Teas that won&apos;t brew well with your picks fade out, with the reason why.
          </p>
        </div>
      </section>

      {!setting.isEnabled ? (
        <p className="text-sm text-stone-500 text-center py-16">Custom mixes are paused right now. Check back soon.</p>
      ) : mixable.length < 2 ? (
        <p className="text-sm text-stone-500 text-center py-16">The library is being restocked. Check back soon.</p>
      ) : (
        <MixBuilder teas={mixable} rules={rules} setting={setting} />
      )}

      {rules.length > 0 && (
        <section className="mt-16 rounded-3xl bg-[#e1e9d6] p-8">
          <h2 className="font-display text-2xl font-light text-[#2b3a28] mb-4">Our pairing rules</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-stone-600">
            {rules.map((r, i) => (
              <li key={r.id || i}>
                <span className="font-medium text-[#2b3a28]">
                  {r.familyB === "*" ? `${keyLabel(r.familyA)}, never mixed` : `${keyLabel(r.familyA)} + ${keyLabel(r.familyB).toLowerCase()}`}
                </span>
                {r.reason ? <span>: {r.reason}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
