const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

/**
 * T1.6: shorter native startup before the first React Native frame.
 *
 * 1. Firebase (`RNFBAppCheckModule.sharedInstance()` + `FirebaseApp.configure()`) leaves the
 *    synchronous path before `factory.startReactNative`. The block runs on the next main-queue
 *    turn, after React Native has started its host on the JS thread. The JS bundle evaluates
 *    hundreds of milliseconds later, so native Firebase is configured before any JS reads it;
 *    the App Check provider factory is still registered before `configure()` (AppCheck-AD-3).
 *    The JS side waits for App Check composition before the first backend request
 *    (`src/infrastructure/clients/patternlyAppCheckToken.ts`).
 * 2. Release perf builds only (`extra.patternlyPerfBuild`): native launch markers are appended to
 *    `<Documents>/perf-trace/native-<pid>.jsonl`, next to the JS startup trace (Plan T0.1).
 *
 * Kill switch: `PATTERNLY_DEFER_NATIVE_STARTUP=0` at prebuild time keeps the generated order
 * (needs a native rebuild).
 */
const DEFER_BEGIN = "    // @patternly-deferred-native-startup-begin";
const DEFER_END = "    // @patternly-deferred-native-startup-end";
const TRACE_HELPER_BEGIN = "// @patternly-native-startup-trace-begin";
const TRACE_HELPER_END = "// @patternly-native-startup-trace-end";
const ACM_GUARD_BEGIN = "// @patternly-acm-native-firebase-guard-begin";
const ACM_GUARD_END = "// @patternly-acm-native-firebase-guard-end";
const FIREBASE_BEGIN = "// @generated begin @react-native-firebase/app-check";
const FIREBASE_END = "// @generated end @react-native-firebase/app-check";
const START_REACT_NATIVE = /\n([ \t]*)factory\.startReactNative\(\n[\s\S]*?launchOptions: launchOptions\)\n/u;
const LAUNCH_RETURN = "    return super.application(application, didFinishLaunchingWithOptions: launchOptions)\n  }\n";
const PERF_INFO_KEY = "PatternlyPerfNativeTrace";
const FACTORY_ANCHOR = "    let delegate = ReactNativeDelegate()\n";

function readDeferFlag(environment = process.env) {
  const value = environment.PATTERNLY_DEFER_NATIVE_STARTUP;
  if (value === undefined || value === "" || value === "1") return true;
  if (value === "0") return false;
  throw new Error("PATTERNLY_DEFER_NATIVE_STARTUP must be 0 or 1 when set.");
}

function lineBounds(source, index) {
  const start = source.lastIndexOf("\n", index) + 1;
  const newline = source.indexOf("\n", index);
  return { start, end: newline < 0 ? source.length : newline + 1 };
}

function onlyOnce(source, marker, what) {
  const first = source.indexOf(marker);
  if (first >= 0 && source.indexOf(marker, first + marker.length) >= 0) throw new Error(`Patternly AppDelegate has more than one ${what}.`);
  return first;
}

/** The Firebase block as a whole line range: the ACM fixture guard when present, else the generated region. */
function firebaseBlockRange(source) {
  const guardBegin = onlyOnce(source, ACM_GUARD_BEGIN, "ACM Firebase guard");
  const guardEnd = onlyOnce(source, ACM_GUARD_END, "ACM Firebase guard end");
  if (guardBegin >= 0 || guardEnd >= 0) {
    if (guardBegin < 0 || guardEnd < guardBegin) throw new Error("Patternly AppDelegate ACM Firebase guard is incomplete.");
    return { start: lineBounds(source, guardBegin).start, end: lineBounds(source, guardEnd).end };
  }
  const begin = onlyOnce(source, FIREBASE_BEGIN, "Firebase generated region");
  const end = onlyOnce(source, FIREBASE_END, "Firebase generated region end");
  if (begin < 0 && end < 0) return null;
  if (begin < 0 || end < begin) throw new Error("Patternly AppDelegate Firebase generated region is incomplete.");
  return { start: lineBounds(source, begin).start, end: lineBounds(source, end).end };
}

/** Moves the Firebase block behind `factory.startReactNative(...)`, onto the next main-queue turn. */
function deferFirebaseStartup(source) {
  if (source.includes(DEFER_BEGIN)) return source;
  const range = firebaseBlockRange(source);
  if (!range) return source;
  const block = source.slice(range.start, range.end);
  if (!/RNFBAppCheckModule\.sharedInstance\(\)[\s\S]*FirebaseApp\.configure\(\)/u.test(block)) {
    throw new Error("Patternly AppDelegate Firebase block must register App Check before FirebaseApp.configure().");
  }
  const withoutBlock = source.slice(0, range.start) + source.slice(range.end);
  const start = START_REACT_NATIVE.exec(withoutBlock);
  if (!start || START_REACT_NATIVE.exec(withoutBlock.slice(start.index + start[0].length))) {
    throw new Error("Patternly AppDelegate startReactNative anchor was not found exactly once.");
  }
  if (start.index < range.start - 1) throw new Error("Patternly AppDelegate Firebase block is not before startReactNative.");
  const insertAt = start.index + start[0].length;
  const deferred = `${DEFER_BEGIN}
    // T1.6: Firebase and App Check start on the next main-queue turn, after React Native
    // has begun initializing its host. Main-queue module setup requested by JS is queued
    // behind this block, and the bundle evaluates only after the Expo module registry.
    DispatchQueue.main.async { [self] in
      PatternlyNativeStartupTrace.mark("native:firebase_begin")
${block.replace(/\n$/u, "")}
      PatternlyNativeStartupTrace.mark("native:firebase_end")
      PatternlyNativeStartupTrace.flush(after: 0.5)
    }
${DEFER_END}
`;
  return withoutBlock.slice(0, insertAt) + deferred + withoutBlock.slice(insertAt);
}

