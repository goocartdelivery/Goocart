import twilio from "twilio";
import dns from "node:dns";

// ── IPv6 preference ──────────────────────────────────────────────────────────
// Some networks (corporate Wi-Fi, campus NAT) block IPv4 routes to Twilio's
// CloudFront edge (18.164.x.x) while NAT64/IPv6 works fine.  Node.js defaults
// to IPv4-first (`dns.lookup` returns the first A record).  Calling
// `dns.setDefaultResultOrder("verbatim")` makes it honour the OS resolver
// order, which on dual-stack networks returns the reachable address first.
dns.setDefaultResultOrder("verbatim");

export type SmsDeliveryResult = {
  delivered: boolean;
  reason?: string;
  sid?: string;
  code?: number;
};

// Never log unmasked phone numbers or credentials in production logs
const isProduction = () => process.env.NODE_ENV === "production";

function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length <= 6) return "***";
  return phone.slice(0, 4) + "****" + phone.slice(-3);
}

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): {
  client: twilio.Twilio | null;
  fromNumber: string | null;
  messagingServiceSid: string | null;
  contentSid: string | null;
  error: string | null;
} {
  // Support both Account SID + Auth Token and API Key SID + API Key Secret
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim() || null;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || null;
  const contentSid = process.env.TWILIO_CONTENT_SID?.trim() || null;

  // Determine authentication mode
  const useApiKey = apiKeySid && apiKeySecret && accountSid;
  const useAuthToken = accountSid && authToken;

  if (!useApiKey && !useAuthToken) {
    return {
      client: null,
      fromNumber: null,
      messagingServiceSid: null,
      contentSid: null,
      error: "Twilio credentials are not configured. Set either (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN) or (TWILIO_ACCOUNT_SID + TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET).",
    };
  }

  if (!fromNumber && !messagingServiceSid) {
    return {
      client: null,
      fromNumber: null,
      messagingServiceSid: null,
      contentSid: null,
      error: "Neither TWILIO_PHONE_NUMBER nor TWILIO_MESSAGING_SERVICE_SID is configured.",
    };
  }

  if (!twilioClient) {
    try {
      if (useApiKey) {
        // Restricted API Key authentication: twilio(SK..., secret, { accountSid: AC... })
        twilioClient = twilio(apiKeySid, apiKeySecret, { accountSid });
        if (!isProduction()) {
          console.log(`[sms] Twilio client initialized with API Key (${apiKeySid.slice(0, 6)}...)`);
        }
      } else {
        // Primary Auth Token authentication: twilio(AC..., authToken)
        twilioClient = twilio(accountSid!, authToken!);
        if (!isProduction()) {
          console.log(`[sms] Twilio client initialized with Account SID (${accountSid!.slice(0, 6)}...)`);
        }
      }
    } catch (err) {
      console.error("[sms] Failed to initialize Twilio client:", err instanceof Error ? err.message : err);
      return {
        client: null,
        fromNumber: null,
        messagingServiceSid: null,
        contentSid: null,
        error: "Failed to initialize Twilio client.",
      };
    }
  }

  return { client: twilioClient, fromNumber, messagingServiceSid, contentSid, error: null };
}

/**
 * Sends an SMS message via Twilio to the specified destination phone number.
 * Supports standard plain-text SMS, Twilio Messaging Services, and Twilio Content Templates.
 *
 * Safe error handling ensures failure never crashes the server or leaks secrets.
 */
