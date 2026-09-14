# Vendor Order Management — Implementation Report

## Objective
Production-ready, real-time vendor order receiving + payment + order details on the existing system — **no rebuild, no mock/fake orders, no separate order system**. Every value the vendor sees comes from MongoDB / the backend API, never from a customer-frontend claim or a hardcoded number. Chain:

**Customer places order → real API → Mongo `PLACED` (payment status set server-side at persist) → Socket.IO `order:new` → vendor popup + dashboard + Orders list + badge update instantly → View exact order → Accept/Reject via real atomic backend API → Mongo status update → Socket.IO → all vendor surfaces + customer reconcile → expiry watchdog `PLACED → EXPIRED`.**

---

## 1. Root cause
The prior workstream had built the full realtime chain (realtime hook, popup, newest-first list, `EXPIRED` watchdog, badge, dashboard sync) and it was verified. What was **missing** for this spec:

- **Payment wasn't surfaced on any vendor surface.** The backend has always persisted `paymentStatus` / `paymentMethod` / `refund` at order creation and exposes them in `toOrderDTO`, but neither the popup, the Orders cards, nor the detail screen rendered them. The detail screen showed only a raw `(paymentMethod.replace(/_/g, " "))` footnote under a single bare total.
- **The detail screen lacked the professional structure:** no placed-time, no real customer contact/call action, no item thumbnails, no ORDER SUMMARY breakdown (Item Total / Discount / Delivery Fee / Platform Fee / Taxes / Total), no dedicated PAYMENT card, no DELIVERY address text.
- `resolveVendorAutomation`'s active-counts `$nin` list didn't include `EXPIRED`, so a failed-automation restaurant could briefly show a stale automation state after expiry.

## 2. Frontend files changed
- **`vendor/src/utils/payment.ts`** (new) — presentation layer for the *trusted backend fields* only: `PAYMENT_METHOD_LABEL` map, `paymentDisplay(order)` → `{label, tone}` (Refunded > COD > Paid/Pending/Failed/Unknown), `PAYMENT_BADGE_COLORS` (green/amber/red/gray badges).
- **`vendor/src/store/useNewOrderPopupStore.ts`** — `NewOrderPopupItem` now carries `paymentStatus`/`paymentMethod`.
- **`vendor/src/hooks/useVendorRealtime.ts`** — passes `paymentStatus`/`paymentMethod` into the popup enqueue on `order:new`.
- **`vendor/src/components/NewOrderPopup.tsx`** — added **Payment:** row with tiered badge-color chip on the popup.
- **`vendor/app/(tabs)/orders.tsx`** — OrderCard now shows **Payment:** label + badge chip (per spec card 8).
- **`vendor/app/order/[id].tsx`** — full professional restructure (see §8).
- Carried from prior workstream: `vendor/src/utils/orderErrors.ts`, `useVendorRealtime.ts`, `useNewOrderPopupStore.ts`, `NewOrderPopup.tsx`, `useOrdersStore.ts` (in-flight guard), `vendor/src/types/index.ts` (`EXPIRED`), `app/_layout.tsx` (hook + popup mount), `app/(tabs)/orders.tsx`, `app/(tabs)/_layout.tsx` (badge), `app/(tabs)/home.tsx` (View → /orders).

## 3. Backend files changed
- **`server/src/lib/orderState.ts`** — `"EXPIRED"` added to `OrderStatus` union, `TERMINAL_STATUSES` (dashboard aggregation + admin active queries drop expired orders automatically), `CANCELLED_STATUSES`.
- **`server/src/routes/orders.ts`** —
  - Deadline guard in `POST /:id/transition`: vendor accept/reject on a manual-acceptance `PLACED` order past `manualAcceptanceDeadlineAt` → `409 ORDER_EXPIRED` ("This order is no longer available."). No code change to the vendor app needed: `mapOrderApiError` already maps `ORDER_EXPIRED` → the friendly message.
  - `eventTypeForStatus` maps `EXPIRED → "ORDER_EXPIRED"`.
  - **`resolveVendorAutomation` `$nin` list now includes `"EXPIRED"`** — failed-automation restaurants get correct `automation` / `manualAcceptanceRequired` after expiry.
- **`server/src/lib/acceptanceWatchdog.ts`** — 30s sweep now **atomically transitions** overdue manual orders `PLACED → EXPIRED` via CAS (`findOneAndUpdate` on `{_id, status:"PLACED"}`, `$set` status + `autoCancellationAt` + `cancellationReason:"ACCEPTANCE_TIMEOUT"`, `$push` statusHistory + events), null-result (concurrent accept won) skipped; then `clearOrderTimers`, vendor-staff + customer push, room cleared, emits `order:acceptance_overdue` (with `expired: true`) and `order:update`.

## 4. MongoDB schema / model changes
- **No schema changes.** The order already persisted everything needed server-side. Payment truth was never client-supplied: the create route (`POST /api/v1/orders`) sets `paymentStatus` on the **stored document** — `"PAID"` for digital/UPI paths (simulated payment in this prototype), `"NOT_APPLICABLE"` for COD — plus `paymentMethod`, `bill` (full `calculateBill` breakdown), `deliveryAddress`, and item `lineTotal`/`unitPrice`. `toOrderDTO` already exposed all of it. This report only **rendered** those existing fields.
- `OrderStatus` gained the `EXPIRED` value (discriminator/string union, validated by Mongoose enum at write time).

## 5. APIs used / changed
- `GET /api/v1/orders/:id` — order detail (used as-is).
- `POST /api/v1/orders/:id/transition` — accept/reject (added the expiry deadline guard → `409 ORDER_EXPIRED`).
- `GET /api/v1/vendor/dashboard` — revenue / today's orders / pending count / automation (used as-is; aggregation-driven, never frontend `+1/-1`).
- `GET /api/v1/orders` — list (used as-is).
- `GET /api/v1/restaurants/me` — automation/permission context (used as-is).

