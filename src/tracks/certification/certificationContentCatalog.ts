import { MissingContentItemError, type ContentItemRef } from "../../domain/learning";
import { GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID } from "../../domain/tracks";
import { getCertificationMode, type CertificationQuestion } from "./domain";
import type { PublishedCertificationDiagnosticBaseline, PublishedCertificationExamExperienceProfile, PublishedCertificationFocusPractice, PublishedCertificationMixedPractice, PublishedCertificationQuickReview, PublishedCertificationScenarioPractice, PublishedCertificationWeakAreaReview } from "../../content/contracts";

export class CertificationContentCatalog {
  private readonly questionsById: ReadonlyMap<string, CertificationQuestion>;

  constructor(private readonly questions: readonly CertificationQuestion[], private readonly contentVersion: string, private readonly diagnosticBaseline: PublishedCertificationDiagnosticBaseline | undefined, private readonly focusPractice: PublishedCertificationFocusPractice | undefined, private readonly examExperienceProfile: PublishedCertificationExamExperienceProfile, private readonly scenarioPractice?: PublishedCertificationScenarioPractice, private readonly weakAreaReview?: PublishedCertificationWeakAreaReview, private readonly mixedPractice?: PublishedCertificationMixedPractice, private readonly quickReview?: PublishedCertificationQuickReview) {
    this.questionsById = new Map(questions.map((question) => [question.id, question]));
  }

  getContentVersion(): string { return this.contentVersion; }
  getExamExperienceProfile(): PublishedCertificationExamExperienceProfile { return this.examExperienceProfile; }
  getDiagnosticBaseline(): PublishedCertificationDiagnosticBaseline { if (!this.diagnosticBaseline) throw new Error("Certification Diagnostic Baseline is absent from the installed catalog."); return this.diagnosticBaseline; }
  getFocusPractice(): PublishedCertificationFocusPractice { if (!this.focusPractice) throw new Error("Certification Focus Practice is absent from the installed catalog."); return this.focusPractice; }
  getScenarioPractice(): PublishedCertificationScenarioPractice { if (!this.scenarioPractice) throw new Error("Certification Scenario Practice is absent from the installed catalog."); return this.scenarioPractice; }
  getWeakAreaReview(): PublishedCertificationWeakAreaReview { if (!this.weakAreaReview) throw new Error("Certification Weak Area Review is absent from the installed catalog."); return this.weakAreaReview; }
  getMixedPractice(): PublishedCertificationMixedPractice { if (!this.mixedPractice) throw new Error("Certification Mixed Practice is absent from the installed catalog."); return this.mixedPractice; }
  getQuickReview(): PublishedCertificationQuickReview { if (!this.quickReview) throw new Error("Certification Quick Review is absent from the installed catalog."); return this.quickReview; }
  getItems(): readonly CertificationQuestion[] { return this.questions; }
  getItemsForMode(modeId: string): readonly CertificationQuestion[] { getCertificationMode(modeId); return this.questions; }
  getItemById(itemId: string): CertificationQuestion {
    const item = this.questionsById.get(itemId);
    if (!item) throw new MissingContentItemError(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, itemId);
    return item;
  }
  toContentItemRef(item: CertificationQuestion): ContentItemRef {
    return { contentVersion: this.contentVersion, itemId: item.id, trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID };
  }
}

export interface CertificationRuntimeCatalog {
  getContentVersion(): string; getExamExperienceProfile(): PublishedCertificationExamExperienceProfile; getDiagnosticBaseline(): PublishedCertificationDiagnosticBaseline; getFocusPractice(): PublishedCertificationFocusPractice; getScenarioPractice(): PublishedCertificationScenarioPractice; getWeakAreaReview(): PublishedCertificationWeakAreaReview; getMixedPractice(): PublishedCertificationMixedPractice; getQuickReview(): PublishedCertificationQuickReview; getItems(): readonly CertificationQuestion[]; getItemsForMode(modeId: string): readonly CertificationQuestion[]; getItemById(itemId: string): CertificationQuestion; toContentItemRef(item: CertificationQuestion): ContentItemRef;
}
