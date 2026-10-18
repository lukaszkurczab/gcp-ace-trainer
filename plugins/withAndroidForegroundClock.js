const { withAppBuildGradle, withMainApplication, withProjectBuildGradle, withSettingsGradle } = require("expo/config-plugins");

const MODULE_INCLUDE = "include ':patternly-foreground-clock'";
const MMKV_PREFAB_MARKER = "// patternly-foreground-clock: mmkv prefab headers";
const MMKV_PREFAB_SETUP = `${MMKV_PREFAB_MARKER}
subprojects { candidate ->
  if (candidate.name == 'react-native-mmkv') {
    candidate.plugins.withId('com.android.library') {
      candidate.android.buildFeatures.prefabPublishing = true
      candidate.android.prefab {
        NitroMmkv {
          headers new File(candidate.projectDir, '../nitrogen/generated/shared/c++').absolutePath
        }
      }
    }
  }
}`;

function insertOnce(contents, marker, addition, anchor, errorCode) {
  if (contents.includes(marker)) return contents;
  if (contents.split(anchor).length !== 2) throw Error(errorCode);
  return contents.replace(anchor, `${anchor}\n${addition}`);
}

function appendOnce(contents, marker, addition) {
  return contents.includes(marker) ? contents : `${contents.trimEnd()}\n\n${addition}\n`;
}

module.exports = function withAndroidForegroundClock(config) {
  config = withSettingsGradle(config, mod => {
    if (mod.modResults.language !== "groovy") throw Error("android_foreground_clock_settings_invalid");
    mod.modResults.contents = appendOnce(
      mod.modResults.contents,
      MODULE_INCLUDE,
      `${MODULE_INCLUDE}\nproject(':patternly-foreground-clock').projectDir = new File(rootProject.projectDir, '../native/foreground-clock/android')`,
    );
    return mod;
  });

  config = withProjectBuildGradle(config, mod => {
    if (mod.modResults.language !== "groovy") throw Error("android_foreground_clock_project_gradle_invalid");
    mod.modResults.contents = appendOnce(
      mod.modResults.contents,
      MMKV_PREFAB_MARKER,
      MMKV_PREFAB_SETUP,
    );
    return mod;
  });

  config = withMainApplication(config, mod => {
    const marker = "    super.onCreate()";
    const install = "    com.lkurczab.patternly.foregroundclock.ForegroundClockLifecycle.install(this)";
    if (mod.modResults.language !== "kt" || mod.modResults.contents.split(marker).length !== 2) {
      throw Error("android_foreground_clock_application_invalid");
    }
    if (!mod.modResults.contents.includes(install)) mod.modResults.contents = mod.modResults.contents.replace(marker, `${marker}\n${install}`);
    return mod;
  });

  return withAppBuildGradle(config, mod => {
    if (mod.modResults.language !== "groovy") throw Error("android_foreground_clock_app_gradle_invalid");
    mod.modResults.contents = insertOnce(
      mod.modResults.contents,
      "implementation project(':patternly-foreground-clock')",
      "implementation project(':patternly-foreground-clock')",
      "dependencies {",
      "android_foreground_clock_app_gradle_invalid",
    );
    return mod;
  });
};
