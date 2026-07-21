import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "../../components";
import { ROUTES } from "../../constants/routes";
import { radius, spacing, typography } from "../../theme";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";


type AppStackHeaderProps = {
  navigation: {
    canGoBack: () => boolean;
    goBack: () => void;
    navigate: (name: string, params?: object) => void;
  };
  onBackPress?: () => void;
  showBack?: boolean;
  subtitle?: string;
};

export function AppStackHeader({
  navigation,
  onBackPress,
  showBack = false,
  subtitle,
}: AppStackHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  function goBack() {
    if (onBackPress) {
      onBackPress();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate(ROUTES.HOME, { initialTab: "home" });
  }

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        {showBack ? (
          <Pressable
            accessibilityLabel={t("Go back")}
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <View style={styles.backIcon}>
              <Icon color={palette.textSecondary} name="chevron-right" size={18} />
            </View>
          </Pressable>
        ) : null}
        <Icon color={palette.primary} name="grid" size={30} />
        <View style={styles.copy}>
          <Text style={styles.title}>Patternly</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  backIcon: {
    transform: [{ rotate: "180deg" }],
  },
  pressed: {
    opacity: 0.78,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: palette.textSecondary,
  },
});
