import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

const INVENTORY = [
  {inventoryNo:1,name:"Mulled Cider",brand:"Bird & Blend",teaNumber:null,category:"Fruit infusion (herbal)",ingredientsKey:"UNKNOWN",flavorNotes:"spiced, apple-cider",wellnessFunction:"warming, comforting",caffeineLevel:"None",culturalRoots:"European winter-inspired",format:"box (15 biodegradable tea parcels)",verificationLevel:"THREAD_LOG",notes:"Plastic-free noted; verify ingredients on box"},
  {inventoryNo:2,name:"Detox",brand:"Kusmi Tea",teaNumber:null,category:"Blend tea (green/mate style)",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"bright, citrus, grassy",wellnessFunction:"detox/reset (marketing)",caffeineLevel:"VERIFY_ON_PACK",culturalRoots:"European wellness blend w/ mate influence",format:"tin",verificationLevel:"ASSUMED_PARTIAL",notes:"Exact caffeine + ingredients not visible in thread text"},
  {inventoryNo:3,name:"Four Red Fruits",brand:"Kusmi Tea",teaNumber:null,category:"Flavored black tea",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"red berry, fruity",wellnessFunction:"uplifting",caffeineLevel:"Medium",culturalRoots:"French-style flavored tea tradition",format:"tin",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm exact fruit list on tin"},
  {inventoryNo:4,name:"Kashmir Tchaï",brand:"Kusmi Tea",teaNumber:null,category:"Spiced black tea (chai-style)",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"warm spice, chai-like",wellnessFunction:"warming, digestion support",caffeineLevel:"Medium",culturalRoots:"Indian chai inspiration",format:"tin",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm ingredients/spices on tin"},
  {inventoryNo:5,name:"Prince Vladimir",brand:"Kusmi Tea",teaNumber:null,category:"Flavored black tea",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"citrus-spice aromatic",wellnessFunction:"mood-lifting",caffeineLevel:"Medium-High",culturalRoots:"Russian-inspired blend",format:"tin",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm bergamot/citrus notes on tin"},
  {inventoryNo:6,name:"Decaffeinated Black Tea",brand:"Great Value",teaNumber:null,category:"Decaf black tea",ingredientsKey:"Black tea (decaf)",flavorNotes:"classic mild black tea",wellnessFunction:"late-day black tea option",caffeineLevel:"Decaf/Very Low",culturalRoots:"mainstream grocery",format:"single-serve bags",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:7,name:"Organic Elderberry Tea Bags",brand:"FGO",teaNumber:null,category:"Herbal (single ingredient)",ingredientsKey:"Elderberry",flavorNotes:"earthy, tart berry",wellnessFunction:"immune support (traditional use)",caffeineLevel:"None",culturalRoots:"European folk herbal use",format:"pouch w/ tea bags",verificationLevel:"THREAD_LOG",notes:"Croatia + USDA Organic mentioned"},
  {inventoryNo:8,name:"Golden Turmeric",brand:"La Colombe",teaNumber:null,category:"Herbal tisane blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"earthy turmeric, warm spice",wellnessFunction:"anti-inflammatory style support",caffeineLevel:"None",culturalRoots:"Ayurveda-inspired golden style",format:"tea bags/sachets",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm full ingredients on package"},
  {inventoryNo:9,name:"Riñosan",brand:"Tadin",teaNumber:null,category:"Herbal blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"herbal medicinal",wellnessFunction:"urinary/kidney support (traditional claim)",caffeineLevel:"None",culturalRoots:"Latin herbal tradition",format:"tea bags",verificationLevel:"ASSUMED_PARTIAL",notes:"Verify claims/ingredients on box"},
  {inventoryNo:10,name:"Blackberry Citrus + Zinc",brand:"Bigelow",teaNumber:null,category:"Herbal + added zinc",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"blackberry + citrus",wellnessFunction:"immune support (added zinc)",caffeineLevel:"None",culturalRoots:"mainstream wellness blend",format:"tea bags",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:11,name:"Peppermint Herbal Tea",brand:"Great Value",teaNumber:null,category:"Herbal (peppermint)",ingredientsKey:"Peppermint",flavorNotes:"cool mint",wellnessFunction:"digestion soothing",caffeineLevel:"None",culturalRoots:"global herbal staple",format:"tea bags",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:12,name:"Mahina (For Sleep)",brand:"Hawaiian Natural Tea",teaNumber:null,category:"Herbal sleep blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"soft floral/herbal",wellnessFunction:"sleep support",caffeineLevel:"None",culturalRoots:"Hawai'i-inspired botanicals",format:"tea bags/sachets",verificationLevel:"ASSUMED_PARTIAL",notes:"Ingredients not readable in thread text"},
  {inventoryNo:13,name:"Organic Lavender Flowers",brand:"The Tao of Tea",teaNumber:null,category:"Herbal (single ingredient)",ingredientsKey:"Lavender flowers",flavorNotes:"floral, aromatic",wellnessFunction:"calming, sleep support",caffeineLevel:"None",culturalRoots:"European/Persian/Ayurvedic herbal use",format:"tin (loose flowers)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:14,name:"The Palm Room",brand:"Miro Tea",teaNumber:null,category:"Herbal blend",ingredientsKey:"Lemon verbena; peppermint; chamomile",flavorNotes:"bright + soft herbal",wellnessFunction:"soothing, uplifting, digestive calm",caffeineLevel:"None",culturalRoots:"modern artisan blend",format:"pouch (loose)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:15,name:"Osmanthus Pu'er (Garden Direct)",brand:"Rishi",teaNumber:null,category:"Pu'er tea w/ flowers",ingredientsKey:"Pu'er tea; osmanthus flowers",flavorNotes:"earthy w/ floral-peachy lift",wellnessFunction:"grounding, post-meal support",caffeineLevel:"Medium",culturalRoots:"Yunnan pu'er tradition + osmanthus floral",format:"pouch (loose)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:16,name:"Saffron Bitters",brand:"Rishi",teaNumber:null,category:"Botanical bitter blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"bitter citrus + spice",wellnessFunction:"digestive bitter/aperitif style",caffeineLevel:"None",culturalRoots:"Italian amari-inspired botanical craft",format:"pouch (loose)",verificationLevel:"THREAD_LOG",notes:"Verify against pack text"},
  {inventoryNo:17,name:"Peach Gum (loose ingredient)",brand:"UNKNOWN",teaNumber:null,category:"Herbal add-in (resin)",ingredientsKey:"Peach gum resin",flavorNotes:"mild/neutral; jelly-like when prepared",wellnessFunction:"beauty/skin folklore; soothing add-in",caffeineLevel:"None",culturalRoots:"Traditional Chinese use",format:"jar",verificationLevel:"THREAD_LOG",notes:"Not a tea alone; used in simmered blends"},
  {inventoryNo:18,name:"Mango & Bergamot",brand:"Whittard",teaNumber:null,category:"Flavored green tea",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"mango + bergamot over green tea",wellnessFunction:"uplifting",caffeineLevel:"Medium",culturalRoots:"British tea blending",format:"boxed tea (set)",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm exact caffeine + ingredient list"},
  {inventoryNo:19,name:"Chelsea Garden",brand:"Whittard",teaNumber:null,category:"White tea w/ rose",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"delicate floral rose",wellnessFunction:"calming/light antioxidant",caffeineLevel:"Low",culturalRoots:"English garden aesthetic",format:"boxed tea (set)",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm ingredients"},
  {inventoryNo:20,name:"Darjeeling",brand:"Whittard",teaNumber:null,category:"Black tea (single origin)",ingredientsKey:"Darjeeling tea",flavorNotes:"muscatel/floral",wellnessFunction:"focus, classic afternoon",caffeineLevel:"Medium",culturalRoots:"India (Darjeeling) + British tea culture",format:"boxed tea (set)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:21,name:"Piccadilly Blend",brand:"Whittard",teaNumber:null,category:"Flavored black tea",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"fruity + floral",wellnessFunction:"cheerful uplift",caffeineLevel:"Medium",culturalRoots:"London-inspired",format:"boxed tea (set)",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm flavor notes"},
  {inventoryNo:22,name:"Afternoon Tea",brand:"Whittard",teaNumber:null,category:"Black tea blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"smooth balanced black tea",wellnessFunction:"daily/afternoon ritual",caffeineLevel:"Medium",culturalRoots:"British tea ritual",format:"boxed tea (set)",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm blend components"},
  {inventoryNo:23,name:"English Breakfast",brand:"Whittard",teaNumber:null,category:"Black tea blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"robust/malty",wellnessFunction:"energizing",caffeineLevel:"High",culturalRoots:"British staple",format:"boxed tea (set)",verificationLevel:"ASSUMED_PARTIAL",notes:"Confirm origins"},
  {inventoryNo:24,name:"Earl Grey",brand:"Whittard",teaNumber:null,category:"Black tea w/ bergamot",ingredientsKey:"Black tea + bergamot",flavorNotes:"citrus aromatic",wellnessFunction:"mood-lifting",caffeineLevel:"Medium-High",culturalRoots:"British classic",format:"boxed tea (set)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:25,name:"Darjeeling No. 25",brand:"Harrods",teaNumber:null,category:"Black tea (single origin)",ingredientsKey:"Darjeeling tea",flavorNotes:"delicate/floral",wellnessFunction:"light energy",caffeineLevel:"Medium",culturalRoots:"India origin / UK luxury retail",format:"boxed tea",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:26,name:"English Breakfast No. 14",brand:"Harrods",teaNumber:null,category:"Black tea blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"malty/brisk",wellnessFunction:"morning energy",caffeineLevel:"High",culturalRoots:"British tradition",format:"boxed tea",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:27,name:"Earl Grey No. 42",brand:"Harrods",teaNumber:null,category:"Black tea w/ bergamot",ingredientsKey:"Black tea + bergamot",flavorNotes:"citrus aromatic",wellnessFunction:"uplift",caffeineLevel:"Medium-High",culturalRoots:"British tradition",format:"boxed tea",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:28,name:"Afternoon Tea No. 16",brand:"Harrods",teaNumber:null,category:"Black tea blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"smooth balanced",wellnessFunction:"afternoon ritual",caffeineLevel:"Medium",culturalRoots:"British tradition",format:"boxed tea",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:29,name:"Assam No. 16",brand:"Harrods",teaNumber:null,category:"Black tea (single origin)",ingredientsKey:"Assam tea",flavorNotes:"rich malty",wellnessFunction:"strong energy",caffeineLevel:"High",culturalRoots:"India Assam / UK tea culture",format:"boxed tea",verificationLevel:"THREAD_LOG",notes:"Verify numbering on box"},
  {inventoryNo:30,name:"Blend No. 49",brand:"Harrods",teaNumber:null,category:"House black tea blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"balanced classic black tea",wellnessFunction:"anytime tea",caffeineLevel:"Medium-High",culturalRoots:"Harrods house blend",format:"boxed tea",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:31,name:"Temple Tonic",brand:"Miro Tea",teaNumber:null,category:"Herbal tisane",ingredientsKey:"Ginger; turmeric; orange peel",flavorNotes:"warm citrus-spice",wellnessFunction:"immune support; digestion",caffeineLevel:"None",culturalRoots:"modern botanical wellness",format:"pouch (loose)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:32,name:"Blueberry Delight",brand:"Seattle Spice Co.",teaNumber:null,category:"Fruit herbal blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"blueberry-currant-apple-hibiscus",wellnessFunction:"refreshing/antioxidant",caffeineLevel:"None",culturalRoots:"modern fruit tisane",format:"bag (loose)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:33,name:"Knockout",brand:"Seattle Spice Co.",teaNumber:null,category:"Herbal sleep blend",ingredientsKey:"Rosehips; chamomile; catnip; hops; raspberry leaf; stevia",flavorNotes:"herbal/floral",wellnessFunction:"sleep support",caffeineLevel:"None",culturalRoots:"western herbalism",format:"bag (loose)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:34,name:"Yerba Mate (loose)",brand:"UNKNOWN",teaNumber:null,category:"Yerba mate herb",ingredientsKey:"Yerba mate",flavorNotes:"earthy/grassy",wellnessFunction:"energy/focus",caffeineLevel:"High",culturalRoots:"South American tradition",format:"loose (jar/bag)",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:35,name:"Zoranj & Kowos\u00f2l",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#1",category:"Loose herbal",ingredientsKey:"Orange leaf (zoranj); soursop leaf (kowos\u00f2l)",flavorNotes:"citrus-herbal, lightly sweet",wellnessFunction:"sleep; grippe support (traditional)",caffeineLevel:"None",culturalRoots:"Haitian bush medicine",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:36,name:"Chad\u00e8k + Salt",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#3",category:"Loose peel blend",ingredientsKey:"Chad\u00e8k peel; salt",flavorNotes:"bitter citrus + mineral",wellnessFunction:"bloating/digestion (traditional)",caffeineLevel:"None",culturalRoots:"Haitian home remedy",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:37,name:"Kowos\u00f2l & Sitwon\u00e8l (Cold Exposure)",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#37",category:"Loose herbal",ingredientsKey:"Soursop leaf; lemongrass",flavorNotes:"bright citrus, soothing",wellnessFunction:"calm + recovery (traditional)",caffeineLevel:"None",culturalRoots:"Haitian folk healing",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:38,name:"Asowosi + Salt (Fever)",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#5",category:"Bitter herbal",ingredientsKey:"Asowosi; salt",flavorNotes:"very bitter/mineral",wellnessFunction:"fever support (traditional)",caffeineLevel:"None",culturalRoots:"Caribbean/Haitian bush medicine",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:39,name:"Bwa Dinn (Sweet)",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#11",category:"Aromatic bark/herb",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"woody-spiced, warming",wellnessFunction:"digestive/circulation (traditional)",caffeineLevel:"None",culturalRoots:"Afro-Caribbean tradition",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:"Bois d'Inde-like\u2014verify exact plant name"},
  {inventoryNo:40,name:"Mabi (Sweet + Medicinal forms)",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#10",category:"Root bark tea",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"bitter earthy base (can be sweetened)",wellnessFunction:"blood wash/cooling (traditional)",caffeineLevel:"None",culturalRoots:"Taino + Afro-Caribbean lineage",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:"Use small amount / Blood Wash"},
  {inventoryNo:41,name:"Simen Kontra (Wormseed/Santonica)",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#7",category:"Aromatic bitter herb",ingredientsKey:"Artemisia-type (wormseed/santonica)",flavorNotes:"intensely bitter, aromatic",wellnessFunction:"parasite cleanse; detox; digestive (traditional)",caffeineLevel:"None",culturalRoots:"Haitian herbal remedies",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:42,name:"Melis (Lemon Balm)",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#9",category:"Loose herbal",ingredientsKey:"Lemon balm (melisse)",flavorNotes:"sweet lemony soft",wellnessFunction:"calm; mood balance",caffeineLevel:"None",culturalRoots:"Mediterranean herb used in Haitian remedies",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:null},
  {inventoryNo:43,name:"Lang Ch\u00e0t + Salt (Grippe)",brand:"Th\u00e9 Atelier (heritage)",teaNumber:"#6",category:"Medicinal herbal",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"sharp herbal + mineral",wellnessFunction:"grippe/cold support (traditional)",caffeineLevel:"None",culturalRoots:"Haitian folk medicine",format:"hand-labeled loose",verificationLevel:"THREAD_LOG",notes:"Plant ID not fully verified"},
  {inventoryNo:44,name:"Energy (Colonial Blend)",brand:"La Via del T\u00e8",teaNumber:"#44",category:"Herbal/functional blend",ingredientsKey:"VERIFY_ON_PACK",flavorNotes:"warm, spiced, possibly cacao-like",wellnessFunction:"energy/focus positioning",caffeineLevel:"VERIFY_ON_PACK",culturalRoots:"Italian tea atelier style",format:"retail box/pouch",verificationLevel:"THREAD_LOG",notes:"Verify: if it contains guarana it likely has caffeine"},
  {inventoryNo:45,name:"Matcha Green Tea Bag",brand:"Ito En",teaNumber:"#45",category:"Green tea w/ matcha",ingredientsKey:"Japanese green tea; matcha",flavorNotes:"grassy, umami",wellnessFunction:"antioxidants; alertness",caffeineLevel:"Medium",culturalRoots:"Japanese tea culture",format:"tea bags",verificationLevel:"THREAD_LOG",notes:null},
];

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.order.deleteMany();
    await prisma.drop.deleteMany();
    await prisma.inventoryIngredient.deleteMany();

    // Sample Drops
    await prisma.drop.createMany({
      data: [
        {
          name: "Twilight Blend",
          slug: "twilight-blend",
          price: 1400,
          images: [
            "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop",
          ],
          vibeLine: "A quiet evening in a warm cup.",
          effectType: "Calming",
          caffeine: "No",
          tastingNotes: "Floral, light honey, lavender finish",
          ingredientMayInclude: "Chamomile family, dried flowers, herbs",
          steepGuide: "200\u00b0F / 4-6 min",
          allergenNote: "May contain cross-contact with herbs, spices, and citrus",
          dropNotes: "Batch #001",
          batchQuantityTotal: 50,
          batchQuantityRemaining: 50,
          isActive: true,
        },
        {
          name: "Dawn Walker",
          slug: "dawn-walker",
          price: 1600,
          images: [
            "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=800&h=800&fit=crop",
          ],
          vibeLine: "Rise and grind, but make it gentle.",
          effectType: "Energizing",
          caffeine: "Yes",
          tastingNotes: "Earthy, malty, subtle spice kick",
          ingredientMayInclude: "Black teas, roots, warm spices",
          steepGuide: "212\u00b0F / 3-5 min",
          allergenNote: "May contain cross-contact with herbs, spices, and citrus",
          dropNotes: "Batch #002",
          batchQuantityTotal: 30,
          batchQuantityRemaining: 30,
          isActive: true,
        },
        {
          name: "Forest Floor",
          slug: "forest-floor",
          price: 1800,
          images: [
            "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&h=800&fit=crop",
          ],
          vibeLine: "Grounding. Woodsy. A walk after rain.",
          effectType: "Balancing",
          caffeine: "May Contain",
          tastingNotes: "Smoky, earthy, deep mushroom undertone",
          ingredientMayInclude: "Green teas, adaptogenic herbs, bark, roots",
          steepGuide: "185\u00b0F / 5-7 min",
          allergenNote: "May contain cross-contact with herbs, spices, and citrus",
          dropNotes: "Batch #003",
          batchQuantityTotal: 20,
          batchQuantityRemaining: 20,
          isActive: true,
        },
      ],
    });

    // Full inventory from CSV
    for (const item of INVENTORY) {
      await prisma.inventoryIngredient.create({ data: item });
    }

    return NextResponse.json({
      ok: true,
      message: `Seeded 3 sample drops and ${INVENTORY.length} inventory items.`,
    });
  } catch (error) {
    console.error("Seed error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to seed: ${msg}` }, { status: 500 });
  }
}
