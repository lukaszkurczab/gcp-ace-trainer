import { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemedStyles } from "../../preferences";
import { spacing, type AppColors } from "../../theme";
import { approachPromptConstraints, approachPromptParagraphs, formatApproachExample, parseApproachChallengePrompt } from "./approachChallengePrompt";

export const ApproachChallengeQuestion = memo(function ApproachChallengeQuestion({ prompt, constraints }: Readonly<{ prompt: string; constraints: readonly string[] }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const document = useMemo(() => parseApproachChallengePrompt(prompt), [prompt]);
  const uniqueConstraints = useMemo(() => approachPromptConstraints(document, constraints), [document, constraints]);
  return <View style={styles.document}>
    {document.title ? <Text selectable accessibilityRole="header" style={styles.title}>{document.title}</Text> : null}
    {document.parts.filter(part => part.kind !== "constraints").map((part, index) => {
      if (part.kind === "paragraph") return <View key={index} style={styles.paragraphs}>{approachPromptParagraphs(part.text).map((text, paragraph) => <Text key={paragraph} selectable style={styles.body}>{text}</Text>)}</View>;
      const example = part.kind === "example" && part.label !== "Examples:" ? formatApproachExample(part.text) : null;
      return <View key={index} style={styles.section}>
        <Text accessibilityRole="header" style={styles.label}>{part.label}</Text>
        {example ? <>
          <View style={styles.example}>
            <Text selectable style={styles.code}><Text style={styles.codeLabel}>{t("Input")}: </Text>{example.input}</Text>
            <Text selectable style={styles.code}><Text style={styles.codeLabel}>{t("Output")}: </Text>{example.output}</Text>
          </View>
          {example.following ? <Text selectable style={styles.body}>{example.following}</Text> : null}
        </> : approachPromptParagraphs(part.text).map((text, paragraph) => <Text key={paragraph} selectable style={styles.exampleText}>{text}</Text>)}
      </View>;
    })}
    {uniqueConstraints.length ? <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.label}>{t("Constraints")}</Text>
      {uniqueConstraints.map((constraint, index) => <Text key={index} selectable style={styles.body}>• {constraint}</Text>)}
    </View> : null}
  </View>;
});

const createStyles = (colors: AppColors) => StyleSheet.create({
  document: { gap: spacing.lg }, paragraphs: { gap: spacing.md }, section: { gap: spacing.sm },
  title: { color: colors.textPrimary, fontSize: 20, lineHeight: 28, fontWeight: "600" },
  body: { color: colors.textPrimary, fontSize: 16, lineHeight: 24 },
  label: { color: colors.textPrimary, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  example: { backgroundColor: colors.surfaceInput, borderLeftColor: colors.borderStrong, borderLeftWidth: 2, padding: spacing.md, gap: spacing.sm },
  exampleText: { color: colors.textPrimary, fontSize: 15, lineHeight: 23 },
  code: { color: colors.textPrimary, fontSize: 14, lineHeight: 22, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  codeLabel: { fontWeight: "600" },
});
