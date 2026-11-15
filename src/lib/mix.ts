import { isLowStock, isPremiumOrigin, teaOffer, type TeaOffer } from "@/lib/pricing";
// Shared logic for the public tea library and the "make your own mix" builder.
// Safe to import from client components: no database access here.

export const FAMILIES: Record<string, { label: string; blurb: string }> = {
  black: { label: "Black teas", blurb: "Malty, bold, the backbone of a morning cup." },
  green: { label: "Green teas", blurb: "Fresh, grassy and gentle." },
  matcha: { label: "Matcha", blurb: "Stone-ground green tea, whisked." },
  white: { label: "White teas", blurb: "Soft, honeyed and delicate." },
  oolong: { label: "Oolong", blurb: "Between green and black: roasted, floral, buttery." },
  puerh: { label: "Pu-erh", blurb: "Aged and earthy, from Yunnan." },
  mate: { label: "Yerba mate", blurb: "Bright, grassy and energizing." },
  herbal: { label: "Herbal & floral", blurb: "Flowers, fruit, roots and leaves. Caffeine free." },
  sleep: { label: "Sleep & calm", blurb: "Caffeine-free herbals for winding down." },
  wellness: { label: "Wellness teas", blurb: "Traditional single-purpose blends." },
  addin: { label: "Add-ins", blurb: "Botanicals used alongside tea." },
  unverified: { label: "Being catalogued", blurb: "Details still to confirm." },
};

// One earthy tint per family so the library reads at a glance.
export const FAMILY_TINT: Record<string, string> = {
  black: "#5b4532",
  green: "#5e7a4c",
  matcha: "#6f8f3e",
  white: "#a8936f",
  oolong: "#8a6a3f",
  puerh: "#3f2f22",
  mate: "#7c8a43",
  herbal: "#b07a6e",
  sleep: "#7d6b8a",
  wellness: "#4f7a6a",
  addin: "#9a7b52",
  unverified: "#55634a",
};

// Virtual tags a rule can target besides family names.
export const TAGS: Record<string, string> = {
  caffeinated: "Any tea with caffeine",
};

// Families never offered in the builder (still shown in the library).
export const HIDDEN_FROM_MIX = ["none", "unverified", "addin"];

export const FAMILY_ORDER = Object.keys(FAMILIES);

export interface RuleLike {
  id?: string;
  familyA: string;
  familyB: string;
  reason?: string | null;
}

export interface MixSettingLike {
  minTeas: number;
  maxTeas: number;
  price: number;
  price3?: number | null;
  price5?: number | null;
  isEnabled: boolean;
  packGrams: number;
}

export type CaffeineTier = "none" | "low" | "medium" | "high" | "unknown";

export interface PublicTea {
  id: string;
  inventoryNo: number | null;
  name: string;
  /** Tea type, without words like "blend". */
  category: string | null;
  /** A very light note: two words at most per descriptor, two descriptors at most. */
  note: string | null;
  caffeine: string;
  caffeineTier: CaffeineTier;
  family: string;
  tags: string[];
  /** Flavor directions this tea leans toward (keys of FLAVORS). */
  flavors: string[];
  /** Moods this tea suits (keys of MOODS). */
  moods: string[];
  /** Strongly bitter or single-purpose teas the generator avoids unless swapped in. */
  harsh: boolean;
  /** Low stock or marked rare: blends that use it cost a little more. */
  rare: boolean;
  /** What a single pouch of this tea sells for, or null when too little is left. */
  offer: TeaOffer | null;
}

interface RawIngredient {
  name: string;
  category: string | null;
  caffeineLevel: string | null;
  wellnessFunction?: string | null;
  flavorNotes?: string | null;
  mixFamily?: string | null;
  culturalRoots?: string | null;
  gramsOnHand?: number | null;
  rare?: boolean | null;
}

const SLEEP_WORDS = ["sleep", "night", "noches", "calm", "stress", "lavender", "chamomile", "bedtime", "relax", "knockout"];

