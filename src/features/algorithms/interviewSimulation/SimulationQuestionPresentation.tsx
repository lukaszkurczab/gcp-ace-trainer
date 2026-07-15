import { useRef } from "react";

import { SimulationPersistenceErrorPanel } from "./components";
import { ChoiceQuestionRenderer, ComplexityQuestionRenderer, OrderingQuestionRenderer } from "./renderers";
import { composeChoiceDraft, composeComplexityDraft, moveOrderingDraft } from "./model";

type Props = Readonly<{
  disabled: boolean;
  onSave: (response: unknown | null) => void;
  optionOrder: readonly string[];
  question: any;
  response: any;
}>;

/** One active-shell renderer. It composes response intent but has no durability or scoring ownership. */
export function SimulationQuestionPresentation({ disabled, onSave, optionOrder, question, response }: Props) {
  const latestResponse = useRef<any>(response);
  latestResponse.current = response;
  if ("options" in question) {
    const options = [...question.options].sort((left, right) => optionOrder.indexOf(left.id) - optionOrder.indexOf(right.id));
    const current = response?.kind === "choice" ? response : null;
    const multiple = question.instruction?.toLowerCase().includes("select all") === true || question.type === "test_case_selection";
    return <ChoiceQuestionRenderer disabled={disabled} multiple={multiple} onChange={(optionId) => {
      const next = composeChoiceDraft(latestResponse.current?.kind === "choice" ? latestResponse.current : null, optionId, multiple);
      latestResponse.current = next;
      onSave(next);
    }} options={options.map((option: any, index: number) => ({ id: option.id, label: String.fromCharCode(65 + index), text: option.text }))} selectedOptionIds={current?.selectedOptionIds ?? []} />;
  }
  if ("subgoals" in question) {
    const orderedSubgoalIds = response?.kind === "ordering" ? response.orderedSubgoalIds : question.subgoals.map((step: any) => step.id);
    const steps = orderedSubgoalIds.map((id: string) => question.subgoals.find((step: any) => step.id === id)).filter(Boolean);
    return <OrderingQuestionRenderer disabled={disabled} onMoveDown={(id) => {
      const latest = latestResponse.current?.kind === "ordering" ? latestResponse.current.orderedSubgoalIds : orderedSubgoalIds;
      const next = moveOrderingDraft(latest, id, 1);
      latestResponse.current = next;
      onSave(next);
    }} onMoveUp={(id) => {
      const latest = latestResponse.current?.kind === "ordering" ? latestResponse.current.orderedSubgoalIds : orderedSubgoalIds;
      const next = moveOrderingDraft(latest, id, -1);
      latestResponse.current = next;
      onSave(next);
    }} onReset={() => {
      const next = { kind: "ordering" as const, orderedSubgoalIds: question.subgoals.map((step: any) => step.id) };
      latestResponse.current = next;
      onSave(next);
    }} steps={steps} />;
  }
  if ("correctComplexity" in question) {
    const current = response?.kind === "complexity" ? response : null;
    return <ComplexityQuestionRenderer dimensions={question.correctComplexity.dimensions.map((dimension: any) => ({ id: dimension.id, label: dimension.id === "time" ? "Time" : "Space", options: dimension.values }))} disabled={disabled} onChange={(dimensionId, value) => {
      const next = composeComplexityDraft(latestResponse.current?.kind === "complexity" ? latestResponse.current : null, dimensionId, value);
      latestResponse.current = next;
      onSave(next);
    }} selectedValues={current?.selectedValuesByDimension ?? {}} />;
  }
  return <SimulationPersistenceErrorPanel detail="This authored item type is unavailable for Interview Simulation." title="Unsupported question" />;
}
