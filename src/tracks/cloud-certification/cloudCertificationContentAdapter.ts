import {
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDefinition,
  type TrainingItemType,
} from "../../domain";
import type {
  CertificationMultipleChoiceTrainingItem,
  CertificationSingleChoiceTrainingItem,
  TrainingItem,
  TrainingItemDifficulty,
  TrainingItemId,
  TrainingItemTaxonomyRef,
  TrainingSessionModeId,
} from "../../domain/training";
import { DEFAULT_QUESTION_BANK } from "../../features/questions/defaultQuestionBank";
import type { Question } from "../../types";
import type { TrackContentAdapter } from "../types";

const cloudTrack = getTrackDefinition(CLOUD_CERTIFICATION_TRACK_ID);

export function createCloudCertificationContentAdapter(
  questions: readonly Question[] = DEFAULT_QUESTION_BANK,
): TrackContentAdapter {
  const items = questions.map((question) =>
    mapCloudQuestionToTrainingItem(question, cloudTrack.contentManifest.version),
  );
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return {
    getContentVersion: () => cloudTrack.contentManifest.version,
    getItemById: (itemId: TrainingItemId) => itemsById.get(itemId),
    getItems: () => items,
    getItemsForMode: (modeId: TrainingSessionModeId) => {
      const mode = cloudTrack.sessionModes.find((item) => item.id === modeId);

      if (!mode) {
        throw new Error(`Unknown Cloud Certification mode id: ${modeId}`);
      }

      return items.filter((item) => mode.supportedItemTypes.includes(item.type));
    },
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };
}

export function mapCloudQuestionToTrainingItem(
  question: Question,
  contentVersion = cloudTrack.contentManifest.version,
): TrainingItem {
  const base = {
    contentVersion,
    difficulty: question.difficulty satisfies TrainingItemDifficulty,
    estimatedTimeSeconds: 90,
    id: question.id,
    learningObjective: question.examSignals?.join("; "),
    prompt: question.question,
    taxonomyRefs: buildCloudTaxonomyRefs(question),
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };

  if (question.type === "single") {
    return {
      ...base,
      responseSpec: {
        kind: "option_selection",
        maxSelections: 1,
        minSelections: 1,
        options: question.options,
      },
      type: "single_choice_question",
    } satisfies CertificationSingleChoiceTrainingItem;
  }

  return {
    ...base,
    responseSpec: {
      kind: "option_selection",
      maxSelections: question.options.length,
      minSelections: 1,
      options: question.options,
    },
    type: "multiple_choice_question",
  } satisfies CertificationMultipleChoiceTrainingItem;
}

function buildCloudTaxonomyRefs(question: Question): TrainingItemTaxonomyRef[] {
  const domainRef: TrainingItemTaxonomyRef = {
    axisId: "cloud-domain",
    nodeId: question.domain,
    role: "primary",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };

  const tagRefs = question.tags.map((tag) => ({
    axisId: "cloud-topic",
    nodeId: tag,
    role: "secondary",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  }) satisfies TrainingItemTaxonomyRef);

  return [domainRef, ...tagRefs];
}

export function isCloudCertificationTrainingItemType(type: TrainingItemType): boolean {
  return type === "single_choice_question" || type === "multiple_choice_question";
}

export const cloudCertificationContentAdapter = createCloudCertificationContentAdapter();
