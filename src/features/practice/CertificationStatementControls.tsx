import { ExamStatementReview, type StatementReviewRow } from "../exam/ExamStatementReview";
import { ExamResponseControls } from "../exam/ExamResponseControls";
import type { CanonicalQuestionResponse } from "../../content/canonical";
import type { PracticeResponseRendererProps } from "./practiceResponseRendererRegistry";
import type { PracticeComplexityControl } from "./practiceSessionPresentation";
/** Certification statement rows use one dropdown each, without changing complexity exercises. */
export function CertificationStatementControls({ control, editable, itemId, interactionResponse, onInteractionResponseChange }: PracticeResponseRendererProps) {
  const review = interactionResponse as Readonly<{ statementRows?: readonly StatementReviewRow[] }> | null;
  if (!editable && review?.statementRows) return <ExamStatementReview rows={review.statementRows} />;
  const model = control.model as PracticeComplexityControl;
  const response: CanonicalQuestionResponse = { type: "decision_matrix", selectedValueIdsByDimension: Object.fromEntries(model.dimensions.filter((row) => row.selectedValues?.length).map((row) => [row.id, row.selectedValues!])) };
  return <ExamResponseControls disabled={!editable} interactionType="decision_matrix" itemId={itemId ?? "statement"} onChange={(value) => onInteractionResponseChange?.(value)} renderer={model} response={response} />;
}
