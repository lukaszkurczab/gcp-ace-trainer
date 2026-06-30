import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Card,
  EmptyState,
  ListRow,
  Screen,
  SectionHeader,
} from "../../components";
import { loadCloudCertificationReviewViewModel } from "../../tracks";
import { colors, spacing, typography } from "../../theme";
import {
  buildReviewQueueScreenModel,
  type ReviewQueueRow,
  type ReviewQueueScreenModel,
} from "./reviewQueueModel";

export function MistakesReviewScreen() {
  const [model, setModel] = useState<ReviewQueueScreenModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadReviewQueue() {
        setLoading(true);

        const viewModel = await loadCloudCertificationReviewViewModel();
        const nextModel = buildReviewQueueScreenModel(viewModel);

        if (isActive) {
          setModel(nextModel);
          setSelectedRowId(null);
          setLoading(false);
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
          title="Review queue"
          subtitle="Canonical Cloud Certification items scheduled from local practice."
        />
        {model?.warning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{model.warning}</Text>
          </View>
        ) : null}
        {model ? (
          <View style={styles.summaryRow}>
            <Badge label={`${model.totalCount} total`} tone="info" />
            <Badge label={`${model.dueRows.length} due`} tone="warning" />
            <Badge label={`${model.upcomingRows.length} upcoming`} tone="neutral" />
          </View>
        ) : null}
      </Card>

      {loading ? (
        <Card>
          <EmptyState
            title="Loading review queue"
            description="Reading local Cloud Certification review data."
          />
        </Card>
      ) : null}

      {!loading && model && visibleRows.length > 0 ? (
        <View style={styles.list}>
          <SectionHeader
            title={model.dueRows.length > 0 ? "Due now" : "Upcoming"}
            subtitle={
              model.dueRows.length > 0
                ? "Overdue, due, and high-priority items from the canonical queue."
                : "No due items right now. Upcoming items are listed for visibility."
            }
            tight
          />
          {visibleRows.map((row) => (
            <ListRow
              detail={row.taxonomyLabel}
              key={row.id}
              meta={formatDueAt(row.dueAt)}
              onPress={() =>
                setSelectedRowId((current) => (current === row.id ? null : row.id))
              }
              title={row.title}
              trailing={
                <View style={styles.badgeRow}>
                  <Badge label={formatStatus(row.status)} tone={getStatusTone(row.status)} />
                  {row.priority === "high" || row.priority === "urgent" ? (
                    <Badge label={formatPriority(row.priority)} tone="danger" />
                  ) : null}
                </View>
              }
            />
          ))}
        </View>
      ) : null}

      {!loading && model && visibleRows.length === 0 ? (
        <Card>
          <EmptyState
            title={model.emptyTitle}
            description={model.emptyDescription}
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
  return (
    <Card>
      <SectionHeader title="Review item" subtitle={row.taxonomyLabel} />
      <View style={styles.badgeRow}>
        <Badge label={formatStatus(row.status)} tone={getStatusTone(row.status)} />
        <Badge label={formatPriority(row.priority)} tone={getPriorityTone(row.priority)} />
      </View>
      <DetailBlock label="Prompt" value={row.promptPreview} />
      <DetailBlock label="Reasons" value={formatList(row.reasonLabels)} />
      <DetailBlock label="Mistake types" value={formatList(row.mistakeTypeLabels)} />
      <DetailBlock label="Source attempt" value={row.sourceAttemptId} />
      <DetailBlock label="Due" value={formatDueAt(row.dueAt)} />
    </Card>
  );
}

type DetailBlockProps = {
  label: string;
  value: string;
};

function DetailBlock({ label, value }: DetailBlockProps) {
  return (
    <View style={styles.detailBlock}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailText}>{value}</Text>
    </View>
  );
}

function formatList(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : "Not recorded.";
}

function formatDueAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
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

function formatPriority(priority: ReviewQueueRow["priority"]): string {
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)} priority`;
}

function getPriorityTone(priority: ReviewQueueRow["priority"]): "danger" | "info" | "neutral" | "warning" {
  switch (priority) {
    case "urgent":
    case "high":
      return "danger";
    case "normal":
      return "info";
    case "low":
      return "neutral";
  }
}

const styles = StyleSheet.create({
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
    color: colors.dark.textPrimary,
  },
  detailText: {
    ...typography.body,
    color: colors.dark.textSecondary,
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
    backgroundColor: colors.dark.warningSoft,
    borderRadius: 8,
    padding: spacing.md,
  },
  warningText: {
    ...typography.small,
    color: colors.dark.textPrimary,
  },
});
