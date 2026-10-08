import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ProfileReadFenceChangedError, runActualResultScreen } from "./resultScorePresentationTestHarness.mjs";

test("actual Certification Practice result presents derived overall points and the existing partial diagnostic", async () => {
  const rendered = await runActualResultScreen();
  assert.match(rendered.text, /11\s+\/\s+22/);
  assert.doesNotMatch(rendered.text, /15\s+\/\s+22/);
  assert.match(rendered.text, /7\s+\/\s+10/);
  assert.match(rendered.text, /Correct 7/);
  assert.match(rendered.text, /Partly correct 1/);
  assert.match(rendered.text, /Incorrect 2/);
  assert.match(rendered.text, /Partly correct/);
  assert.match(rendered.text, /Session complete/);
});

test("an unavailable optional practice-points projection preserves counts and omits weighted points", async () => {
  const rendered = await runActualResultScreen({ projectionFails: true });
  assert.match(rendered.text, /7\s+\/\s+10/);
  assert.match(rendered.text, /Correct 7/);
  assert.match(rendered.text, /Partly correct 1/);
  assert.match(rendered.text, /Incorrect 2/);
  assert.match(rendered.text, /Partly correct/);
  assert.doesNotMatch(rendered.text, /Weighted points/);
  assert.doesNotMatch(rendered.text, /Session summary unavailable/);
});

test("a profile-read fence failure is not swallowed as an optional diagnostic projection", async () => {
  const rendered = await runActualResultScreen({ projectionError: new ProfileReadFenceChangedError() });
  const unavailable = rendered.byType("EmptyState")[0];
  assert.ok(unavailable);
  assert.equal(unavailable.props.title, "Session summary unavailable");
  assert.doesNotMatch(rendered.text, /Diagnostic sample/);
});

test("generic history without compatible verified points does not render its raw weighted aggregate", async () => {
  const rendered = await runActualResultScreen({ genericMode: true });
  assert.match(rendered.text, /1\s+\/\s+2/);
  assert.match(rendered.text, /Partly correct/);
  assert.doesNotMatch(rendered.text, /Weighted points/);
});

test("actual GCP diagnostic result renders observed unit evidence and opens the pinned Focus target", async () => {
  const target = "GCPACE-N01-B02";
  const rendered = await runActualResultScreen({
    diagnosticReport: {
      answeredCount: 40, correctCount: 34, incorrectCount: 4, partialCount: 2, unansweredCount: 0, totalCount: 40,
      sampledMentalUnitIds: [target, "GCPACE-N01-B03"], unsampledMentalUnitCount: 5, exposureHistory: "available",
      units: [
        { nodeId: "organization_projects_policies_services_quotas_and_assets", mentalUnitId: target, unitNumber: 2, unansweredCount: 0, contentDomainIds: ["gcp-ace-standard-domain-1"], correctCount: 8, partialCount: 1, incorrectCount: 1, questionCount: 10, repeatExposureCount: 2, firstRecordedExposureCount: 8, exposureHistoryKnown: true, firstOrdinal: 1 },
        { nodeId: "organization_projects_policies_services_quotas_and_assets", mentalUnitId: "GCPACE-N01-B03", unitNumber: 3, unansweredCount: 0, contentDomainIds: ["gcp-ace-standard-domain-1"], correctCount: 10, partialCount: 0, incorrectCount: 0, questionCount: 10, repeatExposureCount: 0, firstRecordedExposureCount: 10, exposureHistoryKnown: true, firstOrdinal: 11 },
      ],
      recommendation: { kind: "observed_gap", nodeId: "organization_projects_policies_services_quotas_and_assets", mentalUnitId: target, unitNumber: 2, incorrectCount: 1, partialCount: 1, sampledQuestionCount: 10, eligibleQuestionCount: 18 },
    },
  });
  assert.match(rendered.text, /Diagnostic sample/);
  assert.match(rendered.text, /34 correct, 2 partly correct, 4 incorrect/);
  assert.match(rendered.text, /Feedback was available after each answer/);
  assert.match(rendered.text, /This report covers only the learning units sampled by this diagnostic/);
  assert.doesNotMatch(rendered.text, /These are examples from one learning unit/);
  assert.match(rendered.text, /Learning unit 2/);
  assert.match(rendered.text, /Next practice: .*learning unit 2/);
  assert.doesNotMatch(rendered.text, /gcp-ace-n01-b02-\d+/i);
  const recommendationButton = rendered.byType("Button").find((node) => node.props.testID === "diagnostic-recommendation");
  assert.ok(recommendationButton);
  recommendationButton.props.onPress();
  assert.deepEqual(JSON.parse(JSON.stringify(rendered.navigationCalls.at(-1))), ["practice-setup", {
    expectedArtifactSha256: rendered.artifactSha256, expectedContentVersion: rendered.contentVersion, mentalUnitId: target, mode: "certification-focus-practice",
    source: "practiceHub", topicId: "organization_projects_policies_services_quotas_and_assets", trackId: "google-cloud-associate-cloud-engineer",
  }]);
});

test("diagnostic and focused-unit copy is translated with matching placeholders in all seven locales", () => {
  const locales = ["en", "pl", "de", "es", "et", "fr", "it"];
  const keys = [
    "This report covers only the learning units sampled by this diagnostic. It does not establish transfer to unseen questions.",
    "Learning unit {{number}}",
    "This session is limited to learning unit {{number}} in this chapter.",
    "This recommended learning unit is unavailable in the current content package.",
    "This recommended practice scope is no longer available for the current content package.",
    "This recommended practice scope does not have enough available questions.",
    "{{correct}} correct, {{partial}} partly correct, {{incorrect}} incorrect, and {{unanswered}} unanswered from {{sampled}} sampled questions.",
    "Next practice: {{topic}} — learning unit {{number}}. This diagnostic sampled {{sampled}} of {{eligible}} Focus questions for this unit, with {{partial}} partly correct and {{incorrect}} incorrect answers.",
  ];
  const dictionaries = Object.fromEntries(locales.map((locale) => [locale, JSON.parse(readFileSync(new URL(`../../locales/${locale}/common.json`, import.meta.url), "utf8"))]));
  const tokens = (value) => [...value.matchAll(/{{(\w+)}}/g)].map((match) => match[1]).sort();
  for (const key of keys) {
    assert.ok(dictionaries.en[key], `English common copy missing ${key}`);
    for (const locale of locales.slice(1)) {
      assert.ok(dictionaries[locale][key], `${locale} common copy missing ${key}`);
      assert.notEqual(dictionaries[locale][key], dictionaries.en[key], `${locale} copy must be translated for ${key}`);
      assert.deepEqual(tokens(dictionaries[locale][key]), tokens(dictionaries.en[key]), `${locale} placeholder contract for ${key}`);
    }
  }
});
