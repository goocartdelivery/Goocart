import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AddressCard } from "@/components/AddressCard";
import { colors, radius, spacing, typography } from "@/theme";
import { useStoreCartBill, useStoreCartStore } from "@/store/useStoreCartStore";
import { useSelectedAddress } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useLocationStore } from "@/store/useLocationStore";
import { serviceOrderService } from "@/services/ServiceOrderService";
import { PaymentMethod } from "@/types";

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "UPI", label: "UPI" },
  { id: "GPAY", label: "Google Pay" },
  { id: "CARD", label: "Cards" },
  { id: "COD", label: "Cash on Delivery" },
];

export default function StoreCheckoutScreen() {
  const user = useAuthStore((s) => s.user);
  const items = useStoreCartStore((s) => s.items);
  const tip = useStoreCartStore((s) => s.tip);
  const clear = useStoreCartStore((s) => s.clear);
  const bill = useStoreCartBill();
  const selectedAddress = useSelectedAddress();
  const location = useLocationStore((s) => s.selected);

  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [prescriptionProvided, setPrescriptionProvided] = useState(false);

  if (!user) return <Redirect href={{ pathname: "/login", params: { returnTo: "/checkout/store" } }} />;
  if (items.length === 0) return <Redirect href="/(tabs)/cart" />;

  const address = selectedAddress ?? location;

  // Rx medicines (service "Medicine" with prescriptionRequired) are delivered
  // only against a valid prescription. The user must attest they hold one —
  // the server re-checks it and rejects the whole order with
  // PRESCRIPTION_REQUIRED otherwise, so this flag is never trusted alone.
  const hasRxItems = items.some((i) => i.prescriptionRequired);

  const placeOrder = async () => {
    if (!address) {
      setError("Add or select a delivery address before placing the order.");
      router.push("/checkout/address");
      return;
    }
    if (hasRxItems && !prescriptionProvided) {
      setError("Prescription medicines in your cart require a valid prescription. Confirm you have one to continue.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const order = await serviceOrderService.place({
        service: items[0].service,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        tip,
        address,
        paymentMethod: method,
        prescriptionProvided,
      });
      clear();
      Alert.alert("Order Confirmed", `${order.reference} has been placed for ₹${order.total}.`, [
        { text: "View orders", onPress: () => router.replace("/(tabs)/activity") },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place this order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Store Checkout" subtitle="GoCart Store" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Section title="Delivery Address" action={{ label: "Change", onPress: () => router.push("/checkout/address") }}>
          {selectedAddress ? <AddressCard address={selectedAddress} selected onPress={() => router.push("/checkout/address")} /> : <PrimaryButton label="+ Add Delivery Address" variant="outline" onPress={() => router.push("/checkout/address")} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Section>

        <Section title="Order Summary" action={{ label: "Edit cart", onPress: () => router.push("/(tabs)/cart") }}>
          {items.map((i) => (
            <View key={i.lineId} style={styles.summaryRow}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {i.name} × {i.quantity}
              </Text>
              <Text style={typography.bodyStrong}>₹{i.lineTotal}</Text>
            </View>
          ))}
        </Section>

        <Section title="Payment Method">
          {PAYMENT_METHODS.map((m) => (
            <Pressable key={m.id} style={styles.methodRow} onPress={() => setMethod(m.id)}>
              <View style={[styles.radio, method === m.id && styles.radioActive]}>{method === m.id ? <View style={styles.radioDot} /> : null}</View>
              <Text style={typography.body}>{m.label}</Text>
            </Pressable>
          ))}
        </Section>

        {hasRxItems ? (
          <View style={styles.section}>
            <View style={styles.rxHeader}>
              <Text style={styles.rxTitle}>Rx · Prescription medicines</Text>
              <Text style={styles.rxCopy}>
                Your cart contains prescription-only medicines. These are delivered only against a valid prescription.
              </Text>
            </View>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: prescriptionProvided }} onPress={() => setPrescriptionProvided((v) => !v)} style={styles.rxRow}>
              <View style={[styles.rxCheck, prescriptionProvided && styles.rxCheckActive]}>
                {prescriptionProvided ? <Text style={styles.rxCheckTick}>✓</Text> : null}
              </View>
              <Text style={styles.rxRowText}>I have a valid prescription for these medicines.</Text>
            </Pressable>
          </View>
        ) : null}

        <Section title="Bill Details">
          <BillRow label="Item Total" value={bill.itemTotal} />
          <BillRow label="Delivery Fee" value={bill.deliveryFee} />
          <BillRow label="Platform Fee" value={bill.platformFee} />
          <BillRow label="Taxes" value={bill.taxes} />
          {bill.tip > 0 ? <BillRow label="Tip" value={bill.tip} /> : null}
          <View style={styles.divider} />
          <BillRow label="To Pay" value={bill.total} strong />
        </Section>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label={busy ? "Placing Order…" : `Place Order • ₹${bill.total}`} onPress={() => void placeOrder()} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}

function Section({ title, action, children }: { title: string; action?: { label: string; onPress: () => void }; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={typography.h3}>{title}</Text>
        {action ? (
          <Text onPress={action.onPress} style={styles.action}>
            {action.label}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

function BillRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <View style={styles.billRow}>
      <Text style={strong ? typography.bodyStrong : typography.body}>{label}</Text>
      <Text style={strong ? typography.bodyStrong : typography.body}>₹{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 120 },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  action: { ...typography.captionStrong, color: colors.primary },
  error: { ...typography.caption, color: colors.error },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  summaryName: { ...typography.body, flex: 1 },
  methodRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  billRow: { flexDirection: "row", justifyContent: "space-between" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  rxHeader: { gap: 2 },
  rxTitle: { fontSize: 12, fontWeight: "800", color: "#0E9F6E", letterSpacing: 0.2 },
  rxCopy: { ...typography.caption, fontSize: 11, color: "#396053", lineHeight: 15 },
  rxRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.xs },
  rxCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#0E9F6E",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  rxCheckActive: { backgroundColor: "#0E9F6E" },
  rxCheckTick: { color: colors.white, fontSize: 14, fontWeight: "900" },
  rxRowText: { ...typography.body, fontSize: 13, flex: 1 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
