import { useTranslation } from "react-i18next";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Button, Card, ChoiceRow, EmptyState, Icon, Screen, ScreenHeader, SectionHeader, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants/routes";
import { CODING_INTERVIEW_TRACK_ID, getTrackDisplay } from "../../domain";
import { goBackOrHome } from "../../navigation/goBackOrHome";
import type { RootStackParamList } from "../../navigation/types";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { listAvailablePremiumNodeOffers } from "../../content/application/premiumNodeOfferAccess";
import { describePremiumNodeOfferFailure } from "../../content/application/premiumNodeOfferPresentation";
import { radius, spacing, typography } from "../../theme";
import { ALGORITHM_MODE_IDS, getAlgorithmMode, isAlgorithmModeId } from "../../tracks/coding-interview";
import { isCertificationPracticeModeId } from "../../tracks/certification";
import { isDesignInterviewModeId } from "../../tracks/design-interview";
import { SelectTrackScreen } from "../home/SelectTrackScreen";
import { resolvePracticeTopic as resolvePracticeTopicModel } from "./practiceFlowModel";
import { titleForNode } from "./trackRoadmapCatalog";
import { usePracticeReadModel } from "./usePracticeReadModel";
import { formatPracticeTopicTitle } from "./practiceFlowPresentation";
import {
  buildPracticeSessionConfig,
  buildPremiumNodePracticeSessionConfig,
  DEFAULT_FEEDBACK_MODE,
  resolvePracticeSessionLength,
  isCloudTopicId,
  type PracticeFeedbackMode,
  type PracticeSessionLength,
} from "./sessionConfig";
import type { CanonicalPracticeModeId } from "../../application/practice/practiceModeContract";
import { getPracticeReviewBehaviorCopy } from "./practiceSetupModel";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import type { ProductModeConfig } from "../../content/canonical";
import { resolveRequiredUnitFocusMode } from "../../content/canonical";

type PracticeSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.PRACTICE_SETUP
>;

type PracticeSetupLoadingVariant =
  | "diagnostic"
  | "focus"
  | "selector"
  | "lengthOnly"
  | "design"
  | "customCoding"
  | "quickReview"
  | "unknown";

function resolvePracticeSetupLoadingVariant(mode?: CanonicalPracticeModeId): PracticeSetupLoadingVariant {
  if (!mode) return "unknown";
  if (mode === "certification-diagnostic-baseline") return "diagnostic";
  if (mode === "certification-focus-practice") return "focus";
  if (mode === "certification-scenario-practice") return "selector";
  if (mode === ALGORITHM_MODE_IDS.customPractice) return "customCoding";
  if (isDesignInterviewModeId(mode)) return "design";
  if (isAlgorithmModeId(mode)) return "lengthOnly";
  if (isCertificationPracticeModeId(mode) && mode === "certification-quick-review") return "quickReview";
  if (isCertificationPracticeModeId(mode)) return "lengthOnly";
  return "unknown";
}

