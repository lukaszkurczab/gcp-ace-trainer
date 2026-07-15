export type SimulationTimerTone = "normal" | "warning" | "critical" | "paused";

export type SimulationQuestionState =
  | "current"
  | "answered"
  | "unanswered"
  | "flagged"
  | "error"
  | "unavailable";

export type SimulationChoiceOption = Readonly<{
  id: string;
  label: string;
  text: string;
}>;

export type SimulationOrderingStep = Readonly<{
  id: string;
  text: string;
}>;

export type SimulationComplexityDimension = Readonly<{
  id: "time" | "space";
  label: string;
  options: readonly string[];
}>;

export type SimulationNavigatorItem = Readonly<{
  index: number;
  state: SimulationQuestionState;
}>;

export type SimulationFinalizationStep = Readonly<{
  id: string;
  label: string;
  state: "pending" | "active" | "complete" | "failed";
}>;

export type SimulationQuestionCounts = Readonly<{
  answered: number;
  flagged: number;
  total: number;
  unanswered: number;
}>;
