import { View, StyleSheet } from "react-native";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { radius, spacing } from "@/theme";

// Skeleton that mirrors the new Orders composition: a dominant active-order
// module (monogram anchor, status, progress) and quiet history rows with a
// section heading — so the placeholder matches the real layout, not a stack of
// generic cards.
export function OrderListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.wrap}>
      {/* Hero block */}
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <SkeletonBlock width={46} height={46} style={{ borderRadius: radius.md }} />
          <View style={{ flex: 1, gap: 7 }}>
            <SkeletonBlock width="55%" height={15} />
            <SkeletonBlock width="38%" height={10} />
          </View>
        </View>
        <SkeletonBlock width="52%" height={20} style={{ marginTop: spacing.lg }} />
        <SkeletonBlock width="70%" height={13} style={{ marginTop: 8 }} />
        <SkeletonBlock width="100%" height={4} style={{ marginTop: spacing.md, borderRadius: 2 }} />
        <SkeletonBlock width="45%" height={13} style={{ marginTop: spacing.lg }} />
        <SkeletonBlock width="30%" height={13} style={{ marginTop: 8 }} />
      </View>

      {/* History */}
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          {i === 0 ? <SkeletonBlock width={90} height={11} style={styles.heading} /> : null}
          <View style={styles.row}>
            <SkeletonBlock width={48} height={48} style={{ borderRadius: radius.sm }} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock width="45%" height={13} />
              <SkeletonBlock width="60%" height={10} />
            </View>
            <SkeletonBlock width={40} height={13} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxl },
  hero: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E4E1",
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  heroHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heading: { marginBottom: spacing.md, borderRadius: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
});
