import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("passive runtime selectors are attached to visible content rather than containers with interactive descendants", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");
  const feedback = source("src/features/practice/PracticeFeedbackBlock.tsx");

  assert.match(home, /<Card variant="layered" style=\{styles\.decisionCard\}>/);
  assert.match(home, /<Text maxFontSizeMultiplier=\{2\} style=\{styles\.focusTitle\} testID=\{runtimeSelectors\.home\.trackCard\(activeTrack\.id\)\}>/);
  assert.match(home, /onPress=\{isRecommendationSettingsAction \? onOpenSettings : onChooseTopic\}/);
  assert.match(home, /t\(isRecommendationSettingsAction \? "Manage settings" : "Choose another topic"\)/);
  assert.match(home, /hasActiveSession \|\| isFirstUse \? null/);
  assert.match(home, /t\("Open Practice"\)/);
  assert.doesNotMatch(home, /<Card[^>]*testID=\{runtimeSelectors\.home\.trackCard/);
  assert.match(feedback, /<View style=\{styles\.reasonPanel\} testID=\{runtimeSelectors\.session\.result\(itemId, feedback\.result\)\}>/);
  assert.doesNotMatch(feedback, /styles\.result\b|formatFeedbackResult/);
});

test("active-session resume uses the single recommendation card and a separate continue control", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");

  assert.match(home, /const resumeSessionId = recommendation\?\.action\.kind === "resume_active_session" \|\| recommendation\?\.action\.kind === "resume_certification_practice"[\s\S]*?\? recommendation\.action\.sessionId[\s\S]*?: undefined;/);
  assert.doesNotMatch(home, /<Card[^>]*onPress=/);
  assert.equal((home.match(/<Card variant="layered" style=\{styles\.decisionCard\}>/g) ?? []).length, 1);
  for (const helper of ["card", "title", "status", "continue"] as const) {
    assert.equal((home.match(new RegExp(`runtimeSelectors\\.resume\\.${helper}\\(resumeSessionId\\)`, "g")) ?? []).length, 1);
  }
  assert.match(home, /<Button[\s\S]*?testID=\{resumeSessionId[\s\S]*?runtimeSelectors\.resume\.continue\(resumeSessionId\)[\s\S]*?<\/Button>/);
});

