import { loadCanonicalRuntimeCatalog } from "../src/content/canonical/runtimeCatalog";
import { createCanonicalTrainingFamilyComposition } from "../src/application/canonicalTrainingFamilyComposition";

/** Real consumer plan, without answer keys; use Node22 --import tsx from the APP root. */
async function main() {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("claude-certified-architect-professional-certification");
  const composition = createCanonicalTrainingFamilyComposition(track);
  const prepared = await composition.runtime.prepare({ trackId: track.trackId, modeId: "certification-exam-simulation", request: { sessionId: "ccarp-profile-control-exam" }, attempts: [], reviews: [], now: "2026-10-26T12:00:00.000Z" });
  const questions = prepared.session.itemOrder.map((occurrence) => track.getQuestion(occurrence.item.questionId)!);
  const counts = (values: readonly string[]) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((entry) => entry === value).length]));
  const text = questions.map((question) => [question.prompt, ...(question.constraints ?? []), ...("options" in question.interaction ? question.interaction.options.map((option) => option.text) : "dimensions" in question.interaction ? question.interaction.dimensions.flatMap((row) => [row.label, ...row.values.map((value) => value.text)]) : [])].join(" ")).join(" ");
  const statementRows = questions.reduce((sum, question) => sum + (question.interaction.type === "decision_matrix" ? question.interaction.dimensions.length : 0), 0);
  process.stdout.write(`${JSON.stringify({
    schema: "patternly-ccarp-control-exam-v1",
    contentVersion: track.contentVersion,
    currentArtifactSha256: track.artifactSha256,
    trainingArtifactSha256: track.trainingIdentity?.artifactSha256,
    profile: track.simulationProfiles?.find((profile) => profile.modeId === "certification-exam-simulation"),
    itemCount: questions.length,
    formatCounts: counts(questions.map((question) => question.interaction.type)),
    skillCounts: counts(questions.map((question) => question.examMetadata?.decisionSkill ?? "unclassified")),
    domainCounts: counts(questions.map((question) => question.contentDomainId ?? "unattributed")),
    statementRows,
    responseUnits: questions.length - questions.filter((question) => question.interaction.type === "decision_matrix").length + statementRows,
    renderedWordCount: text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0,
    renderedCharacterCount: text.length,
    itemOrder: prepared.session.itemOrder.map((occurrence, index) => ({ ordinal: index + 1, questionId: occurrence.item.questionId, interactionType: questions[index]!.interaction.type, optionOrder: prepared.session.optionOrderByOccurrence[occurrence.occurrenceId] })),
  }, null, 2)}\n`);
}
void main().catch(() => { process.stderr.write("CCAR-P control exam could not be assembled from the current validated bundle.\n"); process.exitCode = 1; });
