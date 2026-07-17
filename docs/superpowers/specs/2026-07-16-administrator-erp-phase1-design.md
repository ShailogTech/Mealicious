# /administrator ERP — Phase 1 Design (Foundation + Core Modules)

**Date:** 2026-07-16
**Status:** Approved (pending spec review)
**Source:** `Mealicious-Official-ERP.zip` — a browser-only static ERP (3,416-line `app.js`, `localStorage`, no backend) to be rebuilt server-backed into the existing Next.js + Prisma codebase.

---

## 1. Goal & Context

Rebuild the Mealicious Official ERP as a server-backed Next.js application served at `/administrator`, sharing the existing codebase and database but **isolated** from the live commerce store at `/admin`.

The ERP source is a complete standalone product: 22+ modules, 7 roles, a per-module RBAC matrix, employee-linked logins with discipline (warn/suspend/terminate) and intern date-window flows, GST invoicing on official company letterhead, and ~26 data collections — all currently held in one `localStorage` blob. Rebuilding all of it faithfully is multi-phase work.

**Phase 1 scope:** the RBAC foundation + app shell + Dashboard + 4 core modules (Employees/HRMS, Invoices, Inventory, Finance). This proves the architecture across every hard problem (RBAC, employee↔account linkage, PDF gen, table isolation) and ships a usable slice.

### Key decisions (all confirmed with the owner)

| Decision | Choice | Rationale |
|---|---|---|
| Module scope | Core subset first (phased) | Ships real value fast; de-risks architecture on 4 modules not 22 |
| Auth model | Full multi-role RBAC (7 roles) | Faithful port of ERP's security model |
| Data model | Separate `Erp*` tables | Zero blast radius to live store; clean boundaries |
| Auth architecture | **Safe-B** — shared `admin-session` cookie, additive `requireAdmin()` | Unified login experience without risking the live store |
| Permissions storage | JSON blob on singleton config | Mirrors ERP's `permissions` object; simple, evolves easily |
| Employee fields | Full columns | Keystone module earns its columns; type-safe & queryable |
| Invoice PDF | Client-side jsPDF (ported) | Faithful to ERP; no server PDF dependency |
| Login key | Email | Consistent with existing `/admin` auth |
| Create-Login password | Generated, shown once | Matches ERP; stronger posture than HR-set |
| Dashboard data | Live Prisma aggregates | No fake data — faithful zero-state |

---

## 2. Data Model (Prisma)

All new models are **additive** — no existing model is modified. Naming follows existing conventions: `String @id @default(cuid())`, `DateTime createdAt/updatedAt`, `Decimal @db.Decimal(12,2)` for money, enums for fixed value sets, JSON for flexible blobs.

### Auth (RBAC core)

```prisma
model AdminUser {
  id              String      @id @default(cuid())
  email           String      @unique          // login key
  username        String?                      // ERP-style handle, nullable, display only
  hashedPassword  String
  displayName     String
  initials        String?
  photoUrl        String?
  role            ErpRole     @default(EMPLOYEE)
  isActive        Boolean     @default(true)
  suspendedAt     DateTime?
  suspendedReason String?
  lastLoginAt     DateTime?
  linkedEmployee  ErpEmployee?                 // 1:1 — discipline/intern logic lives here
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([role])
}

enum ErpRole {
  SUPER_ADMIN   // role-superadmin
  FINANCE       // role-finance
  SALES         // role-sales
  OPS           // role-ops
  HR            // role-hr
  EMPLOYEE      // role-employee
  INTERN        // role-intern
}
```

The per-module RBAC matrix is **not** a table-per-permission. It is stored as a JSON column on `ErpSystemConfig` (below), mirroring the ERP's `permissions` object: `{ [moduleKey]: { [ErpRole]: boolean } }`. `SUPER_ADMIN` always bypasses; `adminusers` and `companysettings` are hard-locked to `SUPER_ADMIN` and stripped from the togglable matrix (as in the ERP).

### Employee (keystone module)

Full column set — personal, employment, address, bank, productivity, discipline. Productivity stats auto-initialized on create (mirroring `assignProductivityStats()`).

