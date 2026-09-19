import { create } from "zustand";
import { apiPost, apiPostWithToken, markAuthReady, setAuthToken } from "@/services/apiClient";
import { useAddressStore } from "@/store/useAddressStore";
import { useCartStore } from "@/store/useCartStore";
import { useStoreCartStore } from "@/store/useStoreCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useRatingStore } from "@/store/useRatingStore";
import { useOrderStore } from "@/store/useOrderStore";
import { setActiveUserId } from "@/services/userKey";
import { registerForPushNotifications, unregisterPushToken } from "@/services/PushService";
import { disconnectSocket } from "@/services/socket";
import { clearLegacyUser, clearToken, migrateLegacyToken, readLegacyUser, readToken, writeLegacyUser, writeToken } from "@/services/SessionStorage";
import { sendFirebaseOtp, confirmFirebaseOtp, getFirebaseIdToken, firebaseSignOut, firebaseErrorMessage } from "@/services/firebaseAuth";
import { CustomerUser } from "@/types";

type AuthState = {
  user: CustomerUser | null;
  token: string | null;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  signUp: (input: { email: string; phone: string; username: string; password: string; name: string }) => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<void>;
  requestOtp: (identifier: string, purpose: "LOGIN" | "SIGNUP") => Promise<{ delivered: boolean; message: string }>;
  verifyOtp: (identifier: string, purpose: "LOGIN" | "SIGNUP", code: string, name?: string) => Promise<void>;
  registerFirebaseUser: (name: string) => Promise<void>;
  logout: () => Promise<void>;
};

type TokenResponse = { token: string; user: { id: string; email: string; username?: string | null; name: string; role: string; status: string; phone?: string | null } };

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hasHydrated: false,

  hydrate: async () => {
    try {
      await migrateLegacyToken();
      const [token, user] = await Promise.all([readToken(), readLegacyUser<CustomerUser>()]);
      if (!token || !user) {
        set({ user: null, token: null, hasHydrated: true });
        return;
      }
      setAuthToken(token);
      setActiveUserId(user.id);
      set({ user, token, hasHydrated: true });
      void useAddressStore.getState().refresh();
      void hydrateUserData();
      void registerForPushNotifications();
    } catch {
      set({ user: null, token: null, hasHydrated: true });
    } finally {
      // Unblocks queued API calls whether or not a session was found.
      markAuthReady();
    }
  },

  signUp: async (input) => {
    const data = await apiPost<TokenResponse>("/api/v1/auth/token", { mode: "signup", ...input });
    await persist(data, set);
  },

  signIn: async (identifier, password) => {
    const data = await apiPost<TokenResponse>("/api/v1/auth/token", { mode: "login", identifier, password });
    await persist(data, set);
  },

  requestOtp: async (identifier, _purpose) => {
    try {
      await sendFirebaseOtp(identifier);
      return { delivered: true, message: "Verification code sent via SMS" };
    } catch (e: any) {
      throw new Error(firebaseErrorMessage(e));
    }
  },

  verifyOtp: async (_identifier, _purpose, code, _name) => {
    // 1. Verify OTP with Firebase
    let firebaseUser;
    try {
      firebaseUser = await confirmFirebaseOtp(code);
    } catch (e: any) {
      throw new Error(firebaseErrorMessage(e));
    }

    // 2. Get Firebase ID token
    const idToken = await getFirebaseIdToken();

    // 3. Exchange Firebase token for Goocart session
    const data = await apiPostWithToken<TokenResponse & { newUser?: boolean; phone?: string; firebaseUid?: string }>(
      "/api/v1/auth/firebase",
      idToken,
    );

    // 4. Handle new user — throw a special error the UI catches to
    //    navigate to the profile-completion screen
    if (data.newUser) {
      const err = new Error("NEW_USER") as any;
      err.phone = data.phone;
      err.firebaseUid = data.firebaseUid;
      throw err;
    }

    // 5. Existing user — persist session
    await persist(data as TokenResponse, set);
  },


  registerFirebaseUser: async (name) => {
    const idToken = await getFirebaseIdToken();
    const data = await apiPostWithToken<TokenResponse>("/api/v1/auth/firebase/register", idToken, { name });
    await persist(data, set);
  },

  logout: async () => {
    try {
      await apiPost("/api/v1/auth/logout");
    } catch {
      // Non-fatal: local sign out proceeds even if network or server fails
    }
    await firebaseSignOut();
    await unregisterPushToken();
    disconnectSocket();
    setAuthToken(null);
    await Promise.all([clearToken(), clearLegacyUser()]);
    // Clear every piece of user-scoped local state BEFORE switching the active
    // user so no trace of User A survives into User B's session (or an
    // unauthenticated one). Addresses are server-backed and cleared separately.
    useCartStore.getState().clear();
    useStoreCartStore.getState().clear();
    useFavoritesStore.getState().clear();
    useRatingStore.getState().clear();
    useOrderStore.getState().clear();
    setActiveUserId(null);
    set({ user: null, token: null });
    useAddressStore.getState().reset();
  },
}));

async function persist(data: TokenResponse, set: (partial: Partial<AuthState>) => void) {
  const user: CustomerUser = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    username: data.user.username ?? null,
    role: data.user.role,
    phone: data.user.phone ?? "",
    isDemo: false,
  };
  setAuthToken(data.token);
  setActiveUserId(data.user.id);
  await writeToken(data.token);
  await writeLegacyUser(user);
  set({ user, token: data.token });
  // A brand-new signup has no addresses yet, but re-fetching is still
  // correct (and cheap) — it clears any stale guest-session cache.
  void useAddressStore.getState().refresh();
  void hydrateUserData();
  void registerForPushNotifications();
}

// Reloads the per-user local data (food cart, store cart, favorites, ratings)
// for whichever user is now active. Called after login/signup and after a cold
// start, so the UI never shows another account's cached data.
async function hydrateUserData(): Promise<void> {
  await Promise.all([
    useCartStore.getState().hydrate(),
    useStoreCartStore.getState().hydrate(),
    useFavoritesStore.getState().hydrate(),
    useRatingStore.getState().hydrate(),
  ]);
}
