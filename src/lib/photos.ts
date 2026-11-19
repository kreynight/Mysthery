// Photos used across the shop.
// Pexels photos: Pexels license, free to use, no attribution required. Source pages are noted beside each.
// Plant photos in /public/photos: Forest & Kim Starr, Wikimedia Commons, CC BY 3.0 US (credit shown in the footer).
function pexels(id: number, w = 1400) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

export const PHOTOS = {
  // pexels.com/photo/tea-with-a-spoon-and-a-cup-on-a-table-27489187/
  hero: pexels(27489187, 1800),
  // pexels.com/photo/variety-of-tea-blends-on-wooden-spoons-28448494/
  mix: pexels(28448494),
  // pexels.com/photo/assorted-herbal-teas-and-spices-in-wooden-spoons-28513379/
  library: pexels(28513379),
  // Tea bushes on Yunnan hillsides, for the "Shop by origin" slide.
  origins: pexels(39218218, 1800),
};

export const PLANT_PHOTOS = {
  chadek: "/photos/chadek-pomelo.jpg",
  asowosi: "/photos/asowosi-bitter-melon.jpg",
  simenKontra: "/photos/simen-kontra-wormseed.jpg",
  bwaDinn: "/photos/bwa-dinn-herbarium.jpg",
  melis: "/photos/melis-lemon-balm.jpg",
  kowosol: "/photos/kowosol-soursop.jpg",
  camellia: "/photos/camellia-tea-leaves.jpg",
};

export const PHOTO_CREDIT =
  "Plant photos by Forest & Kim Starr, CC BY 3.0 US, via Wikimedia Commons. Other photography from Pexels.";

export const BATCH_PHOTOS: Record<string, string[]> = {
  // pexels.com/photo/close-up-of-lavender-bouquets-19132782/ and .../a-cluster-of-dried-flowers-in-a-clear-glass-jar-beside-a-mirror-7373480/
  "twilight-blend": [pexels(19132782), pexels(7373480)],
  // pexels.com/photo/close-up-of-dry-tea-16586224/ and .../selling-tea-in-market-9415609/
  "dawn-walker": [pexels(16586224), pexels(9415609)],
  // pexels.com/photo/dried-leaves-in-a-glass-8329983/
  "forest-floor": [pexels(8329983)],
};

// Stand-in photos by tea family until each tea has its own shot.
const FAMILY_PHOTOS: Record<string, string[]> = {
  black: [pexels(16586224, 800), pexels(9415609, 800)],
  green: [PLANT_PHOTOS.camellia, pexels(28448494, 800)],
  matcha: [PLANT_PHOTOS.camellia],
  white: [PLANT_PHOTOS.camellia],
  oolong: [pexels(16586224, 800)],
  puerh: [pexels(8329983, 800)],
  mate: [pexels(28448494, 800)],
  herbal: [pexels(28513379, 800), pexels(7373480, 800)],
  sleep: [pexels(19132782, 800)],
  wellness: [pexels(7373480, 800)],
  addin: [pexels(9415609, 800)],
};

// One Pexels photo per tea, by inventory number, chosen to show that tea or its main ingredient.
// Haitian bush teas with a plant photo of their own are matched by name below and aren't listed here.
const BY_INVENTORY: Record<number, number> = {
  2: 25436294,
  3: 10287889,
  4: 37832983,
  5: 14381803,
  6: 28836251,
  9: 32931375,
  12: 40425509,
  13: 11151812,
  14: 5389613,
  15: 8330047,
  16: 10487658,
  17: 6998567,
  18: 16724967,
  19: 33781552,
  20: 103875,
  21: 20535021,
  22: 34788195,
  23: 33843869,
  24: 37153750,
  25: 35151735,
  26: 30634048,
  27: 10775154,
  28: 27917041,
  29: 10348767,
  30: 19533203,
  31: 36471946,
  32: 4499223,
  33: 4050243,
  34: 787673,
  35: 30210309,
  37: 37091865,
  40: 32911366,
  43: 12477657,
  44: 7932743,
  46: 13383488,
  47: 20258244,
  48: 30216055,
  49: 12717629,
  50: 8329252,
  51: 4960059,
  52: 33781411,
  53: 6226209,
  54: 8952044,
  55: 189386,
  56: 37395078,
  57: 3123912,
  58: 38177945,
  59: 38541130,
  60: 6990075,
  61: 32087723,
  62: 32087738,
  63: 30216025,
  64: 32087719,
  65: 32087716,
  66: 31959376,
  67: 31956362,
  68: 31756541,
  69: 31756539,
  70: 3872132,
  71: 6569021,
  72: 13926598,
  73: 6087684,
  74: 31986686,
  75: 35042576,
  76: 37463188,
};

// Haitian bush teas with a photo of their own plant.
const OWN_PHOTOS: [RegExp, string][] = [
  [/chad[eè]k/i, PLANT_PHOTOS.chadek],
  [/asowosi/i, PLANT_PHOTOS.asowosi],
  [/simen kontra/i, PLANT_PHOTOS.simenKontra],
  [/bwa dinn/i, PLANT_PHOTOS.bwaDinn],
  [/^melis/i, PLANT_PHOTOS.melis],
  [/kowos[oò]l/i, PLANT_PHOTOS.kowosol],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface TeaPhoto {
  src: string;
  /** True when the photo was picked for this tea, false for a stand-in by family. */
  own: boolean;
  /** CSS object-position, varied a little so stand-ins don't look identical side by side. */
  position: string;
}

const POSITIONS = ["50% 50%", "30% 40%", "70% 60%", "40% 70%", "60% 30%"];

export function teaPhoto(tea: { id: string; name: string; family: string; inventoryNo?: number | null }): TeaPhoto {
  for (const [re, src] of OWN_PHOTOS) if (re.test(tea.name)) return { src, own: true, position: "50% 50%" };
  const own = tea.inventoryNo != null ? BY_INVENTORY[tea.inventoryNo] : undefined;
  if (own) return { src: pexels(own, 800), own: true, position: "50% 50%" };
  const list = FAMILY_PHOTOS[tea.family] || FAMILY_PHOTOS.herbal;
  const h = hash(tea.id);
  return { src: list[h % list.length], own: false, position: POSITIONS[h % POSITIONS.length] };
}
