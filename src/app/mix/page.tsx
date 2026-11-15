import type { Metadata } from "next";
import Image from "next/image";
import { getMixRules, getMixSetting, getPublicTeas } from "@/lib/teas";
import { isMixable, keyLabel, type PublicTea } from "@/lib/mix";
import MixGenerator from "@/components/MixGenerator";
import { FlowerSprig } from "@/components/Botanicals";
import { PHOTOS } from "@/lib/photos";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Make a Mix | ${SITE_NAME}`,
  description: "Pull the lever and generate a one-of-a-kind tea blend from the Mysthérie shelf.",
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
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
      <section className="relative rounded-3xl overflow-hidden bg-[#5b4532] min-h-[190px] md:min-h-[280px] flex items-end mb-6 md:mb-10">
        <Image src={PHOTOS.mix} alt="" fill priority className="object-cover opacity-60" sizes="1150px" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2a1f15]/90 via-[#2a1f15]/50 to-transparent" />
        <FlowerSprig className="absolute right-6 top-4 w-24 opacity-80" color="#e3b3a6" stem="#d3dec6" />
        <div className="relative p-6 md:p-12 max-w-xl">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#e5cfae] mb-2">Mix generator</p>
          <h1 className="font-display text-3xl md:text-5xl font-light text-[#fbf6ef] mb-2 md:mb-3">Make your own mix</h1>
          <p className="text-sm text-[#efe6da] leading-relaxed">
            Tap a few things you like, pull the lever, and the machine blends something one of a kind from
            what&apos;s on our shelf. Don&apos;t love it? Pull again.
          </p>
        </div>
      </section>

      {!setting.isEnabled ? (
        <p className="text-sm text-stone-500 text-center py-16">Custom mixes are paused right now. Check back soon.</p>
      ) : mixable.length < 2 ? (
        <p className="text-sm text-stone-500 text-center py-16">The library is being restocked. Check back soon.</p>
      ) : (
        <MixGenerator teas={mixable} rules={rules} setting={setting} />
      )}

      {rules.length > 0 && (
        <section className="mt-12 md:mt-16 rounded-3xl bg-[#efe6da] p-6 md:p-8">
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
