import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Card,
  IconTile,
  ListRow,
  SectionHeader,
  SettingsGroup,
} from "../../../components";
import type { TrackDefinition } from "../../../domain";
import type { LocalStorageIssue } from "../../../storage";
import { colors, spacing, typography } from "../../../theme";

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
      <Card testID="settings-screen" variant="tonal" style={styles.hero}>
        <SectionHeader
          title="Settings"
          subtitle="Manage local-first learning controls and data safety."
          action={
            <Badge
              label={latestStorageIssue ? "Storage issue" : activeTrack.shortTitle}
              tone={latestStorageIssue ? "warning" : "info"}
            />
          }
        />
        <View style={styles.localProfile}>
          <IconTile name="cloud" size={56} tone="primary" />
          <View style={styles.localProfileCopy}>
            <Text style={styles.profileTitle}>Patternly local workspace</Text>
            <Text style={styles.profileSubtitle}>{activeTrack.title}</Text>
          </View>
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
          title="Active track"
          trailing={<Badge label={activeTrack.shortTitle} tone="info" />}
          variant="grouped"
        />
      </SettingsGroup>

      <SettingsGroup title="Data and privacy">
        <ListRow
          detail="No account, backend, or sync in MVP."
          leading={<IconTile name="database" tone="info" />}
          title="Local-only data"
          variant="grouped"
        />
        <ListRow
          detail="Google and LeetCode references are independent study context only."
          leading={<IconTile name="shield-check" tone="muted" />}
          title="Legal safety"
          variant="grouped"
        />
        <ListRow
          detail="Deletes local progress and local question overrides."
          leading={<IconTile name="trash" tone="danger" />}
          onPress={onClearAllLocalData}
          title="Clear all local data"
          trailing={<Badge label="Destructive" tone="danger" />}
          variant="grouped"
        />
      </SettingsGroup>
    </>
  );
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
