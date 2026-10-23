import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import {
  Button,
  Card,
  EmptyState,
  Icon,
  Screen,
  SkeletonShape,
  useSkeletonGlassMotion,
  type IconName,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  getTrackDisplay,
  type TrackId,
} from "../../domain";
import type { PracticeSetupRouteDraft, RootStackParamList } from "../../navigation";
import { colorWithOpacity, radius, spacing, typography } from "../../theme";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { SelectTrackScreen } from "../home/SelectTrackScreen";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { listAvailablePremiumNodeOffers } from "../../content/application/premiumNodeOfferAccess";
import { describePremiumNodeOfferFailure } from "../../content/application/premiumNodeOfferPresentation";
import type { PremiumNodeOffer } from "../../content/application/premiumNodeOffers";
import type { PracticeSessionLength } from "./sessionConfig";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

import {
  buildTopicRoadmapNodes,
  type TopicRoadmapNodeModel,
} from "./practiceFlowModel";
import { findMatchingPremiumSetupOffer, resolvePracticeSetupTopicChoice } from "./practiceNavigation";
import { titleForNode } from "./trackRoadmapCatalog";
import { usePracticeReadModel } from "./usePracticeReadModel";

type TopicRoadmapScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.TOPIC_ROADMAP
>;

type RoadmapRow =
  | { kind: "center"; topic: TopicRoadmapNodeModel }
  | { kind: "split"; left: TopicRoadmapNodeModel; right: TopicRoadmapNodeModel };

const DOT_COLUMNS = 18;
const DOT_ROWS = 56;

