import { useTranslation } from "react-i18next";

import { LoadingState } from "../../components/LoadingState";

export function AccountProfileTransitionLoadingState() {
  const { t } = useTranslation("common");
  return <LoadingState showLogo testID="account-profile-transition-loading" title={t("Preparing Patternly")} />;
}
