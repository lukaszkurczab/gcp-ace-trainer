import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import type { TrackDefinition } from "../../domain";
import { colors, radius, spacing, typography } from "../../theme";
import { Badge } from "../Badge";
import { ProgressBar } from "../ProgressBar";

type TrackCardProps = {
  isActive?: boolean;
  onPress?: () => void;
  progress?: number;
  progressLabel?: string;
  style?: ViewStyle;
  testID?: string;
  track: TrackDefinition;
};

export function TrackCard({
  isActive = false,
  onPress,
  progress,
  progressLabel,
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

      {typeof progress === "number" ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>{progressLabel ?? "Progress"}</Text>
            <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
          </View>
          <ProgressBar progress={progress} tone={track.id === "algorithms" ? "warning" : "primary"} />
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.nextAction}>{track.nextActionLabel}</Text>
        <Text style={styles.arrow}>{">"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.lg,
  },
  activeCard: {
    borderColor: colors.light.primary,
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
    color: colors.light.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.light.textSecondary,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  progressValue: {
    ...typography.caption,
    color: colors.light.textPrimary,
  },
  footer: {
    alignItems: "center",
    borderTopColor: colors.light.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingTop: spacing.md,
  },
  nextAction: {
    ...typography.bodyStrong,
    color: colors.light.textPrimary,
    flex: 1,
  },
  arrow: {
    ...typography.heading,
    color: colors.light.textMuted,
  },
});
