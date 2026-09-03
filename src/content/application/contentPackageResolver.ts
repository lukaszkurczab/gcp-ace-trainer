import type {
  ContentPackageErrorCode,
  ContentPackagePin,
  ContentPackageRequest,
  ContentPackageRuntime,
  ContentPackageSource,
  ContentPackageTrustRecord,
  ContentPackageFamilyId,
  VerifiedContentPackage,
  VerifiedPackageMode,
} from "../contracts";
import { ContentError } from "../errors";
import { ALGORITHM_MODES } from "../../tracks/coding-interview/domain/algorithmModes";
import { CERTIFICATION_MODES } from "../../tracks/certification/domain/certificationModes";
import { DESIGN_INTERVIEW_MODE_IDS } from "../../tracks/design-interview/designModes";
import { BUNDLED_CONTENT_PACKAGE_TRUST_INDEX } from "./bundledContentPackageTrustIndex";

/** Resolves only immutable whole-node package bytes; it has no lifecycle or cache ownership. */
export class ContentPackageResolver {
  constructor(
    private readonly sources: readonly ContentPackageSource[],
    private readonly runtime: ContentPackageRuntime,
    private readonly trustIndex: readonly ContentPackageTrustRecord[] = BUNDLED_CONTENT_PACKAGE_TRUST_INDEX,
    private readonly retainedSources: readonly ContentPackageSource[] = [],
  ) {}

  async resolveForPreparation(request: ContentPackageRequest): Promise<VerifiedContentPackage> {
    const candidates = this.sources.filter((candidate) => candidate.trackId === request.trackId);
    if (candidates.length === 0) fail("package_pin_not_found", `No package source exists for ${request.trackId}.`);
    const verifiedCandidates = await Promise.all(candidates.map((candidate) => verify(candidate, request.appVersion, this.runtime, this.trustIndex, request.familyId)));
    const verified = verifiedCandidates.find((candidate) => candidate.freeNodeId === request.freeNodeId);
    if (!verified) fail("package_pin_not_found", `No package source exists for ${request.trackId}/${request.freeNodeId}.`);
    if (!verified.profile.modes.some((mode) => mode.modeId === request.modeId)) fail("package_mode_unavailable", `Mode ${request.modeId} is excluded from ${verified.packagePin.packageIdentity}.`);
    return verified;
  }

  async resolveForDiscovery(trackId: string, familyId: ContentPackageFamilyId, appVersion: string): Promise<VerifiedContentPackage> {
    const candidates = this.sources.filter((candidate) => candidate.trackId === trackId);
    if (candidates.length !== 1) fail("package_pin_not_found", `Track ${trackId} must have exactly one bundled Free package.`);
    return verify(candidates[0]!, appVersion, this.runtime, this.trustIndex, familyId);
  }

  async resolveExact(pin: ContentPackagePin, appVersion: string): Promise<VerifiedContentPackage> {
    const sameVersion = [...this.sources, ...this.retainedSources].filter((candidate) => candidate.packageVersion === pin.packageVersion);
    if (sameVersion.length === 0) fail("package_pin_not_found", `No exact package version exists for ${pin.packageIdentity}.`);
    const source = sameVersion.find((candidate) => candidate.packageSha256 === pin.packageIdentity);
    if (!source) fail("package_pin_mismatch", `No exact outer-byte package identity exists for ${pin.packageVersion}.`);
    const verified = await verify(source, appVersion, this.runtime, this.trustIndex);
    if (verified.packagePin.packageIdentity !== pin.packageIdentity || verified.packagePin.packageVersion !== pin.packageVersion || verified.packagePin.contentReleaseId !== pin.contentReleaseId) {
      fail("package_pin_mismatch", `Package pin does not match the verified package release.`);
    }
    return verified;
  }
}

export function createContentPackageResolver(sources: readonly ContentPackageSource[], runtime: ContentPackageRuntime, trustIndex: readonly ContentPackageTrustRecord[] = BUNDLED_CONTENT_PACKAGE_TRUST_INDEX, retainedSources: readonly ContentPackageSource[] = []): ContentPackageResolver {
  return new ContentPackageResolver(sources, runtime, trustIndex, retainedSources);
}

