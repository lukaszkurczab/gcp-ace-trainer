import type { TrackFamilyId, TrackId } from "../learning";
import type { TrackRegistration } from "./trackMetadata";

const REQUIRED_TRACK_IDS = [
  "coding-interview-dsa-problem-solving",
  "backend-system-design-interview",
  "object-oriented-design-interview",
  "frontend-system-design-interview",
  "google-cloud-associate-cloud-engineer",
  "aws-certified-solutions-architect-associate",
  "microsoft-azure-administrator-associate-az-104",
  "microsoft-azure-ai-fundamentals-ai-901",
  "hashicorp-terraform-associate-004",
  "kubernetes-cloud-native-associate-kcna",
] as const;

export const CANONICAL_TRACK_BRIEF_SOURCE = Object.freeze({
  repository: "patternly-content",
  commit: "13dfacb5e30bd7b818d9e1dbd8eba8fb301acdf9",
  schemaVersion: "patternly-track-brief-v1",
});

export type TrackBriefDescriptor = Readonly<{
  schemaVersion: "patternly-track-brief-v1";
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
 * A pinned, non-production projection of the ten content-owned briefs.
 * It exists to keep the application registry scalable without presenting
 * descriptors as user-selectable tracks. The SHA-256 values identify the
 * exact canonical brief files at CANONICAL_TRACK_BRIEF_SOURCE.commit.
 */
export const TRACK_DENSITY_DESCRIPTORS: readonly TrackBriefDescriptor[] = Object.freeze([
  descriptor("coding-interview-dsa-problem-solving", "coding_interview", "Build a repeatable way to analyze interview-style data-structure and algorithm problems, choose a legal strategy, justify it, and produce an implementation plan without relying on executable-code judging.", "A software-engineering candidate who knows basic programming and wants structured practice in constraints, patterns, invariants, complexity, edge cases, and implementation planning.", ["roadmap_node", "mental_unit", "pattern_family", "pattern_variant", "problem_archetype", "skill_atom"], "complexity_and_constraints", ["coding-interview-learn-approach", "coding-interview-guided-practice", "coding-interview-custom-practice", "coding-interview-recognize-patterns", "coding-interview-contrast-practice", "coding-interview-weak-area-review", "coding-interview-independent-practice", "coding-interview-simulation"], ["prepare_for_an_interview", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"], ["strategy_selection", "constraint_analysis", "invariant_reasoning", "complexity_reasoning", "implementation_planning", "due_review"], packagePlan("complexity_and_constraints", ["Complete strategy-first free node covering constraints, complexity, approach legality, edge cases, and ordered implementation planning.", "Whole-node packages covering individual pattern families, cross-pattern contrasts, independent transfer, and interview simulation pools."], ["All problems and explanations are independently authored and retain stable item, interaction, taxonomy, and evidence identities.", "External technical facts require attributable sources; the track makes no executable-code or interview-readiness claim."]), "6bc5733606041c67e79838adf4e61107bcbc81f1d7dfc429a46ef176814e64f3"),
  descriptor("backend-system-design-interview", "design_interview", "Develop a repeatable interview process for clarifying backend-system requirements, estimating scale, defining data and service boundaries, evaluating tradeoffs, and communicating an evolvable design.", "A software-engineering candidate who can build backend services and wants structured practice turning ambiguous system-design prompts into justified architecture decisions.", ["case_archetype", "requirements_and_constraints", "architecture_decision", "tradeoff_boundary", "failure_and_evolution_scenario", "skill_atom"], "requirements_and_capacity_foundations", designModes, interviewGoals, ["requirements_clarification", "capacity_reasoning", "data_modeling", "service_boundaries", "reliability_tradeoffs", "design_communication", "due_review"], packagePlan("requirements_and_capacity_foundations", ["Complete foundations case set for requirements, rough capacity reasoning, scope control, and explicit assumptions.", "Whole-node case packages for data models, interfaces, scaling, reliability, consistency, observability, security, and architecture evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and make all material assumptions explicit.", "External technical mechanisms require attributable sources; cases do not claim one universal architecture or interview-readiness score."]), "4dfe10cda1892e185c8ee8d0d91e5dde98a42b00442935c13fd7eb42e9924eb0"),
  descriptor("object-oriented-design-interview", "design_interview", "Develop a repeatable interview process for identifying domain responsibilities, modeling collaborations and state changes, selecting abstractions, and explaining extensibility and testing tradeoffs.", "A software-engineering candidate who knows object-oriented programming and wants disciplined practice translating behavioral requirements into coherent object models.", ["domain_case_archetype", "behavioral_requirement", "responsibility_and_invariant", "object_collaboration", "extension_and_failure_scenario", "skill_atom"], "object_modeling_foundations", designModes, interviewGoals, ["domain_modeling", "responsibility_assignment", "state_and_invariants", "collaboration_design", "extensibility_tradeoffs", "design_communication", "due_review"], packagePlan("object_modeling_foundations", ["Complete object-modeling foundations cases covering requirements, responsibilities, state, invariants, and collaboration boundaries.", "Whole-node case packages for lifecycle modeling, extensibility, concurrency boundaries, error handling, testing, and design evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and state all behavioral assumptions.", "External language or pattern claims require attributable sources; content does not reward pattern-name recall without design justification."]), "4c2face04f25cd191a5b69e6bec58d1218dfe499e6ccfd7cbbc4b44f82de5068"),
  descriptor("frontend-system-design-interview", "design_interview", "Develop a repeatable interview process for clarifying frontend requirements, defining client boundaries and state, planning data flow and delivery, and justifying performance, accessibility, resilience, and maintainability tradeoffs.", "A frontend or full-stack engineering candidate who wants structured practice designing substantial client applications beyond component-level coding questions.", ["frontend_case_archetype", "user_and_system_requirement", "client_architecture_decision", "delivery_and_runtime_tradeoff", "failure_and_evolution_scenario", "skill_atom"], "frontend_architecture_foundations", designModes, interviewGoals, ["requirements_clarification", "state_and_data_flow", "client_boundaries", "performance_delivery", "accessibility_resilience", "design_communication", "due_review"], packagePlan("frontend_architecture_foundations", ["Complete frontend-architecture foundations cases covering user journeys, state ownership, data flow, rendering boundaries, and explicit assumptions.", "Whole-node case packages for delivery, performance, accessibility, offline behavior, resilience, observability, security, and architecture evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and state device, network, browser, and accessibility assumptions.", "External web-platform or framework facts require attributable sources; content remains framework-neutral unless a case explicitly constrains the stack."]), "17f0ee26013b4afc3cf44101c9ba820e30a8f6ee3b4235f932a6b6a560351d7f"),
  descriptor("google-cloud-associate-cloud-engineer", "certification", "Practice the technical decisions and operational reasoning relevant to associate-level Google Cloud administration while distinguishing Patternly learning results from any official certification outcome.", "A cloud practitioner preparing to reason about Google Cloud solution setup, implementation, access control, and operations through scenario-based retrieval and review.", ["cloud_domain", "scenario_signal", "topic_tag", "skill_evidence"], "setup_environment", certificationModes, certificationGoals, ["setup_environment", "planning_implementation", "access_security", "operations", "scenario_reasoning", "due_review"], packagePlan("setup_environment", ["Complete setup-environment free node with authored scenario feedback and review evidence.", "Whole-node packages for the remaining declared cloud domains, mixed practice, remediation, and simulation pools."], ["Provider-specific technical and exam-experience facts require current attributable Google public sources and recorded review dates.", "Content is independently authored, excludes exam dumps, and does not claim Google affiliation or an official score."]), "43b9ded6e88904defc993a7b8828379c0474a4ae82c89584d5899b3603f1a83f"),
  descriptor("aws-certified-solutions-architect-associate", "certification", "Practice choosing and explaining AWS architecture decisions under stated reliability, security, performance, operations, and cost constraints without treating practice results as an official certification outcome.", "A cloud practitioner who wants structured scenario practice for associate-level AWS solution architecture and evidence-based review of recurring decision errors.", ["official_exam_domain", "architecture_competency", "scenario_constraint", "service_decision", "skill_atom"], "cloud_architecture_foundations", certificationModes, certificationGoals, ["requirements_analysis", "reliability_decisions", "security_decisions", "performance_decisions", "cost_tradeoffs", "due_review"], packagePlan("cloud_architecture_foundations", ["Complete cloud-architecture foundations node covering requirement extraction, service-boundary reasoning, and explicit tradeoffs.", "Whole-node packages organized by reviewed exam domains, scenario competencies, remediation needs, and a sourced simulation profile."], ["AWS-specific facts and exam behavior require current attributable AWS public sources before content release.", "Content is independently authored, excludes exam dumps, and does not claim AWS affiliation or an official score."]), "9f99ef9866d2f0a6bce8a20043734ac41d05fd4e095a639d441a396b43b94e24"),
  descriptor("microsoft-azure-administrator-associate-az-104", "certification", "Practice Azure administration decisions across identity, governance, storage, compute, networking, and monitoring while keeping Patternly evidence separate from official certification results.", "An Azure administrator or cloud practitioner who wants scenario-based preparation, precise feedback, and durable review of associate-level administration decisions.", ["official_exam_domain", "administration_competency", "operational_scenario", "resource_decision", "skill_atom"], "azure_administration_foundations", certificationModes, certificationGoals, ["identity_governance", "storage_administration", "compute_administration", "networking_administration", "monitoring_recovery", "due_review"], packagePlan("azure_administration_foundations", ["Complete administration-foundations node covering resource scope, identity, safe change, and operational verification.", "Whole-node packages aligned to reviewed exam domains, competency remediation, mixed practice, and a sourced simulation profile."], ["Azure-specific facts and exam behavior require current attributable Microsoft public sources before content release.", "Content is independently authored, excludes exam dumps, and does not claim Microsoft affiliation or an official score."]), "ca43984dc13f9a21201d6110e57698a309844fefcdd3ef94ff88c8da6b3523ba"),
  descriptor("microsoft-azure-ai-fundamentals-ai-901", "certification", "Practice distinguishing foundational AI workload, responsible-use, and Azure service decisions while keeping Patternly learning evidence separate from any official certification outcome.", "A technical or non-technical learner who wants structured foundations practice for identifying AI workload requirements, limits, and responsible solution choices in an Azure context.", ["official_exam_domain", "ai_workload_category", "responsible_use_constraint", "service_capability_decision", "skill_atom"], "ai_workload_foundations", certificationModes, certificationGoals, ["ai_workload_recognition", "responsible_ai_reasoning", "machine_learning_foundations", "vision_language_workloads", "service_boundary_reasoning", "due_review"], packagePlan("ai_workload_foundations", ["Complete AI-workload foundations node covering requirement recognition, capability boundaries, and responsible-use constraints.", "Whole-node packages based on reviewed public objectives, scenario competencies, remediation needs, and a sourced simulation profile."], ["Azure AI and exam-specific facts require current attributable Microsoft public sources before content release.", "Content is independently authored, avoids capability overclaims, excludes exam dumps, and does not claim Microsoft affiliation or an official score."]), "613a0ff69b4d714a61532dfaecbc2358a3fcc25764a87d0d842ff143736f7e7c"),
  descriptor("hashicorp-terraform-associate-004", "certification", "Practice reasoning about Terraform configuration, state, workflow, modules, and safe infrastructure changes while distinguishing learning evidence from any official certification outcome.", "An infrastructure practitioner who wants structured preparation in infrastructure-as-code concepts, Terraform workflows, state reasoning, and operational tradeoffs.", ["official_exam_domain", "terraform_competency", "workflow_stage", "state_or_configuration_decision", "skill_atom"], "infrastructure_as_code_foundations", certificationModes, certificationGoals, ["infrastructure_as_code_reasoning", "configuration_workflow", "state_management", "module_reuse", "safe_change_analysis", "due_review"], packagePlan("infrastructure_as_code_foundations", ["Complete infrastructure-as-code foundations node covering configuration intent, plan and apply boundaries, state, and safe change review.", "Whole-node packages organized by reviewed objectives, workflow competencies, remediation needs, and a sourced simulation profile."], ["Terraform and exam-specific facts require current attributable HashiCorp public sources before content release.", "Content is independently authored, excludes exam dumps, and does not claim HashiCorp affiliation or an official score."]), "e985dca7279e60f276014d2a7e6dd2d540cf7239cde3a53246c3727a126c2672"),
  descriptor("kubernetes-cloud-native-associate-kcna", "certification", "Practice foundational Kubernetes and cloud-native decisions across architecture, orchestration, delivery, observability, and security without treating Patternly practice as an official certification outcome.", "A learner entering cloud-native operations or development who wants scenario-based foundations practice and durable review of Kubernetes and ecosystem decisions.", ["official_exam_domain", "cloud_native_competency", "operational_scenario", "platform_decision", "skill_atom"], "cloud_native_foundations", certificationModes, certificationGoals, ["kubernetes_architecture", "workload_orchestration", "cloud_native_delivery", "observability_reasoning", "security_boundaries", "due_review"], packagePlan("cloud_native_foundations", ["Complete cloud-native foundations node covering cluster roles, workload intent, declarative operation, and observable outcomes.", "Whole-node packages based on reviewed objectives, operational competencies, remediation needs, and a sourced simulation profile."], ["Kubernetes, cloud-native, and exam-specific facts require current attributable CNCF or project public sources before content release.", "Content is independently authored, excludes exam dumps, and does not claim CNCF affiliation or an official score."]), "1c5378b92f4c8f4325c7eda4a3842c99aae7c6b95f80f8f5a36bd0cf46109bdf"),
]);

function packagePlan(bundledFreeNodeId: string, contentScopes: readonly string[], provenanceRules: readonly string[]): TrackBriefDescriptor["packageContentPlan"] {
  return Object.freeze({ bundledFreeNodeId, premiumPackageUnit: "immutableCompressedWholeNodePackage", contentScopes: Object.freeze([...contentScopes]), provenanceRules: Object.freeze([...provenanceRules]) });
}

function descriptor(trackId: TrackId, internalFamily: TrackFamilyId, jobToBeDone: string, targetLearner: string, taxonomyOutline: readonly string[], freeNodeId: string, validModes: readonly string[], goalTemplates: readonly string[], progressDimensions: readonly string[], packageContentPlan: TrackBriefDescriptor["packageContentPlan"], sourceBriefSha256: string): TrackBriefDescriptor {
  return Object.freeze({ schemaVersion: "patternly-track-brief-v1", trackId, internalFamily, jobToBeDone, targetLearner, taxonomyOutline: Object.freeze([...taxonomyOutline]), freeNodeId, validModes: Object.freeze([...validModes]), goalTemplates: Object.freeze([...goalTemplates]), progressDimensions: Object.freeze([...progressDimensions]), packageContentPlan, sourceBriefSha256, launchCommercialGate: "realFreeVerticalAndCompleteCoreLoop" });
}

export type ProductionTrackArtifactEvidence = Readonly<{
  trackId: TrackId;
  bundledReleaseId: string;
}>;

/** Actual pinned whole-track artifacts. They are not free-node package proof. */
export const CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE: readonly ProductionTrackArtifactEvidence[] = Object.freeze([
  Object.freeze({ trackId: "coding-interview-dsa-problem-solving", bundledReleaseId: "patternly-core-0017" }),
  Object.freeze({ trackId: "google-cloud-associate-cloud-engineer", bundledReleaseId: "patternly-core-0016" }),
]);

export type ProductionTrackAdmissionEvaluation = Readonly<{
  trackId: TrackId;
  kind: "admitted" | "missing_artifact_evidence" | "unverified_free_node_package";
}>;

export function assertTrackDensityDescriptors(descriptors: readonly TrackBriefDescriptor[]): readonly TrackBriefDescriptor[] {
  if (descriptors.length !== REQUIRED_TRACK_IDS.length) throw new Error("Track density descriptors must contain exactly the ten canonical track IDs.");
  const ids = new Set<string>();
  const freeNodes = new Set<string>();
  for (const descriptor of descriptors) {
    if (!REQUIRED_TRACK_IDS.includes(descriptor.trackId as (typeof REQUIRED_TRACK_IDS)[number])) throw new Error(`Track density descriptor is not canonical: ${descriptor.trackId}.`);
    if (ids.has(descriptor.trackId)) throw new Error(`Track density descriptors must have unique track IDs: ${descriptor.trackId}.`);
    if (freeNodes.has(descriptor.freeNodeId)) throw new Error(`Track density descriptors must have unique free node IDs: ${descriptor.freeNodeId}.`);
    if (!nonEmpty(descriptor.jobToBeDone) || !nonEmpty(descriptor.targetLearner) || !nonEmpty(descriptor.freeNodeId) || !sha256(descriptor.sourceBriefSha256) || descriptor.launchCommercialGate !== "realFreeVerticalAndCompleteCoreLoop") throw new Error(`Track density descriptor is incomplete: ${descriptor.trackId}.`);
    if (!uniqueNonEmpty(descriptor.taxonomyOutline) || !uniqueNonEmpty(descriptor.validModes) || !uniqueNonEmpty(descriptor.goalTemplates) || !uniqueNonEmpty(descriptor.progressDimensions)) throw new Error(`Track density descriptor has incomplete collections: ${descriptor.trackId}.`);
    ids.add(descriptor.trackId);
    freeNodes.add(descriptor.freeNodeId);
  }
  for (const trackId of REQUIRED_TRACK_IDS) if (!ids.has(trackId)) throw new Error(`Track density descriptor is missing: ${trackId}.`);
  return Object.freeze([...descriptors]);
}

/**
 * Evaluates admission without changing the visible registry. Current artifacts
 * are whole-track banks, so they cannot prove the brief's complete free node.
 */
export function evaluateProductionTrackAdmissions(registrations: readonly TrackRegistration[], evidence: readonly ProductionTrackArtifactEvidence[] = CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE, descriptors: readonly TrackBriefDescriptor[] = TRACK_DENSITY_DESCRIPTORS): readonly ProductionTrackAdmissionEvaluation[] {
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
    evaluations.push(Object.freeze({ trackId: registration.id, kind: "unverified_free_node_package" }));
  }
  return Object.freeze(evaluations);
}

function uniqueNonEmpty(values: unknown): boolean {
  return Array.isArray(values) && values.length > 0 && values.every(nonEmpty) && new Set(values).size === values.length;
}

function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function sha256(value: string): boolean { return /^[a-f0-9]{64}$/u.test(value); }
