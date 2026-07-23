import type { SimulationNavigatorPosition } from "../simulationProjection";

export const SIMULATION_NAVIGATOR_COLUMNS = 5;
export const SIMULATION_NAVIGATOR_LARGE_TEXT_COLUMNS = 4;

export function navigatorGridColumns(fontScale: number): number {
  return fontScale >= 1.3 ? SIMULATION_NAVIGATOR_LARGE_TEXT_COLUMNS : SIMULATION_NAVIGATOR_COLUMNS;
}

export function navigatorCellLabel(position: SimulationNavigatorPosition, index: number): string {
  const state = position.state === "current"
    ? "current"
    : position.state === "answered"
      ? "answered and saved"
      : "unanswered";
  return `Question ${index + 1}, ${state}`;
}

export function navigatorStateLabel(position: SimulationNavigatorPosition): string {
  return position.state === "answered" ? "Saved" : position.state === "current" ? "Current" : "Unanswered";
}
