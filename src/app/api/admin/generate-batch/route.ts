import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

interface Ingredient {
  id: string;
  inventoryNo: number | null;
  name: string;
  brand: string | null;
  category: string | null;
  flavorNotes: string | null;
  wellnessFunction: string | null;
  caffeineLevel: string | null;
  culturalRoots: string | null;
}

interface BlendSuggestion {
  name: string;
  vibeLine: string;
  effectType: string;
  caffeine: string;
  tastingNotes: string;
  ingredientMayInclude: string;
  steepGuide: string;
  ingredients: Ingredient[];
}

// Flavor profiles for pairing logic
const FLAVOR_FAMILIES: Record<string, string[]> = {
  floral: ["floral", "lavender", "rose", "jasmine", "chamomile", "hibiscus", "elderflower"],
  citrus: ["citrus", "lemon", "orange", "bergamot", "lemongrass", "grapefruit", "lime"],
  earthy: ["earthy", "mushroom", "root", "turmeric", "ginger", "beet", "dirt"],
  sweet: ["sweet", "vanilla", "honey", "caramel", "chocolate", "berry", "cinnamon", "apple", "peach"],
  spicy: ["spicy", "ginger", "pepper", "cardamom", "chai", "clove", "cinnamon", "masala"],
  herbal: ["herbal", "mint", "peppermint", "spearmint", "herb", "sage", "thyme", "basil"],
  smoky: ["smoky", "roasted", "toasted", "malty", "dark", "bold"],
  fresh: ["fresh", "green", "grassy", "crisp", "light", "clean"],
};

// Effect type groupings
const EFFECT_FAMILIES: Record<string, string[]> = {
  calming: ["calming", "relaxation", "sleep", "stress", "soothing", "wind-down", "bedtime", "calm"],
  energizing: ["energizing", "energy", "focus", "alertness", "boost", "invigorate", "stimulat"],
  balancing: ["balancing", "balance", "adaptogen", "wellness", "immunity", "digest", "gut", "detox", "cleanse"],
  neutral: ["neutral", "general", "everyday"],
};

function getFlavorProfile(ing: Ingredient): string[] {
  const text = `${ing.flavorNotes || ""} ${ing.name || ""}`.toLowerCase();
  const matches: string[] = [];
  for (const [family, keywords] of Object.entries(FLAVOR_FAMILIES)) {
    if (keywords.some((kw) => text.includes(kw))) {
      matches.push(family);
    }
  }
  return matches.length > 0 ? matches : ["neutral"];
}

function getEffectType(ing: Ingredient): string {
  const text = `${ing.wellnessFunction || ""} ${ing.name || ""}`.toLowerCase();
  for (const [effect, keywords] of Object.entries(EFFECT_FAMILIES)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return effect;
    }
  }
  return "neutral";
}

function getCaffeineCategory(level: string | null): string {
  if (!level) return "unknown";
  const l = level.toLowerCase();
  if (l === "none" || l === "decaf") return "none";
  if (l === "low") return "low";
  if (l === "medium") return "medium";
  if (l === "high") return "high";
  return "unknown";
}

function compatibilityScore(a: Ingredient, b: Ingredient): number {
  let score = 0;

  // Complementary flavors boost score
  const aFlavors = getFlavorProfile(a);
  const bFlavors = getFlavorProfile(b);
  const sharedFlavors = aFlavors.filter((f) => bFlavors.includes(f));
  score += sharedFlavors.length * 2; // shared flavors pair well

  // Adjacent flavor families also pair well
  const adjacentPairs = [
    ["floral", "sweet"],
    ["citrus", "fresh"],
    ["earthy", "spicy"],
    ["sweet", "spicy"],
    ["herbal", "fresh"],
    ["herbal", "floral"],
    ["smoky", "earthy"],
    ["smoky", "spicy"],
    ["citrus", "herbal"],
  ];
  for (const [x, y] of adjacentPairs) {
    if (
      (aFlavors.includes(x) && bFlavors.includes(y)) ||
      (aFlavors.includes(y) && bFlavors.includes(x))
    ) {
      score += 1;
    }
  }

  // Same effect type boosts coherence
  if (getEffectType(a) === getEffectType(b)) {
    score += 3;
  }

  // Caffeine compatibility
  const aCaf = getCaffeineCategory(a.caffeineLevel);
  const bCaf = getCaffeineCategory(b.caffeineLevel);
  if (aCaf === bCaf) {
    score += 2;
  } else if (
    (aCaf === "none" && bCaf === "low") ||
    (aCaf === "low" && bCaf === "none") ||
    (aCaf === "medium" && bCaf === "high") ||
    (aCaf === "high" && bCaf === "medium")
  ) {
    score += 1;
  }

  return score;
}

