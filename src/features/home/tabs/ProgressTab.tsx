import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { Button, Card, Icon, IconTile, ProgressBar, type IconName } from "../../../components";
import type { GoalRecord, ReviewQueueEntry, TrackDisplay, TrainingAttempt } from "../../../domain";
import type { CloudCertificationProgressViewModel } from "../../../tracks";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../../tracks/certification";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { useAppPreferences, useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";
import { radius, shadows, spacing, typography } from "../../../theme";
import { runtimeSelectors } from "../../../testing/runtimeSelectors";
import {
  buildProgressTabModel,
  type ProgressAction,
  type ProgressTabActivityItem,
} from "./progressTabModel";

type ProgressTabProps = {
  activeTrack: TrackDisplay;
  analytics: AnalyticsData;
  attempts: CertificationExamSummaryViewModel[];
  cloudProgress?: CloudCertificationProgressViewModel | null;
  goal?: GoalRecord | null;
  onChangeTrack: () => void;
  onOpenActivity?: () => void;
  onOpenGoal?: () => void;
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
  goal = null,
  onChangeTrack,
  onOpenActivity,
  onOpenGoal,
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
  const focusActionLabel = model.algorithmsProgress ? "Open Practice" : model.reviewActionLabel;
  const hasFocusEvidence = focus?.showProgress === true || model.performanceScores.length > 0;
  const algorithmEvidenceState = model.algorithmsProgress?.evidenceSummary.state;
  const compactProgressLayout = !model.hasData || (algorithmEvidenceState !== undefined && algorithmEvidenceState !== "established");
  const showNeedsAttention = !model.algorithmsProgress || algorithmEvidenceState !== "building" || model.reviewQueueCount > 0;
  const weekValue = model.activitySummary.value;
  const progressRatio = focusProgress > 0 ? Math.min(1, focusProgress / 100) : weekValue > 0 ? 1 : 0;

  return (
    <View style={styles.root} testID={runtimeSelectors.progress.root()}>
      <View style={styles.header}>
        <Text maxFontSizeMultiplier={2} style={[styles.screenTitle, compactProgressLayout ? styles.emptyProgressScreenTitle : null]}>{t("Progress")}</Text>
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

      <View style={[styles.weekSection, compactProgressLayout ? styles.emptyWeekSection : null]}>
        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{t("This week")}</Text>
        <Card style={[styles.weekCard, compactProgressLayout ? styles.emptyWeekCard : null]}>
          <View style={styles.weekHeader}>
            <View style={styles.weekCopy}>
              <Text maxFontSizeMultiplier={2} style={styles.weekTitle}>{t(formatWeekTitle(weekValue))}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.weekDetail}>{t(model.activitySummary.detail)}</Text>
            </View>
            {model.hasData ? <View style={styles.miniBar}><View style={[styles.miniBarFill, { width: `${Math.round(progressRatio * 100)}%` }]} /></View> : null}
          </View>
          {model.reviewQueueCount > 0 ? <Text maxFontSizeMultiplier={2} style={styles.weekAction}>{t(`${model.reviewQueueCount} review items due`)}</Text> : null}
          {onOpenGoal ? <Pressable accessibilityRole="button" accessibilityLabel={t(goal ? "Manage learning goal" : "Set a learning goal")} onPress={onOpenGoal} style={({ pressed }) => [styles.weekGoalAction, pressed ? styles.pressed : null]} testID={runtimeSelectors.progress.goal()}><Text maxFontSizeMultiplier={2} style={styles.weekAction}>{t(goal ? "Manage goal" : "Set a goal")}</Text></Pressable> : null}
        </Card>
      </View>

      {!model.hasData ? (
        <View style={styles.emptyProgressState}>
          <View style={styles.emptyProgressIcon}>
            <Text maxFontSizeMultiplier={2} style={styles.emptyProgressGlyph}>⫶</Text>
          </View>
          <Text maxFontSizeMultiplier={2} style={styles.emptyProgressTitle}>{t("No learning evidence yet")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.emptyProgressDescription}>{t("Complete a Practice session to begin building Progress.")}</Text>
          {model.algorithmsProgress && onProgressAction ? (
            <Button labelStyle={styles.emptyProgressActionLabel} onPress={() => onProgressAction(model.algorithmsProgress!.priority.primaryAction)} style={styles.emptyProgressAction}>
              {t("Open Practice")}
            </Button>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Current focus")}</Text>
            <Card style={styles.focusCard}>
              <Text maxFontSizeMultiplier={2} style={styles.focusTitle}>{t(focusTitle)}</Text>
              {focus && model.algorithmsProgress ? (
                <>
                  <Text maxFontSizeMultiplier={2} style={styles.focusStatus}>{t(model.algorithmsProgress.evidenceSummary.currentFocus.label)}</Text>
                  {model.algorithmsProgress.evidenceSummary.currentFocus.percent !== undefined ? (
                    <>
                      <Text maxFontSizeMultiplier={2} style={styles.focusPercent}>{`${model.algorithmsProgress.evidenceSummary.currentFocus.percent}%`}</Text>
                      <Text maxFontSizeMultiplier={2} style={styles.focusEvidenceDetail}>{t(model.algorithmsProgress.evidenceSummary.currentFocus.detail)}</Text>
                    </>
                  ) : (
                    <Text maxFontSizeMultiplier={2} style={styles.focusEvidenceDetail}>{t(model.algorithmsProgress.evidenceSummary.currentFocus.detail)}</Text>
                  )}
                </>
              ) : focus ? (
                <>
                  <Text maxFontSizeMultiplier={2} style={styles.focusStatus}>{t(focus.statusLabel)}</Text>
                  <Text maxFontSizeMultiplier={2} style={styles.focusEvidenceDetail}>{`${t("Items practiced")}: ${focus.practicedLabel}`}</Text>
                </>
              ) : hasFocusEvidence ? (
                <Text maxFontSizeMultiplier={2} style={styles.focusPercent}>{focusProgress}%</Text>
              ) : (
                <Text maxFontSizeMultiplier={2} style={styles.focusEmpty}>{t("No evidence yet")}</Text>
              )}
              {focusAction && onProgressAction ? (
                <Button labelStyle={styles.focusActionLabel} onPress={() => onProgressAction(focusAction)} variant="ghost">
                  {t(focusActionLabel)}
                </Button>
              ) : null}
            </Card>
          </View>

          {model.algorithmsProgress?.evidenceSummary.state === "building" ? (
            <Card style={styles.evidenceBuildingCard}>
              <Text maxFontSizeMultiplier={2} style={styles.evidenceBuildingTitle}>{t("Evidence is building")}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.evidenceBuildingDetail}>{t(model.algorithmsProgress.evidenceSummary.buildingCopy ?? "More practice is needed before recurring patterns can be identified.")}</Text>
            </Card>
          ) : null}

          {showNeedsAttention ? <View style={styles.section}>
              <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Needs attention")}</Text>
              {model.reviewQueueCount > 0 ? (
                <Card style={styles.attentionCard}>
                  <View style={styles.attentionTitleRow}>
                    <View style={styles.attentionDot} />
                    <Text maxFontSizeMultiplier={2} style={styles.attentionTitle}>{t("Review due")}</Text>
                  </View>
                  <Text maxFontSizeMultiplier={2} style={styles.attentionDetail}>{t(model.reviewQueueCopy)}</Text>
                  {model.reviewAction && onProgressAction ? (
                    <Button labelStyle={styles.attentionActionLabel} onPress={() => onProgressAction(model.reviewAction!)} variant="ghost">
                      {t(model.reviewActionLabel)}
                    </Button>
                  ) : null}
                </Card>
              ) : (
                <Card style={styles.emptyAttentionCard}>
                  <Text maxFontSizeMultiplier={2} style={styles.attentionTitle}>{t("Nothing needs attention")}</Text>
                  <Text maxFontSizeMultiplier={2} style={styles.attentionDetail}>{t("Keep practicing to build local evidence for this track.")}</Text>
                </Card>
              )}
            </View> : null}

          {model.algorithmsProgress ? (
            <AlgorithmsEvidenceSection
              activity={model.activity}
              model={model.algorithmsProgress}
              onOpenActivity={onOpenActivity}
              onProgressAction={onProgressAction}
              trackFamily={activeTrack.familyId}
              showDiagnostics={showDiagnostics}
              setShowDiagnostics={setShowDiagnostics}
            />
          ) : (
            <>
              <ActivitySection items={model.activity} onOpenActivity={onOpenActivity} trackFamily={activeTrack.familyId} />
              <PerformanceEvidenceSection scores={model.performanceScores} trackFamily={activeTrack.familyId} />
            </>
          )}
        </>
      )}
    </View>
  );
}

