import { loadCanonicalRuntimeCatalog } from "../../../../src/content/canonical/runtimeCatalog";

async function main() {

const catalog = await loadCanonicalRuntimeCatalog();
const track = catalog.getTrack("coding-interview-dsa-problem-solving");
const questionId = "alg-contrast-binary-scan-correctness-006";
const question = track.getQuestion(questionId);
if (!question || !("options" in question.interaction)) throw new Error("Named-approach candidate unavailable; re-review current source.");
const practiceModes = track.modes.filter((mode) => track.getPool(mode.modeId).some((item) => item.questionId === questionId)).map((mode) => mode.modeId);
const simulationProfiles = (track.simulationProfiles ?? []).filter((profile) => profile.familyId === "coding_interview" && profile.familyConfig.eligibleQuestionIds.includes(questionId)).map((profile) => profile.profileId);
console.log(JSON.stringify({ questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, prompt: question.prompt, options: question.interaction.options, practiceModes, simulationProfiles, limitation: "Named Option A/B approaches can confuse display letters; source-copy review remains pending. No runtime filter or source/admission change applied." }, null, 2));

}
void main();