function generateBlendName(ingredients: Ingredient[], effectType: string): string {
  const mysteryAdjectives = [
    "Midnight", "Shadow", "Twilight", "Ember", "Whisper",
    "Solstice", "Eclipse", "Drift", "Moonlit", "Velvet",
    "Golden", "Silent", "Hidden", "Ancient", "Mystic",
  ];
  const nouns: Record<string, string[]> = {
    calming: ["Lullaby", "Dreamscape", "Serenity", "Still Waters", "Calm"],
    energizing: ["Spark", "Awakening", "Sunrise", "Ignite", "Pulse"],
    balancing: ["Harmony", "Equilibrium", "Roots", "Compass", "Balance"],
    neutral: ["Blend", "Journey", "Wanderer", "Discovery", "Path"],
  };

  const adj = mysteryAdjectives[Math.floor(Math.random() * mysteryAdjectives.length)];
  const nounList = nouns[effectType] || nouns.neutral;
  const noun = nounList[Math.floor(Math.random() * nounList.length)];
  return `${adj} ${noun}`;
}

function pickSteepGuide(ingredients: Ingredient[]): string {
  const hasBlackTea = ingredients.some(
    (i) => (i.category || "").toLowerCase().includes("black")
  );
  const hasGreenTea = ingredients.some(
    (i) => (i.category || "").toLowerCase().includes("green")
  );
  const hasHerbal = ingredients.some(
    (i) => (i.category || "").toLowerCase().includes("herbal")
  );

  if (hasBlackTea) return "212°F / 3-5 min";
  if (hasGreenTea) return "175°F / 2-3 min";
  if (hasHerbal) return "212°F / 5-7 min";
  return "200°F / 3-5 min";
}

