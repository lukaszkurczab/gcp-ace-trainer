import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Card,
  IconTile,
  ListRow,
  SettingsGroup,
} from "../../../components";
import type { TrackDefinition } from "../../../domain";
import type { LocalStorageIssue } from "../../../storage";
import { colors, spacing, typography } from "../../../theme";
import { SETTINGS_ROWS } from "../shellModel";

type SettingsTabProps = {
  activeTrack: TrackDefinition;
  onClearAllLocalData: () => void;
  storageIssues: readonly LocalStorageIssue[];
};

export function SettingsTab({
  activeTrack,
  onClearAllLocalData,
  storageIssues,
}: SettingsTabProps) {
  const latestStorageIssue = storageIssues[0] ?? null;

  return (
    <>
      <View style={styles.pageIntro} testID="settings-screen">
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={styles.screenSubtitle}>
          Manage learning preferences and local data controls.
        </Text>
      </View>

      <Card variant="tonal" style={styles.hero}>
        <View style={styles.localProfile}>
          <IconTile name="cloud" size={56} tone="primary" />
          <View style={styles.localProfileCopy}>
            <Text style={styles.profileTitle}>Patternly local workspace</Text>
            <Text style={styles.profileSubtitle}>{activeTrack.title}</Text>
          </View>
          <Badge
            label={latestStorageIssue ? "Storage issue" : activeTrack.shortTitle}
            tone={latestStorageIssue ? "warning" : "info"}
          />
        </View>
      </Card>

      {latestStorageIssue ? (
        <SettingsGroup title="Storage status">
          <ListRow
            detail={formatStorageIssue(latestStorageIssue)}
            leading={<IconTile name="alert-triangle" tone="warning" />}
            title="Local data degraded"
            trailing={<Badge label="Check" tone="warning" />}
            variant="grouped"
          />
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="Learning preferences">
        <ListRow
          detail={activeTrack.title}
          leading={<IconTile name="route" tone="primary" />}
          title={getSettingsRowLabel("activeTracks")}
          trailing={<Badge label={activeTrack.shortTitle} tone="info" />}
          variant="grouped"
        />
        <ListRow
          detail="Chosen when starting each practice session."
          leading={<IconTile name="practice" tone="muted" />}
          title={getSettingsRowLabel("sessionLength")}
          trailing={<Badge label="Per session" tone="neutral" />}
          variant="grouped"
        />
        <ListRow
          detail="Available after review queue is verified."
          leading={<IconTile name="rotate-ccw" tone="warning" />}
          title={getSettingsRowLabel("reviewPriority")}
          trailing={<Badge label="Unavailable" tone="warning" />}
          variant="grouped"
        />
      </SettingsGroup>

      <SettingsGroup title="App preferences">
        <ListRow
          detail="Notifications are not implemented in this local build."
          leading={<IconTile name="settings" tone="muted" />}
          title={getSettingsRowLabel("notifications")}
          trailing={<Badge label="Unavailable" tone="neutral" />}
          variant="grouped"
        />
        <ListRow
          detail="Reminder scheduling is not connected yet."
          leading={<IconTile name="rotate-ccw" tone="muted" />}
          title={getSettingsRowLabel("dailyReminder")}
          trailing={<Badge label="Unavailable" tone="neutral" />}
          variant="grouped"
        />
        <ListRow
          detail="Dark-first Focus Lab style."
          leading={<IconTile name="settings" tone="primary" />}
          title={getSettingsRowLabel("appearance")}
          trailing={<Badge label="Dark" tone="info" />}
          variant="grouped"
        />
        <ListRow
          detail="Sound preferences are not implemented."
          leading={<IconTile name="settings" tone="muted" />}
          title={getSettingsRowLabel("soundEffects")}
          trailing={<Badge label="Unavailable" tone="neutral" />}
          variant="grouped"
        />
      </SettingsGroup>

      <SettingsGroup title="Data and privacy">
        <ListRow
          detail="No account, backend, or sync in MVP."
          leading={<IconTile name="database" tone="info" />}
          title={getSettingsRowLabel("localOnlyData")}
          variant="grouped"
        />
        <ListRow
          detail="Google and LeetCode references are independent study context only."
          leading={<IconTile name="shield-check" tone="muted" />}
          title={getSettingsRowLabel("legalSafety")}
          variant="grouped"
        />
        <ListRow
          detail="Clears legacy local history, overrides, review marks, and active sessions."
          leading={<IconTile name="trash" tone="danger" />}
          onPress={onClearAllLocalData}
          title={getSettingsRowLabel("clearLocalHistory")}
          trailing={<Badge label="Destructive" tone="danger" />}
          variant="grouped"
        />
      </SettingsGroup>

      <SettingsGroup title="Account and help">
        <ListRow
          detail="No auth or profile layer in this build."
          leading={<IconTile name="shield-check" tone="muted" />}
          title={getSettingsRowLabel("accountStatus")}
          trailing={<Badge label="Local" tone="neutral" />}
          variant="grouped"
        />
        <ListRow
          detail="Subscription management is not implemented."
          leading={<IconTile name="database" tone="muted" />}
          title={getSettingsRowLabel("subscription")}
          trailing={<Badge label="Unavailable" tone="neutral" />}
          variant="grouped"
        />
        <ListRow
          detail="Help and feedback are not connected in the local app."
          leading={<IconTile name="alert-triangle" tone="muted" />}
          title={getSettingsRowLabel("helpFeedback")}
          trailing={<Badge label="Unavailable" tone="neutral" />}
          variant="grouped"
        />
      </SettingsGroup>
    </>
  );
}

function getSettingsRowLabel(id: string): string {
  return SETTINGS_ROWS.find((row) => row.id === id)?.label ?? id;
}

function formatStorageIssue(issue: LocalStorageIssue): string {
  const action = {
    parse: "read",
    read: "read",
    remove: "clear",
    write: "save",
  }[issue.operation];

  return `Could not ${action} local data: ${issue.message}`;
}

const styles = StyleSheet.create({
  pageIntro: {
    gap: spacing.md,
  },
  screenTitle: {
    ...typography.heading,
    color: colors.dark.textPrimary,
  },
  screenSubtitle: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  hero: {
    gap: spacing.lg,
  },
  localProfile: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  localProfileCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  profileTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  profileSubtitle: {
    ...typography.caption,
    color: colors.dark.primary,
  },
});