function traceHelperSwift() {
  return `${TRACE_HELPER_BEGIN}
/// Release perf builds only (Info.plist ${PERF_INFO_KEY}): native launch markers for the startup
/// breakdown, appended on a serial utility queue to <Documents>/perf-trace/native-<pid>.jsonl.
enum PatternlyNativeStartupTrace {
  static let enabled = Bundle.main.object(forInfoDictionaryKey: "${PERF_INFO_KEY}") as? Bool == true
  private static let lock = NSLock()
  private static let queue = DispatchQueue(label: "com.lkurczab.patternly.native-startup-trace", qos: .utility)
  private static var marks: [(String, Double)] = []

  static func mark(_ stage: String) {
    guard enabled else { return }
    let epochMs = Date().timeIntervalSince1970 * 1000
    lock.lock(); marks.append((stage, epochMs)); lock.unlock()
  }

  static func flush(after seconds: Double) {
    guard enabled else { return }
    queue.asyncAfter(deadline: .now() + seconds) {
      lock.lock(); let pending = marks; marks.removeAll(); lock.unlock()
      guard !pending.isEmpty,
            let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return }
      let directory = documents.appendingPathComponent("perf-trace", isDirectory: true)
      try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
      let lines = pending.map { stage, epochMs in
        "{\\"stage\\":\\"\\(stage)\\",\\"edge\\":\\"event\\",\\"atMs\\":\\(epochMs),\\"epochMs\\":\\(epochMs),\\"clock\\":\\"native-wall\\"}\\n"
      }.joined()
      let file = directory.appendingPathComponent("native-\\(getpid()).jsonl")
      if let handle = try? FileHandle(forWritingTo: file) {
        handle.seekToEndOfFile(); handle.write(Data(lines.utf8)); handle.closeFile()
      } else {
        try? Data(lines.utf8).write(to: file)
      }
    }
  }
}
${TRACE_HELPER_END}
`;
}

/** React factory start and launch end markers plus the helper; the markers are no-ops outside perf builds. */
function injectNativeStartupTrace(source) {
  if (source.includes(TRACE_HELPER_BEGIN)) return source;
  // Anchored on the React factory rather than the method start, so the privacy boundary plugin
  // (which owns the first statements of the method) stays idempotent in either mod order.
  if (source.split(FACTORY_ANCHOR).length !== 2 || source.split(LAUNCH_RETURN).length !== 2) {
    throw new Error("Patternly AppDelegate launch anchors for the native startup trace were not found.");
  }
  let next = source.replace(FACTORY_ANCHOR, `    PatternlyNativeStartupTrace.mark("native:factory_begin")\n${FACTORY_ANCHOR}`);
  next = next.replace(LAUNCH_RETURN, `    let launched = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    PatternlyNativeStartupTrace.mark("native:launch_end")
    PatternlyNativeStartupTrace.flush(after: 0.5)
    return launched
  }
`);
  return `${next.replace(/\n*$/u, "\n")}\n${traceHelperSwift()}`;
}

function transformAppDelegate(source, { defer = true } = {}) {
  const next = injectNativeStartupTrace(source);
  return defer ? deferFirebaseStartup(next) : next;
}

function withDeferredNativeStartup(config) {
  const defer = readDeferFlag();
  const perfTrace = config.extra?.patternlyPerfBuild === true;
  config = withInfoPlist(config, (nextConfig) => {
    if (perfTrace) nextConfig.modResults[PERF_INFO_KEY] = true;
    else delete nextConfig.modResults[PERF_INFO_KEY];
    return nextConfig;
  });
  return withAppDelegate(config, (nextConfig) => {
    if (nextConfig.modResults.language !== "swift") throw new Error("Patternly native startup plugin requires a Swift AppDelegate.");
    nextConfig.modResults.contents = transformAppDelegate(nextConfig.modResults.contents, { defer });
    return nextConfig;
  });
}

module.exports = withDeferredNativeStartup;
module.exports.readDeferFlag = readDeferFlag;
module.exports.deferFirebaseStartup = deferFirebaseStartup;
module.exports.injectNativeStartupTrace = injectNativeStartupTrace;
module.exports.transformAppDelegate = transformAppDelegate;
module.exports.PERF_INFO_KEY = PERF_INFO_KEY;
