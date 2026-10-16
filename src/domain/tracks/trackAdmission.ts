import type { TrackFamilyId, TrackId } from "../learning/trackIdentity";
import type { GoalTemplateId } from "../goals/goalPolicy";
import { requireGoalPolicy } from "./trackGoalPolicies";

/** Canonical launch scope consumed by application admission. */
export const LAUNCH_TRACK_IDS = Object.freeze([
  "coding-interview-dsa-problem-solving",
  "backend-system-design-interview",
  "object-oriented-design-interview",
  "frontend-system-design-interview",
  "google-cloud-associate-cloud-engineer",
  "aws-certified-solutions-architect-associate",
  "microsoft-azure-administrator-associate-az-104",
  "microsoft-azure-ai-fundamentals-ai-901",
  "claude-certified-architect-professional-certification",
] as const);

export const CANONICAL_TRACK_BRIEF_SOURCE = Object.freeze({
  repository: "patternly-content",
  commit: "3f7e2ca58bbf978e7ebf7c8c2f93722f4a3055a6",
  schemaVersion: "patternly-track-brief-v2",
});

/** App-owned presentation; excluded from the immutable source-brief fingerprint. */
export type TrackQuestionPresentation = Readonly<{
  variant: "default" | "structuredCertificationPrompt";
  constraints: "show" | "hide";
  focusFeedback: boolean;
}>;

export const DEFAULT_TRACK_QUESTION_PRESENTATION: TrackQuestionPresentation = Object.freeze({
  variant: "default", constraints: "show", focusFeedback: false,
});

export type TrackDomainMetadata = Readonly<{ id: string; title: string; description: string }>;
export type TrackPresentationDescriptor = Readonly<{
  practiceQuestion: TrackQuestionPresentation;
  roadmapNodeIds: readonly string[];
  progressDomains: readonly TrackDomainMetadata[];
  progressEmptyState?: Readonly<{ title: string; recordedActivityDescription: string; reviewAction: boolean }>;
}>;

export function isSupportedTrackQuestionPresentation(value: TrackQuestionPresentation): boolean {
  return !!value && (value.variant === "default" || value.variant === "structuredCertificationPrompt")
    && (value.constraints === "show" || value.constraints === "hide") && typeof value.focusFeedback === "boolean";
}

export type TrackBriefDescriptor = Readonly<{
  schemaVersion: "patternly-track-brief-v2";
  trackId: TrackId;
  internalFamily: TrackFamilyId;
  jobToBeDone: string;
  targetLearner: string;
  taxonomyOutline: readonly string[];
  freeNodeId: string;
  validModes: readonly string[];
  goalTemplates: readonly GoalTemplateId[];
  progressDimensions: readonly string[];
  packageContentPlan: Readonly<{
    bundledFreeNodeId: string;
    premiumPackageUnit: "immutableCompressedWholeNodePackage";
    contentScopes: readonly string[];
    provenanceRules: readonly string[];
  }>;
  presentation: TrackPresentationDescriptor;
  sourceBriefCommit: string;
  sourceBriefSha256: string;
  launchCommercialGate: "realFreeVerticalAndCompleteCoreLoop";
}>;

const designModes = ["design-interview-learn-framework", "design-interview-tradeoff-practice", "design-interview-weak-area-review", "design-interview-simulation"] as const;
const certificationModes = ["certification-diagnostic-baseline", "certification-focus-practice", "certification-scenario-practice", "certification-weak-area-review", "certification-mixed-practice", "certification-quick-review", "certification-exam-simulation"] as const;

/**
 * A pinned projection of the canonical launch content-owned briefs.
 * It exists to keep the application registry scalable without presenting
 * descriptors as user-selectable tracks. The SHA-256 values identify the
 * exact canonical brief files at each descriptor's sourceBriefCommit.
 */
