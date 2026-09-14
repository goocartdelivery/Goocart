import { Order, User } from "../models.js";
import { emitOrderUpdate, emitToAdmin, emitToVendor } from "./realtime.js";
import { notifyUser, notifyUsers } from "./push.js";
import { clearOrderTimers } from "./delivery.js";

const CHECK_INTERVAL_MS = 30_000;

/**
 * Spec section 43 + vendor spec section 13/14: a customer must not be left
 * waiting indefinitely on a vendor who never responds to a manual-acceptance
 * order. Once the acceptance deadline passes while the order is still PLACED,
 * this sweeps it atomically into the terminal EXPIRED state (so the vendor
 * can no longer accept it), notifies everyone involved, and emits a realtime
 * update. The CAS on status guards against racing an accept that lands in the
 * same window, and the events guard makes the sweep idempotent.
 */
export function startAcceptanceWatchdog(): NodeJS.Timeout {
  return setInterval(() => void sweep().catch((e) => console.error("Acceptance watchdog failed:", e)), CHECK_INTERVAL_MS);
}

async function sweep(): Promise<void> {
  const overdue = await Order.find({
    status: "PLACED",
    manualAcceptanceRequired: true,
    manualAcceptanceDeadlineAt: { $lte: new Date() },
    "events.event": { $ne: "ACCEPTANCE_EXPIRED" },
  }).limit(50);

  for (const order of overdue) {
    const now = new Date();
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: "PLACED" },
      {
        $set: { status: "EXPIRED", autoCancellationAt: now, cancellationReason: "ACCEPTANCE_TIMEOUT" },
        $push: {
          statusHistory: { status: "EXPIRED", actorId: null, actorRole: "system", at: now },
          events: { event: "ACCEPTANCE_EXPIRED", eventType: "ORDER_EXPIRED", oldStatus: "PLACED", newStatus: "EXPIRED", actorType: "system", actorId: null, at: now, metadata: { deadline: order.manualAcceptanceDeadlineAt } },
        },
      },
      { new: true },
    );
    // Null means someone accepted (or otherwise moved) the order in the same
    // window — the deadline check in the accept route already rejected a late
    // accept, but with a stale document the CAS is the final word.
    if (!updated) continue;

    clearOrderTimers(updated._id);

    const staff = await User.find({ $or: [{ vendorId: order.restaurantId }] }, { _id: 1 }).lean();
    if (staff.length) {
      void notifyUsers(
        staff.map((s) => s._id),
        "Order expired",
        `Order ${order.orderNumber} was not accepted in time and has expired.`,
        { type: "ACCEPTANCE_TIMEOUT", orderId: String(order._id) },
        "VENDOR",
      );
    }
    void notifyUser(
      order.customerId,
      "Order expired",
      `Order ${order.orderNumber} was not accepted by the restaurant in time and has expired.`,
      { type: "ORDER_EXPIRED", orderId: String(order._id) },
      "ORDER",
    );
    emitToVendor(order.restaurantId, "order:acceptance_overdue", { orderId: String(order._id), orderNumber: order.orderNumber, expired: true });
    emitToAdmin("order:acceptance_overdue", { orderId: String(order._id), orderNumber: order.orderNumber, restaurantName: order.restaurantName, expired: true });
    emitOrderUpdate(updated, "order:update", { orderId: String(updated._id), status: "EXPIRED", eventType: "ORDER_EXPIRED" });
  }
}