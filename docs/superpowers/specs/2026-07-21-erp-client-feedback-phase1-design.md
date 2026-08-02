# ERP Client Feedback — Phase 1 Design (Quick Wins)

**Date:** 2026-07-21
**Status:** Approved (pending spec review)
**Scope:** Items #1, #6, #7, #9 from the client's 15-item feedback list. Items #2–#5, #8, #10–#15 are deferred to Phases 2–7.

---

## Context

The client provided 15 improvement requests for the Mealicious ERP. Two of them (#11 Marketing Department with 15 sub-modules, #12 Finance Department with 17 sub-modules) are multi-month efforts each. The 15 items decompose into 5+ independent phases. This spec covers Phase 1 only — the four quick wins that deliver immediate value with no new architecture.

### Key decisions (all confirmed)

| Item | Decision | Rationale |
|---|---|---|
| #1 Product picker | Auto-fill name + price + GST, all editable | Speed + flexibility — defaults from inventory, override allowed |
| #6 PO → expense | On PO create, always | Immediate, simple — mirrors existing invoice→income pattern |
| #7 Export | CSV + Excel + PDF for every module | Client explicitly asked for all three formats |
| #9 Access control | Lock existing checklist to Super Admin only | Client says "only Super Admin can assign/revoke" |

---

## #1 — Invoice Product Picker

### Goal
When generating an invoice in `/administrator/billing`, the product name field becomes a dropdown of ERP Inventory products instead of a manual text input. Selecting a product auto-fills the price and GST slab, all remaining editable.

### Data flow
```
BillingClient mounts
  → fetch GET /api/administrator/inventory (existing route)
  → store [{id, name, price, gstPct, sku}] in state
  → each line item renders a <Select> populated from the list
  → onSelect: set line.name = product.name, line.price = product.price, line.gstPct = product.gstPct
  → price/gstPct/qty/disc remain editable inputs below the dropdown
```

### API
No new route. The existing `GET /api/administrator/inventory` already returns `{items: [...]}` with the needed fields.

### Files changed
- `src/app/administrator/billing/BillingClient.tsx`
  - Add `useEffect` to fetch inventory on mount
  - Add `inventoryItems` state
  - Replace the line-item name `<Input>` with a `<Select>` (product picker)
  - Add `handleProductSelect(idx, productId)` — finds the product, fills name/price/gstPct
  - Keep the existing price/gstPct/qty/disc inputs as editable overrides

### No schema change. No new models. No new API routes.

---

## #6 — Purchase Order Auto-Expense

### Goal
Creating a Purchase Order automatically creates a matching Expense entry in the Finance module.

### Data flow
```
POST /api/administrator/purchase
  → create ErpPurchaseOrder {vendor, amount, status, date}
  → create ErpTransaction {type: "Expense", category: "Purchase Order: {vendor}", amount: po.amount, account: "Axis Bank - Current", note: vendor}
  → return {purchaseOrder}
```

Mirrors the exact pattern already in the invoices POST route (`/api/administrator/invoices/route.ts` lines 111-120), which auto-creates an Income transaction on invoice creation.

### Key decisions
- **Always on create** — regardless of PO status (client confirmed)
- Expense category: `"Purchase Order: {vendor}"` for traceability
- Expense account: `"Axis Bank - Current"` (same default as the finance form)
- No duplicate guard — PO creation is one-time; deleting a PO leaves the expense (manual reconciliation)

### Files changed
- `src/app/api/administrator/purchase/route.ts` — add ~6 lines after PO create to insert ErpTransaction

### No schema change. No new models.

---

## #7 — Export Data (CSV / Excel / PDF) for Every Department

### Goal
Every ERP module gets three export buttons (CSV, Excel, PDF) that download all records for that module in the chosen format.

### Architecture

#### 3a. Extend the export API
The existing `GET /api/administrator/export/[model]` returns CSV. Extend with a `?format=` query param:

| Format | Library | Content-Type | Notes |
|---|---|---|---|
| `csv` (existing) | inline | `text/csv` | Already works |
| `xlsx` (new) | `exceljs` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Styled headers, auto-width columns |
| `pdf` (new) | `jspdf` + `jspdf-autotable` | `application/pdf` | Landscape A4, table layout, company header |

**New dependencies:** `exceljs`, `jspdf-autotable` (jspdf already installed).

The 20 exportable models are already in the `ALLOWED` constant in the export route.

#### 3b. Reusable export component
Create `src/components/administrator/ErpExportButtons.tsx`:
- Renders three buttons: CSV, Excel, PDF (small icon buttons)
- Each calls `GET /api/administrator/export/{model}?format={csv|xlsx|pdf}`
- Triggers a download via blob + `<a>` element
- Super-admin only (renders nothing for other roles)
- Replaces the existing single-format `ErpExportButton.tsx`

#### 3c. Drop on every module page
Each of the ~18 ERP module `*Client.tsx` files gets `<ErpExportButtons model="..." canExport={!!canExport} />` in its `ErpPageHeader` action slot. One-line change per file.

### Files changed
- `src/app/api/administrator/export/[model]/route.ts` — add xlsx + pdf handlers
- `src/components/administrator/ErpExportButtons.tsx` — **new** (replaces ErpExportButton)
- `src/components/administrator/ErpExportButton.tsx` — **deleted** (superseded)
- `package.json` — add `exceljs`, `jspdf-autotable`
- ~18 `*Client.tsx` files — add `<ErpExportButtons>` in header action

### No schema change. No new models.

---

## #9 — Employee Access Control: Super Admin Only

### Goal
The per-employee module-access checklist (already built) should only be editable by Super Admin. Currently HR can also edit it.

### Changes

#### 4a. API gate
`src/app/api/administrator/employees/[id]/route.ts`:
- When the PATCH body contains `moduleAccess`, check the requesting user's role
- If not SUPER_ADMIN, return 403 "Only Super Admin can manage module access"
- Implemented by fetching the session user's role inside the route handler

#### 4b. UI gate
- `src/app/administrator/employees/page.tsx` — pass `canManageAccess={user.role === 'SUPER_ADMIN'}` to the client
- `src/app/administrator/employees/EmployeesClient.tsx` — wrap the "Module access overrides" section in `{canManageAccess && (...)}`. Non-super-admins don't see the buttons.

### Files changed
- `src/app/api/administrator/employees/[id]/route.ts` — add SUPER_ADMIN check for `moduleAccess`
- `src/app/administrator/employees/page.tsx` — pass `canManageAccess`
- `src/app/administrator/employees/EmployeesClient.tsx` — gate the section

### No schema change. No new models.

---

## Build sequence

Each step independently verifiable before the next:

1. **#1 Product picker** — modify BillingClient, verify the dropdown shows inventory products + auto-fills
2. **#6 PO auto-expense** — modify purchase POST route, verify creating a PO also creates a finance expense
3. **#9 Access control lock** — gate the module-access API + UI, verify non-super-admin can't edit
4. **#7 Export** — install deps, extend API, create component, wire across modules

Step 4 is the largest (touches ~18 files), so it goes last. The first three are isolated single-file changes.

### Verification
- Typecheck + lint + build after all four
- Prop-serialization audit (lesson from the icon bug — verify server→client props are all serializable)
- No `prisma generate` or `db:push` needed (no schema changes)

---

## Out of scope (Phases 2–7)

- #2 Wholesale invoice generator
- #3 Expense monitoring module + document upload
- #4 Remove storefront inventory, ERP as primary
- #5 Company email management
- #8 Bank account details + documents module
- #10 Premium branded invoice format
- #11 Marketing Department (15 sub-modules)
- #12 Finance Department (17 sub-modules)
- #13 Product page UX (add to cart / delete / open)
- #14 Order confirmation via Email + WhatsApp
- #15 Admin courier tracking → customer notification

Each gets its own spec → plan → build cycle when scheduled.
