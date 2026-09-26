import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen, ScreenHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { getLegalDocument } from "../../legal/legalDocumentMap";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { typography, type AppColors } from "../../theme";

type TermsOfServiceScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.TERMS_OF_SERVICE>;

export function TermsOfServiceScreen({ navigation }: TermsOfServiceScreenProps) {
  const { locale } = useAppPreferences();
  const document = getLegalDocument(locale, "termsOfService");
  const { t } = useTranslation("account");
  const { t: tLegal } = useTranslation("legal");
  const styles = useThemedStyles(createStyles);

  return (
    <Screen ambient={false} edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context="Patternly" title={t("termsOfService")} />
      <Text maxFontSizeMultiplier={2} selectable style={styles.document} testID="terms-of-service-document">
        {document.content ?? tLegal("documentUnavailable")}
      </Text>
      {document.status === "unapproved-test-only" ? (
        <Text accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.document} testID="terms-of-service-draft-warning">
          {tLegal("documentDraftWarning")}
        </Text>
      ) : null}
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  document: {
    ...typography.body,
    color: palette.textSecondary,
  },
});
