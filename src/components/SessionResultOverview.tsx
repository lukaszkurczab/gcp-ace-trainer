import type { ReactNode } from "react";
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type TextStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemedStyles } from "../preferences";
import { Card } from "./Card";
import { Button } from "./Button";
import { radius, spacing, typography, type AppColors } from "../theme";

export type SessionResultScore = Readonly<{
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
}>;

export type SessionResultWeightedPoints = Readonly<{
  earned: number;
  max: number;
}>;

export type SessionResultOverviewProps = Readonly<{
  activeTime: string;
  answeredCount: number;
  backTestID?: string;
  completion: "completed" | "endedEarly";
  configurationTestID?: string;
  context: Readonly<{
    modeLabel: string;
    topicLabel?: string;
    trackLabel?: string;
  }>;
  onBack: () => void;
  points?: SessionResultWeightedPoints;
  requestedCount?: number;
  review?: Readonly<{
    content?: ReactNode;
    expanded?: boolean;
    onPress: () => void;
    testID?: string;
  }>;
  rootTestID?: string;
  score: SessionResultScore | null;
  secondaryNote?: Readonly<{ testID?: string; text: string }>;
  totalOccurrences: number;
  unansweredCount: number;
}>;

/** Pure presentation for the durable result shared by every practice family. */
export function SessionResultOverview({
  activeTime,
  answeredCount,
  backTestID,
  completion,
  configurationTestID,
  context,
  onBack,
  points,
  requestedCount,
  review,
  rootTestID,
  score,
  secondaryNote,
  totalOccurrences,
  unansweredCount,
}: SessionResultOverviewProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const noAnswers = answeredCount === 0;
  const title = noAnswers ? "Session ended without answers" : completion === "endedEarly" ? "Session ended early" : "Session complete";
  const scoreStatus = noAnswers ? "No answers were submitted." : score === null ? "Score unavailable." : null;
  const visibleScore = noAnswers ? null : score;
  const showWeightedPoints = visibleScore !== null && points !== undefined && (points.earned !== visibleScore.correctCount || points.max !== totalOccurrences);

  return (
    <View style={styles.root} testID={rootTestID}>
      <View style={styles.context}>
        <ResultText selectable style={styles.mode}>{context.modeLabel}</ResultText>
        {context.trackLabel ? <ResultText selectable style={styles.contextDetail}>{t("Track")}: {context.trackLabel}</ResultText> : null}
        {context.topicLabel ? <ResultText selectable style={styles.contextDetail}>{t("Topic")}: {context.topicLabel}</ResultText> : null}
      </View>

      <View style={styles.heading}>
        <ResultText selectable style={styles.title}>{t(title)}</ResultText>
      </View>

      <Card style={styles.scoreCard}>
        <View style={styles.heroValue}>
          <ResultText selectable style={[styles.heroScore, visibleScore === null ? styles.heroScoreUnavailable : null]}>{visibleScore?.correctCount ?? "—"}</ResultText>
          <ResultText selectable style={styles.heroTotal}>/ {totalOccurrences}</ResultText>
        </View>
        <ResultText selectable style={styles.heroLabel}>{t("Correct answers")}</ResultText>
        {scoreStatus ? <ResultText selectable style={styles.status}>{t(scoreStatus)}</ResultText> : null}
      </Card>

      <View style={styles.section}>
        <ResultText style={styles.sectionLabel}>{t("Outcome distribution")}</ResultText>
        <View style={[styles.outcomeGrid, fontScale >= 1.8 ? styles.outcomeGridLarge : null]}>
          <OutcomeStat large={fontScale >= 1.8} label={t("Correct")} tone="success" value={visibleScore?.correctCount ?? null} />
          <OutcomeStat large={fontScale >= 1.8} label={t("Partial")} tone="warning" value={visibleScore?.partialCount ?? null} />
          <OutcomeStat large={fontScale >= 1.8} label={t("Incorrect")} tone="danger" value={visibleScore?.incorrectCount ?? null} />
          <OutcomeStat large={fontScale >= 1.8} label={t("Unanswered")} tone="secondary" value={unansweredCount} />
        </View>
      </View>

      <View style={styles.metrics} testID={configurationTestID}>
        <Metric label={t("Answered")} value={`${answeredCount} / ${totalOccurrences}`} />
        <Metric label={t("Active time")} value={activeTime} />
        {requestedCount !== undefined && requestedCount !== totalOccurrences ? <Metric label={t("Requested questions")} value={String(requestedCount)} /> : null}
        {showWeightedPoints ? <Metric label={t("Weighted points")} value={`${points.earned} / ${points.max}`} /> : null}
        {secondaryNote ? <ResultText selectable style={styles.note} testID={secondaryNote.testID}>{secondaryNote.text}</ResultText> : null}
      </View>

      {review ? (
        <View style={styles.reviewSection}>
          <ResultText selectable style={styles.reviewHint}>{t("Review explanations to see what to revisit.")}</ResultText>
          <Button onPress={review.onPress} testID={review.testID}>{t(review.expanded ? "Hide answer review" : "Review answers")}</Button>
          {review.expanded && review.content !== undefined ? <View style={styles.reviewContent}>{review.content}</View> : null}
        </View>
      ) : null}

      <Button onPress={onBack} testID={backTestID} variant="secondary">{t("Back to practice")}</Button>
    </View>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.metric}><ResultText selectable style={styles.metricLabel}>{label}</ResultText><ResultText selectable style={styles.metricValue}>{value}</ResultText></View>;
}

