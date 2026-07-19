import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../../src/content/bundled";
import type { PublishedAlgorithmItem, PublishedAlgorithmsBank } from "../../src/content/contracts";

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

type AuditArtifact = Readonly<{ bank: PublishedAlgorithmsBank }>;

/**
 * Audit-only input catalogue. It parses the pinned bundled artifact directly,
 * creates no repository client and has no production import edge.
 */
export function buildAlgorithmsVisualFixtures(): readonly AlgorithmsVisualFixture[] {
  const artifact = artifactForAudit();
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

/** Returns only a real, approved bundled item; the host never invents content. */
export function getAlgorithmsAuditItem(interaction: AlgorithmsVisualFixture["interaction"], stateId: string): PublishedAlgorithmItem {
  const candidates = artifactForAudit().bank.items.filter((item) => item.interaction.type === interaction);
  const item = candidates[Number(stateId.slice(2)) % candidates.length];
  if (!item) throw new Error(`Pinned Algorithms artifact has no ${interaction} item for ${stateId}.`);
  return item;
}

function artifactForAudit(): AuditArtifact {
  return JSON.parse(GENERATED_BUNDLED_CONTENT_RELEASE.artifacts[0]!.artifactBytes) as AuditArtifact;
}

function operationFor(id: string): string {
  const practice = ["preparing", "unanswered", "submitting_before_journal", "submit_journal_failed", "commit_pending", "commit_materialization_failed", "feedback", "feedback", "advancing", "advance_failed", "completed", "leave", "abandon_confirmation", "abandoning", "abandonment_failed_before_journal"];
  if (id.startsWith("P-")) return practice[Number(id.slice(2)) - 1]!;
  const states = ["preparing", "insufficient_content", "editable", "editable_unsaved", "saving", "editable_saved", "save_failed", "stale_revision", "navigator_inventory", "navigator_mixed", "finish_confirmation", "leave_confirmation", "abandon_confirmation", "abandoning", "abandonment_failed", "expired", "frozen", "finalization_journal_pending", "finalization_journal_failed", "materializing", "materialization_failed", "verification_failed", "recovery_required", "recovered_finalizing", "timer_recovery_failed", "missing_draft", "version_mismatch", "corrupt_state", "completed"];
  return states[Number(id.slice(2)) - 1]!;
}

function notesFor(id: string): string {
  if (id === "P-08") return "Family-owned feedback, partial response, and long Details copy.";
  if (id === "S-01") return "40-position navigator and reduced-motion baseline.";
  if (id === "S-24") return "Verified result only; no correctness before completion.";
  return "Immutable application projection fixture; no MMKV mutation.";
}
