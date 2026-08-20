import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Icon, IconTile, InfoBlock, ListRow, Screen, SettingsBottomSheet, SettingsGroup, type IconName } from "../../components";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";

export type InformationTopic = Readonly<{
  detailTitle: string;
  icon: IconName;
  paragraphs: readonly string[];
  summary: string;
  title: string;
}>;

export type InformationSection = Readonly<{
  title: string;
  topics: readonly InformationTopic[];
}>;

type SettingsInformationScreenProps = Readonly<{
  closeLabel: string;
  infoBody: string;
  infoTitle: string;
  sections: readonly InformationSection[];
}>;

export function SettingsInformationScreen({ closeLabel, infoBody, infoTitle, sections }: SettingsInformationScreenProps) {
  const styles = useThemedStyles(createStyles);
  const [activeTopic, setActiveTopic] = useState<InformationTopic | null>(null);

  return (
    <Screen>
      <InfoBlock body={infoBody} icon={<Icon name="shield-check" size={18} />} title={infoTitle} />
      {sections.map((section) => (
        <SettingsGroup key={section.title} title={section.title}>
          {section.topics.map((topic) => (
            <ListRow
              detail={topic.summary}
              key={topic.title}
              leading={<IconTile name={topic.icon} size={32} tone="settings" />}
              onPress={() => setActiveTopic(topic)}
              title={topic.title}
              variant="grouped"
            />
          ))}
        </SettingsGroup>
      ))}
      <SettingsBottomSheet
        closeLabel={closeLabel}
        intro={activeTopic?.summary ?? ""}
        onClose={() => setActiveTopic(null)}
        title={activeTopic?.detailTitle ?? ""}
        visible={activeTopic !== null}
      >
        <View style={styles.detail}>
          {activeTopic?.paragraphs.map((paragraph) => <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
        </View>
      </SettingsBottomSheet>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  detail: { gap: spacing.md },
  paragraph: { ...typography.small, color: palette.textSecondary },
});
