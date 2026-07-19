import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../theme";
import type { SimulationNavigatorPosition } from "./simulationProjection";
import { hasCanonicalSimulationNavigator, navigatorAccessibilityLabel } from "./simulationViewModel";

type SimulationNavigatorProps = Readonly<{
  onOccurrencePress?: (occurrenceId: string) => void;
  positions: readonly SimulationNavigatorPosition[];
}>;

export function SimulationNavigator({ onOccurrencePress, positions }: SimulationNavigatorProps) {
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

const styles = StyleSheet.create({
  answered: { backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.success },
  current: { backgroundColor: colors.dark.primarySoft, borderColor: colors.dark.primary, borderWidth: 2 },
  currentLabel: { color: colors.dark.textPrimary },
  frozen: { backgroundColor: colors.dark.surface, borderColor: colors.dark.border, opacity: 0.62 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  position: { alignItems: "center", borderColor: colors.dark.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: "center", minHeight: 48, minWidth: 48 },
  positionLabel: { ...typography.caption, color: colors.dark.textSecondary },
  unanswered: { backgroundColor: colors.dark.surface, borderColor: colors.dark.border },
});