function OutcomeStat({ label, large, tone, value }: Readonly<{ label: string; large?: boolean; tone: "danger" | "secondary" | "success" | "warning"; value: number | null }>) {
  const styles = useThemedStyles(createStyles);
  const dotStyle = tone === "success" ? styles.successDot : tone === "warning" ? styles.warningDot : tone === "danger" ? styles.dangerDot : styles.secondaryDot;
  const valueStyle = tone === "success" ? styles.successValue : tone === "warning" ? styles.warningValue : tone === "danger" ? styles.dangerValue : styles.secondaryValue;
  return <View style={[styles.outcomeStat, large ? styles.outcomeStatLarge : null]}><View style={[styles.outcomeDot, dotStyle]} /><ResultText selectable style={styles.outcomeLabel}>{label}</ResultText><ResultText selectable style={[styles.outcomeValue, valueStyle]}>{value ?? "—"}</ResultText></View>;
}

function ResultText({ children, selectable = false, style, testID }: Readonly<{ children: ReactNode; selectable?: boolean; style?: StyleProp<TextStyle>; testID?: string }>) {
  const { fontScale } = useWindowDimensions();
  return <Text key={fontScale} maxFontSizeMultiplier={2} selectable={selectable} style={style} testID={testID}>{children}</Text>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  context: { gap: spacing.xs },
  contextDetail: { ...typography.caption, color: palette.textSecondary },
  dangerDot: { backgroundColor: palette.danger },
  dangerValue: { color: palette.danger },
  heading: { gap: spacing.sm },
  heroLabel: { ...typography.bodyStrong, color: palette.textSecondary },
  heroScore: { color: palette.textPrimary, fontSize: 48, fontWeight: "700", lineHeight: 56 },
  heroScoreUnavailable: { color: palette.textSecondary },
  heroTotal: { ...typography.heading, color: palette.textSecondary, paddingBottom: spacing.xs },
  heroValue: { alignItems: "baseline", flexDirection: "row", gap: spacing.sm },
  metric: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between", minHeight: 44 },
  metricLabel: { ...typography.body, color: palette.textSecondary, flexShrink: 1 },
  metricValue: { ...typography.bodyStrong, color: palette.textPrimary, flexShrink: 1, textAlign: "right" },
  metrics: { gap: spacing.xs },
  mode: { ...typography.bodyStrong, color: palette.textPrimary },
  note: { ...typography.caption, color: palette.textMuted, paddingTop: spacing.xs },
  outcomeDot: { borderRadius: radius.xs, height: 8, width: 8 },
  outcomeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  outcomeGridLarge: { flexDirection: "column" },
  outcomeLabel: { ...typography.body, color: palette.textPrimary, flex: 1, minWidth: 0 },
  outcomeStat: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexBasis: "45%", flexGrow: 1, flexDirection: "row", gap: spacing.sm, minWidth: 140, padding: spacing.md },
  outcomeStatLarge: { flexBasis: "auto", width: "100%" },
  outcomeValue: { ...typography.bodyStrong, flexShrink: 0, fontVariant: ["tabular-nums"] },
  reviewContent: { gap: spacing.lg },
  reviewHint: { ...typography.body, color: palette.textSecondary },
  reviewSection: { gap: spacing.md },
  root: { gap: spacing.xxl, width: "100%" },
  scoreCard: { borderRadius: radius.xxl, gap: spacing.sm, padding: spacing.xxl },
  secondaryDot: { backgroundColor: palette.textMuted },
  secondaryValue: { color: palette.textSecondary },
  section: { gap: spacing.md },
  sectionLabel: { ...typography.caption, color: palette.textSecondary, letterSpacing: 1, textTransform: "uppercase" },
  status: { ...typography.body, color: palette.warning },
  successDot: { backgroundColor: palette.success },
  successValue: { color: palette.success },
  title: { ...typography.title, color: palette.textPrimary },
  warningDot: { backgroundColor: palette.warning },
  warningValue: { color: palette.warning },
});
