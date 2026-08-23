import type { SimulationNavigatorPosition } from "../simulationProjection";

export const SIMULATION_NAVIGATOR_COLUMNS = 5;
export const SIMULATION_NAVIGATOR_LARGE_TEXT_COLUMNS = 4;

export function navigatorGridColumns(fontScale: number): number {
  return fontScale >= 1.3 ? SIMULATION_NAVIGATOR_LARGE_TEXT_COLUMNS : SIMULATION_NAVIGATOR_COLUMNS;
}

export function navigatorCellLabel(position: SimulationNavigatorPosition, index: number, frozen = false): string {
  if (frozen) return `Question ${index + 1}, navigation unavailable while save recovers`;
  const state = position.state === "current"
    ? "current"
    : position.state === "answered"
      ? "answered and saved"
      : "unanswered";
  return `Question ${index + 1}, ${state}${position.flagged ? ", flagged" : ""}`;
}

export function navigatorStateLabel(position: SimulationNavigatorPosition, frozen = false): string {
  if (frozen) return "Frozen";
  const state = position.state === "answered" ? "Saved" : position.state === "current" ? "Current" : "Unanswered";
  return position.flagged ? `${state}, flagged` : state;
}