export async function sendSms(to: string, message: string, otpCode?: string): Promise<SmsDeliveryResult> {
  const { client, fromNumber, messagingServiceSid, contentSid, error } = getTwilioClient();

  if (!client) {
    if (!isProduction()) {
      console.log(`[sms] Twilio unconfigured — cannot deliver to ${maskPhoneNumber(to)}`);
    }
    return { delivered: false, reason: error ?? "SMS service is unconfigured" };
  }

  // Construct request payload according to Twilio API mode
  const payload: any = { to };

  // Sender resolution: Messaging Service SID takes precedence if set, otherwise Phone Number
  if (messagingServiceSid) {
    payload.messagingServiceSid = messagingServiceSid;
  } else if (fromNumber) {
    payload.from = fromNumber;
  }

  // Template / Content SID resolution vs Standard Plaintext body
  if (contentSid) {
    payload.contentSid = contentSid;
    if (otpCode) {
      payload.contentVariables = JSON.stringify({ "1": otpCode });
    }
    // Note: Do NOT set payload.body when contentSid is present (Twilio API restriction)
  } else {
    payload.body = message;
  }

  try {
    const res = await client.messages.create(payload);

    if (!isProduction()) {
      console.log(`[sms] Twilio SMS dispatched to ${maskPhoneNumber(to)} (SID: ${res.sid})`);
    }

    return { delivered: true, sid: res.sid };
  } catch (err: any) {
    const errCode: number | undefined = err?.code ? Number(err.code) : undefined;
    const rawMessage: string = err?.message || (err instanceof Error ? err.message : "Unknown Twilio error");

    // Diagnostic console logs for common Twilio error codes and network errors
    diagnoseTwilioError(to, errCode, rawMessage, err);

    return {
      delivered: false,
      code: errCode,
      reason: `SMS delivery failed: ${rawMessage}`,
    };
  }
}

function diagnoseTwilioError(to: string, code: number | undefined, message: string, err?: any): void {
  const maskedTo = maskPhoneNumber(to);
  const codeTag = code ? `(code ${code})` : "";

  // Network-level errors (ETIMEDOUT, ECONNREFUSED, ENOTFOUND, etc.)
  const syscall: string | undefined = err?.syscall;
  const errno: string | undefined = err?.errno ?? err?.code;
  if (syscall || errno === "ETIMEDOUT" || errno === "ECONNREFUSED" || errno === "ENOTFOUND" || errno === "ECONNRESET") {
    console.error(
      `[sms] NETWORK ERROR reaching Twilio API for ${maskedTo}: ${errno ?? "unknown"} (${syscall ?? "connect"}). ` +
      `Check: (1) firewall/VPN blocking api.twilio.com:443, (2) DNS resolution, (3) IPv4 vs IPv6 routing. ` +
      `Current DNS result order: ${dns.getDefaultResultOrder()}.`
    );
    return;
  }

  switch (code) {
    case 572006:
      console.error(
        `[sms] Twilio Trial/Template Restriction ${codeTag} for ${maskedTo}: ` +
        `Trial account requires an approved SMS template for this destination. ` +
        `Fix: In Twilio Console, create an approved Content Template and set TWILIO_CONTENT_SID in server/.env, ` +
        `OR verify the destination number in Twilio Verified Caller IDs.`
      );
      break;
    case 21608:
      console.error(
        `[sms] Twilio Unverified Recipient ${codeTag} for ${maskedTo}: ` +
        `Trial accounts can only send SMS to verified caller IDs. ` +
        `Fix: Add the number to Verified Caller IDs in Twilio Console ` +
        `(https://console.twilio.com/us1/develop/phone-numbers/manage/verified).`
      );
      break;
    case 21211:
      console.error(`[sms] Invalid Destination Number ${codeTag} for ${maskedTo}: Phone number is malformed or not valid E.164.`);
      break;
    case 20003:
      console.error(`[sms] Twilio Authentication Error ${codeTag}: Account SID, Auth Token, or API Key is incorrect. Check server/.env.`);
      break;
    case 21606:
      console.error(
        `[sms] Invalid Sender ${codeTag}: The 'from' phone number is not a valid Twilio number. ` +
        `TWILIO_PHONE_NUMBER must be a Twilio-purchased number, NOT your personal mobile number.`
      );
      break;
    case 21612:
      console.error(
        `[sms] Sender Not SMS-Capable ${codeTag}: The Twilio number does not have SMS capability enabled. ` +
        `Check the number's capabilities in Twilio Console > Phone Numbers > Active Numbers.`
      );
      break;
    default:
      console.error(`[sms] Twilio SMS dispatch failed for ${maskedTo} ${codeTag}: ${message}`);
      break;
  }
}
