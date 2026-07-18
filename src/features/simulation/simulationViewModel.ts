import type { SimulationNavigatorPosition, SimulationSurfaceProjection } from "./simulationProjection";

export const SIMULATION_OCCURRENCE_COUNT = 40;

/** A malformed projection must never turn into a shortened navigator. */
export function hasCanonicalSimulationNavigator(positions: readonly SimulationNavigatorPosition[] | undefined): positions is readonly SimulationNavigatorPosition[] {
  if (!positions) return false;
  return positions.length === SIMULATION_OCCURRENCE_COUNT && new Set(positions.map((position) => position.occurrenceId)).size === SIMULATION_OCCURRENCE_COUNT;
}

/** Correctness is deliberately unavailable until the verified result projection. */
export function mayRenderSimulationCompletion(projection: SimulationSurfaceProjection): boolean {
  return projection.state === "completed" && projection.completion !== undefined;
}

export function navigatorAccessibilityLabel(position: SimulationNavigatorPosition, index: number): string {
  const durableState = position.state === "answered" ? "saved response" : position.state === "unanswered" ? "no saved response" : position.state;
  return `Position ${index + 1} of ${SIMULATION_OCCURRENCE_COUNT}, ${durableState}`;
}
