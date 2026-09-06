export const ok = (data: unknown, message: string | null = null) => ({ success: true as const, data, message });
export const fail = (code: string, message: string) => ({ success: false as const, error: { code, message } });

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^\+?[0-9]{7,15}$/;

export type PhoneNormalizationResult =
  | { valid: true; normalized: string }
  | { valid: false; normalized: string; error: string };

/**
 * Normalizes mobile phone numbers to canonical E.164 format (+91XXXXXXXXXX for India).
 * Handles:
 *   - 10 digits starting with 6-9: e.g. "9876543210" -> "+919876543210"
 *   - 11 digits starting with 0: e.g. "09876543210" -> "+919876543210"
 *   - 12 digits starting with 91: e.g. "919876543210" -> "+919876543210"
 *   - Pre-formatted E.164 with +91: e.g. "+919876543210" -> "+919876543210"
 *   - Generic E.164 international numbers: e.g. "+14155552671" -> "+14155552671"
 */
export function normalizePhoneNumber(input: string): PhoneNormalizationResult {
  if (!input || typeof input !== "string") {
    return { valid: false, normalized: "", error: "Enter a valid mobile number" };
  }

  let cleaned = input.trim().replace(/[\s\-\(\)]/g, "");
  if (!cleaned) {
    return { valid: false, normalized: "", error: "Enter a valid mobile number" };
  }

  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    cleaned = "+91" + cleaned.slice(1);
  } else if (/^91[6-9]\d{9}$/.test(cleaned)) {
    cleaned = "+" + cleaned;
  } else if (/^[6-9]\d{9}$/.test(cleaned)) {
    cleaned = "+91" + cleaned;
  } else if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    // Valid Indian E.164
  } else if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    // Valid generic international E.164
  } else {
    return { valid: false, normalized: cleaned, error: "Enter a valid mobile number (e.g. 9876543210 or +919876543210)" };
  }

  return { valid: true, normalized: cleaned };
}

// Escapes regex metacharacters in user-supplied search text before it goes
// into a Mongo $regex filter, so a crafted query string (e.g. many nested
// quantifiers) can't cause catastrophic backtracking (ReDoS) or match more
// than the literal text the user typed.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

