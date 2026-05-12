import { Alert, StyleSheet, Text, View } from "react-native";

import { Button, Card, Screen, SectionHeader } from "../../components";
import { EXAM_DURATION_MINUTES, EXAM_QUESTION_COUNT, STORAGE_KEYS, TRAINING_PASS_THRESHOLD } from "../../constants";
import {
  clearActiveExamSession,
  clearAttempts,
  clearPracticeHistory,
  clearQuestions,
  removeLocalValue
} from "../../storage";
import { colors, spacing, typography } from "../../theme";

export function SettingsScreen() {
  function confirmAction(title: string, message: string, action: () => Promise<void>) {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          void action();
        }
      }
    ]);
  }

  function clearActiveExam() {
    confirmAction("Clear active exam session?", "This removes only the in-progress exam. Completed attempts and questions stay saved.", async () => {
      await clearActiveExamSession();
    });
  }

  function clearQuestionBank() {
    confirmAction(
      "Clear question bank?",
      "This deletes all imported questions and also clears any active exam that depends on them. Attempts and practice history stay saved.",
      async () => {
        await clearQuestions();
        await clearActiveExamSession();
      }
    );
  }

  function clearAttemptHistory() {
    confirmAction("Clear attempt history?", "This deletes all completed exam attempts and answer-review snapshots.", async () => {
      await clearAttempts();
    });
  }

  function clearPractice() {
    confirmAction("Clear practice history?", "This deletes all saved practice answer records used by analytics.", async () => {
      await clearPracticeHistory();
    });
  }

  function clearAllLocalData() {
    confirmAction(
      "Clear all local data?",
      "This deletes imported questions, active exam session, completed attempts, practice history, review marks, and local settings.",
      async () => {
        await Promise.all([
          clearActiveExamSession(),
          clearQuestions(),
          clearAttempts(),
          clearPracticeHistory(),
          removeLocalValue(STORAGE_KEYS.QUESTION_REVIEW_STATE),
          removeLocalValue(STORAGE_KEYS.SETTINGS)
        ]);
      }
    );
  }

  return (
    <Screen>
      <Card>
        <SectionHeader title="Settings" subtitle="Local study configuration and data management." />
      </Card>

      <Card>
        <SectionHeader title="Exam Settings" subtitle="Training settings for local practice only." />
        <SettingRow label="Exam questions" value={String(EXAM_QUESTION_COUNT)} />
        <SettingRow label="Time limit" value={`${EXAM_DURATION_MINUTES} minutes`} />
        <SettingRow label="Training pass threshold" value={`${TRAINING_PASS_THRESHOLD}%`} />
        <Text style={styles.note}>These are training settings and are not official Google exam scoring.</Text>
      </Card>

      <Card>
        <SectionHeader title="Data Management" subtitle="All data is stored locally on this device." />
        <View style={styles.actionList}>
          <Button variant="secondary" onPress={clearActiveExam}>
            Clear Active Exam Session
          </Button>
          <Button variant="secondary" onPress={clearQuestionBank}>
            Clear Question Bank
          </Button>
          <Button variant="secondary" onPress={clearAttemptHistory}>
            Clear Attempt History
          </Button>
          <Button variant="secondary" onPress={clearPractice}>
            Clear Practice History
          </Button>
          <Button onPress={clearAllLocalData}>Clear All Local Data</Button>
        </View>
      </Card>

      <Card>
        <SectionHeader title="About" />
        <View style={styles.aboutList}>
          <Text style={styles.aboutTitle}>GCP ACE Trainer</Text>
          <Text style={styles.aboutText}>Local-only study tool.</Text>
          <Text style={styles.aboutText}>No backend, no account, and no network sync.</Text>
          <Text style={styles.aboutText}>Questions are user-provided through local JSON import.</Text>
          <Text style={styles.aboutText}>This app is not affiliated with Google.</Text>
          <Text style={styles.aboutText}>Theme tokens are dark-ready; the app currently uses the light theme.</Text>
        </View>
      </Card>
    </Screen>
  );
}

type SettingRowProps = {
  label: string;
  value: string;
};

function SettingRow({ label, value }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    gap: spacing.xs
  },
  settingLabel: {
    ...typography.caption,
    color: colors.light.textMuted
  },
  settingValue: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  note: {
    ...typography.body,
    color: colors.light.warning
  },
  actionList: {
    gap: spacing.md
  },
  aboutList: {
    gap: spacing.sm
  },
  aboutTitle: {
    ...typography.heading,
    color: colors.light.text
  },
  aboutText: {
    ...typography.body,
    color: colors.light.textMuted
  }
});
