import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { getApproachChallengeDetailedHistory, type ApproachChallengeDetailedHistory } from "../../application/coding-interview/approachChallengeSessionFacade";
import { captureProfileReadFence } from "../../application/profileReadFence";
import { AnswerOption, BackLink, Button, Card, EmptyState } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { SessionShell } from "../coding-interview/session/SessionShell";
import { ApproachChallengeFeedback } from "./ApproachChallengeFeedback";
import { ApproachChallengeQuestion } from "./ApproachChallengeQuestion";
import { approachChallengeOptionState, readOptions, resultTitle } from "./approachChallengePresentation";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.APPROACH_CHALLENGE_REVIEW>;
type ReadState = { key: string; kind: "pending" | "unavailable" } | { key: string; kind: "ready"; detail: ApproachChallengeDetailedHistory };

/** Exact terminal history only: this screen has no active-session commands. */
export function ApproachChallengeReviewScreen({ navigation, route }: Props) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const { sessionId, approachOccurrenceId } = route.params;
  const key = JSON.stringify([sessionId, approachOccurrenceId]);
  const [read, setRead] = useState<ReadState>({ key, kind: "pending" });
  const [current, setCurrent] = useState(approachOccurrenceId);
  useEffect(() => {
    let live = true;
    setRead({ key, kind: "pending" });
    setCurrent(approachOccurrenceId);
    void (async () => {
      try {
        const assertCurrent = captureProfileReadFence();
        const detail = await getApproachChallengeDetailedHistory(sessionId);
        assertCurrent();
        if (!live) return;
        if (detail.kind !== "ready" || detail.sessionId !== sessionId || detail.problems.filter(problem => problem.stages[0].occurrenceId === approachOccurrenceId).length !== 1) {
          setRead({ key, kind: "unavailable" });
        } else setRead({ key, kind: "ready", detail });
      } catch { if (live) setRead({ key, kind: "unavailable" }); }
    })();
    return () => { live = false; };
  }, [sessionId, approachOccurrenceId, key]);
  const back = () => navigation.popTo(ROUTES.APPROACH_CHALLENGE, { sessionId });
  const headerAction = <BackLink destinationLabel={t("Session result")} onPress={back} />;
  if (read.key !== key || read.kind === "pending") return <SessionShell headerAction={headerAction} modeLabel={t("Answer review")}><ActivityIndicator accessibilityLabel={t("Loading review…")} /></SessionShell>;
  if (read.kind !== "ready") return <SessionShell headerAction={headerAction} modeLabel={t("Answer review")}><EmptyState title={t("Session result unavailable")} description={t("This session or its saved content is unavailable. Your saved answers have not been changed.")} actionLabel={t("Back to results")} onActionPress={back} /></SessionShell>;
  const index = read.detail.problems.findIndex(problem => problem.stages[0].occurrenceId === current);
  const problem = read.detail.problems[index]!;
  const previous = read.detail.problems[index - 1];
  const next = read.detail.problems[index + 1];
  return <SessionShell key={current} headerAction={headerAction} modeLabel={t("Answer review")}
    position={{ label: `${index + 1} / ${read.detail.problems.length}`, accessibilityLabel: t("Problem {{number}}", { number: index + 1 }) }}
    progress={(index + 1) / read.detail.problems.length}
    rootTestID={`acm-review-${sessionId}-${current}`}
    actionBar={<View style={styles.actions}>
      <Button disabled={!previous} onPress={() => { if (previous) setCurrent(previous.stages[0].occurrenceId); }} variant="secondary" style={styles.action}>{t("Back")}</Button>
      <Button disabled={!next} onPress={() => { if (next) setCurrent(next.stages[0].occurrenceId); }} style={styles.action}>{t("Next")}</Button>
    </View>}
  >
    {problem.stages.map(stage => <Card key={stage.occurrenceId}>
      <Text maxFontSizeMultiplier={2} style={styles.title}>{t(stage.stage === "approach" ? "Approach" : "Complexity")}</Text>
      <ApproachChallengeQuestion prompt={stage.prompt} constraints={stage.stage === "approach" ? [] : stage.constraints} />
      {readOptions(stage.interaction.model).map((option, optionIndex) => {
        const selected = stage.response !== null && option.selected;
        const state = approachChallengeOptionState({ selected, accepted: stage.response !== null, reviewState: option.reviewState, resultKind: stage.result?.kind ?? null });
        const correct = state === "correct" || state === "omitted_correct";
        const label = correct ? t("Correct answer") : selected && stage.result ? t(resultTitle(stage.result.kind)) : undefined;
        return <AnswerOption key={option.id} letter={String.fromCharCode(65 + optionIndex)}
          text={option.text} state={state} disabled onPress={() => undefined} resultLabel={label}
          accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: true }}
          accessibilityLabel={`${selected ? `${t("Saved answer")}: ` : ""}${option.text}${label ? `. ${label}` : ""}`} />;
      })}
      {stage.response === null ? <Text maxFontSizeMultiplier={2} style={styles.copy}>{t("Not answered")}</Text> : null}
      <ApproachChallengeFeedback stage={stage} />
    </Card>)}
    {problem.methodReveal ? <Text maxFontSizeMultiplier={2} style={styles.copy}>{t(problem.methodReveal.title)}: {t(problem.methodReveal.description)}</Text> : null}
  </SessionShell>;
}
const createStyles = (colors: AppColors) => StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing.md }, action: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.textPrimary }, copy: { ...typography.body, color: colors.textSecondary },
});