async function verify(source: ContentPackageSource, appVersion: string, runtime: ContentPackageRuntime, trustIndex: readonly ContentPackageTrustRecord[], expectedFamilyId?: ContentPackageFamilyId, expectedFreeNodeId?: string): Promise<VerifiedContentPackage> {
  if (!nonEmpty(source.trackId) || !nonEmpty(source.packageVersion) || !nonEmpty(source.packageBytes) || !sha(source.packageSha256) || !Number.isSafeInteger(source.packageSize) || source.packageSize !== source.packageBytes.length || !uniqueStrings(source.profileModes)) {
    fail("package_record_invalid", "Package source record is malformed.");
  }
  if (await runtime.sha256Utf8(source.packageBytes) !== source.packageSha256) fail("package_outer_integrity_failed", "Package outer bytes do not match their checksum.");
  const trusted = trustIndex.find((entry) => entry.packageIdentity === source.packageSha256);
  if (!trusted || trusted.packageBytes !== source.packageBytes) fail("package_outer_integrity_failed", "Package outer bytes are absent from the trusted immutable package index.");
  const outer = parse(source.packageBytes, "package_schema_invalid");
  exactKeys(outer, ["manifest", "payloadGzipBase64", "schemaVersion"], "package_schema_invalid");
  if (outer.schemaVersion !== "bundled-free-node-v2" || !record(outer.manifest) || !nonEmpty(outer.payloadGzipBase64)) fail("package_schema_invalid", "Package envelope is unsupported.");
  const manifest = outer.manifest;
  const required = ["assetCount", "bundleKind", "contentVersion", "familyId", "freeNodeId", "itemCount", "minimumAppVersion", "modeIds", "packageVersion", "payloadCanonicalSha256", "payloadCompressedSha256", "payloadCompressedSize", "payloadCompression", "payloadSchemaVersion", "payloadUncompressedSize", "profileId", "profileVersion", "provenance", "taxonomyVersion", "trackId"];
  exactKeys(manifest, required, "package_schema_invalid");
  if (manifest.bundleKind !== "bundled_free_node" || manifest.packageVersion !== source.packageVersion || !isFamilyId(manifest.familyId) || manifest.payloadCompression !== "gzip-level-9-mtime-0-v1" || manifest.payloadSchemaVersion !== "bundled-free-node-payload-v2" || !nonEmpty(manifest.contentVersion) || !nonEmpty(manifest.taxonomyVersion) || !nonEmpty(manifest.minimumAppVersion) || !sha(manifest.payloadCanonicalSha256) || !sha(manifest.payloadCompressedSha256) || !positive(manifest.payloadCompressedSize) || !positive(manifest.payloadUncompressedSize) || !uniqueStrings(manifest.modeIds) || !record(manifest.provenance) || !nonEmpty(manifest.provenance.releaseId)) fail("package_schema_invalid", "Package manifest is malformed.");
  const familyId = manifest.familyId;
  if (manifest.trackId !== source.trackId || expectedFamilyId && familyId !== expectedFamilyId || expectedFreeNodeId && manifest.freeNodeId !== expectedFreeNodeId) fail("package_identity_mismatch", "Package manifest identity does not match its exact source and request.");
  if (!versionAtLeast(appVersion, manifest.minimumAppVersion)) fail("package_minimum_app_version", "Package requires a newer app version.");
  const compressed = decodeBase64(outer.payloadGzipBase64, runtime);
  if (compressed.length !== manifest.payloadCompressedSize || await runtime.sha256Bytes(compressed) !== manifest.payloadCompressedSha256) fail("package_compressed_integrity_failed", "Compressed payload does not match the manifest.");
  let payloadBytes: Uint8Array;
  try { payloadBytes = await runtime.gunzip(compressed); } catch { fail("package_payload_invalid", "Package payload cannot be decompressed."); }
  if (payloadBytes!.length !== manifest.payloadUncompressedSize) fail("package_payload_integrity_failed", "Payload size does not match the manifest.");
  let payloadText: string;
  try { payloadText = runtime.decodeUtf8(payloadBytes!); } catch { fail("package_payload_invalid", "Package payload is not valid UTF-8."); }
  if (await runtime.sha256Utf8(payloadText) !== manifest.payloadCanonicalSha256) fail("package_payload_integrity_failed", "Payload checksum does not match the manifest.");
  const payload = parse(payloadText, "package_payload_invalid");
  exactKeys(payload, ["assets", "contentVersion", "familyId", "freeNodeExperienceProfile", "freeNodeId", "items", "modeStructures", "schemaVersion", "taxonomy", "taxonomyVersion", "trackId"], "package_payload_invalid");
  if (payload.schemaVersion !== "bundled-free-node-payload-v2" || payload.trackId !== manifest.trackId || payload.familyId !== manifest.familyId || payload.freeNodeId !== manifest.freeNodeId || payload.contentVersion !== manifest.contentVersion || payload.taxonomyVersion !== manifest.taxonomyVersion || !Array.isArray(payload.items) || !Array.isArray(payload.assets) || payload.items.length !== manifest.itemCount || payload.assets.length !== manifest.assetCount || !record(payload.freeNodeExperienceProfile)) fail("package_identity_mismatch", "Payload identity or inventory does not match the manifest.");
  const itemIds = payload.items.map((item) => record(item) && nonEmpty(item.id) ? item.id : null);
  if (itemIds.some((id) => id === null) || new Set(itemIds).size !== itemIds.length) fail("package_payload_invalid", "Package items are not uniquely identified.");
  validateFamilyItems(payload.items, familyId);
  validateNodeLocalTaxonomy(payload.taxonomy, payload.items, familyId, manifest);
  const assets = await verifiedAssets(payload.assets, runtime);
  const profile = verifiedProfile(payload.freeNodeExperienceProfile, payload.modeStructures, manifest, source.profileModes, familyId, itemIds as string[]);
  // The outer-byte checksum is the only package identity: manifest fields are
  // validated as package contents, never promoted into an identity alias.
  const pin = Object.freeze({ packageIdentity: source.packageSha256, packageVersion: manifest.packageVersion, contentReleaseId: manifest.provenance.releaseId });
  return Object.freeze({ familyId, packagePin: pin, trackId: manifest.trackId, freeNodeId: manifest.freeNodeId, contentVersion: manifest.contentVersion, taxonomyVersion: manifest.taxonomyVersion, minimumAppVersion: manifest.minimumAppVersion, catalog: Object.freeze({ itemIds: Object.freeze(itemIds as string[]), items: cloneFreeze(payload.items), assets }), profile });
}

