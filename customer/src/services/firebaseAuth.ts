import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  signInWithPhoneNumber,
  signInWithCredential,
  signOut,
  PhoneAuthProvider,
  type ConfirmationResult,
  type User,
} from "@react-native-firebase/auth";

const STORAGE_VERIFICATION_KEY = "goocart.firebase.phone.verification_state.v1";

// In-memory references for fast-path confirmation without disk I/O
let pendingConfirmation: ConfirmationResult | null = null;
let pendingVerificationId: string | null = null;
let isConfirming = false;

/**
 * Sends a Firebase Phone Auth OTP to the given phone number.
 * Returns true if the SMS was dispatched. The confirmation object is
 * held internally and verificationId is persisted to storage for process survival.
 *
 * @param phoneNumber E.164 format, e.g. "+919876543210"
 */
export async function sendFirebaseOtp(phoneNumber: string): Promise<boolean> {
  // Normalise bare Indian numbers: "9876543210" → "+919876543210"
  let normalised = phoneNumber.trim().replace(/[\s\-()]/g, "");
  if (/^[6-9]\d{9}$/.test(normalised)) normalised = "+91" + normalised;
  else if (/^0[6-9]\d{9}$/.test(normalised)) normalised = "+91" + normalised.slice(1);
  else if (/^91[6-9]\d{9}$/.test(normalised)) normalised = "+" + normalised;
  else if (!normalised.startsWith("+")) normalised = "+" + normalised;

  const authInstance = getAuth();
  const confirmation = await signInWithPhoneNumber(authInstance, normalised);
  pendingConfirmation = confirmation;
  pendingVerificationId = confirmation.verificationId ?? null;

  if (pendingVerificationId) {
    try {
      await AsyncStorage.setItem(
        STORAGE_VERIFICATION_KEY,
        JSON.stringify({
          verificationId: pendingVerificationId,
          phone: normalised,
          createdAt: Date.now(),
        }),
      );
    } catch {
      // Non-fatal: in-memory pendingConfirmation still works
    }
  }

  return true;
}

/**
 * Confirms the 6-digit OTP code against the pending Firebase phone-auth session.
 * Uses the in-memory ConfirmationResult if available; falls back to
 * PhoneAuthProvider.credential(verificationId, code) if the process restarted
 * or pendingConfirmation was lost.
 *
 * Prevents concurrent duplicate verification attempts and cleans up on success.
 */
export async function confirmFirebaseOtp(code: string): Promise<User> {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    throw new Error("Please enter the verification code.");
  }

  if (isConfirming) {
    throw new Error("Verification is already in progress. Please wait a moment.");
  }

  isConfirming = true;
  try {
    const authInstance = getAuth();
    let credentialUser: User | null = null;

    if (pendingConfirmation) {
      const cred = await pendingConfirmation.confirm(trimmedCode);
      credentialUser = cred?.user ?? authInstance.currentUser;
    } else {
      // Fallback: recover verificationId if app process was killed or bundle reloaded
      let verificationId = pendingVerificationId;
      if (!verificationId) {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_VERIFICATION_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { verificationId: string; createdAt: number };
            // Firebase phone auth sessions expire in ~15 minutes
            if (Date.now() - parsed.createdAt < 15 * 60 * 1000 && parsed.verificationId) {
              verificationId = parsed.verificationId;
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      if (!verificationId) {
        throw new Error("No pending OTP verification found. Please request a new code.");
      }

      const phoneCredential = PhoneAuthProvider.credential(verificationId, trimmedCode);
      const userCredential = await signInWithCredential(authInstance, phoneCredential);
      credentialUser = userCredential?.user ?? authInstance.currentUser;
    }

    if (!credentialUser) {
      throw new Error("Firebase authentication succeeded but no user was returned.");
    }

    // Success: clear pending states
    pendingConfirmation = null;
    pendingVerificationId = null;
    void AsyncStorage.removeItem(STORAGE_VERIFICATION_KEY).catch(() => {});

    return credentialUser;
  } catch (e: any) {
    // If expired or invalid session, clear saved verification state so user can start fresh
    if (
      e?.code === "auth/session-expired" ||
      e?.code === "auth/code-expired" ||
      e?.code === "auth/invalid-verification-id"
    ) {
      pendingConfirmation = null;
      pendingVerificationId = null;
      void AsyncStorage.removeItem(STORAGE_VERIFICATION_KEY).catch(() => {});
    }
    throw e;
  } finally {
    isConfirming = false;
  }
}

/**
 * Returns the current Firebase user's ID token for backend verification.
 * Forces a fresh token so the backend never receives an expired one.
 */
export async function getFirebaseIdToken(): Promise<string> {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  if (!user) throw new Error("No Firebase user is signed in");
  return user.getIdToken(true);
}

/**
 * Clears any pending OTP state when navigating back or changing numbers.
 */
export async function clearPendingOtp(): Promise<void> {
  pendingConfirmation = null;
  pendingVerificationId = null;
  isConfirming = false;
  try {
    await AsyncStorage.removeItem(STORAGE_VERIFICATION_KEY);
  } catch {
    // Non-fatal
  }
}

/**
 * Signs out the current Firebase user and resets any pending verification state.
 */
export async function firebaseSignOut(): Promise<void> {
  const authInstance = getAuth();
  try {
    await signOut(authInstance);
  } catch (e) {
    if (__DEV__) console.warn("[firebaseAuth] signOut warning:", e);
  }
  await clearPendingOtp();
}

/**
 * Translates Firebase Auth error codes into user-friendly messages.
 */
export function firebaseErrorMessage(error: any): string {
  const code: string = error?.code ?? "";
  switch (code) {
    case "auth/invalid-phone-number":
    case "auth/missing-phone-number":
      return "That phone number isn't valid. Please check and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/quota-exceeded":
      return "SMS quota exceeded. Please try again later or use test credentials.";
    case "auth/invalid-verification-code":
      return "Incorrect code. Please check and try again.";
    case "auth/session-expired":
    case "auth/code-expired":
      return "The verification code has expired. Please request a new one.";
    case "auth/missing-verification-code":
      return "Please enter the 6-digit verification code.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support for help.";
    case "auth/operation-not-allowed":
      return "Phone authentication is not enabled in Firebase Console. Please contact support.";
    case "auth/app-not-authorized":
    case "auth/missing-client-identifier":
      return "This app is not authorised for Firebase Phone Auth. Verify Android SHA-1 / Play Integrity in Firebase Console.";
    default:
      return error?.message ?? "Something went wrong with authentication. Please try again.";
  }
}
