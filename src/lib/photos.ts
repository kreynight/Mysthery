// Stock photography (Pexels license: free to use, no attribution required).
// Source pages are noted so the photos can be swapped or credited later.
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

export const BATCH_PHOTOS: Record<string, string[]> = {
  // Calming floral: dried lavender
  // pexels.com/photo/close-up-of-lavender-bouquets-19132782/ and .../a-cluster-of-dried-flowers-in-a-clear-glass-jar-beside-a-mirror-7373480/
  "twilight-blend": [pexels(19132782), pexels(7373480)],
  // Malty black tea with spice
  // pexels.com/photo/close-up-of-dry-tea-16586224/ and .../selling-tea-in-market-9415609/
  "dawn-walker": [pexels(16586224), pexels(9415609)],
  // Dark, earthy leaf
  // pexels.com/photo/dried-leaves-in-a-glass-8329983/
  "forest-floor": [pexels(8329983)],
};
