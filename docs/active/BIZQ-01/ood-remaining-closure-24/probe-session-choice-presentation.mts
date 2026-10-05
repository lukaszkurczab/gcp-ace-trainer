// Read-only application probe: no persisted account/session, device or Premium admission.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { CanonicalTrainingRuntime } = require("../../../../src/application/canonical/CanonicalTrainingRuntime.ts");
const { loadCanonicalRuntimeCatalog } = require("../../../../src/content/canonical/runtimeCatalog.ts");
const { toCanonicalQuestionViewModel } = require("../../../../src/features/practice/canonicalQuestionViewModel.ts");

// This reproducer describes the pre-correction facade path, not the repaired path.
const historicalFacadeBindings = {
  "src/application/canonical/canonicalOptionOrder.ts": "e91aaf2818ac669f30e47528e2ba08d91eae67a770c806f704ce26bb42ded74e",
  "src/application/design-interview/designInterviewSessionFacade.ts": "4ff9001ce690486e60ecc2c8ebe47d19c7caf1a054bfdc01c57eaf93b271fa1a",
  "src/application/certification/certificationSessionFacade.ts": "1727816579ef068265826070a20eb8c4657514c0c1f08077105b5c7f1ed26240"
};
for (const [path, expected] of Object.entries(historicalFacadeBindings)) {
  assert.equal(createHash("sha256").update(await readFile(path)).digest("hex"), expected, "Historical preflight requires its original facade source; use canonicalPracticeChoiceOrderProjection.test.ts for the repaired path");
}

const catalog = await loadCanonicalRuntimeCatalog();
const observations = [];
for (const [trackId, modeId] of [
  ["object-oriented-design-interview", "design-interview-learn-framework"],
  ["google-cloud-associate-cloud-engineer", "certification-focus-practice"],
] as const) {
  const track = catalog.getTrack(trackId);
  const runtime = new CanonicalTrainingRuntime(track);
  const { session } = await runtime.prepare({ trackId, modeId, request: { sessionId: `bizq24-ui-order:${trackId}`, requestedLength: 10 }, attempts: [], reviews: [], now: "2026-10-05T12:00:00.000Z" });
  await runtime.validateResume({ session, draft: null });
  const mismatches = [];
  for (const occurrence of session.itemOrder) {
    const question = track.getQuestion(occurrence.item.questionId)!;
    const view = toCanonicalQuestionViewModel(question);
    assert.equal(view.interaction.kind, "choice");
    if (view.interaction.kind !== "choice") throw new Error("Expected actual choice question");
    const saved = session.optionOrderByOccurrence[occurrence.occurrenceId];
    const visible = view.interaction.options.map((option: { id: string }) => option.id);
    const source = question.interaction.type === "choice_single" || question.interaction.type === "choice_multiple" ? question.interaction.options.map((option: { optionId: string }) => option.optionId) : [];
    assert.deepEqual(visible, source);
    if (JSON.stringify(visible) !== JSON.stringify(saved)) mismatches.push({ questionId: question.questionId, occurrenceId: occurrence.occurrenceId, saved, visible });
  }
  assert(mismatches.length > 0, "Expected current raw-question UI adapter to ignore saved order");
  observations.push({ trackId, modeId, actualPreparedItems: session.actualLength, validatedResume: true, mismatches });
}
const files = ["src/application/canonical/CanonicalTrainingRuntime.ts", "src/application/canonical/canonicalOptionOrder.ts", "src/application/design-interview/designInterviewSessionFacade.ts", "src/application/certification/certificationSessionFacade.ts", "src/features/practice/DesignInterviewPracticeScreen.tsx", "src/features/practice/CertificationPracticeSessionScreen.tsx", "src/features/practice/canonicalQuestionViewModel.ts"];
const bindings = [];
for (const path of files) bindings.push({ path, sha256: createHash("sha256").update(await readFile(path)).digest("hex") });
const receipt = { verdict: "REPRODUCED", scope: "Actual current catalog/runtime preparation and raw-question UI adapter only; no React/native/Premium claim", observations, bindings, cause: "Runtime saves and validates occurrence order, but both practice facades return raw resolved questions and the corresponding screens project them without that order", toolingCorrection: "Initial ESM named import failed before preparation/writes because these TS modules load as CommonJS; corrected probe uses createRequire with the same actual modules", sourceWrites: false, accountOrSessionWrites: false };
await writeFile(new URL("ROOT-SESSION-CHOICE-PRESENTATION-PREFLIGHT.json", import.meta.url), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ verdict: receipt.verdict, tracks: observations.map(o => ({ trackId: o.trackId, mismatches: o.mismatches.length, prepared: o.actualPreparedItems })) }));
