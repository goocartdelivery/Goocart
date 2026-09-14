// Vendor-facing presentation of the TRUSTED backend payment fields
// (order.paymentStatus / order.paymentMethod / order.refund). Nothing is
// inferred from the customer frontend — this only renders what Mongo holds.

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  UPI: "UPI",
  GPAY: "Google Pay",
  PHONEPE: "PhonePe",
  PAYTM: "Paytm",
  CARD: "Cards",
  NETBANKING: "Net Banking",
  WALLET: "Wallet",
  COD: "Cash on Delivery",
};

export type PaymentTone = "paid" | "pending" | "failed" | "neutral";

export type PaymentDisplay = {
  label: string;
  tone: PaymentTone;
};

export function paymentDisplay(order: { paymentMethod?: string; paymentStatus?: string; refund?: { status?: string } | null } | undefined): PaymentDisplay {
  if (!order) return { label: "—", tone: "neutral" };
  const refundActive = order.refund && order.refund.status !== "NONE";
  if (refundActive) return { label: "Refunded", tone: "failed" };
  if (order.paymentMethod === "COD" || order.paymentStatus === "NOT_APPLICABLE") return { label: "COD", tone: "neutral" };
  switch (order.paymentStatus) {
    case "PAID":
      return { label: "Paid", tone: "paid" };
    case "PENDING":
      return { label: "Pending", tone: "pending" };
    case "FAILED":
      return { label: "Failed", tone: "failed" };
    default:
      return { label: order.paymentStatus ?? "Unknown", tone: "neutral" };
  }
}

export const PAYMENT_BADGE_COLORS: Record<PaymentTone, { background: string; text: string }> = {
  paid: { background: "#DCFCE7", text: "#15803D" },
  pending: { background: "#FEF3C7", text: "#B45309" },
  failed: { background: "#FEE2E2", text: "#B91C1C" },
  neutral: { background: "#F4F4F5", text: "#52525B" },
};