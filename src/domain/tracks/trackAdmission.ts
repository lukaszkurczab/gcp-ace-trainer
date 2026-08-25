import type { TrackFamilyId, TrackId } from "../learning";
import type { TrackRegistration } from "./trackMetadata";
import { GENERATED_FREE_NODE_PACKAGES } from "../../content/bundled/generatedFreeNodePackages";
import { contentHasher } from "../../infrastructure/identity/contentHasher";

/** The sole application owner of learner-visible launch scope. */
export const LAUNCH_TRACK_IDS = Object.freeze([
  "coding-interview-dsa-problem-solving",
  "backend-system-design-interview",
  "object-oriented-design-interview",
  "frontend-system-design-interview",
  "google-cloud-associate-cloud-engineer",
  "aws-certified-solutions-architect-associate",
  "microsoft-azure-administrator-associate-az-104",
  "microsoft-azure-ai-fundamentals-ai-901",
] as const);

export const CANONICAL_TRACK_BRIEF_SOURCE = Object.freeze({
  repository: "patternly-content",
  commit: "b02907ca181fed93d50075478c13a2c6c9c2bdf0",
  schemaVersion: "patternly-track-brief-v2",
});

export type TrackBriefDescriptor = Readonly<{
  schemaVersion: "patternly-track-brief-v2";
  trackId: TrackId;
  internalFamily: TrackFamilyId;
  jobToBeDone: string;
  targetLearner: string;
  taxonomyOutline: readonly string[];
  freeNodeId: string;
  validModes: readonly string[];
  goalTemplates: readonly string[];
  progressDimensions: readonly string[];
  packageContentPlan: Readonly<{
    bundledFreeNodeId: string;
    premiumPackageUnit: "immutableCompressedWholeNodePackage";
    contentScopes: readonly string[];
    provenanceRules: readonly string[];
  }>;
  sourceBriefSha256: string;
  launchCommercialGate: "realFreeVerticalAndCompleteCoreLoop";
}>;

