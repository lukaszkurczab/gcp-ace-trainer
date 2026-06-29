import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import type { TrackDefinition } from "../../domain";
import { colors, radius, spacing, typography } from "../../theme";
import { Badge } from "../Badge";
import { Icon } from "../Icon";

type TrackCardProps = {
  isActive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  track: TrackDefinition;
};

export function TrackCard({
  isActive = false,
  onPress,
  style,
  testID,
  track,
}: TrackCardProps) {
  const statusLabel = track.status === "active" ? "Ready" : "Draft";

  return (
    <Pressable
      accessibilityLabel={`${track.title} track`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isActive ? styles.activeCard : null,
        pressed ? styles.pressed : null,
        style,
      ]}
      testID={testID ?? `track-card-${track.id}`}
    >
      <View style={[styles.accent, { backgroundColor: track.accentColor }]} />
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: track.accentColor }]}>
            {track.subtitle}
          </Text>
          <Text style={styles.title}>{track.title}</Text>
        </View>
        <Badge label={isActive ? "Active" : statusLabel} tone={track.status === "active" ? "ready" : "warning"} />
      </View>

      <Text style={styles.description}>{track.description}</Text>

      <View style={styles.footer}>
        <Text style={styles.nextAction}>{track.nextActionLabel}</Text>
        <Icon name="chevron-right" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.lg,
  },
  activeCard: {
    borderColor: colors.dark.primary,
  },
  pressed: {
    opacity: 0.84,
  },
  accent: {
    height: 4,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
  },
  title: {
    ...typography.heading,
    color: colors.dark.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  footer: {
    alignItems: "center",
    borderTopColor: colors.dark.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingTop: spacing.md,
  },
  nextAction: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
    flex: 1,
  },
});