function validateNodeLocalTaxonomy(taxonomy: unknown, items: unknown[], familyId: ContentPackageFamilyId, manifest: Record<string, unknown>): void {
  if (!record(taxonomy)) fail("package_payload_invalid", "Package taxonomy identity is invalid.");
  if (familyId === "coding_interview") {
    if (taxonomy.trackId !== manifest.trackId || taxonomy.taxonomyVersion !== manifest.taxonomyVersion) fail("package_payload_invalid", "Package taxonomy identity is invalid.");
    if (taxonomy.schemaVersion !== manifest.taxonomyVersion || !Array.isArray(taxonomy.roadmapNodes) || taxonomy.roadmapNodes.length !== 1 || !record(taxonomy.roadmapNodes[0]) || taxonomy.roadmapNodes[0].id !== manifest.freeNodeId || !items.every((item) => record(item) && record(item.taxonomy) && item.taxonomy.roadmapNodeId === manifest.freeNodeId)) fail("package_payload_invalid", "Coding package contains taxonomy outside its Free node.");
    return;
  }
  if (familyId === "design_interview") {
    if (taxonomy.schemaVersion !== "patternly-design-interview-curriculum-v1" || taxonomy.familyId !== familyId || taxonomy.freeNodeId !== manifest.freeNodeId || !nonEmpty(taxonomy.curriculumVersion) || !Array.isArray(taxonomy.nodes) || taxonomy.nodes.length !== 1 || !record(taxonomy.nodes[0]) || taxonomy.nodes[0].nodeId !== manifest.freeNodeId || taxonomy.nodes[0].freeOrPremiumRole !== "free" || !Array.isArray(taxonomy.slots) || taxonomy.slots.length === 0 || !items.every((item) => record(item) && record(item.taxonomy) && item.taxonomy.roadmapNodeId === manifest.freeNodeId)) fail("package_payload_invalid", "Design package contains taxonomy outside its Free node.");
    return;
  }
  if (taxonomy.trackId !== manifest.trackId || taxonomy.taxonomyVersion !== manifest.taxonomyVersion) fail("package_payload_invalid", "Package taxonomy identity is invalid.");
  const legacyNodeLocal = taxonomy.schemaVersion === "taxonomy-config-v1" && Array.isArray(taxonomy.cloudDomains) && taxonomy.cloudDomains.length === 1 && taxonomy.cloudDomains[0] === manifest.freeNodeId && items.every((item) => record(item) && item.domain === manifest.freeNodeId);
  const modernNodeLocal = taxonomy.schemaVersion === "taxonomy-config-v1" && Array.isArray(taxonomy.nodeIds) && taxonomy.nodeIds.length === 1 && taxonomy.nodeIds[0] === manifest.freeNodeId && Array.isArray(taxonomy.tags) && taxonomy.tags.includes(manifest.freeNodeId) && items.every((item) => record(item) && item.nodeId === manifest.freeNodeId);
  if (!legacyNodeLocal && !modernNodeLocal) fail("package_payload_invalid", "Certification package contains taxonomy outside its Free node.");
}

