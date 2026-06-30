import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  IconTile,
  ListRow,
  Screen,
  SectionHeader,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDefinitions,
  type TrackDefinition,
  type TrackId,
} from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { getActiveTrackId, saveActiveTrackId } from "../../storage";
import { colors, spacing, typography } from "../../theme";

type SelectTrackScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.SELECT_TRACK
>;

export function SelectTrackScreen({ navigation }: SelectTrackScreenProps) {
  const [activeTrackId, setActiveTrackId] = useState<TrackId>(CLOUD_CERTIFICATION_TRACK_ID);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadActiveTrack() {
        const savedTrackId = await getActiveTrackId();

        if (isActive) {
          setActiveTrackId(savedTrackId);
        }
      }

      void loadActiveTrack();

      return () => {
        isActive = false;
      };
    }, []),
  );

  async function selectTrack(track: TrackDefinition) {
    if (track.status !== "active") {
      return;
    }

    await saveActiveTrackId(track.id);
    navigation.navigate(ROUTES.HOME);
  }

  return (
    <Screen>
      <View style={styles.intro}>
        <Text style={styles.title}>Choose track</Text>
        <Text style={styles.subtitle}>
          Select the context for your next focused practice session.
        </Text>
      </View>

      <View style={styles.trackList}>
        {getTrackDefinitions().map((track) => {
          const isActive = track.id === activeTrackId;
          const isAvailable = track.status === "active";

          return (
            <Card key={track.id} style={isActive ? styles.activeTrackCard : undefined}>
              <SectionHeader
                title={track.title}
                subtitle={track.description}
                action={
                  <Badge
                    label={isAvailable ? (isActive ? "Current" : "Available") : "Draft"}
                    tone={isAvailable ? "info" : "warning"}
                  />
                }
              />
              <ListRow
                detail={track.subtitle}
                leading={
                  <IconTile
                    name={track.id === CLOUD_CERTIFICATION_TRACK_ID ? "cloud" : "route"}
                    tone={track.id === CLOUD_CERTIFICATION_TRACK_ID ? "info" : "primary"}
                  />
                }
                title={isAvailable ? "Ready for focused practice" : "Not available in this build"}
              />
              <Button
                disabled={!isAvailable}
                onPress={() => void selectTrack(track)}
                variant={isActive ? "secondary" : "primary"}
              >
                {isActive ? "Keep focus" : isAvailable ? "Change focus" : "Unavailable"}
              </Button>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  trackList: {
    gap: spacing.md,
  },
  activeTrackCard: {
    borderColor: colors.dark.primary,
  },
});
