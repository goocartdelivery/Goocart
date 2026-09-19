import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, apiPost, apiGet } from "./harness.mjs";

process.env.NODE_ENV = "test";

let mongoose;

before(async () => {
  const started = await startTestServer();
  mongoose = started.mongoose;
});

after(async () => {
  await stopTestServer();
});

test("POST /api/v1/auth/firebase rejects request with missing token", async () => {
  const { status, body } = await apiPost("/api/v1/auth/firebase", {});
  assert.equal(status, 401);
  assert.equal(body.error?.code, "MISSING_TOKEN");
});

test("POST /api/v1/auth/firebase rejects expired Firebase token", async () => {
  const { status, body } = await apiPost("/api/v1/auth/firebase", {}, "test-token:expired");
  assert.equal(status, 401);
  assert.equal(body.error?.code, "INVALID_TOKEN");
  assert.match(body.error?.message, /expired/i);
});

test("POST /api/v1/auth/firebase rejects invalid Firebase token", async () => {
  const { status, body } = await apiPost("/api/v1/auth/firebase", {}, "test-token:invalid");
  assert.equal(status, 401);
  assert.equal(body.error?.code, "INVALID_TOKEN");
});

test("POST /api/v1/auth/firebase returns newUser: true for unregistered phone", async () => {
  const token = "test-token:fb_uid_new_1:+919876500001";
  const { status, body } = await apiPost("/api/v1/auth/firebase", {}, token);

  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data?.newUser, true);
  assert.equal(body.data?.phone, "+919876500001");
  assert.equal(body.data?.firebaseUid, "fb_uid_new_1");
});

test("POST /api/v1/auth/firebase/register validates name and creates new user", async () => {
  const token = "test-token:fb_uid_reg_1:+919876500002";

  // 1. Missing / too short name
  const invalidNameRes = await apiPost("/api/v1/auth/firebase/register", { name: "A" }, token);
  assert.equal(invalidNameRes.status, 400);
  assert.equal(invalidNameRes.body.error?.code, "INVALID_NAME");

  // 2. Valid registration
  const regRes = await apiPost("/api/v1/auth/firebase/register", { name: "Test Customer" }, token);
  assert.equal(regRes.status, 200);
  assert.equal(regRes.body.success, true);
  assert.ok(regRes.body.data?.token);
  assert.equal(regRes.body.data?.user?.name, "Test Customer");
  assert.equal(regRes.body.data?.user?.role, "CUSTOMER");
  assert.equal(regRes.body.data?.user?.phone, "+919876500002");

  // 3. User session can access protected route /me
  const meRes = await apiGet("/api/v1/auth/me", regRes.body.data.token);
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.data?.user?.id, regRes.body.data.user.id);

  // 4. Duplicate registration attempt fails
  const dupRes = await apiPost("/api/v1/auth/firebase/register", { name: "Duplicate" }, token);
  assert.equal(dupRes.status, 409);
  assert.equal(dupRes.body.error?.code, "ACCOUNT_EXISTS");
});

test("POST /api/v1/auth/firebase maps existing user by phone and sets firebaseUid", async () => {
  const { User } = await import("../dist/models.js");

  // Pre-create an existing user that has a phone number but no firebaseUid
  const existingUser = await User.create({
    name: "Existing Pre-Firebase User",
    email: `prefirebase.${Date.now()}@test.goocart.local`,
    phone: "+919876500003",
    role: "CUSTOMER",
    status: "ACTIVE",
    firebaseUid: null,
  });

  const token = "test-token:fb_uid_linked_3:+919876500003";
  const { status, body } = await apiPost("/api/v1/auth/firebase", {}, token);

  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data?.user?.id, String(existingUser._id));
  assert.equal(body.data?.user?.name, "Existing Pre-Firebase User");
  assert.ok(body.data?.token);

  // Verify database record has firebaseUid linked
  const updated = await User.findById(existingUser._id);
  assert.equal(updated.firebaseUid, "fb_uid_linked_3");

  // Subsequent login by firebaseUid (fast path)
  const secondLogin = await apiPost("/api/v1/auth/firebase", {}, token);
  assert.equal(secondLogin.status, 200);
  assert.equal(secondLogin.body.data?.user?.id, String(existingUser._id));
});

test("POST /api/v1/auth/firebase rejects disabled user", async () => {
  const { User } = await import("../dist/models.js");

  await User.create({
    name: "Suspended User",
    email: `disabled.${Date.now()}@test.goocart.local`,
    phone: "+919876500004",
    role: "CUSTOMER",
    status: "DISABLED",
    firebaseUid: "fb_uid_disabled_4",
  });

  const token = "test-token:fb_uid_disabled_4:+919876500004";
  const { status, body } = await apiPost("/api/v1/auth/firebase", {}, token);

  assert.equal(status, 403);
  assert.equal(body.error?.code, "ACCOUNT_DISABLED");
});