function validateFamilyItems(items: unknown[], familyId: ContentPackageFamilyId): void {
  const feedback = (value: unknown): boolean => record(value) && nonEmpty(value.reason) && record(value.details) && Array.isArray(value.details.blocks) && value.details.blocks.length > 0;
  if (familyId === "coding_interview") {
    if (!items.every((item) => record(item) && nonEmpty(item.prompt) && feedback(item.feedback) && record(item.interaction) && validAlgorithmInteraction(item.interaction))) fail("package_payload_invalid", "Coding package item schema is invalid.");
    return;
  }
  if (familyId === "certification" && !items.every((item) => { if (!record(item) || !nonEmpty(item.question) || !Array.isArray(item.options) || item.options.length < 2 || !item.options.every((option: unknown) => record(option) && nonEmpty(option.id) && nonEmpty(option.text)) || !Array.isArray(item.correctOptionIds) || item.correctOptionIds.length === 0 || !feedback(item.feedback)) return false; const options = item.options as unknown[]; return item.correctOptionIds.every((id: unknown) => typeof id === "string" && options.some((option: unknown) => record(option) && option.id === id)); })) fail("package_payload_invalid", "Certification package item schema is invalid.");
  if (familyId === "design_interview" && !items.every((item) => record(item) && nonEmpty(item.prompt) && feedback(item.feedback) && record(item.interaction) && validDesignInteraction(item.interaction) && record(item.taxonomy) && nonEmpty(item.taxonomy.roadmapNodeId))) fail("package_payload_invalid", "Design package item schema is invalid.");
}
function validAlgorithmInteraction(value: Record<string, unknown>): boolean {
  if (value.type === "choice") { if ((value.selectionMode !== "single" && value.selectionMode !== "multiple") || !Array.isArray(value.options) || value.options.length < 2 || !value.options.every((option: unknown) => record(option) && nonEmpty(option.id) && nonEmpty(option.text)) || !Array.isArray(value.acceptedOptionIds) || value.acceptedOptionIds.length === 0) return false; const options = value.options as unknown[]; return value.acceptedOptionIds.every((id: unknown) => typeof id === "string" && options.some((option: unknown) => record(option) && option.id === id)); }
  if (value.type === "ordering") return Array.isArray(value.elements) && value.elements.length >= 2 && value.elements.every((entry) => record(entry) && nonEmpty(entry.id) && nonEmpty(entry.text)) && Array.isArray(value.canonicalOrder) && value.canonicalOrder.length === value.elements.length;
  return value.type === "complexity" && Array.isArray(value.checkedDimensions) && value.checkedDimensions.length > 0 && record(value.availableValuesByDimension) && record(value.acceptedValuesByDimension);
}

