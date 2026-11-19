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
  /** True when the photo is of this tea's own plant, false for a stand-in by family. */
  own: boolean;
  /** CSS object-position, varied a little so stand-ins don't look identical side by side. */
  position: string;
}

const POSITIONS = ["50% 50%", "30% 40%", "70% 60%", "40% 70%", "60% 30%"];

export function teaPhoto(tea: { id: string; name: string; family: string }): TeaPhoto {
  for (const [re, src] of OWN_PHOTOS) if (re.test(tea.name)) return { src, own: true, position: "50% 50%" };
  const list = FAMILY_PHOTOS[tea.family] || FAMILY_PHOTOS.herbal;
  const h = hash(tea.id);
  return { src: list[h % list.length], own: false, position: POSITIONS[h % POSITIONS.length] };
}
