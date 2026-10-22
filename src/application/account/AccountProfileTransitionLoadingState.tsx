import { useTranslation } from "react-i18next";

import { LoadingState } from "../../components";

export function AccountProfileTransitionLoadingState() {
  const { t } = useTranslation("account");
  return <LoadingState testID="account-profile-transition-loading" title={t("profileTransitionTitle")} />;
}
