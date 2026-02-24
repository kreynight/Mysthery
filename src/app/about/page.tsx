import { SITE_NAME } from "@/lib/constants";
import Disclaimers from "@/components/Disclaimers";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* About the Creator */}
      <section className="mb-16">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-3">
          About the Creator
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-stone-600">
          <p>
            {SITE_NAME} started from a simple idea: tea should be an experience, not a routine.
            Each collection is a small-batch mystery blend, curated, intentional, and gone once
            it&apos;s gone.
          </p>
          <p>
            The blends draw from tea traditions and herbal practices across cultures, approached
            with respect and curiosity. Every batch is different. That&apos;s the point.
          </p>
          <p>
            This is a one-person project, built with care. If you have questions, reach out
            anytime.
          </p>
        </div>
      </section>

      {/* Brand Concept */}
      <section className="mb-16">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-3">
          The Concept
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-stone-600">
          <p>
            Every {SITE_NAME} collection is a limited run. Once a batch sells out, it&apos;s done.
            Each mystery blend is different. You won&apos;t know exactly what&apos;s inside,
            but you&apos;ll know the general flavor profile, effect, and what ingredient families
            might be present.
          </p>
          <p>
            We share what we can: tasting notes, steep guides, caffeine info, and allergen
            warnings. The rest is part of the mystery.
          </p>
        </div>
      </section>

      <Disclaimers />
    </div>
  );
}
