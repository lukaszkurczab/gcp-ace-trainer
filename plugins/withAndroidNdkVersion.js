const { withGradleProperties, withProjectBuildGradle } = require("expo/config-plugins");

const ANDROID_NDK_VERSION = "27.1.12297006";
const ANDROID_NDK_BOUNDARY_MARKER = "PATTERNLY_ANDROID_NDK_BOUNDARY";

function applyAndroidNdkVersion(properties) {
  const existingIndex = properties.findIndex(
    (property) => property.type === "property" && property.key === "ndkVersion",
  );
  const versionProperty = { type: "property", key: "ndkVersion", value: ANDROID_NDK_VERSION };

  if (existingIndex < 0) return [...properties, versionProperty];

  return properties.map((property, index) => index === existingIndex ? versionProperty : property);
}

function injectAndroidNdkConfiguration(source) {
  if (source.includes(ANDROID_NDK_BOUNDARY_MARKER)) return source;

  const anchor = 'apply plugin: "expo-root-project"\n';
  const anchorIndex = source.indexOf(anchor);
  if (anchorIndex < 0) throw new Error("Patternly Android root build.gradle anchor was not found.");

  const configuration = `\n// ${ANDROID_NDK_BOUNDARY_MARKER}\nsubprojects { patternlyAndroidProject ->\n    patternlyAndroidProject.plugins.withId("com.android.application") {\n        patternlyAndroidProject.android.ndkVersion = "${ANDROID_NDK_VERSION}"\n    }\n    patternlyAndroidProject.plugins.withId("com.android.library") {\n        patternlyAndroidProject.android.ndkVersion = "${ANDROID_NDK_VERSION}"\n    }\n}\n`;
  const insertionIndex = anchorIndex + anchor.length;
  return `${source.slice(0, insertionIndex)}${configuration}${source.slice(insertionIndex)}`;
}

function withAndroidNdkVersion(config) {
  config = withGradleProperties(config, (nextConfig) => {
    nextConfig.modResults = applyAndroidNdkVersion(nextConfig.modResults);
    return nextConfig;
  });
  return withProjectBuildGradle(config, (nextConfig) => {
    if (nextConfig.modResults.language !== "groovy") throw new Error("Patternly Android NDK configuration requires a Groovy root build.gradle.");
    nextConfig.modResults.contents = injectAndroidNdkConfiguration(nextConfig.modResults.contents);
    return nextConfig;
  });
}

module.exports = withAndroidNdkVersion;
module.exports.applyAndroidNdkVersion = applyAndroidNdkVersion;
module.exports.injectAndroidNdkConfiguration = injectAndroidNdkConfiguration;
module.exports.ANDROID_NDK_VERSION = ANDROID_NDK_VERSION;
module.exports.ANDROID_NDK_BOUNDARY_MARKER = ANDROID_NDK_BOUNDARY_MARKER;
