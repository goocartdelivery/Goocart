import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { MonogramTile, Hairline, OrdersSectionTitle } from "@/orders/OrderFragments";
import { useClock } from "@/orders/useClock";
import { foodBucket, isFoodCancelled, orderStatusLabel, serviceBucket } from "@/orders/orderStatus";
import { FoodOrder } from "@/types";

// A historical future-active order grouped under the hero.
export type HistoryGroup = "ongoing" | "completed" | "cancelled";

export type BaseEntry = { id: string; kind: "food" | "store"; status: string; createdAt: string; total: number; brand: string; summary: string[] };

type Props = {
  entries: BaseEntry[];
  onOpen: (entry: BaseEntry) => void;
  onReorder: (entry: BaseEntry) => void;
  accent: (kind: "food" | "store") => string;
};

// Compact, scan-friendly list of past orders. No per-row cards — just one
// monogram anchor, the key facts (status + relative date), a one-line item
// summary, and the total. Rows are separated by hairline dividers so the list
// stays quiet and fast to scan.
export function OrderHistoryList({ entries, onOpen, onReorder, accent }: Props) {
  const now = useClock(60000);
  if (entries.length === 0) return null;

  const rDate = (iso: string) => {
    const d = new Date(iso);
    const diffDays = Math.floor((now - d.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const labeled = (status: string, kind: "food" | "store") => {
    const bucket = kind === "food" ? foodBucket(status as FoodOrder["status"]) : serviceBucket(status);
    if (bucket === "cancelled") return orderStatusLabel(status);
    if (bucket === "completed") return "Delivered";
    return orderStatusLabel(status);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {entries.map((entry, i) => {
        const color = accent(entry.kind);
        const reorderable = entry.kind === "food" && (entry.status === "DELIVERED" || isFoodCancelled(entry.status as FoodOrder["status"]));
        return (
          <View key={`${entry.kind}-${entry.createdAt}-${i}`}>
            {i > 0 ? <Hairline style={{ marginVertical: spacing.sm }} /> : null}
            <Pressable accessibilityRole="button" onPress={() => onOpen(entry)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <MonogramTile label={entry.brand} size={48} color={color} radiusValue={radius.sm} />
              <View style={{ flex: 1, gap: 1 }}>
                <View style={styles.brandRow}>
                  <Text style={styles.brand} numberOfLines={1}>
                    {entry.brand}
                  </Text>
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {labeled(entry.status, entry.kind)} · {rDate(entry.createdAt)}
                </Text>
                <Text style={styles.summary} numberOfLines={1}>
                  {entry.summary.join(", ")}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.total}>₹{entry.total}</Text>
                {reorderable ? (
                  <Pressable accessibilityRole="button" onPress={() => onReorder(entry)} hitSlop={8} style={styles.reorderWrap}>
                    <Text style={styles.reorder}>Reorder</Text>
                    <Icon name="forward" size={13} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export function HistoryListTitle({ children }: { children: React.ReactNode }) {
  return <OrdersSectionTitle>{children}</OrdersSectionTitle>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  pressed: { opacity: 0.85 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { ...typography.bodyStrong },
  meta: { ...typography.caption, color: colors.muted },
  summary: { ...typography.caption, color: colors.muted },
  right: { alignItems: "flex-end", gap: 3 },
  total: { ...typography.bodyStrong },
  reorderWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
  reorder: { ...typography.captionStrong, color: colors.primary, fontSize: 11 },
});