```prisma
model ErpEmployee {
  id              String   @id @default(cuid())
  employeeCode    String   @unique           // "MV-EMP-0001"
  name            String
  dept            String                      // Production|Sales|Marketing|Finance|HR|Quality|Warehouse|Logistics|Procurement|R&D|Customer Support|Administration
  role            String                      // job title (e.g. "Founder & CEO")
  city            String?
  shift           String?
  team            String?
  orgLevel        String?                     // Staff | Team Lead | Manager
  employmentType  String   @default("Full-Time")  // Full-Time | Intern
  internshipStart DateTime?
  internshipEnd   DateTime?
  status          String   @default("Active")     // Active|On Leave|Warned|Suspended|Terminated
  joinedAt        DateTime?
  salary          Decimal  @default(0) @db.Decimal(12,2)

  // Personal
  gender            String?
  dob               DateTime?
  bloodGroup        String?
  maritalStatus     String?
  nationality       String   @default("Indian")
  aadhaar           String?
  pan               String?
  passportNumber    String?
  drivingLicense    String?
  personalEmail     String?
  officialEmail     String?
  emergencyContactName    String?
  emergencyContactNumber  String?

  // Address
  permanentAddress  String?
  currentAddress    String?
  state             String?
  pinCode           String?
  country           String   @default("India")
  workLocation      String?

  // Bank
  bankName          String?
  bankAccountNumber String?
  bankIFSC          String?
  bankBranch        String?

  // Productivity (initialized on create; deep-cut UI deferred to Phase 2)
  productivityScore   Int      @default(0)
  attendancePct       Float    @default(100)
  avgHours            Float    @default(0)
  taskCompletionPct   Float    @default(0)
  idlePct             Float    @default(0)
  performanceRating   String?
  monitoring          Json     @default("{}")  // {loginTracking,idleTracking,taskTracking,attendanceTracking,performanceRating,overtimeTracking,readOnly}

  adminUser       AdminUser?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([dept])
  @@index([status])
}
```

### Invoice (GST, sequential numbering, customer link)

