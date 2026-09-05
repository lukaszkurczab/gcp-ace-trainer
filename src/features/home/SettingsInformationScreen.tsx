import { useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Icon, IconTile, InfoBlock, ListRow, Screen, ScreenHeader, SettingsBottomSheet, SettingsGroup, type IconName } from "../../components";
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

type InformationTopicSelection = Readonly<{
  sectionIndex: number;
  topicIndex: number;
}>;

type SettingsInformationScreenProps = Readonly<{
  closeLabel: string;
  infoBody: string;
  infoTitle: string;
  supplementalContent?: ReactNode;
  screenHeader?: Readonly<{ context: string; onBack: () => void; title: string }>;
  sections: readonly InformationSection[];
}>;

export function SettingsInformationScreen({ closeLabel, infoBody, infoTitle, screenHeader, sections, supplementalContent }: SettingsInformationScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppPreferences();
  const [activeTopicSelection, setActiveTopicSelection] = useState<InformationTopicSelection | null>(null);
  const activeTopic = activeTopicSelection === null
    ? null
    : sections[activeTopicSelection.sectionIndex]?.topics[activeTopicSelection.topicIndex] ?? null;

  return (
    <Screen edges={screenHeader ? ["top", "bottom"] : undefined}>
      {screenHeader ? (
        <ScreenHeader
          backAction={{ onPress: screenHeader.onBack }}
          context={screenHeader.context}
          contextTone="primary"
          title={screenHeader.title}
        />
      ) : null}
      <InfoBlock body={infoBody} icon={<Icon name="shield-check" size={18} />} title={infoTitle} />
      {sections.map((section, sectionIndex) => (
        <SettingsGroup key={`section-${sectionIndex}`} title={section.title}>
          {section.topics.map((topic, topicIndex) => (
            <ListRow
              detail={topic.summary}
              key={`${sectionIndex}-${topicIndex}`}
              leading={<IconTile name={topic.icon} size={32} tone="settings" />}
              onPress={() => setActiveTopicSelection({ sectionIndex, topicIndex })}
              title={topic.title}
              trailing={<Icon color={colors.listRow.icon} name="chevron-right" size={20} />}
              variant="grouped"
            />
          ))}
        </SettingsGroup>
      ))}
      {supplementalContent}
      <SettingsBottomSheet
        closeLabel={closeLabel}
        intro={activeTopic?.summary ?? ""}
        onClose={() => setActiveTopicSelection(null)}
        title={activeTopic?.detailTitle ?? ""}
        visible={activeTopic !== null}
      >
        <View style={styles.detail}>
          {activeTopic?.paragraphs.map((paragraph) => <Text key={paragraph} maxFontSizeMultiplier={2} style={styles.paragraph}>{paragraph}</Text>)}
        </View>
      </SettingsBottomSheet>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  detail: { gap: spacing.md },
  paragraph: { ...typography.small, color: palette.textSecondary },
});
