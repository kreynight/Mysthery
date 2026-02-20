import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.order.deleteMany();
  await prisma.drop.deleteMany();
  await prisma.inventoryIngredient.deleteMany();

  // Sample Drops
  await prisma.drop.createMany({
    data: [
      {
        name: "Twilight Blend",
        slug: "twilight-blend",
        price: 1400, // $14.00
        images: [
          "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop",
        ],
        vibeLine: "A quiet evening in a warm cup.",
        effectType: "Calming",
        caffeine: "No",
        tastingNotes: "Floral, light honey, lavender finish",
        ingredientMayInclude: "Chamomile family, dried flowers, herbs",
        steepGuide: "200°F / 4-6 min",
        allergenNote: "Processed in a facility that handles citrus and nuts",
        dropNotes: "Batch #001 — Spring 2026",
        batchQuantityTotal: 50,
        batchQuantityRemaining: 47,
        isActive: true,
      },
      {
        name: "Dawn Walker",
        slug: "dawn-walker",
        price: 1600, // $16.00
        images: [
          "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=800&h=800&fit=crop",
        ],
        vibeLine: "Rise and grind, but make it gentle.",
        effectType: "Energizing",
        caffeine: "Yes",
        tastingNotes: "Earthy, malty, subtle spice kick",
        ingredientMayInclude: "Black teas, roots, warm spices",
        steepGuide: "212°F / 3-5 min",
        allergenNote: "May contain traces of cinnamon and ginger",
        dropNotes: "Batch #002 — Spring 2026",
        batchQuantityTotal: 30,
        batchQuantityRemaining: 28,
        isActive: true,
      },
      {
        name: "Forest Floor",
        slug: "forest-floor",
        price: 1800, // $18.00
        images: [
          "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&h=800&fit=crop",
        ],
        vibeLine: "Grounding. Woodsy. A walk after rain.",
        effectType: "Balancing",
        caffeine: "May Contain",
        tastingNotes: "Smoky, earthy, deep mushroom undertone",
        ingredientMayInclude: "Green teas, adaptogenic herbs, bark, roots",
        steepGuide: "185°F / 5-7 min",
        allergenNote: "May contain cross-contact with tree nuts and fungi",
        dropNotes: "Batch #003 — Limited micro-batch",
        batchQuantityTotal: 20,
        batchQuantityRemaining: 20,
        isActive: true,
      },
    ],
  });

  // Sample Inventory Ingredients
  await prisma.inventoryIngredient.createMany({
    data: [
      { name: "Chamomile", category: "flower", origin: "Egypt", notes: "Whole dried flowers" },
      { name: "Lavender", category: "flower", origin: "France", notes: "Culinary grade buds" },
      { name: "Peppermint", category: "herb", origin: "Pacific Northwest", notes: "Dried leaf" },
      { name: "Assam Black Tea", category: "tea", origin: "India", notes: "CTC grade" },
      { name: "Sencha", category: "tea", origin: "Japan", notes: "First flush" },
      { name: "Cinnamon", category: "spice", origin: "Sri Lanka", notes: "Ceylon sticks, ground" },
      { name: "Ginger Root", category: "root", origin: "Peru", notes: "Dried, sliced" },
      { name: "Reishi", category: "fungi", origin: "China", notes: "Powdered extract" },
      { name: "Lemon Peel", category: "fruit", origin: "California", notes: "Dried zest" },
      { name: "Hibiscus", category: "flower", origin: "Nigeria", notes: "Dried calyces" },
    ],
  });

  console.log("Seed complete.");
  console.log("  - 3 sample drops created");
  console.log("  - 10 sample ingredients created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
