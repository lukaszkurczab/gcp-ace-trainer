import type { CertificationDomain } from "../tracks/cloud-certification/domain";

export const EXAM_DOMAIN_LABELS: Record<CertificationDomain, string> = {
  setup_environment: "Setting up a cloud solution environment",
  planning_implementation: "Planning and configuring a cloud solution",
  operations: "Ensuring successful operation of a cloud solution",
  access_security: "Configuring access and security"
};