```prisma
model ErpInvoice {
  id            String      @id @default(cuid())
  invoiceNumber String      @unique               // ErpSystemConfig.invoiceCounter + prefix
  date          DateTime
  customerName  String
  mobile        String?
  address       String?
  customerGst   String?
  items         Json                               // [{sno,name,qty,price,disc,taxable,gstPct,total}]
  subtotal      Decimal     @db.Decimal(12,2)
  discountTotal Decimal     @default(0) @db.Decimal(12,2)
  gstTotal      Decimal     @db.Decimal(12,2)
  cgst          Decimal     @db.Decimal(12,2)
  sgst          Decimal     @db.Decimal(12,2)
  grandTotal    Decimal     @db.Decimal(12,2)
  paymentMode   String      @default("Cash")       // Cash|UPI|Card|Bank Transfer|Credit
  customerId    String?
  customer      ErpCustomer? @relation(fields: [customerId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([date])
  @@index([customerId])
}

model ErpCustomer {
  id            String      @id @default(cuid())
  name          String
  mobile        String?     @unique
  whatsapp      String?
  address       String?
  gst           String?
  email         String?
  city          String?
  segment       String      @default("Retail")
  loyaltyPoints Int         @default(0)
  totalOrders   Int         @default(0)
  lifetimeValue Decimal     @default(0) @db.Decimal(12,2)
  invoices      ErpInvoice[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

### Inventory (isolated from store Product)

```prisma
model ErpInventoryItem {
  id           String   @id @default(cuid())
  name         String
  category     String                              // Makhana|Chips|Combo|Snacks|Other
  hsn          String?
  sku          String?
  stock        Int      @default(0)
  reorderLevel Int      @default(0)
  price        Decimal  @default(0) @db.Decimal(12,2)   // GST-inclusive
  gstPct       Decimal  @default(0) @db.Decimal(5,2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([category])
}
```

### Finance

```prisma
model ErpTransaction {
  id        String   @id @default(cuid())
  date      DateTime @default(now())
  type      String                              // Income | Expense
  category  String
  amount    Decimal  @db.Decimal(12,2)
  account   String                              // "Axis Bank - Current" | "HDFC - Savings" | "Cash"
  note      String?
  createdAt DateTime @default(now())

  @@index([type])
  @@index([date])
}
```

### System config (singleton — company identity, invoice counter, productivity rules, RBAC matrix, shifts)

```prisma
model ErpSystemConfig {
  id               String   @id @default("singleton")
  company          Json     // REAL_COMPANY_SETTINGS port (GSTIN, FSSAI, CIN, address, invoicePrefix, terms, footerText, bank details)
  invoiceCounter   Int      @default(10)        // monotonic; incremented atomically per invoice
  productivityRules Json    // {minWorkingHours,maxWorkingHours,minProductivityPct,maxBreakMinutes,idleThresholdMinutes,lateLoginAfter,earlyLogoutBefore}
  permissions      Json     // { [moduleKey]: { [ErpRole]: boolean } } — ported RBAC matrix
  shifts           Json     // [{name,start,end,type}] — 6 seeded templates
  updatedAt        DateTime @updatedAt
}
```

---

## 3. Auth & RBAC (Safe-B)

### Shared cookie, separate validation

`/administrator` reuses the existing `admin-session` cookie (same name, same `signSession`/`verifySession` from `src/lib/admin-session.ts`). A new module `src/lib/erp-session.ts` layers ERP semantics on top:

```ts
export interface ErpAdminSession { email: string; role: ErpRole }
// signErpSession() -> signSession({email, role})  (role added to JWT payload)
// getErpSession() -> verify cookie, then look up AdminUser to confirm isActive & not suspended
```

### Login flow (`POST /api/administrator/auth/login`)

1. Body `{ email, password }`. Rate-limit via existing `src/lib/rate-limit.ts`.
2. Find `AdminUser` by email. Reject if not found / `!isActive` / `suspendedAt` set.
3. `verifyPassword(hashedPassword, password)` (reuses `src/lib/password.ts`). Reject on mismatch.
4. If `role === INTERN` and `linkedEmployee` has `internshipStart/End`: enforce date-window gate —
   - `today < internshipStart` → reject "Your internship starts on {date}."
   - `today > internshipEnd` → reject "Your internship period ended on {date}."
5. Set `admin-session` cookie via `setSessionCookie()` carrying `{ email, role }`. Bump `lastLoginAt`.

### The backward-compatible `requireAdmin()` change

The critical safety property: **the existing env-based path is checked first and unchanged.** A new additive branch grants store-admin access to `SUPER_ADMIN` ERP users.

```ts
// src/lib/auth-server.ts — additive only
export async function requireAdmin(req: Request) {
  const session = await getSessionFromRequest(req);
  if (session) {
    // EXISTING PATH — untouched, permanent fallback
    if (ADMIN_EMAILS.includes(session.email.toLowerCase())) {
      return { user: { uid:'session-admin', email: session.email, isAdmin:true }, error: null };
    }
    // NEW PATH — SUPER_ADMIN ERP user also qualifies as store admin
    const erpUser = await db.adminUser.findUnique({ where: { email: session.email } });
    if (erpUser?.isActive && erpUser.role === 'SUPER_ADMIN') {
      return { user: { uid: erpUser.id, email: erpUser.email, isAdmin:true }, error: null };
    }
  }
  // ... existing stub-admin + Firebase fallbacks unchanged
}
```

**Why `/admin` cannot regress:** if `AdminUser` is empty, if ERP code throws, if anything fails — `/admin` falls back to today's exact behavior. The new path only ever *adds* access for seeded SUPER_ADMIN users; it never removes the env path.

### New helper for ERP routes

```ts
// src/lib/erp-session.ts
export async function requireErpRole(req: Request, moduleKey: string) {
  const session = await getErpSession();   // cookie -> AdminUser (active, not suspended)
  if (!session) return { user:null, error: unauthorized() };
  if (session.role === 'SUPER_ADMIN') return { user: session, error:null };
  if (moduleKey === 'adminusers' || moduleKey === 'companysettings')
    return { user:null, error: forbidden() };   // hard-locked
  const config = await getErpConfig();
  const allowed = config.permissions?.[moduleKey]?.[session.role] ?? false;
  if (!allowed) return { user:null, error: forbidden() };
  return { user: session, error:null };
}
```

---

## 4. App Shell & Module Architecture

### Route structure

```
src/app/administrator/
├─ layout.tsx                  # gated ERP shell (sidebar + topbar), distinct from /admin/layout.tsx
├─ page.tsx                    # redirect('/administrator/dashboard')
├─ login/page.tsx              # standalone (renders outside the gated shell)
├─ dashboard/page.tsx          # + DashboardClient.tsx
├─ employees/page.tsx          # + EmployeesClient.tsx
├─ invoices/page.tsx           # + InvoicesClient.tsx
├─ billing/page.tsx            # New Invoice form (ERP "billing" module type)
├─ inventory/page.tsx          # + InventoryClient.tsx
└─ finance/page.tsx            # + FinanceClient.tsx

src/app/api/administrator/
├─ auth/login/route.ts
├─ auth/logout/route.ts
├─ employees/route.ts                # GET, POST  (HR/SuperAdmin write)
├─ employees/[id]/route.ts           # GET, PATCH, DELETE
├─ employees/[id]/create-login/route.ts   # POST  (HR/SuperAdmin)
├─ invoices/route.ts                 # GET, POST
├─ invoices/[id]/route.ts            # GET, PATCH, DELETE
├─ inventory/route.ts                # GET, POST  (Ops/SuperAdmin write)
├─ inventory/[id]/route.ts
├─ finance/route.ts                  # GET, POST  (Finance/SuperAdmin write)
└─ finance/[id]/route.ts
```

ERP API routes live under `/api/administrator/*` — fully separate from `/api/admin/*`, each gated by `requireErpRole(req, moduleKey)`.

### Shell

The ERP groups 22+ modules in sections; a horizontal top-nav (as `/admin` uses) doesn't scale. `/administrator/layout.tsx` renders a **sidebar shell** instead: collapsible, grouped by section (Overview / People & Operations / Production & Growth), built with shadcn `Sheet` (mobile) + `ScrollArea`, lucide icons, theme toggle. Visually distinct from `/admin`'s top-nav so it's always clear which product you're in. Both share Tailwind tokens and shadcn components.

```tsx
// src/app/administrator/layout.tsx
export const dynamic = 'force-dynamic';
export default async function AdministratorLayout({ children }) {
  const session = await getErpSession();
  if (!session) redirect('/administrator/login');
  const config = await getErpConfig();
  const visibleModules = filterModulesByRole(MODULES, config.permissions, session.role);
  return <ErpShell session={session} modules={visibleModules} company={config.company}>{children}</ErpShell>;
}
```

The login page escapes the gated shell like this: `src/app/administrator/layout.tsx` checks the session and the current pathname. If there is no session and the pathname is `/administrator/login`, it renders `children` directly (the login form, no sidebar). If there is no session and the pathname is anything else, it redirects to `/administrator/login`. If there is a session and the pathname is `/administrator/login`, it redirects to `/administrator/dashboard`. This keeps login under the same route prefix without requiring a second layout file.

### Module rendering pattern

Consistent with existing code (`products/page.tsx` + `ProductsClient.tsx`): `force-dynamic` server `page.tsx` fetches via Prisma and passes props to a `*Client.tsx` component. The layout has already validated the session; the page re-checks the module-specific role implicitly via the layout's visible-modules filter (and the API enforces it server-side on writes).

### Shared ERP client components (`src/components/administrator/`)

- `ErpShell.tsx` — sidebar + topbar + theme toggle
- `ErpSidebar.tsx` — grouped nav, role-filtered
- `ErpDataTable.tsx` — generic CRUD table (React port of ERP `renderCrudModule`), driven by a column/field config mirroring `MODULES[].columns`
- `ErpFormDrawer.tsx` — add/edit drawer (`Sheet`/`Dialog`), field-type-driven
- `ErpPageHeader.tsx` — ERP equivalent of `AdminHeader`

This config-driven abstraction is what makes adding Phase 2-6 CRUD modules cheap.

---

## 5. Module Specs (v1)

### 5.1 Dashboard (`/administrator/dashboard`)

Zero-state-faithful port. KPI cards: Total Revenue (paid `ErpInvoice.grandTotal` sum), Active Employees (`ErpEmployee` where status=Active count), Pending Invoices count, Low-Stock Items (`ErpInventoryItem` where `stock <= reorderLevel`). Recent-invoices table (latest 6). 12-month revenue/expense line chart (Chart.js) computed from `ErpInvoice`/`ErpTransaction` history — flat zero at start, grows with real data. **No sample/demo data.**

Role gate: `dashboard` is visible to all roles per the seed matrix. KPI scoping by role is a later enhancement.

### 5.2 Employees / HRMS (`/administrator/employees`) — keystone

**List (`ErpDataTable`):** 11 columns from ERP — photo, employeeCode, name, dept, team, orgLevel, employmentType, status, productivityScore, documents count, loginUsername.

**Add/Edit (`ErpFormDrawer`):** all ~40 fields across Personal / Employment / Address / Bank sections. On create, productivity stats auto-initialized (mirroring `assignProductivityStats`: `attendancePct=100`, others 0, `productivityScore` computed, `monitoring` flags all-true).

**Row actions (HR/SuperAdmin only, matching ERP `extraRowActions`):**
- **Create Login** — `POST /api/administrator/employees/[id]/create-login`: generate username (`{firstname}.{lastname}` lowercased, unique) + temp password (`Welcome@{4 digits}`), create `AdminUser` linked to employee, return creds **shown once** in a dismissible dialog with copy button + "won't be shown again" warning. Visible only if no login exists.
- **Assign Work** — deferred to Phase 2; v1 shows a disabled "coming soon" state.
- **Monitoring Settings** — `PATCH` the `monitoring` JSON flags. Ships in v1 (simple flags edit).
- **Warning / Suspend / Terminate** — `PATCH status`; suspending also flips linked `AdminUser.isActive=false` and sets `suspendedAt`/`suspendedReason` (so they can't log in). This is the discipline flow.

Auth: `requireErpRole(req,'employees')` → HR + SuperAdmin write; other permitted roles read-only.

### 5.3 Invoices (`/administrator/invoices` + `/administrator/billing`) — flagship

**Billing (New Invoice form):** customer name, mobile, address, customer GST, date, payment mode, dynamic line-items editor (sno, name, qty, price, disc%, gst%). Live GST: `cgst = sgst = gstTotal/2`. On save (atomic):
- Increment `ErpSystemConfig.invoiceCounter` (transaction to prevent dupes); build `invoiceNumber` from `company.invoicePrefix` + counter.
- Compute `subtotal`, `gstTotal`, `cgst`, `sgst`, `discountTotal`, `grandTotal`.
- Customer upsert by mobile: update name/address/gst, bump `totalOrders` + `lifetimeValue`; else create (mirrors ERP). Link invoice to customer.
- Auto-create `ErpTransaction` (Income) for the grand total.
- *Deferred:* the ERP also creates a Sales-Order-equivalent record — that module is Phase 3, so v1 omits it.

**Invoices list:** `ErpDataTable`, ERP columns. Row action **Download PDF** — client-side `buildInvoicePDF()` (ported `invoice-pdf.js` as a TS module in `src/lib/administrator/invoice-pdf.ts`) using `/public/erp/letterhead.jpg`.

Auth: `requireErpRole(req,'invoices')` (Finance/Sales/SuperAdmin) for list; `requireErpRole(req,'billing')` for create.

### 5.4 Inventory (`/administrator/inventory`)

Simplest CRUD — proves the `Erp*` isolation. `ErpInventoryItem` table, `ErpDataTable` + `ErpFormDrawer`. Does **not** touch store `Product`. Low-stock count feeds Dashboard.

Auth: `requireErpRole(req,'inventory')` → Ops/SuperAdmin write; permitted roles read.

### 5.5 Finance (`/administrator/finance`)

CRUD on `ErpTransaction` (type, category, amount, account). Manual entry + list; auto-income from invoices writes here. Dashboard expense series reads from this table.

Auth: `requireErpRole(req,'finance')` → Finance/SuperAdmin.

---

## 6. Seed (idempotent, extends `prisma/seed.ts`)

Following the existing upsert-based convention:
- **`ErpSystemConfig` singleton** — `REAL_COMPANY_SETTINGS` ported verbatim (companyName `MEALICIOUS VENTURES PRIVATE LIMITED`, GSTIN `33AAUCM2609Q1ZT`, FSSAI `22426193000120`, CIN `U10799TZ2025PTC037179`, address, phone, email, website, `invoicePrefix` `MVPL-RETAIL-IN`, `invoiceStart` 10, terms & footer text, empty bank fields); 6 shifts from `genShifts()`; `productivityRules`; full 7-role × module permission matrix from `seedDatabase()`.
- **2 `ErpEmployee` rows** — CEO (Jeevapriyan Elangovan) & COO (Praveen Shanmugam), full field set from `genEmployees()`, dept "Administration".
- **2 `AdminUser` rows** — `jeevs@mealicious.store` (password `Mealicious@2212`) and `praveen@mealicious.store` (password `Praveen@2212`), hashed via `src/lib/password.ts`, `role=SUPER_ADMIN`, linked to the employees. `upsert` keyed on email.
- **README note:** change these passwords on first login.

### Permission matrix (ported from ERP)

```
dashboard:           all roles
employees, shifts,   HR, SuperAdmin
productivity, teams, groups, messages, mailtickets: HR, SuperAdmin
crm, sales, billing, invoices, customers, marketing: Sales, Finance, SuperAdmin
invoices, billing, purchase: Finance, SuperAdmin
inventory, manufacturing, supplychain, assets: Ops, SuperAdmin
finance, reports: Finance, SuperAdmin
projects: Employee, Intern, SuperAdmin (+ others by config)
adminusers, companysettings: SuperAdmin ONLY (hard-locked)
```

---

## 7. Migration Strategy

- New models added to `prisma/schema.prisma`. Applied via `bun run db:push` (non-destructive, per AGENTS.md).
- **Zero changes to existing models.** `AdminUser`/`Erp*` are purely additive.
- The single existing file modified is `src/lib/auth-server.ts` — the additive `requireAdmin()` branch.
- No existing API route, page, or model is changed.
- Letterhead asset → `public/erp/letterhead.jpg`; logo → `public/erp/logo.png` (new folder, no collision).

---

## 8. Build Sequence

Each step independently verifiable before the next.

1. **Schema + seed** — add models, `db:push`, seed, verify rows (Prisma Studio).
2. **Auth foundation** — `AdminUser`, `erp-session.ts`, login route + page, `requireErpRole()`. Verify: seed user logs in, bad password rejected, `/admin` unchanged.
3. **`requireAdmin()` additive change** — verify `/admin` env login still works AND a SUPER_ADMIN ERP user reaches `/admin`.
4. **Shell + Dashboard** — layout, sidebar, dashboard with live aggregates. Verify: empty-state dashboard, nav, role-filtered sidebar.
5. **Finance** (simplest CRUD) — proves `ErpDataTable`/`ErpFormDrawer` + API pattern.
6. **Inventory** — second CRUD; confirms pattern + isolation.
7. **Employees** — keystone: full form, productivity init, Create Login, discipline flow.
8. **Invoices + Billing** — flagship: GST math, sequential numbering, customer upsert, client-side PDF.

If any step breaks, prior steps still ship value.

---

## 9. Testing

Jest setup per existing config (`src/__tests__/**/*.test.ts(x)`).

**Unit:**
- GST computation helper (subtotal, cgst/sgst split, grand total)
- `productivityScore` formula (from `assignProductivityStats`)
- `genUsername` / `genPassword` helpers
- Invoice-number sequencing logic
- Permission-matrix lookup (`requireErpRole` decision logic with mocked session/db)

**API integration:**
- Login: success / bad password / suspended user / intern out-of-window
- Employees: CRUD + create-login + suspend (and linked `AdminUser.isActive` flips)
- Invoice create: customer upsert + counter increment (no dupes) + income transaction created
- Role gating: HR can write employees, Sales cannot; Ops can write inventory, HR cannot

**Manual checklist:**
- Login at `/administrator/login` and `/admin` both work
- Create invoice → download PDF on official letterhead
- Suspend an employee → they cannot log in
- `/admin` unaffected throughout all changes
- Seed passwords noted for first-login change

---

## 10. Explicitly OUT of v1 scope (Phase 2+)

Productivity time-tracking UI, Teams, Groups, Messages, Mail/Tickets, CRM/Leads, Sales/POS list, Purchase Orders, Vendor Portal, Manufacturing, Supply Chain, Projects kanban, Analytics deep-dive, Franchise, Distributors, Retail, Investors, Campaigns, Assets, Company Settings editor UI (singleton editable via seed for now), full department-based theming, CSV import/export, change-password flow, employee document file uploads (metadata-only in v1).

---

## Appendix A — Source references

ERP source (extracted): `/tmp/erp-inspect/Mealicious-Official-ERP/`
- `assets/js/app.js` — full app logic, 3,416 lines
- `assets/js/invoice-pdf.js` — PDF generator
- `assets/css/style.css` — design tokens, theme
- `index.html` — entry + shell markup

Existing codebase conventions (referenced):
- `prisma/schema.prisma` — model conventions
- `src/lib/admin-session.ts` — JWT cookie machinery (reused)
- `src/lib/auth-server.ts` — `requireAdmin()` (additive change)
- `src/lib/password.ts` — password hashing (reused)
- `src/lib/rate-limit.ts` — rate limiting (reused)
- `src/app/admin/layout.tsx` + `src/components/admin/TopNav.tsx` — existing admin shell (kept distinct)
- `src/app/api/admin/products/route.ts` + `src/app/admin/products/page.tsx` — API + page pattern reference