function ActivitySection({ items, onOpenActivity, trackFamily }: Readonly<{ items: readonly ProgressTabActivityItem[]; onOpenActivity?: () => void; trackFamily: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const groups = ["Today", "Yesterday", "This week", "Earlier"] as const;
  return (
    <View style={styles.section} testID={runtimeSelectors.progress.activitySection()}>
      <View style={styles.sectionHeading}>
        <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Recent activity")}</Text>
        {onOpenActivity ? (
          <Pressable accessibilityRole="button" onPress={onOpenActivity} style={({ pressed }) => [pressed ? styles.pressed : null]} testID={runtimeSelectors.progress.activity()}>
            <Text maxFontSizeMultiplier={2} style={styles.activityLink}>{t("View activity")}</Text>
          </Pressable>
        ) : null}
      </View>
      {items.length > 0 ? groups.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;
        return (
          <View key={group} style={styles.activityGroup}>
            <Text maxFontSizeMultiplier={2} style={styles.activityGroupLabel}>{t(group)}</Text>
            <View style={styles.activityRows}>
              {groupItems.map((item, index) => (
                <View key={item.id} style={[styles.activityRow, index === groupItems.length - 1 ? styles.activityRowLast : null]}>
                  <IconTile iconSize={20} name={activityIcon(item.modeId, trackFamily)} size={36} tone={activityTone(item.outcome)} />
                  <View style={styles.activityCopy}>
                    <Text maxFontSizeMultiplier={2} style={styles.activityTitle}>{t(item.title)}</Text>
                    <Text maxFontSizeMultiplier={2} style={styles.activityDetail}>{`${t("Answered")} · ${t(item.detail)} · ${item.time}`}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }) : (
        <Card style={styles.emptyActivityCard}>
          <Text maxFontSizeMultiplier={2} style={styles.activityTitle}>{t("No activity yet")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.activityDetail}>{t("Complete a practice item to see local activity here.")}</Text>
        </Card>
      )}
    </View>
  );
}

function activityIcon(modeId: string, trackFamily: string): IconName {
  if (trackFamily === "certification" || modeId.startsWith("certification-")) return "cloud";
  if (trackFamily === "design_interview" || modeId.startsWith("design-interview-")) return "book-open";
  return "route";
}

function activityTone(outcome: ProgressTabActivityItem["outcome"]): "danger" | "success" | "warning" {
  if (outcome === "correct") return "success";
  if (outcome === "incorrect") return "danger";
  return "warning";
}

function AlgorithmsEvidenceSection({
  activity,
  model,
  onOpenActivity,
  onProgressAction,
  setShowDiagnostics,
  showDiagnostics,
  trackFamily,
}: Readonly<{
  activity: readonly ProgressTabActivityItem[];
  model: NonNullable<ReturnType<typeof buildProgressTabModel>["algorithmsProgress"]>;
  onOpenActivity?: () => void;
  onProgressAction?: (action: ProgressAction) => void;
  setShowDiagnostics: (value: (current: boolean) => boolean) => void;
  showDiagnostics: boolean;
  trackFamily: string;
}>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [showAllTrackNodes, setShowAllTrackNodes] = useState(false);
  const trackNodes = showAllTrackNodes ? model.trackNodes : model.trackNodes.slice(0, 4);
  return (
    <View style={styles.section}>
      <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Effectiveness trend")}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.trendCopy}>{t(model.effectivenessTrend.copy)}</Text>
      {model.effectivenessTrend.available ? <TrendChart points={model.effectivenessTrend.points} /> : null}

      <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Across this track")}</Text>
      <View style={styles.trackEvidenceCard}>
        {trackNodes.map((node, index) => (
          <View key={node.id} style={[styles.trackEvidenceRow, index === trackNodes.length - 1 ? styles.trackEvidenceRowLast : null]} testID={runtimeSelectors.progress.node(node.id)}>
            <View style={styles.trackEvidenceCopy}>
              <Text maxFontSizeMultiplier={2} style={styles.trackEvidenceTitle}>{t(node.title)}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.trackEvidenceDetail}>{t(node.detail)}</Text>
            </View>
            <Text maxFontSizeMultiplier={2} style={styles.trackEvidenceChevron}>›</Text>
          </View>
        ))}
      </View>
      {model.trackNodes.length > trackNodes.length ? <Button onPress={() => setShowAllTrackNodes((current) => !current)} variant="ghost">{t(showAllTrackNodes ? "Show fewer track areas" : "View all track evidence")}</Button> : null}

      <ActivitySection items={activity} onOpenActivity={onOpenActivity} trackFamily={trackFamily} />

      <View style={styles.diagnosticsCard}>
        <View style={styles.diagnosticsHeader}>
          <View style={styles.diagnosticsCopy}>
            <Text maxFontSizeMultiplier={2} style={styles.diagnosticsTitle}>{t(model.diagnostics.title)}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.diagnosticsSubtitle}>{t(model.diagnostics.subtitle)}</Text>
          </View>
          <Button onPress={() => setShowDiagnostics((current) => !current)} variant="ghost">{t(showDiagnostics ? model.diagnostics.hideActionLabel : model.diagnostics.showActionLabel)}</Button>
        </View>
        {showDiagnostics ? <View style={styles.diagnosticsDetails}>
          <Text maxFontSizeMultiplier={2} style={styles.diagnosticsText}>{`${t("Attempt outcomes")}: ${formatDiagnosticFacts(model.diagnostics.outcomeSummary)}`}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.diagnosticsText}>{`${t("Detected mistake patterns")}: ${model.diagnostics.mistakePatterns.length ? model.diagnostics.mistakePatterns.join(" · ") : t("No repeated mistake patterns detected yet.")}`}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.diagnosticsText}>{`${t("Roadmap state")}: ${formatDiagnosticFacts(model.diagnostics.roadmapFacts)}`}</Text>
        </View> : null}
      </View>
    </View>
  );
}

