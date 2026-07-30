import type {
  PracticeStatsSummary,
  PracticeTopicDetail,
  PracticeTopicTitle,
} from "./practiceFlowModel";

type Translate = (value: string) => string;

export function formatPracticeTopicDetail(
  detail: PracticeTopicDetail,
  t: Translate,
): string {
  switch (detail.kind) {
    case "authored":
      return detail.description;
    case "algorithm-progress":
      return [
        detail.description,
        `${detail.practicedItemCount}/${detail.itemCount} ${t("practiced")}.`,
        `${t("Skills tried")}: ${detail.skillsTriedCount}/${detail.skillCount}.`,
      ].join(" ");
    case "key":
      return t(detail.key);
    case "track-context":
      return `${t(detail.key)} ${t(detail.trackTitle)}`;
  }
}

export function formatPracticeTopicTitle(
  title: PracticeTopicTitle,
  t: Translate,
): string {
  switch (title.kind) {
    case "authored":
      return title.value;
    case "translation-key":
      return t(title.key);
  }
}

export function formatPracticeStatsDetail(
  detail: PracticeStatsSummary["detail"],
  t: Translate,
): string {
  switch (detail.kind) {
    case "key":
      return t(detail.key);
    case "algorithm-outcomes":
      return [
        `${detail.correctCount} ${t("correct")}`,
        `${detail.partialCount} ${t("partial")}`,
        `${detail.incorrectCount} ${t("incorrect")}`,
      ].join(", ") + ".";
  }
}

export function formatPracticeStatsTitle(
  summary: PracticeStatsSummary,
  t: Translate,
): string {
  return `${t(summary.trackTitle)} — ${t("Stats")}`;
}
