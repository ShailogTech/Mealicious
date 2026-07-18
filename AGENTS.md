# ⛔ VPS INFRASTRUCTURE — LOCKED. DO NOT MODIFY.

**To any AI agent or automation working on this server:** the domain/port/nginx/pm2
mapping on this VPS is intentionally locked by the owner. It was broken once
(wrong site served on wrong domain) and fixed + verified on 2026-06-10.

**You must NOT:**
- Change `proxy_pass` ports in `/etc/nginx/sites-available/{ijrnexus.com,mealicious.store,mealicious-dev}`
- Add or remove anything in `/etc/nginx/sites-enabled/`
- Delete, stop, or reconfigure pm2 processes `ijrnexus` (port 3001) or `mealicious` (port 3000)
- Stop the docker container `mealicious-db` (the live Postgres database)
- Change `DATABASE_URL` in `/var/www/Mealicious/.env`
- Run `next dev` for the production domains, or delete `.next` under a running server

These files are protected with `chattr +i` (immutable). If your edit fails with
"Operation not permitted" as root — that is intentional. **Stop and tell the user.**

The ONLY approved deploy procedure:
```bash
# IJRN (ijrnexus.com)
cd /root/IJRN && yarn build && pm2 restart ijrnexus
# Mealicious (mealicious.store) — note: run prisma generate BEFORE build
# whenever prisma/schema.prisma has changed, or the standalone server ships
# a stale client that crashes with "TypeError: db.<Model> is undefined".
cd /var/www/Mealicious && bunx prisma generate && bun run db:push && bun run build && pm2 restart mealicious
# If no schema change: the prisma generate + db:push steps are harmless no-ops.
```

If a human explicitly insists on changing the locked config, warn them first,
point them to `/root/SERVER-PORTS.md`, and require them to confirm. Unlock
procedure is documented there.

---

## Development Commands

```bash
bun run dev          # Start dev server on port 3000
bun run build        # Build for production (standalone output)
bun run start        # Run production server via bun from .next/standalone
bun run lint         # ESLint
bun run test         # Jest tests
bun run test:watch   # Jest watch mode
bun run test:coverage # Jest with coverage

# Prisma DB commands
bun run db:push      # Push schema changes without migration
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run dev migrations
bun run db:reset     # Reset database (destructive)
bun run db:seed      # Seed database
```

## Architecture Notes

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma, Bun
- **App Structure:** `src/app/` (pages + API routes), `src/components/` (ui/mealicious/admin/), `src/lib/` (utilities)
- **Path Alias:** `@/*` maps to `src/*`
- **State:** Zustand (client), TanStack Query
- **UI:** shadcn/ui components, dark mode via `class`

## Important Gotchas

- **TypeScript build errors are IGNORED** (`ignoreBuildErrors: true` in next.config.ts)
- **Standalone output enabled** — build copies `.next/static` and `public` to `.next/standalone/`
- **Production runtime is Bun**, not Node (dev uses Next.js Node server)
- **Prisma binary targets:** include `linux-musl-openssl-3.0.x` for Alpine/Docker
- **Database:** PostgreSQL via Prisma. See `.env.example` for required env vars
- **Tests:** Jest with ts-jest, tests in `src/__tests__/**/*.test.ts?(x)`
- **ESLint:** Many rules disabled intentionally (check eslint.config.mjs before enforcing)
- **Admin panel requires:** `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD`, `ADMIN_EMAILS` (comma-separated)

## Production Deployment (VPS)

- **App runs via pm2** (process name: `mealicious`, port: 3010, interpreter: `bun`)
- **Database:** Postgres container `mealicious-db` on localhost:5434
- **Location:** `/var/www/Mealicious`
- **Env file:** `/var/www/Mealicious/.env` (DO NOT modify DATABASE_URL)
- **Build script uses `cp`** — on Windows, replace with `xcopy` or use WSL/Git Bash

## Docker Deployment

```bash
docker-compose up -d    # Start app + db
docker-compose down     # Stop all
docker-compose logs -f  # View logs
```

- **docker-entrypoint.sh** runs `prisma db push` and seed on container start
- **Seed is idempotent** (uses upserts)