const designModes = ["design-interview-learn-framework", "design-interview-guided-case", "design-interview-requirements-practice", "design-interview-tradeoff-practice", "design-interview-weak-area-review", "design-interview-independent-case", "design-interview-simulation"] as const;
const interviewGoals = ["prepare_for_an_interview", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"] as const;
const certificationModes = ["certification-diagnostic-baseline", "certification-focus-practice", "certification-scenario-practice", "certification-weak-area-review", "certification-mixed-practice", "certification-quick-review", "certification-exam-simulation"] as const;
const certificationGoals = ["prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"] as const;

/**
 * A pinned, non-production projection of the eight launch content-owned briefs.
 * It exists to keep the application registry scalable without presenting
 * descriptors as user-selectable tracks. The SHA-256 values identify the
 * exact canonical brief files at CANONICAL_TRACK_BRIEF_SOURCE.commit.
 */
export const TRACK_DENSITY_DESCRIPTORS: readonly TrackBriefDescriptor[] = Object.freeze([
  descriptor("coding-interview-dsa-problem-solving", "coding_interview", "Build a repeatable way to analyze interview-style data-structure and algorithm problems, choose a legal strategy, justify it, and produce an implementation plan without relying on executable-code judging.", "A software-engineering candidate who knows basic programming and wants structured practice in constraints, patterns, invariants, complexity, edge cases, and implementation planning.", ["roadmap_node", "mental_unit", "pattern_family", "pattern_variant", "problem_archetype", "skill_atom"], "complexity_and_constraints", ["coding-interview-learn-approach", "coding-interview-guided-practice", "coding-interview-custom-practice", "coding-interview-recognize-patterns", "coding-interview-contrast-practice", "coding-interview-weak-area-review", "coding-interview-independent-practice", "coding-interview-simulation"], ["prepare_for_an_interview", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"], ["strategy_selection", "constraint_analysis", "invariant_reasoning", "complexity_reasoning", "implementation_planning", "due_review"], packagePlan("complexity_and_constraints", ["Complete strategy-first free node covering constraints, complexity, approach legality, edge cases, and ordered implementation planning.", "Whole-node packages covering individual pattern families, cross-pattern contrasts, independent transfer, and interview simulation pools."], ["All problems and explanations are independently authored and retain stable item, interaction, taxonomy, and evidence identities.", "External technical facts require attributable sources; the track makes no executable-code or interview-readiness claim."]), "3545467b8ed10da05e60436b60282db26f644e377e369e74a6f68fb9a21c406e"),
  descriptor("backend-system-design-interview", "design_interview", "Develop a repeatable interview process for clarifying backend-system requirements, estimating scale, defining data and service boundaries, evaluating tradeoffs, and communicating an evolvable design.", "A software-engineering candidate who can build backend services and wants structured practice turning ambiguous system-design prompts into justified architecture decisions.", ["case_archetype", "requirements_and_constraints", "architecture_decision", "tradeoff_boundary", "failure_and_evolution_scenario", "skill_atom"], "requirements_capacity_and_architecture_decomposition", designModes, interviewGoals, ["requirements_clarification", "capacity_reasoning", "data_modeling", "service_boundaries", "reliability_tradeoffs", "design_communication", "due_review"], packagePlan("requirements_capacity_and_architecture_decomposition", ["Complete foundations case set for requirements, rough capacity reasoning, scope control, and explicit assumptions.", "Whole-node case packages for data models, interfaces, scaling, reliability, consistency, observability, security, and architecture evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and make all material assumptions explicit.", "External technical mechanisms require attributable sources; cases do not claim one universal architecture or interview-readiness score."]), "5b725f7ab470cc46dd29d922a470d2e486fcad5a9ea11924f5f295520bdba997"),
  descriptor("object-oriented-design-interview", "design_interview", "Develop a repeatable interview process for identifying domain responsibilities, modeling collaborations and state changes, selecting abstractions, and explaining extensibility and testing tradeoffs.", "A software-engineering candidate who knows object-oriented programming and wants disciplined practice translating behavioral requirements into coherent object models.", ["domain_case_archetype", "behavioral_requirement", "responsibility_and_invariant", "object_collaboration", "extension_and_failure_scenario", "skill_atom"], "requirements_use_cases_domain_vocabulary_and_model_boundaries", designModes, interviewGoals, ["domain_modeling", "responsibility_assignment", "state_and_invariants", "collaboration_design", "extensibility_tradeoffs", "design_communication", "due_review"], packagePlan("requirements_use_cases_domain_vocabulary_and_model_boundaries", ["Complete object-modeling foundations cases covering requirements, responsibilities, state, invariants, and collaboration boundaries.", "Whole-node case packages for lifecycle modeling, extensibility, concurrency boundaries, error handling, testing, and design evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and state all behavioral assumptions.", "External language or pattern claims require attributable sources; content does not reward pattern-name recall without design justification."]), "2d43d7659510d23185739bd1d13e9e921f47cc58df02cb2071092f1a6751383c"),
  descriptor("frontend-system-design-interview", "design_interview", "Develop a repeatable interview process for clarifying frontend requirements, defining client boundaries and state, planning data flow and delivery, and justifying performance, accessibility, resilience, and maintainability tradeoffs.", "A frontend or full-stack engineering candidate who wants structured practice designing substantial client applications beyond component-level coding questions.", ["frontend_case_archetype", "user_and_system_requirement", "client_architecture_decision", "delivery_and_runtime_tradeoff", "failure_and_evolution_scenario", "skill_atom"], "requirements_user_journeys_constraints_and_frontend_decomposition", designModes, interviewGoals, ["requirements_clarification", "state_and_data_flow", "client_boundaries", "performance_delivery", "accessibility_resilience", "design_communication", "due_review"], packagePlan("requirements_user_journeys_constraints_and_frontend_decomposition", ["Complete frontend-architecture foundations cases covering user journeys, state ownership, data flow, rendering boundaries, and explicit assumptions.", "Whole-node case packages for delivery, performance, accessibility, offline behavior, resilience, observability, security, and architecture evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and state device, network, browser, and accessibility assumptions.", "External web-platform or framework facts require attributable sources; content remains framework-neutral unless a case explicitly constrains the stack."]), "353b921c681a6691283a5e1a59ea79294d51dd60db4da864c68abde2eec909b6"),
  descriptor("google-cloud-associate-cloud-engineer", "certification", "Practice the technical decisions and operational reasoning relevant to associate-level Google Cloud administration while distinguishing Patternly learning results from any official certification outcome.", "A cloud practitioner preparing to reason about Google Cloud solution setup, implementation, access control, and operations through scenario-based retrieval and review.", ["cloud_domain", "scenario_signal", "topic_tag", "skill_evidence"], "organization_projects_policies_services_quotas_and_assets", ["certification-diagnostic-baseline", "certification-focus-practice", "certification-weak-area-review", "certification-mixed-practice", "certification-quick-review", "certification-exam-simulation"], certificationGoals, ["setup_environment", "planning_implementation", "access_security", "operations", "scenario_reasoning", "due_review"], packagePlan("organization_projects_policies_services_quotas_and_assets", ["Complete organization/projects/policies/services free node with authored scenario feedback and review evidence.", "Whole-node packages for the remaining declared cloud domains, mixed practice, remediation, and simulation pools."], ["Provider-specific technical and exam-experience facts require current attributable Google public sources and recorded review dates.", "Content is independently authored, excludes exam dumps, and does not claim Google affiliation or an official score."]), "5177b39546cddccff854c45f99fd529eb9a767d486534e43ab015089f6a889a7"),
  descriptor("aws-certified-solutions-architect-associate", "certification", "Practice choosing and explaining AWS architecture decisions under stated reliability, security, performance, operations, and cost constraints without treating practice results as an official certification outcome.", "A cloud practitioner who wants structured scenario practice for associate-level AWS solution architecture and evidence-based review of recurring decision errors.", ["official_exam_domain", "architecture_competency", "scenario_constraint", "service_decision", "skill_atom"], "aws_secure_architecture_foundations", certificationModes, certificationGoals, ["requirements_analysis", "reliability_decisions", "security_decisions", "performance_decisions", "cost_tradeoffs", "due_review"], packagePlan("aws_secure_architecture_foundations", ["Complete cloud-architecture foundations node covering requirement extraction, service-boundary reasoning, and explicit tradeoffs.", "Whole-node packages organized by reviewed exam domains, scenario competencies, remediation needs, and a sourced simulation profile."], ["AWS-specific facts and exam behavior require current attributable AWS public sources before content release.", "Content is independently authored, excludes exam dumps, and does not claim AWS affiliation or an official score."]), "9b7b9a661121ce95e08cafe4ab6af88fac54034089018b2f974c6269f09c2ea6"),
  descriptor("microsoft-azure-administrator-associate-az-104", "certification", "Practice Azure administration decisions across identity, governance, storage, compute, networking, and monitoring while keeping Patternly evidence separate from official certification results.", "An Azure administrator or cloud practitioner who wants scenario-based preparation, precise feedback, and durable review of associate-level administration decisions.", ["official_exam_domain", "administration_competency", "operational_scenario", "resource_decision", "skill_atom"], "entra_identity_lifecycle_and_authentication", certificationModes, certificationGoals, ["identity_governance", "storage_administration", "compute_administration", "networking_administration", "monitoring_recovery", "due_review"], packagePlan("entra_identity_lifecycle_and_authentication", ["Complete Microsoft Entra identity lifecycle and authentication node covering users, groups, licensing, external identities, and self-service password reset.", "Whole-node packages aligned to reviewed exam domains, competency remediation, mixed practice, and a sourced simulation profile."], ["Azure-specific facts and exam behavior require current attributable Microsoft public sources before content release.", "Content is independently authored, excludes exam dumps, and does not claim Microsoft affiliation or an official score."]), "4de8b57e581e57d970701a732e92fb5cc6d5dd5f233ca888a57b0006bba46f55"),
  descriptor("microsoft-azure-ai-fundamentals-ai-901", "certification", "Practice distinguishing foundational AI workload, responsible-use, and Azure service decisions while keeping Patternly learning evidence separate from any official certification outcome.", "A technical or non-technical learner who wants structured foundations practice for identifying AI workload requirements, limits, and responsible solution choices in an Azure context.", ["official_exam_domain", "ai_workload_category", "responsible_use_constraint", "service_capability_decision", "skill_atom"], "responsible_ai_model_foundations_and_deployment_choices", certificationModes, certificationGoals, ["ai_workload_recognition", "responsible_ai_reasoning", "machine_learning_foundations", "vision_language_workloads", "service_boundary_reasoning", "due_review"], packagePlan("responsible_ai_model_foundations_and_deployment_choices", ["Complete AI-workload foundations node covering requirement recognition, capability boundaries, and responsible-use constraints.", "Whole-node packages based on reviewed public objectives, scenario competencies, remediation needs, and a sourced simulation profile."], ["Azure AI and exam-specific facts require current attributable Microsoft public sources before content release.", "Content is independently authored, avoids capability overclaims, excludes exam dumps, and does not claim Microsoft affiliation or an official score."]), "7ccf38a78e8a430b39d2cd0ba4e0f37e93a13e50cba8e05e61261d281fe7fa6f"),
]);

function packagePlan(bundledFreeNodeId: string, contentScopes: readonly string[], provenanceRules: readonly string[]): TrackBriefDescriptor["packageContentPlan"] {
  return Object.freeze({ bundledFreeNodeId, premiumPackageUnit: "immutableCompressedWholeNodePackage", contentScopes: Object.freeze([...contentScopes]), provenanceRules: Object.freeze([...provenanceRules]) });
}

function descriptor(trackId: TrackId, internalFamily: TrackFamilyId, jobToBeDone: string, targetLearner: string, taxonomyOutline: readonly string[], freeNodeId: string, validModes: readonly string[], goalTemplates: readonly string[], progressDimensions: readonly string[], packageContentPlan: TrackBriefDescriptor["packageContentPlan"], sourceBriefSha256: string): TrackBriefDescriptor {
  return Object.freeze({ schemaVersion: "patternly-track-brief-v2", trackId, internalFamily, jobToBeDone, targetLearner, taxonomyOutline: Object.freeze([...taxonomyOutline]), freeNodeId, validModes: Object.freeze([...validModes]), goalTemplates: Object.freeze([...goalTemplates]), progressDimensions: Object.freeze([...progressDimensions]), packageContentPlan, sourceBriefSha256, launchCommercialGate: "realFreeVerticalAndCompleteCoreLoop" });
}

export type ProductionTrackArtifactEvidence = Readonly<{
  trackId: TrackId;
  bundledReleaseId: string;
}>;

/** Actual pinned whole-track artifacts. They are not free-node package proof. */
export const CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE: readonly ProductionTrackArtifactEvidence[] = Object.freeze([
  Object.freeze({ trackId: "backend-system-design-interview", bundledReleaseId: "patternly-launch-2026-08-25-01" }),
  Object.freeze({ trackId: "coding-interview-dsa-problem-solving", bundledReleaseId: "patternly-launch-2026-08-25-01" }),
  Object.freeze({ trackId: "frontend-system-design-interview", bundledReleaseId: "patternly-launch-2026-08-25-01" }),
  Object.freeze({ trackId: "google-cloud-associate-cloud-engineer", bundledReleaseId: "patternly-launch-2026-08-25-01" }),
  Object.freeze({ trackId: "microsoft-azure-administrator-associate-az-104", bundledReleaseId: "patternly-launch-2026-08-25-01" }),
  Object.freeze({ trackId: "microsoft-azure-ai-fundamentals-ai-901", bundledReleaseId: "patternly-launch-2026-08-25-01" }),
  Object.freeze({ trackId: "aws-certified-solutions-architect-associate", bundledReleaseId: "patternly-launch-2026-08-25-01" }),
  Object.freeze({ trackId: "object-oriented-design-interview", bundledReleaseId: "patternly-launch-2026-08-25-01" }),
]);

export type ProductionTrackAdmissionEvaluation = Readonly<{
  trackId: TrackId;
  kind: "missing_artifact_evidence" | "unverified_free_node_package" | "package_evidence_verified_catalogue_gate_pending";
}>;

export function assertTrackDensityDescriptors(descriptors: readonly TrackBriefDescriptor[]): readonly TrackBriefDescriptor[] {
  if (descriptors.length !== LAUNCH_TRACK_IDS.length) throw new Error("Track density descriptors must contain exactly the eight canonical launch track IDs.");
  const ids = new Set<string>();
  const freeNodes = new Set<string>();
  for (const descriptor of descriptors) {
    if (!LAUNCH_TRACK_IDS.includes(descriptor.trackId as (typeof LAUNCH_TRACK_IDS)[number])) throw new Error(`Track density descriptor is not canonical launch scope: ${descriptor.trackId}.`);
    if (ids.has(descriptor.trackId)) throw new Error(`Track density descriptors must have unique track IDs: ${descriptor.trackId}.`);
    if (freeNodes.has(descriptor.freeNodeId)) throw new Error(`Track density descriptors must have unique free node IDs: ${descriptor.freeNodeId}.`);
    if (!nonEmpty(descriptor.jobToBeDone) || !nonEmpty(descriptor.targetLearner) || !nonEmpty(descriptor.freeNodeId) || !sha256(descriptor.sourceBriefSha256) || descriptor.launchCommercialGate !== "realFreeVerticalAndCompleteCoreLoop") throw new Error(`Track density descriptor is incomplete: ${descriptor.trackId}.`);
    if (!uniqueNonEmpty(descriptor.taxonomyOutline) || !uniqueNonEmpty(descriptor.validModes) || !uniqueNonEmpty(descriptor.goalTemplates) || !uniqueNonEmpty(descriptor.progressDimensions)) throw new Error(`Track density descriptor has incomplete collections: ${descriptor.trackId}.`);
    ids.add(descriptor.trackId);
    freeNodes.add(descriptor.freeNodeId);
  }
  for (const trackId of LAUNCH_TRACK_IDS) if (!ids.has(trackId)) throw new Error(`Track density descriptor is missing: ${trackId}.`);
  return Object.freeze([...descriptors]);
}

/**
 * Evaluates admission without changing the visible registry. Current artifacts
 * are whole-track banks, so they cannot prove the brief's complete free node.
 */
export async function evaluateProductionTrackAdmissions(registrations: readonly TrackRegistration[], evidence: readonly ProductionTrackArtifactEvidence[] = CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE, descriptors: readonly TrackBriefDescriptor[] = TRACK_DENSITY_DESCRIPTORS, packages: readonly typeof GENERATED_FREE_NODE_PACKAGES[number][] = GENERATED_FREE_NODE_PACKAGES): Promise<readonly ProductionTrackAdmissionEvaluation[]> {
  const descriptorSet = assertTrackDensityDescriptors(descriptors);
  const descriptorById = new Map(descriptorSet.map((descriptor) => [descriptor.trackId, descriptor]));
  const evidenceById = new Map<string, ProductionTrackArtifactEvidence>();
  for (const fact of evidence) {
    if (evidenceById.has(fact.trackId)) throw new Error(`Production track artifact evidence must have unique track IDs: ${fact.trackId}.`);
    evidenceById.set(fact.trackId, fact);
  }
  const registrationIds = new Set(registrations.map((registration) => registration.id));
  if (registrationIds.size !== registrations.length) throw new Error("Production track registrations must have unique track IDs.");
  for (const fact of evidence) {
    if (!registrationIds.has(fact.trackId)) throw new Error(`Production track artifact evidence is orphaned: ${fact.trackId}.`);
  }
  const evaluations: ProductionTrackAdmissionEvaluation[] = [];
  for (const registration of registrations) {
    const descriptor = descriptorById.get(registration.id);
    const fact = evidenceById.get(registration.id);
    if (!descriptor || !fact || descriptor.internalFamily !== registration.familyId || !nonEmpty(fact.bundledReleaseId)) {
      evaluations.push(Object.freeze({ trackId: registration.id, kind: "missing_artifact_evidence" }));
      continue;
    }
    evaluations.push(Object.freeze({ trackId: registration.id, kind: await validFreeNodePackageEvidence(registration, descriptor, packages) ? "package_evidence_verified_catalogue_gate_pending" : "unverified_free_node_package" }));
  }
  return Object.freeze(evaluations);
}

function uniqueNonEmpty(values: unknown): boolean {
  return Array.isArray(values) && values.length > 0 && values.every(nonEmpty) && new Set(values).size === values.length;
}

function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function sha256(value: string): boolean { return /^[a-f0-9]{64}$/u.test(value); }

async function validFreeNodePackageEvidence(registration: TrackRegistration, descriptor: TrackBriefDescriptor, packages: readonly typeof GENERATED_FREE_NODE_PACKAGES[number][]): Promise<boolean> {
  const packageFact = packages.find((candidate) => candidate.trackId === registration.id);
  if (!packageFact || !sha256(packageFact.packageSha256) || packageFact.packageSize !== packageFact.packageBytes.length || await contentHasher.sha256(packageFact.packageBytes) !== packageFact.packageSha256) return false;
  try {
    const record = JSON.parse(packageFact.packageBytes) as { schemaVersion?: unknown; manifest?: Record<string, unknown> };
    const manifest = record.manifest;
    if (record.schemaVersion !== "bundled-free-node-v2" || !manifest || manifest.trackId !== registration.id || manifest.familyId !== registration.familyId || manifest.freeNodeId !== descriptor.freeNodeId || manifest.minimumAppVersion !== "0.1.0" || !Array.isArray(manifest.modeIds) || !manifest.modeIds.every((mode) => typeof mode === "string" && descriptor.validModes.includes(mode)) || !Array.isArray(packageFact.profileModes) || JSON.stringify([...manifest.modeIds].sort()) !== JSON.stringify([...packageFact.profileModes].sort())) return false;
    const provenance = manifest.provenance as Record<string, unknown> | undefined;
    const expectedTrackBriefCanonicalSha256: Readonly<Record<string, string>> = {
      "aws-certified-solutions-architect-associate": "06e86fd6adcbe7131e97732be5b12faeb0d34bc79700f0709e0d5a620837307d",
      "backend-system-design-interview": "abfd1804061e13e214f0fb193a432e344139d6e5ceb8c2d915bbf03b37fb07d3",
      "coding-interview-dsa-problem-solving": "0d42df31af6665090dbbc1da3c539122d1e6b509a89174044d52dff70e645ce5",
      "frontend-system-design-interview": "ef4893578381f7860c1d0dc701a7b3f9d25764d9afeb0aad9121b539f3c290c7",
      "google-cloud-associate-cloud-engineer": "e713274472b3d0fb83745c06997a611f51b4e73751162fcb1d34baf0ed3fb5de",
      "microsoft-azure-administrator-associate-az-104": "1c33f634c10dda14f6a3833ef4a8c802ac9877b5b44773018a2926fb345e861c",
      "microsoft-azure-ai-fundamentals-ai-901": "d410642d188c36fe8a2531e9ed11f5878003dc0b22706bd24cf609e4ea744951",
      "object-oriented-design-interview": "19ab6bfa3f6b5423a1517eff36f273b55676fb25ec78bc465965d21feea6f9a5",
    };
    return manifest.bundleKind === "bundled_free_node" && manifest.packageVersion === packageFact.packageVersion && manifest.payloadSchemaVersion === "bundled-free-node-payload-v2" && typeof manifest.profileId === "string" && manifest.profileVersion === "1" && provenance?.releaseId === "patternly-launch-2026-08-25-01" && provenance.sourceRepositoryCommit === "6a6fd729b9d45086aa5d4f6cf27ec48ef664811c" && provenance.profileSourceRepositoryCommit === "496b9ce9507b5432f4fd70129ff0617ff81ef880" && provenance.trackBriefCanonicalSha256 === expectedTrackBriefCanonicalSha256[registration.id];
  } catch { return false; }
}
