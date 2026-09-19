import test from "node:test";
import assert from "node:assert/strict";
import { verifyFirebaseIdToken } from "../dist/lib/firebase.js";

test("Firebase Admin: verifyFirebaseIdToken handles test tokens correctly", async () => {
  process.env.NODE_ENV = "test";

  // Expired test token
  await assert.rejects(
    async () => {
      await verifyFirebaseIdToken("test-token:expired");
    },
    (err) => {
      assert.equal(err.code, "auth/id-token-expired");
      return true;
    }
  );

  // Invalid test token
  await assert.rejects(
    async () => {
      await verifyFirebaseIdToken("test-token:invalid");
    },
    (err) => {
      assert.match(err.message, /invalid firebase token/i);
      return true;
    }
  );

  // Valid test token
  const verified = await verifyFirebaseIdToken("test-token:test_uid_123:+919876543210");
  assert.equal(verified.uid, "test_uid_123");
  assert.equal(verified.phone, "+919876543210");
});

test("Firebase Admin: unconfigured environment throws actionable error", async () => {
  const oldEnv = process.env.NODE_ENV;
  const oldKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const oldCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

    await assert.rejects(
      async () => {
        // Not a test-token prefix, triggers real verification attempt
        await verifyFirebaseIdToken("eyJhbGciOiJSUzI1NiIsImtpZCI6...");
      },
      (err) => {
        assert.match(err.message, /firebase admin credentials are not configured/i);
        return true;
      }
    );
  } finally {
    process.env.NODE_ENV = oldEnv;
    if (oldKey !== undefined) process.env.FIREBASE_SERVICE_ACCOUNT_KEY = oldKey;
    if (oldCreds !== undefined) process.env.GOOGLE_APPLICATION_CREDENTIALS = oldCreds;
  }
});

test("Firebase Admin: malformed JSON in environment throws descriptive error", async () => {
  const oldEnv = process.env.NODE_ENV;
  const oldKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  try {
    process.env.NODE_ENV = "production";
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = "not-a-json-string";

    await assert.rejects(
      async () => {
        await verifyFirebaseIdToken("some-token");
      },
      (err) => {
        assert.match(err.message, /contains invalid JSON/i);
        return true;
      }
    );
  } finally {
    process.env.NODE_ENV = oldEnv;
    if (oldKey !== undefined) process.env.FIREBASE_SERVICE_ACCOUNT_KEY = oldKey;
    else delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  }
});
