import { EXAM_BLUEPRINT } from "../../constants";
import type { CertificationDomain, CertificationQuestion } from "../../tracks/cloud-certification/domain";

export type DomainCoverageItem = {
  domain: CertificationDomain;
  current: number;
  required: number;
  missing: number;
};

export type QuestionBankSummaryData = {
  totalQuestions: number;
  domainCoverage: DomainCoverageItem[];
  examReady: boolean;
};

const examDomains = Object.keys(EXAM_BLUEPRINT) as CertificationDomain[];

export function buildQuestionBankSummary(questions: readonly CertificationQuestion[]): QuestionBankSummaryData {
  const domainCoverage = examDomains.map((domain) => {
    const current = questions.filter((question) => question.domain === domain).length;
    const required = EXAM_BLUEPRINT[domain];

    return {
      domain,
      current,
      required,
      missing: Math.max(0, required - current)
    };
  });

  return {
    totalQuestions: questions.length,
    domainCoverage,
    examReady: domainCoverage.every((item) => item.missing === 0)
  };
}
