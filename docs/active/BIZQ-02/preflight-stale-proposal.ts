import assert from 'node:assert/strict';
import { LearningPlanProposalCoordinator } from '../../../src/application/learningPlan/LearningPlanProposalCoordinator';
import { contentPackageRuntimeOwner } from '../../../src/application/contentPackageRuntimeOwner';
import { createDefaultGoal, type TrainingAttempt } from '../../../src/domain';
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from '../../../src/infrastructure/storage/mmkvClient';
import { saveGoalSnapshot, addTrainingAttempt } from '../../../src/storage/repositories';
import { readLearningPlanInputSnapshot } from '../../../src/storage/repositories/learningPlanInputSnapshot';
// Probe migrated to the synchronous input API; preserved baseline observations are in PREFLIGHT-RED.log.
async function main() {
const trackId = 'google-cloud-associate-cloud-engineer';
const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, 'certification');
let now = '2026-10-02T12:00:00.000Z';
let seq = 0;
const coordinator = new LearningPlanProposalCoordinator({
 createProposalId: () => `preflight-${++seq}`, getTimezone: () => 'Europe/Warsaw',
 readInputs: readLearningPlanInputSnapshot, peekPackage: () => resolved, now: () => now,
 resolvePackage: async () => resolved, resolveTrackFamily: () => 'certification',
});
const initialize = async () => { installKeyValueStorageForTests(new MemoryKeyValueStorage()); await saveGoalSnapshot(createDefaultGoal(trackId), null); };
await initialize();
const create = async () => { const result = await coordinator.create(trackId); assert.equal(result.kind, 'ready'); if (!('proposal' in result)) throw Error('No proposal'); return result.proposal.proposalId; };
const evidenceProposal = await create();
const item = { trackId, questionId: resolved.track.questions[0]!.questionId, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256 };
await addTrainingAttempt({ id: 'preflight-attempt', sessionId: 'preflight-session', trackId, modeId: resolved.track.modes[0]!.modeId, occurrenceId: 'preflight-occurrence', item, response: {}, result: { kind:'incorrect', earnedPoints:0, maxPoints:1 }, reviewEvidence:{ sourceItem:item, taxonomyOrSkillRefs:[] }, answeredAt:now, committedAt:now } as TrainingAttempt);
const afterEvidence = await coordinator.resolve(evidenceProposal, trackId);
const dayProposal = await create(); now = '2026-10-03T12:00:00.000Z';
const afterDay = await coordinator.resolve(dayProposal, trackId);
const profileProposal = await create(); await initialize();
const afterProfile = await coordinator.resolve(profileProposal, trackId);
console.log(JSON.stringify({ producer: 'b3e4d007b89f45a2de3ebfc36ebdacbd8e0205cf', baselineApp: 'c87d9e31d63c2b1dbce0f55811fffc3f59d4fd2a', afterEvidence: afterEvidence.kind, afterDay: afterDay.kind, afterProfile: afterProfile.kind, expected: 'stale' }, null, 2));
assert.deepEqual([afterEvidence.kind, afterDay.kind, afterProfile.kind], ['stale','stale','stale']);

}
void main().catch(error => { console.error(error); process.exitCode = 1; });
