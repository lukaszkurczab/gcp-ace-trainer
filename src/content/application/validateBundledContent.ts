import { ALGORITHM_MODES, getAlgorithmContentBlueprintModeId, isAlgorithmModeId } from "../../tracks/algorithms/domain/algorithmModes";
import { CERTIFICATION_MODES } from "../../tracks/cloud-certification/domain/certificationModes";
import { getContentFamilyHandler } from "../../tracks/contentFamilyHandlers";
import { getTracks, type TrackRegistration } from "../../domain/tracks";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { clearInstalledContentCatalogs } from "../catalogRepository";
import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../bundled";
import type {
  BundledContentRelease,
  BundledTrackArtifactReference,
  PublishedArtifactEnvelope,
} from "../contracts";

export const BUNDLED_CONTENT_CONSUMER_VERSION = 1 as const;

export const CONTENT_UNAVAILABLE_REASONS = [
  "missing_artifact",
  "invalid_envelope",
  "checksum_mismatch",
  "schema_mismatch",
  "version_mismatch",
  "insufficient_fixed_pool",
  "unsupported_interaction",
  "invalid_taxonomy_reference",
  "declared_mode_unsupported",
] as const;

export type ContentUnavailableReason = (typeof CONTENT_UNAVAILABLE_REASONS)[number];
export type AvailableBundledTrack = Readonly<{
  kind: "available";
  trackId: string;
  familyId: string;
  contentVersion: string;
  taxonomyVersion: string;
  schemaVersion: "published-bank-v1";
  checksumSha256: string;
  sourceRepositoryCommit: string;
  declaredModes: readonly string[];
  itemIds: readonly string[];
}>;
export type UnavailableBundledTrack = Readonly<{
  kind: "unavailable";
  trackId: string;
  familyId: string;
  reason: ContentUnavailableReason;
  detail: string;
}>;
export type BundledTrackAvailability = AvailableBundledTrack | UnavailableBundledTrack;
export type BundledContentValidationResult = Readonly<{
  consumerVersion: 1;
  tracks: readonly BundledTrackAvailability[];
}>;

let latestResult: BundledContentValidationResult = Object.freeze({ consumerVersion: 1, tracks: Object.freeze([]) });

/** Validates exact build-time bytes and installs only independently valid track catalogs. */
export async function validateBundledContent(
  release: unknown = GENERATED_BUNDLED_CONTENT_RELEASE,
  registrations: readonly TrackRegistration[] = getTracks(),
): Promise<BundledContentValidationResult> {
  const rootFailure = validateReleaseEnvelope(release);
  if (rootFailure) return publish(registrations.map((track) => unavailable(track, "invalid_envelope", rootFailure)), []);
  const typedRelease = release as BundledContentRelease;
  const references = new Map<string, BundledTrackArtifactReference>();
  for (const reference of typedRelease.artifacts) {
    if (!isRecord(reference) || typeof reference.trackId !== "string") {
      return publish(registrations.map((track) => unavailable(track, "invalid_envelope", "Artifact reference is not an object with a track identity.")), []);
    }
    if (references.has(reference.trackId)) {
      return publish(registrations.map((track) => unavailable(track, "invalid_envelope", `Duplicate artifact reference for ${reference.trackId}.`)), []);
    }
    references.set(reference.trackId, reference);
  }

  const validated: Array<Readonly<{ availability: BundledTrackAvailability; payload: unknown; reference: BundledTrackArtifactReference }>> = [];
  const unavailableTracks: BundledTrackAvailability[] = [];
  for (const track of registrations) {
    const reference = references.get(track.id);
    if (!reference) {
      unavailableTracks.push(unavailable(track, "missing_artifact", `No pinned artifact is bundled for ${track.id}.`));
      continue;
    }
    const outcome = await validateTrackArtifact(track, reference, typedRelease.manifest.sourceRepositoryCommit);
    if (outcome.kind === "unavailable") unavailableTracks.push(outcome);
    else validated.push(outcome);
  }
  return publish([...validated.map((entry) => entry.availability), ...unavailableTracks], validated);
}

/** Explicit projection for selection and preparation; no missing track affects another track. */
export function getBundledContentAvailability(trackId: string): BundledTrackAvailability {
  return latestResult.tracks.find((track) => track.trackId === trackId) ?? Object.freeze({
    kind: "unavailable", trackId, familyId: "unknown", reason: "missing_artifact", detail: `No validated artifact is installed for ${trackId}.`,
  });
}

