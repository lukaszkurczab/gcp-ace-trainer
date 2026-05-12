import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { getQuestions } from "../../storage";
import { colors, spacing, typography } from "../../theme";
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
  const canStart = selectedDomain !== null && selectedDomainCount > 0;

  return (
    <Screen>
      <Card>
        <SectionHeader title="Practice by Domain" subtitle="Immediate feedback for focused learning." />
      </Card>

      <Card>
        <SectionHeader title="Domain" subtitle="Choose one domain for this practice session." />
        <View style={styles.list}>
          {domainCounts.map((item) => (
            <Button
              disabled={item.count === 0}
              key={item.domain}
              onPress={() => setSelectedDomain(item.domain)}
              variant={selectedDomain === item.domain ? "primary" : "secondary"}
            >
              {getDomainLabel(item.domain)} ({item.count})
            </Button>
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Question Count" />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
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
    color: colors.light.textMuted
  }
});