function TrendChart({ points }: Readonly<{
  points: readonly number[];
}>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return (
    <View accessible accessibilityLabel={`Effectiveness trend: ${points.join(", ")} percent`} style={styles.trendChart}>
          <View style={styles.trendReferenceLineTop} />
          <View style={styles.trendReferenceLineMiddle} />
          <Svg height={130} viewBox="0 0 290 130" width="100%">
            <Polyline fill="none" points={formatTrendPoints(points)} stroke="#1e293b" strokeWidth={2} />
            {points.map((point, index) => {
              const coordinate = trendPointCoordinate(point, index, points.length);
              return <Circle key={`${point}-${index}`} cx={coordinate.x} cy={coordinate.y} fill="#34b564" r={3} />;
            })}
          </Svg>
          <View style={styles.trendAxisLabels}>
            <Text maxFontSizeMultiplier={2} style={styles.trendAxisLabel}>{t("Earlier")}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.trendAxisLabel}>{t("Recent")}</Text>
          </View>
    </View>
  );
}

function formatTrendPoints(points: readonly number[]): string {
  return points.map((point, index) => {
    const coordinate = trendPointCoordinate(point, index, points.length);
    return `${coordinate.x},${coordinate.y}`;
  }).join(" ");
}

function trendPointCoordinate(value: number, index: number, count: number): { x: number; y: number } {
  const x = count <= 1 ? 145 : 8 + (index * 274) / (count - 1);
  const y = 112 - (Math.max(0, Math.min(100, value)) * 88) / 100;
  return { x, y };
}

