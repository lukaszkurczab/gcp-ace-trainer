import type { SimulationNavigatorPosition, SimulationSurfaceProjection } from "./simulationProjection";

/**
 * The shared navigator accepts a complete session projection from more than one
 * product flow. Its integrity is about identities, not a legacy fixed length.
 */
export function hasCanonicalSimulationNavigator(positions: readonly SimulationNavigatorPosition[] | undefined): positions is readonly SimulationNavigatorPosition[] {
  if (!positions) return false;
  return positions.length > 0 && new Set(positions.map((position) => position.occurrenceId)).size === positions.length;
}

/** Correctness is deliberately unavailable until the verified result projection. */
export function mayRenderSimulationCompletion(projection: SimulationSurfaceProjection): boolean {
  return projection.state === "completed" && projection.completion !== undefined;
}
