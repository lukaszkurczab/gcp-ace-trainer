import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Icon } from "./Icon";
import { useThemedStyles } from "../preferences";
import { spacing, type AppColors } from "../theme";

type ReviewUnavailableSurfaceProps = {
  description: string;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function ReviewUnavailableSurface({ description, style, title }: ReviewUnavailableSurfaceProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.surface, style]}>
      <View style={styles.icon}>
        <Icon color={styles.iconGlyph.color} name="warning" size={24} />
      </View>
      <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.description}>{description}</Text>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  surface: {
    alignItems: "center",
    backgroundColor: palette.effects.unavailableSurface,
    borderColor: palette.effects.subtleBorder,
    borderRadius: 18,
    gap: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: 28,
  },
  description: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 289,
    textAlign: "center",
  },
  icon: {
    alignItems: "center",
    backgroundColor: palette.effects.unavailableIconSurface,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconGlyph: {
    color: palette.warning,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
  },
});
