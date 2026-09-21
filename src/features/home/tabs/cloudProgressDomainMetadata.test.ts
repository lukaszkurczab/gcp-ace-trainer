import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
} from "../../../domain";
import {
  CLAUDE_PROGRESS_DOMAIN_IDS,
  GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS,
  resolveCloudProgressDomainMetadata,
} from "./cloudProgressDomainMetadata";
import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import { buildProgressTabModel } from "./progressTabModel";

const expectedClaudeTitles = [
  "Solution Design & Architecture",
  "Claude Models, Prompting & Context Engineering",
  "Integration",
  "Evaluation, Testing & Optimization",
  "Governance, Safety & Risk Management",
  "Stakeholder Communication & Lifecycle Management",
  "Developer Productivity & Operational Enablement",
] as const;

test("Claude Progress metadata exactly covers the seven blueprint-linked node IDs", () => {
  assert.deepEqual(CLAUDE_PROGRESS_DOMAIN_IDS, [
    "solution_design_and_architecture",
    "model_prompt_and_context_decisions",
    "enterprise_tools_retrieval_and_integration",
    "evaluation_diagnosis_and_optimization",
    "governance_safety_and_risk_controls",
    "stakeholder_decisions_and_delivery_lifecycle",
    "team_workflows_and_operational_enablement",
  ]);
  assert.equal(new Set(CLAUDE_PROGRESS_DOMAIN_IDS).size, CLAUDE_PROGRESS_DOMAIN_IDS.length);
  assert.deepEqual(
    CLAUDE_PROGRESS_DOMAIN_IDS.map((id) => {
      const resolution = resolveCloudProgressDomainMetadata(CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, id);
      assert.equal(resolution.kind, "available");
      return resolution.kind === "available" ? resolution.metadata.title : null;
    }),
    expectedClaudeTitles,
  );
});

test("Google Cloud Progress metadata exactly covers the four scoring domains", () => {
  assert.deepEqual(GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS, [
    "setup_environment",
    "planning_implementation",
    "operations",
    "access_security",
  ]);
  for (const id of GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS) {
    const resolution = resolveCloudProgressDomainMetadata(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, id);
    assert.equal(resolution.kind, "available");
    if (resolution.kind === "available") {
      assert.equal(resolution.metadata.id, id);
      assert.ok(resolution.metadata.title.length > 0);
      assert.ok(resolution.metadata.description.length > 0);
    }
  }
});

test("unknown, aliased, and cross-track IDs remain explicitly unavailable", () => {
  const cases = [
    [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, "ccarp-domain-1"],
    [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, "solution-design-and-architecture"],
    [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, "operations"],
    [GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "solution_design_and_architecture"],
    [GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "unknown"],
  ] as const;

  for (const [trackId, id] of cases) {
    assert.deepEqual(resolveCloudProgressDomainMetadata(trackId, id), { id, kind: "unavailable" });
  }
});

test("every authored title and description has exact EN and PL locale entries", () => {
  const en = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/common.json", "utf8")) as Record<string, string>;

  for (const [trackId, ids] of [
    [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, CLAUDE_PROGRESS_DOMAIN_IDS],
    [GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS],
  ] as const) {
    for (const id of ids) {
      const resolution = resolveCloudProgressDomainMetadata(trackId, id);
      assert.equal(resolution.kind, "available");
      if (resolution.kind !== "available") continue;
      for (const key of [resolution.metadata.title, resolution.metadata.description]) {
        assert.equal(en[key], key);
        assert.ok(typeof pl[key] === "string" && pl[key].length > 0, `Missing PL copy for ${key}`);
        assert.notEqual(pl[key], id);
      }
    }
  }

  for (const key of ["Domain metadata unavailable", "Domain metadata is unavailable for this evidence."]) {
    assert.equal(en[key], key);
    assert.ok(typeof pl[key] === "string" && pl[key].length > 0);
  }
});

test("Progress renders authored meaning in Current focus and Performance evidence", () => {
  const source = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
  assert.match(source, /const focusDescription = focus \? undefined : model\.performanceScores\[0\]\?\.description/);
  assert.match(source, /focusDescription \? <Text[\s\S]*?t\(focusDescription\)/);
  assert.match(source, /score\.description \? <Text[\s\S]*?t\(score\.description\)/);
  assert.match(source, /largeTextLayout \? styles\.evidenceRowHeaderLargeText : null/);
  assert.match(source, /evidenceRowHeaderLargeText: \{ alignItems: "stretch", flexDirection: "column" \}/);
});

test("Claude Progress with zero attempts stays empty without inventing a score", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const model = buildProgressTabModel({
    activeTrackId: CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID,
    activityRecords: [],
    analytics: {} as never,
    attempts: [],
    now: "2026-09-21T00:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [],
    trainingAttempts: [],
  });

  assert.equal(model.hasData, false);
  assert.deepEqual(model.performanceScores, []);
  assert.equal(model.activitySummary.detail, "Start the Solution Design & Architecture Free node to record local practice.");
});
