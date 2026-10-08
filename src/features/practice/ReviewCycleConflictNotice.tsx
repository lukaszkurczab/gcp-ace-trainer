import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { REVIEW_CYCLE_CONFLICT_MESSAGE } from "./practiceSessionPresentation";

/** Result-level explanation for a durable answer whose review-cycle CAS lost a race. */
export function ReviewCycleConflictNotice() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const message = t(REVIEW_CYCLE_CONFLICT_MESSAGE);
  return (
    <View accessible accessibilityLabel={message} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.notice}>
      <Text maxFontSizeMultiplier={2} style={styles.message}>{message}</Text>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  message: { ...typography.body, color: palette.danger },
  notice: { backgroundColor: palette.dangerSoft, borderColor: palette.danger, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
});
