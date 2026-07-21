import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../theme";
import type { SimulationNavigatorPosition } from "./simulationProjection";
import { hasCanonicalSimulationNavigator, navigatorAccessibilityLabel } from "./simulationViewModel";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";


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
          <Pressable
            accessibilityLabel={navigatorAccessibilityLabel(position, index)}
            accessibilityRole="button"
            accessibilityState={{ disabled, selected: position.state === "current" }}
            disabled={disabled}
            key={position.occurrenceId}
            onPress={() => onOccurrencePress?.(position.occurrenceId)}
            style={[styles.position, styles[position.state]]}
            testID={`simulation-navigator-position-${index + 1}`}
          >
            <Text style={[styles.positionLabel, position.state === "current" ? styles.currentLabel : null]}>{index + 1}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  answered: { backgroundColor: palette.elevatedSurface, borderColor: palette.success },
  current: { backgroundColor: palette.primarySoft, borderColor: palette.primary, borderWidth: 2 },
  currentLabel: { color: palette.textPrimary },
  frozen: { backgroundColor: palette.surface, borderColor: palette.border, opacity: 0.62 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  position: { alignItems: "center", borderColor: palette.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: "center", minHeight: 48, minWidth: 48 },
  positionLabel: { ...typography.caption, color: palette.textSecondary },
  unanswered: { backgroundColor: palette.surface, borderColor: palette.border },
});