function PerformanceEvidenceSection({ scores, trackFamily }: Readonly<{ scores: readonly { correct: number; detail?: string; id: string; label: string; percent: number; total: number }[]; trackFamily: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return (
    <View style={styles.section}>
      <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Performance evidence")}</Text>
      {scores.length > 0 ? scores.map((score) => <Card key={score.id} style={styles.evidenceRow}><View style={styles.evidenceRowHeader}><IconTile name={trackFamily === "certification" ? "cloud" : "route"} tone="info" /><View style={styles.roadmapCopy}><Text maxFontSizeMultiplier={2} style={styles.roadmapTitle}>{t(score.label)}</Text><Text maxFontSizeMultiplier={2} style={styles.evidenceDetail}>{t(score.detail ?? `${score.correct}/${score.total} correct`)}</Text></View><Text maxFontSizeMultiplier={2} style={styles.evidencePercent}>{score.percent}%</Text></View><ProgressBar progress={score.percent / 100} tone="primary" /></Card>) : <Card style={styles.emptyEvidenceCard}><Text maxFontSizeMultiplier={2} style={styles.roadmapTitle}>{t("No evidence yet")}</Text><Text maxFontSizeMultiplier={2} style={styles.evidenceDetail}>{t("Complete a focused session to build track-aware evidence here.")}</Text></Card>}
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
  root: { gap: 28 },
  header: { gap: 28 },
  screenTitle: { color: palette.textPrimary, fontSize: 30, fontWeight: "600", letterSpacing: -0.4, lineHeight: 36 },
  trackSelector: { alignItems: "center", backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 40, paddingHorizontal: 14 },
  trackSelectorText: { ...typography.bodyStrong, color: palette.textSecondary },
  pressed: { opacity: 0.78 },
  sectionLabel: { color: palette.primary, fontSize: 12, fontWeight: "600", lineHeight: 19 },
  weekSection: { gap: 10 },
  emptyProgressScreenTitle: { fontSize: 24, fontWeight: "700", lineHeight: 29 },
  emptyWeekSection: { gap: 8 },
  emptyProgressState: { alignItems: "center", gap: 16, paddingBottom: 40, paddingHorizontal: spacing.lg, paddingTop: 40 },
  emptyProgressIcon: { alignItems: "center", backgroundColor: palette.surface, borderRadius: 20, height: 48, justifyContent: "center", width: 48 },
  emptyProgressGlyph: { color: palette.info, fontSize: 24, lineHeight: 29 },
  emptyProgressTitle: { color: palette.textPrimary, fontSize: 16, fontWeight: "600", lineHeight: 20, textAlign: "center" },
  emptyProgressDescription: { color: palette.textSecondary, fontSize: 14, lineHeight: 20, maxWidth: 280, textAlign: "center" },
  emptyProgressAction: { backgroundColor: palette.success, borderColor: palette.success, borderRadius: radius.xxl, minWidth: 0, paddingHorizontal: 24, paddingVertical: 12 },
  emptyProgressActionLabel: { color: palette.textPrimary, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  sectionTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  activityGroup: { gap: spacing.xs },
  activityGroupLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, lineHeight: 13, textTransform: "uppercase" },
  activityRows: { backgroundColor: palette.surface, borderRadius: 14, overflow: "hidden" },
  activityRow: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  activityRowLast: { borderBottomWidth: 0 },
  activityCopy: { flex: 1, gap: spacing.xxs, minWidth: 0 },
  activityTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "500", lineHeight: 18 },
  activityDetail: { color: palette.textSecondary, fontSize: 12, fontWeight: "400", lineHeight: 18 },
  emptyActivityCard: { backgroundColor: palette.surface, borderColor: "transparent", borderRadius: 14, borderWidth: 0, gap: spacing.xs, padding: spacing.lg },
  weekCard: { ...shadows.none, backgroundColor: palette.surface, borderColor: "transparent", borderRadius: 14, borderWidth: 0, gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  emptyWeekCard: { gap: 4, paddingHorizontal: 14, paddingVertical: 12 },
  weekHeader: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  weekCopy: { flex: 1, gap: spacing.xs },
  weekTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "500", lineHeight: 18 },
  weekDetail: { color: palette.textSecondary, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  miniBar: { backgroundColor: palette.surface, borderRadius: 2, height: 4, marginTop: spacing.xs, overflow: "hidden", width: 44 },
  miniBarFill: { backgroundColor: palette.success, borderRadius: 2, height: 4 },
  weekAction: { color: palette.primary, fontSize: 12, fontWeight: "500", lineHeight: 18 },
  weekGoalAction: { alignSelf: "flex-start", minHeight: 32, justifyContent: "center" },
  section: { gap: 10 },
  sectionHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  activityLink: { color: palette.primary, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  focusCard: { ...shadows.none, backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 14, gap: spacing.md, padding: spacing.lg },
  focusTitle: { color: palette.textPrimary, fontSize: 16, fontWeight: "600", lineHeight: 20 },
  focusStatus: { color: palette.textSecondary, fontSize: 12, fontWeight: "500", lineHeight: 18 },
  focusEvidenceDetail: { color: palette.primary, fontSize: 13, lineHeight: 18 },
  focusPercent: { color: palette.textPrimary, fontSize: 36, fontWeight: "700", lineHeight: 40 },
  focusEmpty: { ...typography.small, color: palette.textSecondary },
  focusActionLabel: { color: palette.primary, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  evidenceBuildingCard: { ...shadows.none, backgroundColor: palette.surface, borderColor: "transparent", borderRadius: 14, borderWidth: 0, gap: 6, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  evidenceBuildingTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "500", lineHeight: 18 },
  evidenceBuildingDetail: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
  attentionCard: { ...shadows.none, backgroundColor: palette.surface, borderColor: "transparent", borderRadius: 14, borderWidth: 0, gap: 6, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  emptyAttentionCard: { ...shadows.none, backgroundColor: palette.surface, borderColor: "transparent", borderRadius: 14, borderWidth: 0, gap: 6, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  attentionTitleRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  attentionDot: { backgroundColor: palette.danger, borderRadius: 3, height: 6, width: 6 },
  attentionTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  attentionDetail: { color: palette.textSecondary, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  attentionActionLabel: { color: palette.primary, fontSize: 13, lineHeight: 18 },
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
  trackEvidenceCard: { backgroundColor: palette.surface, borderRadius: 14, overflow: "hidden" },
  trackEvidenceRow: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.sm, minHeight: 72, paddingHorizontal: 14, paddingVertical: 12 },
  trackEvidenceRowLast: { borderBottomWidth: 0 },
  trackEvidenceCopy: { flex: 1, gap: 4, minWidth: 0 },
  trackEvidenceTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "500", lineHeight: 18 },
  trackEvidenceDetail: { color: palette.textSecondary, fontSize: 12, lineHeight: 18 },
  trackEvidenceChevron: { color: palette.primary, fontSize: 28, lineHeight: 34 },
  trendCopy: { color: palette.primary, fontSize: 13, lineHeight: 18 },
  trendChart: { backgroundColor: palette.surface, borderRadius: 12, minHeight: 130, overflow: "hidden", paddingHorizontal: 16, paddingTop: 8 },
  trendReferenceLineTop: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, left: 40, position: "absolute", right: 16, top: 42 },
  trendReferenceLineMiddle: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, left: 40, position: "absolute", right: 16, top: 86 },
  trendAxisLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 8 },
  trendAxisLabel: { color: palette.primary, fontSize: 10, lineHeight: 12 },
  evidenceRow: { backgroundColor: palette.surface, borderColor: palette.border, gap: spacing.sm, padding: spacing.lg },
  evidenceRowHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  evidenceDetail: { ...typography.caption, color: palette.textSecondary },
  evidencePercent: { ...typography.bodyStrong, color: palette.primary },
  emptyEvidenceCard: { backgroundColor: palette.surface, borderColor: palette.border, gap: spacing.xs, padding: spacing.lg },
});
