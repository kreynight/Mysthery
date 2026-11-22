// The "make a mix" generator. Picks a blend from in-stock teas that obeys the mix rules.
// Safe to import from client components.
import { gramsPerPouch, pouchesCovered } from "@/lib/recipe";

import {
  FLAVORS,
  MOODS,
  blockingRule,
  validateMix,
  type MixSettingLike,
  type PublicTea,
  type RuleLike,
} from "@/lib/mix";

export type CaffeinePref = "none" | "some" | "full" | "any";
export type TimePref = "morning" | "afternoon" | "evening" | "any";

export interface GeneratorInput {
  mood: string; // key of MOODS or "any"
  flavor: string; // key of FLAVORS or "any"
  caffeine: CaffeinePref;
  time: TimePref;
}

export interface GeneratedItem {
  tea: PublicTea;
  parts: number;
}

export const CAFFEINE_PREFS: { key: CaffeinePref; label: string }[] = [
  { key: "none", label: "None" },
  { key: "some", label: "A little" },
  { key: "full", label: "Full" },
  { key: "any", label: "Any" },
];

export const TIME_PREFS: { key: TimePref; label: string }[] = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
  { key: "any", label: "Any time" },
];

/** Normalized name so we never put two near-identical teas (say, two Earl Greys) together. */
function baseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/no\.?\s*\d+/g, "")
    .replace(/kusmi tea\s*-\s*/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

/** Teas allowed by the caffeine choice. "full" is applied to the lead tea only. */
export function allowedByCaffeine(tea: PublicTea, pref: CaffeinePref): boolean {
  if (pref === "none") return tea.caffeineTier === "none";
  if (pref === "some") return tea.caffeineTier !== "high" && tea.caffeineTier !== "unknown";
  return tea.caffeineTier !== "unknown" || pref === "any";
}

function score(tea: PublicTea, input: GeneratorInput, lead?: PublicTea): number {
  let s = 0;
  if (input.flavor !== "any" && tea.flavors.includes(input.flavor)) s += 4;
  if (input.mood !== "any" && tea.moods.includes(input.mood)) s += 3;
  if (input.time === "evening") s += tea.caffeineTier === "none" ? 2 : tea.caffeineTier === "high" ? -3 : -1;
  if (input.time === "morning") s += tea.caffeineTier === "high" || tea.caffeineTier === "medium" ? 2 : 0;
  if (input.time === "afternoon") s += tea.caffeineTier === "low" || tea.caffeineTier === "medium" ? 1 : 0;
  if (input.caffeine === "full" && !lead) s += tea.caffeineTier === "high" ? 2 : 0;
  if (lead) {
    if (tea.family === lead.family) s += 1;
    if (tea.flavors.some((f) => lead.flavors.includes(f))) s += 1.5;
  }
  if (tea.harsh) s -= 6;
  return s;
}

function weightedPick<T>(items: { item: T; score: number }[], random: () => number, top = 4): T | null {
  if (!items.length) return null;
  const sorted = [...items].sort((a, b) => b.score - a.score).slice(0, top);
  const min = Math.min(...sorted.map((x) => x.score));
  const weights = sorted.map((x) => x.score - min + 1);
  let r = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < sorted.length; i++) {
    r -= weights[i];
    if (r <= 0) return sorted[i].item;
  }
  return sorted[0].item;
}

function fits(tea: PublicTea, chosen: PublicTea[], rules: RuleLike[]): boolean {
  const n = baseName(tea.name);
  // A mix holds at most one mix-only (last few grams) tea.
  if (tea.mixOnly && chosen.some((c) => c.mixOnly)) return false;
  return chosen.every((c) => c.id !== tea.id && baseName(c.name) !== n && !blockingRule(tea, c, rules));
}

/** How many pouches of this blend the shelf can fill right now. */
export function mixPouchesInStock(items: GeneratedItem[], packGrams: number): number {
  const grams = gramsPerPouch(items.map((i) => ({ parts: i.parts, accent: i.tea.mixOnly })), packGrams);
  return pouchesCovered(items.map((i, k) => ({ grams: grams[k].grams, stock: i.tea.stock })));
}

/** Grams per pouch of each tea in a generated blend. */
export function mixGrams(items: GeneratedItem[], packGrams: number): number[] {
  return gramsPerPouch(items.map((i) => ({ parts: i.parts, accent: i.tea.mixOnly })), packGrams).map((g) => g.grams);
}

/** Gives the lead tea 2 parts and the others 1 part. */
export function withParts(teas: PublicTea[]): GeneratedItem[] {
  return teas.map((tea, i) => ({ tea, parts: i === 0 && teas.length > 1 ? 2 : 1 }));
}

