const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const { assetExts, sourceExts, blockList } = config.resolver;
const localProfileEnvFiles = /^(?:\/|[A-Za-z]:[\\/])(?:.*[\\/])?\.env\.(?:smoke|sandbox)\.local$/;
const smokeRuntime = process.env.PATTERNLY_RUNTIME_MODE === "smoke";
const buildOnlyModules = new Map([
  ["../../infrastructure/testing/ownerPreservationOracleRuntime", smokeRuntime ? "ownerPreservationOracleRuntime.smoke.ts" : "ownerPreservationOracleRuntime.disabled.ts"],
  ["../testing/ownerPreservationSourceRuntime", smokeRuntime ? "ownerPreservationSourceRuntime.smoke.ts" : "ownerPreservationSourceRuntime.disabled.ts"],
  ["./ownerPreservationSourceRuntime", smokeRuntime ? "ownerPreservationSourceRuntime.smoke.ts" : "ownerPreservationSourceRuntime.disabled.ts"],
]);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
config.resolver = {
  ...config.resolver,
  assetExts: assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
  blockList: [...blockList, localProfileEnvFiles],
  resolveRequest(context, moduleName, platform) {
    const implementation = buildOnlyModules.get(moduleName);
    if (implementation) {
      return {
        type: "sourceFile",
        filePath: require("node:path").join(__dirname, "src/infrastructure/testing", implementation),
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
