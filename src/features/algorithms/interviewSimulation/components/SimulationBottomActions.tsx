import { StyleSheet, View } from "react-native";

import { Button } from "../../../../components";
import { colors, spacing } from "../../../../theme";

type SimulationBottomActionsProps = {
  nextLabel?: string;
  onNext: () => void;
  onPrevious: () => void;
  previousLabel?: string;
  nextDisabled?: boolean;
  previousDisabled?: boolean;
};

export function SimulationBottomActions({
  nextDisabled = false,
  nextLabel = "Next",
  onNext,
  onPrevious,
  previousDisabled = false,
  previousLabel = "Previous",
}: SimulationBottomActionsProps) {
  return (
    <View accessibilityRole="toolbar" style={styles.container}>
      <Button disabled={previousDisabled} onPress={onPrevious} style={styles.action} variant="secondary">
        {previousLabel}
      </Button>
      <Button disabled={nextDisabled} onPress={onNext} style={styles.action}>
        {nextLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.background,
    borderTopColor: colors.dark.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  action: { flex: 1 },
});
