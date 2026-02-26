export const SITE_NAME = "Mysthérie";
export const SITE_TAGLINE = "Mystery tea collections. Limited batches. Curated blends.";

export const DISCLAIMERS = [
  "Ingredients may vary by batch. Mystery items are curated from a rotating library of herbs, teas, and spices.",
  "Not intended to diagnose, treat, cure, or prevent any disease.",
  "If you are pregnant, nursing, have a medical condition, or take medications, consult a professional before use.",
  "May contain allergens or cross-contact with herbs, spices, and citrus.",
];

export const EFFECT_TYPES = ["Calming", "Energizing", "Balancing", "Neutral"] as const;
export const CAFFEINE_OPTIONS = ["Yes", "No", "May Contain", "Unknown"] as const;
export const BATCH_SIZE = 10;
export const MAX_BATCHES = 3;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mystherie.com";