export function deriveFamily(ing: RawIngredient): string {
  if (ing.mixFamily && ing.mixFamily.trim()) return ing.mixFamily.trim();
  const cat = (ing.category || "").toLowerCase();
  const name = ing.name.toLowerCase();
  const text = `${cat} ${name}`;
  if (cat.includes("verify")) return "unverified";
  if (cat.includes("resin") || cat.includes("add-in")) return "addin";
  if (/pu-?erh|pu'?er|puer/.test(text)) return "puerh";
  if (text.includes("mate")) return "mate";
  if (cat.includes("oolong")) return "oolong";
  if (cat.includes("white")) return "white";
  if (name.includes("matcha")) return "matcha";
  if (/green|gyokuro|sencha|bancha|genmaicha/.test(cat)) return "green";
  if (cat.includes("black")) return "black";
  if (cat.includes("medicinal")) return "wellness";
  const about = `${name} ${(ing.wellnessFunction || "").toLowerCase()} ${(ing.flavorNotes || "").toLowerCase()}`;
  if (SLEEP_WORDS.some((w) => about.includes(w))) return "sleep";
  return "herbal";
}

export function caffeineLabel(level: string | null): string {
  const v = (level || "").trim();
  if (!v || /verify|unknown|\?/i.test(v)) return "Check the pack";
  if (/^(none|decaf)$/i.test(v) || /decaf|very low/i.test(v) && !/medium|high/i.test(v)) return "Caffeine free or very low";
  return `${v} caffeine`;
}

export function isCaffeinated(level: string | null): boolean {
  const v = (level || "").toLowerCase();
  if (!v || v.includes("verify") || v.includes("unknown")) return false;
  if (v.includes("none") || v.includes("decaf") || v.includes("very low")) return false;
  return /low|medium|high/.test(v);
}

export function caffeineTier(level: string | null): CaffeineTier {
  const v = (level || "").toLowerCase();
  if (!v || v.includes("verify") || v.includes("unknown")) return "unknown";
  if (!isCaffeinated(level)) return "none";
  if (v.includes("high")) return "high";
  if (v.includes("medium")) return "medium";
  return "low";
}

// Flavor directions a customer can ask the generator for.
export const FLAVORS: Record<string, { label: string; words: string[]; families?: string[] }> = {
  sweet: { label: "Sweet", words: ["sweet", "honey", "caramel", "vanilla", "chocolate", "cocoa", "candy", "sugar", "licorice", "nectar"] },
  floral: { label: "Floral", words: ["floral", "flower", "rose", "lavender", "osmanthus", "muscatel", "jasmine", "hibiscus"] },
  fruity: { label: "Fruity", words: ["fruit", "berry", "peach", "mango", "apple", "cherry", "plum", "apricot", "date", "currant"] },
  citrus: { label: "Citrus", words: ["citrus", "lemon", "bergamot", "orange", "zoranj", "sitwonel", "sitwonèl", "lime"] },
  spiced: { label: "Spiced", words: ["spice", "spiced", "chai", "cinnamon", "ginger", "warm", "cardamom", "licorice"] },
  malty: { label: "Malty & bold", words: ["malty", "malt", "robust", "brisk", "bold", "honeyed", "toast", "classic"] },
  earthy: { label: "Earthy & woody", words: ["earthy", "woody", "smoky", "mineral", "aged", "thick"], families: ["puerh"] },
  fresh: { label: "Fresh & green", words: ["grassy", "umami", "fresh", "mint", "minty", "bright", "refreshing", "basil"], families: ["green", "mate"] },
};

// Moods a customer can ask the generator for.
export const MOODS: Record<string, { label: string; words: string[]; families?: string[] }> = {
  calm: { label: "Calm", words: ["calm", "sleep", "soothing", "relax", "evening", "stress", "unwind"], families: ["sleep", "white"] },
  bright: { label: "Bright", words: ["uplift", "mood", "cheerful", "refreshing", "lifting", "bright"] },
  focused: { label: "Focused", words: ["focus", "energy", "alert", "theanine", "energizing"] },
  cozy: { label: "Cozy", words: ["warming", "comforting", "ritual", "afternoon", "spice", "chai"] },
  grounded: { label: "Grounded", words: ["grounding", "earthy", "digest", "post-meal", "balance"], families: ["puerh"] },
};

function tagsFor(
  dict: Record<string, { words: string[]; families?: string[] }>,
  text: string,
  family: string
): string[] {
  return Object.entries(dict)
    .filter(([, d]) => d.families?.includes(family) || d.words.some((w) => text.includes(w)))
    .map(([k]) => k);
}

/** Strips a tea's flavor text down to a couple of light words. */
export function lightNote(flavorNotes: string | null | undefined): string | null {
  if (!flavorNotes || /verify|unknown/i.test(flavorNotes)) return null;
  const parts = flavorNotes
    .replace(/\([^)]*\)/g, "")
    .split(/[,/+;&]| w\/ | over | with |-/i)
    .map((p) => p.trim().toLowerCase().replace(/\b(black |green |white )?teas?\b/g, "").trim())
    .filter((p) => p && !/blend|flavorful|^w$|^herbal( medicinal)?$/.test(p))
    .map((p) => p.split(/\s+/).slice(0, 2).join(" "));
  const unique = [...new Set(parts)].slice(0, 2);
  return unique.length ? unique.join(" · ") : null;
}

/** The tea's type, without "blend" so the library doesn't read like a list of blends. */
export function lightCategory(category: string | null | undefined): string | null {
  if (!category || /verify/i.test(category)) return null;
  const c = category
    .replace(/\([^)]*\)/g, "")
    .replace(/\bblend\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : null;
}

