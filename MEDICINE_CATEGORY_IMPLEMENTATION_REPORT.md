# MEDICINE CATEGORY IMPLEMENTATION REPORT

## 1. Summary

"Medicine" is now a first-class Goocart service across all three apps: the Express backend, the Expo customer app, and the Next.js admin portal. It plugs into the existing shared store-cart architecture (Grocery / Vegetables / Mart / Medicine all use one `GoCart Store` cart), so cart, checkout, orders, activity, and the sticky cart bar work for Medicine with zero new infrastructure. Medicine gets its own subcategory strip, contextual search, product detail sheet, promo + trust home sections, and Rx-only handling (`prescriptionRequired`) enforced at order placement.

## 2. Data Model & Schema

- `Product` (`server/src/models.ts`) gained `prescriptionRequired: { type: Boolean, default: false }`. Existing products are unaffected.
- Medicine products reuse the store `category` string field for subcategory slugs, plus `mrp`/`unit` already present on store products.
- Order `details` for store orders now persist `prescriptionRequired` per line item and `details.prescriptionRequired` / `details.prescriptionProvided` at order level.

## 3. Seed Data

- `seedData.ts`: `SERVICES` gains Medicine (name `"Medicine"`); `SEED_PRODUCTS` gains a 39-item Medicine block (lines 975–1013) across all 9 subcategories.
- Five Rx-only items are flagged `prescriptionRequired: true`: Amoxicillin 500mg, Azithromycin 500mg, Diclofenac 50mg (prescription-medicines), Metformin 500mg, Glimepiride 1mg (diabetes-care).
- Re-seed verified: 7 services enabled, 99 service items total.

## 4. Medicine Subcategories

Slugs are used verbatim by both apps (server `category`, customer subcategory strip, portal product form):

1. `prescription-medicines` — Prescription
2. `pain-relief` — Pain Relief
3. `cold-flu` — Cold & Flu
4. `vitamins-supplements` — Vitamins & Supplements
5. `diabetes-care` — Diabetes Care
6. `personal-care` — Personal Care
7. `baby-care` — Baby Care
8. `first-aid` — First Aid
9. `healthcare-devices` — Devices

Customer keyword maps (`HOME_RAW_CATEGORIES.medicine` in `customer/src/constants/serviceHome.ts`) drive `matchesCategory` keyword filtering (e.g. "dolo", "calpol", "cough", "sugar").

## 5. Server: Customer Routes (`server/src/routes/customer.ts`)

- `SERVICE_NAMES` + `MEDICINE` key; `STORE_SERVICES` include `"Medicine"`; reference prefix `Medicine: "MD"`.
- Medicine products included in the products allowlist; DTO exposes `prescriptionRequired`, `category`, `mrp`, `unit`.
- Store-order creation: any Medicine line with `prescriptionRequired` and `body.prescriptionProvided !== true` → `409 PRESCRIPTION_REQUIRED` ("Upload your prescription and confirm it…"). Multi-vendor split copy unchanged: "Place separate orders for different stores."
- Order `details.items` lines carry `prescriptionRequired`; `details` carries `prescriptionRequired` + `prescriptionProvided`.

## 6. Server: Admin & Portal Routes

- `admin.ts`: `productDTO` includes mrp/unit/category/prescriptionRequired; Medicine allowed in POST catalog; create/patch accept `category`, `unit`, `mrp`, `prescriptionRequired`.
- `portal.ts`: `COMMERCE` includes Medicine; product snapshot DTO gains `mrp`, `unit`, `category`, `prescription_required`; `product.create` accepts the new fields.
- `stock.adjust` / delete work unchanged for Medicine.

## 7. Customer App: Service Plumbing

