# ODK-E2E-013 — roadmap/node inventory

Date: 2026-09-08  
Scope: read-only structural/runtime inventory for the 9 launch track roadmaps. Active question pools were **not** recounted; the existing 1053 total is left untouched.

## Result

There are **112 roadmap nodes** across the 9 active tracks. The current app has **9 bundled Free-node packages** (one per track). The other **103 nodes are shown in the roadmap but are locked in the current runtime and have zero available items in the installed package**.

The `available` value on `ALGORITHM_ROADMAP` is curriculum/taxonomy metadata. It is not the runtime entitlement state. Runtime presentation is assigned by `buildTopicRoadmapNodes`: the package `freeNodeId` is `current`; every other catalog node is `locked` (`src/features/practice/practiceFlowModel.ts:383-443`).

## Evidence and interpretation

- The task registry defines ODK-E2E-013 as an all-track/all-node inventory of real question limits (`docs/qa/ios-backend/E2E-OBSERVACJE-ROBOCZE.md:16`).
- Eight non-coding roadmaps are the exact ID arrays in `src/features/practice/trackRoadmapCatalog.ts:21-124`; Coding Interview is sourced from `ALGORITHM_ROADMAP` at `src/features/practice/trackRoadmapCatalog.ts:147-153`.
- Coding Interview has 26 nodes from `src/tracks/coding-interview/algorithmRoadmap.ts:45-50,62-97`.
- `ContentPackageRuntimeOwner` discovers only `GENERATED_FREE_NODE_PACKAGES` (`src/application/contentPackageRuntimeOwner.ts:5,28,49-67`). Current discovery does not use retained historical packages.
- Package validation requires a node-local taxonomy and requires every item in a package to point to that package's single `freeNodeId` (`src/content/application/contentPackageResolver.ts:86-114`). Thus a locked roadmap node has no item source in the current installed package.

## Nine current Free nodes

These are the only nodes with a bundled runtime package in the current build:

| Track | Free node | Current runtime state |
| --- | --- | --- |
| coding-interview-dsa-problem-solving | `complexity_and_constraints` | Free/current |
| backend-system-design-interview | `requirements_capacity_and_architecture_decomposition` | Free/current |
| object-oriented-design-interview | `requirements_use_cases_domain_vocabulary_and_model_boundaries` | Free/current |
| frontend-system-design-interview | `requirements_user_journeys_constraints_and_frontend_decomposition` | Free/current |
| google-cloud-associate-cloud-engineer | `organization_projects_policies_services_quotas_and_assets` | Free/current |
| aws-certified-solutions-architect-associate | `aws_secure_architecture_foundations` | Free/current |
| microsoft-azure-administrator-associate-az-104 | `entra_identity_lifecycle_and_authentication` | Free/current |
| microsoft-azure-ai-fundamentals-ai-901 | `responsible_ai_model_foundations_and_deployment_choices` | Free/current |
| claude-certified-architect-professional-certification | `solution_design_and_architecture` | Free/current |

## Remaining nodes — all locked and zero runtime items

The IDs below are the complete complement of the nine Free nodes. Every entry has `runtime status = locked` and `available runtime items = 0` in the current bundled package.

### Coding Interview — 25 locked of 26

- `arrays_and_strings`
- `hash_map_and_set`
- `two_pointers`
- `sliding_window`
- `prefix_sums`
- `sorting_based`
- `stack`
- `binary_search`
- `strategy_selection_core`
- `contrast_hash_map_vs_sorting`
- `contrast_two_pointers_vs_sliding_window`
- `contrast_sliding_window_vs_prefix_sums`
- `contrast_stack_vs_monotonic_stack_intro`
- `contrast_binary_search_vs_linear_scan`
- `linked_list`
- `recursion_basics`
- `tree_traversal`
- `heap_priority_queue`
- `intervals`
- `backtracking`
- `graph_traversal`
- `greedy_intro`
- `dynamic_programming_intro`
- `bit_manipulation`
- `math_and_geometry`

### Backend System Design Interview — 7 locked of 8

- `service_api_and_data_boundaries`
- `read_write_paths_and_scaling`
- `consistency_and_coordination`
- `asynchronous_workflows_and_streaming`
- `reliability_and_failure_containment`
- `security_observability_and_operability`
- `evolution_and_case_synthesis`

### Object-Oriented Design Interview — 6 locked of 7

- `responsibilities_and_collaborations`
- `invariants_and_lifecycle`
- `identity_persistence_and_external_boundaries`
- `extension_and_behavioral_substitution`
- `concurrency_failure_and_resource_ownership`
- `testing_evolution_and_case_synthesis`

