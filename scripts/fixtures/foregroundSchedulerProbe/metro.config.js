const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const applicationRoot = path.resolve(__dirname, "../../..");
config.watchFolders = [path.join(applicationRoot, "node_modules")];

module.exports = config;
