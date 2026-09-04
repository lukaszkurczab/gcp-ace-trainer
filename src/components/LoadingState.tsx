import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemedStyles } from "../preferences";
import { spacing, typography, type AppColors } from "../theme";
import { SkeletonShape, useSkeletonGlassMotion } from "./SkeletonShape";
import { PatternlyMark } from "./PatternlyMark";

type LoadingStateProps = Readonly<{
  description?: string;
  descriptionTestID?: string;
  showLogo?: boolean;
  testID?: string;
  title: string;
}>;

export function LoadingState({ description, descriptionTestID, showLogo = false, testID, title }: LoadingStateProps) {
  const { colorMode } = useAppPreferences();
  const styles = useThemedStyles(createStyles);
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.content}
      testID={testID}
    >
      {showLogo ? <PatternlyMark decorative size={72} testID="loading-mark" treatment={colorMode === "dark" ? "white" : "mint"} /> : null}
      <SkeletonShape motion={motion} style={styles.statusBand} />
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
        {description ? <Text maxFontSizeMultiplier={2} style={styles.description} testID={descriptionTestID}>{description}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  content: {
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    justifyContent: "center",
    width: "100%",
  },
  statusBand: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 8,
    width: 104,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
    width: "100%",
  },
  description: {
    ...typography.processingDescription,
    color: palette.processing.textSecondary,
    flexShrink: 1,
    textAlign: "center",
  },
  title: {
    ...typography.processingTitle,
    color: palette.processing.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
});
