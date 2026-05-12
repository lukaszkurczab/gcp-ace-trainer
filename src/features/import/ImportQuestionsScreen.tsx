import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button, Card, ErrorMessage, MetricCard, Screen, SectionHeader, TextButton } from "../../components";
import { QuestionBankSummary } from "../questions";
import { colors, radius, spacing, typography } from "../../theme";
import { getQuestions, saveQuestions } from "../../storage";
import { getDomainLabel } from "../../utils";
import type { Question } from "../../types";
import { validateQuestionImport, type ImportMode, type QuestionImportValidationResult } from "./questionImport";

export function ImportQuestionsScreen() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ImportMode>("append");
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [validationResult, setValidationResult] = useState<QuestionImportValidationResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSavedQuestionsOnFocus() {
        const questions = await getQuestions();

        if (isActive) {
          setSavedQuestions(questions);
        }
      }

      void loadSavedQuestionsOnFocus();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function handleValidate() {
    const questions = await getQuestions();
    setSavedQuestions(questions);
    setValidationResult(validateQuestionImport(input, questions, mode));
    setStatusMessage(null);
  }

  async function handleImport() {
    if (!validationResult?.canImport) {
      return;
    }

    const nextQuestions = mode === "append" ? [...savedQuestions, ...validationResult.questions] : validationResult.questions;
    await saveQuestions(nextQuestions);
    setSavedQuestions(nextQuestions);
    setValidationResult(null);
    setInput("");
    setStatusMessage(`Imported ${validationResult.questions.length} question${validationResult.questions.length === 1 ? "" : "s"}.`);
  }

  function handleInputChange(value: string) {
    setInput(value);
    setValidationResult(null);
    setStatusMessage(null);
  }

  function handleModeChange(nextMode: ImportMode) {
    setMode(nextMode);
    setValidationResult(null);
    setStatusMessage(null);
  }

  return (
    <Screen>
      <Card>
        <SectionHeader title="Import Questions" subtitle="Paste a JSON array of questions." />
        <Text style={styles.bodyText}>
          Every question must include id, domain, difficulty, type, question, options, correctOptionIds, and explanation.
        </Text>
      </Card>

      <QuestionBankSummary questions={savedQuestions} />

      <Card>
        <SectionHeader title="JSON Input" subtitle="Use only local pasted JSON. No external sources are fetched." />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          onChangeText={handleInputChange}
          placeholder='[{"id":"sample-1","domain":"setup_environment",...}]'
          placeholderTextColor={colors.light.textMuted}
          spellCheck={false}
          style={styles.input}
          textAlignVertical="top"
          value={input}
        />
      </Card>

      <Card>
        <SectionHeader title="Import Mode" subtitle="Append keeps existing questions. Replace overwrites the local bank." />
        <View style={styles.modeRow}>
          <Button
            onPress={() => handleModeChange("append")}
            style={styles.modeButton}
            variant={mode === "append" ? "primary" : "secondary"}
          >
            Append
          </Button>
          <Button
            onPress={() => handleModeChange("replace")}
            style={styles.modeButton}
            variant={mode === "replace" ? "primary" : "secondary"}
          >
            Replace
          </Button>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button onPress={handleValidate}>Validate JSON</Button>
        <Button disabled={!validationResult?.canImport} onPress={handleImport}>
          Import Questions
        </Button>
        <TextButton onPress={() => handleInputChange("")}>Clear Input</TextButton>
      </View>

      {statusMessage ? (
        <Card>
          <Text style={styles.successText}>{statusMessage}</Text>
        </Card>
      ) : null}

      {validationResult ? <ValidationResultCard result={validationResult} /> : null}
    </Screen>
  );
}

type ValidationResultCardProps = {
  result: QuestionImportValidationResult;
};

function ValidationResultCard({ result }: ValidationResultCardProps) {
  return (
    <Card>
      <SectionHeader
        title="Validation Result"
        subtitle={result.canImport ? "Ready to import." : "Fix the issues before importing."}
      />

      {result.parseError ? <ErrorMessage message={result.parseError} /> : null}

      <View style={styles.resultGrid}>
        <ResultMetric label="Total parsed" value={result.totalParsedQuestions} />
        <ResultMetric label="Valid" value={result.validQuestions} />
        <ResultMetric label="Invalid" value={result.invalidQuestions} />
        <ResultMetric label="Duplicate ids" value={result.duplicateIds.length} />
      </View>

      <View style={styles.resultSection}>
        <Text style={styles.resultHeading}>Domain coverage</Text>
        {result.domainCoverage.map((item) => (
          <View key={item.domain} style={styles.domainRow}>
            <Text style={styles.domainLabel}>{getDomainLabel(item.domain)}</Text>
            <Text style={styles.domainCount}>
              {item.current}/{item.required}
              {item.missing > 0 ? ` · missing ${item.missing}` : ""}
            </Text>
          </View>
        ))}
      </View>

      <Text style={result.examReady ? styles.successText : styles.warningText}>
        Exam readiness: {result.examReady ? "ready" : "not ready"}
      </Text>

      {result.duplicateIds.length > 0 ? (
        <ErrorMessage message={`Duplicate ids: ${result.duplicateIds.join(", ")}`} />
      ) : null}

      {result.errors.length > 0 ? (
        <View style={styles.resultSection}>
          <Text style={styles.resultHeading}>Issues</Text>
          {result.errors.slice(0, 8).map((error) => (
            <Text key={error} style={styles.errorText}>
              {error}
            </Text>
          ))}
          {result.errors.length > 8 ? <Text style={styles.errorText}>And {result.errors.length - 8} more.</Text> : null}
        </View>
      ) : null}
    </Card>
  );
}

type ResultMetricProps = {
  label: string;
  value: number;
};

function ResultMetric({ label, value }: ResultMetricProps) {
  return <MetricCard label={label} value={value} />;
}

const styles = StyleSheet.create({
  bodyText: {
    ...typography.body,
    color: colors.light.textSecondary
  },
  input: {
    ...typography.body,
    backgroundColor: colors.light.elevatedSurface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.light.textPrimary,
    fontFamily: "Courier",
    minHeight: 240,
    padding: spacing.md
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  modeButton: {
    flex: 1
  },
  actions: {
    gap: spacing.md
  },
  successText: {
    ...typography.bodyStrong,
    color: colors.light.success
  },
  warningText: {
    ...typography.bodyStrong,
    color: colors.light.warning
  },
  resultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  resultSection: {
    gap: spacing.sm
  },
  resultHeading: {
    ...typography.bodyStrong,
    color: colors.light.textPrimary
  },
  domainRow: {
    gap: spacing.xs
  },
  domainLabel: {
    ...typography.bodyStrong,
    color: colors.light.textPrimary
  },
  domainCount: {
    ...typography.caption,
    color: colors.light.textSecondary
  },
  errorText: {
    ...typography.body,
    color: colors.light.danger
  }
});