function verifiedProfile(value: Record<string, unknown>, modeStructures: unknown, manifest: Record<string, unknown>, sourceModes: readonly string[], familyId: ContentPackageFamilyId, packageItemIds: readonly string[]) {
  const keys = ["familyId", "freeNodeId", "modes", "primaryEntry", "profileId", "profileVersion", "schemaVersion", "trackId"];
  exactKeys(value, keys, "package_profile_invalid");
  if (value.schemaVersion !== "patternly-free-node-experience-profile-v1" || value.trackId !== manifest.trackId || value.familyId !== manifest.familyId || value.freeNodeId !== manifest.freeNodeId || value.profileId !== manifest.profileId || value.profileVersion !== manifest.profileVersion || !Array.isArray(value.modes) || !record(value.primaryEntry) || !nonEmpty(value.primaryEntry.modeId) || !positive(value.primaryEntry.requestedLength)) fail("package_profile_invalid", "Package profile identity is invalid.");
  if (!record(modeStructures) || !Array.isArray(modeStructures.configurations)) fail("package_profile_invalid", "Package mode structures are missing.");
  const structures = modeStructures.configurations;
  const modes: VerifiedPackageMode[] = value.modes.map((mode) => {
    if (!record(mode) || !nonEmpty(mode.modeId) || !nonEmpty(mode.blueprintModeId) || (mode.availability !== "immediate" && mode.availability !== "evidence_conditioned") || !Array.isArray(mode.requestedLengths) || !mode.requestedLengths.every(positive) || !positive(mode.defaultRequestedLength) || !mode.requestedLengths.includes(mode.defaultRequestedLength)) fail("package_profile_invalid", "Package profile mode is invalid.");
    const structure = structures.find((candidate) => record(candidate) && candidate.modeId === mode.modeId);
    if (!structure || structure.blueprintModeId !== mode.blueprintModeId || structure.availability !== mode.availability || structure.defaultRequestedLength !== mode.defaultRequestedLength || !sameNumbers(structure.requestedLengths, mode.requestedLengths) || !record(structure.selection) || structure.selection.freeNodeId !== manifest.freeNodeId || structure.selection.itemSource !== "package_items" || structure.selection.requireUniqueItemIds !== true) fail("package_profile_invalid", "Profile mode does not match its node-local mode structure.");
    if (familyId === "certification" && mode.modeId === "certification-diagnostic-baseline") validateCertificationDiagnosticMode(mode, structure, manifest.freeNodeId as string, packageItemIds);
    validateCanonicalRunnerMode(familyId, mode, structure);
    return Object.freeze({ modeId: mode.modeId, blueprintModeId: mode.blueprintModeId, availability: mode.availability, requestedLengths: Object.freeze([...mode.requestedLengths]), defaultRequestedLength: mode.defaultRequestedLength });
  });
  const modeIds = modes.map((mode) => mode.modeId);
  const primaryEntry = value.primaryEntry as Record<string, unknown>;
  const primary = modes.find((mode) => mode.modeId === primaryEntry.modeId);
  if (!uniqueStrings(modeIds) || structures.length !== modes.length || !sameSet(modeIds, manifest.modeIds as readonly string[]) || !sameSet(modeIds, sourceModes) || !primary || primary.availability !== "immediate" || !primary.requestedLengths.includes(primaryEntry.requestedLength as number)) fail("package_profile_invalid", "Package profile mode closure is invalid.");
  if (familyId === "coding_interview" && (!Array.isArray(modeStructures.userModeMappings) || modeStructures.userModeMappings.length !== modes.length || !modeStructures.userModeMappings.every((entry) => record(entry) && modes.some((mode) => mode.modeId === entry.userModeId && mode.blueprintModeId === entry.blueprintModeId)))) fail("package_profile_invalid", "Coding package mode mappings are invalid.");
  const configurations = structures.map((structure) => {
    if (!record(structure) || !nonEmpty(structure.configurationId) || !nonEmpty(structure.configurationVersion) || !nonEmpty(structure.modeId) || !nonEmpty(structure.blueprintModeId) || (structure.availability !== "immediate" && structure.availability !== "evidence_conditioned") || !Array.isArray(structure.requestedLengths) || !structure.requestedLengths.every(positive) || !positive(structure.defaultRequestedLength) || !nonEmpty(structure.reinsertPolicy) || !record(structure.selection)) fail("package_profile_invalid", "Package mode configuration is invalid.");
    if (structure.feedbackOptions !== undefined && (!Array.isArray(structure.feedbackOptions) || !structure.feedbackOptions.every(nonEmpty))) fail("package_profile_invalid", "Package feedback configuration is invalid.");
    if (familyId === "coding_interview" && structure.modeId === "coding-interview-custom-practice" && (!sameStrings(structure.feedbackOptions, ["afterEachAnswer", "atSessionEnd"]) || structure.blueprintModeId !== "coding-interview-guided-practice")) fail("package_profile_invalid", "Custom Practice must use exactly the canonical Guided feedback configuration.");
    if (structure.availability === "evidence_conditioned" && (!record(structure.selection) || structure.selection.itemSource !== "package_items" || structure.selection.freeNodeId !== manifest.freeNodeId || structure.selection.emptyEligibility !== "unavailable" || structure.selection.shortening !== "truthful_to_eligible_count" || !Array.isArray(structure.selection.reviewSources) || !structure.selection.reviewSources.every(nonEmpty))) fail("package_profile_invalid", "Evidence-conditioned mode must remain node-local, package-local, truthfully shortened, and explicitly unavailable when empty.");
    if (structure.availability === "evidence_conditioned") {
      const selection = structure.selection;
      const exact = (kind: string, sources: readonly string[], committed?: boolean) => selection.kind === kind && sameStrings(selection.reviewSources, sources) && (committed === undefined || selection.sessionMissesMustBeCommitted === committed);
      if (familyId === "coding_interview" && structure.modeId === "coding-interview-weak-area-review" && !exact("free_node_review_evidence", ["due_queue", "session_misses"], true)) fail("package_profile_invalid", "Coding Weak Area Review policy is not exact.");
      if (familyId === "certification" && structure.modeId === "certification-weak-area-review" && !exact("free_node_review_evidence", ["due_queue"])) fail("package_profile_invalid", "Certification Weak Area Review policy is not exact.");
      if (familyId === "certification" && structure.modeId === "certification-quick-review" && (!exact("due_free_node_review_evidence", ["due_queue"]) || structure.requestedLengths.length !== 1 || structure.defaultRequestedLength !== structure.requestedLengths[0])) fail("package_profile_invalid", "Certification Quick Review policy is not exact.");
      if (familyId === "design_interview" && structure.modeId === "design-interview-weak-area-review" && (!exact("free_node_review_evidence", ["due_queue"]) || structure.defaultRequestedLength !== 10 || !sameNumbers(structure.requestedLengths, [1, 10]))) fail("package_profile_invalid", "Design Weak Area Review policy is not exact.");
    }
    return Object.freeze({ configurationId: structure.configurationId, configurationVersion: structure.configurationVersion, modeId: structure.modeId, blueprintModeId: structure.blueprintModeId, availability: structure.availability, requestedLengths: Object.freeze([...structure.requestedLengths]), defaultRequestedLength: structure.defaultRequestedLength, reinsertPolicy: structure.reinsertPolicy, ...(structure.feedbackOptions === undefined ? {} : { feedbackOptions: Object.freeze([...structure.feedbackOptions]) }), selection: cloneFreeze(structure.selection) });
  });
  return Object.freeze({ profileId: value.profileId as string, profileVersion: value.profileVersion as string, primaryEntry: Object.freeze({ modeId: value.primaryEntry.modeId, requestedLength: value.primaryEntry.requestedLength }), modes: Object.freeze(modes), configurations: Object.freeze(configurations) });
}

