// T2.5: decides what the native first screen may show, from raw stored values only.
// Pure (no keychain, no file system, no clock) so the same rules run in the app and in
// `native/first-screen/test` against values produced by the real TS storage code.
//
// Order (design doc §2.3), each failure ends at the neutral screen and never at an error:
//   1. the first-screen record decodes (schema 2, size, shape) and has not expired;
//   2. the local logout control has nothing pending or blocked (a sign-out or deletion is in flight);
//   3. today only: the profile registry (`patternly.profile-root.v1.a|b`, newest generation)
//      selects the record's profile;
//   4. today only: the encrypted storage manifest names an active slot whose MMKV file exists
//      (the keychain outlives a reinstall, `Documents/mmkv` does not).
// Freshness of the Today data itself is guaranteed on the write side: React Native drops the
// record before any Today input write and before any registry commit.
import Foundation

public struct FirstScreenStoredValues {
  public var record: Data?
  public var logoutControl: Data?
  public var registryA: Data?
  public var registryB: Data?
  public var manifestA: Data?
  public var manifestB: Data?

  public init(record: Data? = nil, logoutControl: Data? = nil, registryA: Data? = nil, registryB: Data? = nil, manifestA: Data? = nil, manifestB: Data? = nil) {
    self.record = record
    self.logoutControl = logoutControl
    self.registryA = registryA
    self.registryB = registryB
    self.manifestA = manifestA
    self.manifestB = manifestB
  }
}

/// Lazily supplies the stored values so a missing record costs one keychain read.
public protocol FirstScreenValueSource {
  func record() -> Data?
  func logoutControl() -> Data?
  func registry(_ slot: String) -> Data?
  func manifest(_ slot: String) -> Data?
  func slotFileExists(_ mmkvId: String) -> Bool
}

public enum FirstScreenDecision: Equatable {
  case today(FirstScreenTodayRecord)
  case welcome(FirstScreenWelcomeRecord)
  /// Background, logo and spinner. `appearance` and `locale` are hints from a readable but rejected record.
  case neutral(reason: String, appearance: FirstScreenAppearance?, locale: String?)

  public var kind: String {
    switch self {
    case .today: return "today"
    case .welcome: return "welcome"
    case .neutral: return "neutral"
    }
  }
}

private func jsonObject(_ data: Data?) -> [String: Any]? {
  guard let data, let value = try? JSONSerialization.jsonObject(with: data), let object = value as? [String: Any] else { return nil }
  return object
}

private func positiveInt(_ value: Any?) -> Int? {
  guard let number = value as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID() else { return nil }
  let double = number.doubleValue
  guard double.rounded() == double, double >= 1, double <= 9_007_199_254_740_991 else { return nil }
  return Int(double)
}

enum SlotPick<T> { case none, corrupt, value(T) }

/// Newest of two generation-stamped slots. A present but unreadable slot, or two slots with the same
/// generation, is corrupt: React Native would refuse it too, so the native screen does not guess.
func pickNewest(_ a: Data?, _ b: Data?, parse: ([String: Any]) -> (generation: Int, value: [String: Any])?) -> SlotPick<[String: Any]> {
  var found: [(generation: Int, value: [String: Any])] = []
  for raw in [a, b] {
    guard let raw else { continue }
    guard let object = jsonObject(raw), let parsed = parse(object) else { return .corrupt }
    found.append(parsed)
  }
  if found.isEmpty { return .none }
  if found.count == 2 && found[0].generation == found[1].generation { return .corrupt }
  return .value(found.max { $0.generation < $1.generation }!.value)
}

/// `localLogoutControl.ts` v2: `{ version: 2, blocked, pending: [], completed: [] }`.
func logoutControlIsClear(_ raw: Data?) -> Bool? {
  guard let raw else { return true }
  guard let object = jsonObject(raw), positiveInt(object["version"]) == 2,
        let pending = object["pending"] as? [Any], object["completed"] is [Any], object.keys.contains("blocked") else { return nil }
  return pending.isEmpty && object["blocked"] is NSNull
}

