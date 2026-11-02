import type { AnswerOptionState } from "../../components/AnswerOption";

export function resultTitle(kind: "correct" | "partial" | "incorrect"): string { return kind === "partial" ? "Almost" : kind === "correct" ? "Correct" : "Incorrect"; }
export function readOptions(value: unknown): readonly { id: string; text: string; selected: boolean; reviewState: string | null }[] {
  const model = (value as any)?.model ?? value;
  const renderer = model?.renderer;
  const diagnostics = new Map<string, string>(Array.isArray((value as any)?.diagnostics)
    ? (value as any).diagnostics.filter((item: any) => typeof item?.id === "string" && typeof item?.state === "string").map((item: any) => [item.id, item.state])
    : []);
  return Array.isArray(renderer?.options) ? renderer.options.filter((item: any) => typeof item?.id === "string" && typeof item?.text === "string")
    .map((item: any) => ({ id: item.id, text: item.text, selected: item.selected === true, reviewState: diagnostics.get(item.id) ?? null })) : [];
}
export function readSelectedOption(value: unknown): string | null { const options = readOptions(value); return options.find((item) => item.selected)?.id ?? null; }


/** Shared by the live feedback and exact terminal review; grading stays in canonical handlers. */
export function approachChallengeOptionState(input: Readonly<{
  selected: boolean; accepted: boolean; reviewState: string | null; resultKind: "correct" | "partial" | "incorrect" | null;
}>): AnswerOptionState {
  if (!input.accepted) return input.selected ? "selected" : "default";
  if (input.reviewState === "correct" || input.reviewState === "omitted_correct") return input.selected ? "correct" : "omitted_correct";
  return input.selected ? input.resultKind === "partial" ? "partial" : "incorrect" : "not_selected";
}
