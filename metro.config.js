const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const { assetExts, sourceExts, blockList } = config.resolver;
const localProfileEnvFiles = /^(?:\/|[A-Za-z]:[\\/])(?:.*[\\/])?\.env\.(?:smoke|sandbox)\.local$/;

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
config.resolver = {
  ...config.resolver,
  assetExts: assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
  blockList: [...blockList, localProfileEnvFiles],
};

module.exports = config;
