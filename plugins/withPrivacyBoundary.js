const { IOSConfig, withAndroidManifest, withDangerousMod, withFinalizedMod, withXcodeProject } = require("expo/config-plugins");
const { default: plist } = require("@expo/plist");
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const REMOVED_ANDROID_PERMISSIONS = [
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.VIBRATE",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.WAKE_LOCK",
  "com.google.android.c2dm.permission.RECEIVE",
  "com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE",
  "com.sec.android.provider.badge.permission.READ",
  "com.sec.android.provider.badge.permission.WRITE",
  "com.htc.launcher.permission.READ_SETTINGS",
  "com.htc.launcher.permission.UPDATE_SHORTCUT",
  "com.sonyericsson.home.permission.BROADCAST_BADGE",
  "com.sonymobile.home.permission.PROVIDER_INSERT_BADGE",
  "com.anddoes.launcher.permission.UPDATE_BADGE",
  "com.anddoes.launcher.permission.UPDATE_COUNT",
  "com.majeur.launcher.permission.UPDATE_BADGE",
  "com.huawei.android.launcher.permission.CHANGE_BADGE",
  "com.huawei.android.launcher.permission.READ_SETTINGS",
  "com.huawei.android.launcher.permission.WRITE_SETTINGS",
  "android.permission.READ_APP_BADGE",
  "com.oppo.launcher.permission.READ_SETTINGS",
  "com.oppo.launcher.permission.WRITE_SETTINGS",
  "me.everything.badger.permission.BADGE_COUNT_READ",
  "me.everything.badger.permission.BADGE_COUNT_WRITE",
];

const REQUIRED_ANDROID_PERMISSION = "android.permission.INTERNET";

