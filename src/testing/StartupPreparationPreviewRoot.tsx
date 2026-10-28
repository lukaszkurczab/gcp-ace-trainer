import { useEffect, useMemo, useState } from "react";
import { Linking, Settings, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { AppPreferencesPresentationProvider, deriveAppPreferencesPresentation } from "../preferences/appPreferencesContext";
import { Screen } from "../components/Screen";
import { EncryptedStorageRecoverySurface } from "../content/application/EncryptedStorageRecoverySurface";
import { StartupLoadingSurface, StartupUnavailableSurface, ProfileTransitionSurface, UnavailableActiveSurface } from "../content/application/startupPreparationSurfaces";
import { HomeDecisionCard } from "../features/home/tabs/HomeDecisionCard";
import { runtimeSelectors } from "./runtimeSelectors";
import { createStartupPreviewActions } from "./startupPreparationPreviewReceipt";
import { createStartupPreviewRequestFence, parseStartupPreviewUrl, type StartupPreviewEntry, type StartupPreviewParameters } from "./startupPreparationPreview";

const RECEIPT = Symbol.for("patternly.startup-preview-receipt.v1");
/** Early isolated host: never mounts persisted preferences, profile, account or bootstrap owners. */
export default function StartupPreparationPreviewRoot({ entry }: Readonly<{ entry: StartupPreviewEntry }>) {
  const [parameters, setParameters] = useState<StartupPreviewParameters | null>(null);
  const requests = useMemo(() => createStartupPreviewRequestFence(), []);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const enabled = entry.kind === "preview" && typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke";
  const callbacks = useMemo(() => createStartupPreviewActions(), [revision]);
  const { fontScale } = useWindowDimensions();
  useEffect(() => {
    let active = true;
    const apply = (url: string | null) => {
      const attempt = requests.next();
      const next = parseStartupPreviewUrl(url, enabled);
      setReady(false); setParameters(null); setRevision(value => value + 1);
      if (!next) return;
      // Recovery reads native device fallback; only app-domain presentation overrides, never a canonical store.
      Settings.set({ AppleLanguages: [next.locale], AppleLocale: next.locale });
      void i18n.changeLanguage(next.locale).then(() => { if (active && requests.isCurrent(attempt)) { setParameters(next); setReady(true); } });
    };
    const subscription = Linking.addEventListener("url", ({ url }) => apply(url));
    return () => { active = false; requests.dispose(); subscription.remove(); };
  }, [enabled, requests]);
  useEffect(() => {
    if (!enabled) return;
    const read = () => Object.freeze({ schema: "patternly.startup-preview.v1", entry: entry.kind, ready, parameters, generation: requests.read(), fontScale, actions: callbacks.read() });
    Object.defineProperty(globalThis, RECEIPT, { configurable: true, enumerable: false, value: read });
    return () => { Reflect.deleteProperty(globalThis, RECEIPT); };
  }, [enabled, entry.kind, ready, parameters, fontScale, callbacks]);
  const value = useMemo(() => ({ ...deriveAppPreferencesPresentation(parameters?.theme ?? "light", parameters?.locale ?? "en", parameters?.theme ?? "light", parameters?.locale ?? "en"), ready: true,
    setAppearance: async () => undefined, setLanguage: async () => undefined }), [parameters]);
  return <SafeAreaProvider><AppPreferencesPresentationProvider value={value}><View style={{ flex: 1, backgroundColor: value.colors.background }}>
    {enabled && ready && parameters ? <PreviewScene key={revision} parameters={parameters} actions={callbacks.actions} /> : <Screen><Text testID="startup-preview-unavailable">Startup preview unavailable</Text></Screen>}
  </View></AppPreferencesPresentationProvider></SafeAreaProvider>;
}
function PreviewScene({ parameters, actions }: Readonly<{ parameters: StartupPreviewParameters; actions: ReturnType<typeof createStartupPreviewActions>["actions"] }>) {
  const { t } = useTranslation("common");
  const { t: tPlan } = useTranslation("learningPlan");
  const { fontScale } = useWindowDimensions();
  const { scene } = parameters;
  if (scene.startsWith("recovery-")) return <EncryptedStorageRecoverySurface
    canRetry={scene !== "recovery-retry-limit"} retryLimitReached={scene === "recovery-retry-limit"}
    status={scene === "recovery-removing" ? "removing" : scene === "recovery-error" ? "error" : scene === "recovery-success" ? "success" : "base"}
    onContinue={actions.continue} onRemove={actions.remove} onReturn={actions.return} onRetryBootstrap={actions.retry} onRemovingPresented={actions["removing-presented"]} />;
  if (scene === "profile-transition-materialized" || scene === "profile-transition-retry") return <ProfileTransitionSurface onRetry={scene === "profile-transition-retry" ? actions.retry : undefined} />;
  if (scene === "profile-unavailable" || scene === "content-blocking") return <StartupUnavailableSurface title={t(scene === "profile-unavailable" ? "Profile storage unavailable" : "Application unavailable")} description={t(scene === "profile-unavailable" ? "Local profile storage could not be prepared." : "Application bootstrap failed.")} onRetry={actions.retry} testID={scene === "content-blocking" ? runtimeSelectors.content.unavailable() : undefined} />;
  if (scene.startsWith("active-")) return <UnavailableActiveSurface confirming={scene === "active-confirm" || scene === "active-pending"} pending={scene === "active-pending"} error={scene === "active-error" ? t("The unavailable session could not be abandoned.") : undefined} onAsk={actions.ask} onCancel={actions.cancel} onConfirm={actions.confirm} onRetry={actions.retry} />;
  if (scene.startsWith("ready-resume-")) return <Screen edges={["top", "bottom"]}><HomeDecisionCard largeText={fontScale >= 1.3} stretchCopy={false} icon="cloud" muted={false} enabled title={t("Session in progress")} detail={`${t("Practice")} · ${tPlan(scene === "ready-resume-denied" ? "Premium access required" : "Premium access unavailable")}`} primaryLabel={t("Resume session")} onPrimary={actions.resume} headingTestID={runtimeSelectors.resume.card("startup-preview")} titleTestID={runtimeSelectors.resume.title("startup-preview")} detailTestID={runtimeSelectors.resume.status("startup-preview")} primaryTestID={runtimeSelectors.resume.continue("startup-preview")} /></Screen>;
  return <StartupLoadingSurface center={scene === "account-restoring"} testID={scene === "profile-loading" ? "profile-storage-preparing" : scene === "account-restoring" ? "account-session-restore-loading" : runtimeSelectors.content.preparing(scene.slice("content-".length))} contentSkeleton={scene.startsWith("content-")} />;
}
