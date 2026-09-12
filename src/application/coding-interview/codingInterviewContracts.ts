import type { ContentItemRef, TrackId } from "../../domain";
import type { AlgorithmFeedbackMode } from "../../tracks/coding-interview/domain";
import type { AlgorithmReviewSource } from "../../tracks/coding-interview/algorithmReviewSelection";
import type { AlgorithmSelectionScope } from "../../tracks/coding-interview/algorithmSessionSelection";
import type { PracticeSessionMode } from "../../features/practice/sessionConfig";
export type CanonicalPracticeModeId = PracticeSessionMode;
export type CanonicalRecommendationReason = "active_session" | "due_review" | "session_misses" | "recommended" | "learner_choice";
export type AlgorithmsRecommendationAction = Readonly<Record<string, unknown>>;
export type HomeRecommendationAction =
  | Readonly<{ kind: "resume_active_practice"; sessionId: string; trackId: TrackId; modeId: CanonicalPracticeModeId }>
  | Readonly<{ kind: "start_supported_mode"; trackId: TrackId; modeId: CanonicalPracticeModeId; nodeId?: string; mentalUnitId?: string; evidenceSources?: readonly ("due_queue" | "committed_session_misses")[] }>
  | Readonly<{ kind: "choose_supported_mode"; trackId: TrackId; modeId: CanonicalPracticeModeId }>
  | Readonly<{ kind: "unavailable"; reason: string }>;
export type CodingInterviewDashboardRecommendation = Readonly<{ action: HomeRecommendationAction; explanation: string; modeId: CanonicalPracticeModeId; reason: CanonicalRecommendationReason; sessionId?: string; trackId: TrackId }>;
export type CodingInterviewDashboard = Readonly<{ recommendation: CodingInterviewDashboardRecommendation }>;
export type AlgorithmsLifecyclePreparationRequest = Readonly<{ feedbackMode?: AlgorithmFeedbackMode; sessionId: string; requestedLength: 10 | 20 | 40; reviewItemRefs?: readonly ContentItemRef[]; reviewSource?: AlgorithmReviewSource; scope?: AlgorithmSelectionScope }>;
