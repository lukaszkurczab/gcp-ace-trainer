import type { PublishedAlgorithmsBank, PublishedCertificationBank, PublishedTrackManifest } from "../contracts";
import { ContentValidationError } from "../errors";
import { validateAlgorithmInteractionItem } from "../../tracks/algorithms/algorithmInteractionHandlers";
import { ALGORITHM_ROADMAP } from "../../tracks/algorithms/algorithmRoadmap";
import { ALGORITHM_PATTERN_FAMILIES, ALGORITHM_PATTERN_VARIANTS, ALGORITHM_PROBLEM_ARCHETYPES, ALGORITHM_SKILL_ATOMS } from "../../tracks/algorithms/algorithmTaxonomy";
import { ALGORITHM_MENTAL_UNIT_BY_ID } from "../../tracks/algorithms/algorithmMentalUnits";
import { ALGORITHM_MODES } from "../../tracks/algorithms/domain/algorithmModes";

export const PUBLISHED_ALGORITHMS_BANK_REQUIRED_KEYS = Object.freeze(["formatVersion", "trackId", "familyId", "contentVersion", "items", "practiceBlueprints", "recognitionSets", "contrastSets", "interleavedScopes", "compatibilitySets", "simulationPools", "simulationProfiles", "approvalActivationIdentity"]);
export const PUBLISHED_ALGORITHMS_ITEM_REQUIRED_KEYS = Object.freeze(["id", "prompt", "interaction", "scoringContract", "feedback", "taxonomy", "provenance", "compatibilityMemberships", "itemFingerprint"]);
export const PUBLISHED_ALGORITHMS_ITEM_OPTIONAL_KEYS = Object.freeze(["constraints", "difficulty"]);

function record(value: unknown, label = "Published content payload"): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContentValidationError(`${label} must be an object.`); return value as Record<string, unknown>; }
function exact(value: Record<string, unknown>, allowed: readonly string[], label: string): void { if (Object.keys(value).length !== allowed.length || Object.keys(value).some((key) => !allowed.includes(key))) throw new ContentValidationError(`${label} has an unsupported field.`); }
function text(value: unknown, label: string): string { if (typeof value !== "string" || !value.trim()) throw new ContentValidationError(`${label} must be a non-empty string.`); return value; }
function values(value: unknown, label: string): readonly unknown[] { if (!Array.isArray(value)) throw new ContentValidationError(`${label} must be an array.`); return value; }
function stringValues(value: unknown, label: string): readonly string[] { const result = values(value, label).map((entry) => text(entry, label)); if (new Set(result).size !== result.length) throw new ContentValidationError(`${label} must be unique.`); return result; }

