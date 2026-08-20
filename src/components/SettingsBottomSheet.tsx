import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type SettingsBottomSheetProps = {
  children: ReactNode;
  closeLabel: string;
  intro: string;
  onClose: () => void;
  title: string;
  visible: boolean;
};

export function SettingsBottomSheet({ children, closeLabel, intro, onClose, title, visible }: SettingsBottomSheetProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={closeLabel} accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={styles.sheet}>
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.intro}>{intro}</Text>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0, 0, 0, 0.48)" },
  sheet: {
    backgroundColor: palette.bottomSheet.surface,
    borderColor: palette.bottomSheet.border,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: "86%",
    shadowColor: "#000000",
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 12,
    elevation: 8
  },
  content: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  handle: { alignSelf: "center", backgroundColor: palette.bottomSheet.handle, borderRadius: radius.pill, height: 4, marginBottom: spacing.xs, width: 44 },
  title: { ...typography.heading, color: palette.textPrimary },
  intro: { ...typography.small, color: palette.textSecondary },
});
