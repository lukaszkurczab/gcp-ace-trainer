import { useListPresentationRow } from "../../infrastructure/diagnostics/listPresentationMeasurement";
import { useTranslation } from "react-i18next";
import { SectionList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { radius, spacing, typography, type AppColors } from "../../theme/tokens";
import type { ReviewQueueRow, ReviewQueueScreenModel } from "./reviewQueueModel";
import { formatReviewTaxonomyLabel } from "./reviewQueuePresentation";
import { useAppPreferences, useThemedStyles, type AppLocale } from "../../preferences/appPreferencesContext";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ListRow } from "../../components/ListRow";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { SkeletonShape, useSkeletonGlassMotion } from "../../components/SkeletonShape";

type Props = Readonly<{
  model: ReviewQueueScreenModel | null;
  visibleRows: readonly ReviewQueueRow[];
  selectedRow: ReviewQueueRow | null;
  loading: boolean;
  readError: string | null;
  hasActiveTrack: boolean;
  confirmRemoveUnavailable: boolean;
  removingUnavailable: boolean;
  onSelectRow: (id: string) => void;
  onConfirmRemoveChange: (confirm: boolean) => void;
  onRemoveUnavailable: () => void;
  onRetry: () => void;
}>;

export function MistakesReviewView({ model, visibleRows, selectedRow, loading, readError, hasActiveTrack, confirmRemoveUnavailable, removingUnavailable, onSelectRow, onConfirmRemoveChange, onRemoveUnavailable, onRetry }: Props) {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const { t } = useTranslation("common");
  const hasManualRequest = model?.dueRows.some((row) => row.status === "requested") ?? false;
  const canShowRows = !loading && !readError && hasActiveTrack && model !== null;
  const sections: { key: string; unavailable: boolean; data: readonly ReviewQueueRow[] }[] = [];
  if (canShowRows && visibleRows.length > 0) sections.push({ key: "available", unavailable: false, data: visibleRows });
  if (canShowRows && model.unavailableRows.length > 0) sections.push({ key: "unavailable", unavailable: true, data: model.unavailableRows });
  return (
    <Screen scroll={false} style={styles.virtualScreen}>
      <SectionList
        contentContainerStyle={styles.virtualContent}
        extraData={{ selectedRow, confirmRemoveUnavailable, removingUnavailable }}
        initialNumToRender={10}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(row) => row.id}
        ListHeaderComponent={<View>
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
            <Badge label={`${model.dueRows.filter((row) => row.status !== "requested").length} ${t("due")}`} tone="warning" />
            {hasManualRequest ? <Badge label={`${model.dueRows.filter((row) => row.status === "requested").length} ${t("ready now")}`} tone="primary" /> : null}
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
          actionLabel={t("Try again")}
          onActionPress={onRetry}
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

      {!loading && !readError && hasActiveTrack && model && visibleRows.length === 0 && model.unavailableRows.length === 0 ? (
        <Card>
          <EmptyState
            title={t(model.emptyTitle)}
            description={t(model.emptyDescription)}
          />
        </Card>
      ) : null}

        </View>}
        ListFooterComponent={<View>
      {selectedRow ? <ReviewQueueDetail
        confirmRemove={confirmRemoveUnavailable}
        onCancelRemove={() => onConfirmRemoveChange(false)}
        onConfirmRemove={() => { onRemoveUnavailable(); }}
        onRequestRemove={() => onConfirmRemoveChange(true)}
        removing={removingUnavailable}
        row={selectedRow}
      /> : null}
        </View>}
        maxToRenderPerBatch={10}
        renderItem={({ item: row, section }) => <ReviewPresentationRow
          detail={formatReviewTaxonomyLabel(row.taxonomyLabel, t)}
          meta={section.unavailable ? t("Unavailable") : formatDueAt(row.dueAt, locale)}
          onPress={() => { onConfirmRemoveChange(false); onSelectRow(row.id); }}
          testID={section.unavailable ? runtimeSelectors.review.unavailableRow(row.id) : undefined}
          title={row.title}
          trailing={section.unavailable ? <Badge label={t("Unavailable")} tone="neutral" /> : <View style={styles.badgeRow}><Badge label={t(formatStatus(row.status))} tone={getStatusTone(row.status)} /></View>}
        />}
        renderSectionHeader={({ section }) => <View style={styles.sectionHeader} testID={section.unavailable ? runtimeSelectors.review.unavailableSection() : undefined}>
          <SectionHeader
            title={t(section.unavailable ? "Unavailable reviews" : hasManualRequest && !model?.dueRows.some((row) => row.status === "due" || row.status === "overdue") ? "Available now" : model && model.dueRows.length > 0 ? "Due now" : "Upcoming")}
            subtitle={t(section.unavailable ? "These reviews are kept for your records but cannot become due until their content is available." : model && model.dueRows.length > 0 ? "Overdue and due items from the review queue, plus manual requests ready now." : "No due items right now. Upcoming items are listed for visibility.")}
            tight
          />
        </View>}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        testID={runtimeSelectors.review.root()}
        windowSize={5}
      />
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

function formatDueAt(value: string, locale: AppLocale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale);
}

function formatStatus(status: ReviewQueueRow["status"]): string {
  switch (status) {
    case "due":
      return "Due";
    case "overdue":
      return "Overdue";
    case "requested":
      return "Manual request";
    case "unavailable":
      return "Unavailable";
    case "upcoming":
      return "Upcoming";
  }
}

function getStatusTone(status: ReviewQueueRow["status"]): "danger" | "info" | "neutral" | "primary" | "warning" {
  switch (status) {
    case "overdue":
      return "danger";
    case "due":
      return "warning";
    case "requested":
      return "primary";
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
  virtualScreen: { gap: 0, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  virtualContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl + spacing.lg },
  rowSeparator: { height: spacing.md },
  sectionHeader: { paddingBottom: spacing.md },
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

function ReviewPresentationRow(props: Parameters<typeof ListRow>[0]) {
  useListPresentationRow();
  return <ListRow {...props} />;
}
