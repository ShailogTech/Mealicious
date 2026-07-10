# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mealicious Store — a single-page Next.js 16 / React 19 storefront for a premium dry-fruits & healthy snacks brand. Uses Prisma + SQLite, Tailwind 4, shadcn/ui (Radix), Zustand for client state, and an AI chat widget backed by `z-ai-web-dev-sdk`.

## Commands

Runtime is **Bun**, not Node. Use Bun for installs and scripts.

- `bun install` — install deps
- `bun run dev` — Next dev server on port 3005 (output tee'd to `dev.log`)
- `bun run build` — `next build` then copies `.next/static` and `public` into `.next/standalone/` (required because `next.config.ts` sets `output: "standalone"`)
- `bun run start` — runs the standalone server in production (`NODE_ENV=production bun .next/standalone/server.js`)
- `bun run lint` — ESLint (flat config in `eslint.config.mjs`)
- `bun run db:push` — push Prisma schema to SQLite (used as the bootstrap step; there are no migrations checked in for normal dev flow)
- `bun run db:generate` / `db:migrate` / `db:reset` — Prisma client/migration helpers

`DATABASE_URL` points to a local SQLite file (default `./db/custom.db`). The build script in `.zscripts/build.sh` bakes this DB into the production tarball — production startup refuses to launch if `/app/db/custom.db` is missing.

TypeScript build errors are ignored at build time (`next.config.ts` → `typescript.ignoreBuildErrors: true`); rely on `bun run lint` and editor diagnostics, not `next build`, to surface type issues.

## Architecture

### Single-page client app inside Next App Router
`src/app/page.tsx` is the entire user-facing app. It is a `'use client'` component that reads `currentPage` from the Zustand store and switch-renders one of ~18 page components from `src/components/mealicious/`. There is **no file-based routing for pages** — navigation is `useAppStore().navigate(page, params)`, not `next/link` or `useRouter`. When adding a new page, add a `Page` literal in `src/lib/store.ts` and a case in the `PageRenderer` switch in `src/app/page.tsx`.

### State: Zustand with persist
`src/lib/store.ts` is the single source of truth for navigation, cart, wishlist, auth state, search, and mobile menu. Cart and wishlist are persisted to localStorage via `zustand/middleware`. Auth here is **client-side only** (no real `next-auth` flow despite the dependency) — the `login`/`register` actions just set local store state.

### Data layer
- `src/lib/db.ts` — Prisma client singleton.
- `src/lib/data.ts` — static seed/demo data used by client components (the store mostly renders from this, not from API calls).
- API routes live under `src/app/api/{chat,products,orders,contact,newsletter}/route.ts` plus a root `route.ts`. They are thin — chat proxies to `z-ai-web-dev-sdk`; CRUD routes query Prisma.

### Database
Prisma + SQLite, schema in `prisma/schema.prisma`. JSON-shaped fields (addresses, images, variants, tags, nutrition, shippingAddr) are stored as **stringified JSON in String columns** — parse/serialize at the boundary; don't assume objects.

### UI
shadcn/ui components live in `src/components/ui/` (do not edit casually — they are generated). Brand-specific pages and widgets live in `src/components/mealicious/`. Tailwind 4 with `@tailwindcss/postcss`; theming via `next-themes`.

### Mini-services & deployment
`.zscripts/` contains bash automation used by an external build pipeline:
- `dev.sh` runs `bun install`, `bun run db:push`, starts dev server, then iterates `mini-services/*` (each with its own `package.json` + `dev` script) and starts them in background.
- `build.sh` builds Next + each mini-service, packages everything plus `Caddyfile` and the SQLite DB into `/tmp/build_fullstack_$BUILD_ID.tar.gz`.
- `start.sh` is the production entrypoint inside that tarball — boots Next standalone, then mini-services, then `caddy run` as PID 1.
- `Caddyfile` listens on `:81` and reverse-proxies to `localhost:3005` by default, or to a port specified via the `XTransformPort` query param.

The `mini-services/` directory is currently empty in this checkout but the tooling expects it; add sub-services as directories with their own `package.json` and `dev`/`build`/`start` scripts.

### Path aliases
`@/*` → `src/*` (see `tsconfig.json`).

## ⛔ VPS Infrastructure — LOCKED (do not modify)

The nginx/pm2/port mapping on this server is intentionally locked by the owner — see
`/root/AGENTS.md` and `/root/SERVER-PORTS.md` BEFORE touching any nginx config, pm2
process, port, or `.env` `DATABASE_URL`. mealicious.store → 3000 (this app, pm2
`mealicious`), ijrnexus.com → 3001. Never stop docker container `mealicious-db` (live
database). Locked files are `chattr +i` immutable — if an edit fails with "Operation
not permitted" as root, that is intentional: stop and tell the user. Deploy this app
ONLY with: `bun run build && pm2 restart mealicious`.
