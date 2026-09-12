import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListRow,
  Screen,
  SectionHeader,
  SkeletonShape,
  useSkeletonGlassMotion,
} from "../../components";
import { loadActiveTrackId as getActiveTrackId } from "../../application/learningReadModels";
import { radius, spacing, typography } from "../../theme";
import {
  buildReviewQueueScreenModel,
  type ReviewQueueRow,
  type ReviewQueueScreenModel,
} from "./reviewQueueModel";
import { formatReviewTaxonomyLabel } from "./reviewQueuePresentation";
import { loadTrackReviewQueueViewModel, removeUnavailableReview } from "../../application/reviewQueueQueries";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";


export function MistakesReviewScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const { t } = useTranslation("common");
  const [model, setModel] = useState<ReviewQueueScreenModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [hasActiveTrack, setHasActiveTrack] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [refreshRevision, setRefreshRevision] = useState(0);
  const [confirmRemoveUnavailable, setConfirmRemoveUnavailable] = useState(false);
  const [removingUnavailable, setRemovingUnavailable] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadReviewQueue() {
        setLoading(true);
        setReadError(null);
        setModel(null);
        setSelectedRowId(null);
        setConfirmRemoveUnavailable(false);
        setHasActiveTrack(false);

        try {
          const activeTrackId = await getActiveTrackId();
          if (!activeTrackId) {
            if (isActive) {
              setHasActiveTrack(false);
              setLoading(false);
            }
            return;
          }
          const viewModel = await loadTrackReviewQueueViewModel({ trackId: activeTrackId });
          const nextModel = buildReviewQueueScreenModel(viewModel);

          if (isActive) {
            setHasActiveTrack(true);
            setModel(nextModel);
            setLoading(false);
          }
        } catch (error) {
          if (isActive) {
            setReadError(describeOperationalFailure(error, "Review queue data is unavailable."));
            setLoading(false);
          }
        }
      }

      void loadReviewQueue();

      return () => {
        isActive = false;
      };
    }, [refreshRevision]),
  );

  const visibleRows = useMemo(() => {
    if (!model) {
      return [];
    }

    return model.dueRows.length > 0 ? model.dueRows : model.upcomingRows;
  }, [model]);

  const selectedRow = [...visibleRows, ...(model?.unavailableRows ?? [])].find((row) => row.id === selectedRowId) ?? null;

  const removeSelectedUnavailable = async () => {
    if (!selectedRow || selectedRow.kind !== "unavailable" || removingUnavailable) return;
    setRemovingUnavailable(true);
    try {
      await removeUnavailableReview(selectedRow.id);
      setSelectedRowId(null);
      setConfirmRemoveUnavailable(false);
      setRefreshRevision((revision) => revision + 1);
    } catch (error) {
      setReadError(describeOperationalFailure(error, "Unavailable review could not be removed."));
    } finally {
      setRemovingUnavailable(false);
    }
  };

  return (
    <Screen>
      <View testID={runtimeSelectors.review.root()}>
      <Card>
        <SectionHeader
          title={t("Review queue")}
          subtitle={model ? `${t(model.trackTitle)} — ${t("Items scheduled from your practice.")}` : t("Items scheduled from your practice.")}
        />
        {model?.warning ? (
          <View style={styles.warningBanner}>
            <Text maxFontSizeMultiplier={2} style={styles.warningText}>{model.warning}</Text>
          </View>
        ) : null}
        {model ? (
          <View style={styles.summaryRow}>
            <Badge label={`${model.totalCount} ${t("total")}`} tone="info" />
            <Badge label={`${model.dueRows.length} ${t("due")}`} tone="warning" />
            <Badge label={`${model.upcomingRows.length} ${t("upcoming")}`} tone="neutral" />
            {model.unavailableRows.length > 0 ? <Badge label={`${model.unavailableRows.length} ${t("unavailable")}`} tone="neutral" /> : null}
          </View>
        ) : null}
      </Card>

      {loading ? (
        <MistakesLoadingSkeleton />
      ) : null}

      {!loading && readError ? (
        <EmptyState
          title={t("Review queue is unavailable")}
          description={t(readError)}
        />
      ) : null}

      {!loading && !readError && !hasActiveTrack ? (
        <EmptyState
          title={t("Choose a track first")}
          description={t("Select a track before opening review.")}
        />
      ) : null}

      {!loading && !readError && hasActiveTrack && model && visibleRows.length > 0 ? (
        <View style={styles.list}>
          <SectionHeader
            title={t(model.dueRows.length > 0 ? "Due now" : "Upcoming")}
            subtitle={
              model.dueRows.length > 0
                ? t("Overdue and due items from the review queue.")
                : t("No due items right now. Upcoming items are listed for visibility.")
            }
            tight
          />
          {visibleRows.map((row) => (
            <ListRow
              detail={formatReviewTaxonomyLabel(row.taxonomyLabel, t)}
              key={row.id}
              meta={formatDueAt(row.dueAt, locale)}
              onPress={() => {
                setConfirmRemoveUnavailable(false);
                setSelectedRowId((current) => (current === row.id ? null : row.id));
              }}
              title={row.title}
              trailing={
                <View style={styles.badgeRow}>
                  <Badge label={t(formatStatus(row.status))} tone={getStatusTone(row.status)} />
                </View>
              }
            />
          ))}
        </View>
      ) : null}

      {!loading && !readError && hasActiveTrack && model && model.unavailableRows.length > 0 ? (
        <View style={styles.list} testID={runtimeSelectors.review.unavailableSection()}>
          <SectionHeader
            title={t("Unavailable reviews")}
            subtitle={t("These reviews are kept for your records but cannot become due until their content is available.")}
            tight
          />
          {model.unavailableRows.map((row) => (
            <ListRow
              detail={formatReviewTaxonomyLabel(row.taxonomyLabel, t)}
              key={row.id}
              meta={t("Unavailable")}
              onPress={() => {
                setConfirmRemoveUnavailable(false);
                setSelectedRowId((current) => current === row.id ? null : row.id);
              }}
              testID={runtimeSelectors.review.unavailableRow(row.id)}
              title={row.title}
              trailing={<Badge label={t("Unavailable")} tone="neutral" />}
            />
          ))}
        </View>
      ) : null}

      {!loading && !readError && hasActiveTrack && model && visibleRows.length === 0 && model.unavailableRows.length === 0 ? (
        <Card>
          <EmptyState
            title={t(model.emptyTitle)}
            description={t(model.emptyDescription)}
          />
        </Card>
      ) : null}

      {selectedRow ? <ReviewQueueDetail
        confirmRemove={confirmRemoveUnavailable}
        onCancelRemove={() => setConfirmRemoveUnavailable(false)}
        onConfirmRemove={() => { void removeSelectedUnavailable(); }}
        onRequestRemove={() => setConfirmRemoveUnavailable(true)}
        removing={removingUnavailable}
        row={selectedRow}
      /> : null}
      </View>
    </Screen>
  );
}

