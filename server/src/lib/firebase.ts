import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

/**
 * Initialise Firebase Admin SDK once.  Credential resolution (in order):
 *   1. GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON key file)
 *   2. FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string of the key)
 *   3. Application Default Credentials (GCP-managed environments)
 *
 * If none is set, initialisation is deferred to the first call, so the
 * server can still boot for routes that don't need Firebase.  The first
 * verifyIdToken() call will throw a clear message.
 */

let initialised = false;

function parseServiceAccount(rawJson: string): ServiceAccount {
  let cleaned = rawJson.trim();
  // Strip outer quotes if the environment manager (e.g. Render/Docker) preserved them
  if (
    (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
    (cleaned.startsWith('"') && cleaned.endsWith('"'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  try {
    const sa = JSON.parse(cleaned) as ServiceAccount;
    // Cloud environments (Render, Heroku, Vercel) often store private_key with escaped newlines "\\n"
    if (sa.privateKey && typeof sa.privateKey === "string") {
      sa.privateKey = sa.privateKey.replace(/\\n/g, "\n");
    }
    return sa;
  } catch (e) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_KEY is set but contains invalid JSON: ${
        e instanceof Error ? e.message : e
      }`,
    );
  }
}

function ensureApp(): void {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    initialised = true;
    return;
  }

  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  console.log("[FIREBASE-DEBUG] env present:", Boolean(keyJson), "| length:", keyJson?.length ?? 0, "| starts with:", keyJson?.slice(0, 40));
  if (keyJson) {
    const serviceAccount = parseServiceAccount(keyJson);
    console.log("[FIREBASE-DEBUG] parsed project_id:", serviceAccount.projectId, "| has private_key:", Boolean(serviceAccount.privateKey));
    initializeApp({ credential: cert(serviceAccount) });
    initialised = true;
    console.log("[FIREBASE-DEBUG] Firebase Admin initialized OK");
    return;
  }

  // Fallback to GOOGLE_APPLICATION_CREDENTIALS file path if provided
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp();
    initialised = true;
    return;
  }

  // In development/local without GCP ADC, provide a clear, actionable error
  throw new Error(
    "Firebase Admin credentials are not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY in your environment variables.",
  );
}

export type VerifiedFirebaseUser = {
  uid: string;
  phone: string;
};

/**
 * Cryptographically verifies a Firebase ID token and extracts the
 * authenticated user's UID and phone number.
 *
 * Throws on invalid/expired/malformed tokens.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<VerifiedFirebaseUser> {
  // In automated test environments only, support synthetic tokens to test
  // error cases (expired, invalid) and user flows without external network deps.
  if (process.env.NODE_ENV === "test" && idToken.startsWith("test-token:")) {
    const parts = idToken.split(":");
    if (parts[1] === "expired") {
      const err: any = new Error("Firebase ID token has expired");
      err.code = "auth/id-token-expired";
      throw err;
    }
    if (parts[1] === "invalid") {
      throw new Error("Invalid Firebase token");
    }
    if (parts.length >= 3) {
      return { uid: parts[1], phone: parts[2] };
    }
  }

  ensureApp();
  const decoded: DecodedIdToken = await getAuth().verifyIdToken(idToken, true);

  const phone = decoded.phone_number;
  if (!phone) {
    throw new Error("Firebase token does not contain a phone number");
  }

  return { uid: decoded.uid, phone };
}
