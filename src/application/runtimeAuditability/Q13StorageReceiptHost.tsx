import { useEffect, useRef, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { radius, spacing, typography } from "../../theme";
import { isPatternlySmokeRuntime } from "../../infrastructure/runtime/runtimeMode";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { usePatternlyAccount } from "../account/AccountSessionProvider";
import { decideQ13StorageReceiptCommand } from "./q13StorageReceiptCommand";
import { inspectQ13CapabilityProbe, type Q13CapabilityProbeReceipt } from "./q13StorageReceiptOwner";

type Q13ProbeState =
  | Readonly<{ kind: "closed" }>
  | Readonly<{ kind: "checking" }>
  | Readonly<{ kind: "observed"; receipt: Extract<Q13CapabilityProbeReceipt, { kind: "observed" }> }>
  | Readonly<{ kind: "unavailable" }>;

function enabledInThisRuntime(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && isPatternlySmokeRuntime();
}

export function Q13StorageReceiptHost() {
  const styles = useThemedStyles(createStyles);
  const account = usePatternlyAccount();
  const [state, setState] = useState<Q13ProbeState>({ kind: "closed" });
  const commandHandled = useRef(false);

  useEffect(() => {
    if (!enabledInThisRuntime()) return;
    let mounted = true;
    const handle = (url: string | null) => {
      if (!mounted || commandHandled.current) return;
      const decision = decideQ13StorageReceiptCommand(url, { development: __DEV__, smoke: isPatternlySmokeRuntime() });
      if (decision !== "inspect") return;
      commandHandled.current = true;
      setState({ kind: "checking" });
      void inspectQ13CapabilityProbe(account.inspectQ13ActorFence(), account.readCurrentPremiumAccess)
        .then((receipt) => {
          if (!mounted) return;
          setState(receipt.kind === "observed" ? { kind: "observed", receipt } : { kind: "unavailable" });
        })
        .catch(() => {
          if (mounted) setState({ kind: "unavailable" });
        });
    };

    const subscription = Linking.addEventListener("url", ({ url }) => handle(url));
    void Linking.getInitialURL().then(handle).catch(() => undefined);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [account]);

  if (state.kind === "closed") return null;
  const close = () => setState({ kind: "closed" });
  const storageStatus = state.kind === "checking"
      ? "checking"
      : state.kind === "unavailable"
        ? "unavailable"
        : state.receipt.storageReadiness.kind === "ready"
        ? `prepared; profiles ${state.receipt.storageReadiness.registeredProfileCount}; MMKV keys ${state.receipt.storageReadiness.physicalKeyCount}`
        : `unavailable (${state.receipt.storageReadiness.reason})`;
  const packageRootStatus = state.kind === "checking"
    ? "checking"
    : state.kind === "unavailable"
      ? "unavailable"
      : state.receipt.packageRoot.kind === "observed"
        ? state.receipt.packageRoot.exists ? "present" : "absent"
        : "unavailable";
  const inventory = state.kind === "observed" ? state.receipt.inventory : null;
  const packages = state.kind === "observed" ? state.receipt.packages : null;
  const actor = state.kind === "observed" ? state.receipt.actor : null;
  const secure = state.kind === "observed" ? state.receipt.secureStoreInventory : null;

  return (
    <Modal animationType="fade" onRequestClose={close} transparent visible>
      <View style={styles.backdrop}>
        <View accessibilityRole="summary" style={styles.card} testID={runtimeSelectors.q13.receiptRoot()}>
          <ScrollView contentContainerStyle={styles.receiptContent}>
            <Text accessibilityRole="header" style={styles.title}>Q13 read-only storage receipt</Text>
            <Text style={styles.row} testID={runtimeSelectors.q13.storageReadiness()}>{`Prepared storage: ${storageStatus}`}</Text>
            <Text style={styles.row} testID={runtimeSelectors.q13.packageRootReadiness()}>{`Node package directory: ${packageRootStatus}`}</Text>
            <Text style={styles.row} testID={runtimeSelectors.q13.inventory()}>{`Inventory: ${inventory?.kind === "observed" ? `${inventory.physicalKeyCount} physical keys; ${inventory.profileCount} registered profiles; SHA-256 ${inventory.physicalInventorySha256}` : `unavailable (${inventory?.reason ?? "not_observed"}); complete ${inventory?.complete === true}`}`}</Text>
            {inventory?.kind === "unavailable" && inventory.unclassifiedKeys ? (
              <View>
                <Text style={styles.row}>{`Unclassified entries: ${inventory.unclassifiedKeys.keyCount}`}</Text>
                {inventory.unclassifiedKeys.scopeCounts.filter((entry) => entry.count > 0).map((entry) => <Text key={entry.scope} style={styles.row}>{`${entry.scope}: ${entry.count}`}</Text>)}
                {inventory.unclassifiedKeys.fingerprints.map((entry, index) => <Text key={`${entry.scope}:${entry.keySha256}:${index}`} style={styles.row} testID={runtimeSelectors.q13.unclassifiedKey(index)}>{`${entry.scope}; key fingerprint ${entry.keySha256}`}</Text>)}
              </View>
            ) : null}
            {inventory?.profileInventories?.map((profile) => (
              <View key={profile.profileIdSha256}>
                <Text style={styles.row} testID={runtimeSelectors.q13.profileInventory(profile.profileIdSha256)}>{`Profile ${profile.profileIdSha256} (${profile.kind}): ${profile.keyCount} keys; SHA-256 ${profile.inventorySha256}`}</Text>
                {profile.categoryInventories.map((category) => <Text key={category.category} style={styles.row} testID={runtimeSelectors.q13.profileCategoryInventory(profile.profileIdSha256, category.category)}>{`${category.category}: ${category.keyCount} keys; SHA-256 ${category.inventorySha256}`}</Text>)}
              </View>
            ))}
            {inventory?.globalInventories?.map((global) => <Text key={global.category} style={styles.row} testID={runtimeSelectors.q13.globalInventory(global.category)}>{`Global ${global.category}: ${global.keyCount} keys; SHA-256 ${global.inventorySha256}`}</Text>)}
            <Text style={styles.row} testID={runtimeSelectors.q13.controlInventory()}>{`Profile control: ${inventory?.kind === "observed" && inventory.control?.kind === "observed" ? `${inventory.control.slotCount} exact slots; account-binding slots ${inventory.control.accountBindingState}; journal ${inventory.control.journalState}; logout global ${inventory.control.logoutGlobalStatus}; logout actor ${inventory.control.logoutActorStatus}; SHA-256 ${inventory.control.slotInventorySha256}` : inventory?.kind === "unavailable" ? `not assessed (storage inventory: ${inventory.reason ?? "unspecified"})` : "unavailable (control_inventory_unavailable)"}`}</Text>
            <Text style={styles.row} testID={runtimeSelectors.q13.secureControlInventory()}>{`Encrypted storage slots: ${inventory?.kind === "observed" && inventory.secureControl?.kind === "observed" ? `${inventory.secureControl.slotCount} known slots; key material present ${inventory.secureControl.keyMaterialPresentCount}; SHA-256 ${inventory.secureControl.inventorySha256}` : inventory?.kind === "unavailable" ? `not assessed (storage inventory: ${inventory.reason ?? "unspecified"})` : "unavailable (encrypted_control_unavailable)"}`}</Text>
            <Text style={styles.row} testID={runtimeSelectors.q13.packages()}>{`Packages: ${packages?.kind === "observed" ? `${packages.pointerCount} pointers; ${packages.retainedIdentityCount} retained identities; ${packages.physicalFileCount} files; ${packages.orphanFileCount} unreferenced; ${packages.stagingFileCount} staging; SHA-256 ${packages.physicalFileInventorySha256}` : packages ? `unavailable (${packages.reason})` : "unavailable"}`}</Text>
            <Text style={styles.row} testID={runtimeSelectors.q13.actor()}>{`Active session actor: ${actor?.kind ?? "unavailable"}${actor?.kind === "unavailable" ? ` (${actor.reason})` : ""}${actor?.kind === "ready" ? `; active sessions ${actor.activeSessionCount}; active answers ${actor.activeAnswerRecordCount}; SHA-256 ${actor.activeSessionSha256}; answers SHA-256 ${actor.activeAnswerRecordsSha256}` : ""}`}</Text>
            <Text style={styles.row} testID={runtimeSelectors.q13.secureStore()}>{`App-owned SecureStore: ${secure?.kind === "observed" ? `${secure.slotCount} exact slots; auth record ${secure.authUserAffinity}; dynamic Firebase namespace unavailable; SHA-256 ${secure.inventorySha256}` : `unavailable (${secure?.kind === "unavailable" ? secure.reason : "not_observed"})`}`}</Text>
            <Text style={styles.note}>Fingerprint inventory only; raw keys, profile IDs, answers and secret values are not shown. Full OS Keychain enumeration and session-resumption proof are unavailable.</Text>
            <Pressable accessibilityRole="button" onPress={close} style={styles.closeButton} testID={runtimeSelectors.q13.close()}>
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: palette.effects.scrim, flex: 1, justifyContent: "center", padding: spacing.xl },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, maxHeight: "88%", maxWidth: 440, padding: spacing.xl, width: "100%" },
  receiptContent: { gap: spacing.md },
  title: { ...typography.title, color: palette.textPrimary },
  row: { ...typography.body, color: palette.textSecondary },
  note: { ...typography.caption, color: palette.textMuted, lineHeight: 18 },
  closeButton: { alignItems: "center", alignSelf: "flex-end", backgroundColor: palette.effects.ghostPressed, borderRadius: radius.md, minHeight: 44, justifyContent: "center", minWidth: 84, paddingHorizontal: spacing.md },
  closeLabel: { ...typography.bodyStrong, color: palette.textPrimary },
});