export function validateAlgorithmsBank(value: unknown, manifest: PublishedTrackManifest): PublishedAlgorithmsBank {
  const bank = record(value, "Algorithms bank"); exact(bank, PUBLISHED_ALGORITHMS_BANK_REQUIRED_KEYS, "Algorithms bank");
  if (bank.formatVersion !== 1 || bank.trackId !== "algorithms" || bank.familyId !== "algorithms" || bank.contentVersion !== manifest.contentVersion) throw new ContentValidationError("Algorithms bank identity is invalid.");
  text(bank.approvalActivationIdentity, "Algorithms approval activation identity"); const items = values(bank.items, "Algorithms items"); if (items.length !== manifest.itemCount) throw new ContentValidationError("Bank item count does not match manifest.");
  const ids = new Set<string>(); const fingerprints = new Set<string>();
  for (const unknown of items) { const item = record(unknown, "Algorithms item"); exact(item, [...PUBLISHED_ALGORITHMS_ITEM_REQUIRED_KEYS, ...PUBLISHED_ALGORITHMS_ITEM_OPTIONAL_KEYS].filter((key) => item[key] !== undefined), "Algorithms item"); const id = text(item.id, "Algorithms item id"); if (ids.has(id)) throw new ContentValidationError("Algorithms bank contains duplicate item IDs."); ids.add(id); const fingerprint = text(item.itemFingerprint, "Algorithms item fingerprint"); if (!/^[a-f0-9]{64}$/.test(fingerprint) || fingerprints.has(fingerprint)) throw new ContentValidationError("Algorithms item fingerprints must be unique SHA-256 identities."); fingerprints.add(fingerprint); validateInteractionShape(item); validateItemFeedback(item.feedback); validateItemTaxonomy(item.taxonomy); validateItemProvenance(item.provenance); stringValues(item.compatibilityMemberships, "Algorithms compatibility memberships"); try { validateAlgorithmInteractionItem(item as PublishedAlgorithmsBank["items"][number]); } catch (error) { throw new ContentValidationError(error instanceof Error ? error.message : "Algorithms interaction contract is invalid."); } }
  const structures = { practiceBlueprints: values(bank.practiceBlueprints, "practiceBlueprints"), recognitionSets: values(bank.recognitionSets, "recognitionSets"), contrastSets: values(bank.contrastSets, "contrastSets"), interleavedScopes: values(bank.interleavedScopes, "interleavedScopes"), compatibilitySets: values(bank.compatibilitySets, "compatibilitySets"), simulationPools: values(bank.simulationPools, "simulationPools"), simulationProfiles: values(bank.simulationProfiles, "simulationProfiles") };
  validateModeStructureShapes(structures);
  const known = (itemsFor: readonly unknown[], idKey: string, label: string) => { const map = new Map<string, Record<string, unknown>>(); for (const unknown of itemsFor) { const entry = record(unknown, label); const id = text(entry[idKey], `${label} id`); if (map.has(id)) throw new ContentValidationError(`${label} IDs must be unique.`); map.set(id, entry); } return map; };
  const blueprints = known(structures.practiceBlueprints, "blueprintId", "practice blueprint"); const recognition = known(structures.recognitionSets, "setId", "recognition set"); const contrast = known(structures.contrastSets, "setId", "contrast set"); const scopes = known(structures.interleavedScopes, "scopeId", "interleaved scope"); const pools = known(structures.simulationPools, "poolId", "simulation pool"); const profiles = known(structures.simulationProfiles, "profileId", "simulation profile");
  for (const entry of [...recognition.values(), ...contrast.values(), ...scopes.values(), ...pools.values()]) for (const id of stringValues(entry.itemIds, "mode structure itemIds")) if (!ids.has(id)) throw new ContentValidationError("Mode structure references an unknown Algorithms item.");
  validateAlgorithmsModeTaxonomy(recognition, contrast, scopes, items);
  for (const entry of known(structures.compatibilitySets, "id", "compatibility set").values()) { const source = stringValues(entry.sourceItemIds, "compatibility sourceItemIds"); const target = stringValues(entry.targetItemIds, "compatibility targetItemIds"); if (!["same_mechanism", "reviewed_variant", "compatible_contrast", "repair"].includes(text(entry.relation, "compatibility relation")) || !["symmetric", "directed"].includes(text(entry.direction, "compatibility direction")) || new Set([...source, ...target]).size < 2 || [...source, ...target].some((id) => !ids.has(id))) throw new ContentValidationError("Compatibility set is invalid."); }
  const supportedModes = new Set(ALGORITHM_MODES.map((mode) => mode.id)); for (const blueprint of blueprints.values()) { const modeId = text(blueprint.modeId, "blueprint modeId"); if (!supportedModes.has(modeId as never)) throw new ContentValidationError("Algorithms blueprint declares an unsupported mode."); const lengths = stringValues(values(blueprint.requestedLengths, "blueprint requestedLengths").map(String), "blueprint requestedLengths").map(Number); if (!lengths.length || lengths.some((length) => !Number.isInteger(length) || length <= 0) || !Number.isInteger(blueprint.minimumActualLength) || !Number.isInteger(blueprint.defaultRequestedLength)) throw new ContentValidationError("Algorithms blueprint lengths are invalid."); const composition = record(blueprint.composition, "blueprint composition"); const kind = text(composition.kind, "blueprint composition kind"); const refs = stringValues(composition.ids, "blueprint composition ids"); const resolved = stringValues(blueprint.resolvedItemIds, "blueprint resolvedItemIds"); if (!resolved.length || resolved.some((id) => !ids.has(id)) || resolved.length < (blueprint.minimumActualLength as number)) throw new ContentValidationError("Algorithms blueprint cannot satisfy its declared minimum length."); const source = kind === "recognition_sets" ? recognition : kind === "contrast_sets" ? contrast : kind === "interleaved_scope" ? scopes : kind === "simulation_pool" ? pools : null; if (source && refs.some((id) => !source.has(id))) throw new ContentValidationError("Algorithms blueprint references an unknown named set."); }
  const simulationBlueprint = [...blueprints.values()].find((entry) => entry.modeId === "algorithms-interview-simulation");
  if (!simulationBlueprint) throw new ContentValidationError("Algorithms bank lacks Interview Simulation blueprint.");
  const simulationPoolId = stringValues(record(simulationBlueprint.composition, "simulation composition").ids, "simulation blueprint pool IDs");
  if (simulationPoolId.length !== 1 || !pools.has(simulationPoolId[0]!)) throw new ContentValidationError("Interview Simulation requires one explicit pool.");
  const pool = pools.get(simulationPoolId[0]!)!;
  const poolIds = stringValues(pool.itemIds, "simulation pool itemIds");
  if (poolIds.length < 40) throw new ContentValidationError("Interview Simulation pool has fewer than 40 unique items.");
  const profile = [...profiles.values()].find((entry) => entry.poolId === simulationPoolId[0]);
  if (!profile || profile.totalOccurrences !== 40 || profile.foregroundDurationMs !== 2_700_000 || profile.profileKind !== "internal_learning_profile" || profile.selectionPolicy === undefined || record(profile.selectionPolicy, "simulation selection policy").uniqueItems !== true || record(profile.selectionPolicy, "simulation selection policy").replacement !== false || record(profile.selectionPolicy, "simulation selection policy").deterministic !== true || record(profile.selectionPolicy, "simulation selection policy").algorithmVersion !== "sha256-ranked-constraints-v1") throw new ContentValidationError("Interview Simulation profile is invalid.");
  const distributionIds = new Set<string>();
  for (const distribution of values(profile.distributions, "simulation profile distributions")) {
    const declared = record(distribution, "simulation distribution");
    const dimension = text(declared.dimension, "simulation distribution dimension");
    if (distributionIds.has(dimension)) throw new ContentValidationError("Interview Simulation distribution dimensions must be unique.");
    distributionIds.add(dimension);
    const bucketIds = new Set<string>();
    for (const bucket of values(declared.buckets, "simulation distribution buckets")) {
      const declaredBucket = record(bucket, "simulation distribution bucket");
      const valueId = text(declaredBucket.valueId, "simulation distribution valueId");
      const minimum = declaredBucket.minimum; const target = declaredBucket.target; const maximum = declaredBucket.maximum;
      if (bucketIds.has(valueId) || typeof minimum !== "number" || typeof target !== "number" || typeof maximum !== "number" || !Number.isInteger(minimum) || !Number.isInteger(target) || !Number.isInteger(maximum) || minimum < 0 || minimum > target || target > maximum || maximum > 40) throw new ContentValidationError("Interview Simulation distribution bucket is invalid.");
      bucketIds.add(valueId);
    }
  }
  const occurrenceIds = stringValues(simulationBlueprint.resolvedItemIds, "simulation resolved occurrences");
  if (occurrenceIds.length !== 40 || occurrenceIds.some((id) => !poolIds.includes(id))) throw new ContentValidationError("Interview Simulation must resolve exactly 40 unique pool occurrences.");
  return bank as PublishedAlgorithmsBank;
}
function taxonomyError(code: string): never { throw new ContentValidationError(`Algorithms taxonomy error: ${code}.`); }
function validateItemTaxonomy(value: unknown): void {
  const taxonomy = record(value, "Algorithms item taxonomy");
  exact(taxonomy, ["roadmapNodeId", "primaryMentalUnitId", "patternFamilyId", "patternVariantId", "problemArchetypeId", "primarySkillAtomId", "secondarySkillAtomIds", "learningStage"].filter((key) => taxonomy[key] !== undefined), "Algorithms item taxonomy");
  const roadmap = text(taxonomy.roadmapNodeId, "roadmapNodeId");
  const family = text(taxonomy.patternFamilyId, "patternFamilyId");
  const mentalUnitId = text(taxonomy.primaryMentalUnitId, "primaryMentalUnitId");
  const learningStage = text(taxonomy.learningStage, "learningStage");
  const node = ALGORITHM_ROADMAP.nodes.find((entry) => entry.id === roadmap);
  if (!node || node.status !== "available") taxonomyError("unknown_roadmap_node");
  const mentalUnit = ALGORITHM_MENTAL_UNIT_BY_ID.get(mentalUnitId);
  if (!mentalUnit) taxonomyError("unknown_mental_unit");
  if (mentalUnit.roadmapNodeId !== roadmap) taxonomyError("mental_unit_outside_roadmap_node");
  if (mentalUnit.learningStage !== learningStage) taxonomyError("mental_unit_learning_stage_mismatch");
  if (!ALGORITHM_PATTERN_FAMILIES.some((entry) => entry.id === family) || !mentalUnit.legalPatternFamilyIds.includes(family as never)) taxonomyError("pattern_family_outside_mental_unit");
  if (taxonomy.patternVariantId !== undefined && (!mentalUnit.patternVariantIds.includes(text(taxonomy.patternVariantId, "patternVariantId") as never) || !ALGORITHM_PATTERN_VARIANTS.some((entry) => entry.id === taxonomy.patternVariantId && entry.patternFamilyId === family))) taxonomyError("variant_outside_mental_unit_or_pattern_family");
  if (taxonomy.problemArchetypeId !== undefined && (!mentalUnit.problemArchetypeIds.includes(text(taxonomy.problemArchetypeId, "problemArchetypeId") as never) || !ALGORITHM_PROBLEM_ARCHETYPES.some((entry) => entry.id === taxonomy.problemArchetypeId && entry.legalPatternFamilyIds.includes(family as never)))) taxonomyError("archetype_outside_mental_unit_or_pattern_family");
  const primarySkillAtomId = text(taxonomy.primarySkillAtomId, "primarySkillAtomId");
  if (!(mentalUnit.skillAtomIds as readonly string[]).includes(primarySkillAtomId) || !ALGORITHM_SKILL_ATOMS.some((entry) => entry.id === primarySkillAtomId && entry.primaryMentalUnitId === mentalUnitId)) taxonomyError("primary_skill_outside_mental_unit");
  const secondary = stringValues(taxonomy.secondarySkillAtomIds, "secondarySkillAtomIds");
  if (secondary.includes(primarySkillAtomId)) taxonomyError("secondary_skill_duplicates_primary");
  if (secondary.some((id) => !(mentalUnit.skillAtomIds as readonly string[]).includes(id) || !ALGORITHM_SKILL_ATOMS.some((entry) => entry.id === id))) taxonomyError("secondary_skill_outside_mental_unit");
}
function validateAlgorithmsModeTaxonomy(recognition: ReadonlyMap<string, Record<string, unknown>>, contrast: ReadonlyMap<string, Record<string, unknown>>, scopes: ReadonlyMap<string, Record<string, unknown>>, items: readonly unknown[]): void { const itemById = new Map(items.map((unknown) => { const item = record(unknown, "Algorithms item"); return [text(item.id, "Algorithms item id"), record(item.taxonomy, "Algorithms item taxonomy")]; })); for (const entry of recognition.values()) { const scope = record(entry.taxonomyScope, "recognition taxonomy scope"); const roadmapNodeIds = scope.roadmapNodeIds === undefined ? [] : stringValues(scope.roadmapNodeIds, "recognition roadmap nodes"); const mentalUnitIds = scope.mentalUnitIds === undefined ? [] : stringValues(scope.mentalUnitIds, "recognition mental units"); const patternFamilyIds = scope.patternFamilyIds === undefined ? [] : stringValues(scope.patternFamilyIds, "recognition pattern families"); const stages = stringValues(entry.legalLearningStages, "recognition learning stages"); for (const itemId of stringValues(entry.itemIds, "recognition item IDs")) { const taxonomy = itemById.get(itemId)!; if ((roadmapNodeIds.length && !roadmapNodeIds.includes(text(taxonomy.roadmapNodeId, "recognition roadmap node"))) || (mentalUnitIds.length && !mentalUnitIds.includes(text(taxonomy.primaryMentalUnitId, "recognition mental unit"))) || (patternFamilyIds.length && !patternFamilyIds.includes(text(taxonomy.patternFamilyId, "recognition pattern family"))) || !stages.includes(text(taxonomy.learningStage, "recognition learning stage"))) taxonomyError("recognition_item_outside_scope"); } } for (const entry of contrast.values()) { const primaryMentalUnitId = text(entry.primaryMentalUnitId, "contrast primary mental unit"); if (!ALGORITHM_MENTAL_UNIT_BY_ID.has(primaryMentalUnitId)) taxonomyError("illegal_contrast_mapping"); const contrasted = stringValues(entry.contrastedMentalUnitIds, "contrast mental unit IDs"); if (!contrasted.length || contrasted.includes(primaryMentalUnitId) || contrasted.some((id) => !ALGORITHM_MENTAL_UNIT_BY_ID.has(id))) taxonomyError("illegal_contrast_mapping"); for (const itemId of stringValues(entry.itemIds, "contrast item IDs")) { const mentalUnitId = text(itemById.get(itemId)?.primaryMentalUnitId, "contrast item mental unit"); if (mentalUnitId !== primaryMentalUnitId && !contrasted.includes(mentalUnitId)) taxonomyError("contrast_item_outside_mental_units"); } } for (const entry of scopes.values()) { const mentalUnitIds = stringValues(entry.mentalUnitIds, "interleaved mental units"); for (const id of mentalUnitIds) if (!ALGORITHM_MENTAL_UNIT_BY_ID.has(id)) taxonomyError("unknown_mental_unit"); for (const itemId of stringValues(entry.itemIds, "interleaved item IDs")) if (!mentalUnitIds.includes(text(itemById.get(itemId)?.primaryMentalUnitId, "interleaved item mental unit"))) taxonomyError("interleaved_item_outside_mental_unit"); } }
function validateInteractionShape(item: Record<string, unknown>): void { const interaction = record(item.interaction, "Algorithms item interaction"); const scoring = record(item.scoringContract, "Algorithms item scoring contract"); const kind = text(interaction.type, "Algorithms interaction type"); if (kind === "choice") { exact(interaction, ["type", "selectionMode", "options", "acceptedOptionIds"], "Algorithms choice interaction"); exact(scoring, ["type", "resultSemantics"], "Algorithms choice scoring contract"); if (!(["single", "multiple"] as const).includes(interaction.selectionMode as never) || scoring.type !== "choice" || scoring.resultSemantics !== "exact_selected_set_with_partial_v1") throw new ContentValidationError("Algorithms choice contract is invalid."); for (const option of values(interaction.options, "Algorithms choice options")) { const declared = record(option, "Algorithms choice option"); exact(declared, ["id", "text"], "Algorithms choice option"); text(declared.id, "Algorithms choice option id"); text(declared.text, "Algorithms choice option text"); } stringValues(interaction.acceptedOptionIds, "Algorithms accepted option IDs"); return; }
  if (kind === "ordering") { exact(interaction, ["type", "elements", "canonicalOrder", "scoringMethod"], "Algorithms ordering interaction"); exact(scoring, ["type", "maxPoints"], "Algorithms ordering scoring contract"); if (scoring.type !== "ordering" || interaction.scoringMethod !== "adjacent_relations" || !Number.isInteger(scoring.maxPoints)) throw new ContentValidationError("Algorithms ordering contract is invalid."); for (const element of values(interaction.elements, "Algorithms ordering elements")) { const declared = record(element, "Algorithms ordering element"); exact(declared, ["id", "text"], "Algorithms ordering element"); text(declared.id, "Algorithms ordering element id"); text(declared.text, "Algorithms ordering element text"); } stringValues(interaction.canonicalOrder, "Algorithms canonical ordering"); return; }
  if (kind === "complexity") { exact(interaction, ["type", "checkedDimensions", "availableValuesByDimension", "acceptedValuesByDimension", "normalizedAliasesByDimension", "sharedPresetId", "maxPoints"].filter((key) => interaction[key] !== undefined), "Algorithms complexity interaction"); exact(scoring, ["type", "maxPoints"], "Algorithms complexity scoring contract"); if (scoring.type !== "complexity" || !Number.isInteger(scoring.maxPoints) || !Number.isInteger(interaction.maxPoints)) throw new ContentValidationError("Algorithms complexity contract is invalid."); const dimensions = stringValues(interaction.checkedDimensions, "Algorithms complexity dimensions"); for (const dimension of dimensions) { const available = record(interaction.availableValuesByDimension, "Algorithms available complexity values"); const accepted = record(interaction.acceptedValuesByDimension, "Algorithms accepted complexity values"); const aliases = record(interaction.normalizedAliasesByDimension, "Algorithms complexity aliases"); stringValues(available[dimension], `Algorithms complexity available values ${dimension}`); stringValues(accepted[dimension], `Algorithms complexity accepted values ${dimension}`); for (const [alias, target] of Object.entries(record(aliases[dimension] ?? {}, "Algorithms complexity alias map"))) { text(alias, "Algorithms complexity alias"); text(target, "Algorithms complexity alias target"); } } return; }
  throw new ContentValidationError("Algorithms interaction type is unsupported."); }
