# NIPUN — MVP (Batch 1 + 2: Foundation, Marketplace, Files & 3D Viewer, Messaging)

Verified marketplace connecting Bangladeshi engineering students with real technical work.
This is the software build companion to the MME-202 project report — see the architecture
doc for the full system design rationale.

## What's built

**Batch 1 — Foundation**
- Full Postgres schema + Row Level Security policies (`supabase/migrations/`)
- Auth (email/password) with a two-step onboarding wizard
- Job marketplace: post, browse/search, apply, accept → creates a contract
- Role-aware dashboard
- Design system: dark "blueprint" theme, IBM Plex Mono/Sans, title-block cards

**Batch 2 — Files, 3D viewer, messaging**
- Private Supabase Storage bucket (`contract-files`) with path-scoped RLS, signed-URL
  downloads (50MB/file cap — mind the 1GB free-tier storage total)
- File upload/list on a new **Contract Detail** page (`/contracts/:id`)
- **In-browser 3D CAD viewer** — STEP/IGES/BREP via `occt-import-js` (WASM, runs in a
  Web Worker so parsing doesn't block the UI), STL/OBJ/glTF via three.js loaders,
  auto-framed camera + orbit controls. Lazy-loaded — three.js (~560KB) only downloads
  when someone actually opens a preview; the main app bundle is unaffected
  (confirmed via `npm run build`'s chunk output)
- Realtime messaging per contract (Supabase Realtime channel, `messages` table)
- A mock escrow state machine on the contract page (`pending → funded → released`) —
  no real payment gateway, exactly as scoped in the original architecture doc

## What's not built yet

- Reviews UI (table + policies exist, no form/display)
- Peer learning module UI (`peer_sessions`/`session_enrollments` tables exist)
- Admin verification queue
- GLB preview caching at upload time (parse once, store a small preview — the bandwidth
  optimization from the architecture doc; the raw file re-parses in-browser on every
  view for now, which is fine at prototype scale)
- The three pitch differentiators (material estimator, in-model commenting, proof-of-work
  skill badges)

## ⚠️ One thing to smoke-test yourself before the pitch

The STEP/IGES/BREP viewer (`occt-import-js`, a 7.6MB WASM module) is the one piece of
Batch 2 I could not visually verify — this build environment can run `tsc`, `vite build`,
and lint, but not an actual browser. Everything type-checks and builds clean, and the
integration follows the library's own official three.js + Web Worker examples exactly,
but **open a real STEP file in a real browser before you rely on it in a demo.** If it
doesn't render: open devtools → Network tab and confirm `/occt/occt-import-js.wasm`
returns 200 (Cloudflare Pages serves `public/` as static assets, so this should just
work, but it's worth a 30-second check). STL/OBJ/glTF don't depend on WASM and are
lower-risk.

## Setup

1. **Create a Supabase project** at supabase.com (free tier is enough for this).
2. **Run the migrations in order** — via the Supabase CLI:
   ```
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   or paste each file in `supabase/migrations/` (0001 → 0005) into the SQL Editor.
   0004 creates the storage bucket; 0005 turns on Realtime for `messages`.
3. **Copy env vars**:
   ```
   cp .env.example .env.local
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
   Project Settings → API in your Supabase dashboard.
4. **Install and run**:
   ```
   npm install
   npm run dev
   ```
   `npm install` also runs a postinstall script that copies the occt-import-js WASM
   runtime into `public/occt/` — if you ever see a missing-file error for that folder,
   just re-run `npm install`.

## Deploying to Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the
  Pages project settings — Pages won't read `.env.local`.
- `public/_redirects` (`/* /index.html 200`) is already included so client-side routes
  like `/jobs/:id` and `/contracts/:id` don't 404 on refresh.
- The `public/occt/` WASM assets deploy automatically as static files — no special
  Cloudflare config needed, but see the smoke-test note above.

## Keeping the Supabase project awake before a demo

Free-tier projects pause after 7 days of no API traffic. Add a scheduled GitHub Action
that pings your project's REST endpoint daily, or just make a couple of requests from
the app the morning of the pitch.

## Project structure

```
src/
  lib/            Supabase client, typed data-access functions (api.ts),
                   occt-import-js worker wrapper, CAD mesh conversion
  context/        AuthContext (session + profile state)
  types/          Hand-written types matching the DB schema
  components/
    ui/           Button, Badge, Card, form primitives — the design system
    layout/       Navbar, Footer, route guards
    cad/          CADViewer (three.js scene, lazy-loaded)
    files/        FileUpload, FileList (3D preview toggle, signed-URL downloads)
    messages/     MessageThread (realtime)
  pages/          One file per route; jobs/ and contracts/ hold the marketplace flow
supabase/
  migrations/     Schema, RLS, skill seed, storage bucket, realtime — run in order
scripts/
  copy-occt-assets.js   Keeps public/occt/ in sync with the occt-import-js version
```

