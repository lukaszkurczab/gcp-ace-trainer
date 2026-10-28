import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Screen } from "../../components/Screen";
import { AccountProfileTransitionLoadingState } from "../../application/account/AccountProfileTransitionLoadingState";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

export function ContentBootstrapLoadingSkeleton() {
  return <View style={{ flex: 1 }} testID="content-bootstrap-loading-skeleton"><AccountProfileTransitionLoadingState /></View>;
}
export function StartupLoadingSurface({ testID, contentSkeleton = false, center = false }: Readonly<{ testID?: string; contentSkeleton?: boolean; center?: boolean }>) {
  return <Screen edges={["top", "bottom"]} style={center ? { justifyContent: "center" } : undefined}><View style={{ flex: 1 }} testID={testID}>{contentSkeleton ? <ContentBootstrapLoadingSkeleton /> : <AccountProfileTransitionLoadingState />}</View></Screen>;
}
export function StartupUnavailableSurface({ title, description, onRetry, testID }: Readonly<{ title: string; description: string; onRetry: () => void; testID?: string }>) {
  const { t } = useTranslation("common");
  return <View style={{ flex: 1 }} testID={testID}><Screen><EmptyState descriptionTone="secondary" actionLabel={t("Try again")} description={description} onActionPress={onRetry} title={title} /></Screen></View>;
}
export function ProfileTransitionSurface({ onRetry }: Readonly<{ onRetry?: () => void }>) {
  const { t } = useTranslation("account");
  return <Screen>{onRetry ? <View style={{ flex: 1 }} testID="profile-transition-required"><AccountProfileTransitionLoadingState /></View> : <AccountProfileTransitionLoadingState />}{onRetry ? <Button onPress={onRetry} testID="profile-transition-retry">{t("profileTransitionRetry")}</Button> : null}</Screen>;
}
export function UnavailableActiveSurface({ error, confirming, pending, onCancel, onConfirm, onAsk, onRetry }: Readonly<{ error?: string; confirming: boolean; pending: boolean; onCancel: () => void; onConfirm: () => void; onAsk: () => void; onRetry: () => void }>) {
  const { t } = useTranslation("common");
  return <View style={{ flex: 1 }} testID={runtimeSelectors.content.unavailableActive()}><Screen>
    <EmptyState descriptionTone="secondary" description={error ?? t("An active session uses content that is no longer available. Abandon it to keep its saved facts and start a new session.")} title={t("Active session needs attention")} />
    {confirming ? <View style={{ gap: 12 }}>
      <Button onPress={onCancel} testID={runtimeSelectors.content.unavailableActiveCancel()} variant="secondary">{t("Cancel")}</Button>
      <Button loading={pending} onPress={onConfirm} testID={runtimeSelectors.content.unavailableActiveConfirm()} variant="destructive">{t("Abandon unavailable session")}</Button>
    </View> : <Button onPress={onAsk} testID={runtimeSelectors.content.unavailableActiveAbandon()} variant="destructive">{t("Abandon unavailable session")}</Button>}
    {!confirming ? <Button onPress={onRetry} testID={runtimeSelectors.content.unavailableActiveRetry()} variant="secondary">{t("Try again")}</Button> : null}
  </Screen></View>;
}
