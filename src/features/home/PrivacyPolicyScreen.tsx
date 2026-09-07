import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text } from "react-native";

import { Screen, ScreenHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { privacyPolicy } from "../../legal/privacyPolicy";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { typography, type AppColors } from "../../theme";

type PrivacyPolicyScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRIVACY_POLICY>;

export function PrivacyPolicyScreen({ navigation }: PrivacyPolicyScreenProps) {
  const { locale } = useAppPreferences();
  const styles = useThemedStyles(createStyles);

  return (
    <Screen ambient={false} edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context="Patternly" title={locale === "pl" ? "Polityka prywatności" : "Privacy Policy"} />
      <Text maxFontSizeMultiplier={2} selectable style={styles.document} testID="privacy-policy-document">
        {privacyPolicy[locale]}
      </Text>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  document: {
    ...typography.body,
    color: palette.textSecondary,
  },
});
