import { createElement, type ComponentType, type ReactElement } from "react";
import type { PracticeResponseControl } from "./practiceSessionPresentation";

export type PracticeResponseRendererProps = Readonly<{
  control: PracticeResponseControl;
  editable: boolean;
  itemId?: string;
  interactionResponse: unknown;
  onChoicePress: (optionId: string) => void;
  onComplexityValuePress: (dimensionId: string, value: string) => void;
  onOrderingMove: (elementId: string, direction: "up" | "down") => void;
  onInteractionResponseChange?: (response: unknown) => void;
}>;

export type PracticeResponseRenderer = ComponentType<PracticeResponseRendererProps>;

export type PracticeResponseRendererHostProps = PracticeResponseRendererProps & Readonly<{
  bindings: ReadonlyMap<string, PracticeResponseRenderer>;
}>;

export function createPracticeResponseRendererRegistry(entries: readonly (readonly [string, PracticeResponseRenderer])[]): ReadonlyMap<string, PracticeResponseRenderer> {
  const registry = new Map<string, PracticeResponseRenderer>();
  for (const [interactionType, renderer] of entries) {
    if (!interactionType || typeof renderer !== "function" || registry.has(interactionType)) throw new Error("Practice response renderer registration is invalid.");
    registry.set(interactionType, renderer);
  }
  return registry;
}

export function projectPracticeResponseControl(input: PracticeResponseRendererProps, bindings: ReadonlyMap<string, PracticeResponseRenderer>): ReactElement<PracticeResponseRendererProps> {
  const renderer = bindings.get(input.control.interactionType);
  if (!renderer) throw new Error(`Practice response renderer is unavailable for ${input.control.interactionType}.`);
  return createElement(renderer, input);
}

/** React-only production dispatch shared by the native wrapper and component-level tests. */
export function PracticeResponseRendererHost({ bindings, ...props }: PracticeResponseRendererHostProps): ReactElement<PracticeResponseRendererProps> {
  return projectPracticeResponseControl(props, bindings);
}
