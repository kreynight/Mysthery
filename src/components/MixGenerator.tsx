"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import SizePicker from "@/components/SizePicker";
import { addMix } from "@/lib/cart";
import type { MixSettingLike, PublicTea, RuleLike } from "@/lib/mix";
import {
  generateMix,
  mixPouchesInStock,
  mixName,
  mixSummary,
  type CaffeinePref,
  type GeneratedItem,
  type GeneratorInput,
} from "@/lib/generator";
import { FREE_SHIP_FROM, RARE_BLEND_EXTRA, SHIPPING_SINGLE, priceTiers, withRare, type PackSize } from "@/lib/pricing";

interface Props {
  teas: PublicTea[];
  rules: RuleLike[];
  setting: MixSettingLike;
}

type Pick = { key: string; label: string };

const TASTES: Pick[] = [
  { key: "sweet", label: "Sweet" },
  { key: "floral", label: "Floral" },
  { key: "fruity", label: "Fruity" },
  { key: "citrus", label: "Citrus" },
  { key: "spiced", label: "Spiced" },
  { key: "earthy", label: "Earthy" },
  { key: "fresh", label: "Fresh" },
];
const FEELS: Pick[] = [
  { key: "calm", label: "Calm" },
  { key: "cozy", label: "Cozy" },
  { key: "bright", label: "Uplifting" },
  { key: "focused", label: "Focused" },
];
const CAFFEINE: { key: CaffeinePref; label: string }[] = [
  { key: "none", label: "No caffeine" },
  { key: "some", label: "A little" },
  { key: "full", label: "Full kick" },
];

const SPIN_MS = [900, 1250, 1600];

