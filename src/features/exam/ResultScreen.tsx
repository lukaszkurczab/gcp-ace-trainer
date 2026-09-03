import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { getTrainingLifecycleUseCases } from "../../application/trainingLifecycle";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { EmptyState, LoadingState, Screen, SessionResultOverview } from "../../components";
import { ROUTES } from "../../constants";
import { getTrackDisplay } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { formatSessionTopic, normalizeSessionResultDetails } from "./sessionResultPresentation";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { getDesignModeTitle, isDesignInterviewModeId } from "../../tracks/design-interview";
import { getCertificationQuestionMaxPoints, type CertificationQuestion } from "../../tracks/certification";
type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.RESULT>;
type Summary = Readonly<{
  certificationMaxPoints: number | null;
  certificationTopicId: string | null;
  designTopicId: string | null;
  result: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSummary"]>>;
  session: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSessionRecord"]>>;
}>;
type ResultReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; summary: Summary }>
  | Readonly<{ kind: "unavailable"; requestKey: string; reason: string }>;

export function ResultScreen({ navigation, route }: Props) {
  const { t } = useTranslation("common");
  const requestKey = route.params.sessionId;
  const [readState, setReadState] = useState<ResultReadState>({ kind: "pending", requestKey });
  useEffect(() => {
    const capturedRequestKey = requestKey;
    let live = true;
    setReadState({ kind: "pending", requestKey: capturedRequestKey });
    const useCases = getTrainingLifecycleUseCases();
    void Promise.all([useCases.loadSummary(capturedRequestKey), useCases.loadSessionRecord(capturedRequestKey)])
      .then(async ([result, session]) => {
        const exact = isDesignInterviewModeId(session.modeId) || session.modeId.startsWith("certification-") || result.evidence.familyId === "certification"
          ? await contentPackageRuntimeOwner.resolveExact(session.packagePin)
          : null;
        if (!live) return;
        const designTopicId = isDesignInterviewModeId(session.modeId) && exact ? exact.profile.freeNodeId : null;
        const certificationTopicId = session.modeId === "certification-diagnostic-baseline" && exact ? exact.package.freeNodeId : null;
        const certificationMaxPoints = result.evidence.familyId === "certification" && exact
          ? session.itemOrder.reduce((sum, occurrence) => sum + getCertificationQuestionMaxPoints(exact.profile.getItemById(occurrence.item.itemId) as CertificationQuestion), 0)
          : null;
        setReadState({ kind: "ready", requestKey: capturedRequestKey, summary: { result, session, designTopicId, certificationTopicId, certificationMaxPoints } });
      })
      .catch((cause) => { if (live) setReadState({ kind: "unavailable", requestKey: capturedRequestKey, reason: describeOperationalFailure(cause, t("We couldn’t load the session result.")) }); });
    return () => { live = false; };
  }, [requestKey, t]);
  if (readState.requestKey !== requestKey || readState.kind === "pending") return <Screen><LoadingState title={t("Loading session result")} /></Screen>;
  if (readState.kind === "unavailable") return <Screen><EmptyState title={t("Session summary unavailable")} description={t(readState.reason)} /></Screen>;
  const summary = readState.summary;
  const { result, session } = summary;
  const design = isDesignInterviewModeId(session.modeId);
  const answeredCount = result.answeredOccurrenceIds.length;
  const actualCount = session.actualLength;
  const unansweredCount = result.unansweredOccurrenceIds.length;
  const coverageIsConsistent = result.totalOccurrences === actualCount && answeredCount + unansweredCount === actualCount;
  const normalizedDetails = coverageIsConsistent
    ? normalizeSessionResultDetails(result.evidence.details, answeredCount, summary.certificationMaxPoints ?? undefined)
    : { points: null, score: null };
  const domainPresentation = design
    ? formatSessionTopic(session.trackId, summary.designTopicId, t)
    : session.modeId === "certification-diagnostic-baseline"
    ? formatSessionTopic(session.trackId, summary.certificationTopicId, t)
    : session.modeId === "certification-focus-practice"
    ? formatSessionTopic(session.trackId, session.configurationSnapshot.domain, t)
    : formatDomains(session.configurationSnapshot.sectionPresentation);
  const modeLabel = design
    ? t(getDesignModeTitle(session.modeId))
    : session.modeId === "certification-diagnostic-baseline"
    ? t("Diagnostic Baseline")
    : t(formatMode(session.modeId));
  return (
    <Screen>
      <SessionResultOverview
        activeTime={formatElapsed(session.activeForegroundMs)}
        answeredCount={answeredCount}
        backTestID={runtimeSelectors.summary.backToPractice(route.params.sessionId)}
        completion="completed"
        context={{ modeLabel, topicLabel: domainPresentation, trackLabel: t(getTrackDisplay(session.trackId).title) }}
        onBack={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
        points={normalizedDetails.points ?? undefined}
        requestedCount={session.requestedLength}
        review={{ onPress: () => navigation.navigate(ROUTES.EXAM_REVIEW, { sessionId: route.params.sessionId }), testID: runtimeSelectors.summary.reviewAnswers(route.params.sessionId) }}
        rootTestID={runtimeSelectors.summary.root(route.params.sessionId)}
        score={normalizedDetails.score}
        totalOccurrences={actualCount}
        unansweredCount={unansweredCount}
      />
    </Screen>
  );
}

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatMode(modeId: string): string {
  return modeId.replace(/^certification-/, "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDomains(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string")) return "Not recorded";
  return value.map((entry) => entry.replaceAll("_", " ")).join(", ");
}