function validateCertificationDiagnosticMode(mode: Record<string, unknown>, structure: Record<string, unknown>, freeNodeId: string, packageItemIds: readonly string[]): void {
  if (mode.blueprintModeId !== "certification-diagnostic-baseline" || mode.availability !== "immediate" || !sameNumbers(mode.requestedLengths, [40]) || mode.defaultRequestedLength !== 40 || structure.blueprintModeId !== "certification-diagnostic-baseline" || structure.availability !== "immediate" || !sameNumbers(structure.requestedLengths, [40]) || structure.defaultRequestedLength !== 40 || structure.reinsertPolicy !== "disabled" || !record(structure.selection)) {
    fail("package_profile_invalid", "Certification Diagnostic Baseline must be an immediate fixed 40-item configuration.");
  }
  const selection = structure.selection;
  exactKeys(selection, ["freeNodeId", "itemSource", "requireUniqueItemIds", "kind", "itemIds"], "package_profile_invalid");
  if (selection.freeNodeId !== freeNodeId || selection.itemSource !== "package_items" || selection.requireUniqueItemIds !== true || selection.kind !== "exact_free_node" || !Array.isArray(selection.itemIds) || selection.itemIds.length !== 40 || !selection.itemIds.every(nonEmpty) || new Set(selection.itemIds).size !== 40 || !selection.itemIds.every((itemId: string) => packageItemIds.includes(itemId))) {
    fail("package_profile_invalid", "Certification Diagnostic Baseline must declare 40 unique package item IDs in exact order.");
  }
}

