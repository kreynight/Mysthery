# Mysthery — Admin Guide

This guide explains how to use the admin panel to manage your tea drops, view orders, and manage inventory.

---

## Logging In

1. Go to `your-site.com/admin`
2. Enter the password you set in your `ADMIN_PASSWORD` environment variable
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

## Viewing Orders

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
3. The seed script adds 10 sample ingredients

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
