import { StyleSheet, Text, View } from "react-native";

import { Button, Card } from "../../components";
import type { SessionMetricPresentation } from "../algorithms/session/sessionAccessibility";
import { SessionShell } from "../algorithms/session/SessionShell";
import { colors, radius, spacing, typography } from "../../theme";
import { PracticeFeedbackBlock } from "./PracticeFeedbackBlock";
import { PracticeResponseControls } from "./PracticeResponseControls";
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
  prompt: string;
  responseControl: PracticeResponseControl;
}>;

export type PracticeExitPresentation =
  | Readonly<{ kind: "leave" }>
  | Readonly<{ kind: "abandon_confirmation" }>
  | Readonly<{ kind: "none" }>;

export type PracticeSessionSurfaceProps = Readonly<{
  exit: PracticeExitPresentation;
  feedback?: PracticeFeedback;
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
  onRequestAbandon: () => void;
  onRequestLeave: () => void;
  onRetry?: () => void;
  phase: PracticeSurfacePhase;
  position?: SessionMetricPresentation;
  primaryAction?: Readonly<{ enabled: boolean; label: string; loading: boolean }>;
  progress?: number;
  question?: PracticeQuestionPresentation;
  retryLabel?: string;
  timer?: SessionMetricPresentation;
}>;

/**
 * Stateless canonical Practice composition. It only renders the supplied
 * projection and emits UI events; session, scoring, content, timing and
 * recovery remain application-owned.
 */
export function PracticeSessionSurface(props: PracticeSessionSurfaceProps) {
  const editable = allowsPracticeResponseEditing(props.phase);
  const visibleFeedback = allowsPracticeFeedback(props.phase) ? props.feedback : undefined;
  const controls = props.question && props.phase !== "preparing" ? (
    <>
      <QuestionCard question={props.question} />
      <PracticeResponseControls
        control={props.question.responseControl}
        editable={editable}
        onChoicePress={props.onChoicePress}
        onComplexityValuePress={props.onComplexityValuePress}
        onOrderingMove={props.onOrderingMove}
      />
    </>
  ) : null;

  return (
    <SessionShell
      actionBar={<ActionBar {...props} />}
      modeLabel={props.modeLabel}
      position={props.position}
      progress={props.progress}
      timer={props.timer}
    >
      {props.phase === "preparing" ? <PreparingNotice /> : null}
      {controls}
      {props.notice ? <DurabilityNotice notice={props.notice} /> : null}
      {visibleFeedback ? <PracticeFeedbackBlock feedback={visibleFeedback} /> : null}
      {props.exit.kind === "leave" ? <LeaveSurface /> : null}
      {props.exit.kind === "abandon_confirmation" ? <AbandonSurface /> : null}
    </SessionShell>
  );
}

function QuestionCard({ question }: Readonly<{ question: PracticeQuestionPresentation }>) {
  return (
    <Card style={styles.questionCard}>
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
  return (
    <View accessibilityLabel="Preparing session" style={styles.preparing}>
      <Text style={styles.preparingTitle}>Preparing Guided Practice</Text>
      <Text style={styles.noticeText}>Preparing the session plan and first question.</Text>
    </View>
  );
}

function DurabilityNotice({ notice }: Readonly<{ notice: PracticeNotice }>) {
  return (
    <View accessible accessibilityLabel={notice.message} accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.notice, notice.tone === "error" ? styles.noticeError : notice.tone === "success" ? styles.noticeSuccess : null]}>
      <Text style={styles.noticeText}>{notice.message}</Text>
    </View>
  );
}

function ActionBar(props: PracticeSessionSurfaceProps) {
  if (props.exit.kind === "leave") {
    return (
      <View style={styles.actions}>
        <Button onPress={props.onDismissExit} variant="secondary">Keep learning</Button>
        <Button onPress={props.onConfirmLeave}>Leave and resume later</Button>
        <Button onPress={props.onRequestAbandon} variant="ghost">Abandon session</Button>
      </View>
    );
  }
  if (props.exit.kind === "abandon_confirmation") {
    return (
      <View style={styles.actions}>
        <Button onPress={props.onDismissExit} variant="secondary">Keep session</Button>
        <Button onPress={props.onAbandon} variant="destructive">Abandon session</Button>
      </View>
    );
  }
  return (
    <View style={styles.actions}>
      {props.primaryAction ? (
        <Button disabled={!props.primaryAction.enabled} loading={props.primaryAction.loading} onPress={props.onPrimaryAction ?? noop}>
          {props.primaryAction.label}
        </Button>
      ) : null}
      {props.onRetry && props.retryLabel ? <Button onPress={props.onRetry} variant="secondary">{props.retryLabel}</Button> : null}
      {props.exit.kind === "none" && props.phase !== "preparing" && props.phase !== "abandoning" ? <Button onPress={props.onRequestLeave} variant="ghost">Leave session</Button> : null}
    </View>
  );
}

function LeaveSurface() {
  return (
    <View accessibilityViewIsModal style={styles.exitSurface}>
      <Text style={styles.exitTitle}>Leave this session?</Text>
      <Text style={styles.noticeText}>Leaving preserves this active session so you can resume later.</Text>
    </View>
  );
}

function AbandonSurface() {
  return (
    <View accessibilityViewIsModal style={styles.exitSurface}>
      <Text style={styles.exitTitle}>Abandon this session?</Text>
      <Text style={styles.noticeText}>Abandoning ends resumability. Answers already saved remain durable.</Text>
    </View>
  );
}

function noop() {}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  constraint: { ...typography.small, color: colors.dark.textSecondary },
  constraints: { gap: spacing.xs },
  exitSurface: { backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.borderStrong, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  exitTitle: { ...typography.heading, color: colors.dark.textPrimary },
  notice: { backgroundColor: colors.dark.surface, borderColor: colors.dark.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  noticeError: { backgroundColor: colors.dark.dangerSoft, borderColor: colors.dark.danger },
  noticeSuccess: { backgroundColor: colors.dark.successSoft, borderColor: colors.dark.success },
  noticeText: { ...typography.small, color: colors.dark.textSecondary },
  preparing: { backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, minHeight: 160, justifyContent: "center", padding: spacing.xl },
  preparingTitle: { ...typography.heading, color: colors.dark.textPrimary },
  prompt: { ...typography.heading, color: colors.dark.textPrimary },
  questionCard: { gap: spacing.lg },
});
