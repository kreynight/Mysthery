export const SITE_NAME = "Mysthérie";
export const SITE_TAGLINE = "Teas from around the world, by the pouch or blended by hand.";

export const DISCLAIMERS = [
  "Ingredients may vary by batch. Mystery items are curated from a rotating library of herbs, teas, and spices.",
  "Not intended to diagnose, treat, cure, or prevent any disease.",
  "If you are pregnant, nursing, have a medical condition, or take medications, consult a professional before use.",
  "May contain allergens or cross-contact with herbs, spices, and citrus.",
];

export const EFFECT_TYPES = ["Calming", "Energizing", "Balancing", "Neutral"] as const;
export const CAFFEINE_OPTIONS = ["No", "Low", "Medium", "High", "Yes", "May Contain", "Unknown"] as const;
/** Default number of pouches poured per batch. Each batch can override it in the admin. */
export const BATCH_SIZE = 12;
/** Default pouch weight in grams (1 oz). */
export const PACK_GRAMS = 28;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mystherie.com";