func registrySlot(_ object: [String: Any]) -> (generation: Int, value: [String: Any])? {
  guard positiveInt(object["version"]) == 1, let generation = positiveInt(object["generation"]),
        let selected = object["selectedProfileId"] as? String, !selected.isEmpty, object["checksum"] is String,
        let profiles = object["profiles"] as? [[String: Any]],
        profiles.contains(where: { ($0["id"] as? String) == selected }) else { return nil }
  return (generation, object)
}

private let manifestStages: Set<String> = ["building", "verified", "active_reopen_pending", "active_quarantine_pending", "quarantine_verified", "cleanup_pending", "complete"]

func manifestSlot(_ object: [String: Any]) -> (generation: Int, value: [String: Any])? {
  guard positiveInt(object["version"]) == 1, let generation = positiveInt(object["generation"]),
        let stage = object["stage"] as? String, manifestStages.contains(stage),
        let active = object["activeSlot"] as? String, active == "a" || active == "b", object["checksum"] is String else { return nil }
  return (generation, object)
}

public func decideFirstScreen(source: FirstScreenValueSource, nowMs: Double) -> FirstScreenDecision {
  let record: FirstScreenRecord
  switch decodeFirstScreenRecord(source.record()) {
  case .failure(let problem): return .neutral(reason: "record_\(problem.rawValue)", appearance: nil, locale: nil)
  case .success(let value): record = value
  }
  let hint = record.appearance
  let locale = record.locale
  guard record.validUntilMs.isFinite, nowMs < record.validUntilMs else { return .neutral(reason: "record_expired", appearance: hint, locale: locale) }

  switch logoutControlIsClear(source.logoutControl()) {
  case .none: return .neutral(reason: "logout_control_unreadable", appearance: hint, locale: locale)
  case .some(false): return .neutral(reason: "logout_pending", appearance: hint, locale: locale)
  case .some(true): break
  }

  guard case .today(let today) = record else {
    if case .welcome(let welcome) = record { return .welcome(welcome) }
    return .neutral(reason: "record_malformed", appearance: hint, locale: locale)
  }

  switch pickNewest(source.registry("a"), source.registry("b"), parse: registrySlot) {
  case .none: return .neutral(reason: "registry_absent", appearance: hint, locale: locale)
  case .corrupt: return .neutral(reason: "registry_unreadable", appearance: hint, locale: locale)
  case .value(let registry):
    guard (registry["selectedProfileId"] as? String) == today.profileId else { return .neutral(reason: "profile_mismatch", appearance: hint, locale: locale) }
  }

  switch pickNewest(source.manifest("a"), source.manifest("b"), parse: manifestSlot) {
  case .none: return .neutral(reason: "storage_absent", appearance: hint, locale: locale)
  case .corrupt: return .neutral(reason: "storage_manifest_unreadable", appearance: hint, locale: locale)
  case .value(let manifest):
    guard (manifest["stage"] as? String) != "building", let active = manifest["activeSlot"] as? String,
          source.slotFileExists("patternly-secure-\(active)") else { return .neutral(reason: "storage_slot_missing", appearance: hint, locale: locale) }
  }
  return .today(today)
}

/// In-memory source (tests, and the native read after it has loaded the values).
public struct FirstScreenFixedSource: FirstScreenValueSource {
  public var values: FirstScreenStoredValues
  public var existingSlots: Set<String>

  public init(values: FirstScreenStoredValues, existingSlots: Set<String>) {
    self.values = values
    self.existingSlots = existingSlots
  }

  public func record() -> Data? { values.record }
  public func logoutControl() -> Data? { values.logoutControl }
  public func registry(_ slot: String) -> Data? { slot == "a" ? values.registryA : values.registryB }
  public func manifest(_ slot: String) -> Data? { slot == "a" ? values.manifestA : values.manifestB }
  public func slotFileExists(_ mmkvId: String) -> Bool { existingSlots.contains(mmkvId) }
}
