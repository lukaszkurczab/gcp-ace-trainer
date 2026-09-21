import {
  CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  type TrackId,
} from "../../../domain";

export type CloudProgressDomainMetadata = Readonly<{
  description: string;
  id: string;
  title: string;
}>;

export type CloudProgressDomainMetadataResolution =
  | Readonly<{ kind: "available"; metadata: CloudProgressDomainMetadata }>
  | Readonly<{ id: string; kind: "unavailable" }>;

export const CLAUDE_PROGRESS_DOMAIN_IDS = Object.freeze([
  "solution_design_and_architecture",
  "model_prompt_and_context_decisions",
  "enterprise_tools_retrieval_and_integration",
  "evaluation_diagnosis_and_optimization",
  "governance_safety_and_risk_controls",
  "stakeholder_decisions_and_delivery_lifecycle",
  "team_workflows_and_operational_enablement",
] as const);

export const GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS = Object.freeze([
  "setup_environment",
  "planning_implementation",
  "operations",
  "access_security",
] as const);

const claudeMetadata = Object.freeze({
  solution_design_and_architecture: {
    description: "Turn business constraints into defensible Claude solution architectures.",
    title: "Solution Design & Architecture",
  },
  model_prompt_and_context_decisions: {
    description: "Choose Claude models, prompts, and context strategies for the requirement.",
    title: "Claude Models, Prompting & Context Engineering",
  },
  enterprise_tools_retrieval_and_integration: {
    description: "Connect Claude safely to enterprise tools, data, and retrieval systems.",
    title: "Integration",
  },
  evaluation_diagnosis_and_optimization: {
    description: "Evaluate behavior, diagnose failures, and optimize the solution.",
    title: "Evaluation, Testing & Optimization",
  },
  governance_safety_and_risk_controls: {
    description: "Apply governance, safety controls, and risk management across the solution.",
    title: "Governance, Safety & Risk Management",
  },
  stakeholder_decisions_and_delivery_lifecycle: {
    description: "Align stakeholders and manage decisions across the delivery lifecycle.",
    title: "Stakeholder Communication & Lifecycle Management",
  },
  team_workflows_and_operational_enablement: {
    description: "Enable productive developer workflows and reliable operations.",
    title: "Developer Productivity & Operational Enablement",
  },
} as const satisfies Record<(typeof CLAUDE_PROGRESS_DOMAIN_IDS)[number], Omit<CloudProgressDomainMetadata, "id">>);

const googleCloudMetadata = Object.freeze({
  setup_environment: {
    description: "Set up projects, billing, services, and the initial cloud environment.",
    title: "Setting up a cloud solution environment",
  },
  planning_implementation: {
    description: "Plan and configure compute, storage, data, and networking resources.",
    title: "Planning and configuring a cloud solution",
  },
  operations: {
    description: "Operate, monitor, maintain, and improve a reliable cloud solution.",
    title: "Ensuring successful operation of a cloud solution",
  },
  access_security: {
    description: "Configure identities, permissions, service accounts, and security controls.",
    title: "Configuring access and security",
  },
} as const satisfies Record<(typeof GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS)[number], Omit<CloudProgressDomainMetadata, "id">>);

export function resolveCloudProgressDomainMetadata(
  trackId: TrackId,
  domainId: string,
): CloudProgressDomainMetadataResolution {
  const catalog = trackId === CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID
    ? claudeMetadata
    : trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID
      ? googleCloudMetadata
      : null;
  const value = catalog ? (catalog as Record<string, Omit<CloudProgressDomainMetadata, "id">>)[domainId] : undefined;

  return value
    ? { kind: "available", metadata: { id: domainId, ...value } }
    : { id: domainId, kind: "unavailable" };
}
