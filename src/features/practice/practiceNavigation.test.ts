import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { ROUTES } from "../../constants/routes";
import { AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID } from "../../domain/tracks/trackRegistry";
import { PREMIUM_NODE_OFFERS } from "../../content/application/premiumNodeOffers";
import { buildPracticeHubResetRoutes, findMatchingPremiumSetupOffer, resolvePracticeSetupTopicChoice } from "./practiceNavigation";
import type { PracticeSessionLength } from "./sessionConfig";
import type { CanonicalPracticeModeId } from "../../application/practice/practiceModeContract";

test("practice session exit resets navigation above the closed session", () => {
  assert.deepEqual(buildPracticeHubResetRoutes("two_pointers"), [
    { name: ROUTES.HOME },
    { name: ROUTES.PRACTICE_HUB, params: { topicId: "two_pointers" } },
  ]);
});

test("practice session exit can return to the hub without a topic override", () => {
  assert.deepEqual(buildPracticeHubResetRoutes(), [
    { name: ROUTES.HOME },
    { name: ROUTES.PRACTICE_HUB },
  ]);
});

test("returning from Choose topic with the same topic preserves the setup draft", () => {
  const draft = Object.freeze({
    feedbackMode: "atSessionEnd" as const,
    mode: "certification-focus-practice" as const,
    reviewBehaviorEnabled: false,
    sessionLength: 10 as const,
    topicId: "aws-secure-architecture-foundations",
    trackId: AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID,
  });

  assert.deepEqual(resolvePracticeSetupTopicChoice(draft, draft.topicId, draft.trackId), draft);
});

test("changing a free topic preserves question count and feedback choice", () => {
  const result = resolvePracticeSetupTopicChoice({
    feedbackMode: "atSessionEnd",
    mode: "certification-focus-practice",
    sessionLength: 10,
    topicId: "aws-secure-architecture-foundations",
    trackId: AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID,
  }, "aws-networking", AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID);

  assert.equal(result?.topicId, "aws-networking");
  assert.equal(result?.sessionLength, 10);
  assert.equal(result?.feedbackMode, "atSessionEnd");
});

test("changing topic clears only an incompatible learning unit and retains package pins", () => {
  const draft = {
    expectedArtifactSha256: "sha256:plan",
    expectedContentVersion: "v3",
    mentalUnitId: "unit-1",
    sessionLength: 10 as const,
    topicId: "aws-secure-architecture-foundations",
    trackId: AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID,
  };

  const changed = resolvePracticeSetupTopicChoice(draft, "aws-networking", draft.trackId);
  assert.equal(changed?.topicId, "aws-networking");
  assert.equal(changed?.mentalUnitId, undefined);
  assert.equal(changed?.expectedContentVersion, "v3");
  assert.equal(changed?.expectedArtifactSha256, "sha256:plan");
  assert.equal(resolvePracticeSetupTopicChoice(draft, draft.topicId, draft.trackId)?.expectedArtifactSha256, "sha256:plan");
});

test("an explicit free-topic choice can clear only the previous premium-offer identity", () => {
  const result = resolvePracticeSetupTopicChoice({
    expectedArtifactSha256: "sha256:premium",
    expectedContentVersion: "v5",
    feedbackMode: "atSessionEnd",
    premiumOfferId: "offer-1",
    sessionLength: 10,
    topicId: "premium-node",
    trackId: AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID,
  }, "aws-networking", AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID);

  assert.equal(result?.premiumOfferId, undefined);
  assert.equal(result?.expectedContentVersion, undefined);
  assert.equal(result?.expectedArtifactSha256, undefined);
  assert.equal(result?.sessionLength, 10);
  assert.equal(result?.feedbackMode, "atSessionEnd");
});