function reelWord(tea: PublicTea): string {
  const words = tea.name.replace(/^Kusmi Tea\s*-\s*/i, "").replace(/\(.*?\)/g, "").trim().split(/\s+/);
  return words.slice(0, 3).join(" ");
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-sm transition-colors border min-h-[40px] ${
        active
          ? "bg-[#2b3a28] text-[#f5f7ef] border-[#2b3a28]"
          : "bg-[#fbf8f2] text-[#2b3a28] border-stone-300 hover:border-[#2b3a28]"
      }`}
    >
      {label}
    </button>
  );
}

function Reel({ words, final, spinning, delay }: { words: string[]; final: string; spinning: boolean; delay: number }) {
  const strip = useMemo(() => [...words, ...words], [words]);
  return (
    <div className="relative h-14 sm:h-16 flex-1 min-w-0 overflow-hidden rounded-xl bg-[#fbf6ef] ring-1 ring-[#2b3a28]/20 shadow-inner">
      {spinning ? (
        <div
          className="reel-strip absolute inset-x-0 top-0"
          style={{ animationDuration: `${0.5 + delay * 0.08}s` }}
        >
          {strip.map((w, i) => (
            <div key={i} className="h-14 sm:h-16 flex items-center justify-center px-1.5 text-[11px] sm:text-xs text-[#5b4532] blur-[0.6px] text-center leading-tight">
              {w}
            </div>
          ))}
        </div>
      ) : (
        <div className="reel-land h-full flex items-center justify-center px-1.5 text-[11px] sm:text-sm font-medium text-[#2b3a28] text-center leading-tight">
          {final}
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-[#2b3a28]/15 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-[#2b3a28]/15 to-transparent" />
    </div>
  );
}

export default function MixGenerator({ teas, rules, setting }: Props) {
  const [taste, setTaste] = useState<string | null>(null);
  const [feel, setFeel] = useState<string | null>(null);
  const [caffeine, setCaffeine] = useState<CaffeinePref | null>(null);
  const [items, setItems] = useState<GeneratedItem[] | null>(null);
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);
  const [pulled, setPulled] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const [size, setSize] = useState<PackSize>(1);
  const timers = useRef<number[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const hasRare = !!items?.some((i) => i.tea.rare);
  const inStock = items ? mixPouchesInStock(items, setting.packGrams) : 99;
  const tiers = withRare(priceTiers(setting.price, setting.price3, setting.price5), hasRare);
  const input: GeneratorInput = {
    mood: feel || "any",
    flavor: taste || "any",
    caffeine: caffeine || "any",
    time: caffeine === "none" || feel === "calm" ? "evening" : caffeine === "full" ? "morning" : "any",
  };
  const reelWords = useMemo(() => {
    const shuffled = [...teas].sort(() => Math.random() - 0.5).slice(0, 14);
    return shuffled.map(reelWord);
  }, [teas]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const isSpinning = spinning.some(Boolean);

  const pull = useCallback(() => {
    if (isSpinning) return;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const mix = generateMix(teas, rules, setting, input);
    if (!mix) {
      setNoMatch(true);
      setItems(null);
      setRevealed(false);
      return;
    }
    setNoMatch(false);
    setRevealed(false);
    setItems(mix);
    // Never offer more pouches than the shelf can fill.
    const fill = mixPouchesInStock(mix, setting.packGrams);
    setSize((s) => (s <= fill ? s : fill >= 3 ? 3 : 1));
    setPulled(true);
    timers.current.push(window.setTimeout(() => setPulled(false), 380));
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(30);

    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSpinning([false, false, false]);
      setRevealed(true);
      return;
    }
    setSpinning([true, true, true]);
    SPIN_MS.forEach((ms, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setSpinning((s) => s.map((v, j) => (j === i ? false : v)));
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
        }, ms)
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setRevealed(true);
        window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
      }, SPIN_MS[2] + 250)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, teas, rules, setting, taste, feel, caffeine]);

  const [added, setAdded] = useState(false);
  const addToCart = () => {
    if (!items) return;
    addMix({
      name: mixName(items, input),
      items: items.map((i) => ({ id: i.tea.id, parts: i.parts })),
      teas: items.map((i) => reelWord(i.tea)),
      size,
      price: tiers[size],
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const finals = [0, 1, 2].map((i) => (items && items[i] ? reelWord(items[i].tea) : i === 2 && items ? "Pure" : "?"));
  const totalParts = items ? items.reduce((s, i) => s + i.parts, 0) : 1;
  const toggle = <T,>(v: T | null, k: T, set: (x: T | null) => void) => set(v === k ? null : k);

  return (
    <div className="max-w-xl mx-auto">
      {/* Quick picks */}
      <div className="space-y-3 mb-6">
        <p className="text-sm text-stone-500 text-center">Tap what you&apos;re in the mood for, or skip straight to the lever.</p>
        {[
          { title: "Taste", list: TASTES, value: taste, set: setTaste },
          { title: "Feel", list: FEELS, value: feel, set: setFeel },
        ].map((row) => (
          <div key={row.title}>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#7a5a3c] mb-1.5">{row.title}</p>
            <div className="flex flex-wrap gap-2">
              {row.list.map((p) => (
                <Chip key={p.key} label={p.label} active={row.value === p.key} onClick={() => toggle(row.value, p.key, row.set)} />
              ))}
            </div>
          </div>
        ))}
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#7a5a3c] mb-1.5">Caffeine</p>
          <div className="flex flex-wrap gap-2">
            {CAFFEINE.map((p) => (
              <Chip key={p.key} label={p.label} active={caffeine === p.key} onClick={() => toggle(caffeine, p.key, setCaffeine)} />
            ))}
          </div>
        </div>
      </div>

      {/* The machine */}
      <div className="relative rounded-[28px] bg-gradient-to-b from-[#3d4a3a] to-[#2b3a28] p-4 sm:p-5 pr-16 sm:pr-20 shadow-lg">
        <p className="text-center text-[10px] tracking-[0.35em] uppercase text-[#d9c3a5] mb-3">The blend machine</p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Reel key={i} words={reelWords} final={finals[i]} spinning={spinning[i]} delay={i} />
          ))}
        </div>
        <button
          type="button"
          onClick={pull}
          disabled={isSpinning}
          className="mt-4 w-full rounded-full bg-[#d9c3a5] text-[#2b3a28] py-3.5 text-sm font-semibold tracking-widest uppercase hover:bg-[#e5cfae] transition-colors disabled:opacity-70"
        >
          {isSpinning ? "Blending..." : items ? "Pull again" : "Pull the lever"}
        </button>

        {/* Lever */}
        <button
          type="button"
          aria-label="Pull the lever"
          onClick={pull}
          disabled={isSpinning}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-36 flex flex-col items-center justify-center"
        >
          <span className="absolute bottom-1/2 w-2 h-16 origin-bottom rounded-full bg-gradient-to-r from-stone-300 to-stone-400 transition-transform duration-300 ease-in"
            style={{ transform: pulled ? "scaleY(-1)" : "scaleY(1)", transitionDuration: pulled ? "220ms" : "450ms" }}
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#c96b52] to-[#8b3a2b] shadow-md ring-2 ring-[#2b3a28]/30" />
          </span>
          <span className="relative w-6 h-6 rounded-full bg-[#1e2a1c] ring-2 ring-stone-400/60" />
        </button>
      </div>

      {noMatch && (
        <p className="mt-5 text-sm text-center text-[#8b3a2b]">
          Nothing on the shelf fits all of that right now. Try dropping one pick.
        </p>
      )}

      {/* Result */}
      {items && revealed && (
        <div ref={resultRef} className="reveal mt-5 rounded-3xl bg-[#fbf8f2] ring-1 ring-stone-200 p-5 sm:p-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#7a5a3c]">Your blend</p>
          <div className="flex items-baseline justify-between gap-3 mt-1">
            <h3 className="font-display text-2xl sm:text-3xl text-[#2b3a28]">{mixName(items, input)}</h3>
            <p className="text-xl font-semibold text-[#5b4532] whitespace-nowrap">{formatPrice(tiers[size])}</p>
          </div>
          <p className="text-sm text-stone-600 mt-1">{mixSummary(items)} Blended by hand when you order.</p>
          {hasRare && (
            <p className="mt-2 inline-block rounded-full bg-[#7a5a3c] text-[#fbf6ef] text-[10px] tracking-wider uppercase px-2.5 py-1">
              Rare tea inside · +{formatPrice(RARE_BLEND_EXTRA)} a pouch
            </p>
          )}

          <ul className="mt-4 space-y-1.5">
            {items.map(({ tea, parts }) => (
              <li key={tea.id} className="flex items-center gap-3 text-sm">
                <span className="w-10 shrink-0 text-xs font-semibold text-[#7a5a3c]">
                  {Math.round((parts / totalParts) * 100)}%
                </span>
                <span className="min-w-0 truncate text-[#2b3a28]">{tea.name}</span>
                {tea.rare && (
                  <span className="shrink-0 text-[9px] tracking-wider uppercase text-[#7a5a3c] border border-[#7a5a3c]/40 rounded-full px-1.5 py-0.5">
                    Rare
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <SizePicker tiers={tiers} value={size} onChange={setSize} remaining={inStock} />
            {inStock < 5 && (
              <p className="text-[11px] text-[#8b6e4e] mt-2">
                Only enough of these teas for {inStock} {inStock === 1 ? "pouch" : "pouches"} of this blend.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={addToCart}
            className="mt-3 w-full py-4 rounded-full bg-[#3d4a3a] text-[#f5f7ef] text-sm tracking-widest uppercase hover:bg-[#2b3a28] transition-colors"
          >
            {added ? "Added to cart ✓" : `Add to cart · ${formatPrice(tiers[size])}`}
          </button>
          <p className="text-xs text-stone-500 text-center mt-2">
            {size >= FREE_SHIP_FROM ? "Free shipping" : `${formatPrice(SHIPPING_SINGLE)} shipping. Free on ${FREE_SHIP_FROM} or more.`}
          </p>
        </div>
      )}
    </div>
  );
}
