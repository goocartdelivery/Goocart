# VENDOR INITIAL AUTH FLOW REPORT

## 1. App Entry Flow

The Vendor app (`vendor/`, Expo/React Native) now enters through a server-validated auth state machine:

```
APP START (vendor/app/index.tsx splash)
   → hydrate(): read stored token → GET /api/v1/auth/me (server validation)
   → status routing:
        AUTHENTICATED_VENDOR      → Dashboard  (/(tabs)/home)
        NOT_AUTHENTICATED         → Welcome (/welcome)
        AUTHENTICATED_NON_VENDOR  → Access Denied (/access-denied)
        AUTH_ERROR                → Splash retry panel (or explicit sign-in)

Welcome ("Get Started") → Login (/login)
   → POST /api/v1/auth/token {mode:"login", email, password}
   → role verified (VENDOR_OWNER|VENDOR_MANAGER|VENDOR_STAFF)
   → Dashboard
```

Fresh Vendor: Welcome → Get Started → Login → auth → Dashboard.
Returning Vendor: session check → valid vendor session → Dashboard (no login/welcome flash; splash waits for the server check).
Missing/expired/revoked session: Welcome → Login.

## 2. Authentication State Machine

`vendor/src/store/useAuthStore.ts` exposes `status: AuthStatus`:

| State | Meaning | UI |
|---|---|---|
| `AUTH_CHECKING` | Session being validated against the server | Splash "Checking your session…" |
| `AUTHENTICATED_VENDOR` | Valid session + vendor role | Dashboard (`/(tabs)/home`) |
| `NOT_AUTHENTICATED` | No valid session | Welcome → Login |
| `AUTHENTICATED_NON_VENDOR` | Valid session, non-vendor role | Access Denied screen |
| `AUTH_ERROR` | Backend unreachable / config error during check | Splash retry panel (keeps stored session; explicit sign-in offered) |

Route guards in `vendor/src/components/AuthGates.tsx`:
- `RequireVendor` — gates `(tabs)/home|orders|menu|account` and the standalone `/menu/new`, `/menu/[id]`. `AUTH_CHECKING` → loading; `AUTH_ERROR` → `/`; `AUTHENTICATED_NON_VENDOR` → `/access-denied`; `NOT_AUTHENTICATED` → `/welcome`.
- `PublicGate` — gates `/welcome`, `/login`, `/forgot-password`: already-authorized vendor → Dashboard; non-vendor session → Access Denied; session still being checked → loading (no login flash).

## 3. Files Changed

New:
- `vendor/app/welcome.tsx` — premium Welcome screen.
- `vendor/app/access-denied.tsx` — AUTHENTICATED_NON_VENDOR screen.
- `vendor/app/forgot-password.tsx` — password reset using existing OTP reset endpoints.
- `vendor/src/components/AuthGates.tsx` — `RequireVendor` + `PublicGate`.
- `vendor/eslint.config.js` — Expo flat ESLint config (lint infra).
- `vendor/assets/images/vendorWelcome.webp` — vendor welcome artwork.

Changed:
- `vendor/src/store/useAuthStore.ts` — 5-state machine; `/me`-validated `hydrate()`; server `logout()`; role-gated `signIn`/`applyAuth` with session revocation on rejection.
- `vendor/app/index.tsx` — splash routes by `status`; AUTH_ERROR retry panel.
- `vendor/app/login.tsx` — "Welcome back" UI, Email/Phone + Password fields, inline validation, Forgot password link, busy "Signing in…" state, no duplicate submits.
- `vendor/app/(tabs)/_layout.tsx` — wrapped in `RequireVendor`.
- `vendor/app/menu/new.tsx`, `vendor/app/menu/[id].tsx` — wrapped in `RequireVendor`.
- `vendor/app/(tabs)/account.tsx` — logout routes to `/welcome`.
- `vendor/src/services/apiClient.ts` — network error copy: "Unable to connect to Goocart. Please check your internet connection and try again."
- `vendor/src/components/Icon.tsx` — added `lock` icon.
- `vendor/app/(tabs)/orders.tsx`, `vendor/src/components/DishImageField.tsx` — lint-only cleanups (apostrophe escaping / unused import).
- `vendor/package.json` / `package-lock.json` — dev deps `eslint`, `eslint-config-expo`.

## 4. Existing Authentication Used

No new endpoints and no duplicate authentication system were introduced. The store uses the existing backend session architecture (`server/src/routes/auth.ts`, `server/src/lib/auth.ts`):
- **Login**: `POST /api/v1/auth/token` `{ mode: "login", email, password }` — resolves email/phone/username, verifies bcrypt/PBKDF2 password, returns `{ user, token }`.
- **Session validation**: `GET /api/v1/auth/me` (requires a valid unexpired, unrevoked session via the existing `Session` collection and `requireAuth`).
- **Session revocation**: `POST /api/v1/auth/logout` (revokes the bearer token server-side).
- **Password reset**: `POST /api/v1/auth/password/reset-request` + `/password/reset-confirm` (existing OTP-based reset, its own `PASSWORD_RESET` purpose).
- Tokens are held in memory and mirrored to `expo-secure-store` (non-web fallback uses AsyncStorage) via the existing `SessionStorage` service; nothing plaintext, nothing hard-coded.