export function PracticeSetupLoadingSkeleton({ mode }: Readonly<{ mode?: CanonicalPracticeModeId }> = {}) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();
  const variant = resolvePracticeSetupLoadingVariant(mode);
  const compactCodingPractice = variant === "customCoding";
  const showIntro = variant !== "customCoding" && variant !== "focus" && variant !== "unknown";
  const showLength = variant !== "diagnostic" && variant !== "quickReview" && variant !== "unknown";
  const showSelector = variant === "selector";
  const showFeedback = variant === "customCoding";

  return (
    <View
      accessibilityLabel={t("Loading practice setup")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={[styles.practiceSetupLoading, compactCodingPractice ? styles.practiceSetupLoadingCompact : null]}
      testID="practice-setup-loading-skeleton"
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[styles.practiceSetupLoadingShapes, variant === "focus" ? styles.focusContent : null]}>
        {showIntro ? <View style={styles.practiceSetupLoadingIntro}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingTitle, { height: 21 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSubtitle, { height: 13 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSubtitleShort, { height: 13 * textScale }]} />
        </View> : null}

        {variant === "diagnostic" ? <View style={styles.practiceSetupLoadingDescriptionCard}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelDetail, { height: 13 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingDescriptionShort, { height: 13 * textScale }]} />
        </View> : null}

        {variant === "quickReview" ? <View style={styles.practiceSetupLoadingDescriptionCard}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelDetail, { height: 13 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingDescriptionShort, { height: 13 * textScale }]} />
        </View> : null}

        {showSelector ? <View style={styles.practiceSetupLoadingSection}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSectionTitle, { height: 12 * textScale }]} />
          <View style={styles.practiceSetupLoadingPanelList}>
            {[0, 1].map((selector) => (
              <View key={selector} style={[styles.practiceSetupLoadingPanel, largeLayout ? styles.practiceSetupLoadingPanelLarge : null]}>
                <View style={styles.practiceSetupLoadingPanelCopy}>
                  <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 15 * textScale }]} />
                  <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelDetail, { height: 12 * textScale }]} />
                </View>
                <SkeletonShape motion={motion} style={styles.practiceSetupLoadingControl} />
              </View>
            ))}
          </View>
        </View> : null}

        {variant === "focus" ? <View style={styles.focusSection}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSectionTitle, { height: 16 * textScale }]} />
          <View style={styles.selectedTopic}>
            <View style={styles.practiceSetupLoadingPanelCopy}>
              <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 16 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingSubtitleShort, { height: 16 * textScale }]} />
            </View>
            <SkeletonShape motion={motion} style={styles.practiceSetupLoadingChevron} />
          </View>
        </View> : null}

        {showLength ? <View style={[styles.practiceSetupLoadingSection, compactCodingPractice ? styles.practiceSetupLoadingCompactSection : null, variant === "focus" ? styles.focusSection : null]}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSectionTitle, { height: (variant === "focus" ? 16 : 12) * textScale }]} />
          <View style={[styles.practiceSetupLoadingLengthGrid, compactCodingPractice ? styles.practiceSetupLoadingCompactLengthGrid : null, variant === "focus" ? styles.focusLengthGrid : null]}>
            {[0, 1, 2].map((option) => (
              <View key={option} style={[styles.practiceSetupLoadingLengthOption, compactCodingPractice ? styles.practiceSetupLoadingCompactLengthOption : null, variant === "focus" ? styles.focusLengthOption : null, { minHeight: variant === "focus" ? 56 : (compactCodingPractice ? 44 : 86) * textScale }]}>
                <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingLengthValue, { height: 17 * textScale }]} />
                {variant !== "focus" ? <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingLengthMeta, { height: 11 * textScale }]} /> : null}
              </View>
            ))}
          </View>
        </View> : null}

        {variant === "design" ? <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingFeedbackStrip, { height: 14 * textScale }]} /> : null}

        {showFeedback ? <View style={[styles.practiceSetupLoadingSection, compactCodingPractice ? styles.practiceSetupLoadingCompactSection : null]}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSectionTitle, { height: 12 * textScale }]} />
          <View style={styles.practiceSetupLoadingPanelList}>
            {[0, 1].map((panel) => (
              <View key={panel} style={[styles.practiceSetupLoadingPanel, compactCodingPractice ? styles.practiceSetupLoadingCompactPanel : null, largeLayout ? styles.practiceSetupLoadingPanelLarge : null]}>
                <View style={styles.practiceSetupLoadingPanelCopy}>
                  <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 15 * textScale }]} />
                  <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelDetail, { height: 12 * textScale }]} />
                </View>
                <SkeletonShape motion={motion} style={styles.practiceSetupLoadingControl} />
              </View>
            ))}
          </View>
        </View> : null}

        {variant === "unknown" ? <View style={styles.practiceSetupLoadingUnknown}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingUnknownTitle, { height: 16 * textScale }]} />
          <View style={styles.practiceSetupLoadingUnknownCard}>
            <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingUnknownLine, { height: 15 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingUnknownLineShort, { height: 12 * textScale }]} />
          </View>
        </View> : null}

        <View style={styles.practiceSetupLoadingActionSpace}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingAction, { minHeight: 48 * textScale }]} />
        </View>
      </View>
    </View>
  );
}

