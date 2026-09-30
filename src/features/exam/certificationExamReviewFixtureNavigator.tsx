import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, NavigationIndependentTree, type Theme } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { spacing, typography } from "../../theme";
import { ExamReviewScreen } from "./ExamReviewScreen";
import { ResultScreen } from "./ResultScreen";
import { CertificationPracticeFeedbackPreview } from "./CertificationPracticeFeedbackPreview";
import { CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID, CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID, type CertificationExamReviewFixtureLaunch } from "./certificationExamReviewFixtureCommand";
import type { CertificationExamReviewFixtureRuntime } from "./certificationExamReviewFixtureRuntime";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function CertificationExamReviewFixtureNavigator({
  launch,
  navigationTheme,
  onExit,
  runtime,
}: Readonly<{
  launch: CertificationExamReviewFixtureLaunch;
  navigationTheme: Theme;
  onExit: () => void;
  runtime: CertificationExamReviewFixtureRuntime;
}>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const [sourceTrace, setSourceTrace] = useState(runtime.getSourceTrace());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const loadPreviews = useCallback(() => runtime.readPracticePreviews(CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID), [runtime]);
  const openSource = useCallback(async (url: string) => {
    try { return await runtime.openSource(url); }
    finally { setSourceTrace(runtime.getSourceTrace()); }
  }, [runtime]);
  if (launch.scenario === "practice-answer-matrix" && previewIndex !== null) {
    return <CertificationPracticeFeedbackPreview
      index={previewIndex}
      loadPreviews={loadPreviews}
      onBackToResults={() => setPreviewIndex(null)}
      onExit={onExit}
      onNext={() => setPreviewIndex((index) => Math.min(4, (index ?? 0) + 1))}
      onPrevious={() => setPreviewIndex((index) => Math.max(0, (index ?? 0) - 1))}
    />;
  }
  const practiceNotice = launch.scenario === "practice-answer-matrix";
  const fixtureNotice = <View style={[styles.notice, practiceNotice ? styles.practiceNotice : null]} testID="patternly:ui12:fixture:notice">
    <View style={[styles.noticeBody, practiceNotice ? styles.practiceNoticeBody : null]}>
      <Text maxFontSizeMultiplier={2} style={styles.noticeText} testID="patternly:ui12:fixture:label">Local read-only fixture · in memory; no saved result</Text>
      {sourceTrace.count > 0 ? <><Text maxFontSizeMultiplier={2} style={styles.traceText} testID={`patternly:ui12:source-count:${sourceTrace.count}`}>Source open attempt {sourceTrace.count}</Text><Text maxFontSizeMultiplier={2} style={styles.traceText} testID="patternly:ui12:source-url">{sourceTrace.url}</Text></> : null}
    </View>
    {practiceNotice ? <Button onPress={() => setPreviewIndex(0)} style={styles.practiceNoticeButton} testID="patternly:aud15:practice-preview:open" variant="secondary">Preview answer feedback</Button> : null}
    <Button onPress={onExit} style={practiceNotice ? styles.practiceNoticeButton : undefined} testID="patternly:ui12:fixture:exit" variant="ghost">Exit fixture</Button>
  </View>;

  return (
    <NavigationIndependentTree>
      <NavigationContainer key={launch.launchId} theme={navigationTheme}>
        <Stack.Navigator initialRouteName={ROUTES.RESULT} screenOptions={{ contentStyle: { backgroundColor: navigationTheme.colors.background }, headerShown: false }}>
          <Stack.Screen name={ROUTES.RESULT} options={{ headerShown: true, title: t("Result") }} initialParams={{ sessionId: launch.scenario === "practice-answer-matrix" ? CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID : CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID }}>
            {(screenProps) => <ResultScreen {...screenProps} fixtureNotice={fixtureNotice} onFixtureExit={onExit} readSummary={runtime.readSummary} />}
          </Stack.Screen>
          <Stack.Screen name={ROUTES.EXAM_REVIEW}>
            {(screenProps) => <ExamReviewScreen {...screenProps} fixtureNotice={fixtureNotice} openSource={openSource} readReview={runtime.readReview} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  notice: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: spacing.sm, justifyContent: "space-between", marginBottom: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  noticeBody: { flex: 1, gap: spacing.xs },
  noticeText: { ...typography.caption, color: palette.textSecondary },
  practiceNotice: { alignItems: "stretch", flexDirection: "column" },
  practiceNoticeBody: { flex: 0, alignSelf: "stretch" },
  practiceNoticeButton: { alignSelf: "stretch" },
  traceText: { ...typography.caption, color: palette.textSecondary },
});
