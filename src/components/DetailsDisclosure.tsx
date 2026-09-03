import { Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon } from "./Icon";
import { useThemedStyles } from "../preferences";
import { spacing, typography, type AppColors } from "../theme";

type DetailsDisclosureProps = {
  expanded: boolean;
  onPress: () => void;
  testID?: string;
};

export function DetailsDisclosure({ expanded, onPress, testID }: DetailsDisclosureProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const { t } = useTranslation("common");
  return (
    <Pressable
      accessibilityLabel={t(expanded ? "Hide answer details" : "Show answer details")}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={styles.toggle}
      testID={testID}
    >
      <Text key={`details:${fontScale}`} maxFontSizeMultiplier={2} style={styles.label}>{t("Details")}</Text>
      <Icon color={styles.icon.color} name={expanded ? "chevron-up" : "chevron-down"} size={18} />
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  icon: {
    color: palette.textSecondary,
  },
  label: {
    ...typography.bodyStrong,
    color: palette.textSecondary,
  },
  toggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
