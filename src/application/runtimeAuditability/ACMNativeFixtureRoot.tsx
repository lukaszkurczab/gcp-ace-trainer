import { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator, type NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppPreferencesProvider, useAppPreferences } from "../../preferences";
import { ApproachChallengeScreen } from "../../features/practice/ApproachChallengeScreen";
import { ApproachChallengeAccessProvider, type ApproachChallengeAccessState } from "../../features/practice/approachChallengeAccess";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation/types";
import { buildNavigationTheme } from "../../theme";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { bootstrapACMNativeFixtureApplication, type ApplicationBootstrapState } from "../bootstrap/applicationBootstrap";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { getTrainingLifecycleUseCases } from "../trainingLifecycle/applicationLifecycle";
import { createACMNativeFixtureForegroundClockOwner } from "../../infrastructure/storage/encryptedStorageNative";
import {
  activatePreparedProfile,
  closeActiveProfileStorage,
  isACMNativeFixtureStorageOwnerCold,
  prepareProfileStorage,
  setProfileStoragePreparationFactoryForTests,
  type KeyValueStorage,
} from "../../infrastructure/storage/mmkvClient";
import {
  deriveACMNativeFixtureProfileIdentity,
  createACMNativeFixtureManifest,
  createACMNativeFixtureStoreIds,
  isMatchingACMNativeFixtureManifest,
  inspectACMNativeFixtureStorageInventory,
  ACM_NATIVE_FIXTURE_MANIFEST_KEY,
  type ACMNativeFixtureEntry,
} from "./acmNativeFixtureProtocol";
import { commitProfileSelection, inspectExistingACMNativeFixtureGuest, openProfileStorageRouter, PROFILE_STORAGE_REGISTRY_CONTROL_KEYS, type ProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import { isACMNativeFixtureLifecycleOwnerCold } from "../trainingLifecycle/applicationLifecycle";
import { isACMNativeFixtureTimerOwnerCold } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

type FixtureReceipt = Readonly<{
  kind: "pending" | "ready" | "unavailable";
  stage: string;
  category?: string;
  bootstrap?: ApplicationBootstrapState;
}>;
type NativeMMKV = ReturnType<typeof import("react-native-mmkv").createMMKV>;
type FixtureStores = Readonly<{
  data: NativeMMKV;
  control: NativeMMKV;
  base: KeyValueStorage;
  controlPort: Readonly<{
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  }>;
  routerOwner: ReturnType<typeof createACMNativeFixtureForegroundClockOwner>;
}>;

const Stack = createNativeStackNavigator<RootStackParamList>();
let activeFixtureBoot: Promise<FixtureReceipt> | null = null;

/** Mounts the real ACM screen and application lifecycle over two fixture-owned MMKV stores. */
export default function ACMNativeFixtureRoot({ entry }: Readonly<{ entry: ACMNativeFixtureEntry }>) {
  const [receipt, setReceipt] = useState<FixtureReceipt>({ kind: "pending", stage: "preflight" });
  const [access, setAccess] = useState<ApproachChallengeAccessState>("denied");
  const accessRef = useRef(access);
  accessRef.current = access;

  useEffect(() => {
    let live = true;
    activeFixtureBoot ??= bootACMNativeFixture(entry, () => accessRef.current);
    void activeFixtureBoot.then((result) => { if (live) setReceipt(result); });
    return () => { live = false; };
  }, [entry]);

  if (receipt.kind === "pending") return <FixtureStatus receipt={receipt} />;
  if (receipt.kind !== "ready") return <FixtureStatus receipt={receipt} />;
  const initialRoute = receipt.bootstrap?.kind === "ready" && receipt.bootstrap.activeSessionId
    ? ROUTES.APPROACH_CHALLENGE : ROUTES.HOME;
  const accessPort = Object.freeze({ readCurrentPremiumAccess: () => access });
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <ApproachChallengeAccessProvider value={accessPort}>
          <ACMNativeFixtureNavigator initialRoute={initialRoute} access={access} onAccessChange={setAccess} />
        </ApproachChallengeAccessProvider>
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

function ACMNativeFixtureNavigator({ initialRoute, access, onAccessChange }: Readonly<{
  initialRoute: keyof RootStackParamList;
  access: ApproachChallengeAccessState;
  onAccessChange: (access: ApproachChallengeAccessState) => void;
}>) {
  const { colors, colorMode } = useAppPreferences();
  const navigationTheme = buildNavigationTheme(colors, colorMode);
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={colorMode === "dark" ? "light" : "dark"} />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name={ROUTES.HOME}>
          {(props) => <FixtureHub {...props} access={access} onAccessChange={onAccessChange} />}
        </Stack.Screen>
        <Stack.Screen name={ROUTES.PRACTICE_HUB}>
          {(props) => <FixtureHub {...props} access={access} onAccessChange={onAccessChange} />}
        </Stack.Screen>
        <Stack.Screen name={ROUTES.APPROACH_CHALLENGE}>
          {(props) => <ApproachChallengeScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

async function bootACMNativeFixture(entry: ACMNativeFixtureEntry, readAccess: () => ApproachChallengeAccessState): Promise<FixtureReceipt> {
  let stage = "preflight";
  let factoryInstalled = false;
  try {
    if ((require("react-native") as typeof import("react-native")).Platform.OS !== "ios") throw fixtureFailure("preflight", "platform_mismatch");
    if (!isACMNativeFixtureStorageOwnerCold(entry.runUUID)
      || !isACMNativeFixtureLifecycleOwnerCold(entry.runUUID)
      || !isACMNativeFixtureTimerOwnerCold(entry.runUUID)) throw fixtureFailure("preflight", "owner_not_cold");

    stage = "native_store_preflight";
    const ids = createACMNativeFixtureStoreIds(entry.runUUID);
    const profileIds = deriveACMNativeFixtureProfileIdentity(entry.runUUID);
    const inventory = inspectACMNativeFixtureStorageInventory({
      operation: entry.operation,
      dataStoreId: ids.dataStoreId,
      controlStoreId: ids.controlStoreId,
      ready: entry.storageInventoryReady,
      entries: entry.storageEntries,
    });
    if (inventory.kind !== "ready") throw fixtureFailure(stage, inventory.reason);

    // MMKV v4 `existsMMKV(id)` checks only its initialized default root. The native
    // module above instead inventories the configured custom path without opening it.
    const mmkv = require("react-native-mmkv") as typeof import("react-native-mmkv");
    const crypto = require("expo-crypto") as typeof import("expo-crypto");

    const key = sha256Utf8(`patternly.acm-native-fixture.mmkv-key.v1:${entry.runUUID.toLowerCase()}`).slice(0, 32);
    const control = mmkv.createMMKV({ id: ids.controlStoreId, path: entry.storagePath });
    const data = mmkv.createMMKV({ id: ids.dataStoreId, path: entry.storagePath, encryptionKey: key, encryptionType: "AES-256" });
    const routerOwner = createACMNativeFixtureForegroundClockOwner(data, () => crypto.randomUUID());
    const controlPort = Object.freeze({
      get: async (controlKey: string) => control.getString(controlKey) ?? null,
      set: async (controlKey: string, value: string) => { control.set(controlKey, value); },
      remove: async (controlKey: string) => { control.remove(controlKey); },
    });
    const stores: FixtureStores = Object.freeze({ data, control, base: routerOwner.base, controlPort, routerOwner });

    if (entry.operation === "create") {
      if (data.getAllKeys().length !== 0 || control.getAllKeys().length !== 0) throw fixtureFailure(stage, "create_namespace_not_empty");
      let router: ProfileStorageRouter | null = null;
      installPreparationFactory(stores, entry, (value) => { router = value; });
      factoryInstalled = true;
      stage = "profile_create";
      const profile = await prepareProfileStorage();
      if (!router || profile.id !== profileIds.localDatasetId || profile.kind !== "guest") throw fixtureFailure(stage, "profile_create_mismatch");
      const manifest = createACMNativeFixtureManifest({
        runUUID: entry.runUUID,
        dataStoreId: ids.dataStoreId,
        controlStoreId: ids.controlStoreId,
        profile,
      });
      await controlPort.set(ACM_NATIVE_FIXTURE_MANIFEST_KEY, JSON.stringify(manifest));
      if (await controlPort.get(ACM_NATIVE_FIXTURE_MANIFEST_KEY) !== JSON.stringify(manifest)) throw fixtureFailure(stage, "manifest_write_unverified");
    } else {
      stage = "resume_manifest_preflight";
      const allowedControlKeys = [ACM_NATIVE_FIXTURE_MANIFEST_KEY, ...PROFILE_STORAGE_REGISTRY_CONTROL_KEYS].sort();
      if (JSON.stringify([...control.getAllKeys()].sort()) !== JSON.stringify(allowedControlKeys)) throw fixtureFailure(stage, "control_namespace_mismatch");
      let manifestValue: unknown;
      try { manifestValue = JSON.parse(control.getString(ACM_NATIVE_FIXTURE_MANIFEST_KEY) ?? "null"); }
      catch { throw fixtureFailure(stage, "manifest_invalid"); }
      if (!isMatchingACMNativeFixtureManifest(manifestValue, { runUUID: entry.runUUID, ...ids })) throw fixtureFailure(stage, "manifest_mismatch");
      const expectedDataPrefix = `patternly:profile:v1:${profileIds.localDatasetId}:`;
      if (data.getAllKeys().some((physicalKey) => !physicalKey.startsWith(expectedDataPrefix))) throw fixtureFailure(stage, "data_namespace_mismatch");
      const controlBefore = snapshotMMKV(control);
      const dataBefore = snapshotMMKV(data);
      const inspection = await inspectExistingACMNativeFixtureGuest({
        base: routerOwner.base,
        control: controlPort,
        installationId: profileIds.installationId,
        localDatasetId: profileIds.localDatasetId,
        profileId: manifestValue.profile.profileId,
      });
      if (inspection.profile.id !== profileIds.localDatasetId || inspection.profile.kind !== "guest") throw fixtureFailure(stage, "persisted_guest_mismatch");
      let router: ProfileStorageRouter | null = null;
      installPreparationFactory(stores, entry, (value) => { router = value; });
      factoryInstalled = true;
      stage = "resume_router_preflight";
      const profile = await prepareProfileStorage();
      if (!router || profile.id !== manifestValue.profile.profileId || profile.kind !== "guest"
        || snapshotMMKV(control) !== controlBefore || snapshotMMKV(data) !== dataBefore) {
        throw fixtureFailure(stage, "resume_router_mutated_store");
      }
    }

    stage = "profile_activate";
    const profile = await prepareProfileStorage();
    activatePreparedProfile(profile.id, profile.kind);

    stage = "application_bootstrap";
    const admission = Object.freeze({ async authorize() { return readAccess() === "allowed" ? "allowed" as const : readAccess() === "denied" ? "denied" as const : "unavailable" as const; } });
    const bootstrap = await bootstrapACMNativeFixtureApplication(
      entry.runUUID,
      () => contentPackageRuntimeOwner.verifyBundledPackages(),
      async (sessionId) => {
        const session = await getTrainingLifecycleUseCases().resumeActiveSession();
        if (session.id !== sessionId) throw fixtureFailure("resume_active_session", "session_identity_mismatch");
        if (session.configurationSnapshot.timer === "countdownForeground" || session.configurationSnapshot.timer === "elapsedForeground") {
          await getForegroundSessionTimerFacade().restoreForResume(session);
        }
      },
      async () => { composeTrainingLifecycleUseCases({ packages: contentPackageRuntimeOwner, premiumSessionAdmission: admission }); },
      { repositories: { guestInstallationIdentity: Object.freeze({ async create() { return profileIds; } }) } },
    );
    if (bootstrap.kind !== "ready" && bootstrap.kind !== "home_ready_resume_unavailable") {
      throw fixtureFailure(stage, `bootstrap_${bootstrap.kind}`);
    }
    return Object.freeze({ kind: "ready", stage: "complete", bootstrap });
  } catch (error) {
    if (factoryInstalled) {
      try { setProfileStoragePreparationFactoryForTests(null); } catch { /* owner remains unavailable and the fixture never falls through */ }
    }
    try { closeActiveProfileStorage(); } catch { /* preserve the original safe error category */ }
    const failure = error as Error & { fixtureStage?: string; fixtureCategory?: string };
    return Object.freeze({ kind: "unavailable", stage: failure.fixtureStage ?? stage, category: failure.fixtureCategory ?? "runtime_unavailable" });
  }
}

function installPreparationFactory(stores: FixtureStores, entry: ACMNativeFixtureEntry, publishRouter: (router: ProfileStorageRouter) => void): void {
  const identity = Object.freeze({ async create() { return deriveACMNativeFixtureProfileIdentity(entry.runUUID); } });
  setProfileStoragePreparationFactoryForTests(async () => {
    let router = await openProfileStorageRouter(stores.base, stores.controlPort, { identity });
    if (entry.operation === "create") {
      await router.selectExistingGuest(router.profile.id);
      if (router.registry.generation === 1) {
        await commitProfileSelection(stores.controlPort, router.registry, router.profile.id);
        router = await openProfileStorageRouter(stores.base, stores.controlPort, { identity });
      }
    }
    publishRouter(router);
    return {
      base: stores.base,
      router,
      nativeForegroundClockPlatform: stores.routerOwner.nativeForegroundClockPlatform,
      claimForegroundClock: stores.routerOwner.claimForegroundClock,
    };
  });
}

function snapshotMMKV(store: NativeMMKV): string {
  return JSON.stringify([...store.getAllKeys()].sort().map((key) => [key, store.getString(key)]));
}

function fixtureFailure(stage: string, category: string): Error & { fixtureStage: string; fixtureCategory: string } {
  return Object.assign(new Error("acm_native_fixture_unavailable"), { fixtureStage: stage, fixtureCategory: category });
}

function FixtureStatus({ receipt }: Readonly<{ receipt: FixtureReceipt }>) {
  return <View accessibilityRole="summary" testID="acm-native-fixture-status" style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#0C1324" }}>
    <Text accessibilityLabel="ACM native fixture status" style={{ color: "#F6F8FB" }}>ACM native fixture: {receipt.kind}</Text>
    <Text testID="acm-native-fixture-stage" style={{ color: "#F6F8FB" }}>Stage: {receipt.stage}</Text>
    {receipt.category ? <Text testID="acm-native-fixture-category" style={{ color: "#F6F8FB" }}>Category: {receipt.category}</Text> : null}
    {receipt.bootstrap ? <Text testID="acm-native-fixture-bootstrap" style={{ color: "#F6F8FB" }}>Bootstrap: {receipt.bootstrap.kind}</Text> : null}
  </View>;
}

function FixtureHub(props: Readonly<{
  navigation: NativeStackNavigationProp<RootStackParamList>;
  access: ApproachChallengeAccessState;
  onAccessChange(value: ApproachChallengeAccessState): void;
}>) {
  const accessLabel = props.access === "allowed" ? "Premium" : props.access === "denied" ? "Free" : "Unavailable";
  return <View testID="acm-native-fixture-hub" style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#0C1324" }}>
    <Text accessibilityRole="header" style={{ color: "#F6F8FB", fontSize: 24 }}>ACM native fixture</Text>
    <Text accessibilityLabel={`Local access: ${accessLabel}`} style={{ color: "#F6F8FB" }}>Local access: {accessLabel}</Text>
    <View style={{ flexDirection: "row", gap: 12 }}>
      <AccessButton label="Free" selected={props.access === "denied"} onPress={() => props.onAccessChange("denied")} />
      <AccessButton label="Premium" selected={props.access === "allowed"} onPress={() => props.onAccessChange("allowed")} />
    </View>
    <AccessButton label="Open Approach Challenge" onPress={() => props.navigation.navigate(ROUTES.APPROACH_CHALLENGE)} />
  </View>;
}

function AccessButton(props: Readonly<{ label: string; selected?: boolean; onPress(): void }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: props.selected }} accessibilityLabel={props.label}
    onPress={props.onPress} style={{ minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, borderRadius: 10, backgroundColor: props.selected ? "#7DC8FF" : "#29354C" }}>
    <Text style={{ color: props.selected ? "#0C1324" : "#F6F8FB" }}>{props.label}</Text>
  </Pressable>;
}
