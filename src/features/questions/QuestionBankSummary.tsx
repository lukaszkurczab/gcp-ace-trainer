import { StyleSheet, Text, View } from "react-native";

import { Badge, Card, SectionHeader } from "../../components";
import { colors, spacing, typography } from "../../theme";
import type { Question } from "../../types";
import { getDomainLabel } from "../../utils";
import { buildQuestionBankSummary } from "./questionBankStats";

type QuestionBankSummaryProps = {
  questions: readonly Question[];
};

export function QuestionBankSummary({ questions }: QuestionBankSummaryProps) {
  const summary = buildQuestionBankSummary(questions);
  const missingDomains = summary.domainCoverage.filter((item) => item.missing > 0);

  return (
    <Card>
      <SectionHeader
        title="Question Bank"
        subtitle={`${summary.totalQuestions} saved question${summary.totalQuestions === 1 ? "" : "s"}`}
        action={<Badge label={summary.examReady ? "Exam ready" : "Not ready"} tone={summary.examReady ? "success" : "warning"} />}
      />

      {summary.examReady ? (
        <Text style={styles.readyText}>Exam mode has enough questions for every domain.</Text>
      ) : (
        <View style={styles.domainList}>
          {missingDomains.map((item) => (
            <View key={item.domain} style={styles.domainRow}>
              <Text style={styles.domainLabel}>{getDomainLabel(item.domain)}</Text>
              <Text style={styles.domainCount}>
                {item.current}/{item.required} · missing {item.missing}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  readyText: {
    ...typography.body,
    color: colors.light.textMuted
  },
  domainList: {
    gap: spacing.sm
  },
  domainRow: {
    gap: spacing.xs
  },
  domainLabel: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  domainCount: {
    ...typography.caption,
    color: colors.light.textMuted
  }
});
