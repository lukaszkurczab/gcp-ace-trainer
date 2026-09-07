import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text } from "react-native";

import { Screen, ScreenHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { termsOfService } from "../../legal/termsOfService";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { typography, type AppColors } from "../../theme";

type TermsOfServiceScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.TERMS_OF_SERVICE>;

export function TermsOfServiceScreen({ navigation }: TermsOfServiceScreenProps) {
  const { locale } = useAppPreferences();
  const styles = useThemedStyles(createStyles);

  return (
    <Screen ambient={false} edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context="Patternly" title={locale === "pl" ? "Warunki korzystania" : "Terms of Service"} />
      <Text maxFontSizeMultiplier={2} selectable style={styles.document} testID="terms-of-service-document">
        {termsOfService[locale]}
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
