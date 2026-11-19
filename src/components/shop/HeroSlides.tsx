"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { setOrigin } from "@/lib/cart";

export interface Slide {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  /** Sets the origin filter on the tea grid before jumping to it. */
  origin?: string | null;
  tint: string;
}

const EVERY_MS = 6500;

export default function HeroSlides({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduce || slides.length < 2) return;
    const t = window.setTimeout(() => setI((n) => (n + 1) % slides.length), EVERY_MS);
    return () => window.clearTimeout(t);
  }, [i, paused, slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative h-[72vh] min-h-[440px] max-h-[680px] overflow-hidden bg-[#2b3a28]">
        {slides.map((s, n) => (
          <div
            key={n}
            aria-hidden={n !== i}
            className={`absolute inset-0 transition-opacity duration-1000 ${n === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <Image
              src={s.image}
              alt={s.alt}
              fill
              priority={n === 0}
              sizes="100vw"
              className={`object-cover transition-transform duration-[7000ms] ease-out ${n === i ? "scale-105" : "scale-100"}`}
            />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${s.tint}f2 0%, ${s.tint}99 35%, transparent 75%)` }} />
            <div className="absolute inset-x-0 bottom-0">
              <div className="max-w-6xl mx-auto px-5 pb-16 md:pb-20">
                <p className="text-[11px] tracking-[0.32em] uppercase text-[#e9dcc6] mb-3">{s.eyebrow}</p>
                <h2 className="font-display text-[40px] leading-[1.02] md:text-7xl text-[#f8f4ea] max-w-2xl mb-4">{s.title}</h2>
                <p className="text-[15px] md:text-lg text-[#ece6d8] max-w-md mb-7 leading-relaxed">{s.body}</p>
                <a
                  href={s.href}
                  tabIndex={n === i ? 0 : -1}
                  onClick={() => s.origin !== undefined && setOrigin(s.origin)}
                  className="inline-block rounded-full bg-[#f8f4ea] text-[#2b3a28] px-7 py-3.5 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-white transition-colors"
                >
                  {s.cta}
                </a>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2.5">
          {slides.map((s, n) => (
            <button
              key={n}
              type="button"
              aria-label={`Show slide ${n + 1}: ${s.title}`}
              aria-current={n === i}
              onClick={() => setI(n)}
              className="h-6 grid place-items-center"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-500 ${n === i ? "w-8 bg-[#f8f4ea]" : "w-1.5 bg-[#f8f4ea]/50"}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
