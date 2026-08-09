import type { VerifiedContentPackage, VerifiedPackageMode, VerifiedPackageModeConfiguration } from "../contracts";
import type { AlgorithmRuntimeCatalog } from "../../tracks/coding-interview/algorithmContentCatalog";
import type { AlgorithmQuestion } from "../../tracks/coding-interview/algorithmQuestionTypes";
import type { CertificationRuntimeCatalog } from "../../tracks/certification/certificationContentCatalog";
import type { CertificationQuestion } from "../../tracks/certification/domain";
import type { PublishedAlgorithmsPracticeBlueprint, PublishedCertificationFocusPractice, PublishedCertificationQuickReview, PublishedCertificationWeakAreaReview } from "../contracts";

export type PackageCatalogProfileAdapter = Readonly<{
  familyId: "coding_interview" | "certification";
  packagePin: VerifiedContentPackage["packagePin"];
  trackId: string;
  freeNodeId: string;
  contentVersion: string;
  taxonomyVersion: string;
  itemIds: readonly string[];
  items: readonly unknown[];
  assets: VerifiedContentPackage["catalog"]["assets"];
  primaryEntry: VerifiedContentPackage["profile"]["primaryEntry"];
  modes: readonly VerifiedPackageMode[];
  configurations: readonly VerifiedPackageModeConfiguration[];
  getMode(modeId: string): VerifiedPackageMode;
  getConfiguration(modeId: string): VerifiedPackageModeConfiguration;
  getItemById(itemId: string): unknown;
}>;

/**
 * The only bridge from verified package bytes to family runners.  It intentionally
 * exposes neither a whole-track bank nor any configuration outside the package.
 */
export function createPackageCatalogProfileAdapter(pkg: VerifiedContentPackage): PackageCatalogProfileAdapter {
  pkg = cloneFreeze(pkg);
  const itemsById = new Map(pkg.catalog.items.map((item) => [itemId(item), item]));
  if (itemsById.size !== pkg.catalog.itemIds.length || pkg.catalog.itemIds.some((id) => !itemsById.has(id))) throw new Error("Verified package catalog is not closed over its item identities.");
  const modeIds = new Set(pkg.profile.modes.map((mode) => mode.modeId));
  if (pkg.profile.configurations.some((configuration) => !modeIds.has(configuration.modeId))) throw new Error("Verified package configuration is outside its closed profile.");
  const unavailable = (kind: string, id: string): never => { throw new Error(`${kind} ${id} is unavailable in package ${pkg.packagePin.packageIdentity}.`); };
  return Object.freeze({
    familyId: pkg.familyId, packagePin: pkg.packagePin, trackId: pkg.trackId, freeNodeId: pkg.freeNodeId,
    contentVersion: pkg.contentVersion, taxonomyVersion: pkg.taxonomyVersion, itemIds: pkg.catalog.itemIds,
    items: pkg.catalog.items, assets: pkg.catalog.assets, primaryEntry: pkg.profile.primaryEntry,
    modes: pkg.profile.modes, configurations: pkg.profile.configurations,
    getMode: (modeId) => pkg.profile.modes.find((mode) => mode.modeId === modeId) ?? unavailable("Mode", modeId),
    getConfiguration: (modeId) => pkg.profile.configurations.find((configuration) => configuration.modeId === modeId) ?? unavailable("Configuration", modeId),
    getItemById: (itemId) => itemsById.get(itemId) ?? unavailable("Item", itemId),
  });
}

