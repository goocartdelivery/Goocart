import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "goocart.vendor.session.token.v1";
const LEGACY_KEY = "goocart.vendor.auth.v1";

// SecureStore is unavailable on web and throws; fall back to AsyncStorage
// (localStorage on web) so the app works in a browser too.
const useSecureStore = Platform.OS !== "web";

async function readTokenStorage(key: string): Promise<string | null> {
  return useSecureStore ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key);
}

async function writeTokenStorage(key: string, value: string): Promise<void> {
  if (useSecureStore) await SecureStore.setItemAsync(key, value);
  else await AsyncStorage.setItem(key, value);
}

async function clearTokenStorage(key: string): Promise<void> {
  if (useSecureStore) await SecureStore.deleteItemAsync(key);
  else await AsyncStorage.removeItem(key);
}

export async function readToken(): Promise<string | null> {
  try {
    return await readTokenStorage(TOKEN_KEY);
  } catch (e) {
    console.log("[session] token read failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function writeToken(token: string): Promise<void> {
  await writeTokenStorage(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    await clearTokenStorage(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * One-time move of the auth token out of the plaintext AsyncStorage blob
 * (STORAGE_KEY used to hold {token, user} together) into SecureStore. Safe
 * to call on every app start: once the legacy blob's token field is gone,
 * this is a no-op.
 */
export async function migrateLegacyToken(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { token?: string; user?: unknown };
    if (!parsed.token) return;

    const existing = await readTokenStorage(TOKEN_KEY);
    if (!existing) {
      await writeTokenStorage(TOKEN_KEY, parsed.token);
      const verify = await readTokenStorage(TOKEN_KEY);
      if (verify !== parsed.token) throw new Error("SecureStore verification failed after write");
    }

    const { token: _drop, ...rest } = parsed;
    await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(rest));
  } catch (e) {
    console.log("[session] Legacy token migration failed (non-fatal):", e instanceof Error ? e.message : e);
  }
}

export async function readLegacyUser<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: T };
    return parsed.user ?? null;
  } catch {
    return null;
  }
}

export async function writeLegacyUser<T>(user: T): Promise<void> {
  await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify({ user }));
}

export async function clearLegacyUser(): Promise<void> {
  await AsyncStorage.removeItem(LEGACY_KEY);
}