# Mysthery — Mystery Tea Drops

A minimal, influencer-style ecommerce site for limited-batch mystery tea drops. Built with Next.js, Stripe, and Supabase Postgres.

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

## Setup (Step by Step)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Mysthery
npm install
```

### 2. Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Choose a name (e.g., "mysthery"), set a database password (save it!), pick a region
4. Wait for the project to finish creating
5. Go to **Settings** (gear icon) → **Database**
6. Under **Connection string**, click **URI**
7. Copy the connection string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
8. Replace `[YOUR-PASSWORD]` with the password you set in step 3

### 3. Set Up Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and sign up
2. Make sure you're in **Test mode** (toggle at the top)
3. Go to **Developers** → **API keys**
4. Copy the **Secret key** (starts with `sk_test_`)

### 4. Create Your .env File

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  (skip for now, set up in step 7)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
ADMIN_PASSWORD="pick-a-password"
```

### 5. Push Database Schema

```bash
npm run db:push
```

This creates all the tables in your Supabase database.

### 6. Seed Sample Data

```bash
npm run db:seed
```

This adds 3 sample drops and 10 sample ingredients.

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the three sample drops.

Admin: Go to [http://localhost:3000/admin](http://localhost:3000/admin) and enter your `ADMIN_PASSWORD`.

### 8. Set Up Stripe Webhook (for payments to work)

**For local development:**

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
3. It will print a webhook signing secret (starts with `whsec_`)
4. Add that to your `.env` as `STRIPE_WEBHOOK_SECRET`
5. Restart the dev server

**For production (after deploying):**

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://your-domain.com/api/webhook`
4. Events to listen for: `checkout.session.completed`
5. Copy the signing secret and add it to your Vercel env vars

---

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up with GitHub
3. Click **"New Project"** → import your repo
4. Before deploying, go to **Settings** → **Environment Variables** and add:
   - `DATABASE_URL` (your Supabase connection string)
   - `STRIPE_SECRET_KEY` (your Stripe secret key)
   - `STRIPE_WEBHOOK_SECRET` (from Stripe webhook setup)
   - `ADMIN_PASSWORD` (your admin password)
   - `NEXT_PUBLIC_BASE_URL` (your Vercel URL, e.g., `https://mysthery.vercel.app`)
   - `NEXT_PUBLIC_INSTAGRAM_URL` (optional)
5. Deploy!

After deploying, set up the Stripe production webhook (see step 8 above) pointing to your Vercel URL.

**Going live with Stripe:**
1. In Stripe Dashboard, toggle off Test mode
2. Get your live API keys
3. Update `STRIPE_SECRET_KEY` in Vercel env vars
4. Create a new webhook endpoint with your live keys
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel env vars
6. Redeploy

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home — drop grid
│   ├── layout.tsx            # Root layout
│   ├── drop/[slug]/page.tsx  # Drop detail
│   ├── about/page.tsx        # About page
│   ├── faq/page.tsx          # FAQ page
│   ├── success/page.tsx      # Order success
│   ├── cancel/page.tsx       # Order cancelled
│   ├── admin/                # Admin panel
│   │   ├── page.tsx          # Login + dashboard
│   │   ├── drops/            # Drops management
│   │   ├── orders/           # Orders view
│   │   └── inventory/        # Inventory placeholder
│   └── api/
│       ├── checkout/         # Stripe checkout session
│       ├── webhook/          # Stripe webhook
│       └── admin/            # Admin APIs
├── components/               # Shared UI components
├── lib/                      # Prisma client, Stripe, auth, helpers
└── generated/prisma/         # Prisma generated client (gitignored)
prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Sample data
```

---

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Prisma 7** (ORM)
- **Supabase Postgres** (Database)
- **Stripe Checkout** (Payments)
- **Vercel** (Hosting)