export function createCodingPackageRuntimeCatalog(pkg: Extract<VerifiedContentPackage, Readonly<{ familyId: "coding_interview" }>>): AlgorithmRuntimeCatalog {
  const adapter = createPackageCatalogProfileAdapter(pkg); const items = adapter.items as readonly AlgorithmQuestion[];
  const blueprint = (modeId: string): PublishedAlgorithmsPracticeBlueprint | undefined => {
    const configuration = pkg.profile.configurations.find((entry) => entry.blueprintModeId === modeId);
    return configuration ? Object.freeze({ blueprintId: configuration.configurationId, blueprintVersion: configuration.configurationVersion, modeId, requestedLengths: configuration.requestedLengths, defaultRequestedLength: configuration.defaultRequestedLength, shortening: "allowed", minimumActualLength: 1, composition: Object.freeze({ kind: "item_ids", ids: adapter.itemIds }), resolvedItemIds: adapter.itemIds }) : undefined;
  };
  const unavailable = (capability: string): never => { throw new Error(`${capability} is unavailable in package ${adapter.packagePin.packageIdentity}.`); };
  return Object.freeze({ getContentVersion: () => adapter.contentVersion, getItems: () => items, getItemsForMentalUnit: (id: string) => items.filter((item) => item.taxonomy.primaryMentalUnitId === id), getItemById: (id: string) => adapter.getItemById(id) as AlgorithmQuestion, toContentItemRef: (item: AlgorithmQuestion) => ({ contentVersion: adapter.contentVersion, itemId: item.id, trackId: adapter.trackId }), getPracticeBlueprint: blueprint, assertModeAvailable: (modeId: string, requestedLength: number) => { const mode = adapter.getMode(modeId); if (!mode.requestedLengths.includes(requestedLength)) throw new Error(`Algorithms mode ${modeId} is unavailable for ${requestedLength} items in this package.`); }, getCompatibilitySets: () => Object.freeze([]), getCompatibilitySet: () => undefined, getRecognitionSets: () => unavailable("Recognition sets"), getContrastSets: () => unavailable("Contrast sets"), getInterleavedScopes: () => unavailable("Interleaved scopes"), getSimulationPool: () => undefined, getSimulationProfile: () => undefined });
}

export function createCertificationPackageRuntimeCatalog(pkg: Extract<VerifiedContentPackage, Readonly<{ familyId: "certification" }>>): CertificationRuntimeCatalog {
  const adapter = createPackageCatalogProfileAdapter(pkg); const items = adapter.items as readonly CertificationQuestion[];
  const config = (modeId: string) => adapter.getConfiguration(modeId);
  const focus = (): PublishedCertificationFocusPractice => { const entry = config("certification-focus-practice"); return Object.freeze({ blueprintId: entry.configurationId, blueprintVersion: entry.configurationVersion, modeId: "certification-focus-practice", requestedLengths: entry.requestedLengths as readonly (10 | 20 | 40)[], shortening: "allowed_within_topic", selectionScope: "cloud_domain", topicIds: Object.freeze([adapter.freeNodeId]) }); };
  const weak = (): PublishedCertificationWeakAreaReview => { const entry = config("certification-weak-area-review"); return Object.freeze({ blueprintId: entry.configurationId, blueprintVersion: entry.configurationVersion, modeId: "certification-weak-area-review", requestedLengths: entry.requestedLengths as readonly (10 | 20)[], shortening: "allowed_within_eligible_review_evidence", selectionScope: "eligible_due_review_evidence", persistentResolutionPolicy: "two_consecutive_due_review_successes" }); };
  const quick = (): PublishedCertificationQuickReview => { const entry = config("certification-quick-review"); return Object.freeze({ blueprintId: entry.configurationId, blueprintVersion: entry.configurationVersion, modeId: "certification-quick-review", maximumLength: entry.defaultRequestedLength as 10, shortening: "allowed_within_eligible_review_evidence", selectionScope: "eligible_due_review_evidence", persistentResolutionPolicy: "two_consecutive_due_review_successes" }); };
  const unavailable = (mode: string): never => { throw new Error(`Certification mode ${mode} is unavailable in package ${adapter.packagePin.packageIdentity}.`); };
  return Object.freeze({ getContentVersion: () => adapter.contentVersion, getItems: () => items, getItemsForMode: () => items, getItemById: (id: string) => adapter.getItemById(id) as CertificationQuestion, toContentItemRef: (item: CertificationQuestion) => ({ contentVersion: adapter.contentVersion, itemId: item.id, trackId: adapter.trackId }), getFocusPractice: focus, getWeakAreaReview: weak, getQuickReview: quick, getDiagnosticBaseline: () => unavailable("certification-diagnostic-baseline"), getScenarioPractice: () => unavailable("certification-scenario-practice"), getMixedPractice: () => unavailable("certification-mixed-practice"), getExamExperienceProfile: () => unavailable("certification-exam-simulation") });
}

function itemId(item: unknown): string {
  if (!item || typeof item !== "object" || Array.isArray(item) || typeof (item as { id?: unknown }).id !== "string") throw new Error("Verified package item has no identity.");
  return (item as { id: string }).id;
}

function cloneFreeze<T>(value: T): T {
  if (Array.isArray(value)) return Object.freeze(value.map((entry) => cloneFreeze(entry))) as T;
  if (value && typeof value === "object") return Object.freeze(Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, cloneFreeze(entry)]))) as T;
  return value;
}
