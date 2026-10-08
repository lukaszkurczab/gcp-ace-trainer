import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const {
  getTracks,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  CODING_INTERVIEW_TRACK_ID,
  BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
  FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
  OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID,
} = require("../src/domain/tracks/trackRegistry.ts");
const { loadCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");
const { getProductSimulationModeConfig } = require("../src/content/canonical/productModeConfig.ts");
const { CanonicalTrainingRuntime } = require("../src/application/canonical/CanonicalTrainingRuntime.ts");

const REPORT_SCHEMA = "patternly-canonical-pool-readiness-v1";
const EXPECTED_TRACK_COUNT = 9;
const SIMULATION_NOW = "2026-10-08T00:00:00.000Z";
const CONFIGURED_SIMULATION_TRACK_IDS = new Set([
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  CODING_INTERVIEW_TRACK_ID,
  BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
  FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
  OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID,
]);

export async function buildCanonicalPoolReadinessReport(options = {}) {
  const registrations = options.registrations ?? getTracks();
  const catalog = options.catalog ?? await loadCanonicalRuntimeCatalog();
  const createRuntime = options.createRuntime ?? ((track) => new CanonicalTrainingRuntime(track));
  const simulationConfigResolver = options.simulationConfigResolver ?? getProductSimulationModeConfig;

  const registryIds = uniqueIds(registrations, (registration) => registration?.id, "track registry");
  const catalogIds = uniqueIds(catalog?.tracks, (trackId) => trackId, "canonical catalog");
  if (registryIds.length !== EXPECTED_TRACK_COUNT || catalogIds.length !== EXPECTED_TRACK_COUNT || !sameSet(registryIds, catalogIds)) {
    throw new Error("Canonical registry and catalog track sets do not match the required nine tracks.");
  }
  if ([...CONFIGURED_SIMULATION_TRACK_IDS].some((trackId) => !registryIds.includes(trackId))) {
    throw new Error("A configured simulation track is missing from the canonical registry.");
  }

  const registryById = new Map(registrations.map((registration) => [registration.id, registration]));
  const trackReports = [];
  for (const trackId of [...registryIds].sort(compareAscii)) {
    const registration = registryById.get(trackId);
    const track = catalog.getTrack(trackId);
    if (!registration || typeof registration.familyId !== "string" || !registration.familyId.trim()) throw new Error("Canonical registry family is unavailable.");
    if (!track || track.trackId !== trackId || !validPin(track)) throw new Error("Canonical track identity or pin is unavailable.");

    const modes = validateModeRows(track);
    const ordinaryModes = [];
    for (const mode of [...modes].sort((left, right) => compareAscii(left.modeId, right.modeId))) {
      const pool = readExactPool(track, mode);
      ordinaryModes.push(projectOrdinaryMode(mode, pool));
    }

    const simulation = await projectSimulation({ track, registration, createRuntime, simulationConfigResolver });
    trackReports.push(Object.freeze({
      trackId,
      familyId: registration.familyId,
      pin: Object.freeze({ contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, contentReleaseId: track.contentReleaseId }),
      ordinaryModes: Object.freeze(ordinaryModes),
      simulation,
    }));
  }

  return Object.freeze({
    schema: REPORT_SCHEMA,
    sourceScope: "bundled_canonical_snapshot",
    userAvailability: "not_evaluated",
    trackCount: trackReports.length,
    ordinaryModeCount: trackReports.reduce((sum, track) => sum + track.ordinaryModes.length, 0),
    tracks: Object.freeze(trackReports),
  });
}

export async function writeCanonicalPoolReadinessReport(write = (text) => process.stdout.write(text), options = {}) {
  const report = await buildCanonicalPoolReadinessReport(options);
  write(`${JSON.stringify(report)}\n`);
}

function uniqueIds(values, getId, source) {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`Canonical ${source} IDs are unavailable.`);
  const ids = values.map(getId);
  if (ids.some((id) => typeof id !== "string" || !id.trim() || id !== id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error(`Canonical ${source} IDs must be unique nonempty strings.`);
  }
  return ids;
}

function sameSet(left, right) {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function validPin(track) {
  return typeof track.contentVersion === "string" && track.contentVersion.trim().length > 0
    && typeof track.artifactSha256 === "string" && /^[a-f0-9]{64}$/.test(track.artifactSha256)
    && typeof track.contentReleaseId === "string" && track.contentReleaseId.trim().length > 0;
}

function validateModeRows(track) {
  if (!Array.isArray(track.modes) || track.modes.length === 0) throw new Error(`Canonical modes are unavailable for ${track.trackId}.`);
  const seen = new Set();
  for (const mode of track.modes) {
    if (!mode || mode.trackId !== track.trackId || typeof mode.modeId !== "string" || !mode.modeId.trim() || seen.has(mode.modeId)) {
      throw new Error(`Canonical modes are invalid or duplicated for ${track.trackId}.`);
    }
    if (!mode.selection || !["node", "exact_ordered_questions", "evidence_conditioned"].includes(mode.selection.kind)) {
      throw new Error(`Canonical selection kind is unavailable for ${track.trackId}/${mode.modeId}.`);
    }
    seen.add(mode.modeId);
  }
  return track.modes;
}

function readExactPool(track, mode) {
  let pool;
  try { pool = track.getPool(mode.modeId); }
  catch { throw new Error(`Canonical pool enumeration failed for ${track.trackId}/${mode.modeId}.`); }
  if (!Array.isArray(pool)) throw new Error(`Canonical pool is not an array for ${track.trackId}/${mode.modeId}.`);
  const ids = pool.map((question) => question?.questionId);
  if (ids.some((id) => typeof id !== "string" || !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error(`Canonical pool contains missing or duplicate identities for ${track.trackId}/${mode.modeId}.`);
  }
  for (const question of pool) {
    if (question.trackId !== track.trackId || track.getQuestion(question.questionId) !== question) {
      throw new Error(`Canonical pool contains a foreign item for ${track.trackId}/${mode.modeId}.`);
    }
    if (mode.selection.kind !== "exact_ordered_questions" && question.nodeId !== mode.selection.nodeId) {
      throw new Error(`Canonical pool escaped its selected node for ${track.trackId}/${mode.modeId}.`);
    }
    if (mode.selection.kind === "node" && mode.selection.mentalUnitId !== undefined && question.mentalUnitId !== mode.selection.mentalUnitId) {
      throw new Error(`Canonical pool escaped its selected mental unit for ${track.trackId}/${mode.modeId}.`);
    }
  }
  if (mode.selection.kind === "exact_ordered_questions" && !sameOrderedIds(ids, mode.selection.questionIds)) {
    throw new Error(`Canonical exact-order pool differs from its declared order for ${track.trackId}/${mode.modeId}.`);
  }
  return pool;
}

function projectOrdinaryMode(mode, pool) {
  const nodeCounts = countBy(pool, (question) => question.nodeId);
  const unitCounts = countBy(pool, (question) => JSON.stringify([question.nodeId, question.mentalUnitId]));
  const mentalUnits = [...unitCounts.entries()].map(([key, questionCount]) => {
    const [nodeId, mentalUnitId] = JSON.parse(key);
    return Object.freeze({ nodeId, mentalUnitId, questionCount });
  }).sort((left, right) => compareAscii(left.nodeId, right.nodeId) || compareAscii(left.mentalUnitId, right.mentalUnitId));
  const domainCounts = countBy(pool.filter((question) => typeof question.contentDomainId === "string"), (question) => question.contentDomainId);
  return Object.freeze({
    modeId: mode.modeId,
    selectionKind: mode.selection.kind,
    availability: mode.availability,
    pool: Object.freeze({
      uniqueQuestionCount: pool.length,
      nodes: Object.freeze([...nodeCounts.entries()].sort(([a], [b]) => compareAscii(a, b)).map(([nodeId, questionCount]) => Object.freeze({ nodeId, questionCount }))),
      mentalUnits: Object.freeze(mentalUnits),
      ...(domainCounts.size === 0 ? {} : { contentDomains: Object.freeze([...domainCounts.entries()].sort(([a], [b]) => compareAscii(a, b)).map(([contentDomainId, questionCount]) => Object.freeze({ contentDomainId, questionCount }))) }),
    }),
    ...(mode.selection.kind === "evidence_conditioned" ? { eligibility: "not_evaluated" } : { eligibility: "canonical_pool_only" }),
    ...(mode.selection.kind === "exact_ordered_questions" ? { exactOrderVerified: true } : {}),
  });
}

async function projectSimulation({ track, registration, createRuntime, simulationConfigResolver }) {
  const profiles = track.simulationProfiles ?? [];
  const configured = CONFIGURED_SIMULATION_TRACK_IDS.has(registration.id);
  if (!configured) {
    if (profiles.length > 0) throw new Error(`Unexpected simulation profile for unconfigured track ${track.trackId}.`);
    if (registration.familyId !== "certification") throw new Error(`Simulation configuration is unknown for ${track.trackId}.`);
    return Object.freeze({ status: "not_configured" });
  }
  if (profiles.length !== 1) throw new Error(`Configured simulation profile is missing or duplicated for ${track.trackId}.`);

  let resolved;
  try { resolved = simulationConfigResolver(track.trackId, profiles); }
  catch { throw new Error(`Configured simulation profile does not match its product mode for ${track.trackId}.`); }
  const { config, profile } = resolved;
  if (!profile || registration.familyId !== config.familyId || profile.profileId !== config.profileId || profile.familyId !== config.familyId || profile.modeId !== config.modeId) {
    throw new Error(`Configured simulation profile identity is invalid for ${track.trackId}.`);
  }
  const sessionId = `canonical-pool-readiness:${track.trackId}`;
  const request = { sessionId, ...(profile.familyId === "certification" ? {} : { scope: { simulationProfileId: profile.profileId } }) };
  let prepared;
  try {
    const runtime = createRuntime(track);
    prepared = await runtime.prepare({ trackId: track.trackId, modeId: config.modeId, request, attempts: [], reviews: [], now: SIMULATION_NOW });
    await runtime.validateResume({ session: prepared.session, draft: prepared.draft });
  } catch {
    throw new Error(`Configured simulation preparation or resume validation failed for ${track.trackId}/${config.modeId}.`);
  }

  const session = prepared?.session;
  if (!session || session.status !== "active" || session.id !== sessionId || session.trackId !== track.trackId || session.modeId !== config.modeId
    || !Array.isArray(session.itemOrder) || session.actualLength !== session.itemOrder.length || session.requestedLength !== session.actualLength
    || session.actualLength <= 0 || prepared.firstOccurrence?.questionId !== session.itemOrder[0]?.item?.questionId) {
    throw new Error(`Configured simulation prepared an invalid session shape for ${track.trackId}/${config.modeId}.`);
  }
  const itemIds = session.itemOrder.map((entry) => entry?.item?.questionId);
  if (itemIds.some((id) => typeof id !== "string" || !id.trim()) || new Set(itemIds).size !== itemIds.length) {
    throw new Error(`Configured simulation prepared empty or duplicate item references for ${track.trackId}/${config.modeId}.`);
  }
  for (const occurrence of session.itemOrder) {
    const item = occurrence.item;
    if (item.trackId !== track.trackId || item.contentVersion !== track.contentVersion || item.artifactSha256 !== track.artifactSha256
      || track.getQuestion(item.questionId)?.questionId !== item.questionId) {
      throw new Error(`Configured simulation prepared a foreign pin or item reference for ${track.trackId}/${config.modeId}.`);
    }
  }

  if (profile.familyId === "coding_interview") {
    if (session.actualLength !== 40 || !sameOrderedIds(itemIds, profile.familyConfig.eligibleQuestionIds)) {
      throw new Error(`Coding simulation order does not match its configured profile for ${track.trackId}.`);
    }
    return Object.freeze({ status: "configured", modeId: config.modeId, preparedQuestionCount: session.actualLength, profileOrderVerified: true });
  }
  if (profile.familyId === "design_interview") {
    if (session.actualLength !== 1 || !Array.isArray(profile.familyConfig.stages) || profile.familyConfig.stages.length === 0) {
      throw new Error(`Design simulation anchor or stages are invalid for ${track.trackId}.`);
    }
    return Object.freeze({ status: "configured", modeId: config.modeId, shape: "staged_case_anchor", anchorCount: session.actualLength, stageCount: profile.familyConfig.stages.length });
  }
  if (profile.familyId !== "certification" || track.trackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID || session.actualLength !== 50
    || profile.familyConfig.blueprint.kind !== "weighted_sections") {
    throw new Error(`Certification simulation plan is invalid for ${track.trackId}.`);
  }
  const domainCounts = countBy(session.itemOrder.map((entry) => track.getQuestion(entry.item.questionId)), (question) => question?.contentDomainId);
  const expectedDomains = profile.familyConfig.blueprint.sections.map((section) => section.contentDomainId);
  if (domainCounts.size !== expectedDomains.length || expectedDomains.some((domain) => !domainCounts.has(domain))) {
    throw new Error(`Certification simulation prepared domain membership is invalid for ${track.trackId}.`);
  }
  return Object.freeze({
    status: "configured",
    modeId: config.modeId,
    preparedQuestionCount: session.actualLength,
    preparedQuestionsByContentDomain: Object.freeze(profile.familyConfig.blueprint.sections.map((section) => Object.freeze({ contentDomainId: section.contentDomainId, questionCount: domainCounts.get(section.contentDomainId) }))),
  });
}

function countBy(values, getKey) {
  const counts = new Map();
  for (const value of values) {
    const key = getKey(value);
    if (typeof key !== "string" || !key.trim()) throw new Error("Canonical pool grouping key is unavailable.");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function sameOrderedIds(left, right) {
  return Array.isArray(right) && left.length === right.length && left.every((id, index) => id === right[index]);
}

function compareAscii(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function main() {
  try {
    await writeCanonicalPoolReadinessReport();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Canonical pool readiness report failed.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void main();
