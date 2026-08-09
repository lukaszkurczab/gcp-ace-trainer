import type { ContentFamilyHandler } from "../content/application/contentFamilyHandler";
import { codingInterviewContentFamilyHandler } from "./coding-interview/contentFamilyHandler";
import { certificationContentFamilyHandler } from "./certification/contentFamilyHandler";

const handlers = new Map<string, ContentFamilyHandler>([
  [codingInterviewContentFamilyHandler.familyId, codingInterviewContentFamilyHandler],
  [certificationContentFamilyHandler.familyId, certificationContentFamilyHandler],
]);

export function getContentFamilyHandler(familyId: string): ContentFamilyHandler {
  const handler = handlers.get(familyId);
  if (!handler) throw new Error(`No content handler is registered for family ${familyId}.`);
  return handler;
}