export function PracticeSetupScreen({ navigation, route }: PracticeSetupScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const isFocused = useIsFocused();
  const focusEpochRef = useRef(0);
  useEffect(() => {
    focusEpochRef.current += 1;
    if (!isFocused) setPremiumOfferBusyId(null);
    return () => { focusEpochRef.current += 1; };
  }, [isFocused]);
  const { fontScale } = useWindowDimensions();
  const account = usePatternlyAccount();
  const { readState, requestKey, retry } = usePracticeReadModel({
    errorFallback: t("We couldn’t load the session settings."),
    requestedTrackId: route.params?.trackId,
  });
  const routeFormIdentity = buildPracticeSetupRouteIdentity(route.params);
  const readTrackId = readState.kind === "ready" ? readState.activeTrackId : null;
  const activeFormIdentity = readTrackId === null ? null : `${readTrackId}:${routeFormIdentity}`;
  const [formIdentity, setFormIdentity] = useState<string | null>(null);
  const [sessionLength, setSessionLength] = useState<PracticeSessionLength | null>(
    route.params?.sessionLength ?? null,
  );
  const [feedbackMode, setFeedbackMode] = useState<PracticeFeedbackMode>(
    route.params?.feedbackMode ?? DEFAULT_FEEDBACK_MODE,
  );
  const [reviewBehaviorEnabled, setReviewBehaviorEnabled] = useState(
    route.params?.reviewBehaviorEnabled ?? false,
  );
  const [focusTopicId, setFocusTopicId] = useState<string | null>(() => route.params?.topicId ?? null);
  const [focusMentalUnitId, setFocusMentalUnitId] = useState<string | null>(() => route.params?.mentalUnitId ?? null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [premiumOfferError, setPremiumOfferError] = useState<string | null>(null);
  const [premiumOfferBusyId, setPremiumOfferBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (activeFormIdentity === null || formIdentity === activeFormIdentity) return;
    setFormIdentity(activeFormIdentity);
    setSessionLength(route.params?.sessionLength ?? null);
    setFeedbackMode(route.params?.feedbackMode ?? DEFAULT_FEEDBACK_MODE);
    setReviewBehaviorEnabled(route.params?.reviewBehaviorEnabled ?? false);
    setFocusTopicId(route.params?.topicId ?? null);
    setFocusMentalUnitId(route.params?.mentalUnitId ?? null);
    setSetupError(null);
  }, [activeFormIdentity, formIdentity]);

  function renderLoading() {
    const compactCodingPractice = route.params?.mode === ALGORITHM_MODE_IDS.customPractice;
    const focusPractice = route.params?.mode === "certification-focus-practice";
    return (
      <Screen backAction={{ destinationLabel: navigation.canGoBack() ? undefined : t("Today"), onPress: () => goBackOrHome(navigation) }} edges={["top", "bottom"]} style={focusPractice ? styles.focusContent : undefined}>
        {focusPractice ? <ScreenHeader
          description={t("Choose a topic and the number of questions for your session.")}
          title={t("Practice setup")}
          variant="activity"
        /> : compactCodingPractice ? <ScreenHeader
          description={t("Choose the length and feedback timing for this session.")}
          title={t("Practice settings")}
          titleTestID={runtimeSelectors.practice.customSetupTitle()}
          variant="practiceSetup"
        /> : null}
        <PracticeSetupLoadingSkeleton mode={route.params?.mode} />
      </Screen>
    );
  }

  function renderUnavailable(
    description: string,
    actionLabel = t("Back to practice"),
    onActionPress = () => goBackOrHome(navigation),
  ) {
    return (
      <Screen backAction={{ destinationLabel: navigation.canGoBack() ? undefined : t("Today"), onPress: () => goBackOrHome(navigation) }} edges={["top", "bottom"]}>
        <EmptyState actionLabel={actionLabel} onActionPress={onActionPress} title={t("Practice setup is unavailable")} description={description} />
      </Screen>
    );
  }

  if (readState.requestKey !== requestKey || readState.kind === "pending") {
    return renderLoading();
  }
  if (readState.kind === "unavailable") return renderUnavailable(t(readState.reason), t("Try again"), retry);
  const { activeTrackId: resolvedTrackId, trainingAttempts } = readState;
  if (!resolvedTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  if (formIdentity !== activeFormIdentity) return renderLoading();
  let activeTrack: ReturnType<typeof getTrackDisplay>;
  let canonicalTrack: ReturnType<typeof contentPackageRuntimeOwner.getPreparedDiscovery>["track"];
  try {
    activeTrack = getTrackDisplay(resolvedTrackId);
    canonicalTrack = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).track;
  } catch (error) {
    return renderUnavailable(describeOperationalFailure(error, t("Practice data is unavailable.")));
  }
  const expectedArtifactSha256 = route.params?.expectedArtifactSha256;
  const premiumOffers = listAvailablePremiumNodeOffers(activeTrack.id);
  const selectedPremiumOffer = premiumOffers.find((offer) => offer.offerId === route.params?.premiumOfferId && offer.nodeId === route.params?.topicId);
  if (route.params?.premiumOfferId !== undefined && !selectedPremiumOffer) {
    return renderUnavailable(t("This practice mode is unavailable."));
  }
  const selectedPremiumOfferIdentityMatches = selectedPremiumOffer !== undefined &&
    route.params?.expectedContentVersion === selectedPremiumOffer.contentVersion &&
    expectedArtifactSha256 === selectedPremiumOffer.artifactSha256;
  const pinnedArtifact = selectedPremiumOfferIdentityMatches ? selectedPremiumOffer : undefined;
  if (selectedPremiumOffer && !selectedPremiumOfferIdentityMatches) {
    return renderUnavailable(t("This learning plan uses a different content package. Review the plan before starting."));
  }
  if (!selectedPremiumOffer && ((route.params?.expectedContentVersion !== undefined && route.params.expectedContentVersion !== canonicalTrack.contentVersion) ||
    (expectedArtifactSha256 !== undefined && expectedArtifactSha256 !== canonicalTrack.artifactSha256))) {
    return renderUnavailable(t("This learning plan uses a different content package. Review the plan before starting."));
  }
  if (route.params?.mentalUnitId !== undefined && (route.params.mode !== "certification-focus-practice" ||
    !route.params.mentalUnitId.trim() || route.params.expectedContentVersion !== canonicalTrack.contentVersion || route.params.expectedArtifactSha256 !== canonicalTrack.artifactSha256)) {
    return renderUnavailable(t("This recommended practice scope is no longer available for the current content package."));
  }
  const canonicalNodeMode = canonicalTrack.modes.find((mode) => mode.selection.kind === "node");
  const canonicalNodeId = canonicalNodeMode?.selection.kind === "node"
    ? canonicalNodeMode.selection.nodeId
    : "";
  const routedUnitChapter = route.params?.mentalUnitId && canonicalTrack.completionRule?.ruleVersion === 3
    ? canonicalTrack.completionRule!.chapters.find((chapter) => chapter.units.some((unit) => unit.mentalUnitId === route.params!.mentalUnitId))
    : undefined;
  const v3UnitRoute = routedUnitChapter?.nodeId === route.params?.topicId;
  const premiumUnitRoute = v3UnitRoute && route.params?.topicId !== canonicalNodeId;
  if (route.params?.topicId !== undefined && route.params.topicId !== canonicalNodeId && !v3UnitRoute && !selectedPremiumOffer) {
    return renderUnavailable(t("This topic is not included in your free content."));
  }
  const premiumAccess = premiumUnitRoute || selectedPremiumOffer ? account.readCurrentPremiumAccess() : "allowed";
  if ((premiumUnitRoute || selectedPremiumOffer) && premiumAccess !== "allowed") {
    return renderUnavailable(premiumAccess === "denied"
      ? t("This required exam topic needs Premium access.")
      : t("Premium access is currently unavailable. Check your account and try again."));
  }
  const requestedMode = route.params?.mode ?? canonicalTrack.modes[0]?.modeId;
  if (typeof requestedMode !== "string") return renderUnavailable(t("This practice mode is unavailable."));
  if (selectedPremiumOffer && (selectedPremiumOffer.trackId !== activeTrack.id || selectedPremiumOffer.familyId !== activeTrack.familyId || selectedPremiumOffer.mode.modeId !== requestedMode)) {
    return renderUnavailable(t("This practice mode is unavailable."));
  }
  if (activeTrack.familyId === "coding_interview" && !isAlgorithmModeId(requestedMode)) return renderUnavailable(t("This practice mode is unavailable."));
  if (activeTrack.familyId === "certification" && !isCertificationPracticeModeId(requestedMode)) return renderUnavailable(t("This practice mode is unavailable."));
  if (activeTrack.familyId === "design_interview" && (!isDesignInterviewModeId(requestedMode) || requestedMode === "design-interview-simulation")) return renderUnavailable(t("This practice mode is unavailable."));
  const selectedMode = requestedMode as CanonicalPracticeModeId;
  let selectedPackageMode: ProductModeConfig;
  try {
    selectedPackageMode = selectedPremiumOffer?.mode ?? canonicalTrack.getMode(selectedMode);
  } catch (error) {
    return renderUnavailable(describeOperationalFailure(error, t("This practice mode is unavailable.")));
  }
  const certificationTrack = activeTrack.familyId === "certification";
  const diagnosticBaseline = certificationTrack && selectedMode === "certification-diagnostic-baseline";
  const focusPractice = certificationTrack && selectedMode === "certification-focus-practice";
  let recommendedFocusUnitNumber: number | null = null;
  let recommendedFocusQuestionCount: number | null = null;
  if (route.params?.mentalUnitId !== undefined) {
    const focusMode = canonicalTrack.getMode("certification-focus-practice");
    const targetNodeId = v3UnitRoute ? routedUnitChapter!.nodeId : canonicalNodeId;
    const scopedMode = v3UnitRoute
      ? resolveRequiredUnitFocusMode(focusMode, canonicalTrack.completionRule, targetNodeId, route.params.mentalUnitId)
      : focusMode;
    const exactFocusPool = v3UnitRoute
      ? canonicalTrack.questions.filter((question) => question.nodeId === targetNodeId)
      : focusMode.selection.kind === "node"
        ? canonicalTrack.getPool(focusMode.modeId).filter((question) => question.nodeId === canonicalNodeId)
        : [];
    const scopedPool = exactFocusPool.filter((question) => question.mentalUnitId === route.params!.mentalUnitId);
    const orderedUnits = [...new Set(exactFocusPool.map((question) => question.mentalUnitId))];
    const unitIndex = orderedUnits.indexOf(route.params.mentalUnitId);
    if (!focusPractice || focusMode.selection.kind !== "node" || scopedPool.length < scopedMode.minimumActualLength) {
      return renderUnavailable(t("This recommended practice scope does not have enough available questions."));
    }
    if (unitIndex < 0) return renderUnavailable(t("This recommended learning unit is unavailable in the current content package."));
    recommendedFocusUnitNumber = unitIndex + 1;
    recommendedFocusQuestionCount = scopedPool.length;
  }
  const weakAreaReview = certificationTrack && selectedMode === "certification-weak-area-review";
  const quickReview = certificationTrack && selectedMode === "certification-quick-review";
  const algorithmMode = activeTrack.id === CODING_INTERVIEW_TRACK_ID
    ? getAlgorithmMode(selectedMode)
    : null;
  const compactCodingPractice = algorithmMode?.id === ALGORITHM_MODE_IDS.customPractice;
  const configuredSessionLength = resolvePracticeSessionLength(sessionLength, selectedPackageMode);
  const selectableFeedback = selectedPackageMode.feedbackTiming.kind === "learner_selectable";
  const designMode = isDesignInterviewModeId(selectedMode);
  let reviewBehaviorCopy: ReturnType<typeof getPracticeReviewBehaviorCopy>;
  let topic: ReturnType<typeof resolvePracticeTopicModel>;
  try {
    reviewBehaviorCopy = getPracticeReviewBehaviorCopy(activeTrack.id);
    topic = resolvePracticeTopicModel({
      activeTrackId: activeTrack.id,
      routeTopicId: route.params?.topicId,
      trainingAttempts,
    });
  } catch (error) {
    return renderUnavailable(describeOperationalFailure(error, t("Practice data is unavailable.")));
  }
  const selectedFocusTopicId = focusPractice
    ? focusTopicId ?? (v3UnitRoute ? routedUnitChapter!.nodeId : canonicalNodeId)
    : null;
  const requiredFocusTopicId = focusMentalUnitId && v3UnitRoute ? routedUnitChapter!.nodeId : canonicalNodeId;

  function startSession() {
    const mode = selectedMode;
    if (focusPractice && !selectedPremiumOffer && selectedFocusTopicId !== requiredFocusTopicId) {
      setSetupError("Choose an available topic to start practicing.");
      return;
    }
    if (selectedPremiumOffer) {
      const startFocusEpoch = focusEpochRef.current;
      setPremiumOfferBusyId(selectedPremiumOffer.offerId);
      setPremiumOfferError(null);
      void contentPackageRuntimeOwner.resolveForPreparation({
        trackId: selectedPremiumOffer.trackId,
        familyId: selectedPremiumOffer.familyId,
        modeId: selectedPremiumOffer.mode.modeId,
        nodeId: selectedPremiumOffer.nodeId,
      }).then((prepared) => {
        if (startFocusEpoch !== focusEpochRef.current) return;
        if (prepared.track.contentVersion !== pinnedArtifact!.contentVersion || prepared.track.artifactSha256 !== pinnedArtifact!.artifactSha256 ||
          !prepared.track.questions.some((question) => question.nodeId === selectedPremiumOffer.nodeId)) {
          throw new Error("premium_node_preparation_identity_mismatch");
        }
        navigation.navigate(ROUTES.PRACTICE_SESSION, buildPremiumNodePracticeSessionConfig(selectedPremiumOffer, {
          feedbackMode: selectableFeedback ? feedbackMode : undefined,
          sessionLength: configuredSessionLength,
        }));
      }).catch((error: unknown) => {
        if (startFocusEpoch !== focusEpochRef.current) return;
        setPremiumOfferError(describePremiumNodeOfferFailure(error).message);
      }).finally(() => {
        if (startFocusEpoch === focusEpochRef.current) setPremiumOfferBusyId(null);
      });
      return;
    }
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        ...(activeTrack.id === CODING_INTERVIEW_TRACK_ID
          ? {
              feedbackMode,
              reviewItemRefs: route.params?.reviewItemRefs,
              reviewSource: route.params?.reviewSource,
              sessionLength: configuredSessionLength,
            }
              : diagnosticBaseline ? {} : quickReview ? { reviewSource: route.params?.reviewSource } : focusPractice ? { sessionLength: configuredSessionLength, ...(selectableFeedback ? { feedbackMode } : {}), ...(focusMentalUnitId ? { mentalUnitId: focusMentalUnitId, expectedContentVersion: route.params?.expectedContentVersion, expectedArtifactSha256: route.params?.expectedArtifactSha256 } : {}) } : weakAreaReview ? { sessionLength: configuredSessionLength, reviewSource: route.params?.reviewSource } : designMode ? { sessionLength: configuredSessionLength } : { feedbackMode, reviewBehaviorEnabled, sessionLength: configuredSessionLength }),
        mode,
        source: "practiceSetup",
        topicId: diagnosticBaseline ? canonicalNodeId : focusPractice ? selectedFocusTopicId! : weakAreaReview || quickReview ? "" : topic.id,
        trackId: activeTrack.id,
      }),
    );
  }
  return (
    <View style={styles.shell} testID={runtimeSelectors.practice.setupRoot()}>
      <Screen
        backAction={{ destinationLabel: navigation.canGoBack() ? undefined : t("Today"), onPress: () => goBackOrHome(navigation) }}
        edges={["top", "bottom"]}
        key={focusPractice ? `focus-setup-${fontScale}` : "setup"}
        style={focusPractice ? styles.focusContent : undefined}
        footerVariant={compactCodingPractice || focusPractice ? "sticky" : "default"}
        footer={compactCodingPractice || focusPractice ? (
          <View style={styles.footerActions}>
            {setupError ? <Text key={`practice-setup-footer-error-${fontScale}`} maxFontSizeMultiplier={2} accessibilityRole="alert" style={styles.error}>{t(setupError)}</Text> : null}
            {premiumOfferError ? <Text key={`practice-setup-premium-error-${fontScale}`} maxFontSizeMultiplier={2} accessibilityRole="alert" style={styles.error} testID={runtimeSelectors.practice.premiumOfferError()}>{t(premiumOfferError)}</Text> : null}
            <Button disabled={premiumOfferBusyId !== null} loading={premiumOfferBusyId !== null} onPress={startSession} testID={runtimeSelectors.practice.startSession()}>{t("Start session")}</Button>
          </View>
        ) : undefined}
    >
        {focusPractice ? <ScreenHeader
          description={t("Choose a topic and the number of questions for your session.")}
          title={t("Practice setup")}
          variant="activity"
        /> : compactCodingPractice ? <ScreenHeader
          description={t("Choose the length and feedback timing for this session.")}
          title={t("Practice settings")}
          titleTestID={runtimeSelectors.practice.customSetupTitle()}
          variant="practiceSetup"
        /> : null}

        {!compactCodingPractice && !focusPractice ? <View style={styles.intro}>
          <Text
            key={`practice-setup-intro-title-${fontScale}`}
            maxFontSizeMultiplier={2}
            style={styles.title}
            testID={compactCodingPractice ? runtimeSelectors.practice.customSetupTitle() : undefined}
          >
            {t("Practice setup")}
          </Text>
          {!focusPractice ? <Text key={`practice-setup-intro-subtitle-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>
            {diagnosticBaseline ? t("Check your knowledge of {{topic}} with 40 questions.", { topic: formatPracticeTopicTitle(topic.title, t) }) : weakAreaReview || quickReview ? t("Review questions that are ready to revisit.") : t("Set up your session for {{topic}}.", { topic: formatPracticeTopicTitle(topic.title, t) })}
          </Text> : null}
        </View> : null}

        {focusPractice && focusMentalUnitId && recommendedFocusUnitNumber !== null ? <Card style={styles.reviewCard}><View style={styles.reviewCopy}><Text key={`practice-setup-focused-unit-title-${fontScale}`} maxFontSizeMultiplier={2} style={styles.reviewTitle}>{t("Recommended learning unit")}</Text><Text key={`practice-setup-focused-unit-detail-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{t("This session is limited to learning unit {{number}} in this chapter.", { number: recommendedFocusUnitNumber })}</Text>{v3UnitRoute && recommendedFocusQuestionCount !== null && recommendedFocusQuestionCount < configuredSessionLength ? <Text maxFontSizeMultiplier={2} style={styles.subtitle}>{t("This required exam topic has {{count}} questions, so this session will use all {{count}}.", { count: recommendedFocusQuestionCount })}</Text> : null}</View></Card> : null}



        {focusPractice ? <View style={styles.focusSection}>
          <Text maxFontSizeMultiplier={2} style={styles.focusSectionLabel}>{t("Selected topic")}</Text>
          <Pressable
            accessibilityLabel={t("Change topic")}
            accessibilityRole="button"
            accessibilityValue={{ text: selectedPremiumOffer ? titleForNode(selectedPremiumOffer.nodeId) : formatPracticeTopicTitle(topic.title, t) }}
            onPress={() => {
              setSetupError(null);
              navigation.navigate(ROUTES.TOPIC_ROADMAP, {
                topicId: selectedPremiumOffer ? undefined : selectedFocusTopicId ?? canonicalNodeId,
                trackId: activeTrack.id,
                returnToSetup: true,
                setupDraft: {
                  feedbackMode,
                  mentalUnitId: focusMentalUnitId ?? undefined,
                  mode: selectedMode,
                  reviewBehaviorEnabled: false,
                  sessionLength: configuredSessionLength,
                  source: "practiceSetup",
                  trackId: activeTrack.id,
                  topicId: selectedFocusTopicId ?? canonicalNodeId,
                  expectedContentVersion: selectedPremiumOffer?.contentVersion ?? route.params?.expectedContentVersion,
                  expectedArtifactSha256: selectedPremiumOffer?.artifactSha256 ?? route.params?.expectedArtifactSha256,
                  premiumOfferId: selectedPremiumOffer?.offerId,
                },
              });
            }}
            style={({ pressed }) => [styles.selectedTopic, pressed ? styles.pressed : null]}
            testID={runtimeSelectors.practice.changeTopic()}
          >
            <Text maxFontSizeMultiplier={2} style={styles.selectedTopicTitle} testID={runtimeSelectors.practice.selectedTopic()}>
              {selectedPremiumOffer ? titleForNode(selectedPremiumOffer.nodeId) : formatPracticeTopicTitle(topic.title, t)}
            </Text>
            <Icon name="chevron-right" size={22} />
          </Pressable>
        </View> : null}

        {quickReview ? <Card style={styles.reviewCard}><View style={styles.reviewCopy}><Text key={`practice-setup-quick-title-${fontScale}`} maxFontSizeMultiplier={2} style={styles.reviewTitle}>{t("Quick Review")}</Text><Text key={`practice-setup-quick-subtitle-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{t("Review questions that are ready to revisit.")}</Text></View></Card> : !diagnosticBaseline ? <View style={[styles.section, compactCodingPractice ? styles.compactSection : null, focusPractice ? styles.focusSection : null]}>
          {focusPractice ? <Text maxFontSizeMultiplier={2} style={styles.focusSectionLabel}>{t("Session length")}</Text> : compactCodingPractice ? <PracticeSetupSectionHeader title={t("Session length")} subtitle={t("Number of questions in this session.")} /> : <SectionHeader title={t("Session length")} tight />}
          <View accessibilityLabel={focusPractice ? t("Session length") : undefined} accessibilityRole={focusPractice ? "radiogroup" : undefined} style={[styles.lengthGrid, compactCodingPractice ? styles.compactLengthGrid : null, focusPractice ? styles.focusLengthGrid : null]}>
            {selectedPackageMode.requestedLengths.map((length) => (
              <SelectableOption
                variant={focusPractice ? "focus" : compactCodingPractice ? "compact" : "default"}
                key={length}
                label={String(length)}
                meta={focusPractice ? undefined : t("Questions")}
                onPress={() => setSessionLength(length)}
                selected={configuredSessionLength === length}
                testID={runtimeSelectors.practice.sessionLength(length)}
              />
            ))}
          </View>
        </View> : <Card style={styles.reviewCard}><View style={styles.reviewCopy}><Text key={`practice-setup-diagnostic-title-${fontScale}`} maxFontSizeMultiplier={2} style={styles.reviewTitle}>{t("Knowledge Check")}</Text><Text key={`practice-setup-diagnostic-subtitle-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{t("40 questions on this topic. No time limit. Explanations after each answer.")}</Text></View></Card>}

        {designMode ? <Text key={`design-feedback-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{t("Feedback is shown after each answer.")}</Text> : null}

        {selectableFeedback ? (
          <View style={[styles.section, compactCodingPractice ? styles.compactSection : null]}>
            {compactCodingPractice ? <PracticeSetupSectionHeader title={t("Feedback mode")} subtitle={t("Choose when to see feedback on your answers.")} /> : <SectionHeader title={t("Feedback mode")} tight />}
            <SelectablePanel
              compact={compactCodingPractice}
              detail={t("See whether your answer is correct and read the explanation.")}
              label={t("After each answer")}
              onPress={() => setFeedbackMode("afterEachAnswer")}
              selected={feedbackMode === "afterEachAnswer"}
              testID={runtimeSelectors.practice.feedbackTiming("afterEachAnswer")}
            />
            <SelectablePanel
              compact={compactCodingPractice}
              detail={t("See your results and explanations when the session ends.")}
              label={t("At session end")}
              onPress={() => setFeedbackMode("atSessionEnd")}
              selected={feedbackMode === "atSessionEnd"}
              testID={runtimeSelectors.practice.feedbackTiming("atSessionEnd")}
            />
          </View>
        ) : null}

        {!diagnosticBaseline && !focusPractice && !weakAreaReview && !quickReview && !algorithmMode && !designMode ? (
          <Card style={styles.reviewCard}>
            <View style={styles.reviewCopy}>
              <Text key={`practice-setup-review-title-${fontScale}`} maxFontSizeMultiplier={2} style={styles.reviewTitle}>{t(reviewBehaviorCopy.title)}</Text>
              <Text key={`practice-setup-review-detail-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{t(reviewBehaviorCopy.detail)}</Text>
            </View>
            {reviewBehaviorCopy.showToggle ? (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: reviewBehaviorEnabled }}
                onPress={() => setReviewBehaviorEnabled((current) => !current)}
                style={[styles.switchTrack, reviewBehaviorEnabled ? styles.switchTrackEnabled : null]}
              >
                <View style={[styles.switchThumb, reviewBehaviorEnabled ? styles.switchThumbEnabled : null]} />
              </Pressable>
            ) : null}
          </Card>
        ) : null}

        {!compactCodingPractice && !focusPractice ? <View style={styles.actions}>
          {setupError ? <Text key={`practice-setup-actions-error-${fontScale}`} maxFontSizeMultiplier={2} accessibilityRole="alert" style={styles.error}>{t(setupError)}</Text> : null}
          {premiumOfferError ? <Text key={`practice-setup-premium-error-${fontScale}`} maxFontSizeMultiplier={2} accessibilityRole="alert" style={styles.error} testID={runtimeSelectors.practice.premiumOfferError()}>{t(premiumOfferError)}</Text> : null}
          <Button disabled={premiumOfferBusyId !== null} loading={premiumOfferBusyId !== null} onPress={startSession} testID={runtimeSelectors.practice.startSession()}>{t("Start session")}</Button>
        </View> : null}
      </Screen>
    </View>
  );
}

