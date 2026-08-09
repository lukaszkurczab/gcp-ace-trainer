import type { ContentItemRef, ContentPackagePin } from "../../domain/learning";
import type {
  PublishedCertificationDiagnosticBaseline,
  PublishedCertificationExamExperienceProfile,
  PublishedCertificationFocusPractice,
  PublishedCertificationMixedPractice,
  PublishedCertificationQuickReview,
  PublishedCertificationScenarioPractice,
  PublishedCertificationWeakAreaReview,
} from "../../content/contracts";
import type { CertificationQuestion } from "./domain";

/** Closed catalog contract supplied only by an exact verified content package. */
export interface CertificationRuntimeCatalog {
  getContentVersion(): string; getPackagePin(): ContentPackagePin; getExamExperienceProfile(): PublishedCertificationExamExperienceProfile; getDiagnosticBaseline(): PublishedCertificationDiagnosticBaseline; getFocusPractice(): PublishedCertificationFocusPractice; getScenarioPractice(): PublishedCertificationScenarioPractice; getWeakAreaReview(): PublishedCertificationWeakAreaReview; getMixedPractice(): PublishedCertificationMixedPractice; getQuickReview(): PublishedCertificationQuickReview; getItems(): readonly CertificationQuestion[]; getItemsForMode(modeId: string): readonly CertificationQuestion[]; getItemById(itemId: string): CertificationQuestion; toContentItemRef(item: CertificationQuestion): ContentItemRef;
}