export const TRACK_DENSITY_DESCRIPTORS: readonly TrackBriefDescriptor[] = Object.freeze([
  descriptor("coding-interview-dsa-problem-solving", "coding_interview", "Build a repeatable way to analyze interview-style data-structure and algorithm problems, choose a legal strategy, justify it, and produce an implementation plan without relying on executable-code judging.", "A software-engineering candidate who knows basic programming and wants structured practice in constraints, patterns, invariants, complexity, edge cases, and implementation planning.", ["roadmap_node", "mental_unit", "pattern_family", "pattern_variant", "problem_archetype", "skill_atom"], "complexity_and_constraints", ["coding-interview-learn-approach", "coding-interview-guided-practice", "coding-interview-custom-practice", "coding-interview-recognize-patterns", "coding-interview-contrast-practice", "coding-interview-weak-area-review", "coding-interview-independent-practice", "coding-interview-simulation"], ["strategy_selection", "constraint_analysis", "invariant_reasoning", "complexity_reasoning", "implementation_planning", "due_review"], packagePlan("complexity_and_constraints", ["Complete strategy-first free node covering constraints, complexity, approach legality, edge cases, and ordered implementation planning.", "Whole-node packages covering individual pattern families, cross-pattern contrasts, independent transfer, and interview simulation pools."], ["All problems and explanations are independently authored and retain stable item, interaction, taxonomy, and evidence identities.", "External technical facts require attributable sources; the track makes no executable-code or interview-readiness claim."]), "b410b681cbb9ad6c82a3680af4848a0eac708ea377ec6a6dec62db61867686a0", "b21c745518076de5b69b9dbfd204314a8b23217e"),
  descriptor("backend-system-design-interview", "design_interview", "Develop a repeatable interview process for clarifying backend-system requirements, estimating scale, defining data and service boundaries, evaluating tradeoffs, and communicating an evolvable design.", "A software-engineering candidate who can build backend services and wants structured practice turning ambiguous system-design prompts into justified architecture decisions.", ["case_archetype", "requirements_and_constraints", "architecture_decision", "tradeoff_boundary", "failure_and_evolution_scenario", "skill_atom"], "requirements_capacity_and_architecture_decomposition", designModes, ["requirements_clarification", "capacity_reasoning", "data_modeling", "service_boundaries", "reliability_tradeoffs", "design_communication", "due_review"], packagePlan("requirements_capacity_and_architecture_decomposition", ["Complete foundations case set for requirements, rough capacity reasoning, scope control, and explicit assumptions.", "Whole-node case packages for data models, interfaces, scaling, reliability, consistency, observability, security, and architecture evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and make all material assumptions explicit.", "External technical mechanisms require attributable sources; cases do not claim one universal architecture or interview-readiness score."]), "5b725f7ab470cc46dd29d922a470d2e486fcad5a9ea11924f5f295520bdba997", undefined, {
    practiceQuestion: DEFAULT_TRACK_QUESTION_PRESENTATION,
    roadmapNodeIds: [
      "requirements_capacity_and_architecture_decomposition",
      "service_api_and_data_boundaries",
      "read_write_paths_and_scaling",
      "consistency_and_coordination",
      "asynchronous_workflows_and_streaming",
      "reliability_and_failure_containment",
      "security_observability_and_operability",
      "evolution_and_case_synthesis",
    ],
    progressDomains: [],
  }),
  descriptor("object-oriented-design-interview", "design_interview", "Develop a repeatable interview process for identifying domain responsibilities, modeling collaborations and state changes, selecting abstractions, and explaining extensibility and testing tradeoffs.", "A software-engineering candidate who knows object-oriented programming and wants disciplined practice translating behavioral requirements into coherent object models.", ["domain_case_archetype", "behavioral_requirement", "responsibility_and_invariant", "object_collaboration", "extension_and_failure_scenario", "skill_atom"], "requirements_use_cases_domain_vocabulary_and_model_boundaries", designModes, ["domain_modeling", "responsibility_assignment", "state_and_invariants", "collaboration_design", "extensibility_tradeoffs", "design_communication", "due_review"], packagePlan("requirements_use_cases_domain_vocabulary_and_model_boundaries", ["Complete object-modeling foundations cases covering requirements, responsibilities, state, invariants, and collaboration boundaries.", "Whole-node case packages for lifecycle modeling, extensibility, concurrency boundaries, error handling, testing, and design evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and state all behavioral assumptions.", "External language or pattern claims require attributable sources; content does not reward pattern-name recall without design justification."]), "2d43d7659510d23185739bd1d13e9e921f47cc58df02cb2071092f1a6751383c", undefined, {
    practiceQuestion: DEFAULT_TRACK_QUESTION_PRESENTATION,
    roadmapNodeIds: [
      "requirements_use_cases_domain_vocabulary_and_model_boundaries",
      "responsibilities_and_collaborations",
      "invariants_and_lifecycle",
      "identity_persistence_and_external_boundaries",
      "extension_and_behavioral_substitution",
      "concurrency_failure_and_resource_ownership",
      "testing_evolution_and_case_synthesis",
    ],
    progressDomains: [],
  }),
  descriptor("frontend-system-design-interview", "design_interview", "Develop a repeatable interview process for clarifying frontend requirements, defining client boundaries and state, planning data flow and delivery, and justifying performance, accessibility, resilience, and maintainability tradeoffs.", "A frontend or full-stack engineering candidate who wants structured practice designing substantial client applications beyond component-level coding questions.", ["frontend_case_archetype", "user_and_system_requirement", "client_architecture_decision", "delivery_and_runtime_tradeoff", "failure_and_evolution_scenario", "skill_atom"], "requirements_user_journeys_constraints_and_frontend_decomposition", designModes, ["requirements_clarification", "state_and_data_flow", "client_boundaries", "performance_delivery", "accessibility_resilience", "design_communication", "due_review"], packagePlan("requirements_user_journeys_constraints_and_frontend_decomposition", ["Complete frontend-architecture foundations cases covering user journeys, state ownership, data flow, rendering boundaries, and explicit assumptions.", "Whole-node case packages for delivery, performance, accessibility, offline behavior, resilience, observability, security, and architecture evolution."], ["Cases, diagrams, expected decisions, and feedback are independently authored and state device, network, browser, and accessibility assumptions.", "External web-platform or framework facts require attributable sources; content remains framework-neutral unless a case explicitly constrains the stack."]), "353b921c681a6691283a5e1a59ea79294d51dd60db4da864c68abde2eec909b6", undefined, {
    practiceQuestion: DEFAULT_TRACK_QUESTION_PRESENTATION,
    roadmapNodeIds: [
      "requirements_user_journeys_constraints_and_frontend_decomposition",
      "state_and_data_flow",
      "ui_composition_and_component_boundaries",
      "rendering_delivery_and_caching",
      "frontend_performance_engineering",
      "accessible_interaction_design",
      "offline_resilience_and_synchronization",
      "client_security_observability_and_operations",
      "evolution_testing_and_case_synthesis",
    ],
    progressDomains: [],
  }),
  descriptor("google-cloud-associate-cloud-engineer", "certification", "Practice the technical decisions and operational reasoning relevant to associate-level Google Cloud administration while distinguishing Patternly learning results from any official certification outcome.", "A cloud practitioner preparing to reason about Google Cloud solution setup, implementation, access control, and operations through scenario-based retrieval and review.", ["cloud_domain", "scenario_signal", "topic_tag", "skill_evidence"], "organization_projects_policies_services_quotas_and_assets", ["certification-diagnostic-baseline", "certification-focus-practice", "certification-weak-area-review", "certification-mixed-practice", "certification-quick-review", "certification-exam-simulation"], ["setup_environment", "planning_implementation", "access_security", "operations", "scenario_reasoning", "due_review"], packagePlan("organization_projects_policies_services_quotas_and_assets", ["Complete organization/projects/policies/services free node with authored scenario feedback and review evidence.", "Whole-node packages for the remaining declared cloud domains, mixed practice, remediation, and simulation pools."], ["Provider-specific technical and exam-experience facts require current attributable Google public sources and recorded review dates.", "Content is independently authored, excludes exam dumps, and does not claim Google affiliation or an official score."]), "7416a7c4c2349a455c9c9509984d1873fad308f952595d475a4d3e52c41fc340", undefined, {
    practiceQuestion: DEFAULT_TRACK_QUESTION_PRESENTATION,
    roadmapNodeIds: [
      "organization_projects_policies_services_quotas_and_assets",
      "cloud_identity_workforce_federation_and_human_access",
      "billing_accounts_budgets_exports_costs_and_visibility",
      "vpc_topology_shared_networking_and_hybrid_connectivity",
      "network_security_load_balancing_and_service_tiers",
      "compute_platform_selection_and_accelerator_fit",
      "compute_engine_lifecycle_instances_storage_scaling_and_access",
      "gke_clusters_workloads_autoscaling_and_operations",
      "cloud_run_functions_events_and_release_operations",
      "agent_runtime_notebooks_and_developer_environments",
      "storage_products_classes_transfer_lifecycle_and_encryption",
      "database_selection_queries_backup_and_fleet_operations",
      "analytics_streaming_messaging_and_cache_services",
      "infrastructure_as_code_and_ai_assisted_delivery",
      "observability_setup_metrics_alerts_agents_and_prometheus",
      "logging_audit_exports_analytics_and_routing",
      "diagnostics_service_health_and_resource_optimization",
      "iam_policies_roles_inheritance_and_custom_roles",
      "service_accounts_permissions_impersonation_and_short_lived_credentials",
      "workload_identity_federation_and_gke_workload_identity",
    ],
    progressDomains: [
      { id: "setup_environment", title: "Setting up a cloud solution environment", description: "Set up projects, billing, services, and the initial cloud environment." },
      { id: "planning_implementation", title: "Planning and configuring a cloud solution", description: "Plan and configure compute, storage, data, and networking resources." },
      { id: "operations", title: "Ensuring successful operation of a cloud solution", description: "Operate, monitor, maintain, and improve a reliable cloud solution." },
      { id: "access_security", title: "Configuring access and security", description: "Configure identities, permissions, service accounts, and security controls." },
    ],
  }),
  descriptor("aws-certified-solutions-architect-associate", "certification", "Practice choosing and explaining AWS architecture decisions under stated reliability, security, performance, operations, and cost constraints without treating practice results as an official certification outcome.", "A cloud practitioner who wants structured scenario practice for associate-level AWS solution architecture and evidence-based review of recurring decision errors.", ["official_exam_domain", "architecture_competency", "scenario_constraint", "service_decision", "skill_atom"], "aws_secure_architecture_foundations", certificationModes, ["requirements_analysis", "reliability_decisions", "security_decisions", "performance_decisions", "cost_tradeoffs", "due_review"], packagePlan("aws_secure_architecture_foundations", ["Complete cloud-architecture foundations node covering requirement extraction, service-boundary reasoning, and explicit tradeoffs.", "Whole-node packages organized by reviewed exam domains, scenario competencies, remediation needs, and a sourced simulation profile."], ["AWS-specific facts and exam behavior require current attributable AWS public sources before content release.", "Content is independently authored, excludes exam dumps, and does not claim AWS affiliation or an official score."]), "9b7b9a661121ce95e08cafe4ab6af88fac54034089018b2f974c6269f09c2ea6", undefined, {
    practiceQuestion: DEFAULT_TRACK_QUESTION_PRESENTATION,
    roadmapNodeIds: [
      "aws_secure_architecture_foundations",
      "api_messaging_event_and_workflow_decoupling",
      "application_edge_threat_and_credential_security",
      "availability_fault_isolation_failover_and_quota_design",
      "compute_cost_optimization_purchasing_rightsizing_and_availability",
      "compute_performance_elasticity_and_workload_placement",
      "data_governance_classification_backup_and_compliance",
      "data_ingestion_streaming_lakes_transformation_and_analytics",
      "database_cost_optimization_engine_capacity_retention_and_migration",
      "database_performance_access_patterns_caching_and_replication",
      "disaster_recovery_data_durability_automation_and_operability",
      "encryption_keys_certificates_and_secrets",
      "identity_federation_and_root_access",
      "microservices_containers_serverless_and_purpose_built_services",
      "multi_account_governance_and_resource_authorization",
      "multi_tier_scaling_load_balancing_and_cache_patterns",
      "network_cost_optimization_nat_connectivity_routing_and_delivery",
      "network_performance_topology_hybrid_connectivity_and_edge",
      "storage_cost_optimization_lifecycle_migration_and_backup",
      "storage_performance_scalability_and_hybrid_access",
      "vpc_security_segmentation_and_private_service_access",
    ],
    progressDomains: [],
  }),
  descriptor("microsoft-azure-administrator-associate-az-104", "certification", "Practice Azure administration decisions across identity, governance, storage, compute, networking, and monitoring while keeping Patternly evidence separate from official certification results.", "An Azure administrator or cloud practitioner who wants scenario-based preparation, precise feedback, and durable review of associate-level administration decisions.", ["official_exam_domain", "administration_competency", "operational_scenario", "resource_decision", "skill_atom"], "entra_identity_lifecycle_and_authentication", certificationModes, ["identity_governance", "storage_administration", "compute_administration", "networking_administration", "monitoring_recovery", "due_review"], packagePlan("entra_identity_lifecycle_and_authentication", ["Complete Microsoft Entra identity lifecycle and authentication node covering users, groups, licensing, external identities, and self-service password reset.", "Whole-node packages aligned to reviewed exam domains, competency remediation, mixed practice, and a sourced simulation profile."], ["Azure-specific facts and exam behavior require current attributable Microsoft public sources before content release.", "Content is independently authored, excludes exam dumps, and does not claim Microsoft affiliation or an official score."]), "4de8b57e581e57d970701a732e92fb5cc6d5dd5f233ca888a57b0006bba46f55", undefined, {
    practiceQuestion: DEFAULT_TRACK_QUESTION_PRESENTATION,
    roadmapNodeIds: [
      "entra_identity_lifecycle_and_authentication",
      "azure_resource_governance_rbac_policy_and_cost_control",
      "azure_storage_account_architecture_redundancy_and_data_movement",
      "azure_storage_access_blob_files_and_data_protection",
      "azure_resource_deployment_virtual_machines_and_resilience",
      "azure_app_service_and_container_compute",
      "azure_virtual_networking_addressing_peering_routing_and_dns",
      "azure_network_security_private_access_and_load_balancing",
      "azure_monitor_backup_and_site_recovery_operations",
    ],
    progressDomains: [],
  }),
  descriptor("microsoft-azure-ai-fundamentals-ai-901", "certification", "Practice distinguishing foundational AI workload, responsible-use, and Azure service decisions while keeping Patternly learning evidence separate from any official certification outcome.", "A technical or non-technical learner who wants structured foundations practice for identifying AI workload requirements, limits, and responsible solution choices in an Azure context.", ["official_exam_domain", "ai_workload_category", "responsible_use_constraint", "service_capability_decision", "skill_atom"], "responsible_ai_model_foundations_and_deployment_choices", certificationModes, ["ai_workload_recognition", "responsible_ai_reasoning", "machine_learning_foundations", "vision_language_workloads", "service_boundary_reasoning", "due_review"], packagePlan("responsible_ai_model_foundations_and_deployment_choices", ["Complete AI-workload foundations node covering requirement recognition, capability boundaries, and responsible-use constraints.", "Whole-node packages based on reviewed public objectives, scenario competencies, remediation needs, and a sourced simulation profile."], ["Azure AI and exam-specific facts require current attributable Microsoft public sources before content release.", "Content is independently authored, avoids capability overclaims, excludes exam dumps, and does not claim Microsoft affiliation or an official score."]), "7ccf38a78e8a430b39d2cd0ba4e0f37e93a13e50cba8e05e61261d281fe7fa6f", undefined, {
    practiceQuestion: DEFAULT_TRACK_QUESTION_PRESENTATION,
    roadmapNodeIds: [
      "responsible_ai_model_foundations_and_deployment_choices",
      "ai_workload_recognition_and_capability_boundaries",
      "foundry_generative_ai_apps_agents_and_client_interaction",
      "text_speech_and_conversational_ai_solutions",
      "vision_image_generation_and_content_understanding_solutions",
    ],
    progressDomains: [],
  }),
  descriptor("claude-certified-architect-professional-certification", "certification", "Practice defensible architecture decisions for production Claude systems, from discovery and integration to evaluation, governance, handoff, and operations.", "An experienced solution architect or technical lead preparing for CCAR-P with hands-on experience building and operating LLM systems.", ["official_exam_domain", "architecture_competency", "decision_model", "skill_atom"], "solution_design_and_architecture", certificationModes, ["architecture_selection", "context_and_model_tradeoffs", "secure_integration", "evaluation_and_diagnosis", "risk_and_governance", "stakeholder_alignment", "operational_enablement", "due_review"], packagePlan("solution_design_and_architecture", ["Complete solution-design node: business constraints, end-to-end boundaries, architecture patterns, orchestration, decomposition, and value evidence.", "Whole-node practice for model/context engineering, enterprise integration, evaluation, governance, stakeholder lifecycle, and team operations."], ["Use the CCAR-P v1.0 blueprint for scope and checked first-party documentation for each tested mechanism.", "Independently authored scenarios do not reproduce exam items or imply Anthropic affiliation.", "Practice feedback uses Patternly scoring; the provider scaled passing score is not a raw percentage or a readiness prediction."]), "6f1463cb914c15943c455ba5bc2413aa656e803754eb8297c1b26818acb1cff9", "e88c08dcd163dab7c7b562ef1f2a26160860d07b", {
    practiceQuestion: { variant: "structuredCertificationPrompt", constraints: "hide", focusFeedback: true },
    progressEmptyState: { title: "No performance evidence for this version yet", recordedActivityDescription: "Earlier activity and reviews remain available.", reviewAction: true },
    roadmapNodeIds: [
      "solution_design_and_architecture",
      "model_prompt_and_context_decisions",
      "enterprise_tools_retrieval_and_integration",
      "evaluation_diagnosis_and_optimization",
      "governance_safety_and_risk_controls",
      "stakeholder_decisions_and_delivery_lifecycle",
      "team_workflows_and_operational_enablement",
    ],
    progressDomains: [
      { id: "solution_design_and_architecture", title: "Solution Design & Architecture", description: "Turn business constraints into defensible Claude solution architectures." },
      { id: "model_prompt_and_context_decisions", title: "Claude Models, Prompting & Context Engineering", description: "Choose Claude models, prompts, and context strategies for the requirement." },
      { id: "enterprise_tools_retrieval_and_integration", title: "Integration", description: "Connect Claude safely to enterprise tools, data, and retrieval systems." },
      { id: "evaluation_diagnosis_and_optimization", title: "Evaluation, Testing & Optimization", description: "Evaluate behavior, diagnose failures, and optimize the solution." },
      { id: "governance_safety_and_risk_controls", title: "Governance, Safety & Risk Management", description: "Apply governance, safety controls, and risk management across the solution." },
      { id: "stakeholder_decisions_and_delivery_lifecycle", title: "Stakeholder Communication & Lifecycle Management", description: "Align stakeholders and manage decisions across the delivery lifecycle." },
      { id: "team_workflows_and_operational_enablement", title: "Developer Productivity & Operational Enablement", description: "Enable productive developer workflows and reliable operations." },
    ],
  }),
]);

