const { withFinalizedMod, IOSConfig } = require("expo/config-plugins");
const { readFileSync, writeFileSync } = require("node:fs");
const plist = require("@expo/plist").default;
const TEST_BUNDLE = "com.lkurczab.patternly.sec03";

// Only the disposable SEC03 app may drop provider callbacks. Registering the
// original Google scheme here could intercept the preserved app's sign-in.
module.exports = (config) => {
  if (config.ios?.bundleIdentifier !== TEST_BUNDLE || config.extra?.patternlyRuntime !== "smoke") {
    throw Error("sec03_isolated_config_required");
  }
  return withFinalizedMod(config, ["ios", async (result) => {
    const path = IOSConfig.Paths.getInfoPlistPath(result.modRequest.projectRoot);
    const info = plist.parse(readFileSync(path, "utf8"));
    info.CFBundleURLTypes = [{ CFBundleURLSchemes: [TEST_BUNDLE] }];
    writeFileSync(path, plist.build(info));
    return result;
  }]);
};
