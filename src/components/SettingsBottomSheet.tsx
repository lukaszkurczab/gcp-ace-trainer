import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";
import { Button } from "./Button";

type SettingsBottomSheetProps = {
  children: ReactNode;
  closeLabel: string;
  intro: string;
  onClose: () => void;
  title: string;
  variant?: "default" | "reminder";
  visible: boolean;
};

export function SettingsBottomSheet({ children, closeLabel, intro, onClose, title, variant = "default", visible }: SettingsBottomSheetProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.root}>
        <Pressable accessibilityLabel={closeLabel} accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={[styles.sheet, variant === "reminder" ? styles.reminderSheet : null]}>
          <ScrollView contentContainerStyle={[styles.content, variant === "reminder" ? styles.reminderContent : null, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.handle, variant === "reminder" ? styles.reminderHandle : null]} />
            <View style={styles.header}>
              <Text maxFontSizeMultiplier={2} style={[styles.title, variant === "reminder" ? styles.reminderTitle : null]}>{title}</Text>
              <Button accessibilityLabel={closeLabel} onPress={onClose} style={styles.closeButton} testID="settings-bottom-sheet-close" variant="ghost">{closeLabel}</Button>
            </View>
            <Text maxFontSizeMultiplier={2} style={[styles.intro, variant === "reminder" ? styles.reminderIntro : null]}>{intro}</Text>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: palette.effects.scrim },
  sheet: {
    backgroundColor: palette.bottomSheet.surface,
    borderColor: palette.bottomSheet.border,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: "86%",
    shadowColor: palette.effects.shadow,
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 12,
    elevation: 8
  },
  content: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  closeButton: { flexShrink: 0, minHeight: 44, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  reminderSheet: {
    minHeight: 432,
  },
  reminderContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  reminderHandle: { marginBottom: 0 },
  handle: { alignSelf: "center", backgroundColor: palette.bottomSheet.handle, borderRadius: radius.pill, height: 4, marginBottom: spacing.xs, width: 44 },
  title: { ...typography.heading, color: palette.textPrimary, flex: 1, flexShrink: 1 },
  reminderTitle: { fontSize: 22, letterSpacing: -0.3, lineHeight: 28, fontWeight: "600" },
  intro: { ...typography.small, color: palette.textSecondary },
  reminderIntro: { fontSize: 14, fontWeight: "400", lineHeight: 22 },
});
