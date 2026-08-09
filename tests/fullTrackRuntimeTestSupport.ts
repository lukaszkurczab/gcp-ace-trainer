import { CodingInterviewFamilyRuntime } from "../src/application/coding-interview/CodingInterviewFamilyRuntime";
import { CertificationFamilyRuntime } from "../src/application/certification/CertificationFamilyRuntime";
import type { ContentPackageRuntimePort } from "../src/application/trainingLifecycle";
import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";
import type {
  PublishedAlgorithmsPracticeBlueprint,
  PublishedAlgorithmsSimulationPool,
  PublishedAlgorithmsSimulationProfile,
  PublishedCertificationDiagnosticBaseline,
  PublishedCertificationMixedPractice,
  PublishedCertificationScenarioPractice,
} from "../src/content/contracts";
import { contentPackagePinsEqual } from "../src/domain";
import type { AlgorithmRuntimeCatalog } from "../src/tracks/coding-interview";
import { ALGORITHM_MODE_IDS } from "../src/tracks/coding-interview";
import type { CertificationRuntimeCatalog } from "../src/tracks/certification";
import { getCertificationPackageTestCatalog, getCodingPackageTestCatalog, prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";

export const FULL_TRACK_SIMULATION_PROFILE_ID = "canonical-full-track-simulation";
export const FULL_TRACK_INDEPENDENT_SCOPE_ID = "canonical-full-track-independent";

export async function createCodingFullTrackTestRuntime(): Promise<Readonly<{
  catalog: AlgorithmRuntimeCatalog;
  packages: ContentPackageRuntimePort;
}>> {
  await prepareBundledTestPackages();
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving");
  if (resolution.package.familyId !== "coding_interview") throw new Error("Coding package family mismatch.");
  const base = getCodingPackageTestCatalog();
  const simulationItemIds = Object.freeze(base.getItems().slice(0, 40).map((item) => item.id));
  if (simulationItemIds.length !== 40 || new Set(simulationItemIds).size !== 40) throw new Error("Canonical full-track simulation test requires forty unique package items.");
  const pool: PublishedAlgorithmsSimulationPool = Object.freeze({
    itemIds: simulationItemIds,
    poolId: "canonical-full-track-simulation-pool",
    poolVersion: "1",
  });
  const profile: PublishedAlgorithmsSimulationProfile = Object.freeze({
    distributions: Object.freeze([]),
    foregroundDurationMs: 2_700_000,
    poolId: pool.poolId,
    profileId: FULL_TRACK_SIMULATION_PROFILE_ID,
    profileKind: "internal_learning_profile",
    profileVersion: "1",
    selectionPolicy: Object.freeze({
      algorithmVersion: "sha256-ranked-constraints-v1",
      deterministic: true,
      replacement: false,
      uniqueItems: true,
    }),
    totalOccurrences: 40,
  });
  const blueprint: PublishedAlgorithmsPracticeBlueprint = Object.freeze({
    blueprintId: "canonical-full-track-simulation-blueprint",
    blueprintVersion: "1",
    composition: Object.freeze({ kind: "simulation_pool", ids: Object.freeze([pool.poolId]) }),
    defaultRequestedLength: 40,
    minimumActualLength: 40,
    modeId: ALGORITHM_MODE_IDS.interviewSimulation,
    requestedLengths: Object.freeze([40]),
    resolvedItemIds: simulationItemIds,
    shortening: "prohibited",
  });
  const independentItemIds = Object.freeze(base.getItems().slice(40, 60).map((item) => item.id));
  if (independentItemIds.length !== 20 || new Set(independentItemIds).size !== 20) throw new Error("Canonical full-track Independent Practice test requires twenty unique package items.");
  const independentScope = Object.freeze({
    scopeId: FULL_TRACK_INDEPENDENT_SCOPE_ID,
    scopeVersion: "1",
    mentalUnitIds: Object.freeze([...new Set(independentItemIds.map((itemId) => base.getItemById(itemId).taxonomy.primaryMentalUnitId))]),
    itemIds: independentItemIds,
    legalLearningStages: Object.freeze(["independent"]),
  });
  const independentBlueprint: PublishedAlgorithmsPracticeBlueprint = Object.freeze({
    blueprintId: "canonical-full-track-independent-blueprint",
    blueprintVersion: "1",
    composition: Object.freeze({ kind: "interleaved_scope", ids: Object.freeze([independentScope.scopeId]) }),
    defaultRequestedLength: 10,
    minimumActualLength: 1,
    modeId: ALGORITHM_MODE_IDS.independentPractice,
    requestedLengths: Object.freeze([10, 20]),
    resolvedItemIds: independentItemIds,
    shortening: "allowed",
  });
  const catalog: AlgorithmRuntimeCatalog = Object.freeze({
    ...base,
    assertModeAvailable(modeId: string, requestedLength: number) {
      if (modeId === ALGORITHM_MODE_IDS.interviewSimulation && requestedLength === 40) return;
      if (modeId === ALGORITHM_MODE_IDS.independentPractice && [10, 20].includes(requestedLength)) return;
      base.assertModeAvailable(modeId, requestedLength);
    },
    getPracticeBlueprint(modeId: string) {
      if (modeId === ALGORITHM_MODE_IDS.interviewSimulation) return blueprint;
      if (modeId === ALGORITHM_MODE_IDS.independentPractice) return independentBlueprint;
      return base.getPracticeBlueprint(modeId);
    },
    getInterleavedScopes: () => Object.freeze([independentScope]),
    getSimulationPool(poolId: string) { return poolId === pool.poolId ? pool : undefined; },
    getSimulationProfile(profileId: string) { return profileId === profile.profileId ? profile : undefined; },
  });
  const runtime = new CodingInterviewFamilyRuntime(catalog, undefined, resolution.package.taxonomyVersion);
  const packages: ContentPackageRuntimePort = Object.freeze({
    async resolveForPreparation(input: Parameters<ContentPackageRuntimePort["resolveForPreparation"]>[0]) {
      if (input.trackId !== resolution.package.trackId || input.familyId !== resolution.package.familyId) throw new Error("Full-track test runtime does not own the requested track.");
      return Object.freeze({ package: resolution.package, runtime });
    },
    async resolveExact(pin: Parameters<ContentPackageRuntimePort["resolveExact"]>[0]) {
      if (!contentPackagePinsEqual(pin, resolution.package.packagePin)) throw new Error("Full-track test runtime requires its exact package pin.");
      return Object.freeze({ package: resolution.package, runtime });
    },
    async resolveForDiscovery(trackId: Parameters<ContentPackageRuntimePort["resolveForDiscovery"]>[0], familyId: Parameters<ContentPackageRuntimePort["resolveForDiscovery"]>[1]) {
      if (trackId !== resolution.package.trackId || familyId !== resolution.package.familyId) throw new Error("Full-track test runtime does not own discovery for the requested track.");
      return Object.freeze({ package: resolution.package, runtime });
    },
  });
  return Object.freeze({ catalog, packages });
}

export async function createCertificationFullTrackTestRuntime(): Promise<Readonly<{
  catalog: CertificationRuntimeCatalog;
  runtime: CertificationFamilyRuntime;
}>> {
  await prepareBundledTestPackages();
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery("google-cloud-associate-cloud-engineer");
  if (resolution.package.familyId !== "certification") throw new Error("Certification package family mismatch.");
  const base = getCertificationPackageTestCatalog();
  const itemIds = Object.freeze(base.getItems().slice(0, 40).map((item) => item.id));
  if (itemIds.length !== 40 || new Set(itemIds).size !== 40) throw new Error("Canonical full-track Certification tests require forty unique package items.");
  const scenarioIds = Object.freeze(itemIds.slice(0, 12));
  const diagnostic: PublishedCertificationDiagnosticBaseline = Object.freeze({
    blueprintId: "canonical-full-track-diagnostic",
    blueprintVersion: "1",
    modeId: "certification-diagnostic-baseline",
    requestedLength: 40,
    actualLength: 40,
    shortening: "prohibited",
    uniqueItemsRequired: 40,
    timerKind: "elapsed_foreground",
    feedbackTiming: "after_each_durable_submit",
    reinsertPolicy: "disabled",
    itemIds,
  });
  const scenario: PublishedCertificationScenarioPractice = Object.freeze({
    blueprintId: "canonical-full-track-scenario",
    blueprintVersion: "1",
    modeId: "certification-scenario-practice",
    requestedLengths: Object.freeze([10, 20, 40] as const),
    shortening: "allowed_within_competency",
    selectionScope: "explicit_tag_competency",
    competencies: Object.freeze([Object.freeze({ id: "setup-environment-scenario", label: "Setup environment", scenarioItemIds: scenarioIds })]),
  });
  const mixed: PublishedCertificationMixedPractice = Object.freeze({
    blueprintId: "canonical-full-track-mixed",
    blueprintVersion: "1",
    modeId: "certification-mixed-practice",
    requestedLengths: Object.freeze([10, 20, 40] as const),
    shortening: "allowed_within_interleaved_blueprint",
    selectionScope: "unique_interleaved_blueprint",
    itemIds,
  });
  const catalog: CertificationRuntimeCatalog = Object.freeze({
    ...base,
    getDiagnosticBaseline: () => diagnostic,
    getScenarioPractice: () => scenario,
    getMixedPractice: () => mixed,
  });
  return Object.freeze({ catalog, runtime: new CertificationFamilyRuntime(catalog, resolution.package.taxonomyVersion) });
}
