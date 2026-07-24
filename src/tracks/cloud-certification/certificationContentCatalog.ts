import { MissingContentItemError, type ContentItemRef } from "../../domain/learning";
import { CLOUD_CERTIFICATION_TRACK_ID } from "../../domain/tracks";
import { getCertificationMode, type CertificationQuestion } from "./domain";
import type { PublishedCertificationExamExperienceProfile } from "../../content/contracts";

export class CertificationContentCatalog {
  private readonly questionsById: ReadonlyMap<string, CertificationQuestion>;

  constructor(private readonly questions: readonly CertificationQuestion[], private readonly contentVersion: string, private readonly examExperienceProfile: PublishedCertificationExamExperienceProfile) {
    this.questionsById = new Map(questions.map((question) => [question.id, question]));
  }

  getContentVersion(): string { return this.contentVersion; }
  getExamExperienceProfile(): PublishedCertificationExamExperienceProfile { return this.examExperienceProfile; }
  getItems(): readonly CertificationQuestion[] { return this.questions; }
  getItemsForMode(modeId: string): readonly CertificationQuestion[] { getCertificationMode(modeId); return this.questions; }
  getItemById(itemId: string): CertificationQuestion {
    const item = this.questionsById.get(itemId);
    if (!item) throw new MissingContentItemError(CLOUD_CERTIFICATION_TRACK_ID, itemId);
    return item;
  }
  toContentItemRef(item: CertificationQuestion): ContentItemRef {
    return { contentVersion: this.contentVersion, itemId: item.id, trackId: CLOUD_CERTIFICATION_TRACK_ID };
  }
}
