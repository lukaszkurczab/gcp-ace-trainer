import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Icon,
  Screen,
  type IconName,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  CLOUD_CERTIFICATION_TRACK_ID,
  DEFAULT_TRACK_ID,
  getTrackDefinition,
  type TrackId,
} from "../../domain";
import type { TrainingAttempt } from "../../domain/training";
import type { RootStackParamList } from "../../navigation";
import { getActiveTrackId, getTrainingAttempts } from "../../storage";
import { colorWithOpacity, colors, radius, spacing, typography } from "../../theme";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { AppStackHeader } from "../navigation/AppStackHeader";
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

const TAB_BAR_RESERVED_HEIGHT = 112;
const DOT_COLUMNS = 18;
const DOT_ROWS = 56;

export function TopicRoadmapScreen({ navigation, route }: TopicRoadmapScreenProps) {
  const [activeTrackId, setActiveTrackId] = useState<TrackId>(DEFAULT_TRACK_ID);
  const [selectedTopicId, setSelectedTopicId] = useState(route.params?.topicId);
  const [trainingAttempts, setTrainingAttempts] = useState<TrainingAttempt[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        const [savedTrackId, trainingAttemptsResult] = await Promise.all([
          getActiveTrackId(),
          getTrainingAttempts(),
        ]);

        if (isActive) {
          setActiveTrackId(savedTrackId);
          setTrainingAttempts(trainingAttemptsResult.value);
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    setSelectedTopicId(route.params?.topicId);
  }, [route.params?.topicId]);

  const activeTrack = getTrackDefinition(activeTrackId);
  const topics = buildTopicRoadmapNodes({ activeTrackId, trainingAttempts });
  const rows = useMemo(() => buildRoadmapRows(topics), [topics]);
  const resolvedSelectedTopicId = selectedTopicId ?? getDefaultSelectedTopicId(topics);

  function selectTopic(topic: TopicRoadmapNodeModel) {
    if (!topic.enabled) {
      return;
    }

    setSelectedTopicId(topic.id);
  }

  function returnToPracticeHub() {
    navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: resolvedSelectedTopicId });
  }

  return (
    <View style={styles.shell}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <AppStackHeader
          navigation={navigation}
          onBackPress={returnToPracticeHub}
          showBack
        />

        <View style={styles.intro}>
          <Text style={styles.title}>Choose topic</Text>
          <Text style={styles.subtitle}>
            Select a topic to practice in {activeTrack.title}. Patternly may still suggest areas based on your answers.
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
    topics.find((topic) => topic.enabled)?.id;
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
  const locked = !topic.enabled;
  const iconName = getTopicIcon(topic, activeTrackId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: locked, selected }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.node,
        large ? styles.nodeLarge : null,
        locked ? styles.nodeLocked : null,
        pressed && !locked ? styles.pressed : null,
      ]}
    >
      <View
        style={[
          styles.nodeCircle,
          large ? styles.nodeCircleLarge : null,
          getCircleStyle(topic, selected),
        ]}
      >
        <Icon
          color={getIconColor(topic, selected)}
          name={iconName}
          size={large ? 30 : 25}
        />
      </View>
      <Text numberOfLines={2} style={[styles.nodeTitle, locked ? styles.nodeTitleLocked : null]}>
        {topic.title}
      </Text>
      <Text style={[styles.nodeLabel, getLabelStyle(topic, selected)]}>
        {formatNodeLabel(topic)}
      </Text>
    </Pressable>
  );
}

function DotGrid() {
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
  if (activeTrackId !== CLOUD_CERTIFICATION_TRACK_ID) {
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

function getCircleStyle(topic: TopicRoadmapNodeModel, selected: boolean) {
  if (!topic.enabled) {
    return styles.nodeCircleLocked;
  }

  if (selected) {
    return styles.nodeCircleActive;
  }

  return styles.nodeCircleAvailable;
}

function getIconColor(topic: TopicRoadmapNodeModel, selected: boolean): string {
  if (!topic.enabled) {
    return colors.dark.textMuted;
  }

  if (selected) {
    return colors.dark.textPrimary;
  }

  return colors.dark.primary;
}

function getLabelStyle(topic: TopicRoadmapNodeModel, selected: boolean) {
  if (!topic.enabled) {
    return styles.nodeLabelLocked;
  }

  if (selected) {
    return styles.nodeLabelCurrent;
  }

  return styles.nodeLabelAvailable;
}

function formatNodeLabel(topic: TopicRoadmapNodeModel): string {
  if (topic.status === "completed") {
    return "Strong";
  }

  if (topic.status === "current") {
    return "Recommended";
  }

  if (topic.status === "available") {
    return "Practicing";
  }

  if (topic.status === "later") {
    return "Later";
  }

  return topic.label;
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.dark.background,
    flex: 1,
  },
  screenContent: {
    paddingBottom: TAB_BAR_RESERVED_HEIGHT,
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
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
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  dot: {
    backgroundColor: colorWithOpacity(colors.dark.textPrimary, 0.08),
    borderRadius: radius.pill,
    height: 2,
    position: "absolute",
    width: 2,
  },
  verticalConnector: {
    borderColor: colors.dark.border,
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
    borderColor: colors.dark.border,
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
    backgroundColor: colors.dark.background,
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
  nodeLocked: {
    opacity: 0.36,
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
    backgroundColor: colors.dark.background,
    borderColor: colors.dark.primary,
  },
  nodeCircleActive: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.background,
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 20,
  },
  nodeCircleLocked: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.borderStrong,
  },
  nodeTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
    textAlign: "center",
  },
  nodeTitleLocked: {
    color: colors.dark.textMuted,
  },
  nodeLabel: {
    ...typography.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  nodeLabelAvailable: {
    color: colors.dark.primary,
  },
  nodeLabelCurrent: {
    color: colors.dark.accentPurple,
  },
  nodeLabelLocked: {
    color: colors.dark.textMuted,
  },
});