function packagePlan(bundledFreeNodeId: string, contentScopes: readonly string[], provenanceRules: readonly string[]): TrackBriefDescriptor["packageContentPlan"] {
  return Object.freeze({ bundledFreeNodeId, premiumPackageUnit: "immutableCompressedWholeNodePackage", contentScopes: Object.freeze([...contentScopes]), provenanceRules: Object.freeze([...provenanceRules]) });
}

function descriptor(trackId: TrackId, internalFamily: TrackFamilyId, jobToBeDone: string, targetLearner: string, taxonomyOutline: readonly string[], freeNodeId: string, validModes: readonly string[], progressDimensions: readonly string[], packageContentPlan: TrackBriefDescriptor["packageContentPlan"], sourceBriefSha256: string, sourceBriefCommit: string = CANONICAL_TRACK_BRIEF_SOURCE.commit, presentation: TrackPresentationDescriptor = { practiceQuestion: DEFAULT_TRACK_QUESTION_PRESENTATION, roadmapNodeIds: [], progressDomains: [] }): TrackBriefDescriptor {
  return Object.freeze({ schemaVersion: "patternly-track-brief-v2", trackId, internalFamily, jobToBeDone, targetLearner, taxonomyOutline: Object.freeze([...taxonomyOutline]), freeNodeId, validModes: Object.freeze([...validModes]), goalTemplates: requireGoalPolicy(trackId).validGoalTemplateIds, progressDimensions: Object.freeze([...progressDimensions]), packageContentPlan, presentation: Object.freeze({ ...(presentation.progressEmptyState ? { progressEmptyState: Object.freeze({ ...presentation.progressEmptyState }) } : {}), practiceQuestion: Object.freeze({ ...presentation.practiceQuestion }), roadmapNodeIds: Object.freeze([...presentation.roadmapNodeIds]), progressDomains: Object.freeze(presentation.progressDomains.map(value => Object.freeze({ ...value }))) }), sourceBriefCommit, sourceBriefSha256, launchCommercialGate: "realFreeVerticalAndCompleteCoreLoop" });
}

export function findTrackDescriptor(trackId: string): TrackBriefDescriptor | undefined {
  return TRACK_DENSITY_DESCRIPTORS.find(descriptor => descriptor.trackId === trackId);
}

export type TrackDomainMetadataResolution =
  | Readonly<{ kind: "available"; metadata: TrackDomainMetadata }>
  | Readonly<{ id: string; kind: "unavailable" }>;

export function resolveTrackDomainMetadata(descriptor: Pick<TrackBriefDescriptor, "presentation"> | undefined, id: string): TrackDomainMetadataResolution {
  const domains = descriptor?.presentation?.progressDomains;
  if (!domains) return { kind: "unavailable", id };
  const metadata = domains.find(value => value.id === id);
  if (metadata) return { kind: "available", metadata };
  // Authored progress domains are exhaustive; never fall through to another taxonomy.
  if (domains.length > 0 || !descriptor?.presentation.roadmapNodeIds.includes(id)) return { kind: "unavailable", id };
  return { kind: "available", metadata: { id, title: id.replace(/[_-]+/g, " ").replace(/\b\w/g, character => character.toUpperCase()), description: "" } };
}
