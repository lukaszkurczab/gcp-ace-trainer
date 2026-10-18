const { withAndroidManifest, withAppBuildGradle, withMainApplication } = require("expo/config-plugins");

module.exports = function withAndroidClockProbe(config) {
  const runId = process.env.EXPO_PUBLIC_PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(runId ?? "")
    || process.env.EAS_BUILD_PLATFORM !== "android" || process.env.PATTERNLY_RUNTIME_MODE !== "sandbox" || process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE !== "sandbox") throw Error("android_clock_probe_build_rejected");
  // Private signed diagnostic APK: disable OTA so its frozen bundle is executed.
  config.updates = { ...config.updates, enabled: false, checkAutomatically: "NEVER" };
  config.runtimeVersion = `android-clock-probe-${runId}`;
  config = withAppBuildGradle(config, mod => {
    const marker = "        release {";
    if (mod.modResults.language !== "groovy" || mod.modResults.contents.split(marker).length !== 2) throw Error("android_clock_probe_gradle_invalid");
    mod.modResults.contents = mod.modResults.contents.replace(marker, marker + "\n            debuggable true");
    return mod;
  });
  config = withMainApplication(config, mod => {
    const marker = "context = applicationContext,";
    if (mod.modResults.language !== "kt" || mod.modResults.contents.split(marker).length !== 2) throw Error("android_clock_probe_host_invalid");
    mod.modResults.contents = mod.modResults.contents.replace(marker, marker + "\n      useDevSupport = false,");
    return mod;
  });
  return withAndroidManifest(config, mod => {
    const applications = mod.modResults.manifest.application;
    if (applications?.length !== 1) throw Error("android_clock_probe_application_invalid");
    applications[0].$["android:debuggable"] = "true";
    return mod;
  });
};
