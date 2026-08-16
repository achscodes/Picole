# Picolé POS

Internal point-of-sale and business management system for **Picolé Healthy Ice Pops**
staff. Admins and cashiers sign in, ring up sales through the POS, manage products and
availability, and review transactions, sales, and analytics. There is no customer-facing
side — this application is for authorized staff only.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Local domain layer for products/orders/inventory/auth (ready to swap for a real backend
  later — currently all state lives in the browser's `localStorage`)

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
  data/catalog.ts      # product/category source of truth
  lib/                 # auth, product, inventory, and order/POS business logic
  types/               # shared types
  middleware.ts        # role-based route protection
public/Assets/         # official logo + flavor board assets
```

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
- Admin Demo Login: Email: admin@picole.com Pass: admin123
- Staff Demo Login: Email: staff@picole.com Pass: staff123

## Brand assets

Official logo and category boards live in `public/Assets/Assets/`:

- `Picole Logo PNG.avif`
- `Dip.avif`, `Lite.avif`, `Premium.avif`, `Milky.avif`, `Specialty.avif`, `Strawberry(with dalandan).avif`

Demo prices are placeholders until client pricing is confirmed.
