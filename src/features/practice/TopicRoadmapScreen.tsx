import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  AppShellHeader,
  EmptyState,
  Icon,
  LoadingState,
  Screen,
  type IconName,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  getTrackDisplay,
  type TrackId,
} from "../../domain";
import type { TrainingAttempt } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { loadActiveTrackId as getActiveTrackId, loadTrainingAttempts as getTrainingAttempts } from "../../application/learningReadModels";
import { colorWithOpacity, radius, spacing, typography } from "../../theme";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { SelectTrackScreen } from "../home/SelectTrackScreen";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";

import {
  buildTopicRoadmapNodes,
  type TopicRoadmapNodeModel,
} from "./practiceFlowModel";

type TopicRoadmapScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.TOPIC_ROADMAP
>;

type RoadmapRow =
  | { kind: "center"; topic: TopicRoadmapNodeModel }
  | { kind: "split"; left: TopicRoadmapNodeModel; right: TopicRoadmapNodeModel };

const STORED_TRACK_REQUEST_KEY = "stored-track" as const;
type RoadmapRequestKey = TrackId | typeof STORED_TRACK_REQUEST_KEY;
type RoadmapReadState =
  | Readonly<{ kind: "pending"; requestKey: RoadmapRequestKey }>
  | Readonly<{ kind: "ready"; requestKey: RoadmapRequestKey; activeTrackId: TrackId | null; trainingAttempts: readonly TrainingAttempt[] }>
  | Readonly<{ kind: "unavailable"; requestKey: RoadmapRequestKey; reason: string }>;

const DOT_COLUMNS = 18;
const DOT_ROWS = 56;

export function TopicRoadmapScreen({ navigation, route }: TopicRoadmapScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const requestKey: RoadmapRequestKey = route.params?.trackId ?? STORED_TRACK_REQUEST_KEY;
  const [readState, setReadState] = useState<RoadmapReadState>({ kind: "pending", requestKey });
  const [selectedTopicId, setSelectedTopicId] = useState(route.params?.topicId);

  useFocusEffect(
    useCallback(() => {
      const capturedRequestKey = requestKey;
      let isActive = true;
      setReadState({ kind: "pending", requestKey: capturedRequestKey });

      async function loadData() {
        try {
          const [savedTrackId, trainingAttemptsResult] = await Promise.all([
            getActiveTrackId(),
            getTrainingAttempts(),
          ]);

          if (isActive) {
            setReadState({
              kind: "ready",
              requestKey: capturedRequestKey,
              activeTrackId: capturedRequestKey === STORED_TRACK_REQUEST_KEY ? savedTrackId ?? null : capturedRequestKey,
              trainingAttempts: trainingAttemptsResult.value,
            });
          }
        } catch (error) {
          if (isActive) {
            setReadState({
              kind: "unavailable",
              requestKey: capturedRequestKey,
              reason: describeOperationalFailure(error, "Topic roadmap data is unavailable."),
            });
          }
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, [requestKey]),
  );

  useEffect(() => {
    setSelectedTopicId(route.params?.topicId);
  }, [route.params?.topicId]);

  if (readState.requestKey !== requestKey || readState.kind === "pending") return <Screen edges={["top"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Topic Roadmap")} /><LoadingState title={t("Preparing practice")} /></Screen>;
  if (readState.kind === "unavailable") return <Screen edges={["top"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Topic Roadmap")} /><EmptyState title={t("Topic roadmap is unavailable")} description={t(readState.reason)} /></Screen>;
  const { activeTrackId, trainingAttempts } = readState;
  if (!activeTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  const activeTrack = getTrackDisplay(activeTrackId);
  const topics = buildTopicRoadmapNodes({ activeTrackId, trainingAttempts });
  const rows = buildRoadmapRows(topics);
  const resolvedSelectedTopicId = getSelectableTopicId(topics, selectedTopicId);

  function selectTopic(topic: TopicRoadmapNodeModel) {
    if (topic.status === "locked") return;
    setSelectedTopicId(topic.id);
  }

  function returnToPracticeHub() {
    navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: resolvedSelectedTopicId });
  }

  return (
    <View style={styles.shell}>
      <Screen edges={["top"]}>
        <AppShellHeader backAction={{ onPress: returnToPracticeHub }} />

        <View style={styles.intro}>
          <Text maxFontSizeMultiplier={2} style={styles.title}>{t("Choose topic")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.subtitle}>
            {t("Select a topic to practice in")} {t(activeTrack.title)}. {t("Patternly may still suggest areas based on your answers.")}
          </Text>
        </View>

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
  const { colors: palette, t } = useAppPreferences();
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
      <Text maxFontSizeMultiplier={2} numberOfLines={2} style={styles.nodeTitle}>
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
  nodeTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
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
