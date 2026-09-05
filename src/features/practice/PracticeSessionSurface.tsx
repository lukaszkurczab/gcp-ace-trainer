import { PracticeQuestionCard } from "./PracticeQuestionCard";
import { getPracticeSessionExitCopy } from "./practiceSessionExitCopy";
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Button, Icon, LoadingState, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import type { ContentItemRef, TrackId } from "../../domain";
import type { SessionMetricPresentation } from "../coding-interview/session/sessionAccessibility";
import { SessionShell } from "../coding-interview/session/SessionShell";
import { radius, spacing, typography } from "../../theme";
import { PracticeFeedbackBlock } from "./PracticeFeedbackBlock";
import { PracticeResponseControls } from "./PracticeResponseControls";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

import {
  allowsPracticeFeedback,
  allowsPracticeResponseEditing,
  type PracticeFeedback,
  type PracticeNotice,
  type PracticeResponseControl,
  type PracticeSurfacePhase,
} from "./practiceSessionPresentation";

export type PracticeQuestionPresentation = Readonly<{
  constraints?: readonly string[];
  itemId: string;
  prompt: string;
  responseControl: PracticeResponseControl;
}>;

export type PracticeRuntimeIdentity = Readonly<{
  actualLength: number;
  feedbackTiming: "afterEachAnswer" | "atSessionEnd";
  itemId: string;
  modeId: string;
  ordinal: number;
  roadmapNodeId: string;
  sessionId: string;
  trackId: TrackId;
}>;

export type PracticeExitPresentation =
  | Readonly<{ kind: "leave" }>
  | Readonly<{ kind: "none" }>;

export type PracticeSessionSurfaceProps = Readonly<{
  allowLeave?: boolean;
  exit: PracticeExitPresentation;
  feedback?: PracticeFeedback;
  feedbackItem?: ContentItemRef;
  isFinalPosition: boolean;
  modeLabel?: string;
  notice?: PracticeNotice;
  onAbandon: () => void;
  onChoicePress: (optionId: string) => void;
  onComplexityValuePress: (dimensionId: string, value: string) => void;
  onConfirmLeave: () => void;
  onDismissExit: () => void;
  onOrderingMove: (elementId: string, direction: "up" | "down") => void;
  onPrimaryAction?: () => void;
  onRequestLeave: () => void;
  onRetry?: () => void;
  phase: PracticeSurfacePhase;
  position?: SessionMetricPresentation;
  primaryAction?: Readonly<{ enabled: boolean; label: string; loading: boolean }>;
  progress?: number;
  question?: PracticeQuestionPresentation;
  retryLabel?: string;
  retryVariant?: "primary" | "secondary";
  runtimeIdentity?: PracticeRuntimeIdentity;
  timer?: SessionMetricPresentation;
}>;

/**
 * Stateless canonical Practice composition. It only renders the supplied
 * projection and emits UI events; session, scoring, content, timing and
 * recovery remain application-owned.
 */
export function PracticeSessionSurface(props: PracticeSessionSurfaceProps) {
  const styles = useThemedStyles(createStyles);
  const editable = allowsPracticeResponseEditing(props.phase);
  const visibleFeedback = allowsPracticeFeedback(props.phase) ? props.feedback : undefined;
  const itemId = props.runtimeIdentity?.itemId ?? props.question?.itemId;
  const controls = props.question && props.phase !== "preparing" && props.phase !== "completing" ? (
    <>
      <PracticeQuestionCard question={props.question} />
      <PracticeResponseControls
        control={props.question.responseControl}
        editable={editable}
        itemId={itemId}
        onChoicePress={props.onChoicePress}
        onComplexityValuePress={props.onComplexityValuePress}
        onOrderingMove={props.onOrderingMove}
      />
    </>
  ) : null;

  return (
    <SessionShell
      actionBar={props.phase === "preparing" ? undefined : <ActionBar {...props} />}
      key={itemId}
      modeTestID={props.runtimeIdentity ? runtimeSelectors.session.mode(props.runtimeIdentity.modeId) : undefined}
      modeLabel={props.modeLabel}
      position={props.position}
      positionTestID={props.runtimeIdentity ? runtimeSelectors.session.counter(props.runtimeIdentity.sessionId, props.runtimeIdentity.ordinal, props.runtimeIdentity.actualLength) : undefined}
      progress={props.progress}
      progressTestID={props.runtimeIdentity ? runtimeSelectors.session.configuration(props.runtimeIdentity.sessionId, props.runtimeIdentity.actualLength, props.runtimeIdentity.feedbackTiming) : undefined}
      rootTestID={props.runtimeIdentity ? runtimeSelectors.session.root(props.runtimeIdentity.sessionId) : undefined}
      timer={props.timer}
      timerTestID={props.runtimeIdentity ? runtimeSelectors.session.timer(props.runtimeIdentity.sessionId) : undefined}
    >
      {props.phase === "preparing" ? <PracticeSessionLoadingSkeleton /> : null}
      {props.phase === "completing" ? <CompletingNotice /> : null}
      {props.runtimeIdentity && controls ? (
        <View testID={runtimeSelectors.session.track(props.runtimeIdentity.trackId)}>
          <View style={styles.questionAndResponse} testID={runtimeSelectors.session.roadmapNode(props.runtimeIdentity.roadmapNodeId)}>{controls}</View>
        </View>
      ) : controls ? <View style={styles.questionAndResponse}>{controls}</View> : null}
      {props.notice && props.phase !== "completing" ? <DurabilityNotice notice={props.notice} /> : null}
      {visibleFeedback && props.feedbackItem && itemId ? <PracticeFeedbackBlock feedback={visibleFeedback} item={props.feedbackItem} itemId={itemId} reportSurface={{ modeRoute: "practice_feedback_details", trackNode: props.runtimeIdentity?.roadmapNodeId ?? null }} /> : null}
      {props.exit.kind === "leave" ? <ExitModal onAbandon={props.onAbandon} onDismiss={props.onDismissExit} onLeave={props.onConfirmLeave} sessionId={props.runtimeIdentity?.sessionId} trackId={props.runtimeIdentity?.trackId} /> : null}
    </SessionShell>
  );
}

