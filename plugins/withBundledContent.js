const { withAppBuildGradle, withXcodeProject } = require("expo/config-plugins");

/**
 * T2.4: canonical content ships next to the JS bundle, not inside it.
 *
 * The generated content files (`src/content/generated/{canonical-content,retained-content}/*.json`) are copied
 * into the app unchanged, so their bytes keep the SHA-256 the content lock and the trust manifest record:
 * - iOS: a build phase copies them into `<App>.app/patternly-content/<directory>/`;
 * - Android: `src/content/generated` is an extra assets directory (`asset://<directory>/<file>`).
 * The runtime reads them through `src/content/canonical/contentAssetSource.native.ts`.
 */
const PHASE_NAME = "[Patternly] Copy bundled content";
const GRADLE_MARKER = "// @patternly-bundled-content";

const IOS_COPY_SCRIPT = [
  "set -eu",
  "SRC=\"${PROJECT_DIR}/../src/content/generated\"",
  "DEST=\"${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/patternly-content\"",
  "for DIR in canonical-content retained-content; do",
  "  mkdir -p \"$DEST/$DIR\"",
  "  rsync -a --delete --include='*.json' --exclude='*' \"$SRC/$DIR/\" \"$DEST/$DIR/\"",
  "done",
  "",
  // pbxproj strings carry escaped newlines (the form Xcode itself writes); the xcode library does not escape them.
].join("\\n");

/** Adds the copy phase to the app target once (idempotent across prebuilds). */
function addBundledContentPhase(project) {
  const phases = project.hash.project.objects.PBXShellScriptBuildPhase ?? {};
  const exists = Object.values(phases).some((phase) => phase && typeof phase === "object" && String(phase.name).replace(/"/gu, "") === PHASE_NAME);
  if (exists) return project;
  const target = project.getFirstTarget().uuid;
  project.addBuildPhase([], "PBXShellScriptBuildPhase", PHASE_NAME, target, { shellPath: "/bin/sh", shellScript: IOS_COPY_SCRIPT });
  return project;
}

function addBundledContentAssets(gradle) {
  if (gradle.includes(GRADLE_MARKER)) return gradle;
  return `${gradle.trimEnd()}\n\n${GRADLE_MARKER}\nandroid.sourceSets.main.assets.srcDirs += ["../../src/content/generated"]\n`;
}

function withBundledContent(config) {
  config = withXcodeProject(config, (nextConfig) => {
    nextConfig.modResults = addBundledContentPhase(nextConfig.modResults);
    return nextConfig;
  });
  return withAppBuildGradle(config, (nextConfig) => {
    if (nextConfig.modResults.language !== "groovy") throw new Error("withBundledContent expects a Groovy app/build.gradle.");
    nextConfig.modResults.contents = addBundledContentAssets(nextConfig.modResults.contents);
    return nextConfig;
  });
}

module.exports = withBundledContent;
module.exports.addBundledContentPhase = addBundledContentPhase;
module.exports.addBundledContentAssets = addBundledContentAssets;
module.exports.IOS_COPY_SCRIPT = IOS_COPY_SCRIPT;
module.exports.PHASE_NAME = PHASE_NAME;
