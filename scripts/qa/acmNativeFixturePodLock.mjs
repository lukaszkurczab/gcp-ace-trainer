import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const LOCAL_POD = "PatternlyForegroundClock";
const LOCAL_POD_IDENTITY = /^PatternlyForegroundClock \(([^)]+)\)$/u;

function localPodIdentities(entry) {
  const identities = typeof entry === "string" ? [entry]
    : entry && typeof entry === "object" ? Object.keys(entry) : [];
  return identities.map((identity) => ({ identity, version: identity.match(LOCAL_POD_IDENTITY)?.[1] })).filter((match) => match.version);
}

function isLocalPodDependency(entry) {
  const identities = typeof entry === "string" ? [entry]
    : entry && typeof entry === "object" ? Object.keys(entry) : [];
  return identities.some((identity) => identity === LOCAL_POD || identity.startsWith(`${LOCAL_POD} (`));
}

export function assertRemotePodLockUnchanged(beforeText, afterText) {
  const yaml = require("yaml");
  const before = yaml.parse(beforeText);
  const after = yaml.parse(afterText);
  const localPodEntries = (lock) => (lock.PODS ?? []).filter((entry) => localPodIdentities(entry).length > 0);
  const beforeLocalEntries = localPodEntries(before);
  const afterLocalEntries = localPodEntries(after);
  const beforeLocalEntry = beforeLocalEntries[0];
  const afterLocalEntry = afterLocalEntries[0];
  const localParts = (entry) => {
    const [match] = localPodIdentities(entry);
    const dependencies = match && typeof entry === "object" ? entry[match.identity] : [];
    return { version: match?.version, dependencies: Array.isArray(dependencies) ? dependencies : [] };
  };
  const beforeParts = localParts(beforeLocalEntry);
  const afterParts = localParts(afterLocalEntry);
  const coreLockEntry = (before.PODS ?? []).find((entry) => typeof entry === "string" ? entry.startsWith("React-Core (")
    : entry && typeof entry === "object" && Object.keys(entry).some((key) => key.startsWith("React-Core (")));
  const coreLockIdentity = typeof coreLockEntry === "string" ? coreLockEntry : Object.keys(coreLockEntry ?? {})[0];
  const pinnedCoreVersion = typeof coreLockIdentity === "string" ? coreLockIdentity.match(/^React-Core \(([^)]+)\)$/u)?.[1] : undefined;
  const beforeCoreDependencies = beforeParts.dependencies.filter((dependency) => /^React-Core(?:\s|$)/u.test(dependency));
  const afterCoreDependencies = afterParts.dependencies.filter((dependency) => /^React-Core(?:\s|$)/u.test(dependency));
  const afterCoreVersion = afterCoreDependencies[0]?.match(/^React-Core(?: \((?:= )?([^)]+)\))?$/u)?.[1];
  if (beforeLocalEntries.length !== 1 || afterLocalEntries.length !== 1 || !beforeParts.version || beforeParts.version !== afterParts.version
    || canonicalJson(beforeParts.dependencies.filter((dependency) => !/^React-Core(?:\s|$)/u.test(dependency)))
      !== canonicalJson(afterParts.dependencies.filter((dependency) => !/^React-Core(?:\s|$)/u.test(dependency)))
    || beforeCoreDependencies.length !== 0 || afterCoreDependencies.length !== 1 || pinnedCoreVersion !== "0.86.3"
    || (afterCoreVersion !== undefined && afterCoreVersion !== pinnedCoreVersion)
    || canonicalJson(before["DEPENDENCIES"]?.filter(isLocalPodDependency))
      !== canonicalJson(after["DEPENDENCIES"]?.filter(isLocalPodDependency))
    || canonicalJson(before["EXTERNAL SOURCES"]?.[LOCAL_POD]) !== canonicalJson(after["EXTERNAL SOURCES"]?.[LOCAL_POD])) {
    throw new Error("pod install changed the local foreground-clock version/source or any dependency beyond the pinned React-Core 0.86.3 addition.");
  }
  const withoutLocalPod = (lock) => {
    const normalized = structuredClone(lock);
    normalized.PODS = (normalized.PODS ?? []).filter((entry) => localPodIdentities(entry).length === 0);
    normalized.DEPENDENCIES = (normalized.DEPENDENCIES ?? []).filter((entry) => !isLocalPodDependency(entry));
    if (normalized["SPEC CHECKSUMS"]) delete normalized["SPEC CHECKSUMS"][LOCAL_POD];
    if (normalized["EXTERNAL SOURCES"]) delete normalized["EXTERNAL SOURCES"][LOCAL_POD];
    if (normalized["CHECKOUT OPTIONS"]) delete normalized["CHECKOUT OPTIONS"][LOCAL_POD];
    return canonicalJson(normalized);
  };
  if (withoutLocalPod(before) !== withoutLocalPod(after)) throw new Error("pod install changed a remote Pod version, source, dependency, or lock setting.");
  if (!Object.hasOwn(after["SPEC CHECKSUMS"] ?? {}, LOCAL_POD) || !Object.hasOwn(after["EXTERNAL SOURCES"] ?? {}, LOCAL_POD)) {
    throw new Error("Podfile.lock is missing the pinned local foreground-clock source after pod install.");
  }
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