## 5. Vendor Authorization

The account must be authorized for the Vendor app, not merely logged in:
- Server defines vendor roles as `VENDOR_OWNER | VENDOR_MANAGER | VENDOR_STAFF` (`canVendor()` in `server/src/lib/auth.ts`).
- The client mirrors that exact set in `useAuthStore.VENDOR_ROLES`. On login AND on session restore (`/me`), if the returned `role` is not vendor, nothing is persisted and no dashboard is reachable.
- Non-vendor outcomes: login shows "This account doesn't have Vendor access…"; a restored non-vendor session routes to `/access-denied` ("You don't have permission to access the Vendor app.") with a Sign out. No customer→vendor promotion, no client-trusted role, and backend authorization on every vendor API remains the enforcement layer.

## 6. Session Restoration

`hydrate()` (kicked once from `app/_layout.tsx`): migrate legacy token → read token → set request auth → **`GET /api/v1/auth/me`** → vendor role? → mark `AUTHENTICATED_VENDOR` + persist fresh user → Dashboard. Expired/revoked/invalid → cached session wiped → `NOT_AUTHENTICATED` (Welcome). Backend unreachable → `AUTH_ERROR` (retry panel; stored session kept so retry works). The splash renders while `AUTH_CHECKING`, so there is no login flash and no reliance on a client-side `isLoggedIn` boolean.

## 7. Logout

`logout()` calls `POST /api/v1/auth/logout` with the current token (best effort), then clears the in-memory token, SecureStore, legacy blob, orders/vendor stores, and push registration; status → `NOT_AUTHENTICATED`; Account screen navigates with `router.replace("/welcome")`. Because the session is revoked server-side and all screens are guarded by `RequireVendor`, pressing Back after logout cannot reach authenticated screens.

## 8. UI Screens

Confirmed three-screen entry: **Welcome** → **Login** → **Dashboard**.
- **Welcome**: GOOCART logo + VENDOR pill, "Manage your restaurant" headline, "Receive orders, manage your menu and grow your business." subtitle, `vendorWelcome.webp` in a rounded card, prominent "Get Started" near the bottom; double-tap guarded.
- **Login**: "Welcome back" / "Sign in to manage your restaurant"; Email/Phone + Password (visibility toggle); inline validation ("Enter your email or phone.", "Enter a valid email address or phone number.", "Enter your password."); Forgot password; "Signing in…" while busy (submits disabled).
- **Access Denied**: message + Sign out / Try another account.
- **Forgot Password**: sends reset code, then code + new password, per the existing reset endpoints.

## 9. Tests

| # | Scenario | Result |
|---|---|---|
| 1 | Fresh app → Welcome | PASS (routing + build; splash routes `NOT_AUTHENTICATED` → `/welcome`) |
| 2 | Get Started → Login | PASS (`router.replace("/login")`, PublicGate) |
| 3 | Valid vendor credentials → Dashboard | PASS (live: `vendor@goocart.com` login → `role: VENDOR_OWNER`; signIn → `AUTHENTICATED_VENDOR` → `/(tabs)/home`) |
| 4 | Close/reopen with valid session → Dashboard, no login | PASS (hydrate validates `/me` → `AUTHENTICATED_VENDOR`; live `/me` returns the vendor) |
| 5 | Expired session → auth flow | PASS (live: revoked token → `/me` returns `401 AUTH_REQUIRED`; store wipes cache → `NOT_AUTHENTICATED`) |
| 6 | Invalid credentials → error | PASS (live: wrong password → `401 INVALID_CREDENTIALS`, generic message) |
| 7 | Customer credentials → Vendor access denied | PASS (live: customer account returns `role: CUSTOMER`; store rejects non-vendor role on login and restore → Access Denied / login error) |
| 8 | Logout → session invalidated → Welcome | PASS (live: logout revokes token server-side; `/me` after logout → 401; store → `NOT_AUTHENTICATED`, route `/welcome`) |
| 9 | Back after logout cannot access dashboard | PASS (server session revoked + `router.replace` + `RequireVendor` guards) |
| 10 | Backend unavailable → clear connection error | PASS (AUTH_ERROR splash retry panel uses "Unable to connect to Goocart…"; login shows the same message for network errors) |

## 10. Build

- `npx tsc --noEmit` (vendor): **PASS** — 0 errors.
- `npm run lint` (`expo lint`, eslint-config-expo flat config): **PASS** — 0 errors, 0 warnings.
- `npx expo export --platform web` (vendor build verification): **PASS** — bundles successfully; 17 static routes generated incl. `/welcome`, `/login`, `/access-denied`, `/forgot-password`, `/(tabs)/home`, `/menu/new`, `/menu/[id]` (build proxy — vendor has no standalone `build` script).
- Server auth endpoints exercised live via curl against the running backend (login/me/logout/401/customer-role) — all as expected.
- Security notes: no plaintext passwords, no hard-coded credentials/tokens, no client-trusted roles, no session-expiry changes, no bypass of backend authorization, no customer→vendor escalation; existing backend used verbatim (no auth architecture changes were required).