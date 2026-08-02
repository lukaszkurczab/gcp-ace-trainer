import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Card,
  EmptyState,
  ListRow,
  LoadingState,
  Screen,
  SectionHeader,
} from "../../components";
import { loadActiveTrackId as getActiveTrackId } from "../../application/learningReadModels";
import { spacing, typography } from "../../theme";
import {
  buildReviewQueueScreenModel,
  type ReviewQueueRow,
  type ReviewQueueScreenModel,
} from "./reviewQueueModel";
import { formatReviewTaxonomyLabel } from "./reviewQueuePresentation";
import { loadTrackReviewQueueViewModel } from "../../application/reviewQueueQueries";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";


export function MistakesReviewScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale, t } = useAppPreferences();
  const [model, setModel] = useState<ReviewQueueScreenModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadReviewQueue() {
        setLoading(true);
        setReadError(null);
        setModel(null);
        setSelectedRowId(null);

        try {
          const activeTrackId = await getActiveTrackId();
          if (!activeTrackId) { if (isActive) setLoading(false); return; }
          const viewModel = await loadTrackReviewQueueViewModel({ trackId: activeTrackId });
          const nextModel = buildReviewQueueScreenModel(viewModel);

          if (isActive) {
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
    }, []),
  );

  const visibleRows = useMemo(() => {
    if (!model) {
      return [];
    }

    return model.dueRows.length > 0 ? model.dueRows : model.upcomingRows;
  }, [model]);

  const selectedRow = visibleRows.find((row) => row.id === selectedRowId) ?? null;

  return (
    <Screen>
      <Card>
        <SectionHeader
          title={t("Review queue")}
          subtitle={model ? `${t(model.trackTitle)} — ${t("Items scheduled from your practice.")}` : t("Items scheduled from your practice.")}
        />
        {model?.warning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{model.warning}</Text>
          </View>
        ) : null}
        {model ? (
          <View style={styles.summaryRow}>
            <Badge label={`${model.totalCount} ${t("total")}`} tone="info" />
            <Badge label={`${model.dueRows.length} ${t("due")}`} tone="warning" />
            <Badge label={`${model.upcomingRows.length} ${t("upcoming")}`} tone="neutral" />
          </View>
        ) : null}
      </Card>

      {loading ? (
        <LoadingState
          title={t("Loading review queue")}
          description={t("Reading local review data for the active track.")}
        />
      ) : null}

      {!loading && readError ? (
        <EmptyState
          title={t("Review queue is unavailable")}
          description={t(readError)}
        />
      ) : null}

      {!loading && !readError && model && visibleRows.length > 0 ? (
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
              onPress={() =>
                setSelectedRowId((current) => (current === row.id ? null : row.id))
              }
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

      {!loading && !readError && model && visibleRows.length === 0 ? (
        <Card>
          <EmptyState
            title={t(model.emptyTitle)}
            description={t(model.emptyDescription)}
          />
        </Card>
      ) : null}

      {selectedRow ? <ReviewQueueDetail row={selectedRow} /> : null}
    </Screen>
  );
}

type ReviewQueueDetailProps = {
  row: ReviewQueueRow;
};

function ReviewQueueDetail({ row }: ReviewQueueDetailProps) {
  const styles = useThemedStyles(createStyles);
  const { locale, t } = useAppPreferences();
  return (
    <Card>
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
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailText}>{value}</Text>
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