test("a current Premium setup draft round-trips unchanged only with its exact offer identity", () => {
  const offer = PREMIUM_NODE_OFFERS[0]!;
  const draft = {
    expectedArtifactSha256: offer.artifactSha256,
    expectedContentVersion: offer.contentVersion,
    feedbackMode: "afterEachAnswer" as const,
    mode: offer.mode.modeId as CanonicalPracticeModeId,
    premiumOfferId: offer.offerId,
    sessionLength: offer.mode.defaultRequestedLength as PracticeSessionLength,
    topicId: offer.nodeId,
    trackId: offer.trackId,
  };

  assert.equal(findMatchingPremiumSetupOffer(draft, [offer]), offer);
  assert.equal(findMatchingPremiumSetupOffer({ ...draft, mode: "certification-diagnostic-baseline" as CanonicalPracticeModeId }, [offer]), undefined);
  assert.equal(findMatchingPremiumSetupOffer({ ...draft, expectedContentVersion: "stale" }, [offer]), undefined);
  assert.deepEqual(resolvePracticeSetupTopicChoice(draft, draft.topicId, draft.trackId), draft);
});


test("the canonical Custom Practice settings entry opens setup without a duplicate mode row", () => {
  const hub = readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8");
  const customStart = hub.slice(hub.indexOf("if (isCodingInterviewTrack && resolvedMode === ALGORITHM_MODE_IDS.customPractice)"), hub.indexOf("if (isDesignInterviewTrack)"));
  assert.match(customStart, /navigation\.navigate\(ROUTES\.PRACTICE_SETUP/);
  assert.match(customStart, /mode: resolvedMode/);
  assert.match(customStart, /topicId: topic\.id/);
  assert.match(customStart, /trackId: activeTrack\.id/);
  assert.match(customStart, /return;/);
  assert.doesNotMatch(customStart, /buildPracticeSessionConfig|PRACTICE_SESSION|feedbackMode/);
  assert.match(hub, /onPress=\{\(\) => \{\s*if \(isCodingInterviewTrack\) \{\s*startSession\(ALGORITHM_MODE_IDS\.customPractice, "practiceHub"\)/);
  assert.match(hub, /const secondaryModes = modes\.filter\(\(mode\) => mode\.mode !== primaryMode\.mode && mode\.mode !== ALGORITHM_MODE_IDS\.customPractice\)/);
  const setup = readFileSync("src/features/practice/PracticeSetupScreen.tsx", "utf8");
  assert.match(setup, /buildPracticeSessionConfig\(\{[\s\S]*?feedbackMode,/);
});

test("ordinary Free Design routes before Premium admission while simulation retains admission", () => {
  const hub = readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8");
  const designStart = hub.slice(hub.indexOf("if (isDesignInterviewTrack)"), hub.indexOf("if (activeTrack.familyId === \"certification\""));
  assert.match(designStart, /navigation\.navigate\(ROUTES\.PRACTICE_SETUP/);
  assert.match(designStart, /mode: resolvedMode/);
  assert.match(designStart, /topicId: topic\.id/);
  assert.match(designStart, /if \(target === "setup"\) \{[\s\S]*?ROUTES\.PRACTICE_SETUP[\s\S]*?\} else \{[\s\S]*?ROUTES\.PRACTICE_SESSION/);
  const freeStart = designStart.slice(designStart.indexOf("if (!requiresPremiumProductMode(resolvedMode))"), designStart.indexOf("if (designAdmissionPendingRef.current)"));
  assert.match(freeStart, /if \(target === "setup"\)[\s\S]*?ROUTES\.PRACTICE_SETUP[\s\S]*?else[\s\S]*?ROUTES\.PRACTICE_SESSION/);
  for (const field of ["mode: resolvedMode", "source", "topicId: topic.id", "trackId: activeTrack.id"]) assert.ok(freeStart.includes(field), field);
  assert.match(freeStart, /return;\s*\}/);
  assert.doesNotMatch(freeStart, /authorizePremiumSessionStart/);
  const simulation = designStart.slice(designStart.indexOf("if (designAdmissionPendingRef.current)"));
  assert.match(simulation, /account\.authorizePremiumSessionStart\(\)/);
  assert.ok(simulation.indexOf("authorizePremiumSessionStart") < simulation.indexOf("ROUTES.DESIGN_INTERVIEW_SIMULATION"));
  assert.match(simulation, /case "purchasePremium":[\s\S]*?ROUTES\.PREMIUM_PURCHASE/);
  assert.match(simulation, /case "retryAdmission":[\s\S]*?setDesignAccessUnavailable\(true\)/);
  assert.match(simulation, /if \(designAdmissionPendingRef\.current\) return/);
  assert.match(simulation, /\.catch\(\(\) => setDesignAccessUnavailable\(true\)\)/);
});
