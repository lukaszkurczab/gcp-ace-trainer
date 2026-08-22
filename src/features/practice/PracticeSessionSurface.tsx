import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Icon } from "../../components";
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
  const controls = props.question && props.phase !== "preparing" && props.phase !== "completing" ? (
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
      {props.phase === "completing" ? <CompletingNotice /> : null}
      {props.runtimeIdentity && controls ? (
        <View testID={runtimeSelectors.session.track(props.runtimeIdentity.trackId)}>
          <View style={styles.questionAndResponse} testID={runtimeSelectors.session.roadmapNode(props.runtimeIdentity.roadmapNodeId)}>{controls}</View>
        </View>
      ) : controls ? <View style={styles.questionAndResponse}>{controls}</View> : null}
      {props.notice && props.phase !== "completing" ? <DurabilityNotice notice={props.notice} /> : null}
      {visibleFeedback && props.feedbackItem && itemId ? <PracticeFeedbackBlock feedback={visibleFeedback} item={props.feedbackItem} itemId={itemId} /> : null}
      {props.exit.kind === "leave" ? <ExitModal onAbandon={props.onAbandon} onDismiss={props.onDismissExit} onLeave={props.onConfirmLeave} sessionId={props.runtimeIdentity?.sessionId} trackId={props.runtimeIdentity?.trackId} /> : null}
    </SessionShell>
  );
}

function QuestionCard({ question }: Readonly<{ question: PracticeQuestionPresentation }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.questionCard} testID={runtimeSelectors.session.question(question.itemId)}>
      <Text maxFontSizeMultiplier={2} style={styles.questionLabel}>{"QUESTION"}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.prompt}>{question.prompt}</Text>
      {question.constraints?.length ? (
        <View style={styles.constraints}>
          {question.constraints.map((constraint) => <Text key={constraint} style={styles.constraint}>• {constraint}</Text>)}
        </View>
      ) : null}
    </View>
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

function CompletingNotice() {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  return (
    <View style={styles.asyncState}>
      <View style={styles.asyncStatusRow}>
        <View accessible accessibilityLabel={t("Finishing this session…")} style={styles.asyncIcon}>
          <Icon color={palette.textSecondary} name="rotate-ccw" size={24} />
        </View>
        <Text style={styles.asyncStatusLabel}>{t("LOADING")}</Text>
      </View>
      <Text maxFontSizeMultiplier={2} style={styles.asyncTitle}>{t("Finishing this session…")}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.asyncDescription}>{t("Saving your answers and preparing your summary.")}</Text>
      <View accessible={false} style={styles.asyncSpacer} />
    </View>
  );
}

function DurabilityNotice({ notice }: Readonly<{ notice: PracticeNotice }>) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const operationFailure = notice.tone === "error";
  return <View accessible accessibilityLabel={notice.message} accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.notice, operationFailure ? styles.noticeError : notice.tone === "success" ? styles.noticeSuccess : null]}>{operationFailure ? <Icon color={palette.warning} name="alert-triangle" size={20} /> : null}<Text style={[styles.noticeText, operationFailure ? styles.noticeErrorText : null]}>{notice.message}</Text></View>;
}

function ActionBar(props: PracticeSessionSurfaceProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
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
      {props.onRetry && props.retryLabel ? <Button onPress={props.onRetry} variant="secondary">{t(props.retryLabel)}</Button> : null}
      {props.allowLeave !== false && props.exit.kind === "none" && props.phase !== "preparing" && props.phase !== "completion_failed" && props.phase !== "abandoning" && props.phase !== "abandonment_failed_before_journal" && props.phase !== "abandonment_recovery_required" ? <Button onPress={props.onRequestLeave} testID={props.runtimeIdentity ? runtimeSelectors.session.leave(props.runtimeIdentity.sessionId) : undefined} variant="ghost">{t("Leave session")}</Button> : null}
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
  if (trackId === "backend-system-design-interview" || trackId === "frontend-system-design-interview" || trackId === "object-oriented-design-interview") return Object.freeze({ description: "Pause keeps this exact Design Interview session available to resume later. End session makes it non-resumable and returns to Practice.", destructiveLabel: "End session" });
  throw new Error("Practice exit requires an exact supported track identity.");
}

function noop() {}

const createStyles = (palette: AppColors) => StyleSheet.create({
  actions: { gap: spacing.sm },
  asyncDescription: { ...typography.body, color: palette.textSecondary },
  asyncIcon: { alignItems: "center", backgroundColor: palette.surfaceInput, borderRadius: radius.lg, height: 44, justifyContent: "center", width: 44 },
  asyncStatusLabel: { ...typography.caption, color: palette.textMuted, flex: 1, fontWeight: "600", letterSpacing: 0.5 },
  asyncStatusRow: { alignItems: "center", flexDirection: "row", gap: spacing.md, width: "100%" },
  asyncState: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.button, borderWidth: 1, gap: spacing.lg, padding: spacing.xl },
  asyncSpacer: { height: 50, minHeight: 50, width: 1 },
  asyncTitle: { color: palette.textPrimary, fontSize: 22, fontWeight: "600", lineHeight: 28 },
  completingActions: { minHeight: 48 },
  constraint: { ...typography.small, color: palette.textSecondary },
  constraints: { gap: spacing.xs },
  exitSurface: { backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderTopLeftRadius: radius.button, borderTopRightRadius: radius.button, borderWidth: 1, elevation: 8, gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, shadowColor: "#000000", shadowOffset: { height: -4, width: 0 }, shadowOpacity: 0.48, shadowRadius: 12, width: "100%" },
  exitTitle: { ...typography.heading, color: palette.textPrimary },
  notice: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  noticeError: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderColor: palette.warning, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  noticeErrorText: { color: palette.warning, flex: 1 },
  noticeSuccess: { backgroundColor: palette.successSoft, borderColor: palette.success },
  noticeText: { ...typography.small, color: palette.textSecondary },
  modalBackdrop: { backgroundColor: "rgba(0, 0, 0, 0.56)", flex: 1, justifyContent: "flex-end" },
  modalDismissArea: { ...StyleSheet.absoluteFill },
  preparing: { backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, minHeight: 160, justifyContent: "center", padding: spacing.xl },
  preparingTitle: { ...typography.heading, color: palette.textPrimary },
  questionLabel: { ...typography.caption, color: palette.primary, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  prompt: { color: palette.textPrimary, fontSize: 22, fontWeight: "600", letterSpacing: -0.3, lineHeight: 28 },
  questionCard: { gap: spacing.md },
  questionAndResponse: { gap: spacing.lg },
});
