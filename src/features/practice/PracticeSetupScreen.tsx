import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, DomainAccent, ProgressBar, Screen, SectionHeader } from "../../components";
import { EXAM_BLUEPRINT, EXAM_DURATION_MINUTES, EXAM_QUESTION_COUNT, ROUTES, TRAINING_PASS_THRESHOLD } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { getQuestions } from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import type { ExamDomain, Question } from "../../types";
import { getDomainLabel } from "../../utils";
import { getPracticeDomainCounts, type PracticeQuestionCount } from "./practiceService";

type PracticeSetupScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SETUP>;

const countOptions: PracticeQuestionCount[] = [10, 20, "all"];

export function PracticeSetupScreen({ navigation }: PracticeSetupScreenProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<ExamDomain | null>(null);
  const [questionCount, setQuestionCount] = useState<PracticeQuestionCount>(10);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadQuestions() {
        const savedQuestions = await getQuestions();

        if (isActive) {
          setQuestions(savedQuestions);
          setSelectedDomain((current) => current ?? getPracticeDomainCounts(savedQuestions).find((item) => item.count > 0)?.domain ?? null);
        }
      }

      void loadQuestions();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const domainCounts = useMemo(() => getPracticeDomainCounts(questions), [questions]);
  const selectedDomainCount = domainCounts.find((item) => item.domain === selectedDomain)?.count ?? 0;
  const maxDomainCount = Math.max(1, ...domainCounts.map((item) => item.count));
  const canStart = selectedDomain !== null && selectedDomainCount > 0;

  return (
    <Screen
      footer={
        <Button
          disabled={!canStart}
          onPress={() => {
            if (selectedDomain) {
              navigation.navigate(ROUTES.PRACTICE_SESSION, { domain: selectedDomain, questionCount });
            }
          }}
        >
          Start Practice
        </Button>
      }
    >
      <Card>
        <SectionHeader title="Practice by Domain" subtitle="Focused sessions with immediate feedback after each answer." />
      </Card>

      <Card>
        <SectionHeader title="Domain" subtitle="Choose one domain for this practice session." tight />
        <View style={styles.list}>
          {domainCounts.map((item) => {
            const isSelected = selectedDomain === item.domain;
            const isEmpty = item.count === 0;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isEmpty, selected: isSelected }}
                disabled={isEmpty}
                key={item.domain}
                onPress={() => setSelectedDomain(item.domain)}
                style={({ pressed }) => [
                  styles.domainCard,
                  isSelected ? styles.domainCardSelected : null,
                  isEmpty ? styles.domainCardDisabled : null,
                  pressed && !isEmpty ? styles.pressed : null
                ]}
              >
                <DomainAccent tone={getDomainAccentTone(item.domain)} />
                <View style={styles.domainCopy}>
                  <View style={styles.domainHeader}>
                    <Text style={styles.domainLabel}>{getDomainLabel(item.domain)}</Text>
                    <Badge label={isEmpty ? "Empty" : `${item.count} available`} tone={isEmpty ? "neutral" : "info"} />
                  </View>
                  <ProgressBar progress={item.count / maxDomainCount} tone={isEmpty ? "info" : "primary"} />
                  <Text style={styles.domainMeta}>
                    Blueprint target: {EXAM_BLUEPRINT[item.domain]} questions. {isEmpty ? "Import questions before practicing this domain." : "Ready for focused practice."}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Practice Settings" subtitle="Exam defaults are shown here for context; practice remains untimed." tight />
        <View style={styles.settingsGrid}>
          <SettingMetric label="Exam default" value={`${EXAM_QUESTION_COUNT} q`} />
          <SettingMetric label="Time limit" value={`${EXAM_DURATION_MINUTES} min`} />
          <SettingMetric label="Local threshold" value={`${TRAINING_PASS_THRESHOLD}%`} />
        </View>
        <Text style={styles.helperText}>The threshold is only a local training benchmark, not an official passing score.</Text>
        <View style={styles.countRow}>
          {countOptions.map((option) => (
            <Button
              key={option}
              onPress={() => setQuestionCount(option)}
              style={styles.countButton}
              variant={questionCount === option ? "primary" : "secondary"}
            >
              {option === "all" ? "All" : String(option)}
            </Button>
          ))}
        </View>
        {selectedDomain ? (
          <Text style={styles.helperText}>
            {questionCount === "all" ? selectedDomainCount : Math.min(questionCount, selectedDomainCount)} question
            {Math.min(questionCount === "all" ? selectedDomainCount : questionCount, selectedDomainCount) === 1 ? "" : "s"} available for this session.
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}

function SettingMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingMetric}>
      <Text style={styles.settingValue}>{value}</Text>
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
  );
}

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

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  domainCard: {
    alignItems: "center",
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 104,
    padding: spacing.lg
  },
  domainCardSelected: {
    backgroundColor: colors.dark.primarySoft,
    borderColor: colors.dark.primary
  },
  domainCardDisabled: {
    opacity: 0.62
  },
  pressed: {
    opacity: 0.84
  },
  domainCopy: {
    flex: 1,
    gap: spacing.sm
  },
  domainHeader: {
    alignItems: "flex-start",
    gap: spacing.xs
  },
  domainLabel: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary
  },
  domainMeta: {
    ...typography.caption,
    color: colors.dark.textSecondary
  },
  settingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  settingMetric: {
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: "30%",
    padding: spacing.md
  },
  settingValue: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary
  },
  settingLabel: {
    ...typography.caption,
    color: colors.dark.textSecondary
  },
  countRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  countButton: {
    flex: 1
  },
  helperText: {
    ...typography.body,
    color: colors.dark.textSecondary
  }
});
