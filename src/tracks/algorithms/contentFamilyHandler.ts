import type { ContentFamilyHandler } from "../../content/application/contentFamilyHandler";
import { installAlgorithmsCatalog } from "../../content/catalogRepository";
import { validateAlgorithmsBank } from "../../content/validation";

export const algorithmsContentFamilyHandler: ContentFamilyHandler = Object.freeze({
  familyId: "algorithms",
  validate(payload, manifest) { validateAlgorithmsBank(payload, manifest); },
  install(payload, manifest) { installAlgorithmsCatalog(validateAlgorithmsBank(payload, manifest)); },
});