test("Home uses the approved compact presentation without changing recommendation ownership", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");

  assert.match(home, /trackIconContainer:[\s\S]*?height:\s*22/);
  assert.match(home, /decisionCard:[\s\S]*?borderColor:\s*palette\.navigation\.active[\s\S]*?borderRadius:\s*22/);
  assert.match(home, /decisionHeading:\s*\{[\s\S]*?alignItems:\s*"center"/);
  assert.match(home, /decisionIconTile:[\s\S]*?backgroundColor:\s*palette\.surfaceInput[\s\S]*?height:\s*44[\s\S]*?width:\s*44/);
  assert.match(home, /overviewSection:\s*\{[\s\S]*?gap:\s*2/);
  assert.match(home, /overview\.map\(\(metric, index\)[\s\S]*?index < overview\.length - 1 \? styles\.overviewRowDivider : null/);
  assert.match(home, /overviewRowDivider:[\s\S]*?borderBottomWidth:\s*1/);
  assert.match(home, /overviewTrack:\s*\{[\s\S]*?backgroundColor:\s*palette\.textPrimary/);
  assert.match(home, /overviewFill:\s*\{[\s\S]*?backgroundColor:\s*palette\.primary/);
  assert.match(home, /focusActionLabel:\s*\{[\s\S]*?color:\s*palette\.primary[\s\S]*?lineHeight:\s*18/);
  assert.match(home, /startButton:[\s\S]*?minHeight:\s*49/);
  assert.match(home, /activityCompletionLabel\(recentAttempt\.answeredAt, t\)/);
  assert.doesNotMatch(home, /attempt\.result\.kind/);
  assert.match(home, /<Button[\s\S]*?testID=\{resumeSessionId[\s\S]*?runtimeSelectors\.resume\.continue\(resumeSessionId\)/);
  assert.match(home, /<Text maxFontSizeMultiplier=\{2\} style=\{styles\.focusTitle\} testID=\{runtimeSelectors\.home\.trackCard\(activeTrack\.id\)\}>/);
  assert.match(home, /onChooseTopic/);
});

test("progress, simulation, and simulation summary selectors use canonical identities", () => {
  const progress = source("src/features/home/tabs/ProgressTab.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const summary = source("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx");

  assert.match(progress, /testID=\{runtimeSelectors\.progress\.node\(node\.id\)\}/);
  assert.match(simulation, /runtimeSelectors\.simulation\.root\(runtimeIdentity\.sessionId\)/);
  assert.match(simulation, /runtimeSelectors\.simulation\.question\(itemId\)/);
  assert.match(simulation, /runtimeSelectors\.simulation\.option\(itemId, optionId\)/);
  assert.doesNotMatch(simulation, /value:\$\{index \+ 1\}/);
  assert.match(simulation, /runtimeSelectors\.simulation\.action\(sessionId, action\.id\)/);
  assert.match(summary, /runtimeSelectors\.summary\.root\(sessionId\)/);
  assert.match(progress, /screenTitle:[\s\S]*?fontSize:\s*30[\s\S]*?lineHeight:\s*36/);
  assert.match(progress, /root:\s*\{\s*gap:\s*28\s*\}/);
  assert.match(progress, /<View style=\{\[styles\.weekSection,[\s\S]*?<Text maxFontSizeMultiplier=\{2\} style=\{styles\.sectionLabel\}>/);
  assert.match(progress, /weekSection:\s*\{\s*gap:\s*10\s*\}/);
  assert.match(progress, /!model\.hasData \? \([\s\S]*?No learning evidence yet[\s\S]*?Open Practice/);
  assert.match(progress, /emptyProgressScreenTitle:\s*\{[\s\S]*?fontSize:\s*24[\s\S]*?fontWeight:\s*"700"[\s\S]*?lineHeight:\s*29/);
  assert.match(progress, /emptyWeekSection:\s*\{\s*gap:\s*8\s*\}/);
  assert.match(progress, /emptyWeekCard:\s*\{[\s\S]*?gap:\s*4[\s\S]*?paddingHorizontal:\s*14[\s\S]*?paddingVertical:\s*12/);
  assert.match(progress, /model\.hasData \? <View style=\{styles\.miniBar\}/);
  assert.match(progress, /emptyProgressState:\s*\{[\s\S]*?paddingBottom:\s*40[\s\S]*?paddingTop:\s*40/);
  assert.match(progress, /emptyProgressIcon:\s*\{[\s\S]*?borderRadius:\s*20/);
  assert.match(progress, /emptyProgressAction:\s*\{[\s\S]*?backgroundColor:\s*palette\.success[\s\S]*?borderRadius:\s*radius\.xxl[\s\S]*?paddingHorizontal:\s*24[\s\S]*?paddingVertical:\s*12/);
  assert.match(progress, /emptyProgressActionLabel:\s*\{[\s\S]*?color:\s*palette\.textPrimary[\s\S]*?fontSize:\s*14/);
  assert.match(progress, /trackSelector:\s*\{[\s\S]*?backgroundColor:\s*palette\.surfaceInput/);
  assert.match(progress, /weekTitle:\s*\{[\s\S]*?fontSize:\s*14[\s\S]*?fontWeight:\s*"500"/);
  assert.match(progress, /miniBar:\s*\{[\s\S]*?backgroundColor:\s*palette\.surface[\s\S]*?height:\s*4/);
  assert.match(progress, /focusTitle:\s*\{[\s\S]*?fontSize:\s*16[\s\S]*?fontWeight:\s*"600"/);
  assert.match(progress, /focusStatus:\s*\{[\s\S]*?fontSize:\s*12[\s\S]*?fontWeight:\s*"500"[\s\S]*?lineHeight:\s*18/);
  assert.match(progress, /sectionLabel:\s*\{\s*color:\s*palette\.primary[\s\S]*?fontSize:\s*12/);
  assert.match(progress, /focusEvidenceDetail:\s*\{\s*color:\s*palette\.primary/);
  assert.match(progress, /attentionActionLabel:\s*\{\s*color:\s*palette\.primary[\s\S]*?fontSize:\s*13/);
  assert.match(progress, /focus \? \([\s\S]*?focus\.statusLabel[\s\S]*?focus\.practicedLabel[\s\S]*?\) : hasFocusEvidence/);
  assert.match(progress, /<Button labelStyle=\{styles\.focusActionLabel\}[\s\S]*?variant="ghost">/);
  assert.match(progress, /activityLink:\s*\{[\s\S]*?fontSize:\s*13[\s\S]*?fontWeight:\s*"600"[\s\S]*?lineHeight:\s*18/);
  assert.match(progress, /activityRow:\s*\{[\s\S]*?gap:\s*10[\s\S]*?paddingVertical:\s*spacing\.md/);
  assert.match(progress, /activityTitle:\s*\{[\s\S]*?fontSize:\s*14[\s\S]*?lineHeight:\s*18/);
  assert.match(progress, /attentionDetail:\s*\{[\s\S]*?fontSize:\s*13[\s\S]*?fontWeight:\s*"400"/);
  assert.match(progress, /attentionCard:[\s\S]*?borderWidth:\s*0[\s\S]*?borderRadius:\s*14/);
  assert.match(progress, /attentionTitleRow:\s*\{[\s\S]*?gap:\s*6/);
  assert.match(progress, /attentionDot:\s*\{[\s\S]*?height:\s*6[\s\S]*?width:\s*6/);
  assert.match(progress, /const focusActionLabel = model\.algorithmsProgress \? "Open Practice"/);
});