function validateMinimumDiversity(value: unknown): void { if (Number.isInteger(value) && (value as number) > 0) return; const diversity = record(value, "interleaved scope minimum diversity"); const keys = Object.keys(diversity).sort(); const positive = (key: string) => Number.isInteger(diversity[key]) && (diversity[key] as number) > 0; if (JSON.stringify(keys) === JSON.stringify(["interactionTypeCount", "primaryMentalUnitCount", "problemArchetypeCount"]) && positive("interactionTypeCount") && positive("primaryMentalUnitCount") && positive("problemArchetypeCount")) return; if (JSON.stringify(keys) === JSON.stringify(["interactionTypes", "mentalUnitCount"]) && positive("mentalUnitCount") && stringValues(diversity.interactionTypes, "interleaved scope interaction types").length > 0) return; if (JSON.stringify(keys) === JSON.stringify(["interactionTypes", "mentalUnits", "problemArchetypes"]) && positive("interactionTypes") && positive("mentalUnits") && positive("problemArchetypes")) return; throw new ContentValidationError("Interleaved scope minimum diversity is invalid."); }
function validateModeStructureShapes(structures: Readonly<Record<string, readonly unknown[]>>): void { for (const unknown of structures.practiceBlueprints ?? []) { const entry = record(unknown, "practice blueprint"); exact(entry, ["blueprintId", "blueprintVersion", "modeId", "requestedLengths", "defaultRequestedLength", "shortening", "minimumActualLength", "composition", "resolvedItemIds"], "practice blueprint"); for (const key of ["blueprintId", "blueprintVersion", "modeId"]) text(entry[key], `practice blueprint ${key}`); if (!Number.isInteger(entry.defaultRequestedLength) || !Number.isInteger(entry.minimumActualLength) || !["allowed", "blueprint_controlled", "prohibited"].includes(entry.shortening as string)) throw new ContentValidationError("Practice blueprint control values are invalid."); const composition = record(entry.composition, "practice blueprint composition"); exact(composition, ["kind", "ids"], "practice blueprint composition"); if (!["item_ids", "recognition_sets", "contrast_sets", "interleaved_scope", "simulation_pool"].includes(text(composition.kind, "practice blueprint composition kind"))) throw new ContentValidationError("Practice blueprint composition kind is invalid."); stringValues(composition.ids, "practice blueprint composition IDs"); stringValues(entry.resolvedItemIds, "practice blueprint resolved item IDs"); }
  for (const unknown of structures.recognitionSets ?? []) { const entry = record(unknown, "recognition set"); exact(entry, ["setId", "setVersion", "taxonomyScope", "legalLearningStages", "itemIds", "falseHeuristicIds"].filter((key) => entry[key] !== undefined), "recognition set"); text(entry.setId, "recognition set ID"); text(entry.setVersion, "recognition set version"); for (const scope of Object.values(record(entry.taxonomyScope, "recognition taxonomy scope"))) stringValues(scope, "recognition taxonomy scope values"); stringValues(entry.legalLearningStages, "recognition legal learning stages"); stringValues(entry.itemIds, "recognition item IDs"); if (entry.falseHeuristicIds !== undefined) stringValues(entry.falseHeuristicIds, "recognition false heuristic IDs"); }
  for (const unknown of structures.contrastSets ?? []) { const entry = record(unknown, "contrast set"); exact(entry, ["setId", "setVersion", "primaryMentalUnitId", "contrastedMentalUnitIds", "falseHeuristicId", "transferBoundary", "itemIds"], "contrast set"); for (const key of ["setId", "setVersion", "primaryMentalUnitId", "falseHeuristicId", "transferBoundary"]) text(entry[key], `contrast set ${key}`); stringValues(entry.contrastedMentalUnitIds, "contrast mental unit IDs"); stringValues(entry.itemIds, "contrast item IDs"); }
  for (const unknown of structures.interleavedScopes ?? []) { const entry = record(unknown, "interleaved scope"); exact(entry, ["scopeId", "scopeVersion", "mentalUnitIds", "itemIds", "legalLearningStages", "minimumDiversity"].filter((key) => entry[key] !== undefined), "interleaved scope"); text(entry.scopeId, "interleaved scope ID"); text(entry.scopeVersion, "interleaved scope version"); stringValues(entry.mentalUnitIds, "interleaved mental unit IDs"); stringValues(entry.itemIds, "interleaved item IDs"); stringValues(entry.legalLearningStages, "interleaved legal learning stages"); if (entry.minimumDiversity !== undefined) validateMinimumDiversity(entry.minimumDiversity); }
  for (const unknown of structures.compatibilitySets ?? []) { const entry = record(unknown, "compatibility set"); exact(entry, ["id", "version", "relation", "direction", "sourceItemIds", "targetItemIds"], "compatibility set"); for (const key of ["id", "version", "relation", "direction"]) text(entry[key], `compatibility set ${key}`); stringValues(entry.sourceItemIds, "compatibility source item IDs"); stringValues(entry.targetItemIds, "compatibility target item IDs"); }
  for (const unknown of structures.simulationPools ?? []) { const entry = record(unknown, "simulation pool"); exact(entry, ["poolId", "poolVersion", "itemIds"], "simulation pool"); text(entry.poolId, "simulation pool ID"); text(entry.poolVersion, "simulation pool version"); stringValues(entry.itemIds, "simulation pool item IDs"); }
  for (const unknown of structures.simulationProfiles ?? []) { const entry = record(unknown, "simulation profile"); exact(entry, ["profileId", "profileVersion", "profileKind", "totalOccurrences", "foregroundDurationMs", "poolId", "distributions", "selectionPolicy"], "simulation profile"); for (const key of ["profileId", "profileVersion", "profileKind", "poolId"]) text(entry[key], `simulation profile ${key}`); const policy = record(entry.selectionPolicy, "simulation selection policy"); exact(policy, ["uniqueItems", "replacement", "deterministic", "algorithmVersion"], "simulation selection policy"); text(policy.algorithmVersion, "simulation selection algorithm version"); values(entry.distributions, "simulation profile distributions"); }
}
function validateItemFeedback(value: unknown): void { const feedback = record(value, "Algorithms item feedback"); exact(feedback, ["reason", "details", "wrongOptionExplanationsByOptionId", "omittedCorrectExplanationsByOptionId"].filter((key) => feedback[key] !== undefined), "Algorithms item feedback"); text(feedback.reason, "Algorithms feedback reason"); text(feedback.details, "Algorithms feedback details"); for (const explanations of [feedback.wrongOptionExplanationsByOptionId, feedback.omittedCorrectExplanationsByOptionId]) if (explanations !== undefined) for (const [id, explanation] of Object.entries(record(explanations, "Algorithms feedback explanations"))) { text(id, "Algorithms feedback option id"); text(explanation, "Algorithms feedback explanation"); } }
function validateItemProvenance(value: unknown): void { const provenance = record(value, "Algorithms item provenance"); exact(provenance, ["author", "createdAt", "contentBatchId", "authoringMethod", "externalSources"], "Algorithms item provenance"); for (const key of ["author", "createdAt", "contentBatchId", "authoringMethod"]) text(provenance[key], `provenance.${key}`); if (Number.isNaN(Date.parse(provenance.createdAt as string)) || provenance.authoringMethod !== "independently_authored") throw new ContentValidationError("Algorithms provenance is invalid."); for (const source of values(provenance.externalSources, "provenance.externalSources")) { const declared = record(source, "Algorithms provenance source"); exact(declared, ["sourceId", "publisher", "title", "locator", "retrievedAt", "publicationOrRevisionDate", "versionOrScope"].filter((key) => declared[key] !== undefined), "Algorithms provenance source"); for (const key of ["sourceId", "publisher", "title", "locator", "retrievedAt"]) text(declared[key], `Algorithms provenance source.${key}`); if (Number.isNaN(Date.parse(declared.retrievedAt as string))) throw new ContentValidationError("Algorithms provenance source retrieval date is invalid."); } }
export function validateCertificationBank(value: unknown, manifest: PublishedTrackManifest): PublishedCertificationBank {
  const bank = record(value, "Certification bank");
  exact(bank, ["formatVersion", "trackId", "familyId", "contentVersion", "diagnosticBaseline", "focusPractice", "scenarioPractice", "weakAreaReview", "examExperienceProfile", "items"], "Certification bank");
  if (bank.formatVersion !== 1 || bank.trackId !== "cloud-certification" || bank.familyId !== "certification" || bank.contentVersion !== manifest.contentVersion) {
    throw new ContentValidationError("Certification bank identity is invalid.");
  }
  const items = values(bank.items, "Certification items");
  validateCertificationExamExperienceProfile(bank.examExperienceProfile);
  if (items.length !== manifest.itemCount || items.length === 0) throw new ContentValidationError("Certification bank item count does not match manifest.");
  const ids = new Set<string>();
  const tagsByItemId = new Map<string, readonly string[]>();
  const fingerprints = new Set<string>();
  const domains = new Set(["setup_environment", "planning_implementation", "access_security", "operations"]);
  for (const unknown of items) {
    const item = record(unknown, "Certification item");
    exact(item, ["id", "domain", "type", "difficulty", "question", "options", "correctOptionIds", "explanation", "whyOthersAreWrong", "watchOutFor", "tags", "examSignals", "itemFingerprint"].filter((key) => item[key] !== undefined), "Certification item");
    const id = text(item.id, "Certification item id");
    if (ids.has(id)) throw new ContentValidationError("Certification bank contains duplicate item IDs.");
    ids.add(id);
    if (!domains.has(text(item.domain, "Certification item domain"))) throw new ContentValidationError("Certification item references an unknown Cloud domain.");
    if (item.type !== "single" && item.type !== "multiple") throw new ContentValidationError("Certification item type is invalid.");
    if (item.difficulty !== "easy" && item.difficulty !== "medium" && item.difficulty !== "hard") throw new ContentValidationError("Certification item difficulty is invalid.");
    text(item.question, "Certification question");
    text(item.explanation, "Certification explanation");
    const fingerprint = text(item.itemFingerprint, "Certification item fingerprint");
    if (!/^[a-f0-9]{64}$/.test(fingerprint) || fingerprints.has(fingerprint)) throw new ContentValidationError("Certification item fingerprints must be unique SHA-256 identities.");
    fingerprints.add(fingerprint);
    const options = values(item.options, "Certification options");
    if (options.length < 2) throw new ContentValidationError("Certification item needs at least two options.");
    const optionIds = new Set<string>();
    const optionTexts = new Set<string>();
    for (const optionValue of options) {
      const option = record(optionValue, "Certification option"); exact(option, ["id", "text"], "Certification option");
      const optionId = text(option.id, "Certification option id"); const optionText = text(option.text, "Certification option text");
      if (optionIds.has(optionId) || optionTexts.has(optionText)) throw new ContentValidationError("Certification options must have unique identities and visible text.");
      optionIds.add(optionId); optionTexts.add(optionText);
    }
    const correct = stringValues(item.correctOptionIds, "Certification correct option IDs");
    if (correct.some((optionId) => !optionIds.has(optionId)) || (item.type === "single" && correct.length !== 1) || (item.type === "multiple" && correct.length < 2)) {
      throw new ContentValidationError("Certification correct answers do not match the question type or options.");
    }
    const wrong = item.whyOthersAreWrong === undefined ? {} : record(item.whyOthersAreWrong, "Certification wrong-answer explanations");
    for (const [optionId, explanation] of Object.entries(wrong)) {
      if (!optionIds.has(optionId) || correct.includes(optionId)) throw new ContentValidationError("Certification wrong-answer explanation references an invalid option.");
      text(explanation, "Certification wrong-answer explanation");
    }
    if (item.watchOutFor !== undefined) {
      if (typeof item.watchOutFor === "string") text(item.watchOutFor, "Certification watch-out");
      else stringValues(item.watchOutFor, "Certification watch-outs");
    }
    tagsByItemId.set(id, stringValues(item.tags, "Certification tags"));
    if (item.examSignals !== undefined) stringValues(item.examSignals, "Certification exam signals");
  }
  validateCertificationDiagnosticBaseline(bank.diagnosticBaseline, ids);
  validateCertificationFocusPractice(bank.focusPractice, domains);
  validateCertificationScenarioPractice(bank.scenarioPractice, ids, tagsByItemId);
  validateCertificationWeakAreaReview(bank.weakAreaReview);
  return bank as PublishedCertificationBank;
}

