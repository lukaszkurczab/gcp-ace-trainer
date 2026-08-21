import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, Icon, IconTile, ProgressBar } from "../../../components";
import type { ReviewQueueEntry, TrackDisplay, TrainingAttempt } from "../../../domain";
import type { CloudCertificationProgressViewModel } from "../../../tracks";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../../tracks/certification";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { useAppPreferences, useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";
import { spacing, typography } from "../../../theme";
import { runtimeSelectors } from "../../../testing/runtimeSelectors";
import { buildProgressTabModel, type ProgressAction } from "./progressTabModel";

type ProgressTabProps = {
  activeTrack: TrackDisplay;
  analytics: AnalyticsData;
  attempts: CertificationExamSummaryViewModel[];
  cloudProgress?: CloudCertificationProgressViewModel | null;
  onChangeTrack: () => void;
  onProgressAction?: (action: ProgressAction) => void;
  practiceHistory: CertificationPracticeAnswerViewModel[];
  reviewQueueItems?: readonly ReviewQueueEntry[];
  trainingAttempts?: TrainingAttempt[];
};

/** Figma 09A-09G progress shell backed by the existing local evidence model. */
export function ProgressTab({
  activeTrack,
  analytics,
  attempts,
  cloudProgress,
  onChangeTrack,
  onProgressAction,
  practiceHistory,
  reviewQueueItems = [],
  trainingAttempts = [],
}: ProgressTabProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const model = buildProgressTabModel({ activeTrackId: activeTrack.id, analytics, attempts, cloudProgress, practiceHistory, reviewQueueItems, trainingAttempts });
  const focus = model.algorithmsProgress?.currentFocus;
  const focusTitle = focus?.title ?? model.performanceScores[0]?.label ?? activeTrack.shortTitle;
  const focusProgress = focus?.showProgress ? focus.progressPercent : model.performanceScores[0]?.percent ?? 0;
  const focusAction = model.algorithmsProgress?.priority.primaryAction ?? model.reviewAction;
  const focusActionLabel = model.algorithmsProgress ? "Open practice" : model.reviewActionLabel;
  const hasFocusEvidence = focus?.showProgress === true || model.performanceScores.length > 0;
  const weekValue = model.activitySummary.value;
  const progressRatio = focusProgress > 0 ? Math.min(1, focusProgress / 100) : weekValue > 0 ? 1 : 0;

  return (
    <View style={styles.root} testID={runtimeSelectors.progress.root()}>
      <View style={styles.header}>
        <Text maxFontSizeMultiplier={2} style={styles.screenTitle}>{t("Progress")}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("Change track")}: ${t(activeTrack.shortTitle)}`}
          onPress={onChangeTrack}
          style={({ pressed }) => [styles.trackSelector, pressed ? styles.pressed : null]}
          testID="patternly:progress:track-selector"
        >
          <Text maxFontSizeMultiplier={2} style={styles.trackSelectorText}>{t(activeTrack.shortTitle)}</Text>
          <Icon color={palette.textPrimary} name="chevron-down" size={18} />
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>{t("This week")}</Text>
      <Card style={styles.weekCard}>
        <View style={styles.weekHeader}>
          <View style={styles.weekCopy}>
            <Text maxFontSizeMultiplier={2} style={styles.weekTitle}>{t(formatWeekTitle(weekValue))}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.weekDetail}>{t(model.activitySummary.detail)}</Text>
          </View>
          <View style={styles.miniBar}>
            <View style={[styles.miniBarFill, { width: `${Math.round(progressRatio * 100)}%` }]} />
          </View>
        </View>
        {model.reviewQueueCount > 0 ? <Text style={styles.weekAction}>{t(`${model.reviewQueueCount} review items due`)}</Text> : null}
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Current focus")}</Text>
        <Card style={styles.focusCard}>
          <Text maxFontSizeMultiplier={2} style={styles.focusTitle}>{t(focusTitle)}</Text>
          {hasFocusEvidence ? (
            <Text maxFontSizeMultiplier={2} style={styles.focusPercent}>{focusProgress}%</Text>
          ) : (
            <Text maxFontSizeMultiplier={2} style={styles.focusEmpty}>{t("No evidence yet")}</Text>
          )}
          {focusAction && onProgressAction ? (
            <Button onPress={() => onProgressAction(focusAction)} variant="ghost">
              {t(focusActionLabel)}
            </Button>
          ) : null}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Needs attention")}</Text>
        {model.reviewQueueCount > 0 ? (
          <Card style={styles.attentionCard}>
            <View style={styles.attentionTitleRow}>
              <View style={styles.attentionDot} />
              <Text style={styles.attentionTitle}>{t("Review due")}</Text>
            </View>
            <Text style={styles.attentionDetail}>{t(model.reviewQueueCopy)}</Text>
            {model.reviewAction && onProgressAction ? (
              <Button onPress={() => onProgressAction(model.reviewAction!)} variant="ghost">
                {t(model.reviewActionLabel)}
              </Button>
            ) : null}
          </Card>
        ) : (
          <Card style={styles.emptyAttentionCard}>
            <Text style={styles.attentionTitle}>{t("Nothing needs attention")}</Text>
            <Text style={styles.attentionDetail}>{t("Keep practicing to build local evidence for this track.")}</Text>
          </Card>
        )}
      </View>
      {model.algorithmsProgress ? (
        <AlgorithmsEvidenceSection
          model={model.algorithmsProgress}
          onProgressAction={onProgressAction}
          showDiagnostics={showDiagnostics}
          setShowDiagnostics={setShowDiagnostics}
        />
      ) : (
        <PerformanceEvidenceSection scores={model.performanceScores} trackFamily={activeTrack.familyId} />
      )}
    </View>
  );
}

function AlgorithmsEvidenceSection({
  model,
  onProgressAction,
  setShowDiagnostics,
  showDiagnostics,
}: Readonly<{
  model: NonNullable<ReturnType<typeof buildProgressTabModel>["algorithmsProgress"]>;
  onProgressAction?: (action: ProgressAction) => void;
  setShowDiagnostics: (value: (current: boolean) => boolean) => void;
  showDiagnostics: boolean;
}>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [showAllRoadmapNodes, setShowAllRoadmapNodes] = useState(false);
  const roadmapNodes = showAllRoadmapNodes ? model.roadmapSummary.allNodes : model.roadmapSummary.nodes;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{t("Learning map")}</Text>
        <Badge label={t("Local evidence")} tone="neutral" />
      </View>
      <Card style={styles.evidenceCard}>
        {roadmapNodes.map((node) => (
          <View key={node.id} style={styles.roadmapRow} testID={runtimeSelectors.progress.node(node.id)}>
            <View style={styles.roadmapCopy}>
              <Text style={styles.roadmapTitle}>{t(node.title)}</Text>
              {node.showProgress ? <ProgressBar progress={node.progressPercent / 100} tone="primary" /> : null}
            </View>
            <Badge label={t(node.label)} tone={node.tone === "muted" ? "neutral" : node.tone} />
          </View>
        ))}
        {model.roadmapSummary.allNodes.length > model.roadmapSummary.nodes.length ? <Button onPress={() => setShowAllRoadmapNodes((current) => !current)} variant="ghost">{t(showAllRoadmapNodes ? "Show roadmap summary" : model.roadmapSummary.showAllActionLabel)}</Button> : null}
        {model.priority.primaryAction && onProgressAction ? <Button onPress={() => onProgressAction(model.priority.primaryAction)} variant="ghost">{t(model.priority.primaryActionLabel)}</Button> : null}
      </Card>
      <View style={styles.diagnosticsCard}>
        <View style={styles.diagnosticsHeader}>
          <View style={styles.diagnosticsCopy}>
            <Text style={styles.diagnosticsTitle}>{t(model.diagnostics.title)}</Text>
            <Text style={styles.diagnosticsSubtitle}>{t(model.diagnostics.subtitle)}</Text>
          </View>
          <Button onPress={() => setShowDiagnostics((current) => !current)} variant="ghost">{t(showDiagnostics ? model.diagnostics.hideActionLabel : model.diagnostics.showActionLabel)}</Button>
        </View>
        {showDiagnostics ? <View style={styles.diagnosticsDetails}>
          <Text style={styles.diagnosticsText}>{`${t("Attempt outcomes")}: ${formatDiagnosticFacts(model.diagnostics.outcomeSummary)}`}</Text>
          <Text style={styles.diagnosticsText}>{`${t("Detected mistake patterns")}: ${model.diagnostics.mistakePatterns.length ? model.diagnostics.mistakePatterns.join(" · ") : t("No repeated mistake patterns detected yet.")}`}</Text>
          <Text style={styles.diagnosticsText}>{`${t("Roadmap state")}: ${formatDiagnosticFacts(model.diagnostics.roadmapFacts)}`}</Text>
        </View> : null}
      </View>
    </View>
  );
}

function PerformanceEvidenceSection({ scores, trackFamily }: Readonly<{ scores: readonly { correct: number; detail?: string; id: string; label: string; percent: number; total: number }[]; trackFamily: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("Performance evidence")}</Text>
      {scores.length > 0 ? scores.map((score) => <Card key={score.id} style={styles.evidenceRow}><View style={styles.evidenceRowHeader}><IconTile name={trackFamily === "certification" ? "cloud" : "route"} tone="info" /><View style={styles.roadmapCopy}><Text style={styles.roadmapTitle}>{t(score.label)}</Text><Text style={styles.evidenceDetail}>{t(score.detail ?? `${score.correct}/${score.total} correct`)}</Text></View><Text style={styles.evidencePercent}>{score.percent}%</Text></View><ProgressBar progress={score.percent / 100} tone="primary" /></Card>) : <Card style={styles.emptyEvidenceCard}><Text style={styles.roadmapTitle}>{t("No evidence yet")}</Text><Text style={styles.evidenceDetail}>{t("Complete a focused session to build track-aware evidence here.")}</Text></Card>}
    </View>
  );
}

function formatDiagnosticFacts(facts: readonly { label: string; value: number | string }[]): string {
  return facts.map((fact) => `${fact.label}: ${fact.value}`).join(" · ");
}

function formatWeekTitle(value: number): string {
  if (value === 0) return "No sessions completed yet";
  return value === 1 ? "1 session completed" : `${value} sessions completed`;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  root: { gap: spacing.lg },
  header: { gap: spacing.lg },
  screenTitle: { ...typography.title, color: palette.textPrimary },
  trackSelector: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 40, paddingHorizontal: spacing.md },
  trackSelectorText: { ...typography.bodyStrong, color: palette.textSecondary },
  pressed: { opacity: 0.78 },
  sectionLabel: { ...typography.bodyStrong, color: palette.info },
  sectionTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  weekCard: { backgroundColor: palette.surface, borderColor: palette.border, gap: spacing.sm, padding: spacing.lg },
  weekHeader: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  weekCopy: { flex: 1, gap: spacing.xs },
  weekTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  weekDetail: { ...typography.small, color: palette.textSecondary },
  miniBar: { backgroundColor: palette.borderStrong, borderRadius: 2, height: 4, marginTop: spacing.xs, overflow: "hidden", width: 40 },
  miniBarFill: { backgroundColor: palette.success, borderRadius: 2, height: 4 },
  weekAction: { ...typography.small, color: palette.primary },
  section: { gap: spacing.md },
  sectionHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  focusCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 14, gap: spacing.md, padding: spacing.lg },
  focusTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  focusPercent: { color: palette.textPrimary, fontSize: 36, fontWeight: "700", lineHeight: 40 },
  focusEmpty: { ...typography.small, color: palette.textSecondary },
  attentionCard: { backgroundColor: palette.surface, borderColor: palette.border, gap: spacing.sm, padding: spacing.lg },
  emptyAttentionCard: { backgroundColor: palette.surface, borderColor: palette.border, gap: spacing.xs, padding: spacing.lg },
  attentionTitleRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  attentionDot: { backgroundColor: palette.danger, borderRadius: 4, height: 7, width: 7 },
  attentionTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  attentionDetail: { ...typography.small, color: palette.textSecondary },
  evidenceCard: { backgroundColor: palette.surface, borderColor: palette.border, gap: spacing.md, padding: spacing.lg },
  roadmapRow: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  roadmapCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  roadmapTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  diagnosticsCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: spacing.md, padding: spacing.md },
  diagnosticsHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  diagnosticsCopy: { flex: 1, gap: spacing.xs },
  diagnosticsTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  diagnosticsSubtitle: { ...typography.caption, color: palette.textMuted },
  diagnosticsDetails: { borderColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm, paddingTop: spacing.md },
  diagnosticsText: { ...typography.small, color: palette.textSecondary },
  evidenceRow: { backgroundColor: palette.surface, borderColor: palette.border, gap: spacing.sm, padding: spacing.lg },
  evidenceRowHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  evidenceDetail: { ...typography.caption, color: palette.textSecondary },
  evidencePercent: { ...typography.bodyStrong, color: palette.primary },
  emptyEvidenceCard: { backgroundColor: palette.surface, borderColor: palette.border, gap: spacing.xs, padding: spacing.lg },
});
