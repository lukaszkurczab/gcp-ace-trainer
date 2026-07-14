import { EXAM_BLUEPRINT } from "../../constants";
import type { CertificationDomain, CertificationExamViewModel, CertificationQuestion } from "../../tracks/cloud-certification/domain";
import { shuffleArray } from "../../utils";

export const examDomains = Object.keys(EXAM_BLUEPRINT) as CertificationDomain[];

export type ExamSelectionResult =
  | {
      ok: true;
      questions: CertificationQuestion[];
      optionOrderByQuestionId: Record<string, string[]>;
    }
  | {
      ok: false;
      missing: Partial<Record<CertificationDomain, { required: number; available: number }>>;
    };

export function groupQuestionsByDomain(questions: readonly CertificationQuestion[]): Record<CertificationDomain, CertificationQuestion[]> {
  return examDomains.reduce(
    (groups, domain) => ({
      ...groups,
      [domain]: questions.filter((question) => question.domain === domain)
    }),
    {} as Record<CertificationDomain, CertificationQuestion[]>
  );
}

export function selectExamQuestions(questions: readonly CertificationQuestion[]): ExamSelectionResult {
  const groupedQuestions = groupQuestionsByDomain(questions);
  const missing = examDomains.reduce<Partial<Record<CertificationDomain, { required: number; available: number }>>>((result, domain) => {
    const required = EXAM_BLUEPRINT[domain];
    const available = groupedQuestions[domain].length;

    if (available < required) {
      return {
        ...result,
        [domain]: { required, available }
      };
    }

    return result;
  }, {});

  if (Object.keys(missing).length > 0) {
    return {
      ok: false,
      missing
    };
  }

  const selectedQuestions = examDomains.flatMap((domain) => shuffleArray(groupedQuestions[domain]).slice(0, EXAM_BLUEPRINT[domain]));
  const orderedQuestions = shuffleArray(selectedQuestions);

  return {
    ok: true,
    questions: orderedQuestions,
    optionOrderByQuestionId: buildOptionOrderByQuestionId(orderedQuestions)
  };
}

export function buildOptionOrderByQuestionId(questions: readonly CertificationQuestion[]): Record<string, string[]> {
  return questions.reduce<Record<string, string[]>>((orders, question) => {
    return {
      ...orders,
      [question.id]: shuffleArray(question.options).map((option) => option.id)
    };
  }, {});
}

export function buildExamQuestionViewsFromSession<TQuestion extends CertificationQuestion>(
  runtime: CertificationExamViewModel,
  questions: readonly TQuestion[]
): Array<TQuestion & { shuffledOptions: TQuestion["options"] }> {
  const questionById = new Map(questions.map((question) => [question.id, question]));

  return runtime.session.itemOrder.flatMap(({ itemId: questionId }) => {
    const question = questionById.get(questionId);

    if (!question) {
      return [];
    }

    const optionById = new Map(question.options.map((option) => [option.id, option]));
    const optionOrder = runtime.session.optionOrderByItem[question.id] ?? question.options.map((option) => option.id);
    const shuffledOptions = optionOrder.flatMap((optionId) => {
      const option = optionById.get(optionId);
      return option ? [option] : [];
    });

    return [
      {
        ...question,
        shuffledOptions: shuffledOptions.length === question.options.length ? shuffledOptions : question.options
      }
    ];
  });
}
