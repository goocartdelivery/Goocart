import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/PrimaryButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onCreateAccount: () => void;
};

// Polished authentication gate shown when a guest tries to place an order.
// The cart/checkout are left untouched; the user only needs to authenticate
// before the actual order is submitted.
export function AuthPromptSheet({ visible, onClose, onSignIn, onCreateAccount }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Icon name="account" size={30} color={colors.primary} />
            </View>
            <Text style={typography.h2}>Sign in to place your order</Text>
            <Text style={styles.copy}>Please sign in or create an account to continue with your order. Your cart will stay right where it is.</Text>

            <View style={styles.actions}>
              <PrimaryButton label="Sign In" onPress={onSignIn} />
              <PrimaryButton label="Create Account" variant="secondary" onPress={onCreateAccount} />
              <Pressable style={styles.browse} onPress={onClose} accessibilityRole="button">
                <Text style={styles.browseText}>Continue Browsing</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000055" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginTop: spacing.sm },
  content: { padding: spacing.xl, gap: spacing.lg, alignItems: "center" },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
  copy: { ...typography.body, color: colors.muted, textAlign: "center" },
  actions: { alignSelf: "stretch", gap: spacing.sm },
  browse: { alignItems: "center", paddingVertical: spacing.sm },
  browseText: { ...typography.button, color: colors.primary },
});