function validateCertificationFocusPractice(value: unknown, knownDomains: ReadonlySet<string>): void {
  const focus = record(value, "Certification Focus Practice");
  exact(focus, ["blueprintId", "blueprintVersion", "modeId", "requestedLengths", "shortening", "selectionScope", "topicIds"], "Certification Focus Practice");
  text(focus.blueprintId, "Certification Focus Practice blueprint ID");
  text(focus.blueprintVersion, "Certification Focus Practice blueprint version");
  if (focus.modeId !== "certification-focus-practice" || focus.shortening !== "allowed_within_topic" || focus.selectionScope !== "cloud_domain") throw new ContentValidationError("Certification Focus Practice contract is invalid.");
  const lengths = values(focus.requestedLengths, "Certification Focus Practice requested lengths");
  if (lengths.length !== 3 || lengths.some((length, index) => length !== [10, 20, 40][index])) throw new ContentValidationError("Certification Focus Practice must expose exactly 10, 20, and 40 item lengths.");
  const topics = stringValues(focus.topicIds, "Certification Focus Practice topic IDs");
  if (!topics.length || topics.some((topicId) => !knownDomains.has(topicId))) throw new ContentValidationError("Certification Focus Practice references an unknown Cloud domain.");
}

function validateCertificationScenarioPractice(value: unknown, itemIds: ReadonlySet<string>, tagsByItemId: ReadonlyMap<string, readonly string[]>): void {
  const scenario = record(value, "Certification Scenario Practice");
  exact(scenario, ["blueprintId", "blueprintVersion", "modeId", "requestedLengths", "shortening", "selectionScope", "competencies"], "Certification Scenario Practice");
  text(scenario.blueprintId, "Certification Scenario Practice blueprint ID");
  text(scenario.blueprintVersion, "Certification Scenario Practice blueprint version");
  if (scenario.modeId !== "certification-scenario-practice" || scenario.shortening !== "allowed_within_competency" || scenario.selectionScope !== "explicit_tag_competency") throw new ContentValidationError("Certification Scenario Practice contract is invalid.");
  const lengths = values(scenario.requestedLengths, "Certification Scenario Practice requested lengths");
  if (lengths.length !== 3 || lengths.some((length, index) => length !== [10, 20, 40][index])) throw new ContentValidationError("Certification Scenario Practice must expose exactly 10, 20, and 40 item lengths.");
  const competencyIds = new Set<string>();
  for (const value of values(scenario.competencies, "Certification Scenario Practice competencies")) {
    const competency = record(value, "Certification Scenario Practice competency");
    exact(competency, ["id", "label", "scenarioItemIds"], "Certification Scenario Practice competency");
    const id = text(competency.id, "Certification Scenario Practice competency ID");
    text(competency.label, "Certification Scenario Practice competency label");
    if (competencyIds.has(id)) throw new ContentValidationError("Certification Scenario Practice competency IDs must be unique.");
    competencyIds.add(id);
    const scopedItems = stringValues(competency.scenarioItemIds, "Certification Scenario Practice item IDs");
    if (scopedItems.length < 10 || scopedItems.some((itemId) => !itemIds.has(itemId) || !tagsByItemId.get(itemId)?.includes(id))) throw new ContentValidationError("Certification Scenario Practice contains an item outside its explicit competency scope.");
  }
  if (!competencyIds.size) throw new ContentValidationError("Certification Scenario Practice requires an explicit competency.");
}