- `types/index.ts`: `ServiceType` + `MEDICINE`; `StoreCartLineItem` union + optional `prescriptionRequired`.
- `constants/services.ts`: MEDICINE service entry (usesCart, theme `#0E9F6E`).
- `store/useStoreCartStore.ts`: `normalizeStoreService` maps `MEDICINE`/`MED` → `"MEDICINE"`; `storeProductRef` and `addItem` propagate `prescriptionRequired`.
- `ServiceOrderService.ts`: `ServiceProduct` + `prescriptionRequired`; `place()` accepts the `prescriptionProvided` flag via its `unknown` body (no signed change needed).
- `service/[type].tsx`: MEDICINE in `API_KEY`, Rx tag on listings, MRP strikethrough.
- Tabs 💊, search placeholder "Search for Calpol, Dolo, ORS...".

## 8. Customer App: UI

- Home: `MedicineHomeSections.tsx` (new) — category grid → trust card (Rx delivered, verified stock, 24×7 delivery) → 4 promotional carousels (Fever & Cold, Diabetes Care, Baby Care, First Aid & Devices) → brands (Crocin, Dettol, Vicks, Savlon, One Touch, Accu-Chek). Wired into `home.tsx` (`ProductContent` Medicine branch, search visibility).
- Rx badges on product cards (ProductSection, SubCategoryProductSection, GroceryProductCard) and an Rx info block in `ProductDetailSheet.tsx` (`TYPE_BY_SERVICE Medicine → MEDICINE`).
- Cart/checkout: `StoreCartSection` MEDICINE label/color/chip + Rx badge; `checkout/store.tsx` shows an Rx attestation section when any line is Rx-flagged, blocks place-order until confirmed, and sends `prescriptionProvided` to the server.
- Sticky cart bar, service subcategory strip, service recommendations, and OrderCard verified generic — no changes needed.

## 9. Admin Portal (`app/page.tsx`)

- `Service`/`commerce`/`allServices` include Medicine; KPI "of 7".
- Catalog copy: "Grocery, Vegetables, Mart and Medicine items"; inventory rows show Rx flag, MRP strikethrough, unit, and category-driven pricing.
- `CreateProductForm`: Medicine option, subcategory `<select>` (9 slugs from `MEDICINE_SUBCATEGORIES`), MRP / unit inputs, "Prescription required (Rx)" checkbox; POSTs `category`, `mrp`, `unit`, `prescriptionRequired`.

## 10. Rx Handling Design

- Rx status lives on the product (`prescriptionRequired`) and propagates through list, detail, cart line, and checkout.
- Enforcement is server-side at store-order creation: `409 PRESCRIPTION_REQUIRED` when Rx lines exist without `prescriptionProvided: true`.
- The check runs after the multi-vendor split validation, so combined-cart orders remain fully vendor-safe.
- `prescriptionProvided` is an attestation; prescription upload/verification is out of scope and noted as future work.

## 11. Verification

- Server `npm run typecheck`: pass. `npm run seed`: pass (7 services, 99 service items).
- Live API (curl): `/api/v1/customer/services` lists MEDICINE enabled; `services/Medicine/products` returns `prescriptionRequired` + mrp/unit/category; `?category=pain-relief|prescription-medicines|diabetes-care` filters correctly; exactly 5 products flagged Rx.
- Customer `npx tsc --noEmit`: only the 9 pre-existing baseline errors (activity.tsx:98/102, ActiveOrderHero.tsx:23/42/47/64, orderStatus.ts:138, OrderService.ts:5) — no new errors.
- Customer `npx expo export --platform web`: success (all routes bundled, incl. `/service/[type]`, `/checkout/store`).
- Portal `npm run typecheck`: pass.
- Live Rx 409 order gate not exercised end-to-end (requires OTP from server logs); logic reviewed at `customer.ts` gate and unit-verified against the seed Rx flags.

## 12. Deviations & Next Steps

- Medicines deliberately do not require pharmacy inventory per unit; stock is a simple count like other store products.
- `prescriptionProvided` is an attestation only. Future: prescription image upload with idempotency, an Rx-first ordering flow, and per-pharmacy inventory/vendor assignment.
- Entrepreneurship: extraction-grade report of the combined store cart, Rx dashboards in the portal, and Medicine-specific coupons remain future opportunities.