import { StyleSheet, View } from "react-native";

import { Button } from "../../components";
import { radius, spacing } from "../../theme";
import type { SimulationNavigatorPosition } from "./simulationProjection";
import { hasCanonicalSimulationNavigator, navigatorAccessibilityLabel } from "./simulationViewModel";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";


type SimulationNavigatorProps = Readonly<{
  onOccurrencePress?: (occurrenceId: string) => void;
  positions: readonly SimulationNavigatorPosition[];
}>;

export function SimulationNavigator({ onOccurrencePress, positions }: SimulationNavigatorProps) {
  const styles = useThemedStyles(createStyles);
  if (!hasCanonicalSimulationNavigator(positions)) return null;

  return (
    <View style={styles.grid}>
      {positions.map((position, index) => {
        const disabled = position.state === "frozen" || !onOccurrencePress;
        return (
          <Button
            accessibilityLabel={navigatorAccessibilityLabel(position, index)}
            accessibilityRole="button"
            accessibilityState={{ selected: position.state === "current" }}
            disabled={disabled}
            key={position.occurrenceId}
            onPress={() => onOccurrencePress?.(position.occurrenceId)}
            style={{ ...styles.position, ...styles[position.state] }}
            testID={runtimeSelectors.simulation.navigator(position.occurrenceId)}
            variant="secondary"
          >
            {String(index + 1)}
          </Button>
        );
      })}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  answered: { backgroundColor: palette.elevatedSurface, borderColor: palette.success },
  current: { backgroundColor: palette.primarySoft, borderColor: palette.primary, borderWidth: 2 },
  frozen: { backgroundColor: palette.surface, borderColor: palette.border, opacity: 0.62 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  position: { alignItems: "center", borderColor: palette.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: "center", minHeight: 48, minWidth: 48 },
  unanswered: { backgroundColor: palette.surface, borderColor: palette.border },
});
