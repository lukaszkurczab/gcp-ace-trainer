import { acceptedTargetFromGoal } from "../domain/learning/learningPlan";
import { installMemoryStorage } from "./journalTestSupport";
import { provisionGuestInstallation } from "../storage/repositories/guestInstallationRepository";
import { loadCanonicalRuntimeCatalog } from "../content/canonical/runtimeCatalog";
import { createCanonicalTrainingFamilyComposition } from "../application/canonicalTrainingFamilyComposition";
import { composeTrainingLifecycleUseCases } from "../application/bootstrap/trainingLifecycleComposition";
import { indexCaseRecipes } from "../content/canonical/caseRecipe";
import { createDefaultGoal, createLearningPlan, createLearningPlanSlotId } from "../domain";
import { requireGoalPolicy } from "../domain/tracks/trackGoalPolicies";
import { saveActiveTrackId } from "../storage/repositories/activeTrackRepository";
import { saveGoalSnapshot } from "../storage/repositories/goalRepository";
import { saveLearningPlanAtomically } from "../storage/repositories/learningPlanRepository";
import { getTrainingAttempts, getTrainingSessions, getReviewQueueItems, getTrainingSessionResult } from "../storage/repositories";
import { productionLearningDataAdmissionContext as context } from "../application/tracks/trackAdmissionContext";
import { buildAccountDataSnapshot } from "../storage/repositories/accountDataRepository";

export const WIRE_FIXTURE_GUEST = "66666666-6666-4666-8666-666666666666";
const TRACK = "claude-certified-architect-professional-certification";
const NOW = "2026-10-14T10:00:00.000Z";
/** Real admitted QLE runtime, journal, repositories and producer; isolated memory storage only. */
export async function terminalWireFixture() {
  const storage = installMemoryStorage();
  await provisionGuestInstallation({ async create() { return { installationId: WIRE_FIXTURE_GUEST, localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  const family = createCanonicalTrainingFamilyComposition(track);
  let sequence = 0;
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: { now: () => NOW }, sessionIds: { async create() { return `wire-case-${++sequence}`; } },
    premiumSessionAdmission: { async authorize() { return "allowed"; } },
    packages: {
      async resolveForPreparation() { return { track: family.catalog, runtime: family.runtime }; },
      async resolveExactArtifact() { return { track: family.catalog, runtime: family.runtime }; },
      async resolveForDiscovery() { return { track: family.catalog, runtime: family.runtime }; },
    },
  });
  const recipe = indexCaseRecipes(track.questions)[0]!;
  const command = { trackId: TRACK, modeId: "certification-focus-practice", request: { preset: "single_case", caseId: recipe.caseId, requestedLength: recipe.steps.length } };
  const opened = await lifecycle.startSession(command);
  for (const [index, step] of recipe.steps.entries()) {
    await lifecycle.submitPracticeResponse(track.getQuestion(step.questionId)!.answer);
    await lifecycle.submitPracticeResponse({ type: "choice_single", optionId: "nonexistent" });
    await lifecycle.recordCaseExposure("solution");
    if (index < recipe.steps.length - 1) await lifecycle.advancePracticeSession();
  }
  const finalized = await lifecycle.completeActivePracticeSession(opened.session.id);
  await lifecycle.startSession(command);
  const abandoned = await lifecycle.abandonActiveSession();
  await saveActiveTrackId(TRACK);
  const policy = requireGoalPolicy(TRACK);
  const goal = createDefaultGoal(policy);
  await saveGoalSnapshot(goal, null, policy);
  const plan = createLearningPlan({
    schemaVersion: 2, planId: "wire-plan", trackId: TRACK, goalRevision: 1, status: "accepted", timezone: "Europe/Warsaw",
    contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, acceptedTarget: acceptedTargetFromGoal(goal),
    createdAt: NOW, updatedAt: NOW, planRevision: 1, commandId: "wire-command",
    slots: goal.preferredDays.map(day => ({ slotId: createLearningPlanSlotId(`wire-${day}`), day, localTime: "18:00", sessionLength: 10 })),
    minutesPerStudyDay: 30, executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "certification-focus-practice", requestedLength: 10 } },
    planningPolicyIdentity: { contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, policyVersion: "wire-policy" },
  });
  saveLearningPlanAtomically({ policy, plan, expectedGoalRevision: 1, expectedPlanStorageRevision: null });
  const snapshot = await buildAccountDataSnapshot(context);
  return { storage, snapshot, finalized, abandoned, track, family, lifecycle,
    attempts: (await getTrainingAttempts(context.trackAdmission)).value,
    sessions: (await getTrainingSessions(context.trackAdmission)).value,
    reviews: (await getReviewQueueItems(context.trackAdmission)).value,
    result: await getTrainingSessionResult(finalized.session.id, context.trackAdmission),
  };
}
