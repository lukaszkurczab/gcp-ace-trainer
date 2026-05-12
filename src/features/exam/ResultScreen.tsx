import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from "../../components";
import { ROUTES, TRAINING_PASS_THRESHOLD } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { getAttempts } from "../../storage";
import { colors, spacing, typography } from "../../theme";
import type { AttemptSummary } from "../../types";
import { formatDuration, getDomainLabel } from "../../utils";

type ResultScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.RESULT>;

export function ResultScreen({ navigation, route }: ResultScreenProps) {
  const [attempt, setAttempt] = useState<AttemptSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadAttempt() {
        const attempts = await getAttempts();
        const selectedAttempt = attempts.find((item) => item.id === route.params?.attemptId) ?? attempts[0] ?? null;

        if (isActive) {
          setAttempt(selectedAttempt);
        }
      }

      void loadAttempt();

      return () => {
        isActive = false;
      };
    }, [route.params?.attemptId])
  );

  return (
    <Screen>
      {attempt ? (
        <>
          <Card>
            <SectionHeader
              title="Exam Result"
              subtitle={route.params?.autoSubmitted ? "Submitted automatically when time expired." : "Submitted exam attempt."}
              action={
                <Badge
                  label={attempt.passedTrainingThreshold ? "Training Pass" : "Training Failed"}
                  tone={attempt.passedTrainingThreshold ? "success" : "warning"}
                />
              }
            />
            <Text style={styles.score}>{attempt.scorePercent}%</Text>
            <Text style={styles.meta}>
              {attempt.correctCount}/{attempt.questionCount} correct · {formatDuration(attempt.durationSeconds)} · threshold{" "}
              {TRAINING_PASS_THRESHOLD}%
            </Text>
            <Text style={styles.disclaimer}>Training score only. This is not an official Google exam result.</Text>
          </Card>

          <Card>
            <SectionHeader title="Domain Breakdown" />
            <View style={styles.breakdown}>
              {attempt.domainScores.map((score) => (
                <View key={score.domain} style={styles.row}>
                  <Text style={styles.rowLabel}>{getDomainLabel(score.domain)}</Text>
                  <Text style={styles.rowValue}>
                    {score.correct}/{score.total} · {score.percent}%
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Weakest Domains" />
            <View style={styles.breakdown}>
              {getWeakestDomains(attempt).map((score) => (
                <View key={score.domain} style={styles.row}>
                  <Text style={styles.rowLabel}>{getDomainLabel(score.domain)}</Text>
                  <Text style={styles.rowValue}>
                    {score.correct}/{score.total} · {score.percent}%
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {getWeakTags(attempt).length > 0 ? (
            <Card>
              <SectionHeader title="Top Weak Tags" />
              <View style={styles.breakdown}>
                {getWeakTags(attempt).map((score) => (
                  <View key={score.tag} style={styles.row}>
                    <Text style={styles.rowLabel}>{score.tag}</Text>
                    <Text style={styles.rowValue}>
                      {score.correct}/{score.total} · {score.percent}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          <View style={styles.actions}>
            <Button onPress={() => navigation.navigate(ROUTES.ANSWER_REVIEW, { attemptId: attempt.id, initialFilter: "incorrect" })}>
              Review Answers
            </Button>
            <Button variant="secondary" onPress={() => navigation.navigate(ROUTES.HOME)}>
              Back Home
            </Button>
          </View>
        </>
      ) : (
        <Card>
          <EmptyState title="No completed attempt" description="Submit an exam to see scoring and domain breakdowns." />
        </Card>
      )}
    </Screen>
  );
}

function getWeakestDomains(attempt: AttemptSummary) {
  return [...attempt.domainScores]
    .filter((score) => score.total > 0)
    .sort((left, right) => left.percent - right.percent || right.total - left.total)
    .slice(0, 2);
}

function getWeakTags(attempt: AttemptSummary) {
  return attempt.tagScores.filter((score) => score.percent < 100).slice(0, 5);
}

const styles = StyleSheet.create({
  score: {
    ...typography.title,
    color: colors.light.text
  },
  meta: {
    ...typography.body,
    color: colors.light.textMuted
  },
  disclaimer: {
    ...typography.caption,
    color: colors.light.textMuted
  },
  breakdown: {
    gap: spacing.md
  },
  row: {
    gap: spacing.xs
  },
  rowLabel: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  rowValue: {
    ...typography.caption,
    color: colors.light.textMuted
  },
  actions: {
    gap: spacing.md
  }
});
