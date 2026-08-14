# Picolé Order

Mobile-first QR ordering prototype for **Picolé Healthy Ice Pops**.

Customers scan a stall QR code → browse official flavor lines → cart → checkout (cash change calculation or e-wallet) → confirmation → order status. Staff manage orders at `/staff`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Local domain layer for cart/orders (ready to swap for Supabase later)

## Architecture

```
src/
  app/                 # routes (UI)
  components/
    customer/          # customer UI
    staff/             # staff UI
    ui/                # shared presentational primitives
  data/catalog.ts      # product/category source of truth
  lib/                 # cart + order business logic
  types/               # shared types
public/Assets/         # official logo + flavor board assets
```

## Run locally

```bash
cd picole-order
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- Customer menu: `/`
- Staff login: `/login`
- Staff dashboard: `/staff`
- Admin dashboard: `/admin`
- Admin Demo Login: Email: admin@picole.com Pass: admin123

## Brand assets

Official logo and category boards live in `public/Assets/Assets/`:

- `Picole Logo PNG.avif`
- `Dip.avif`, `Lite.avif`, `Premium.avif`, `Milky.avif`, `Specialty.avif`, `Strawberry(with dalandan).avif`

Demo prices are placeholders until client pricing is confirmed.