export function toPublicTea(ing: RawIngredient & { id: string; inventoryNo: number | null }): PublicTea {
  const family = deriveFamily(ing);
  const tags: string[] = [];
  if (isCaffeinated(ing.caffeineLevel)) tags.push("caffeinated");
  const flavorText = `${ing.name} ${ing.flavorNotes || ""}`.toLowerCase();
  const moodText = `${ing.name} ${ing.wellnessFunction || ""} ${ing.flavorNotes || ""}`.toLowerCase();
  const harsh =
    /(very|intensely) bitter|bitter (citrus|earthy)|medicinal|sharp herbal/.test((ing.flavorNotes || "").toLowerCase()) ||
    /fever|parasite|kidney|urinary|cleanse|throat|blood wash|sickness/.test((ing.wellnessFunction || "").toLowerCase());
  return {
    id: ing.id,
    inventoryNo: ing.inventoryNo,
    name: ing.name,
    category: lightCategory(ing.category),
    note: lightNote(ing.flavorNotes),
    caffeine: caffeineLabel(ing.caffeineLevel),
    caffeineTier: caffeineTier(ing.caffeineLevel),
    family,
    tags,
    flavors: tagsFor(FLAVORS, flavorText, family),
    moods: tagsFor(MOODS, moodText, family),
    harsh,
    rare: !!ing.rare || isLowStock(ing.gramsOnHand),
    offer: teaOffer({
      gramsOnHand: ing.gramsOnHand ?? null,
      rare: !!ing.rare,
      premium: isPremiumOrigin(ing.culturalRoots),
    }),
  };
}

function matches(tea: PublicTea, key: string): boolean {
  return key === "*" || tea.family === key || tea.tags.includes(key);
}

/** The rule that stops `a` and `b` being mixed, if any. */
export function blockingRule(a: PublicTea, b: PublicTea, rules: RuleLike[]): RuleLike | null {
  for (const r of rules) {
    if (r.familyB === "*") continue;
    if ((matches(a, r.familyA) && matches(b, r.familyB)) || (matches(b, r.familyA) && matches(a, r.familyB))) {
      return r;
    }
  }
  return null;
}

/** True when a solo rule ("never mixed") covers this tea. */
export function soloRule(tea: PublicTea, rules: RuleLike[]): RuleLike | null {
  return rules.find((r) => r.familyB === "*" && matches(tea, r.familyA)) || null;
}

export function isMixable(tea: PublicTea, rules: RuleLike[]): boolean {
  return !HIDDEN_FROM_MIX.includes(tea.family) && !soloRule(tea, rules);
}

/** Returns an error message, or null when the selection is a valid mix. */
export function validateMix(teas: PublicTea[], rules: RuleLike[], setting: MixSettingLike): string | null {
  if (!setting.isEnabled) return "Custom mixes are paused right now.";
  if (teas.length < setting.minTeas) return `Pick at least ${setting.minTeas} teas.`;
  if (teas.length > setting.maxTeas) return `Pick no more than ${setting.maxTeas} teas.`;
  if (new Set(teas.map((t) => t.id)).size !== teas.length) return "Each tea can only be picked once.";
  for (const t of teas) {
    if (!isMixable(t, rules)) return `${t.name} isn't available for mixing.`;
  }
  for (let i = 0; i < teas.length; i++) {
    for (let j = i + 1; j < teas.length; j++) {
      const r = blockingRule(teas[i], teas[j], rules);
      if (r) return `${teas[i].name} and ${teas[j].name} don't mix${r.reason ? `: ${r.reason}` : "."}`;
    }
  }
  return null;
}

export function keyLabel(key: string): string {
  if (key === "*") return "anything else";
  return FAMILIES[key]?.label || TAGS[key] || key;
}

// The starting rule set, written into the database by migration and editable in admin.
export const DEFAULT_RULES: RuleLike[] = [
  { familyA: "green", familyB: "black", reason: "green tea wants cooler water and a shorter steep than black tea." },
  { familyA: "green", familyB: "puerh", reason: "pu-erh's earthy depth buries green tea." },
  { familyA: "white", familyB: "black", reason: "white tea is too delicate to stand next to black tea." },
  { familyA: "white", familyB: "puerh", reason: "white tea is too delicate to stand next to pu-erh." },
  { familyA: "white", familyB: "mate", reason: "mate's grassy bite drowns white tea." },
  { familyA: "puerh", familyB: "herbal", reason: "pu-erh's earthiness overpowers delicate flowers and fruit." },
  { familyA: "sleep", familyB: "caffeinated", reason: "sleep blends stay caffeine free." },
  { familyA: "matcha", familyB: "*", reason: "matcha is a powder and is whisked on its own." },
  { familyA: "wellness", familyB: "*", reason: "wellness teas are blended for one purpose and are best on their own." },
];
