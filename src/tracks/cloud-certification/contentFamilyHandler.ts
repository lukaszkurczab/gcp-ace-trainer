import type { ContentFamilyHandler } from "../../content/application/contentFamilyHandler";
import { installCertificationCatalog } from "../../content/catalogRepository";
import { validateCertificationBank } from "../../content/validation";

export const certificationContentFamilyHandler: ContentFamilyHandler = Object.freeze({
  familyId: "certification",
  validate(payload, manifest) { validateCertificationBank(payload, manifest); },
  install(payload, manifest) { installCertificationCatalog(validateCertificationBank(payload, manifest)); },
});