export function requireBundledTrackMode(trackId: string, modeId: string): AvailableBundledTrack {
  const track = getBundledContentAvailability(trackId);
  if (track.kind !== "available") throw new Error(`Content unavailable for ${trackId}: ${track.reason}.`);
  const declaredModeId = trackId === "algorithms" && isAlgorithmModeId(modeId)
    ? getAlgorithmContentBlueprintModeId(modeId)
    : modeId;
  if (!track.declaredModes.includes(declaredModeId)) throw new Error(`Content unavailable for ${trackId}: declared_mode_unsupported.`);
  return track;
}

function validateReleaseEnvelope(value: unknown): string | null {
  if (!isRecord(value) || !hasExactKeys(value, ["manifest", "artifacts"]) || !isRecord(value.manifest) || !hasExactKeys(value.manifest, ["envelopeVersion", "releaseId", "sourceRepositoryCommit"]) ||
    value.manifest.envelopeVersion !== 1 || !nonEmpty(value.manifest.releaseId) || !commit(value.manifest.sourceRepositoryCommit) || !Array.isArray(value.artifacts)) {
    return "Bundled release manifest is invalid.";
  }
  return null;
}

async function validateTrackArtifact(
  track: TrackRegistration,
  reference: BundledTrackArtifactReference,
  releaseSourceRepositoryCommit: string,
): Promise<UnavailableBundledTrack | Readonly<{ kind: "available"; availability: AvailableBundledTrack; payload: unknown; reference: BundledTrackArtifactReference }>> {
  const invalid = validateReference(track, reference);
  if (invalid) return unavailable(track, "invalid_envelope", invalid);
  if (reference.sourceRepositoryCommit !== releaseSourceRepositoryCommit) {
    return unavailable(track, "invalid_envelope", "Artifact source commit does not match the pinned release manifest.");
  }
  if (reference.trackId !== track.id || reference.familyId !== track.familyId) {
    return unavailable(track, "invalid_taxonomy_reference", "Artifact track/family identity does not match the canonical registry.");
  }
  const supportedModes = modesFor(track.familyId);
  if (!supportedModes || reference.declaredModes.some((mode) => !supportedModes.has(mode))) {
    return unavailable(track, "declared_mode_unsupported", "Artifact declares a mode unsupported by its family runtime.");
  }
  const actualChecksum = await contentHasher.sha256(reference.artifactBytes);
  if (actualChecksum !== reference.checksumSha256) {
    return unavailable(track, "checksum_mismatch", "Pinned artifact bytes do not match their SHA-256 checksum.");
  }
  const artifact = parseArtifact(reference.artifactBytes);
  if (!artifact) return unavailable(track, "invalid_envelope", "Pinned artifact bytes are not a JSON object.");
  if (artifact.envelopeVersion !== 1 || artifact.schemaVersion !== "published-bank-v1") {
    return unavailable(track, "schema_mismatch", "Artifact schema version is unsupported.");
  }
  if (artifact.contentVersion !== reference.contentVersion || artifact.taxonomyVersion !== reference.taxonomyVersion) {
    return unavailable(track, "version_mismatch", "Artifact versions do not match the pinned track reference.");
  }
  const itemIds = getItemIds(artifact.bank);
  if (!itemIds) return unavailable(track, "invalid_envelope", "Artifact has no unique item identities.");
  try {
    const handler = getContentFamilyHandler(track.familyId);
    handler.validate(artifact.bank, { formatVersion: 1, trackId: track.id, familyId: track.familyId, contentVersion: reference.contentVersion, itemCount: itemIds.length, bankPath: "bundled:immutable", sha256: reference.checksumSha256 });
    if (track.familyId === "algorithms") {
      const algorithmBank = isRecord(artifact.bank) ? artifact.bank : null;
      const blueprintModes = algorithmBank && Array.isArray(algorithmBank.practiceBlueprints) ? new Set(algorithmBank.practiceBlueprints.filter(isRecord).map((blueprint) => blueprint.modeId).filter(nonEmpty)) : new Set<string>();
      if (reference.declaredModes.some((mode) => !blueprintModes.has(mode))) {
        return unavailable(track, "declared_mode_unsupported", "Algorithms artifact declares a mode without a validated practice blueprint.");
      }
    }
  } catch {
    return unavailable(track, contentValidationFailureReason(track, artifact.bank), "Artifact payload is invalid.");
  }
  return Object.freeze({
    kind: "available",
    availability: Object.freeze({ kind: "available", trackId: track.id, familyId: track.familyId, contentVersion: reference.contentVersion, taxonomyVersion: reference.taxonomyVersion, schemaVersion: reference.schemaVersion, checksumSha256: reference.checksumSha256, sourceRepositoryCommit: reference.sourceRepositoryCommit, declaredModes: Object.freeze([...reference.declaredModes]), itemIds: Object.freeze([...itemIds]) }),
    payload: artifact.bank,
    reference,
  });
}