function buildBlend(ingredients: Ingredient[]): BlendSuggestion {
  const effects = ingredients.map(getEffectType);
  const mostCommonEffect = effects.sort(
    (a, b) => effects.filter((e) => e === b).length - effects.filter((e) => e === a).length
  )[0];

  const allFlavors = ingredients.flatMap(getFlavorProfile);
  const uniqueFlavors = [...new Set(allFlavors)];

  const caffeines = ingredients.map((i) => getCaffeineCategory(i.caffeineLevel));
  const hasCaffeine = caffeines.some((c) => c === "medium" || c === "high");
  const hasNone = caffeines.some((c) => c === "none");

  let caffeineLabel = "Unknown";
  if (hasCaffeine) caffeineLabel = "Yes";
  else if (hasNone && !hasCaffeine) caffeineLabel = "No";
  else caffeineLabel = "MayContain";

  const flavorNotes = ingredients
    .map((i) => i.flavorNotes)
    .filter(Boolean)
    .join(", ");

  const tastingNoteWords = flavorNotes
    .toLowerCase()
    .split(/[,/&]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const uniqueTasting = [...new Set(tastingNoteWords)].slice(0, 5).join(", ");

  const ingredientFamilies = ingredients
    .map((i) => i.category || i.name)
    .join(", ");

  const effectLabel =
    mostCommonEffect.charAt(0).toUpperCase() + mostCommonEffect.slice(1);

  const vibeLines: Record<string, string[]> = {
    calming: [
      "A quiet cup for the end of the day.",
      "Let the world slow down, one sip at a time.",
      "Steep, breathe, release.",
    ],
    energizing: [
      "Wake up and wonder what's inside.",
      "A bold start wrapped in mystery.",
      "Fuel for the curious mind.",
    ],
    balancing: [
      "Find your center in every cup.",
      "A blend that brings it all together.",
      "Grounded, balanced, mysterious.",
    ],
    neutral: [
      "A mystery in every steep.",
      "You won't know until you try.",
      "Something new, something true.",
    ],
  };

  const vibes = vibeLines[mostCommonEffect] || vibeLines.neutral;

  return {
    name: generateBlendName(ingredients, mostCommonEffect),
    vibeLine: vibes[Math.floor(Math.random() * vibes.length)],
    effectType: effectLabel,
    caffeine: caffeineLabel,
    tastingNotes: uniqueTasting || uniqueFlavors.join(", "),
    ingredientMayInclude: ingredientFamilies,
    steepGuide: pickSteepGuide(ingredients),
    ingredients,
  };
}

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allIngredients = await prisma.inventoryIngredient.findMany({
      where: { inStock: true },
    });

    if (allIngredients.length < 3) {
      return NextResponse.json(
        { error: "Need at least 3 in-stock ingredients to generate blends." },
        { status: 400 }
      );
    }

    const suggestions: BlendSuggestion[] = [];

    // Strategy 1: Best-paired blend (highest compatibility scores)
    {
      const scored: { pair: [Ingredient, Ingredient]; score: number }[] = [];
      for (let i = 0; i < allIngredients.length; i++) {
        for (let j = i + 1; j < allIngredients.length; j++) {
          scored.push({
            pair: [allIngredients[i], allIngredients[j]],
            score: compatibilityScore(allIngredients[i], allIngredients[j]),
          });
        }
      }
      scored.sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        const topPair = scored[0].pair;
        // Find best third ingredient
        let bestThird: Ingredient | null = null;
        let bestThirdScore = -1;
        for (const ing of allIngredients) {
          if (ing.id === topPair[0].id || ing.id === topPair[1].id) continue;
          const s =
            compatibilityScore(ing, topPair[0]) +
            compatibilityScore(ing, topPair[1]);
          if (s > bestThirdScore) {
            bestThirdScore = s;
            bestThird = ing;
          }
        }
        const blendIngredients = bestThird
          ? [topPair[0], topPair[1], bestThird]
          : [topPair[0], topPair[1]];
        suggestions.push(buildBlend(blendIngredients));
      }
    }

    // Strategy 2: Calming / caffeine-free blend
    {
      const calmingPool = allIngredients.filter((i) => {
        const effect = getEffectType(i);
        const caf = getCaffeineCategory(i.caffeineLevel);
        return (
          (effect === "calming" || caf === "none" || caf === "low") &&
          caf !== "high"
        );
      });

      if (calmingPool.length >= 3) {
        // Pick 3-4 from calming pool with best pairings
        const shuffled = [...calmingPool].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(4, shuffled.length));
        suggestions.push(buildBlend(picked));
      } else if (calmingPool.length >= 2) {
        suggestions.push(buildBlend(calmingPool.slice(0, 2)));
      }
    }

    // Strategy 3: Energizing / caffeinated blend
    {
      const energizingPool = allIngredients.filter((i) => {
        const effect = getEffectType(i);
        const caf = getCaffeineCategory(i.caffeineLevel);
        return (
          effect === "energizing" ||
          caf === "medium" ||
          caf === "high"
        );
      });

      if (energizingPool.length >= 3) {
        const shuffled = [...energizingPool].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(4, shuffled.length));
        suggestions.push(buildBlend(picked));
      } else if (energizingPool.length >= 2) {
        suggestions.push(buildBlend(energizingPool.slice(0, 2)));
      }
    }

    // Strategy 4: Wild card - diverse blend from different categories
    {
      const categoryGroups: Record<string, Ingredient[]> = {};
      for (const ing of allIngredients) {
        const cat = ing.category || "Other";
        if (!categoryGroups[cat]) categoryGroups[cat] = [];
        categoryGroups[cat].push(ing);
      }

      const cats = Object.keys(categoryGroups);
      if (cats.length >= 3) {
        const shuffledCats = [...cats].sort(() => Math.random() - 0.5);
        const picked: Ingredient[] = [];
        for (const cat of shuffledCats) {
          if (picked.length >= 4) break;
          const group = categoryGroups[cat];
          picked.push(group[Math.floor(Math.random() * group.length)]);
        }
        if (picked.length >= 3) {
          suggestions.push(buildBlend(picked));
        }
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Generate batch error:", error);
    return NextResponse.json(
      { error: "Failed to generate batch suggestions." },
      { status: 500 }
    );
  }
}