/** Builds a blend. Returns null when nothing on the shelf fits the choices. */
export function generateMix(
  teas: PublicTea[],
  rules: RuleLike[],
  setting: MixSettingLike,
  input: GeneratorInput,
  random: () => number = Math.random,
  /** A tea the blend must include, such as a mix-only tea a shopper picked. */
  include?: PublicTea
): GeneratedItem[] | null {
  const size = Math.max(setting.minTeas, Math.min(setting.maxTeas, 3));
  // Skip teas that can't cover even one pouch: a side tea needs at least 1 of 4 parts, the lead 2 of 4.
  // Mix-only teas go in as a small accent, so their last few grams are enough; they never lead.
  const has = (t: PublicTea, g: number) => t.stock == null || t.stock >= g;
  const pool = teas
    .filter((t) => t.id !== include?.id)
    .filter((t) => allowedByCaffeine(t, input.caffeine === "full" ? "any" : input.caffeine))
    .filter((t) => t.mixOnly || has(t, setting.packGrams / (size + 1)));
  const leadPool = (
    input.caffeine === "full" ? pool.filter((t) => t.caffeineTier === "high" || t.caffeineTier === "medium") : pool
  ).filter((t) => !t.mixOnly && has(t, (setting.packGrams * 2) / (size + 1)) && (!include || fits(t, [include], rules)));

  for (let attempt = 0; attempt < 12; attempt++) {
    const lead = weightedPick(
      leadPool.map((t) => ({ item: t, score: score(t, input) + random() * 2 })),
      random,
      6
    );
    if (!lead) return null;
    const chosen = include ? [lead, include] : [lead];
    while (chosen.length < size) {
      const next = weightedPick(
        pool.filter((t) => fits(t, chosen, rules)).map((t) => ({ item: t, score: score(t, input, lead) + random() * 1.5 })),
        random
      );
      if (!next) break;
      chosen.push(next);
    }
    if (chosen.length >= setting.minTeas && !validateMix(chosen, rules, setting)) {
      const items = withParts(chosen);
      if (mixPouchesInStock(items, setting.packGrams) >= 1) return items;
    }
  }
  return null;
}

/** Other teas that could take the place of `index` without breaking a rule, best first. */
export function swapOptions(
  current: PublicTea[],
  index: number,
  teas: PublicTea[],
  rules: RuleLike[],
  input: GeneratorInput
): PublicTea[] {
  const others = current.filter((_, i) => i !== index);
  const lead = index === 0 ? undefined : current[0];
  const pref = input.caffeine === "full" ? "any" : input.caffeine;
  return teas
    .filter((t) => t.id !== current[index].id && !(index === 0 && t.mixOnly) && allowedByCaffeine(t, pref) && fits(t, others, rules))
    .map((t) => ({ t, s: score(t, input, lead) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t);
}

/** Teas that could be added to the blend, best first. */
export function addOptions(current: PublicTea[], teas: PublicTea[], rules: RuleLike[], input: GeneratorInput): PublicTea[] {
  const pref = input.caffeine === "full" ? "any" : input.caffeine;
  return teas
    .filter((t) => allowedByCaffeine(t, pref) && fits(t, current, rules))
    .map((t) => ({ t, s: score(t, input, current[0]) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t);
}

const ADJ: Record<string, string[]> = {
  calm: ["Hushed", "Still", "Moonlit", "Velvet"],
  bright: ["Golden", "Sunlit", "Bright", "Clear"],
  focused: ["Steady", "Clear", "Keen", "True"],
  cozy: ["Ember", "Hearth", "Amber", "Woolen"],
  grounded: ["Rooted", "Deep", "Mossy", "Ancient"],
  any: ["Hidden", "Wandering", "Secret", "Quiet", "Velvet"],
};
const NOUN: Record<string, string[]> = {
  sweet: ["Nectar", "Honey", "Treat"],
  floral: ["Garden", "Bloom", "Petal"],
  fruity: ["Orchard", "Harvest", "Grove"],
  citrus: ["Zest", "Grove", "Morning"],
  spiced: ["Spice Road", "Hearth", "Ember"],
  malty: ["Hearth", "Field", "Loaf"],
  earthy: ["Woodland", "Root", "Cellar"],
  fresh: ["Meadow", "Rain", "Leaf"],
  any: ["Path", "Hour", "Trail"],
};

/** A name for a generated blend, stable for the same teas. */
export function mixName(items: GeneratedItem[], input: GeneratorInput): string {
  const seed = items.reduce((s, i) => s + i.tea.name.length * (i.parts + 1), 0);
  const adj = ADJ[input.mood] || ADJ.any;
  const noun = NOUN[input.flavor] || NOUN.any;
  return `${adj[seed % adj.length]} ${noun[(seed >> 1) % noun.length]}`;
}

const SHORT: Record<string, string> = {
  sweet: "sweet",
  floral: "floral",
  fruity: "fruity",
  citrus: "citrusy",
  spiced: "spiced",
  malty: "malty",
  earthy: "earthy",
  fresh: "fresh",
};

/** A short line describing a blend: flavor direction, caffeine and when to drink it. */
export function mixSummary(items: GeneratedItem[]): string {
  const counts: Record<string, number> = {};
  for (const { tea, parts } of items) for (const f of tea.flavors) counts[f] = (counts[f] || 0) + parts;
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => SHORT[k] || k);
  const tiers = items.map((i) => i.tea.caffeineTier);
  const caffeine = tiers.every((t) => t === "none")
    ? "caffeine free"
    : tiers.some((t) => t === "high")
    ? "full caffeine"
    : "a little caffeine";
  const flavor = top.length ? top.join(" and ") : "gentle";
  return `${flavor.charAt(0).toUpperCase()}${flavor.slice(1)}, ${caffeine}.`;
}

export { FLAVORS, MOODS };
