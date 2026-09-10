import "dotenv/config";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../src/lib/db.js";
import { hashPassword } from "../src/lib/auth.js";
import { Restaurant, User } from "../src/models.js";

// ---------------------------------------------------------------------------
// SAFE DEVELOPMENT PROVISIONING for a dedicated Vendor-app TEST account.
//
// Creates ONLY the synthetic test store + its owner login. Never wipes,
// never touches other records, and aborts instead of altering an account that
// already exists. Mirrors the app's own seed mechanism (models + hashPassword).
//
// Run from an Atlas-allowed host (or after whitelisting this machine):
//   $env:TEST_VENDOR_PASSWORD="<the generated password>" ; npx tsx scripts/provision-test-vendor.ts
// ---------------------------------------------------------------------------

const TEST_EMAIL = "vendor.test@goocart.test";
const TEST_PASSWORD = process.env.TEST_VENDOR_PASSWORD ?? "";

async function main(): Promise<void> {
  if (TEST_PASSWORD.length < 8) {
    throw new Error("Set TEST_VENDOR_PASSWORD to a value of at least 8 characters.");
  }

  await connectDb();
  console.log("connected, db:", mongoose.connection.name);

  const existing = await User.findOne({ email: TEST_EMAIL }).lean();
  if (existing) {
    console.log(`ABORT: ${TEST_EMAIL} already exists (id ${String(existing._id)}). Nothing was changed.`);
    await disconnectDb();
    return;
  }

  const restaurant = await Restaurant.findOneAndUpdate(
    { slug: "goocart-test-vendor" },
    {
      $set: {
        name: "Goocart Test Vendor",
        slug: "goocart-test-vendor",
        status: "ACTIVE",
        isOpen: true,
        area: "Test Area",
        deliveryTimeMin: 20,
        deliveryTimeMax: 35,
        cuisines: ["Misc"],
      },
    },
    { upsert: true, new: true },
  );

  const user = await User.create({
    email: TEST_EMAIL,
    name: "Goocart Test Vendor Owner",
    role: "VENDOR_OWNER",
    status: "ACTIVE",
    passwordHash: await hashPassword(TEST_PASSWORD),
    vendorId: restaurant!._id,
    staffTitle: "Owner",
    vendorPermissions: [],
  });

  console.log(JSON.stringify({
    ok: true,
    vendor: { id: String(restaurant!._id), slug: restaurant!.slug, name: restaurant!.name, status: restaurant!.status },
    user: { id: String(user._id), email: user.email, name: user.name, role: user.role, status: user.status, vendorId: String(user.vendorId) },
    note: "password hash stored; plaintext shown only by the operator",
  }, null, 2));

  await disconnectDb();
}

main().catch(async (error) => {
  console.error("PROVISION FAILED:", error instanceof Error ? error.message : error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});