export function MistakesLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={t("Loading review queue")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.mistakesLoading}
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.mistakesLoadingShapes}>
        <View style={styles.mistakesLoadingSection}>
          <SkeletonShape motion={motion} style={[styles.mistakesLoadingLine, styles.mistakesLoadingSectionTitle, { height: 18 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.mistakesLoadingLine, styles.mistakesLoadingSectionSubtitle, { height: 14 * textScale }]} />
        </View>
        {[0, 1, 2].map((row) => (
          <View key={row} style={styles.mistakesLoadingRow}>
            <View style={styles.mistakesLoadingCopy}>
              <SkeletonShape motion={motion} style={[styles.mistakesLoadingLine, styles.mistakesLoadingTitle, { height: 16 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.mistakesLoadingLine, row === 1 ? styles.mistakesLoadingDetailShort : styles.mistakesLoadingDetail, { height: 13 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.mistakesLoadingLine, styles.mistakesLoadingMeta, { height: 12 * textScale }]} />
            </View>
            <SkeletonShape motion={motion} style={[styles.mistakesLoadingBadge, { height: 24 * textScale }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

type ReviewQueueDetailProps = {
  confirmRemove: boolean;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
  onRequestRemove: () => void;
  removing: boolean;
  row: ReviewQueueRow;
};

function ReviewQueueDetail({ confirmRemove, onCancelRemove, onConfirmRemove, onRequestRemove, removing, row }: ReviewQueueDetailProps) {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const { t } = useTranslation("common");
  return (
    <Card testID={row.kind === "unavailable" ? runtimeSelectors.review.unavailableDetails(row.id) : undefined}>
      <SectionHeader
        title={t("Review item")}
        subtitle={formatReviewTaxonomyLabel(row.taxonomyLabel, t)}
      />
      <View style={styles.badgeRow}>
        <Badge label={t(formatStatus(row.status))} tone={getStatusTone(row.status)} />
      </View>
      <DetailBlock label={t("Prompt")} value={row.promptPreview} />
      <DetailBlock label={t("Reasons")} value={formatList(row.reasonLabels, t)} />
      <DetailBlock label={t("Mistake types")} value={formatList(row.mistakeTypeLabels, t)} />
      <DetailBlock label={t("Source attempt")} value={row.sourceAttemptId} />
      <DetailBlock label={t("Due")} value={formatDueAt(row.dueAt, locale)} />
      {row.kind === "unavailable" ? confirmRemove
        ? <View style={styles.removeActions}>
            <Text maxFontSizeMultiplier={2} style={styles.warningText}>{t("Remove this unavailable review from this device? Other unavailable reviews will remain.")}</Text>
            <Button onPress={onCancelRemove} testID={runtimeSelectors.review.removeUnavailableCancel(row.id)} variant="secondary">{t("Cancel")}</Button>
            <Button loading={removing} onPress={onConfirmRemove} testID={runtimeSelectors.review.removeUnavailableConfirm(row.id)} variant="destructive">{t("Remove unavailable review")}</Button>
          </View>
        : <Button onPress={onRequestRemove} testID={runtimeSelectors.review.removeUnavailable(row.id)} variant="secondary">{t("Remove unavailable review")}</Button> : null}
    </Card>
  );
}

type DetailBlockProps = {
  label: string;
  value: string;
};

function DetailBlock({ label, value }: DetailBlockProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.detailBlock}>
      <Text maxFontSizeMultiplier={2} style={styles.detailLabel}>{label}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.detailText}>{value}</Text>
    </View>
  );
}

function formatList(values: readonly string[], t: (value: string) => string): string {
  return values.length > 0 ? values.map(t).join(", ") : t("Not recorded.");
}

function formatDueAt(value: string, locale: "en" | "pl"): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale === "pl" ? "pl-PL" : "en-US");
}

function formatStatus(status: ReviewQueueRow["status"]): string {
  switch (status) {
    case "due":
      return "Due";
    case "overdue":
      return "Overdue";
    case "unavailable":
      return "Unavailable";
    case "upcoming":
      return "Upcoming";
  }
}

function getStatusTone(status: ReviewQueueRow["status"]): "danger" | "info" | "neutral" | "warning" {
  switch (status) {
    case "overdue":
      return "danger";
    case "due":
      return "warning";
    case "unavailable":
      return "neutral";
    case "upcoming":
      return "info";
  }
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  mistakesLoading: { gap: spacing.md, width: "100%" },
  mistakesLoadingShapes: { gap: spacing.md, width: "100%" },
  mistakesLoadingSection: { gap: spacing.xs },
  mistakesLoadingLine: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill },
  mistakesLoadingSectionTitle: { width: "28%" },
  mistakesLoadingSectionSubtitle: { width: "84%" },
  mistakesLoadingRow: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.md, minHeight: 72, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  mistakesLoadingCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  mistakesLoadingTitle: { width: "72%" },
  mistakesLoadingDetail: { width: "84%" },
  mistakesLoadingDetailShort: { width: "58%" },
  mistakesLoadingMeta: { width: "48%" },
  mistakesLoadingBadge: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill, width: "19%" },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  detailBlock: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  detailText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  removeActions: {
    gap: spacing.sm,
  },
  warningBanner: {
    backgroundColor: palette.warningSoft,
    borderRadius: 8,
    padding: spacing.md,
  },
  warningText: {
    ...typography.small,
    color: palette.textPrimary,
  },
});