function validateCertificationWeakAreaReview(value: unknown): void {
  const review = record(value, "Certification Weak Area Review");
  exact(review, ["blueprintId", "blueprintVersion", "modeId", "requestedLengths", "shortening", "selectionScope", "persistentResolutionPolicy"], "Certification Weak Area Review");
  text(review.blueprintId, "Certification Weak Area Review blueprint ID");
  text(review.blueprintVersion, "Certification Weak Area Review blueprint version");
  if (review.modeId !== "certification-weak-area-review" || review.shortening !== "allowed_within_eligible_review_evidence" || review.selectionScope !== "eligible_due_review_evidence" || review.persistentResolutionPolicy !== "two_consecutive_due_review_successes") throw new ContentValidationError("Certification Weak Area Review contract is invalid.");
  const lengths = values(review.requestedLengths, "Certification Weak Area Review requested lengths");
  if (lengths.length !== 2 || lengths.some((length, index) => length !== [10, 20][index])) throw new ContentValidationError("Certification Weak Area Review must expose exactly 10 and 20 item lengths.");
}

function validateCertificationDiagnosticBaseline(value: unknown, itemIds: ReadonlySet<string>): void {
  const baseline = record(value, "Certification Diagnostic Baseline");
  exact(baseline, ["blueprintId", "blueprintVersion", "modeId", "requestedLength", "actualLength", "shortening", "uniqueItemsRequired", "timerKind", "feedbackTiming", "reinsertPolicy", "itemIds"], "Certification Diagnostic Baseline");
  text(baseline.blueprintId, "Certification Diagnostic Baseline blueprint ID");
  text(baseline.blueprintVersion, "Certification Diagnostic Baseline blueprint version");
  if (baseline.modeId !== "certification-diagnostic-baseline" || baseline.requestedLength !== 40 || baseline.actualLength !== 40 || baseline.shortening !== "prohibited" || baseline.uniqueItemsRequired !== 40 || baseline.timerKind !== "elapsed_foreground" || baseline.feedbackTiming !== "after_each_durable_submit" || baseline.reinsertPolicy !== "disabled") throw new ContentValidationError("Certification Diagnostic Baseline contract is invalid.");
  const selected = stringValues(baseline.itemIds, "Certification Diagnostic Baseline item IDs");
  if (selected.length !== 40 || selected.some((itemId) => !itemIds.has(itemId))) throw new ContentValidationError("Certification Diagnostic Baseline must name exactly 40 installed unique items.");
}