function publish(
  tracks: readonly BundledTrackAvailability[],
  installable: readonly Readonly<{ availability: BundledTrackAvailability; payload: unknown; reference: BundledTrackArtifactReference }>[],
): BundledContentValidationResult {
  clearInstalledContentCatalogs();
  for (const entry of installable) {
    if (entry.availability.kind === "available") getContentFamilyHandler(entry.availability.familyId).install(entry.payload, { formatVersion: 1, trackId: entry.availability.trackId, familyId: entry.availability.familyId, contentVersion: entry.availability.contentVersion, itemCount: entry.availability.itemIds.length, bankPath: "bundled:immutable", sha256: entry.reference.checksumSha256 });
  }
  latestResult = Object.freeze({ consumerVersion: BUNDLED_CONTENT_CONSUMER_VERSION, tracks: Object.freeze([...tracks]) });
  return latestResult;
}

function validateReference(track: TrackRegistration, reference: unknown): string | null {
  if (!isRecord(reference) || !hasExactKeys(reference, ["trackId", "familyId", "contentVersion", "taxonomyVersion", "schemaVersion", "checksumSha256", "sourceRepositoryCommit", "declaredModes", "artifactBytes"]) ||
    !nonEmpty(reference.trackId) || !nonEmpty(reference.familyId) || !nonEmpty(reference.contentVersion) || !nonEmpty(reference.taxonomyVersion) || reference.schemaVersion !== "published-bank-v1" || !sha256(reference.checksumSha256) || !commit(reference.sourceRepositoryCommit) || !Array.isArray(reference.declaredModes) || reference.declaredModes.length === 0 || !reference.declaredModes.every(nonEmpty) || new Set(reference.declaredModes).size !== reference.declaredModes.length || typeof reference.artifactBytes !== "string") {
    return `Artifact reference for ${track.id} is malformed.`;
  }
  return null;
}

function parseArtifact(bytes: string): PublishedArtifactEnvelope | null {
  try {
    const value: unknown = JSON.parse(bytes);
    if (!isRecord(value) || !hasExactKeys(value, ["envelopeVersion", "schemaVersion", "contentVersion", "taxonomyVersion", "bank"]) || value.envelopeVersion !== 1 || typeof value.schemaVersion !== "string" || !nonEmpty(value.contentVersion) || !nonEmpty(value.taxonomyVersion)) return null;
    return value as PublishedArtifactEnvelope;
  } catch { return null; }
}

function getItemIds(bank: unknown): readonly string[] | null {
  if (!isRecord(bank) || !Array.isArray(bank.items) || !bank.items.every((item) => isRecord(item) && nonEmpty(item.id))) return null;
  const ids = bank.items.map((item) => (item as Record<string, unknown>).id as string);
  return new Set(ids).size === ids.length ? ids : null;
}

function modesFor(familyId: string): ReadonlySet<string> | null {
  if (familyId === "algorithms") return new Set(ALGORITHM_MODES.map((mode) => mode.id));
  if (familyId === "certification") return new Set(CERTIFICATION_MODES.filter((mode) => mode.enabled).map((mode) => mode.id));
  return null;
}
function unavailable(track: Pick<TrackRegistration, "id" | "familyId">, reason: ContentUnavailableReason, detail: string): UnavailableBundledTrack {
  return Object.freeze({ kind: "unavailable", trackId: track.id, familyId: track.familyId, reason, detail });
}
function contentValidationFailureReason(track: TrackRegistration, bank: unknown): ContentUnavailableReason {
  if (track.familyId !== "algorithms" || !isRecord(bank)) return "invalid_taxonomy_reference";
  const items = Array.isArray(bank.items) ? bank.items : [];
  if (items.some((item) => !isRecord(item) || !isRecord(item.interaction) || !["choice", "ordering", "complexity"].includes(item.interaction.type as string))) return "unsupported_interaction";
  const blueprints = Array.isArray(bank.practiceBlueprints) ? bank.practiceBlueprints : [];
  const simulation = blueprints.find((entry) => isRecord(entry) && entry.modeId === "algorithms-interview-simulation");
  const poolId = isRecord(simulation) && isRecord(simulation.composition) && Array.isArray(simulation.composition.ids) ? simulation.composition.ids[0] : null;
  const pools = Array.isArray(bank.simulationPools) ? bank.simulationPools : [];
  const pool = pools.find((entry) => isRecord(entry) && entry.poolId === poolId);
  if (isRecord(pool) && Array.isArray(pool.itemIds) && pool.itemIds.length < 40) return "insufficient_fixed_pool";
  return "invalid_taxonomy_reference";
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { return Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key)); }
function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function sha256(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
function commit(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{40}$/.test(value); }
