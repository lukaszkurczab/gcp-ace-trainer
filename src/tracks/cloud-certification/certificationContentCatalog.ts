import { MissingContentItemError, type ContentItemRef } from "../../domain/learning";
import { CLOUD_CERTIFICATION_TRACK_ID } from "../../domain/tracks";
import { getCertificationMode, type CertificationQuestion } from "./domain";
import type { PublishedCertificationDiagnosticBaseline, PublishedCertificationExamExperienceProfile, PublishedCertificationFocusPractice, PublishedCertificationScenarioPractice } from "../../content/contracts";

export class CertificationContentCatalog {
  private readonly questionsById: ReadonlyMap<string, CertificationQuestion>;

  constructor(private readonly questions: readonly CertificationQuestion[], private readonly contentVersion: string, private readonly diagnosticBaseline: PublishedCertificationDiagnosticBaseline | undefined, private readonly focusPractice: PublishedCertificationFocusPractice | undefined, private readonly examExperienceProfile: PublishedCertificationExamExperienceProfile, private readonly scenarioPractice?: PublishedCertificationScenarioPractice) {
    this.questionsById = new Map(questions.map((question) => [question.id, question]));
  }

  getContentVersion(): string { return this.contentVersion; }
  getExamExperienceProfile(): PublishedCertificationExamExperienceProfile { return this.examExperienceProfile; }
  getDiagnosticBaseline(): PublishedCertificationDiagnosticBaseline { if (!this.diagnosticBaseline) throw new Error("Certification Diagnostic Baseline is absent from the installed catalog."); return this.diagnosticBaseline; }
  getFocusPractice(): PublishedCertificationFocusPractice { if (!this.focusPractice) throw new Error("Certification Focus Practice is absent from the installed catalog."); return this.focusPractice; }
  getScenarioPractice(): PublishedCertificationScenarioPractice { if (!this.scenarioPractice) throw new Error("Certification Scenario Practice is absent from the installed catalog."); return this.scenarioPractice; }
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
