const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const { assetExts, sourceExts, blockList } = config.resolver;
const localProfileEnvFiles = /^(?:\/|[A-Za-z]:[\\/])(?:.*[\\/])?\.env\.(?:smoke|sandbox)\.local$/;
const smokeRuntime = process.env.PATTERNLY_RUNTIME_MODE === "smoke";
const disableWatchman = process.env.PATTERNLY_METRO_DISABLE_WATCHMAN === "1";
const buildOnlyModules = new Map([
  ["../../infrastructure/testing/ownerPreservationOracleRuntime", smokeRuntime ? "src/infrastructure/testing/ownerPreservationOracleRuntime.smoke.ts" : "src/infrastructure/testing/ownerPreservationOracleRuntime.disabled.ts"],
  ["../testing/ownerPreservationSourceRuntime", smokeRuntime ? "src/infrastructure/testing/ownerPreservationSourceRuntime.smoke.ts" : "src/infrastructure/testing/ownerPreservationSourceRuntime.disabled.ts"],
  ["./ownerPreservationSourceRuntime", smokeRuntime ? "src/infrastructure/testing/ownerPreservationSourceRuntime.smoke.ts" : "src/infrastructure/testing/ownerPreservationSourceRuntime.disabled.ts"],
  ["../content/application/premiumNodeOffers", smokeRuntime ? "src/content/application/premiumNodeOffers.smoke.ts" : "src/content/application/premiumNodeOffers.disabled.ts"],
  ["./premiumNodeOffers", smokeRuntime ? "src/content/application/premiumNodeOffers.smoke.ts" : "src/content/application/premiumNodeOffers.disabled.ts"],
  ["../../src/content/application/premiumNodeOffers", smokeRuntime ? "src/content/application/premiumNodeOffers.smoke.ts" : "src/content/application/premiumNodeOffers.disabled.ts"],
]);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
config.resolver = {
  ...config.resolver,
  useWatchman: disableWatchman ? false : config.resolver.useWatchman,
  assetExts: assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
  blockList: [...blockList, localProfileEnvFiles],
  resolveRequest(context, moduleName, platform) {
    const implementation = buildOnlyModules.get(moduleName);
    if (implementation) {
      return {
        type: "sourceFile",
        filePath: require("node:path").join(__dirname, implementation),
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
