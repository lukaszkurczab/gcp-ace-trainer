import { StyleSheet, View } from "react-native";

import {
  Badge,
  Card,
  ListRow,
  SectionHeader,
  SettingsGroup,
} from "../../../components";
import type { TrackDefinition } from "../../../domain";
import type { LocalStorageIssue } from "../../../storage";
import { colors } from "../../../theme";

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
      <Card testID="settings-screen" variant="tonal">
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
      </Card>

      {latestStorageIssue ? (
        <SettingsGroup title="Storage status">
          <ListRow
            detail={formatStorageIssue(latestStorageIssue)}
            leading={<View style={[styles.leadingMark, styles.leadingMarkWarning]} />}
            title="Local data degraded"
            trailing={<Badge label="Check" tone="warning" />}
          />
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="Learning preferences">
        <ListRow
          detail={activeTrack.title}
          leading={<View style={[styles.leadingMark, styles.leadingMarkPrimary]} />}
          title="Active track"
        />
      </SettingsGroup>

      <SettingsGroup title="Data and privacy">
        <ListRow
          detail="No account, backend, or sync in MVP."
          leading={<View style={[styles.leadingMark, styles.leadingMarkInfo]} />}
          title="Local-only data"
        />
        <ListRow
          detail="Google and LeetCode references are independent study context only."
          leading={<View style={[styles.leadingMark, styles.leadingMarkMuted]} />}
          title="Legal safety"
        />
        <ListRow
          detail="Deletes local progress and local question overrides."
          leading={<View style={[styles.leadingMark, styles.leadingMarkDanger]} />}
          onPress={onClearAllLocalData}
          title="Clear all local data"
          trailing={<Badge label="Destructive" tone="danger" />}
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
  leadingMark: {
    borderRadius: 8,
    height: 40,
    width: 6,
  },
  leadingMarkDanger: {
    backgroundColor: colors.dark.danger,
  },
  leadingMarkInfo: {
    backgroundColor: colors.dark.info,
  },
  leadingMarkMuted: {
    backgroundColor: colors.dark.textMuted,
  },
  leadingMarkPrimary: {
    backgroundColor: colors.dark.primary,
  },
  leadingMarkWarning: {
    backgroundColor: colors.dark.warning,
  },
});
