const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

/**
 * T2.5 stage 4 (D18 path (i)): the native first screen before React Native.
 *
 * `didFinishLaunching` hands `factory.startReactNative(...)` (and the T1.6 deferred Firebase block
 * that follows it) to `PatternlyFirstScreenStartup.begin` as a closure. `begin` reads the
 * first-screen record from the keychain, shows the SwiftUI overlay (`native/first-screen`) and
 * starts React Native eagerly: on the main-queue turn after the overlay's first frame, or, with
 * `PATTERNLY_FIRST_SCREEN_RN_START=immediate`, right after the overlay window is made visible.
 * A launch with a URL or a user activity (deep link) and ACM fixture builds start React Native
 * directly, without the overlay. Markers `native_first_frame` and `rn_handover` go to the native
 * perf trace of `withDeferredNativeStartup` (required, any order).
 *
 * Kill switch: `PATTERNLY_NATIVE_FIRST_SCREEN=0` at prebuild time leaves the AppDelegate as it was
 * (React Native draws the first frame; the record is still written but never read).
 */
const BEGIN = "    // @patternly-native-first-screen-begin";
const END = "    // @patternly-native-first-screen-end";
const DEFER_END = "    // @patternly-deferred-native-startup-end";
const START_REACT_NATIVE = /\n([ \t]*)factory\.startReactNative\(\n[\s\S]*?launchOptions: launchOptions\)\n/u;
const IMPORT_ANCHOR = /^import ReactAppDependencyProvider\n/mu;
const RN_START_INFO_KEY = "PatternlyFirstScreenRNStart";

function readFirstScreenFlag(environment = process.env) {
  const value = environment.PATTERNLY_NATIVE_FIRST_SCREEN;
  if (value === undefined || value === "" || value === "1") return true;
  if (value === "0") return false;
  throw new Error("PATTERNLY_NATIVE_FIRST_SCREEN must be 0 or 1 when set.");
}

function readRnStartMode(environment = process.env) {
  const value = environment.PATTERNLY_FIRST_SCREEN_RN_START;
  if (value === undefined || value === "" || value === "after_first_frame") return null;
  if (value === "immediate") return "immediate";
  throw new Error("PATTERNLY_FIRST_SCREEN_RN_START must be after_first_frame or immediate when set.");
}

/**
 * Wraps the React Native start (and the deferred Firebase block right after it, if already present).
 * The wrapped lines keep their indentation, so generated-region markers stay byte-identical.
 */
function injectNativeFirstScreen(source) {
  if (source.includes(BEGIN)) return source;
  const start = START_REACT_NATIVE.exec(source);
  // The second search starts at the newline the first match ended with, so a directly following call is seen.
  if (!start || START_REACT_NATIVE.exec(source.slice(start.index + start[0].length - 1))) {
    throw new Error("Patternly AppDelegate startReactNative anchor was not found exactly once.");
  }
  if (!IMPORT_ANCHOR.test(source)) throw new Error("Patternly AppDelegate import anchor was not found.");
  const blockStart = start.index + 1;
  let blockEnd = start.index + start[0].length;
  const afterStart = source.slice(blockEnd);
  if (afterStart.startsWith("    // @patternly-deferred-native-startup-begin\n")) {
    const deferEnd = afterStart.indexOf(`${DEFER_END}\n`);
    if (deferEnd < 0) throw new Error("Patternly AppDelegate deferred startup block is incomplete.");
    blockEnd += deferEnd + DEFER_END.length + 1;
  }
  const block = source.slice(blockStart, blockEnd).replace(/\n$/u, "");
  const wrapped = `${BEGIN}
    // T2.5: the native first screen draws before React Native; React Native starts eagerly behind it.
    let patternlyStartReactNative = { [self] in
${block}
    }
    PatternlyFirstScreenStartup.begin(
      launchOptions: launchOptions,
      mark: { stage in
        PatternlyNativeStartupTrace.mark(stage)
        PatternlyNativeStartupTrace.flush(after: 0.2)
      },
      startReactNative: patternlyStartReactNative)
${END}
`;
  const next = source.slice(0, blockStart) + wrapped + source.slice(blockEnd);
  return next.replace(IMPORT_ANCHOR, (line) => `${line}import PatternlyFirstScreen\n`);
}

function withNativeFirstScreen(config) {
  if (!readFirstScreenFlag()) return config;
  const plugins = (config.plugins ?? []).map((entry) => (Array.isArray(entry) ? entry[0] : entry));
  if (!plugins.some((name) => typeof name === "string" && name.endsWith("withDeferredNativeStartup"))) {
    throw new Error("withNativeFirstScreen needs ./plugins/withDeferredNativeStartup (native trace helper).");
  }
  const rnStart = readRnStartMode();
  config = withInfoPlist(config, (nextConfig) => {
    if (rnStart) nextConfig.modResults[RN_START_INFO_KEY] = rnStart;
    else delete nextConfig.modResults[RN_START_INFO_KEY];
    return nextConfig;
  });
  return withAppDelegate(config, (nextConfig) => {
    if (nextConfig.modResults.language !== "swift") throw new Error("Patternly native first screen requires a Swift AppDelegate.");
    nextConfig.modResults.contents = injectNativeFirstScreen(nextConfig.modResults.contents);
    return nextConfig;
  });
}

module.exports = withNativeFirstScreen;
module.exports.readFirstScreenFlag = readFirstScreenFlag;
module.exports.readRnStartMode = readRnStartMode;
module.exports.injectNativeFirstScreen = injectNativeFirstScreen;
module.exports.RN_START_INFO_KEY = RN_START_INFO_KEY;