function validateCertificationExamExperienceProfile(value: unknown): void {
  const profile = record(value, "Certification exam experience profile");
  exact(profile, ["schemaVersion", "profileId", "profileVersion", "source", "durationMinutes", "questionCount", "blueprint", "navigation", "answerChanges", "flagging", "navigator", "sections", "timeout"], "Certification exam experience profile");
  if (profile.schemaVersion !== "exam-experience-profile-v1") throw new ContentValidationError("Certification exam experience profile schema is invalid.");
  text(profile.profileId, "Certification exam experience profile ID");
  text(profile.profileVersion, "Certification exam experience profile version");
  const source = record(profile.source, "Certification exam experience profile source");
  exact(source, ["url", "checkedDate", "guideVersion"], "Certification exam experience profile source");
  const sourceUrl = text(source.url, "Certification exam experience profile source URL");
  if (!/^https:\/\//.test(sourceUrl) || Number.isNaN(Date.parse(text(source.checkedDate, "Certification exam experience profile checked date")))) throw new ContentValidationError("Certification exam experience profile source is invalid.");
  text(source.guideVersion, "Certification exam experience profile guide version");
  if (!Number.isInteger(profile.durationMinutes) || (profile.durationMinutes as number) <= 0) throw new ContentValidationError("Certification exam experience profile duration is invalid.");
  const questionCount = record(profile.questionCount, "Certification exam experience profile question count");
  exact(questionCount, ["kind", "minimum", "maximum"], "Certification exam experience profile question count");
  if (questionCount.kind !== "range" || !Number.isInteger(questionCount.minimum) || !Number.isInteger(questionCount.maximum) || (questionCount.minimum as number) <= 0 || (questionCount.maximum as number) < (questionCount.minimum as number)) throw new ContentValidationError("Certification exam experience profile question count is invalid.");
  const blueprint = record(profile.blueprint, "Certification exam experience profile blueprint");
  exact(blueprint, ["kind", "sections"], "Certification exam experience profile blueprint");
  if (blueprint.kind !== "weighted_sections") throw new ContentValidationError("Certification exam experience profile blueprint is invalid.");
  const ids = new Set<string>();
  const total = values(blueprint.sections, "Certification exam experience profile blueprint sections").reduce<number>((sum, sectionValue) => {
    const section = record(sectionValue, "Certification exam experience profile blueprint section");
    exact(section, ["id", "weightPercent"], "Certification exam experience profile blueprint section");
    const id = text(section.id, "Certification exam experience profile blueprint section ID");
    if (ids.has(id) || typeof section.weightPercent !== "number" || !Number.isFinite(section.weightPercent) || section.weightPercent <= 0) throw new ContentValidationError("Certification exam experience profile blueprint section is invalid.");
    ids.add(id);
    return sum + section.weightPercent;
  }, 0);
  if (ids.size === 0 || Math.abs(total - 100) > 0.000001) throw new ContentValidationError("Certification exam experience profile blueprint must total 100 percent.");
  if (!(["free", "not_documented"] as const).includes(profile.navigation as never) || !(["until_final_submission", "not_documented"] as const).includes(profile.answerChanges as never) || !(["available", "not_documented"] as const).includes(profile.flagging as never) || !(["available", "not_documented"] as const).includes(profile.navigator as never) || !(["available", "not_documented"] as const).includes(profile.sections as never) || !(["absolute_deadline", "not_documented"] as const).includes(profile.timeout as never)) throw new ContentValidationError("Certification exam experience profile policies are invalid.");
}