function buildPracticeSetupRouteIdentity(params: PracticeSetupScreenProps["route"]["params"]): string {
  try {
    return JSON.stringify(params ?? {}) ?? "{}";
  } catch {
    return "invalid-route";
  }
}

type SelectableOptionProps = {
  variant?: "default" | "compact" | "focus";
  label: string;
  meta?: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
};

function SelectableOption({ variant = "default", label, meta, onPress, selected, testID }: SelectableOptionProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const compact = variant === "compact";
  const focus = variant === "focus";
  return (
    <Pressable
      accessibilityRole={focus ? "radio" : "button"}
      accessibilityLabel={`${label} ${meta ?? t("Questions")}`}
      accessibilityState={{ selected, ...(focus ? { checked: selected } : {}) }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.lengthOption,
        compact ? styles.compactLengthOption : null,
        focus ? styles.focusLengthOption : null,
        selected ? (compact ? styles.compactSelectedLengthOption : styles.selectedOption) : null,
        selected && focus ? styles.focusSelectedLengthOption : null,
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
    >
      <Text key={`practice-setup-session-length-${fontScale}`} maxFontSizeMultiplier={2} style={[styles.lengthValue, compact ? styles.compactLengthValue : null, focus ? styles.focusLengthValue : null, selected ? (compact ? styles.compactSelectedText : styles.selectedText) : null]}>{label}</Text>
      {meta ? <Text key={`practice-setup-session-length-meta-${fontScale}`} maxFontSizeMultiplier={2} style={[styles.optionMeta, compact ? styles.compactOptionMeta : null, selected && compact ? styles.compactSelectedMeta : null]}>{meta}</Text> : null}
    </Pressable>
  );
}

type SelectablePanelProps = {
  compact?: boolean;
  disabled?: boolean;
  detail: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
};

function SelectablePanel({ compact = false, disabled = false, detail, label, onPress, selected, testID }: SelectablePanelProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  if (compact) {
    return <ChoiceRow accessibilityLabel={`${label}. ${detail}`} density="compact" detail={detail} disabled={disabled} onPress={onPress} selected={selected} testID={testID} title={label} />;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={compact ? `${label}. ${detail}` : undefined}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.panel,
        selected ? styles.selectedOption : null,
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
      >
      <View style={styles.panelCopy}>
        <Text key={`practice-setup-panel-title-${fontScale}`} maxFontSizeMultiplier={2} style={[styles.panelTitle, selected ? styles.selectedText : null]}>{label}</Text>
        <Text key={`practice-setup-panel-detail-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{detail}</Text>
      </View>
      <View style={[styles.radio, selected ? styles.radioSelected : null]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: {
    backgroundColor: palette.background,
    flex: 1,
  },
  practiceSetupLoading: {
    gap: spacing.xl,
    minWidth: 0,
    width: "100%",
  },
  practiceSetupLoadingCompact: {
    gap: spacing.lg,
  },
  practiceSetupLoadingShapes: {
    gap: spacing.xl,
    minWidth: 0,
    width: "100%",
  },
  practiceSetupLoadingIntro: {
    gap: spacing.sm,
    minWidth: 0,
    width: "100%",
  },
  practiceSetupLoadingTitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    maxWidth: 250,
    width: "68%",
  },
  practiceSetupLoadingSubtitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 440,
    width: "100%",
  },
  practiceSetupLoadingSubtitleShort: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 300,
    width: "72%",
  },
  practiceSetupLoadingSection: {
    gap: spacing.md,
  },
  practiceSetupLoadingChevron: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    height: 22,
    width: 22,
  },
  practiceSetupLoadingCompactSection: {
    gap: spacing.sm,
  },
  practiceSetupLoadingSectionTitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 180,
    width: "42%",
  },
  practiceSetupLoadingDescriptionCard: {
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  practiceSetupLoadingDescriptionShort: {
    maxWidth: 260,
    width: "74%",
  },
  practiceSetupLoadingLengthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  practiceSetupLoadingCompactLengthGrid: {
    backgroundColor: palette.surfaceInput,
    borderColor: palette.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexWrap: "nowrap",
    gap: spacing.xs,
    minHeight: 54,
    padding: spacing.xs,
  },
  practiceSetupLoadingLengthOption: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minWidth: 108,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  practiceSetupLoadingCompactLengthOption: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 1,
    gap: spacing.xs,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  practiceSetupLoadingLine: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
  },
  practiceSetupLoadingLengthValue: {
    maxWidth: 58,
    width: "44%",
  },
  practiceSetupLoadingLengthMeta: {
    maxWidth: 72,
    width: "60%",
  },
  practiceSetupLoadingPanelList: {
    gap: spacing.md,
  },
  practiceSetupLoadingPanel: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.lg,
  },
  practiceSetupLoadingPanelLarge: {
    minHeight: 132,
  },
  practiceSetupLoadingCompactPanel: {
    minHeight: 56,
    padding: spacing.md,
  },
  practiceSetupLoadingPanelCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  practiceSetupLoadingPanelTitle: {
    maxWidth: 220,
    width: "72%",
  },
  practiceSetupLoadingPanelDetail: {
    maxWidth: 360,
    width: "92%",
  },
  practiceSetupLoadingFeedbackStrip: {
    maxWidth: 360,
    width: "84%",
  },
  practiceSetupLoadingControl: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  practiceSetupLoadingActionSpace: {
    gap: spacing.md,
    marginTop: spacing.xl,
    width: "100%",
  },
  practiceSetupLoadingAction: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.button,
    borderWidth: 1,
    width: "100%",
  },
  practiceSetupLoadingUnknown: {
    gap: spacing.md,
  },
  practiceSetupLoadingUnknownTitle: {
    maxWidth: 230,
    width: "54%",
  },
  practiceSetupLoadingUnknownCard: {
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  practiceSetupLoadingUnknownLine: {
    maxWidth: 340,
    width: "88%",
  },
  practiceSetupLoadingUnknownLineShort: {
    maxWidth: 230,
    width: "64%",
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.small,
    color: palette.textSecondary,
  },
  error: {
    ...typography.small,
    color: palette.danger,
  },
  section: {
    gap: spacing.md,
  },
  focusContent: {
    gap: spacing.xxxl,
  },
  focusSection: {
    gap: spacing.lg,
  },
  selectedTopic: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minHeight: 64,
    padding: spacing.xl,
  },
  selectedTopicTitle: {
    ...typography.navigationContext,
    fontWeight: "400",
    color: palette.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  focusSectionLabel: {
    ...typography.navigationContext,
    color: palette.textPrimary,
  },
  compactSection: {
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  compactSectionHeader: {
    gap: spacing.xs,
  },
  compactSectionTitle: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  compactSectionSubtitle: {
    color: palette.textMuted,
    fontSize: 12.5,
    lineHeight: 15,
  },
  lengthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  focusLengthGrid: {
    gap: spacing.lg,
  },
  compactLengthGrid: {
    backgroundColor: palette.surfaceInput,
    borderColor: palette.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: spacing.xs,
    minHeight: 54,
    padding: spacing.xs,
  },
  lengthOption: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 92,
    minWidth: 108,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  compactLengthOption: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 0,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  focusLengthOption: {
    borderRadius: radius.lg,
    minHeight: 56,
    minWidth: 0,
    paddingVertical: spacing.md,
  },
  focusSelectedLengthOption: {
    borderWidth: 2,
  },
  compactSelectedLengthOption: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  selectedOption: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  pressed: {
    opacity: 0.82,
  },
  lengthValue: {
    ...typography.heading,
    color: palette.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  compactLengthValue: {
    fontSize: 15,
    lineHeight: 18,
  },
  focusLengthValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  selectedText: {
    color: palette.textPrimary,
  },
  compactSelectedText: {
    color: palette.onPrimary,
  },
  compactSelectedMeta: {
    color: palette.onPrimary,
  },
  optionMeta: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  compactOptionMeta: {
    fontSize: 11,
    lineHeight: 15,
    textTransform: "none",
  },
  panel: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.lg,
  },
  panelCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  panelTitle: {
    ...typography.bodyStrong,
    color: palette.textSecondary,
  },
  radio: {
    alignItems: "center",
    borderColor: palette.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  radioSelected: {
    borderColor: palette.primary,
  },
  radioDot: {
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    height: 12,
    width: 12,
  },
  reviewCard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewCopy: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  reviewTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  switchTrack: {
    backgroundColor: palette.borderStrong,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    padding: 4,
    width: 56,
  },
  switchTrackEnabled: {
    backgroundColor: palette.primary,
  },
  switchThumb: {
    backgroundColor: palette.textPrimary,
    borderRadius: radius.pill,
    height: 24,
    width: 24,
  },
  switchThumbEnabled: {
    transform: [{ translateX: 24 }],
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  footerActions: {
    gap: spacing.md,
  },
});

function PracticeSetupSectionHeader({ title, subtitle }: Readonly<{ title: string; subtitle: string }>) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  return <View style={styles.compactSectionHeader}><Text key={`practice-setup-section-title-${fontScale}`} maxFontSizeMultiplier={2} style={styles.compactSectionTitle}>{title.toUpperCase()}</Text><Text key={`practice-setup-section-subtitle-${fontScale}`} maxFontSizeMultiplier={2} style={styles.compactSectionSubtitle}>{subtitle}</Text></View>;
}
