import type { ReviewTaxonomyLabel } from "./reviewQueueModel";

type Translate = (value: string) => string;

export function formatReviewTaxonomyLabel(
  label: ReviewTaxonomyLabel,
  t: Translate,
): string {
  switch (label.kind) {
    case "translation-key":
      return t(label.value);
    case "authored":
      return label.value;
  }
}
