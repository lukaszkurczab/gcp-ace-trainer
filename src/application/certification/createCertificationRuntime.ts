import { getBundledContentAvailability } from "../../content/application/validateBundledContent";
import { getCertificationContentCatalog } from "../../content/catalogRepository";
import { CertificationFamilyRuntime } from "./CertificationFamilyRuntime";

export function createCertificationFamilyRuntime(): CertificationFamilyRuntime {
  const availability = getBundledContentAvailability("google-cloud-associate-cloud-engineer");
  if (availability.kind !== "available" || availability.familyId !== "certification") throw new Error("Certification runtime requires a validated bundled Cloud artifact.");
  return new CertificationFamilyRuntime(getCertificationContentCatalog(), availability.taxonomyVersion);
}