function validateCanonicalRunnerMode(familyId: ContentPackageFamilyId, mode: Record<string, unknown>, structure: Record<string, unknown>): void {
  if (familyId === "coding_interview") {
    const canonical = ALGORITHM_MODES.find((candidate) => candidate.id === mode.modeId);
    const requestedLengths = mode.requestedLengths as readonly number[];
    if (!canonical || canonical.contentBlueprintModeId !== mode.blueprintModeId || !requestedLengths.every((length) => canonical.profile.supportedLengths.includes(length as never)) || !canonical.profile.supportedFeedbackModes.every((feedback) => !Array.isArray(structure.feedbackOptions) || structure.feedbackOptions.includes(feedback)) && Array.isArray(structure.feedbackOptions)) fail("package_profile_invalid", "Coding package mode is not mapped to its canonical runner.");
    return;
  }
  if (familyId === "design_interview") {
    if (!DESIGN_INTERVIEW_MODE_IDS.includes(mode.modeId as typeof DESIGN_INTERVIEW_MODE_IDS[number]) || mode.blueprintModeId !== mode.modeId || mode.defaultRequestedLength !== 10 || !sameNumbers(mode.requestedLengths, [1, 10])) fail("package_profile_invalid", "Design package mode is not mapped to its canonical runner.");
    return;
  }
  const canonical = CERTIFICATION_MODES.find((candidate) => candidate.id === mode.modeId && candidate.enabled);
  if (!canonical || mode.blueprintModeId !== mode.modeId || !positive(mode.defaultRequestedLength) || !Array.isArray(mode.requestedLengths) || !mode.requestedLengths.every(positive) || !mode.requestedLengths.includes(mode.defaultRequestedLength)) fail("package_profile_invalid", "Certification package mode is not mapped to its canonical runner.");
}

function isFamilyId(value: unknown): value is ContentPackageFamilyId {
  return value === "coding_interview" || value === "certification" || value === "design_interview";
}

function validDesignInteraction(value: Record<string, unknown>): boolean {
  if (value.type === "choice") {
    if ((value.selectionMode !== "single" && value.selectionMode !== "multiple") || !Array.isArray(value.options) || value.options.length < 2 || !value.options.every((option) => record(option) && nonEmpty(option.id) && nonEmpty(option.text)) || !Array.isArray(value.acceptedOptionIds) || value.acceptedOptionIds.length === 0) return false;
    const optionIds = new Set((value.options as unknown[]).map((option) => (option as Record<string, unknown>).id));
    return new Set(value.acceptedOptionIds).size === value.acceptedOptionIds.length && value.acceptedOptionIds.every((id) => typeof id === "string" && optionIds.has(id));
  }
  if (value.type === "ordering") return value.scoringMethod === "adjacent_relations" && Array.isArray(value.elements) && value.elements.length >= 2 && value.elements.every((entry) => record(entry) && nonEmpty(entry.id) && nonEmpty(entry.text)) && Array.isArray(value.canonicalOrder) && value.canonicalOrder.length === value.elements.length && new Set(value.canonicalOrder).size === value.canonicalOrder.length && value.canonicalOrder.every((id) => typeof id === "string" && (value.elements as unknown[]).some((entry) => record(entry) && entry.id === id));
  if (value.type === "decision_matrix") return value.scoringMethod === "dimension_exact" && Array.isArray(value.dimensions) && value.dimensions.length > 0 && value.dimensions.every((dimension) => record(dimension) && nonEmpty(dimension.dimensionId) && nonEmpty(dimension.label) && Array.isArray(dimension.values) && dimension.values.length >= 2 && dimension.values.every((entry) => record(entry) && nonEmpty(entry.valueId) && nonEmpty(entry.text)) && Array.isArray(dimension.acceptedValueIds) && dimension.acceptedValueIds.length > 0 && dimension.acceptedValueIds.every((id) => typeof id === "string" && (dimension.values as unknown[]).some((entry) => record(entry) && entry.valueId === id)));
  return false;
}

