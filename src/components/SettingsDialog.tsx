import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "./Button";
import { radius, spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type SettingsDialogProps = {
  closeLabel: string;
  message: string;
  onClose: () => void;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  title: string;
  visible: boolean;
};

export function SettingsDialog({
  closeLabel,
  message,
  onClose,
  onPrimaryAction,
  primaryActionLabel,
  secondaryActionLabel,
  title,
  visible,
}: SettingsDialogProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={closeLabel} accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button onPress={onPrimaryAction}>{primaryActionLabel}</Button>
            <Button onPress={onClose} variant="secondary">{secondaryActionLabel}</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  root: { alignItems: "center", flex: 1, justifyContent: "center", padding: spacing.lg },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: palette.effects.scrim },
  dialog: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, maxWidth: 440, padding: spacing.lg, width: "100%" },
  title: { ...typography.heading, color: palette.textPrimary },
  message: { ...typography.small, color: palette.textSecondary },
  actions: { gap: spacing.sm },
});
