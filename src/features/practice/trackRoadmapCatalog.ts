import {
  AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID,
  BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
  CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID,
  CODING_INTERVIEW_TRACK_ID,
  FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  MICROSOFT_AZURE_ADMINISTRATOR_ASSOCIATE_AZ_104_TRACK_ID,
  MICROSOFT_AZURE_AI_FUNDAMENTALS_AI_901_TRACK_ID,
  OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID,
  type TrackId,
} from "../../domain";
import { ALGORITHM_ROADMAP } from "../../tracks/coding-interview";

export type TrackRoadmapCatalogNode = Readonly<{
  description: string;
  id: string;
  title: string;
}>;

const roadmapIds = {
  [AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID]: [
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
  [BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID]: [
    "requirements_capacity_and_architecture_decomposition",
    "service_api_and_data_boundaries",
    "read_write_paths_and_scaling",
    "consistency_and_coordination",
    "asynchronous_workflows_and_streaming",
    "reliability_and_failure_containment",
    "security_observability_and_operability",
    "evolution_and_case_synthesis",
  ],
  [FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID]: [
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
  [GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID]: [
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
  [MICROSOFT_AZURE_ADMINISTRATOR_ASSOCIATE_AZ_104_TRACK_ID]: [
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
  [MICROSOFT_AZURE_AI_FUNDAMENTALS_AI_901_TRACK_ID]: [
    "responsible_ai_model_foundations_and_deployment_choices",
    "ai_workload_recognition_and_capability_boundaries",
    "foundry_generative_ai_apps_agents_and_client_interaction",
    "text_speech_and_conversational_ai_solutions",
    "vision_image_generation_and_content_understanding_solutions",
  ],
  [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID]: [
    "solution_design_and_architecture",
    "model_prompt_and_context_decisions",
    "enterprise_tools_retrieval_and_integration",
    "evaluation_diagnosis_and_optimization",
    "governance_safety_and_risk_controls",
    "stakeholder_decisions_and_delivery_lifecycle",
    "team_workflows_and_operational_enablement",
  ],
  [OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID]: [
    "requirements_use_cases_domain_vocabulary_and_model_boundaries",
    "responsibilities_and_collaborations",
    "invariants_and_lifecycle",
    "identity_persistence_and_external_boundaries",
    "extension_and_behavioral_substitution",
    "concurrency_failure_and_resource_ownership",
    "testing_evolution_and_case_synthesis",
  ],
} as const satisfies Record<Exclude<TrackId, typeof CODING_INTERVIEW_TRACK_ID>, readonly string[]>;

function titleForNode(id: string): string {
  return id
    .replace(/[_-]+/g, " ")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bapi\b/gi, "API")
    .replace(/\baws\b/gi, "AWS")
    .replace(/\bgke\b/gi, "GKE")
    .replace(/\biam\b/gi, "IAM")
    .replace(/\bvpc\b/gi, "VPC")
    .replace(/\brbac\b/gi, "RBAC")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function descriptionForNode(id: string): string {
  return `Practice scenarios for ${titleForNode(id)}.`;
}

function catalogNode(id: string): TrackRoadmapCatalogNode {
  return Object.freeze({ description: descriptionForNode(id), id, title: titleForNode(id) });
}

export function getTrackRoadmapCatalog(trackId: TrackId): readonly TrackRoadmapCatalogNode[] {
  if (trackId === CODING_INTERVIEW_TRACK_ID) {
    return ALGORITHM_ROADMAP.nodes.map((node) => Object.freeze({
      description: node.shortDescription,
      id: node.id,
      title: node.label,
    }));
  }

  const ids = roadmapIds[trackId as keyof typeof roadmapIds];
  if (!ids) throw new Error(`Roadmap catalogue unavailable for track ${trackId}.`);
  return ids.map(catalogNode);
}
