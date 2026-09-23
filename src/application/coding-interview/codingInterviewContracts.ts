import type { ResolvedContentRef, TrackId } from "../../domain";
import type { AlgorithmFeedbackMode } from "../../tracks/coding-interview/domain";
import type { PracticeSessionMode } from "../../features/practice/sessionConfig";
import type { AlgorithmReviewSource, AlgorithmSelectionScope } from "./codingInterviewPreparationRequest";
export type CanonicalPracticeModeId = PracticeSessionMode;
export type HomeRecommendationAction =
  | Readonly<{ kind: "resume_active_practice"; sessionId: string; trackId: TrackId; modeId: CanonicalPracticeModeId }>
  | Readonly<{ kind: "start_supported_mode"; trackId: TrackId; modeId: CanonicalPracticeModeId; nodeId?: string; mentalUnitId?: string; evidenceSources?: readonly ("due_queue" | "committed_session_misses")[] }>
  | Readonly<{ kind: "choose_supported_mode"; trackId: TrackId; modeId: CanonicalPracticeModeId }>
  | Readonly<{ kind: "unavailable"; reason: string }>;
export type CodingInterviewDashboard = Readonly<{ trackId: TrackId; activeSessionId?: string; attemptCount: number; dueReviewCount: number }>;
export type AlgorithmsLifecyclePreparationRequest = Readonly<{ feedbackMode?: AlgorithmFeedbackMode; sessionId: string; requestedLength: 10 | 20 | 40; reviewItemRefs?: readonly ResolvedContentRef[]; reviewSource?: AlgorithmReviewSource; scope?: AlgorithmSelectionScope }>;
