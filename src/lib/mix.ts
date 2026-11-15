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
  isEnabled: boolean;
}

export interface PublicTea {
  id: string;
  inventoryNo: number | null;
  name: string;
  category: string | null;
  flavorNotes: string | null;
  caffeine: string;
  culturalRoots: string | null;
  family: string;
  tags: string[];
}

interface RawIngredient {
  name: string;
  category: string | null;
  caffeineLevel: string | null;
  wellnessFunction?: string | null;
  flavorNotes?: string | null;
  mixFamily?: string | null;
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

export function toPublicTea(
  ing: RawIngredient & { id: string; inventoryNo: number | null; culturalRoots: string | null }
): PublicTea {
  const family = deriveFamily(ing);
  const tags: string[] = [];
  if (isCaffeinated(ing.caffeineLevel)) tags.push("caffeinated");
  return {
    id: ing.id,
    inventoryNo: ing.inventoryNo,
    name: ing.name,
    category: ing.category && !/verify/i.test(ing.category) ? ing.category : null,
    flavorNotes: ing.flavorNotes && !/verify|unknown/i.test(ing.flavorNotes) ? ing.flavorNotes : null,
    caffeine: caffeineLabel(ing.caffeineLevel),
    culturalRoots: ing.culturalRoots && !/verify|unknown/i.test(ing.culturalRoots) ? ing.culturalRoots : null,
    family,
    tags,
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
