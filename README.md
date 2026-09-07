# Picolé POS

Internal point-of-sale and business management system for **Picolé Healthy Ice Pops**
staff. Admins and cashiers sign in, ring up sales through the POS, manage products and
availability, and review transactions, sales, and analytics. There is no customer-facing
side — this application is for authorized staff only.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth) — see [Database setup](#database-setup) below

## Architecture

```
src/
  app/                 # routes (UI)
    admin/             # full-access admin routes
    staff/             # restricted cashier routes
    login/             # shared staff/admin sign-in
  components/
    admin/             # admin-only screens
    staff/             # staff screens (products, dashboard)
    dashboard/         # shared shell + management screens (POS-adjacent)
    pos/               # point-of-sale UI
    ui/                # shared presentational primitives
  data/catalog.ts      # default product/category seed source
  lib/                 # server-only reads (auth, product-store, orders-data,
                        # inventory-data, dashboard-data) + pure helpers
  lib/actions/         # Server Actions - all mutations, plus a few
                        # client-pollable read wrappers
  lib/supabase/        # Supabase client setup (browser/server/proxy/admin)
  types/               # shared types
  proxy.ts             # role-based route protection (this Next.js version's
                        # name for middleware.ts)
supabase/migrations/    # numbered SQL files - schema, RLS policies, seed data
public/Assets/          # official logo + flavor board assets
```

## Database setup

The app is backed by Supabase (Postgres). To stand up a fresh environment:

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in the three values from
   your project's **Settings → API** page (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. In the Supabase SQL Editor, run every file under `supabase/migrations/` **in
   numeric order** (`0001_...` through `0008_...`). This creates the schema,
   RLS policies, and seeds the default flavor menu from `src/data/catalog.ts`.
4. Provision the first admin:
   - Dashboard → Authentication → add a user with a real email/password.
   - SQL Editor: `update public.profiles set role = 'admin', status = 'approved' where email = '...';`
   - Everyone else who signs up via `/login` starts as pending staff and needs
     an admin to approve them from Staff Management.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

- Login: `/login`
- Admin dashboard: `/admin` (Dashboard, POS, Transactions, Products, Inventory, Sales,
  Analytics, Staff Management, Settings)
- Staff/Cashier dashboard: `/staff` (Dashboard, POS, Transactions, Products, Inventory, Sales)

## Brand assets

Official logo and category boards live in `public/Assets/Assets/`:

- `Picole Logo PNG.avif`
- `Dip.avif`, `Lite.avif`, `Premium.avif`, `Milky.avif`, `Specialty.avif`, `Strawberry(with dalandan).avif`

Demo prices are placeholders until client pricing is confirmed.