export function TopicRoadmapLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={t("Loading topic roadmap")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.roadmapLoading}
      testID="topic-roadmap-loading-skeleton"
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.roadmapLoadingShapes}>
        <View style={styles.roadmapLoadingIntro}>
          <SkeletonShape motion={motion} style={[styles.roadmapLoadingTitle, { height: 20 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.roadmapLoadingSubtitle, { height: 13 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.roadmapLoadingSubtitleShort, { height: 13 * textScale }]} />
        </View>
        <View style={styles.roadmapLoadingCanvas}>
          <View style={styles.roadmapLoadingVerticalConnector} />
          <View style={styles.roadmapLoadingRows}>
            {[0, 1, 2, 3, 4].map((row) => {
              const split = row === 2 || row === 4;
              const nodeIndexes = split ? [row * 2, row * 2 + 1] : [row];
              return (
                <View key={row} style={split ? styles.roadmapLoadingSplitRow : styles.roadmapLoadingCenterRow}>
                  {split ? <View style={styles.roadmapLoadingHorizontalConnector} /> : null}
                  {nodeIndexes.map((node) => (
                    <View key={node} style={[styles.roadmapLoadingNode, split ? styles.roadmapLoadingSplitNode : styles.roadmapLoadingCenterNode, !split && row < 2 ? styles.roadmapLoadingNodeLarge : null]}>
                      <SkeletonShape motion={motion} style={[styles.roadmapLoadingCircle, !split && row < 2 ? styles.roadmapLoadingCircleLarge : null]} />
                      <SkeletonShape motion={motion} style={[styles.roadmapLoadingNodeTitle, { height: 14 * textScale }]} />
                      <SkeletonShape motion={motion} style={[styles.roadmapLoadingNodeLabel, { height: 10 * textScale }]} />
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export function TopicRoadmapScreen({ navigation, route }: TopicRoadmapScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const isFocused = useIsFocused();
  const focusEpochRef = useRef(0);
  useEffect(() => {
    focusEpochRef.current += 1;
    if (!isFocused) setPremiumOfferBusyId(null);
    return () => { focusEpochRef.current += 1; };
  }, [isFocused]);
  const account = usePatternlyAccount();
  const { ownerMatches, readState, requestKey, retry } = usePracticeReadModel({
    errorFallback: t("We couldn’t load the topic list."),
    requestedTrackId: route.params?.trackId,
  });
  const [selectedTopicId, setSelectedTopicId] = useState(route.params?.topicId);
  const [premiumOfferError, setPremiumOfferError] = useState<string | null>(null);
  const [premiumOfferErrorHasFreeAlternative, setPremiumOfferErrorHasFreeAlternative] = useState(false);
  const [premiumOfferBusyId, setPremiumOfferBusyId] = useState<string | null>(null);
  const readTrackId = readState.kind === "ready" ? readState.activeTrackId : null;

  useEffect(() => {
    setSelectedTopicId(route.params?.topicId);
  }, [readTrackId, requestKey, route.params?.topicId]);

  function navigateBackToPractice() {
    if (route.params?.returnToSetup && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate(
      ROUTES.PRACTICE_HUB,
      route.params?.trackId ? { trackId: route.params.trackId } : undefined,
    );
  }

  function renderUnavailable(description: string, actionLabel = t("Back to practice"), onActionPress = navigateBackToPractice) {
    return (
      <View style={styles.shell}>
        <Screen backAction={{ destinationLabel: route.params?.returnToSetup ? t("Practice setup") : t("Practice"), onPress: navigateBackToPractice }} edges={["top", "bottom"]}>

          <EmptyState actionLabel={actionLabel} onActionPress={onActionPress} title={t("Topic roadmap is unavailable")} description={description} />
        </Screen>
        <AppBottomNavigation activeId="practice" navigation={navigation} />
      </View>
    );
  }

  if (!ownerMatches || readState.requestKey !== requestKey || readState.kind === "pending") return (
    <View style={styles.shell}>
      <Screen backAction={{ destinationLabel: route.params?.returnToSetup ? t("Practice setup") : t("Practice"), onPress: navigateBackToPractice }} edges={["top"]}>

        <TopicRoadmapLoadingSkeleton />
      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
    </View>
  );
  if (readState.kind === "unavailable") return renderUnavailable(t(readState.reason), t("Try again"), retry);
  const { activeTrackId, trainingAttempts } = readState;
  if (!activeTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  let activeTrack: ReturnType<typeof getTrackDisplay>;
  let topics: ReturnType<typeof buildTopicRoadmapNodes>;
  try {
    activeTrack = getTrackDisplay(activeTrackId);
    topics = buildTopicRoadmapNodes({ activeTrackId, trainingAttempts });
  } catch (error) {
    return renderUnavailable(describeOperationalFailure(error, t("Practice data is unavailable.")));
  }
  if (route.params?.topicId !== undefined && !topics.some((topic) => topic.id === route.params?.topicId && topic.status !== "locked")) {
    return renderUnavailable(t("This topic is not included in your free content."));
  }
  const rows = buildRoadmapRows(topics);
  const returningPremiumSelection = route.params?.returnToSetup === true && route.params.setupDraft?.premiumOfferId !== undefined;
  const currentPremiumOffer = returningPremiumSelection && route.params?.setupDraft
    ? findMatchingPremiumSetupOffer(route.params.setupDraft, listAvailablePremiumNodeOffers(activeTrack.id))
    : undefined;
  if (returningPremiumSelection && !currentPremiumOffer) return renderUnavailable(t("This learning plan uses a different content package. Review the plan before starting."));
  const resolvedSelectedTopicId = returningPremiumSelection
    ? topics.some((topic) => topic.id === selectedTopicId && topic.status !== "locked") ? selectedTopicId : undefined
    : getSelectableTopicId(topics, selectedTopicId);
  const setupReturnParams = route.params?.returnToSetup && route.params.setupDraft
    ? returningPremiumSelection && resolvedSelectedTopicId === undefined
      ? route.params.setupDraft
      : resolvedSelectedTopicId
        ? resolvePracticeSetupTopicChoice(route.params.setupDraft, resolvedSelectedTopicId, activeTrack.id)
        : null
    : null;

  function selectTopic(topic: TopicRoadmapNodeModel) {
    if (topic.status === "locked") return;
    setSelectedTopicId(topic.id);
  }

  function continueSelection() {
    if (route.params?.returnToSetup && route.params.setupDraft) {
      const draft = route.params.setupDraft;
      if (!setupReturnParams) return;
      navigation.popTo(ROUTES.PRACTICE_SETUP, {
        ...setupReturnParams,
      });
      return;
    }
    navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: resolvedSelectedTopicId ?? undefined, trackId: activeTrack.id });
  }

  function continueWithFreeTopic() {
    const freeTopicId = getDefaultSelectedTopicId(topics);
    if (!freeTopicId) return;
    if (route.params?.returnToSetup && route.params.setupDraft) {
      const params = resolvePracticeSetupTopicChoice(route.params.setupDraft, freeTopicId, activeTrack.id);
      if (params) navigation.popTo(ROUTES.PRACTICE_SETUP, params);
      return;
    }
    navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: freeTopicId, trackId: activeTrack.id });
  }

  async function preparePremiumOffer(offer: PremiumNodeOffer) {
    const prepareFocusEpoch = focusEpochRef.current;
    setPremiumOfferBusyId(offer.offerId);
    setPremiumOfferError(null);
    setPremiumOfferErrorHasFreeAlternative(false);
    try {
      await account.installPremiumNodePackage(offer.offerId, Constants.expoConfig?.version ?? "0.0.0");
      if (prepareFocusEpoch !== focusEpochRef.current) return;
      const prepared = await contentPackageRuntimeOwner.resolveForPreparation({ trackId: offer.trackId, familyId: offer.familyId, modeId: offer.mode.modeId, nodeId: offer.nodeId });
      if (prepareFocusEpoch !== focusEpochRef.current) return;
      if (prepared.track.contentVersion !== offer.contentVersion || prepared.track.artifactSha256 !== offer.artifactSha256 ||
        prepared.track.getMode(offer.mode.modeId).modeId !== offer.mode.modeId || !prepared.track.questions.some((question) => question.nodeId === offer.nodeId)) {
        throw new Error("premium_node_preparation_identity_mismatch");
      }
      if (route.params?.returnToSetup && route.params.setupDraft) {
        const requestedFeedbackMode = route.params.setupDraft.feedbackMode;
        const feedbackMode = offer.mode.feedbackTiming.kind === "learner_selectable" &&
          ((requestedFeedbackMode === "afterEachAnswer" && offer.mode.feedbackTiming.options.includes("after_each_durable_submit")) ||
            (requestedFeedbackMode === "atSessionEnd" && offer.mode.feedbackTiming.options.includes("after_session_completion")))
          ? requestedFeedbackMode
          : undefined;
        navigation.popTo(ROUTES.PRACTICE_SETUP, {
          ...route.params.setupDraft,
          mode: offer.mode.modeId as PracticeSetupRouteDraft["mode"],
          topicId: offer.nodeId,
          trackId: offer.trackId,
          premiumOfferId: offer.offerId,
          expectedContentVersion: offer.contentVersion,
          expectedArtifactSha256: offer.artifactSha256,
          mentalUnitId: undefined,
          sessionLength: route.params.setupDraft.sessionLength && offer.mode.requestedLengths.includes(route.params.setupDraft.sessionLength)
            ? route.params.setupDraft.sessionLength
            : offer.mode.defaultRequestedLength as PracticeSessionLength,
          feedbackMode,
          reviewBehaviorEnabled: false,
          source: "practiceSetup",
        });
        return;
      }
      setSelectedTopicId(offer.nodeId);
    } catch (error) {
      if (prepareFocusEpoch !== focusEpochRef.current) return;
      const presentation = describePremiumNodeOfferFailure(error);
      setPremiumOfferError(presentation.message);
      setPremiumOfferErrorHasFreeAlternative(presentation.freeAlternative);
    } finally {
      if (prepareFocusEpoch === focusEpochRef.current) setPremiumOfferBusyId(null);
    }
  }

  return (
    <View style={styles.shell} testID={route.params?.returnToSetup ? runtimeSelectors.practice.topicChooserRoot() : undefined}>
      <Screen backAction={{ destinationLabel: route.params?.returnToSetup ? t("Practice setup") : t("Practice"), onPress: route.params?.returnToSetup ? navigateBackToPractice : continueSelection }}
        edges={["top"]}
        footer={(
          <Button disabled={premiumOfferBusyId !== null || (route.params?.returnToSetup === true && !setupReturnParams)} onPress={continueSelection} testID={runtimeSelectors.practice.topicChooserContinue()} variant="primary">{t("Continue")}</Button>
        )}
        footerVariant="sticky"
      >


        <View style={styles.intro}>
          <Text maxFontSizeMultiplier={2} style={styles.title}>{t("Choose topic")}</Text>
          {!route.params?.returnToSetup ? <Text maxFontSizeMultiplier={2} style={styles.subtitle}>
            {t("Select a topic to practice in")} {t(activeTrack.title)}. {t("Your answers help us suggest what to practice next.")}
          </Text> : null}
        </View>

        {route.params?.returnToSetup ? listAvailablePremiumNodeOffers(activeTrack.id).map((offer) => {
          const isCurrentPremiumOffer = currentPremiumOffer?.offerId === offer.offerId && resolvedSelectedTopicId === undefined;
          const offerTitle = topics.find((topic) => topic.id === offer.nodeId)?.title ?? titleForNode(offer.nodeId);
          return <View key={offer.offerId}>
            <Card>
              <View accessible={isCurrentPremiumOffer}
                accessibilityLabel={isCurrentPremiumOffer ? `${offerTitle}, ${t("Selected")}` : undefined}
                accessibilityState={isCurrentPremiumOffer ? { selected: true } : undefined}
                style={{ gap: spacing.sm }}>
                <View style={styles.premiumOfferTitleRow}>
                  <Text maxFontSizeMultiplier={2} style={styles.nodeTitle}>{t("Premium")}</Text>
                  {isCurrentPremiumOffer ? <Text maxFontSizeMultiplier={2} style={styles.nodeLabel}>{t("Selected")}</Text> : null}
                </View>
                <Text maxFontSizeMultiplier={2} style={styles.nodeLabel}>{offerTitle}</Text>
              </View>
              {premiumOfferError ? <Text accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.nodeLabel} testID={runtimeSelectors.practice.premiumOfferError()}>{t(premiumOfferError)}</Text> : null}
              <Button disabled={premiumOfferBusyId !== null} loading={premiumOfferBusyId === offer.offerId} onPress={() => { void preparePremiumOffer(offer); }} testID={runtimeSelectors.practice.premiumOfferStart()}>
                {t(premiumOfferBusyId === offer.offerId ? "Preparing Premium topic…" : "Prepare local Premium topic")}
              </Button>
              {premiumOfferErrorHasFreeAlternative ? <Button onPress={continueWithFreeTopic} variant="secondary">{t("Continue with a free topic")}</Button> : null}
            </Card>
          </View>;
        }) : null}

        <View style={styles.canvas}>
          <DotGrid />
          <View style={styles.verticalConnector} />

          <View style={styles.roadmapRows}>
            {rows.map((row, index) => {
              if (row.kind === "split") {
                return (
                  <View key={`${row.left.id}-${row.right.id}`} style={styles.splitRow}>
                    <View style={styles.horizontalConnector} />
                    <RoadmapNode
                      activeTrackId={activeTrackId}
                      selected={isTopicSelected(row.left, resolvedSelectedTopicId)}
                      topic={row.left}
                      onPress={() => selectTopic(row.left)}
                    />
                    <RoadmapNode
                      activeTrackId={activeTrackId}
                      selected={isTopicSelected(row.right, resolvedSelectedTopicId)}
                      topic={row.right}
                      onPress={() => selectTopic(row.right)}
                    />
                  </View>
                );
              }

              return (
                <View key={row.topic.id} style={styles.centerRow}>
                  <RoadmapNode
                    activeTrackId={activeTrackId}
                    large={index < 2}
                    selected={isTopicSelected(row.topic, resolvedSelectedTopicId)}
                    topic={row.topic}
                    onPress={() => selectTopic(row.topic)}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
    </View>
  );
}

function buildRoadmapRows(topics: readonly TopicRoadmapNodeModel[]): RoadmapRow[] {
  const rows: RoadmapRow[] = [];

  if (topics[0]) {
    rows.push({ kind: "center", topic: topics[0] });
  }

  if (topics[1]) {
    rows.push({ kind: "center", topic: topics[1] });
  }

  let index = 2;
  let nextRowKind: "split" | "center" = "split";

  while (index < topics.length) {
    const topic = topics[index];
    const nextTopic = topics[index + 1];

    if (!topic) {
      break;
    }

    if (nextRowKind === "split" && nextTopic) {
      rows.push({
        kind: "split",
        left: topic,
        right: nextTopic,
      });
      index += 2;
      nextRowKind = "center";
      continue;
    }

    rows.push({
      kind: "center",
      topic,
    });
    index += 1;
    nextRowKind = "split";
  }

  return rows;
}

function getDefaultSelectedTopicId(
  topics: readonly TopicRoadmapNodeModel[],
): string | undefined {
  return topics.find((topic) => topic.status === "current")?.id ??
    topics[0]?.id;
}

function getSelectableTopicId(
  topics: readonly TopicRoadmapNodeModel[],
  selectedTopicId?: string,
): string | undefined {
  const selected = topics.find((topic) => topic.id === selectedTopicId);
  return selected && selected.status !== "locked"
    ? selected.id
    : getDefaultSelectedTopicId(topics);
}

function isTopicSelected(topic: TopicRoadmapNodeModel, selectedTopicId?: string): boolean {
  return topic.id === selectedTopicId;
}

type RoadmapNodeProps = {
  activeTrackId: TrackId;
  large?: boolean;
  onPress: () => void;
  selected: boolean;
  topic: TopicRoadmapNodeModel;
};

function RoadmapNode({
  activeTrackId,
  large = false,
  onPress,
  selected,
  topic,
}: RoadmapNodeProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const iconName = getTopicIcon(topic, activeTrackId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: topic.status === "locked", selected }}
      disabled={topic.status === "locked"}
      onPress={onPress}
      style={({ pressed }) => [
        styles.node,
        large ? styles.nodeLarge : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View
        style={[
          styles.nodeCircle,
          large ? styles.nodeCircleLarge : null,
          getCircleStyle(topic, selected, styles),
        ]}
      >
        <Icon
          color={getIconColor(topic, selected, palette)}
          name={iconName}
          size={large ? 30 : 25}
        />
      </View>
      <Text maxFontSizeMultiplier={2} style={styles.nodeTitle}>
        {topic.title}
      </Text>
      <Text maxFontSizeMultiplier={2} style={[styles.nodeLabel, getLabelStyle(topic, selected, styles)]}>
        {t(formatNodeLabel(topic))}
      </Text>
    </Pressable>
  );
}

function DotGrid() {
  const styles = useThemedStyles(createStyles);
  const dots = [];

  for (let row = 0; row < DOT_ROWS; row += 1) {
    for (let column = 0; column < DOT_COLUMNS; column += 1) {
      dots.push(
        <View
          key={`${row}-${column}`}
          style={[
            styles.dot,
            {
              left: column * 24,
              top: row * 24,
            },
          ]}
        />,
      );
    }
  }

  return <View pointerEvents="none" style={styles.dotGrid}>{dots}</View>;
}

function getTopicIcon(topic: TopicRoadmapNodeModel, activeTrackId: TrackId): IconName {
  if (topic.status === "locked") return "shield";
  if (activeTrackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID) {
    return "route";
  }

  const lowerTitle = topic.title.toLowerCase();

  if (lowerTitle.includes("storage") || lowerTitle.includes("database")) {
    return "database";
  }

  if (lowerTitle.includes("exam")) {
    return "clipboard";
  }

  if (lowerTitle.includes("iam")) {
    return "shield-check";
  }

  return "cloud";
}

function getCircleStyle(topic: TopicRoadmapNodeModel, selected: boolean, styles: ReturnType<typeof createStyles>) {
  if (selected) {
    return styles.nodeCircleActive;
  }

  if (topic.status === "locked") return styles.nodeCircleLocked;

  return styles.nodeCircleAvailable;
}

function getIconColor(topic: TopicRoadmapNodeModel, selected: boolean, palette: AppColors): string {
  if (selected) {
    return palette.textPrimary;
  }

  if (topic.status === "locked") return palette.textSecondary;

  return palette.primary;
}

function getLabelStyle(topic: TopicRoadmapNodeModel, selected: boolean, styles: ReturnType<typeof createStyles>) {
  if (selected) {
    return styles.nodeLabelCurrent;
  }

  if (topic.status === "locked") return styles.nodeLabelLocked;

  return styles.nodeLabelAvailable;
}

function formatNodeLabel(topic: TopicRoadmapNodeModel): string {
  return topic.label;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: {
    backgroundColor: palette.background,
    flex: 1,
  },
  roadmapLoading: {
    minWidth: 0,
    width: "100%",
  },
  roadmapLoadingShapes: {
    gap: spacing.xl,
    minWidth: 0,
    width: "100%",
  },
  roadmapLoadingIntro: {
    gap: spacing.sm,
    minWidth: 0,
    width: "100%",
  },
  roadmapLoadingTitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    maxWidth: 206,
    width: "58%",
  },
  roadmapLoadingSubtitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 420,
    width: "100%",
  },
  roadmapLoadingSubtitleShort: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 280,
    width: "70%",
  },
  roadmapLoadingCanvas: {
    backgroundColor: colorWithOpacity(palette.textPrimary, 0.02),
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxl,
    position: "relative",
  },
  roadmapLoadingVerticalConnector: {
    borderColor: palette.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    bottom: spacing.xxl,
    left: "50%",
    opacity: 0.68,
    position: "absolute",
    top: spacing.xxl,
  },
  roadmapLoadingRows: {
    gap: spacing.xxxl,
    position: "relative",
  },
  roadmapLoadingCenterRow: {
    alignItems: "center",
  },
  roadmapLoadingSplitRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 132,
    paddingHorizontal: spacing.xl,
    position: "relative",
  },
  roadmapLoadingHorizontalConnector: {
    borderColor: palette.border,
    borderStyle: "dashed",
    borderTopWidth: StyleSheet.hairlineWidth,
    left: spacing.xxl,
    opacity: 0.68,
    position: "absolute",
    right: spacing.xxl,
    top: 34,
  },
  roadmapLoadingNode: {
    alignItems: "center",
    backgroundColor: palette.background,
    gap: spacing.xs,
    maxWidth: 144,
    minWidth: 122,
    paddingHorizontal: spacing.sm,
    position: "relative",
    zIndex: 1,
  },
  roadmapLoadingNodeLarge: {
    maxWidth: 190,
    width: 190,
  },
  roadmapLoadingCenterNode: {
    width: 144,
  },
  roadmapLoadingSplitNode: {
    flex: 1,
    minWidth: 0,
  },
  roadmapLoadingCircle: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 56,
    width: 56,
  },
  roadmapLoadingCircleLarge: {
    height: 66,
    width: 66,
  },
  roadmapLoadingNodeTitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 132,
    width: "86%",
  },
  roadmapLoadingNodeLabel: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 94,
    width: "60%",
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
  },
  canvas: {
    borderRadius: radius.lg,
    minHeight: 980,
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xxl,
    position: "relative",
  },
  dotGrid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.55,
  },
  dot: {
    backgroundColor: colorWithOpacity(palette.textPrimary, 0.08),
    borderRadius: radius.pill,
    height: 2,
    position: "absolute",
    width: 2,
  },
  verticalConnector: {
    borderColor: palette.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    bottom: spacing.xxl,
    left: "50%",
    opacity: 0.68,
    position: "absolute",
    top: spacing.xxl,
  },
  roadmapRows: {
    gap: spacing.xxxl,
    position: "relative",
  },
  centerRow: {
    alignItems: "center",
  },
  splitRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 132,
    paddingHorizontal: spacing.xl,
    position: "relative",
  },
  horizontalConnector: {
    borderColor: palette.border,
    borderStyle: "dashed",
    borderTopWidth: StyleSheet.hairlineWidth,
    left: spacing.xxl,
    opacity: 0.68,
    position: "absolute",
    right: spacing.xxl,
    top: 34,
  },
  node: {
    alignItems: "center",
    backgroundColor: palette.background,
    gap: spacing.xs,
    maxWidth: 144,
    minWidth: 122,
    paddingHorizontal: spacing.sm,
    position: "relative",
    zIndex: 1,
  },
  nodeLarge: {
    maxWidth: 190,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  nodeCircle: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  nodeCircleLarge: {
    height: 66,
    width: 66,
  },
  nodeCircleAvailable: {
    backgroundColor: palette.background,
    borderColor: palette.primary,
  },
  nodeCircleLocked: {
    backgroundColor: colorWithOpacity(palette.textPrimary, 0.04),
    borderColor: palette.border,
  },
  nodeCircleActive: {
    backgroundColor: palette.primary,
    borderColor: palette.background,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 20,
  },
  premiumOfferTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nodeTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
    flexShrink: 1,
    minWidth: 0,
    textAlign: "center",
  },
  nodeLabel: {
    ...typography.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  nodeLabelAvailable: {
    color: palette.primary,
  },
  nodeLabelCurrent: {
    color: palette.accentPurple,
  },
  nodeLabelLocked: {
    color: palette.textSecondary,
  },
});
