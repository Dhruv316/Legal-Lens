# Legal Lens

A Next.js frontend for a supply-chain compliance and product-authenticity tool: dashboard, seller verification, product/entity graphs, a rewards program, and a chatbot assistant.

## Demo mode

This project ships with `DEMO_MODE = true` in `lib/demoConfig.js`. In this mode every page renders from local, cached sample data — no backend, database, or API keys are required to run or deploy it.

To connect the real backend instead, set `DEMO_MODE = false` and provide `NEXT_PUBLIC_BACKEND_URL` (see below).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need:

| Variable | Required when | Notes |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Viewing the Products or Entities map views | Restrict the key to your domain in Google Cloud Console before deploying anywhere public. |
| `NEXT_PUBLIC_BACKEND_URL` | `DEMO_MODE` is `false` | Base URL of the real backend API. Defaults to `http://localhost:5000`. |

## Project structure

```
app/
  page.js                 Landing page
  layout.js               Root layout
  Navbar.jsx               Shared nav
  CommandPalette.jsx       Cmd-K style command palette
  auth/                    Login / signup
  dashboard/               Dashboard (+ demo variant)
  check-compliance/        Compliance checker (+ demo variant)
  seller-verification/     Seller verification (+ demo variant)
  products/                Product catalog + map view (+ demo variant)
  entities/                Entity/supply-chain graph + map view (+ demo variant)
  rewards/                 Rewards program (+ demo variant)
  chatbot/                 Assistant (+ demo variant)
  demo/                    Shared demo-mode UI components
lib/                       Demo data, chatbot intents, report generation, shared helpers
public/                    Static assets and fonts
```

Each feature folder with a `Demo*.jsx` companion component is fully functional in `DEMO_MODE` without a backend; the real-backend code path stays in `page.jsx`/`page.tsx` for when it's needed.

## Deploying on Vercel

1. Push this repo to GitHub.
2. Import it into Vercel — it's auto-detected as Next.js, no config needed.
3. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` under Project Settings → Environment Variables if you use the map views.
4. Deploy.

## Tech stack

Next.js 15 (App Router) · React 19 · Tailwind CSS · Framer Motion · GSAP · Recharts · Google Maps API