### Frontend System Design Interview — 8 locked of 9

- `state_and_data_flow`
- `ui_composition_and_component_boundaries`
- `rendering_delivery_and_caching`
- `frontend_performance_engineering`
- `accessible_interaction_design`
- `offline_resilience_and_synchronization`
- `client_security_observability_and_operations`
- `evolution_testing_and_case_synthesis`

### Google Cloud Associate Cloud Engineer — 19 locked of 20

- `cloud_identity_workforce_federation_and_human_access`
- `billing_accounts_budgets_exports_costs_and_visibility`
- `vpc_topology_shared_networking_and_hybrid_connectivity`
- `network_security_load_balancing_and_service_tiers`
- `compute_platform_selection_and_accelerator_fit`
- `compute_engine_lifecycle_instances_storage_scaling_and_access`
- `gke_clusters_workloads_autoscaling_and_operations`
- `cloud_run_functions_events_and_release_operations`
- `agent_runtime_notebooks_and_developer_environments`
- `storage_products_classes_transfer_lifecycle_and_encryption`
- `database_selection_queries_backup_and_fleet_operations`
- `analytics_streaming_messaging_and_cache_services`
- `infrastructure_as_code_and_ai_assisted_delivery`
- `observability_setup_metrics_alerts_agents_and_prometheus`
- `logging_audit_exports_analytics_and_routing`
- `diagnostics_service_health_and_resource_optimization`
- `iam_policies_roles_inheritance_and_custom_roles`
- `service_accounts_permissions_impersonation_and_short_lived_credentials`
- `workload_identity_federation_and_gke_workload_identity`

### AWS Certified Solutions Architect Associate — 20 locked of 21

- `api_messaging_event_and_workflow_decoupling`
- `application_edge_threat_and_credential_security`
- `availability_fault_isolation_failover_and_quota_design`
- `compute_cost_optimization_purchasing_rightsizing_and_availability`
- `compute_performance_elasticity_and_workload_placement`
- `data_governance_classification_backup_and_compliance`
- `data_ingestion_streaming_lakes_transformation_and_analytics`
- `database_cost_optimization_engine_capacity_retention_and_migration`
- `database_performance_access_patterns_caching_and_replication`
- `disaster_recovery_data_durability_automation_and_operability`
- `encryption_keys_certificates_and_secrets`
- `identity_federation_and_root_access`
- `microservices_containers_serverless_and_purpose_built_services`
- `multi_account_governance_and_resource_authorization`
- `multi_tier_scaling_load_balancing_and_cache_patterns`
- `network_cost_optimization_nat_connectivity_routing_and_delivery`
- `network_performance_topology_hybrid_connectivity_and_edge`
- `storage_cost_optimization_lifecycle_migration_and_backup`
- `storage_performance_scalability_and_hybrid_access`
- `vpc_security_segmentation_and_private_service_access`

### Microsoft Azure Administrator Associate AZ-104 — 8 locked of 9

- `azure_resource_governance_rbac_policy_and_cost_control`
- `azure_storage_account_architecture_redundancy_and_data_movement`
- `azure_storage_access_blob_files_and_data_protection`
- `azure_resource_deployment_virtual_machines_and_resilience`
- `azure_app_service_and_container_compute`
- `azure_virtual_networking_addressing_peering_routing_and_dns`
- `azure_network_security_private_access_and_load_balancing`
- `azure_monitor_backup_and_site_recovery_operations`

### Microsoft Azure AI Fundamentals AI-901 — 4 locked of 5

- `ai_workload_recognition_and_capability_boundaries`
- `foundry_generative_ai_apps_agents_and_client_interaction`
- `text_speech_and_conversational_ai_solutions`
- `vision_image_generation_and_content_understanding_solutions`

### Claude Certified Architect Professional — 6 locked of 7

- `model_prompt_and_context_decisions`
- `enterprise_tools_retrieval_and_integration`
- `evaluation_diagnosis_and_optimization`
- `governance_safety_and_risk_controls`
- `stakeholder_decisions_and_delivery_lifecycle`
- `team_workflows_and_operational_enablement`

## Counts and limitations

- Structural node count: `26 + 8 + 7 + 9 + 20 + 21 + 9 + 5 + 7 = 112`.
- Runtime entitlement: `9 Free/current + 103 locked = 112`.
- I did not recalculate the existing active-pool total (1053), and I did not derive upstream per-node question counts. This inventory answers runtime availability; upstream content-depth follow-ups remain separate from the locked-node entitlement list.
- The AWS Free package's shallow pool and the Design track session-length limits are content/profile issues already captured by the ODK-E2E-013 follow-ups; they do not change the 103-node runtime lock result.
