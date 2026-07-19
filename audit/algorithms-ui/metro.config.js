const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

/** The audit host owns its entrypoint and reads the app source only as a watched dependency. */
config.projectRoot = __dirname;
config.watchFolders = [path.resolve(__dirname, "../..")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "../../node_modules")];

module.exports = config;