const LEGACY_BACKUP_RULES = `<?xml version="1.0" encoding="utf-8"?>\n<full-backup-content>\n  <exclude domain="root" path="."/>\n</full-backup-content>\n`;
const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules>\n  <cloud-backup>\n    <exclude domain="root" path="."/>\n  </cloud-backup>\n  <device-transfer>\n    <exclude domain="root" path="."/>\n  </device-transfer>\n</data-extraction-rules>\n`;
const APP_FUNCTIONALITY_PURPOSE = "NSPrivacyCollectedDataTypePurposeAppFunctionality";
const ANALYTICS_PURPOSE = "NSPrivacyCollectedDataTypePurposeAnalytics";
const PRIVACY_INFO_XC_PRIVACY = Object.freeze({
  NSPrivacyAccessedAPITypes: [
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp", NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults", NSPrivacyAccessedAPITypeReasons: ["CA92.1", "1C8F.1", "C56D.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace", NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime", NSPrivacyAccessedAPITypeReasons: ["35F9.1"] },
  ],
  NSPrivacyCollectedDataTypes: [
    "Name",
    "EmailAddress",
    "UserID",
    "DeviceID",
    "OtherUserContent",
    "CustomerSupport",
    "ProductInteraction",
    "OtherDiagnosticData",
  ].map((suffix) => ({
    NSPrivacyCollectedDataType: `NSPrivacyCollectedDataType${suffix}`,
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: [APP_FUNCTIONALITY_PURPOSE],
  })).concat({
    NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePurchaseHistory",
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: [APP_FUNCTIONALITY_PURPOSE, ANALYTICS_PURPOSE],
  }),
  NSPrivacyTracking: false,
});

function privacyInfoXcPrivacy() {
  return plist.build(PRIVACY_INFO_XC_PRIVACY);
}

function withoutRemoteNotificationEntitlement(entitlements) {
  const { ["aps-environment"]: _remoteNotification, ...remaining } = entitlements;
  return remaining;
}

function withoutRemoteNotificationBackgroundMode(infoPlist) {
  if (!Array.isArray(infoPlist.UIBackgroundModes)) return infoPlist;
  const modes = infoPlist.UIBackgroundModes.filter((mode) => mode !== "remote-notification");
  if (modes.length === 0) {
    const { UIBackgroundModes: _remoteNotification, ...remaining } = infoPlist;
    return remaining;
  }
  return { ...infoPlist, UIBackgroundModes: modes };
}

function parsePlist(path) {
  return plist.parse(readFileSync(path, "utf8"));
}

function writePlist(path, value) {
  writeFileSync(path, plist.build(value));
}

function withIosPrivacyManifestResource(config) {
  return withXcodeProject(config, (nextConfig) => {
    const projectName = nextConfig.modRequest.projectName;
    const privacyFilePath = join(projectName, "PrivacyInfo.xcprivacy");
    if (!nextConfig.modResults.hasFile(privacyFilePath)) {
      nextConfig.modResults = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: privacyFilePath,
        groupName: projectName,
        isBuildFile: true,
        project: nextConfig.modResults,
      });
    }
    return nextConfig;
  });
}

function finalizeIosPrivacyBoundary(nextConfig) {
  const { modRequest } = nextConfig;
  const projectDirectory = join(modRequest.platformProjectRoot, modRequest.projectName);
  mkdirSync(projectDirectory, { recursive: true });
  writeFileSync(join(projectDirectory, "PrivacyInfo.xcprivacy"), privacyInfoXcPrivacy());

  const entitlementsPath = IOSConfig.Entitlements.getEntitlementsPath(modRequest.projectRoot);
  if (entitlementsPath && existsSync(entitlementsPath)) {
    const entitlements = parsePlist(entitlementsPath);
    const withoutRemoteNotification = withoutRemoteNotificationEntitlement(entitlements);
    if (entitlements["aps-environment"] !== undefined) writePlist(entitlementsPath, withoutRemoteNotification);
  }

  const infoPlistPath = IOSConfig.Paths.getInfoPlistPath(modRequest.projectRoot);
  if (existsSync(infoPlistPath)) {
    const infoPlist = parsePlist(infoPlistPath);
    const withoutRemoteNotification = withoutRemoteNotificationBackgroundMode(infoPlist);
    if (JSON.stringify(infoPlist) !== JSON.stringify(withoutRemoteNotification)) writePlist(infoPlistPath, withoutRemoteNotification);
  }
  return nextConfig;
}

function withAndroidBackupPolicy(config) {
  const manifest = config.modResults.manifest;
  manifest.$ = { ...manifest.$, "xmlns:tools": "http://schemas.android.com/tools" };
  manifest["uses-permission"] = [
    { $: { "android:name": REQUIRED_ANDROID_PERMISSION, "tools:node": "replace" } },
    ...REMOVED_ANDROID_PERMISSIONS.map((name) => ({ $: { "android:name": name, "tools:node": "remove" } })),
  ];
  manifest.queries = [{ $: { "tools:node": "remove" } }];
  const application = manifest.application?.[0];
  if (!application) throw new Error("Patternly Android manifest has no application element.");
  application.$ = {
    ...application.$,
    "android:allowBackup": "false",
    "android:dataExtractionRules": "@xml/data_extraction_rules",
    "android:fullBackupContent": "@xml/backup_rules",
  };
  return config;
}

function injectIosBackupPolicy(source) {
  if (source.includes("configureCanonicalStorageBackupPolicy()")) return source;
  const withImport = source.includes("import Foundation") ? source : `import Foundation\n${source}`;
  const launchStart = "  ) -> Bool {\n";
  const launchIndex = withImport.indexOf(launchStart, withImport.indexOf("didFinishLaunchingWithOptions"));
  if (launchIndex < 0) throw new Error("Patternly AppDelegate launch method was not found.");
  const helper = `  private func configureCanonicalStorageBackupPolicy() {\n    guard let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {\n      fatalError("Patternly cannot locate its canonical storage directory.")\n    }\n\n    var mmkvDirectory = documentsDirectory.appendingPathComponent("mmkv", isDirectory: true)\n    do {\n      try FileManager.default.createDirectory(at: mmkvDirectory, withIntermediateDirectories: true)\n      var values = URLResourceValues()\n      values.isExcludedFromBackup = true\n      try mmkvDirectory.setResourceValues(values)\n    } catch {\n      fatalError("Patternly cannot establish its local-storage backup policy.")\n    }\n  }\n\n`;
  const withLaunchCall = `${withImport.slice(0, launchIndex + launchStart.length)}    configureCanonicalStorageBackupPolicy()\n\n${withImport.slice(launchIndex + launchStart.length)}`;
  return withLaunchCall.replace("  // Linking API\n", `${helper}  // Linking API\n`);
}

function withPrivacyBoundary(config) {
  config = withAndroidManifest(config, withAndroidBackupPolicy);
  config = withDangerousMod(config, ["android", async (nextConfig) => {
    const xmlDirectory = join(nextConfig.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
    mkdirSync(xmlDirectory, { recursive: true });
    writeFileSync(join(xmlDirectory, "backup_rules.xml"), LEGACY_BACKUP_RULES);
    writeFileSync(join(xmlDirectory, "data_extraction_rules.xml"), DATA_EXTRACTION_RULES);
    return nextConfig;
  }]);
  config = withDangerousMod(config, ["ios", async (nextConfig) => {
    const appDelegatePath = join(nextConfig.modRequest.platformProjectRoot, "Patternly", "AppDelegate.swift");
    writeFileSync(appDelegatePath, injectIosBackupPolicy(readFileSync(appDelegatePath, "utf8")));
    return nextConfig;
  }]);
  config = withIosPrivacyManifestResource(config);
  return withFinalizedMod(config, ["ios", finalizeIosPrivacyBoundary]);
}

module.exports = withPrivacyBoundary;
module.exports.injectIosBackupPolicy = injectIosBackupPolicy;
module.exports.withAndroidBackupPolicy = withAndroidBackupPolicy;
module.exports.privacyInfoXcPrivacy = privacyInfoXcPrivacy;
module.exports.withoutRemoteNotificationEntitlement = withoutRemoteNotificationEntitlement;
module.exports.withoutRemoteNotificationBackgroundMode = withoutRemoteNotificationBackgroundMode;