async function verifiedAssets(value: unknown[], runtime: ContentPackageRuntime) {
  const assets = [] as Array<Readonly<{ id: string; mediaType: string; bytesBase64: string; sha256: string }>>;
  for (const asset of value) {
    if (!record(asset) || !nonEmpty(asset.id) || !nonEmpty(asset.mediaType) || !nonEmpty(asset.bytesBase64) || !sha(asset.sha256)) fail("package_payload_invalid", "Package asset is malformed.");
    const bytes = decodeBase64(asset.bytesBase64, runtime);
    if (await runtime.sha256Bytes(bytes) !== asset.sha256) fail("package_payload_integrity_failed", "Package asset checksum does not match.");
    assets.push(Object.freeze({ id: asset.id, mediaType: asset.mediaType, bytesBase64: asset.bytesBase64, sha256: asset.sha256 }));
  }
  if (new Set(assets.map((asset) => asset.id)).size !== assets.length) fail("package_payload_invalid", "Package assets are not uniquely identified.");
  return Object.freeze(assets);
}

function parse(value: string, code: ContentPackageErrorCode): Record<string, unknown> { try { const parsed: unknown = JSON.parse(value); if (record(parsed)) return parsed; } catch {} fail(code, "Package JSON is invalid."); }
function decodeBase64(value: string, runtime: ContentPackageRuntime): Uint8Array { try { if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value)) fail("package_payload_invalid", "Package base64 is invalid."); const decoded = runtime.decodeBase64(value); if (decoded.length > 0) return decoded; } catch {} fail("package_payload_invalid", "Package base64 is invalid."); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[], code: ContentPackageErrorCode): void { if (Object.keys(value).length !== keys.length || !Object.keys(value).every((key) => keys.includes(key))) fail(code, "Package object keys are invalid."); }
function record(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function sha(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function positive(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function uniqueStrings(value: unknown): value is readonly string[] { return Array.isArray(value) && value.length > 0 && value.every(nonEmpty) && new Set(value).size === value.length; }
function sameSet(left: readonly string[], right: readonly string[]): boolean { return left.length === right.length && left.every((value) => right.includes(value)); }
function sameNumbers(left: unknown, right: unknown): boolean { return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index]); }
function sameStrings(left: unknown, right: readonly string[]): boolean { return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]); }
function cloneFreeze<T>(value: T): T { if (Array.isArray(value)) return Object.freeze(value.map((entry) => cloneFreeze(entry))) as T; if (record(value)) return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneFreeze(entry)]))) as T; return value; }
function versionAtLeast(actual: string, required: string): boolean { const parseVersion = (value: string) => /^([0-9]+)\.([0-9]+)\.([0-9]+)$/u.exec(value)?.slice(1).map(Number); const a = parseVersion(actual); const b = parseVersion(required); if (!a || !b) fail("package_schema_invalid", "Package version is not semantic versioning."); return a[0]! > b[0]! || a[0] === b[0] && (a[1]! > b[1]! || a[1] === b[1] && a[2]! >= b[2]!); }
function fail(code: ContentPackageErrorCode, message: string): never { throw new ContentError(message, code); }
