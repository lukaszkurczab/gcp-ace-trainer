import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Card } from "../../components";
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
  const controls = props.question && props.phase !== "preparing" ? (
    <>
      <QuestionCard question={props.question} />
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
      actionBar={<ActionBar {...props} />}
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
      {props.phase === "preparing" ? <PreparingNotice /> : null}
      {props.runtimeIdentity && controls ? (
        <View testID={runtimeSelectors.session.track(props.runtimeIdentity.trackId)}>
          <View style={styles.questionAndResponse} testID={runtimeSelectors.session.roadmapNode(props.runtimeIdentity.roadmapNodeId)}>{controls}</View>
        </View>
      ) : controls ? <View style={styles.questionAndResponse}>{controls}</View> : null}
      {props.notice ? <DurabilityNotice notice={props.notice} /> : null}
      {visibleFeedback && props.feedbackItem && itemId ? <PracticeFeedbackBlock feedback={visibleFeedback} item={props.feedbackItem} itemId={itemId} /> : null}
      {props.exit.kind === "leave" ? <ExitModal onAbandon={props.onAbandon} onDismiss={props.onDismissExit} onLeave={props.onConfirmLeave} sessionId={props.runtimeIdentity?.sessionId} trackId={props.runtimeIdentity?.trackId} /> : null}
    </SessionShell>
  );
}

function QuestionCard({ question }: Readonly<{ question: PracticeQuestionPresentation }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <Card
      style={styles.questionCard}
      testID={runtimeSelectors.session.question(question.itemId)}
      variant="layered"
    >
      <Text style={styles.prompt}>{question.prompt}</Text>
      {question.constraints?.length ? (
        <View style={styles.constraints}>
          {question.constraints.map((constraint) => <Text key={constraint} style={styles.constraint}>• {constraint}</Text>)}
        </View>
      ) : null}
    </Card>
  );
}

function PreparingNotice() {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return (
    <View accessibilityLabel={t("Preparing session")} style={styles.preparing}>
      <Text style={styles.preparingTitle}>{t("Preparing practice")}</Text>
      <Text style={styles.noticeText}>{t("Preparing the session plan and first question.")}</Text>
    </View>
  );
}

function DurabilityNotice({ notice }: Readonly<{ notice: PracticeNotice }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessible accessibilityLabel={notice.message} accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.notice, notice.tone === "error" ? styles.noticeError : notice.tone === "success" ? styles.noticeSuccess : null]}>
      <Text style={styles.noticeText}>{notice.message}</Text>
    </View>
  );
}

function ActionBar(props: PracticeSessionSurfaceProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  if (props.exit.kind !== "none") return null;
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
      {props.onRetry && props.retryLabel ? <Button onPress={props.onRetry} variant="secondary">{t(props.retryLabel)}</Button> : null}
      {props.allowLeave !== false && props.exit.kind === "none" && props.phase !== "preparing" && props.phase !== "completing" && props.phase !== "completion_failed" && props.phase !== "abandoning" && props.phase !== "abandonment_failed_before_journal" && props.phase !== "abandonment_recovery_required" ? <Button onPress={props.onRequestLeave} testID={props.runtimeIdentity ? runtimeSelectors.session.leave(props.runtimeIdentity.sessionId) : undefined} variant="ghost">{t("Leave session")}</Button> : null}
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
  const { t } = useAppPreferences();
  const copy = exitCopy(trackId);
  return (
    <Modal animationType="fade" onRequestClose={onDismiss} transparent visible>
      <View style={styles.modalBackdrop}>
        <Pressable accessibilityLabel={t("Keep learning")} accessibilityRole="button" onPress={onDismiss} style={styles.modalDismissArea} />
        <View accessibilityViewIsModal style={styles.exitSurface}>
          <Text style={styles.exitTitle}>{t("Pause or end this session?")}</Text>
          <Text style={styles.noticeText}>{t(copy.description)}</Text>
          <View style={styles.actions}>
            <Button onPress={onDismiss} testID={sessionId ? runtimeSelectors.session.keepLearning(sessionId) : undefined} variant="secondary">{t("Keep learning")}</Button>
            <Button onPress={onLeave} testID={sessionId ? runtimeSelectors.session.leaveAndResume(sessionId) : undefined}>{t("Pause and resume later")}</Button>
            <Button onPress={onAbandon} testID={sessionId ? runtimeSelectors.session.abandon(sessionId) : undefined} variant="destructive">{t(copy.destructiveLabel)}</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function exitCopy(trackId: TrackId | undefined): Readonly<{ description: string; destructiveLabel: string }> {
  if (trackId === "coding-interview-dsa-problem-solving") return Object.freeze({ description: "Pause to resume later, or end the session and view a partial summary. Saved answers remain available.", destructiveLabel: "End and view summary" });
  if (trackId === "google-cloud-associate-cloud-engineer") return Object.freeze({ description: "Pause keeps this exact session available to resume later. End session makes it non-resumable and returns to Practice.", destructiveLabel: "End session" });
  throw new Error("Practice exit requires an exact supported track identity.");
}

function noop() {}

const createStyles = (palette: AppColors) => StyleSheet.create({
  actions: { gap: spacing.sm },
  constraint: { ...typography.small, color: palette.textSecondary },
  constraints: { gap: spacing.xs },
  exitSurface: { backgroundColor: palette.elevatedSurface, borderColor: palette.borderStrong, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, maxWidth: 480, padding: spacing.lg, width: "100%" },
  exitTitle: { ...typography.heading, color: palette.textPrimary },
  notice: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  noticeError: { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
  noticeSuccess: { backgroundColor: palette.successSoft, borderColor: palette.success },
  noticeText: { ...typography.small, color: palette.textSecondary },
  modalBackdrop: { alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.56)", flex: 1, justifyContent: "center", padding: spacing.lg },
  modalDismissArea: { ...StyleSheet.absoluteFill },
  preparing: { backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, minHeight: 160, justifyContent: "center", padding: spacing.xl },
  preparingTitle: { ...typography.heading, color: palette.textPrimary },
  prompt: { ...typography.heading, color: palette.textPrimary },
  questionAndResponse: { gap: spacing.lg },
  questionCard: { gap: spacing.lg },
});
