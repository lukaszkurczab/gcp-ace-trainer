import { MissingContentItemError, type ContentItemRef } from "../../domain/learning";
import { CLOUD_CERTIFICATION_TRACK_ID } from "../../domain/tracks";
import { DEFAULT_QUESTION_BANK } from "../../features/questions/defaultQuestionBank";
import { getCertificationMode, type CertificationQuestion } from "./domain";

export const CERTIFICATION_CONTENT_VERSION = "ace-foundation-320";

export class CertificationContentCatalog {
  private readonly questionsById: ReadonlyMap<string, CertificationQuestion>;

  constructor(private readonly questions: readonly CertificationQuestion[] = DEFAULT_QUESTION_BANK) {
    this.questionsById = new Map(questions.map((question) => [question.id, question]));
  }

  getContentVersion(): string { return CERTIFICATION_CONTENT_VERSION; }
  getItems(): readonly CertificationQuestion[] { return this.questions; }
  getItemsForMode(modeId: string): readonly CertificationQuestion[] { getCertificationMode(modeId); return this.questions; }
  getItemById(itemId: string): CertificationQuestion {
    const item = this.questionsById.get(itemId);
    if (!item) throw new MissingContentItemError(CLOUD_CERTIFICATION_TRACK_ID, itemId);
    return item;
  }
  toContentItemRef(item: CertificationQuestion): ContentItemRef {
    return { contentVersion: CERTIFICATION_CONTENT_VERSION, itemId: item.id, trackId: CLOUD_CERTIFICATION_TRACK_ID };
  }
}

export const certificationContentCatalog = new CertificationContentCatalog();
