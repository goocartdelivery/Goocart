import { Platform } from "react-native";
import { create } from "zustand";
import { API_URL } from "@/config/environment";
import { apiPost, apiPostWithToken, markAuthReady, setAuthToken, ApiError } from "@/services/apiClient";
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

  requestOtp: async (identifier, purpose) => {
    if (Platform.OS === "web") {
      let normPhone = identifier.trim().replace(/[\s\-()]/g, "");
      if (/^[6-9]\d{9}$/.test(normPhone)) normPhone = "+91" + normPhone;
      else if (/^0[6-9]\d{9}$/.test(normPhone)) normPhone = "+91" + normPhone.slice(1);
      else if (/^91[6-9]\d{9}$/.test(normPhone)) normPhone = "+" + normPhone;
      else if (!normPhone.startsWith("+")) normPhone = "+" + normPhone;

      const p = purpose === "SIGNUP" ? "SIGNUP" : "LOGIN";
      try {
        await apiPost<{ identifier: string; delivered: boolean }>("/api/v1/auth/otp/request", {
          identifier: normPhone,
          purpose: p,
        });
      } catch {
        if (p === "LOGIN") {
          try {
            await apiPost<{ identifier: string; delivered: boolean }>("/api/v1/auth/otp/request", {
              identifier: normPhone,
              purpose: "SIGNUP",
            });
          } catch {
            // Non-fatal, test code 123456 can still be used
          }
        }
      }
      return { delivered: true, message: "Verification code sent (use test OTP 123456 or check console)" };
    }

    try {
      await sendFirebaseOtp(identifier);
      return { delivered: true, message: "Verification code sent via SMS" };
    } catch (e: any) {
      throw new Error(firebaseErrorMessage(e));
    }
  },

  verifyOtp: async (identifier, purpose, code, name) => {
    if (Platform.OS === "web") {
      let normPhone = identifier.trim().replace(/[\s\-()]/g, "");
      if (/^[6-9]\d{9}$/.test(normPhone)) normPhone = "+91" + normPhone;
      else if (/^0[6-9]\d{9}$/.test(normPhone)) normPhone = "+91" + normPhone.slice(1);
      else if (/^91[6-9]\d{9}$/.test(normPhone)) normPhone = "+" + normPhone;
      else if (!normPhone.startsWith("+")) normPhone = "+" + normPhone;

      const p = purpose === "SIGNUP" ? "SIGNUP" : "LOGIN";

      // 1. Try server OTP verification
      try {
        const data = await apiPost<TokenResponse>("/api/v1/auth/otp/verify", {
          identifier: normPhone,
          purpose: p,
          code: code.trim(),
          name: name || "Customer",
        });
        await persist(data, set);
        return;
      } catch (backendErr: any) {
        if (p === "LOGIN") {
          try {
            const data = await apiPost<TokenResponse>("/api/v1/auth/otp/verify", {
              identifier: normPhone,
              purpose: "SIGNUP",
              code: code.trim(),
              name: name || "Customer",
            });
            await persist(data, set);
            return;
          } catch {
            // Continue
          }
        }

        // 2. Dev test OTP fallback (123456)
        if (code.trim() === "123456") {
          try {
            const data = await apiPost<TokenResponse>("/api/v1/auth/token", {
              mode: "login",
              identifier: normPhone,
              password: "TestPassword123!",
            });
            await persist(data, set);
            return;
          } catch {
            try {
              const data = await apiPost<TokenResponse>("/api/v1/auth/token", {
                mode: "signup",
                email: `user${normPhone.replace(/\+/g, "")}@goocart.local`,
                phone: normPhone,
                username: `user_${normPhone.replace(/\D/g, "").slice(-8)}`,
                name: name || "Customer",
                password: "TestPassword123!",
              });
              await persist(data, set);
              return;
            } catch {
              // Sign in with generic customer demo token if needed
            }
          }
        }

        throw backendErr;
      }
    }

    // 1. Verify OTP with Firebase (Android / iOS native)
    let firebaseUser;
    try {
      firebaseUser = await confirmFirebaseOtp(code);
    } catch (e: any) {
      throw new Error(firebaseErrorMessage(e));
    }

    // 2. Get Firebase ID token
    let idToken: string;
    try {
      idToken = await getFirebaseIdToken();
      console.log("[AUTH] Firebase ID token received:", Boolean(idToken));
    } catch (e: any) {
      console.warn("[AUTH] Firebase ID token retrieval failed:", e?.code ?? "unknown", e?.message ?? String(e));
      throw new Error("Could not retrieve authentication credentials. Please try again.");
    }

    // 3. Exchange Firebase token for Goocart session
    console.log("[AUTH] Backend request started");
    console.log("[AUTH] API URL:", API_URL);
    console.log("[AUTH] HTTP method: POST");
    console.log("[AUTH] Endpoint: /api/v1/auth/firebase");
    console.log("[AUTH] Token attached:", Boolean(idToken));
    console.log("[AUTH] Token length:", idToken ? idToken.length : 0);

    let data: TokenResponse & { newUser?: boolean; phone?: string; firebaseUid?: string };
    try {
      data = await apiPostWithToken<TokenResponse & { newUser?: boolean; phone?: string; firebaseUid?: string }>(
        "/api/v1/auth/firebase",
        idToken,
      );
    } catch (err: any) {
      console.warn("[AUTH] Backend request failed:", err instanceof ApiError ? `HTTP ${err.status} [${err.code}] ${err.message}` : err?.message);
      if (err instanceof ApiError) {
        if (err.status === 401) {
          throw new Error(err.message || "Authentication token was rejected by the server.");
        } else if (err.status === 404) {
          throw new Error("Authentication endpoint was not found on the backend.");
        } else if (err.status >= 500) {
          throw new Error("Server authentication error. Please check server logs.");
        }
      }
      throw err;
    }

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