export function PracticeSessionLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={t("Preparing session")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.practiceSessionLoading}
      testID="practice-session-loading-skeleton"
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.practiceSessionLoadingShapes}>
        <View style={styles.practiceSessionLoadingQuestion} testID="practice-session-loading-question">
          <SkeletonShape motion={motion} style={[styles.practiceSessionLoadingLine, styles.practiceSessionLoadingQuestionTitle, { height: 22 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSessionLoadingLine, styles.practiceSessionLoadingQuestionLine, { height: 15 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSessionLoadingLine, styles.practiceSessionLoadingQuestionLineShort, { height: 15 * textScale }]} />
        </View>
        <View style={[styles.practiceSessionLoadingResponse, largeLayout ? styles.practiceSessionLoadingResponseLarge : null]} testID="practice-session-loading-response">
          <SkeletonShape motion={motion} style={[styles.practiceSessionLoadingLine, styles.practiceSessionLoadingResponseTitle, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSessionLoadingLine, styles.practiceSessionLoadingResponseLine, { height: 15 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSessionLoadingLine, styles.practiceSessionLoadingResponseLineLong, { height: 15 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSessionLoadingLine, styles.practiceSessionLoadingResponseLineShort, { height: 15 * textScale }]} />
        </View>
      </View>
    </View>
  );
}

function CompletingNotice() {
  const { t } = useTranslation("common");
  return <LoadingState description={t("Preparing your summary.")} title={t("Finishing this session…")} />;
}

function DurabilityNotice({ notice }: Readonly<{ notice: PracticeNotice }>) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const operationFailure = notice.tone === "error";
  const message = t(notice.message);
  return <View accessible accessibilityLabel={message} accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.notice, operationFailure ? styles.noticeError : notice.tone === "success" ? styles.noticeSuccess : null]}>{operationFailure ? <Icon color={palette.warning} name="alert-triangle" size={20} /> : null}<Text maxFontSizeMultiplier={2} style={[styles.noticeText, operationFailure ? styles.noticeErrorText : null]}>{message}</Text></View>;
}

function ActionBar(props: PracticeSessionSurfaceProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  if (props.exit.kind !== "none") return null;
  if (props.phase === "completing") return <View style={styles.completingActions} />;
  return (
    <View style={styles.actions}>
      {props.primaryAction ? (
        <Button
          disabled={!props.primaryAction.enabled}
          loading={props.primaryAction.loading}
          onPress={props.onPrimaryAction ?? noop}
          testID={primaryActionTestID(props)}
        >
          {t(props.primaryAction.label)}
        </Button>
      ) : null}
      {props.onRetry && props.retryLabel ? <Button onPress={props.onRetry} variant={props.retryVariant ?? "secondary"}>{t(props.retryLabel)}</Button> : null}
      {props.allowLeave !== false && props.exit.kind === "none" && props.phase !== "preparing" && props.phase !== "completion_failed" && props.phase !== "abandoning" && props.phase !== "abandonment_failed_before_journal" && props.phase !== "abandonment_recovery_required" ? <Button onPress={props.onRequestLeave} style={styles.leaveAction} testID={props.runtimeIdentity ? runtimeSelectors.session.leave(props.runtimeIdentity.sessionId) : undefined} variant="ghost">{t("Leave session")}</Button> : null}
    </View>
  );
}

