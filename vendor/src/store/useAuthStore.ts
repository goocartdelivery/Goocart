import { create } from "zustand";
import { ApiError, apiGet, apiPost, markAuthReady, setAuthToken } from "@/services/apiClient";
import { registerForPushNotifications, unregisterPushToken } from "@/services/PushService";
import { disconnectSocket } from "@/services/socket";
import { clearLegacyUser, clearToken, migrateLegacyToken, readLegacyUser, readToken, writeLegacyUser, writeToken } from "@/services/SessionStorage";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useVendorStore } from "@/store/useVendorStore";
import { VendorUser } from "@/types";

// Mirrors canVendor() server-side: only these roles may open this app. A
// customer/partner/admin session that somehow lands here must never see the
// dashboard — it is rejected during login and on every session restore.
const VENDOR_ROLES = ["VENDOR_OWNER", "VENDOR_MANAGER", "VENDOR_STAFF"];

// The server is the source of truth for a session. A stored token is only a
// hint: hydrate() re-validates it with GET /auth/me before the dashboard is
// ever reachable, so expired/revoked/unauthorized sessions always fall back
// to the auth flow instead of trusting a client-side "isLoggedIn" boolean.
export type AuthStatus = "AUTH_CHECKING" | "AUTHENTICATED_VENDOR" | "NOT_AUTHENTICATED" | "AUTHENTICATED_NON_VENDOR" | "AUTH_ERROR";

/**
 * Mirrors the backend's publicUser() DTO (server/src/routes/auth.ts).
 */
type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  vendorId: string | null;
  vendorPermissions: string[];
  staffTitle: string | null;
};

export type AuthSession = {
  token: string;
  user: SessionUser;
};

type AuthState = {
  user: VendorUser | null;
  token: string | null;
  hasHydrated: boolean;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  /** Every vendor account (owner or admin-created staff) signs in with the password admin set for them. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Applies a freshly minted server session (login or password reset) after verifying the role. */
  applyAuth: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
};

// This app is for restaurant owners/managers/staff only — a customer or
// delivery partner account that signs in here would otherwise see an empty,
// meaningless dashboard (no restaurant or menu ever matches a role that
// isn't a vendor role server-side).
export class WrongRoleError extends Error {}

function toVendorUser(user: SessionUser): VendorUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    vendorId: user.vendorId,
    permissions: user.vendorPermissions ?? [],
    staffTitle: user.staffTitle,
  };
}

async function persistSession(session: AuthSession, set: (partial: Partial<AuthState>) => void) {
  const vendorUser = toVendorUser(session.user);
  setAuthToken(session.token);
  set({ token: session.token, user: vendorUser, status: "AUTHENTICATED_VENDOR", hasHydrated: true });
  await Promise.all([writeToken(session.token), writeLegacyUser(vendorUser)]);
  void registerForPushNotifications();
}

/**
 * A non-vendor account must never be persisted as authenticated in this app.
 * Revoke the freshly created server session (best effort) and refuse to store
 * anything client-side.
 */
async function rejectNonVendorSession(session: AuthSession) {
  setAuthToken(session.token);
  try {
    await apiPost("/api/v1/auth/logout");
  } catch {
    // Best effort — orphaned sessions expire on their own.
  }
  setAuthToken(null);
  throw new WrongRoleError("This account doesn't have Vendor access. Ask your admin to link it to a restaurant, or sign in with a vendor account.");
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hasHydrated: false,
  status: "AUTH_CHECKING",

  hydrate: async () => {
    try {
      await migrateLegacyToken();
      const [token] = await Promise.all([readToken(), readLegacyUser<VendorUser>()]);
      if (!token) {
        set({ user: null, token: null, status: "NOT_AUTHENTICATED", hasHydrated: true });
        markAuthReady();
        return;
      }

      setAuthToken(token);
      // Unblock queued API calls before the network round-trip below — the
      // dashboard gates mounts on `status`, so nothing sensitive fires early.
      markAuthReady();

      // Validate the stored token against the server before trusting it.
      const data = await apiGet<{ user: SessionUser }>("/api/v1/auth/me");
      if (!VENDOR_ROLES.includes(data.user.role)) {
        // Valid session, but the account is not authorized for this app.
        // Keep the token in memory so logout can revoke it server-side.
        set({ user: null, token, status: "AUTHENTICATED_NON_VENDOR", hasHydrated: true });
        return;
      }
      await persistSession({ token, user: data.user }, set);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.code === "AUTH_REQUIRED")) {
        // Expired, revoked or otherwise invalid — wipe the cached session and
        // route to the auth flow.
        setAuthToken(null);
        await Promise.all([clearToken(), clearLegacyUser()]);
        set({ user: null, token: null, status: "NOT_AUTHENTICATED", hasHydrated: true });
      } else {
        // Network/server/config error: keep the stored token so a retry (or
        // explicit sign-in) still works, and surface a retryable error state.
        set({ user: null, status: "AUTH_ERROR", hasHydrated: true });
      }
    } finally {
      markAuthReady();
    }
  },

  signIn: async (email, password) => {
    const data = await apiPost<AuthSession>("/api/v1/auth/token", { mode: "login", email, password });
    if (!VENDOR_ROLES.includes(data.user.role)) return rejectNonVendorSession(data);
    await persistSession(data, set);
  },

  applyAuth: async (session) => {
    if (!VENDOR_ROLES.includes(session.user.role)) return rejectNonVendorSession(session);
    await persistSession(session, set);
  },

  logout: async () => {
    const token = get().token;
    if (token) {
      try {
        await apiPost("/api/v1/auth/logout");
      } catch {
        // The server session may already be gone; local cleanup below is what
        // guarantees the app can no longer reach authenticated screens.
      }
    }
    await unregisterPushToken();
    disconnectSocket();
    setAuthToken(null);
    await Promise.all([clearToken(), clearLegacyUser()]);
    useOrdersStore.getState().clear();
    useVendorStore.getState().clear();
    set({ user: null, token: null, status: "NOT_AUTHENTICATED" });
  },
}));