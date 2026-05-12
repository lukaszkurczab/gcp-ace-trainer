import { StyleSheet, Text, View } from "react-native";

import { Badge, Card, DomainAccent, ProgressBar, SectionHeader } from "../../components";
import { EXAM_QUESTION_COUNT } from "../../constants";
import { colors, radius, spacing, typography } from "../../theme";
import type { ExamDomain, Question } from "../../types";
import { getDomainLabel } from "../../utils";
import { buildQuestionBankSummary } from "./questionBankStats";

type QuestionBankSummaryProps = {
  questions: readonly Question[];
};

export function QuestionBankSummary({ questions }: QuestionBankSummaryProps) {
  const summary = buildQuestionBankSummary(questions);
  const coveredQuestions = summary.domainCoverage.reduce((sum, item) => sum + Math.min(item.current, item.required), 0);
  const totalMissing = summary.domainCoverage.reduce((sum, item) => sum + item.missing, 0);
  const totalProgress = coveredQuestions / EXAM_QUESTION_COUNT;

  return (
    <Card>
      <SectionHeader
        title="Question Bank"
        subtitle={summary.examReady ? "Ready for a full timed session." : "Import enough questions across each domain to unlock exam mode."}
        action={<Badge label={summary.examReady ? "Exam ready" : "Not ready"} tone={summary.examReady ? "ready" : "warning"} />}
      />

      <View style={styles.totalBlock}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalValue}>{summary.totalQuestions}</Text>
            <Text style={styles.totalLabel}>saved questions</Text>
          </View>
          <View style={styles.requiredBlock}>
            <Text style={styles.requiredValue}>{EXAM_QUESTION_COUNT}</Text>
            <Text style={styles.totalLabel}>needed</Text>
          </View>
        </View>
        <ProgressBar progress={totalProgress} tone={summary.examReady ? "success" : "warning"} />
        <Text style={styles.readyText}>
          {summary.examReady ? "All domain minimums are covered." : `${totalMissing} more domain-ready question${totalMissing === 1 ? "" : "s"} needed.`}
        </Text>
      </View>

      <View style={styles.domainList}>
        {summary.domainCoverage.map((item) => {
          const progress = Math.min(item.current / item.required, 1);
          const isReady = item.missing === 0;

          return (
            <View key={item.domain} style={styles.domainRow}>
              <DomainAccent tone={getDomainAccentTone(item.domain)} />
              <View style={styles.domainCopy}>
                <View style={styles.domainHeader}>
                  <Text style={styles.domainLabel}>{getDomainLabel(item.domain)}</Text>
                  <Text style={isReady ? styles.domainReady : styles.domainMissing}>
                    {isReady ? "ready" : `${item.missing} missing`}
                  </Text>
                </View>
                <ProgressBar progress={progress} tone={isReady ? "success" : "warning"} />
                <Text style={styles.domainCount}>
                  {item.current}/{item.required} questions
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  totalBlock: {
    backgroundColor: colors.light.elevatedSurface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg
  },
  totalRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  totalValue: {
    ...typography.title,
    color: colors.light.textPrimary
  },
  totalLabel: {
    ...typography.caption,
    color: colors.light.textSecondary
  },
  requiredBlock: {
    alignItems: "flex-end"
  },
  requiredValue: {
    ...typography.heading,
    color: colors.light.textPrimary
  },
  readyText: {
    ...typography.small,
    color: colors.light.textSecondary
  },
  domainList: {
    gap: spacing.md
  },
  domainRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  domainCopy: {
    flex: 1,
    gap: spacing.xs
  },
  domainHeader: {
    alignItems: "flex-start",
    gap: spacing.xs
  },
  domainLabel: {
    ...typography.small,
    color: colors.light.textPrimary
  },
  domainCount: {
    ...typography.caption,
    color: colors.light.textSecondary
  },
  domainReady: {
    ...typography.caption,
    color: colors.light.success
  },
  domainMissing: {
    ...typography.caption,
    color: colors.light.warning
  }
});

function getDomainAccentTone(domain: ExamDomain) {
  switch (domain) {
    case "setup_environment":
      return "purple";
    case "planning_implementation":
      return "teal";
    case "operations":
      return "orange";
    case "access_security":
      return "info";
  }
}
