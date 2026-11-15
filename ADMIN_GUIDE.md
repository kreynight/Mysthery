# Mysthéry — Admin Guide

This guide explains how to use the admin panel to manage your tea drops, view orders, and manage inventory. No terminal or coding required — everything is done from your browser.

---

## First-Time Setup (After Deploy)

1. Go to `your-site.com/admin`
2. Log in with your `ADMIN_PASSWORD`
3. Click **"Create Database Tables"** — this sets up your database (only needed once)
4. Click **"Load Sample Data"** — this adds 3 demo drops and 10 ingredients so you can see how the site looks
5. Visit your homepage to see the sample drops

---

## Logging In

1. Go to `your-site.com/admin`
2. Enter the password you set in the `ADMIN_PASSWORD` environment variable on Vercel
3. You'll see the dashboard with three sections: Drops, Orders, and Inventory

---

## Managing Drops

### Creating a New Drop

1. Go to **Admin** → **Drops** → **New Drop**
2. Fill in the fields:
   - **Name** — The drop name (e.g., "Twilight Blend")
   - **Slug** — Auto-generated from the name. This becomes the URL (`/drop/twilight-blend`)
   - **Price** — In dollars (e.g., `14.00` for $14)
   - **Batch Total** — How many units in this drop (e.g., `50`)
   - **Vibe Line** — Optional. A short mood phrase, 6-10 words
   - **Image URLs** — Paste image URLs one at a time and click "Add". You can use Unsplash, Cloudinary, or any public image URL
   - **Effect Type** — Calming, Energizing, Balancing, or Neutral
   - **Caffeine** — Yes, No, May Contain, or Unknown
   - **Tasting Notes** — Short description of flavor
   - **May Include** — Ingredient families (e.g., "Green teas, herbs, dried flowers")
   - **Steep Guide** — Temperature and time (e.g., "200°F / 3-5 min")
   - **Allergen Note** — Any allergen or cross-contact warnings
   - **Drop Notes** — Batch number, date, or vibe note
   - **Drop Start Date** — Optional
   - **Active** — Check this box to make the drop visible on the site
3. Click **Create Drop**

### Editing a Drop

1. Go to **Admin** → **Drops**
2. Click **Edit** on the drop you want to change
3. Make your changes and click **Update Drop**
4. You can adjust the "Remaining" count here if needed

### Activating / Deactivating a Drop

- Click **Deactivate** to hide a drop from the site (it stays in the database)
- Click **Activate** to make it visible again

### Deleting a Drop

- Click **Delete** — this permanently removes the drop and cannot be undone

---

## Batch size, descriptions and recipes

- **Pouches in this batch**: how many pouches you pour. New batches start at 12.
- **Mood, Flavor direction, Best time, Caffeine, Description**: shown to customers. Describe the feeling and taste, never the teas.
- **Recipe (private)**: the teas and parts in the batch. Customers never see it. Every order saves a copy with grams per pouch.
- **Pouch grams**: 28 g (1 oz) by default.

## Sizes, prices and shipping

- Customers buy 1, 3 or 5 pouches. Set all three prices on each batch (blank 3 and 5 prices fall back to a small bundle discount).
- Current prices: batches $18 / $48 / $72, generated mixes $22 / $60 / $90 (set under **Mix rules**).
- Shipping is added at Stripe checkout: $6 on a single pouch, free on 3 or more. Change it in `src/lib/pricing.ts`.
- A 3 or 5 pouch order takes 3 or 5 pouches off the batch count. The order's blend card shows grams for every pouch.

## Single pouches, low stock and rare teas

- Every tea in the Tea Library can be bought on its own as a 1 oz (28 g) pouch: $16, or $22 for Haitian and Chinese teas.
- Set **Grams on hand** for each tea under **Inventory**. Under 30 g it shows as **Low stock** and sells as a 10 g tasting pouch ($14, or $18 for Haitian and Chinese). Under 4 g it shows as sold out. Each single-pouch sale takes its grams off the count.
- Tick **Rare** on any tea to add the rare premium. A rare 1 oz pouch costs $8 more.
- Batches and generated mixes that include a rare or low stock tea cost $4 more per pouch, and show "Rare tea inside".
- Single-pouch orders show as "Single pouch: tea name" under **Orders**.
- Nothing sells more tea than you have. A batch shows the smaller of its pouch count and what its teas' grams can fill. The mix generator only picks blends the shelf can fill and greys out sizes it can't. Every paid order takes its grams off **Grams on hand**; if the stock ran out between checkout and payment, the order is marked **Review**. Teas with a blank gram count are never limited.

## Make a Mix (mix generator)

Customers tap optional picks (taste, feel, caffeine), pull the lever, and the site generates 2 to 3 teas from what's in stock, following the mix rules. The price for 1, 3 or 5 pouches shows the moment the blend lands. They can pull again as often as they like. The lead tea is 2 parts and the others 1 part each. Prices, tea count and pouch size are under **Mix rules**.

## Viewing Orders

Every order shows exactly what to blend: each tea with its inventory number, parts and grams per pouch. For more than one pouch it also shows the totals. The same recipe is saved on the Stripe payment as `blend` metadata.

1. Go to **Admin** → **Orders**
2. You'll see a list of all orders with:
   - Drop name and quantity
   - Status: `paid`, `pending`, `failed`, or `review`
   - Total amount
   - Customer email (from Stripe)
   - Date
   - Order ID

### Order Statuses

- **Paid** — Payment confirmed. Stock has been decremented.
- **Pending** — Checkout session created but not yet paid. These may be abandoned carts.
- **Review** — Payment was received but stock was insufficient at the time. This needs your manual attention (e.g., contact customer, issue refund).
- **Failed** — Payment failed.

---

## Inventory (Placeholder)

The inventory section lets you start building your ingredient library. This is a placeholder for future features.

1. Go to **Admin** → **Inventory**
2. Click **Add Ingredient** to add a new ingredient with name, category, origin, and notes
3. The "Load Sample Data" button on the dashboard adds 10 sample ingredients

---

## Hosting Your Images

You need somewhere to host your product images. Three easy options:

### Option A: Unsplash (for testing)
Use any Unsplash URL. The site is already configured to accept these.

### Option B: Cloudinary (recommended for production)
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier)
2. Upload images in the Cloudinary dashboard
3. Copy the URL and paste it in the admin image field
4. The site is already configured to accept Cloudinary URLs

### Option C: Supabase Storage
1. In your Supabase project, go to **Storage**
2. Create a bucket called `drop-images` and set it to **Public**
3. Upload images there
4. Copy the public URL and paste it in the admin

---

## Tips

- **Always set allergen notes** — even if it's just "Processed in a shared facility"
- **Keep vibe lines short** — 6-10 words max. Think Instagram caption, not product description
- **Use high-quality square images** — The site displays images as squares. 800x800px minimum
- **Monitor "review" orders** — These mean someone paid but stock ran out. Handle them manually
