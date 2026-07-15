import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../../../theme";
import type { SimulationNavigatorItem, SimulationQuestionState } from "../model";

type SimulationNavigatorGridProps = {
  currentIndex: number;
  items: readonly SimulationNavigatorItem[];
  onSelect: (index: number) => void;
};

const stateLabels: Record<SimulationQuestionState, string> = {
  current: "Current",
  answered: "Answered",
  unanswered: "Unanswered",
  flagged: "Flagged",
  error: "Save failed",
  unavailable: "Unavailable",
};

export function SimulationNavigatorGrid({ currentIndex, items, onSelect }: SimulationNavigatorGridProps) {
  return (
    <View accessibilityLabel="Session navigator. Select a question to move to it." style={styles.grid}>
      {items.map((item) => {
        const isCurrent = item.index === currentIndex;
        // An unavailable or persistence-error occurrence must not be visually
        // downgraded to merely "current" when it is the selected question.
        const state = isCurrent && item.state !== "unavailable" && item.state !== "error"
          ? "current"
          : item.state;

        return (
          <Pressable
            accessibilityLabel={`Question ${item.index + 1}. ${stateLabels[state]}.`}
            accessibilityRole="button"
            accessibilityState={{ selected: isCurrent }}
            key={item.index}
            onPress={() => onSelect(item.index)}
            style={({ pressed }) => [styles.item, styles[state], pressed ? styles.pressed : null]}
          >
            <Text style={[styles.itemLabel, styles[`${state}Label`]]}>{item.index + 1}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  item: { alignItems: "center", borderColor: colors.dark.borderStrong, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, height: 32, justifyContent: "center", width: 32 },
  pressed: { opacity: 0.75 },
  itemLabel: { ...typography.caption, color: colors.dark.textPrimary },
  current: { backgroundColor: colors.dark.primary, borderColor: colors.dark.primary },
  currentLabel: { color: colors.dark.textPrimary },
  answered: { backgroundColor: colors.dark.successSoft, borderColor: colors.dark.success },
  answeredLabel: { color: colors.dark.success },
  unanswered: { backgroundColor: colors.dark.elevatedSurface },
  unansweredLabel: { color: colors.dark.textSecondary },
  flagged: { backgroundColor: colors.dark.accentPurpleSoft, borderColor: colors.dark.accentPurple },
  flaggedLabel: { color: colors.dark.accentPurple },
  error: { backgroundColor: colors.dark.dangerSoft, borderColor: colors.dark.danger },
  errorLabel: { color: colors.dark.danger },
  unavailable: { backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.border },
  unavailableLabel: { color: colors.dark.textMuted },
});
