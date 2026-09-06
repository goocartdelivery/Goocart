import { AuditLog, Order } from "../models.js";
import { emitOrderUpdate, emitToAdmin, emitToPartner } from "./realtime.js";
import { notifyUser } from "./push.js";
import { clearOrderTimers } from "./delivery.js";

const CHECK_INTERVAL_MS = 15_000;

/**
 * Spec section 14: a customer must not be left waiting indefinitely for a
 * delivery partner who never accepts. Once the platform starts searching for a
 * partner (order reaches READY_FOR_PICKUP / the offer is broadcast), each order
 * carries an `autoCancelDeadlineAt` 5 minutes later. This sweeps for orders
 * past that deadline that still have no assigned partner and cancels them
 * atomically.
 *
 * Correctness notes:
 *  - The atomic guard (`status: READY_FOR_PICKUP`, `partnerId: null`) means the
 *    write only ever matches an order that is genuinely still unclaimed — a
 *    partner whose claim landed between read and write simply wins, and this
 *    sweep is a no-op for that order (no CANCELLED -> ASSIGNED regression).
 *  - It is idempotent: a cancelled order no longer matches the status filter,
 *    so a crash/retry never double-processes or double-refunds it.
 *  - Prepaid orders get an explicit, marked refund-pending record (there is no
 *    wallet/payment settlement in this codebase) so ops/admin can process the
 *    money side manually. COD orders never have money to return.
 */
export function startDeliveryAutoCancel(): NodeJS.Timeout {
  return setInterval(() => void sweep().catch((e) => console.error("Delivery auto-cancel sweep failed:", e)), CHECK_INTERVAL_MS);
}

async function sweep(): Promise<void> {
  const overdue = await Order.find({
    status: "READY_FOR_PICKUP",
    partnerId: null,
    autoCancelDeadlineAt: { $lte: new Date() },
  }).limit(50);

  for (const order of overdue) {
    await autoCancelOrder(order);
  }
}

async function autoCancelOrder(order: any): Promise<void> {
  const now = new Date();

  // Atomic guard — only a genuinely unclaimed order still waiting on a partner
  // can be matched. If a partner claimed it a moment ago, this update fails and
  // the delivery proceeds normally.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: "READY_FOR_PICKUP", partnerId: null },
    {
      $set: {
        status: "AUTO_CANCELLED",
        autoCancellationAt: now,
        cancellationReason: "NO_DELIVERY_PARTNER_ACCEPTED",
        deliveryOfferStatus: "EXPIRED",
        ...(order.paymentStatus === "PAID"
          ? { refund: { amount: order.bill?.total ?? 0, status: "PENDING", at: now } }
          : {}),
      },
      $push: {
        statusHistory: { status: "AUTO_CANCELLED", actorId: null, actorRole: "system", at: now },
        events: {
          event: "AUTO_CANCELLED",
          eventType: "ORDER_AUTO_CANCELLED",
          oldStatus: "READY_FOR_PICKUP",
          newStatus: "AUTO_CANCELLED",
          actorType: "system",
          actorId: null,
          at: now,
          metadata: { reason: "NO_DELIVERY_PARTNER_ACCEPTED" },
        },
      },
    },
    { new: true },
  );

  // Lost the race to a partner claim (or already processed). Nothing to do.
  if (!updated) return;

  clearOrderTimers(updated._id);

  // Close any live offer so no partner can still try to claim a cancelled job.
  for (const partnerId of updated.deliveryOfferedPartnerIds ?? []) {
    emitToPartner(partnerId, "delivery:offer_closed", { orderId: String(updated._id), reason: "CANCELLED" });
  }

  await AuditLog.create({
    actorId: null,
    actorRole: "system",
    action: "order.cancel",
    entityType: "order",
    entityId: String(updated._id),
    before: { status: "READY_FOR_PICKUP" },
    after: { status: "AUTO_CANCELLED", reason: "NO_DELIVERY_PARTNER_ACCEPTED" },
  });

  emitOrderUpdate(updated, "order:update", { orderId: String(updated._id), status: updated.status, eventType: "ORDER_AUTO_CANCELLED" });
  emitToAdmin("order:auto_cancelled", { orderId: String(updated._id), orderNumber: updated.orderNumber, restaurantName: updated.restaurantName });

  if (updated.paymentStatus === "PAID" && updated.refund?.status === "PENDING") {
    void notifyUser(
      updated.customerId,
      "Delivery partner unavailable",
      `We couldn't find a delivery partner for order ${updated.orderNumber}, so it was cancelled. A refund is being processed.`,
      { type: "ORDER_AUTO_CANCELLED_REFUND", orderId: String(updated._id) },
      "ORDER",
    );
  } else {
    void notifyUser(
      updated.customerId,
      "Delivery partner unavailable",
      `We couldn't find a delivery partner for order ${updated.orderNumber}, so it was cancelled.`,
      { type: "ORDER_AUTO_CANCELLED", orderId: String(updated._id) },
      "ORDER",
    );
  }
}