function primaryActionTestID(props: PracticeSessionSurfaceProps): string | undefined {
  if (!props.runtimeIdentity || !props.primaryAction) return undefined;
  return props.phase === "unanswered" || props.phase === "submit_journal_failed"
    ? runtimeSelectors.session.submit(props.runtimeIdentity.itemId)
    : runtimeSelectors.session.continue(props.runtimeIdentity.itemId);
}

function ExitModal({ onAbandon, onDismiss, onLeave, sessionId, trackId }: Readonly<{ onAbandon: () => void; onDismiss: () => void; onLeave: () => void; sessionId?: string; trackId?: TrackId }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const insets = useSafeAreaInsets();
  const copy = getPracticeSessionExitCopy(trackId);
  return (
    <Modal animationType="fade" onRequestClose={onDismiss} transparent visible>
      <View style={styles.modalBackdrop}>
        <Pressable accessibilityLabel={t("Keep learning")} accessibilityRole="button" onPress={onDismiss} style={styles.modalDismissArea} />
        <View accessibilityViewIsModal style={styles.exitModalStack}>
          <View style={styles.exitSurface}>
            <Text maxFontSizeMultiplier={2} style={styles.exitTitle}>{t("Pause or end this session?")}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.noticeText}>{t(copy.description)}</Text>
            <View style={styles.exitSheetActions}>
              <Button onPress={onDismiss} testID={sessionId ? runtimeSelectors.session.keepLearning(sessionId) : undefined}>{t("Keep learning")}</Button>
              <Button onPress={onLeave} testID={sessionId ? runtimeSelectors.session.leaveAndResume(sessionId) : undefined} variant="secondary">{t("Pause and resume later")}</Button>
            </View>
          </View>
          <View style={[styles.exitDestructiveAction, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <Button onPress={onAbandon} testID={sessionId ? runtimeSelectors.session.abandon(sessionId) : undefined} variant="destructive">{t(copy.destructiveLabel)}</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function noop() {}

const createStyles = (palette: AppColors) => StyleSheet.create({
  actions: { gap: spacing.sm },
  practiceSessionLoading: { gap: spacing.lg, width: "100%" },
  practiceSessionLoadingShapes: { gap: spacing.lg, width: "100%" },
  practiceSessionLoadingQuestion: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  practiceSessionLoadingResponse: {
    backgroundColor: palette.surfaceInput,
    borderColor: palette.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 184,
    padding: spacing.xl,
  },
  practiceSessionLoadingResponseLarge: {
    minHeight: 240,
  },
  practiceSessionLoadingLine: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
  },
  practiceSessionLoadingQuestionTitle: { width: "88%" },
  practiceSessionLoadingQuestionLine: { width: "94%" },
  practiceSessionLoadingQuestionLineShort: { width: "66%" },
  practiceSessionLoadingResponseTitle: { width: "48%" },
  practiceSessionLoadingResponseLine: { width: "74%" },
  practiceSessionLoadingResponseLineLong: { width: "92%" },
  practiceSessionLoadingResponseLineShort: { width: "56%" },
  completingActions: { minHeight: 48 },
  exitSurface: { backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderTopLeftRadius: radius.button, borderTopRightRadius: radius.button, borderWidth: 1, elevation: 8, gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, shadowColor: palette.effects.shadow, shadowOffset: { height: -4, width: 0 }, shadowOpacity: 0.48, shadowRadius: 12, width: "100%" },
  exitModalStack: { width: "100%" },
  exitSheetActions: { gap: spacing.sm },
  exitDestructiveAction: { backgroundColor: palette.background, paddingHorizontal: spacing.xl, width: "100%" },
  exitTitle: { ...typography.heading, color: palette.textPrimary },
  leaveAction: { minHeight: 48, paddingVertical: spacing.sm },
  notice: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  noticeError: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderColor: palette.warning, borderRadius: radius.lg, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  noticeErrorText: { color: palette.warning, flex: 1 },
  noticeSuccess: { backgroundColor: palette.successSoft, borderColor: palette.success },
  noticeText: { ...typography.small, color: palette.textSecondary },
  modalBackdrop: { backgroundColor: palette.effects.sessionScrim, flex: 1, justifyContent: "flex-end" },
  modalDismissArea: { ...StyleSheet.absoluteFill },
  questionAndResponse: { gap: spacing.md },
});
