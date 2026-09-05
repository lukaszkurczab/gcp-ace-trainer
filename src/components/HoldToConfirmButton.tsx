import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useAppPreferences, useThemedStyles } from "../preferences";
import { radius, spacing, typography, type AppColors } from "../theme";
import {
  createHoldToConfirmController,
  HOLD_TO_CONFIRM_DURATION_MS,
  type HoldToConfirmClock,
  type HoldToConfirmController,
  type HoldToConfirmFrameScheduler,
  type HoldToConfirmState,
} from "./holdToConfirmGesture";

export type HoldToConfirmButtonProps = Readonly<{
  accessibilityLabel?: string;
  children: ReactNode;
  clock?: HoldToConfirmClock;
  disabled?: boolean;
  hint: string;
  loading?: boolean;
  onConfirm: () => void;
  readyLabel: string;
  scheduler?: HoldToConfirmFrameScheduler;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

type ResponderBounds = Readonly<{ height: number; width: number }>;

const DEFAULT_CLOCK: HoldToConfirmClock = Object.freeze({
  now: () => {
    const runtime = globalThis as typeof globalThis & { performance?: Readonly<{ now: () => number }> };
    return runtime.performance?.now?.() ?? Number.NaN;
  },
});

export function HoldToConfirmButton({
  accessibilityLabel,
  children,
  clock = DEFAULT_CLOCK,
  disabled = false,
  hint,
  loading = false,
  onConfirm,
  readyLabel,
  scheduler,
  style,
  testID,
}: HoldToConfirmButtonProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const clockRef = useRef(clock);
  clockRef.current = clock;
  const boundsRef = useRef<ResponderBounds>({ height: 0, width: 0 });
  const schedulerRef = useRef<HoldToConfirmFrameScheduler | null>(null);
  if (!schedulerRef.current) schedulerRef.current = scheduler ?? createNativeFrameScheduler();
  const controllerRef = useRef<HoldToConfirmController | null>(null);
  const [state, setState] = useState<HoldToConfirmState>({ elapsedMs: 0, phase: "idle", progress: 0 });

  if (!controllerRef.current) {
    controllerRef.current = createHoldToConfirmController({
      clock: { now: () => clockRef.current.now() },
      durationMs: HOLD_TO_CONFIRM_DURATION_MS,
      onComplete: () => onConfirmRef.current(),
      onStateChange: setState,
      scheduler: schedulerRef.current,
    });
  }
  const controller = controllerRef.current;
  const isInteractive = !disabled && !loading;
  const isInteractiveRef = useRef(isInteractive);
  isInteractiveRef.current = isInteractive;

  useLayoutEffect(() => {
    controller.activate();
    controller.setEnabled(isInteractive);
    if (!isInteractive) controller.reset();
    return () => controller.deactivate();
  }, [controller, isInteractive]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") controller.terminate();
    });
    return () => subscription.remove();
  }, [controller]);

  const handleLayout = (event: LayoutChangeEvent): void => {
    boundsRef.current = {
      height: event.nativeEvent.layout.height,
      width: event.nativeEvent.layout.width,
    };
  };

  const isInsideMeasuredBounds = (locationX: number, locationY: number): boolean => {
    const { height, width } = boundsRef.current;
    const hasMeasuredBounds = width > 0 && height > 0;
    return !hasMeasuredBounds
      || (Number.isFinite(locationX) && Number.isFinite(locationY)
        && locationX >= 0 && locationY >= 0 && locationX <= width && locationY <= height);
  };

  const handleMove = (locationX: number, locationY: number): void => {
    if (!isInteractiveRef.current) {
      controller.reset();
      return;
    }
    controller.move(isInsideMeasuredBounds(locationX, locationY));
  };

  const percent = Math.round(state.progress * 100);
  const progressTestID = testID ? `${testID}-progress` : undefined;
  const fillTestID = testID ? `${testID}-progress-fill` : undefined;
  const percentTestID = testID ? `${testID}-progress-percent` : undefined;
  const hintTestID = testID ? `${testID}-hint` : undefined;
  const readyTestID = testID ? `${testID}-ready-label` : undefined;
  const handleGrant = (): void => {
    if (!isInteractiveRef.current) {
      controller.reset();
      return;
    }
    controller.grant();
  };
  const handleRelease = (locationX: number, locationY: number): void => {
    if (!isInteractiveRef.current) {
      controller.reset();
      return;
    }
    if (!isInsideMeasuredBounds(locationX, locationY)) controller.move(false);
    controller.release();
  };

  return (
    <View
      accessible
      accessibilityHint={hint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: !isInteractive }}
      onLayout={handleLayout}
      onMoveShouldSetResponder={() => false}
      onResponderGrant={handleGrant}
      onResponderMove={(event) => handleMove(event.nativeEvent.locationX, event.nativeEvent.locationY)}
      onResponderRelease={(event) => handleRelease(event.nativeEvent.locationX, event.nativeEvent.locationY)}
      onResponderTerminate={() => controller.terminate()}
      onResponderTerminationRequest={() => true}
      onStartShouldSetResponder={() => isInteractive}
      style={[styles.root, !isInteractive ? styles.disabled : null, style]}
      testID={testID}
    >
      <View pointerEvents="none" style={styles.content}>
        {loading ? <ActivityIndicator accessibilityElementsHidden color={palette.onDanger} importantForAccessibility="no" size="small" /> : null}
        <Text maxFontSizeMultiplier={2} style={styles.label}>{children}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.percent} testID={percentTestID}>{`${percent}%`}</Text>
        {state.phase === "ready" ? <Text maxFontSizeMultiplier={2} style={styles.readyLabel} testID={readyTestID}>{readyLabel}</Text> : null}
        <Text maxFontSizeMultiplier={2} style={styles.hint} testID={hintTestID}>{hint}</Text>
      </View>
      <View pointerEvents="none" style={styles.progressArea} testID={progressTestID}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} testID={fillTestID} />
        </View>
      </View>
    </View>
  );
}

function createNativeFrameScheduler(): HoldToConfirmFrameScheduler {
  return {
    cancel: (frameId) => cancelAnimationFrame(frameId),
    request: (callback) => requestAnimationFrame(() => callback()),
  };
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  content: {
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.55,
  },
  hint: {
    ...typography.small,
    color: palette.onDanger,
    opacity: 0.88,
    textAlign: "center",
  },
  label: {
    ...typography.button,
    color: palette.onDanger,
    textAlign: "center",
  },
  percent: {
    ...typography.small,
    color: palette.onDanger,
    fontVariant: ["tabular-nums"],
  },
  progressArea: {
    alignSelf: "stretch",
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  progressFill: {
    backgroundColor: palette.onDanger,
    height: "100%",
    opacity: 1,
  },
  progressTrack: {
    backgroundColor: palette.danger,
    borderColor: palette.onDanger,
    borderRadius: 4,
    borderWidth: 1,
    height: 8,
    overflow: "hidden",
    width: "100%",
  },
  readyLabel: {
    ...typography.small,
    color: palette.onDanger,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  root: {
    alignItems: "center",
    backgroundColor: palette.danger,
    borderColor: palette.danger,
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 64,
    minWidth: 48,
    overflow: "hidden",
  },
});
