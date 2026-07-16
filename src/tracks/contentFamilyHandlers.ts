import type { ContentFamilyHandler } from "../content/application/contentFamilyHandler";
import { algorithmsContentFamilyHandler } from "./algorithms/contentFamilyHandler";
import { certificationContentFamilyHandler } from "./cloud-certification/contentFamilyHandler";

const handlers = new Map<string, ContentFamilyHandler>([
  [algorithmsContentFamilyHandler.familyId, algorithmsContentFamilyHandler],
  [certificationContentFamilyHandler.familyId, certificationContentFamilyHandler],
]);

export function getContentFamilyHandler(familyId: string): ContentFamilyHandler {
  const handler = handlers.get(familyId);
  if (!handler) throw new Error(`No content handler is registered for family ${familyId}.`);
  return handler;
}
