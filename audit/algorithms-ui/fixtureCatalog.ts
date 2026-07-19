import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../../src/content/bundled";

export const APPROVED_PRACTICE_STATES = Object.freeze(Array.from({ length: 15 }, (_, index) => `P-${String(index + 1).padStart(2, "0")}`));
export const APPROVED_SIMULATION_STATES = Object.freeze(Array.from({ length: 29 }, (_, index) => `S-${String(index + 1).padStart(2, "0")}`));
export const APPROVED_ALGORITHMS_AUDIT_STATES = Object.freeze([...APPROVED_PRACTICE_STATES, ...APPROVED_SIMULATION_STATES]);

export type AlgorithmsVisualFixture = Readonly<{
  id: (typeof APPROVED_ALGORITHMS_AUDIT_STATES)[number];
  surface: "practice" | "simulation";
  operation: string;
  interaction: "choice" | "ordering" | "complexity";
  capture: "flow" | "manual";
  notes: string;
}>;

/**
 * Audit-only input catalogue. It parses the pinned bundled artifact directly,
 * creates no repository client and has no production import edge.
 */
export function buildAlgorithmsVisualFixtures(): readonly AlgorithmsVisualFixture[] {
  const artifact = JSON.parse(GENERATED_BUNDLED_CONTENT_RELEASE.artifacts[0]!.artifactBytes) as Readonly<{ bank: Readonly<{ items: readonly Readonly<{ interaction: { type: "choice" | "ordering" | "complexity" } }> [] }> }>;
  const interactions = new Set(artifact.bank.items.map((item) => item.interaction.type));
  if (interactions.size !== 3 || !interactions.has("choice") || !interactions.has("ordering") || !interactions.has("complexity")) throw new Error("Pinned Algorithms artifact does not provide all approved interaction shapes.");
  return Object.freeze(APPROVED_ALGORITHMS_AUDIT_STATES.map((id, index) => Object.freeze({
    id,
    surface: id.startsWith("P-") ? "practice" : "simulation",
    operation: operationFor(id),
    interaction: (["choice", "ordering", "complexity"] as const)[index % 3]!,
    capture: id === "P-01" || id === "S-01" ? "flow" : "manual",
    notes: notesFor(id),
  })));
}

function operationFor(id: string): string {
  if (id === "P-01") return "unanswered";
  if (id === "P-02") return "submitting_before_journal";
  if (id === "P-03") return "submit_journal_failed";
  if (id === "P-04") return "commit_pending";
  if (id === "P-05") return "commit_materialization_failed";
  if (id === "P-06") return "commit_verification_failed";
  if (id === "P-07") return "verified_pending_clear";
  if (id === "P-08") return "feedback";
  if (id === "P-09") return "advancing";
  if (id === "P-10") return "advance_failed";
  if (id === "P-11") return "completing";
  if (id === "P-12") return "completion_failed";
  if (id === "P-13") return "completed";
  if (id === "P-14") return "abandoning";
  if (id === "P-15") return "abandonment_recovery_required";
  const states = ["editable", "saving", "save_failed", "stale_revision", "navigating", "navigation_failed", "frozen", "finalization_journal_pending", "finalization_journal_failed", "materializing", "materialization_failed", "verifying", "verification_failed", "verified_pending_clear", "recovery_required", "timer_recovery_failed", "missing_draft", "version_mismatch", "corrupt_state", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned", "completed", "editable", "frozen", "recovery_required", "completed", "editable"];
  return states[Number(id.slice(2)) - 1]!;
}

function notesFor(id: string): string {
  if (id === "P-08") return "Family-owned feedback, partial response, and long Details copy.";
  if (id === "S-01") return "40-position navigator and reduced-motion baseline.";
  if (id === "S-24") return "Verified result only; no correctness before completion.";
  return "Immutable application projection fixture; no MMKV mutation.";
}
