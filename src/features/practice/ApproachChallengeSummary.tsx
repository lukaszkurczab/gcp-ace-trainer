import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { ApproachChallengeDetailedHistory } from "../../application/coding-interview/approachChallengeSessionFacade";
import { Icon, SessionResultOverview } from "../../components";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { parseApproachChallengePrompt } from "./approachChallengePrompt";
import { resultTitle } from "./approachChallengePresentation";

/** A problem is a review row; outcome totals remain counts of its two saved stage answers. */
export function ApproachChallengeSummary({ detail, onBack, onReview }: Readonly<{
  detail: ApproachChallengeDetailedHistory;
  onBack: () => void;
  onReview: (approachOccurrenceId: string) => void;
}>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(false);
  const summary = detail.summary;
  const seconds = Math.floor(summary.elapsedForegroundMs / 1000);
  return <SessionResultOverview
    activeTime={`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
    answeredCount={summary.answeredCount}
    completion={detail.status === "completed" ? "completed" : "endedEarly"}
    context={{ modeLabel: t("Approach Challenge"), trackLabel: t("Coding Interview") }}
    backLabel="Activity"
    onBack={onBack}
    points={detail.status === "completed" ? summary.points ?? undefined : undefined}
    requestedCount={summary.requestedLength}
    score={summary.score}
    totalOccurrences={summary.totalOccurrences}
    unansweredCount={summary.unansweredCount}
    rootTestID={`acm-summary-${detail.sessionId}`}
    secondaryNote={{ text: t("{{count}} problems · {{status}}", { count: detail.problems.length, status: t(detail.status === "completed" ? "Completed" : "Ended early") }) }}
    review={{ expanded, onPress: () => setExpanded(value => !value), testID: `acm-summary-review-${detail.sessionId}`, content: <View>
      <Text maxFontSizeMultiplier={2} style={styles.title}>{t("Answer review")}</Text>
      {detail.problems.map((problem, index) => <Pressable
        key={problem.stages[0].occurrenceId}
        accessibilityRole="button"
        testID={`acm-summary-item-${problem.stages[0].occurrenceId}`}
        onPress={() => onReview(problem.stages[0].occurrenceId)}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.copy}>
          <Text maxFontSizeMultiplier={2} style={styles.title}>{index + 1}. {parseApproachChallengePrompt(problem.stages[0].prompt).title ?? problem.stages[0].prompt}</Text>
          {problem.stages.map(stage => <Text key={stage.occurrenceId} maxFontSizeMultiplier={2} style={styles[stage.result?.kind ?? "unanswered"]}>
            {t(stage.stage === "approach" ? "Approach" : "Complexity")}: {t(stage.result ? resultTitle(stage.result.kind) : "Unanswered")}
          </Text>)}
        </View>
        <Icon name="chevron-right" size={20} color={styles.title.color} />
      </Pressable>)}
    </View> }}
  />;
}
const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.md, minHeight: 64, paddingVertical: spacing.lg },
  copy: { flex: 1, gap: spacing.sm }, title: { ...typography.bodyStrong, color: colors.textPrimary },
  correct: { ...typography.small, color: colors.success }, partial: { ...typography.small, color: colors.warning }, incorrect: { ...typography.small, color: colors.danger }, unanswered: { ...typography.small, color: colors.textSecondary },
  pressed: { opacity: 0.7 },
});