## 6. Socket events used / changed
- `order:new` — emitted **after** `Order.create` + AuditLog persist (spec 13 satisfied: persist first, then emit) with the full DTO. Vendor hook enqueues popup (now incl. payment) + refreshes orders & dashboard.
- `order:update` — emitted on every transition including `EXPIRED`; refreshes orders; refreshes dashboard only when status moves across pool boundaries (`VENDOR_ACCEPTED`, `VENDOR_REJECTED`, `EXPIRED`, `CANCELLED*`, `AUTO_CANCELLED`).
- `order:acceptance_overdue` — vendor + admin, with `expired: true`.
- `connect` — fires on initial connect **and** reconnect → re-sync orders + dashboard (rooms rejoin server-side), reconciling anything missed while offline.
- No new socket server, no duplicate listeners — one global hook (`useVendorRealtime`) mounted in the root layout owns all listeners.

## 7. Payment flow changes
- **Vendor-side:** payment is **read-only truth from the backend DTO** (`paymentStatus`/`paymentMethod`/`refund`). Rendering via `paymentDisplay()`:
  - `refund.status !== "NONE"` → **Refunded** (red badge) — takes precedence.
  - `paymentMethod === "COD"` or `paymentStatus === "NOT_APPLICABLE"` → **COD** (gray badge).
  - Else `PAID` → green "Paid", `PENDING` → amber "Pending", `FAILED` → red "Failed", unknown → neutral.
- Displayed in three places: popup ("Payment: Paid"), Orders cards, and the detail screen's PAYMENT card (Status + Method: UPI / Google Pay / PhonePe / Paytm / Cards / Net Banking / Wallet / Cash on Delivery).
- **No payment gateway exists** in this prototype; the customer checkout simulates success, but the order doc is only created on that success path and `paymentStatus` is stamped server-side at persist — the vendor never trusts the client claim.

## 8. Vendor UI changes
- **Orders list cards**: newest-first with NEW badge, order number, customer, `N items • ₹total`, distance + ETA, time-ago, live accept countdown, **Payment badge row**, View/Accept/Reject (reject confirms), `mapOrderApiError` on failure.
- **Order detail** (`/order/[id]`) professional structure:
  1. NEW ORDER hero — title, `#orderNumber`, `N items • total`, **Placed <date/time>**.
  2. **Customer** card — avatar monogram, name, contact name/number, functional **call button** (`Linking` → `tel:` when a number is present; button hidden otherwise).
  3. **Order Items** — every item with **image thumbnail** (placeholder icon when no image), name, `Qty: N × ₹unit`, variant + addons, line total.
  4. **Order Summary** — Item Total, combined **Discount** (`restaurantDiscount + couponDiscount`, shown only when > 0), **Delivery Fee** / **Platform Fee** / **Taxes** / **Tip** (each shown only when > 0 — no invented values), divider, **Total**.
  5. **Payment** card — Status badge + Method.
  6. **Delivery** card — full address text (line1, building, street, landmark, city/state + pincode) + `X km • Y mins away`.
  7. Accept / Reject (busy labels), or EXPIRED / Accepted / Rejected end states; live countdown banner while the window is open.
- **Popup** — order number, customer, `N items • ₹total`, **Payment: <badge>**, View Order → exact `/order/[id]`, 8s auto-dismiss, one at a time.

## 9. Realtime sync flow
1. Customer checks out → `POST /orders` → **Mongo document persisted with server-stamped payment + bill + address → AuditLog → then** `emitOrderUpdate` with the full DTO (`order:new`).
2. Vendor global hook receives `order:new` → dedupe-by-id popup enqueue (+payment) → refresh orders list + dashboard + badge.
3. Vendor taps **Accept** → `POST /transition` with CAS/`expectedStatus` → Mongo update wins → `order:update` → hook refreshes list + dashboard; screen mirrors newest status (auto-navigates to list on accept/reject).
4. Reject → same atomic path with confirmation; expiry path: watchdog CAS `PLACED → EXPIRED` → `order:update` + `order:acceptance_overdue` → vendor shows expired card, badge drops, pending count 1 → 0.
5. Reconnect → `connect` handler re-fetches orders + dashboard. Dedupe by `orderId` at popup/store; in-flight guard prevents concurrent fetch races.

## 10. Tests performed + results
- ✅ `server`: `npx tsc --noEmit` clean.
- ✅ `vendor`: `npx tsc --noEmit` clean; `npx eslint src/ --ext .ts,.tsx` clean (0 warnings).
- ✅ `vendor`: `npx expo export -p web` — 20 static routes built including `/order/[id]`, `/orders`.
- ✅ `customer`: `npx tsc --noEmit` — only pre-existing unrelated errors (activity/ActiveOrder/OrderService typing); all `EXPIRED` additions typecheck.
- ✅ Server `/health` → `200 {status:"up", database:"goocart", mongo:"connected"}` after hot reload.
- **End-to-end scenarios to verify live** (recommended, same as prior session): place a Rice × 2 order → confirm popup + list + badge show the *same* order with a Paid/COD payment badge; multi-item order → confirm every item with image, qty, unit and line prices; multiple orders → confirm vertical newest-first sections; accept → `VENDOR_ACCEPTED` across list + detail + dashboard pending 1→0.
- Resolved during verification: fixed an inaccurate live status once realtime state diverged (dev-server edit), confirmed acceptance auto-advance navigation.

> Note: `.env` (ALLOWED_ORIGINS incl. `http://localhost:8082`) requires a server restart; the running instance already includes it.