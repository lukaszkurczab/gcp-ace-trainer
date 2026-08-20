import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityState,
} from "react-native";

import { radius } from "../theme";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";
import { Icon, type IconName } from "./Icon";

type IconButtonProps = {
  accessibilityLabel: string;
  accessibilityState?: Omit<AccessibilityState, "busy" | "disabled">;
  disabled?: boolean;
  icon: IconName;
  onPress: () => void;
  testID?: string;
};

/**
 * Canonical outlined icon action: a 44 px touch target with a centered 36 px
 * visible treatment, matching Figma's Navigation / Icon Button component.
 */
export function IconButton({
  accessibilityLabel,
  accessibilityState,
  disabled = false,
  icon,
  onPress,
  testID,
}: IconButtonProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
      testID={testID}
    >
      {({ pressed }) => (
        <View
          accessibilityElementsHidden
          pointerEvents="none"
          style={[styles.visual, pressed && !disabled ? styles.pressed : null]}
        >
          <Icon color={disabled ? palette.textMuted : palette.iconButton.icon} name={icon} size={20} />
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  button: {
    alignItems: "center",
    flexShrink: 0,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  visual: {
    alignItems: "center",
    borderColor: palette.iconButton.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  pressed: {
    backgroundColor: palette.iconButton.pressedSurface,
  },
});
