import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Card, Icon, Screen } from "../../components";
import { colorWithOpacity, colors, radius, spacing, typography } from "../../theme";

type SessionPreparingShellProps = {
  description: string;
  onClose?: () => void;
  title: string;
};

export function SessionPreparingShell({
  description,
  onClose,
  title,
}: SessionPreparingShellProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          duration: 1250,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.delay(250),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmer]);

  const shimmerTranslateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 360],
  });

  return (
    <Screen edges={["top", "bottom"]} style={styles.sessionContent}>
      <View style={styles.sessionTopBar}>
        {onClose ? (
          <Pressable
            accessibilityLabel="Close practice session"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
          >
            <Icon name="close" size={18} />
          </Pressable>
        ) : null}
        <Text style={styles.sessionBrand}>Patternly</Text>
      </View>

      <View style={styles.progressBlock}>
        <Text style={styles.itemCount}>Preparing session</Text>
        <View style={styles.progressPlaceholder}>
          <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.progressPlaceholderFill} />
        </View>
      </View>

      <Card variant="tonal" style={styles.questionSkeletonCard}>
        <View style={styles.cardAccent} />
        <View
          accessible
          accessibilityLabel={`${title}. ${description}`}
          style={styles.skeletonStack}
        >
          <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.eyebrowSkeleton} />
          <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.questionLineWide} />
          <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.questionLineMedium} />
          <View style={styles.metaRow}>
            <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.badgeSkeleton} />
            <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.badgeSkeletonShort} />
          </View>
        </View>
      </Card>

      <View style={styles.optionsSkeleton}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={styles.optionSkeletonCard}>
            <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.optionMarkerSkeleton} />
            <View style={styles.optionTextSkeleton}>
              <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.optionLineWide} />
              {index < 2 ? (
                <ShimmerBlock shimmerTranslateX={shimmerTranslateX} style={styles.optionLineShort} />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function ShimmerBlock({
  shimmerTranslateX,
  style,
}: {
  shimmerTranslateX: Animated.AnimatedInterpolation<string | number>;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.skeletonBase, style]}>
      <Animated.View
        style={[
          styles.shimmerHighlight,
          {
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sessionContent: {
    paddingBottom: spacing.xxxl,
  },
  sessionTopBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 48,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  pressed: {
    opacity: 0.82,
  },
  sessionBrand: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  itemCount: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  progressPlaceholder: {
    backgroundColor: colors.dark.surface,
    borderRadius: radius.pill,
    height: 8,
    overflow: "hidden",
  },
  progressPlaceholderFill: {
    borderRadius: radius.pill,
    height: "100%",
    width: "42%",
  },
  questionSkeletonCard: {
    minHeight: 190,
    overflow: "hidden",
    paddingLeft: spacing.xxl,
  },
  cardAccent: {
    backgroundColor: colors.dark.primary,
    borderBottomRightRadius: radius.pill,
    borderTopRightRadius: radius.pill,
    bottom: spacing.xl,
    left: 0,
    position: "absolute",
    top: spacing.xl,
    width: 3,
  },
  skeletonStack: {
    gap: spacing.md,
  },
  skeletonBase: {
    backgroundColor: colors.dark.surface,
    overflow: "hidden",
  },
  shimmerHighlight: {
    backgroundColor: colorWithOpacity(colors.dark.textPrimary, 0.12),
    height: "100%",
    width: 96,
  },
  eyebrowSkeleton: {
    borderRadius: radius.pill,
    height: 14,
    width: 96,
  },
  questionLineWide: {
    borderRadius: radius.sm,
    height: 24,
    width: "92%",
  },
  questionLineMedium: {
    borderRadius: radius.sm,
    height: 24,
    width: "68%",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  badgeSkeleton: {
    borderRadius: radius.pill,
    height: 28,
    width: 116,
  },
  badgeSkeletonShort: {
    borderRadius: radius.pill,
    height: 28,
    width: 82,
  },
  optionsSkeleton: {
    gap: spacing.md,
  },
  optionSkeletonCard: {
    alignItems: "flex-start",
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    padding: spacing.md,
  },
  optionMarkerSkeleton: {
    borderRadius: radius.pill,
    height: 22,
    marginTop: spacing.xxs,
    width: 22,
  },
  optionTextSkeleton: {
    flex: 1,
    gap: spacing.sm,
  },
  optionLineWide: {
    borderRadius: radius.sm,
    height: 16,
    width: "94%",
  },
  optionLineShort: {
    borderRadius: radius.sm,
    height: 16,
    width: "54%",
  },
});
