# Mysthéry — Mystery Tea Drops

A minimal, influencer-style ecommerce site for limited-batch mystery tea drops. Built with Next.js, Stripe, and Supabase Postgres.

No terminal or local setup required — everything runs through Supabase, Vercel, and Stripe dashboards.

## What's Included

- **Home page** — Grid of active drops with large images, price, and remaining count
- **Drop detail page** — Gallery, price, remaining count, buy button, and 5-7 detail items
- **Stripe Checkout** — "Buy Now" sends customers to Stripe for payment
- **Admin panel** (`/admin`) — Password-protected. Create/edit drops, view orders, manage inventory
- **Drop system** — Each drop has a limited batch. Remaining count decrements on paid orders
- **Oversell protection** — Stock is validated before checkout AND in the webhook
- **About & FAQ pages** — Static content with disclaimers
- **Mobile-first design** — Minimal colors, product-first layout

---

## Setup (No Terminal Required)

You only need a browser. You'll use three services (all have free tiers):

1. **Supabase** — database
2. **Vercel** — hosting
3. **Stripe** — payments

---

### Step 1: Create a Supabase Project (Database)

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Set a project name (e.g., `mysthery`)
4. Set a **database password** — copy this somewhere safe, you'll need it
5. Pick a region close to you
6. Click **"Create new project"** and wait for it to finish
7. Once ready, go to **Settings** (gear icon on the left sidebar) → **Database**
8. Scroll down to **Connection string** and click the **URI** tab
9. You'll see something like:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
10. Copy this URL and replace `[YOUR-PASSWORD]` with the password from step 4

Save this — it's your `DATABASE_URL`.

---

### Step 2: Create a Stripe Account (Payments)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and sign up
2. At the top of the dashboard, make sure **"Test mode"** is toggled ON (orange badge)
3. Go to **Developers** → **API keys**
4. Copy the **Secret key** (starts with `sk_test_`)

Save this — it's your `STRIPE_SECRET_KEY`.

---

### Step 3: Deploy to Vercel

1. Make sure this repo is on your GitHub account
2. Go to [vercel.com](https://vercel.com) and sign up with GitHub
3. Click **"Add New..."** → **"Project"**
4. Find and import your **Mysthéry** repository
5. **Before clicking Deploy**, click **"Environment Variables"** and add these one by one:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Supabase connection string from Step 1 |
| `STRIPE_SECRET_KEY` | Your Stripe secret key from Step 2 |
| `STRIPE_WEBHOOK_SECRET` | `placeholder` (you'll update this in Step 4) |
| `ADMIN_PASSWORD` | Pick any password for your admin panel |
| `NEXT_PUBLIC_BASE_URL` | Leave blank for now (you'll add your Vercel URL after first deploy) |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Your Instagram URL (optional, leave blank if none) |

6. Click **Deploy** and wait for it to finish
7. Vercel will give you a URL like `https://mysthery-xxxx.vercel.app`
8. Go back to **Settings** → **Environment Variables** and update `NEXT_PUBLIC_BASE_URL` to your Vercel URL
9. Redeploy: go to **Deployments** tab → click the three dots on the latest deployment → **Redeploy**

---

### Step 4: Set Up Stripe Webhook

This tells Stripe to notify your site when someone pays.

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. For **Endpoint URL**, enter: `https://your-vercel-url.vercel.app/api/webhook`
4. Under **"Select events to listen to"**, click **"Select events"**
5. Search for `checkout.session.completed` and check it
6. Click **"Add endpoint"**
7. On the next page, click **"Reveal"** under **Signing secret**
8. Copy the signing secret (starts with `whsec_`)
9. Go back to **Vercel** → **Settings** → **Environment Variables**
10. Update `STRIPE_WEBHOOK_SECRET` with the value you just copied
11. Redeploy again (Deployments → three dots → Redeploy)

---

### Step 5: Set Up Your Database Tables + Sample Data

1. Go to `https://your-vercel-url.vercel.app/admin`
2. Log in with the `ADMIN_PASSWORD` you set
3. Click **"Create Database Tables"** — this sets up the database schema
4. Click **"Load Sample Data"** — this adds 3 demo drops and 10 sample ingredients
5. Go to your homepage — you should see the three sample drops

That's it. Your site is live.

---

## After Setup

### Managing your store

Everything is managed through the admin panel at `/admin`:

- **Drops** — Create new drops, edit existing ones, set prices, upload image URLs, activate/deactivate
- **Orders** — View all orders, see payment status
- **Inventory** — Track your ingredient library (placeholder for future)

See `ADMIN_GUIDE.md` for detailed instructions.

### Going live with Stripe (real payments)

When you're ready to accept real money:

1. In Stripe Dashboard, toggle off **Test mode** at the top
2. Go to **Developers** → **API keys** and copy your **live** Secret key
3. In Vercel, update `STRIPE_SECRET_KEY` with the live key
4. In Stripe, create a new webhook endpoint (same URL, same event) — you'll get a new signing secret
5. In Vercel, update `STRIPE_WEBHOOK_SECRET` with the new signing secret
6. Redeploy

### Hosting your product images

You need somewhere to host images. Paste the URL into the admin when creating a drop.

**Option A: Cloudinary (recommended)**
1. Sign up at [cloudinary.com](https://cloudinary.com) (free)
2. Upload images in their dashboard
3. Copy the image URL and paste it in the admin

**Option B: Supabase Storage**
1. In your Supabase project, go to **Storage** in the left sidebar
2. Click **"New bucket"**, name it `drop-images`, and toggle **Public** on
3. Upload images, then right-click → **"Get URL"**
4. Paste the URL in the admin

**Option C: Unsplash (for testing)**
Use any Unsplash URL — the site accepts them out of the box.

---

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Prisma 6** (ORM)
- **Supabase Postgres** (Database)
- **Stripe Checkout** (Payments)
- **Vercel** (Hosting)
