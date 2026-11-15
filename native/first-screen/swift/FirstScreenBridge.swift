// T2.5 stage 4: launch sequence and handover for the native first screen (design doc §1, §3).
// `AppDelegate` (via plugins/withNativeFirstScreen.js) calls `PatternlyFirstScreenStartup.begin`; React Native talks to
// `FirstScreenBridge` through the `PatternlyFirstScreen` Nitro object (PatternlyFirstScreen.mm).
import Foundation
import UIKit

/// Thread-safe handover state shared by the main thread (overlay, taps) and the JS thread (Nitro calls).
final class FirstScreenHandoverState {
  struct Shown { let kind: String; let profileId: String?; let revision: String? }
  struct Pending { let id: String; let action: String; let profileId: String?; let revision: String?; let capturedAtMs: Double }

  private let lock = NSLock()
  private var shown: Shown?
  private var pending: Pending?
  private var handedOver = false

  func setShown(_ value: Shown?) { lock.lock(); shown = value; lock.unlock() }
  func readShown() -> Shown? { lock.lock(); defer { lock.unlock() }; return shown }

  /// First tap wins; refused once React Native has taken over (a later tap is already on RN's own UI).
  func offer(action: String, nowMs: Double) -> Bool {
    lock.lock(); defer { lock.unlock() }
    guard !handedOver, pending == nil, let shown else { return false }
    pending = Pending(id: UUID().uuidString, action: action, profileId: shown.profileId, revision: shown.revision, capturedAtMs: nowMs)
    return true
  }

  /// Closes the tap window. Returns false when the handover already happened.
  func beginHandover() -> Bool {
    lock.lock(); defer { lock.unlock() }
    if handedOver { return false }
    handedOver = true
    return true
  }

  /// At most once: the slot is emptied by the read.
  func take() -> Pending? {
    lock.lock(); defer { lock.unlock() }
    let value = pending
    pending = nil
    return value
  }

  var isHandedOver: Bool { lock.lock(); defer { lock.unlock() }; return handedOver }
}

public enum PatternlyFirstScreenStartup {
  static let handover = FirstScreenHandoverState()
  static var mark: (String) -> Void = { _ in }
  /// Native safety net: never leave the overlay over a React Native that did not report (design doc §3.2).
  static let readyTimeoutSeconds: TimeInterval = 20

  /// `PatternlyFirstScreenRNStart` in Info.plist: `after_first_frame` (default, measured in phase A) or
  /// `immediate` (React Native starts right after the overlay window is made visible).
  static var rnStartMode: String {
    (Bundle.main.object(forInfoDictionaryKey: "PatternlyFirstScreenRNStart") as? String) == "immediate" ? "immediate" : "after_first_frame"
  }

  /// A cold start that carries a URL or a user activity (deep link, universal link, handoff) skips the
  /// overlay: React Native routes it directly (design doc §5).
  /// ACM native fixture builds (Info.plist markers, see withPrivacyBoundary.js) also skip it: their storage is
  /// prepared by the fixture, not by a previous React Native run.
  public static func shouldSkip(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let info = Bundle.main.infoDictionary ?? [:]
    if ["PatternlyACMNativeFixture", "PatternlyACMNativeFixtureRunUUID", "PatternlyACMNativeFixtureOperation"].contains(where: { info[$0] != nil }) { return true }
    guard let launchOptions else { return false }
    return launchOptions[.url] != nil || launchOptions[.userActivityDictionary] != nil || launchOptions[.userActivityType] != nil
  }

  /// Reads the record, shows the overlay and starts React Native (eager). Main thread, from `didFinishLaunching`.
  public static func begin(launchOptions: [UIApplication.LaunchOptionsKey: Any]?, mark: @escaping (String) -> Void, startReactNative: @escaping () -> Void) {
    self.mark = mark
    if shouldSkip(launchOptions: launchOptions) {
      mark("first_screen:skipped")
      _ = handover.beginHandover()
      startReactNative()
      return
    }
    mark("first_screen:read_begin")
    let decision = FirstScreenStore.load()
    mark("first_screen:read_end")
    mark("first_screen:kind:\(decision.kind)")
    // Fixed reason codes only (no record content), so the trace can say why a launch fell back.
    if case .neutral(let reason, _, _) = decision { mark("first_screen:neutral_reason:\(reason)") }
    switch decision {
    case .today(let record): handover.setShown(.init(kind: "today", profileId: record.profileId, revision: record.revision))
    case .welcome: handover.setShown(.init(kind: "welcome", profileId: nil, revision: nil))
    case .neutral: handover.setShown(.init(kind: "neutral", profileId: nil, revision: nil))
    }
    let immediate = rnStartMode == "immediate"
    var started = false
    let start = {
      guard !started else { return }
      started = true
      mark("first_screen:rn_start")
      startReactNative()
      DispatchQueue.main.asyncAfter(deadline: .now() + readyTimeoutSeconds) {
        guard handover.beginHandover() else { return }
        mark("first_screen:ready_timeout")
        FirstScreenOverlay.current?.dismiss(matching: false) { mark("first_screen:overlay_removed") }
      }
    }
    let overlay = FirstScreenOverlay.present(decision: decision) {
      mark("native_first_frame")
      if !immediate { DispatchQueue.main.async(execute: start) }
    }
    overlay.state.onAction = { action in
      if handover.offer(action: action, nowMs: Date().timeIntervalSince1970 * 1000) { mark("first_screen:tap") }
    }
    if immediate { start() }
  }
}

/// Nitro-facing API (called from PatternlyFirstScreen.mm on the JS thread). Strings only: empty = null.
@objc(PatternlyFirstScreenBridge)
public final class FirstScreenBridge: NSObject {
  @objc public static func writeRecord(_ json: String) -> Bool { FirstScreenStore.write(json) }

  @objc public static func clearRecord() { FirstScreenStore.clear() }

  /// `{"kind","profileId","revision"}` of what the overlay drew, or "" when no overlay was shown.
  @objc public static func shownSnapshotJSON() -> String {
    guard let shown = PatternlyFirstScreenStartup.handover.readShown() else { return "" }
    return json(["kind": shown.kind, "profileId": shown.profileId ?? NSNull(), "revision": shown.revision ?? NSNull()])
  }

  /// React Native's first usable frame for `surface` ("today" | "account" | "other"). The first call wins.
  /// A matching surface crossfades; anything else removes the overlay at once.
  @objc public static func markRnReady(surface: String, profileId: String, revision: String) {
    guard PatternlyFirstScreenStartup.handover.beginHandover() else { return }
    let shown = PatternlyFirstScreenStartup.handover.readShown()
    let matching: Bool
    switch shown?.kind {
    case "today": matching = surface == "today" && shown?.profileId == profileId && shown?.revision == revision
    case "welcome": matching = surface == "account"
    default: matching = true
    }
    DispatchQueue.main.async {
      PatternlyFirstScreenStartup.mark("rn_handover")
      PatternlyFirstScreenStartup.mark(matching ? "first_screen:handover_matching" : "first_screen:handover_mismatch")
      FirstScreenOverlay.current?.dismiss(matching: matching) { PatternlyFirstScreenStartup.mark("first_screen:overlay_removed") }
    }
  }

  /// `{"id","action","profileId","revision","capturedAtMs"}` once, or "".
  @objc public static func takePendingActionJSON() -> String {
    guard let pending = PatternlyFirstScreenStartup.handover.take() else { return "" }
    return json(["id": pending.id, "action": pending.action, "profileId": pending.profileId ?? NSNull(), "revision": pending.revision ?? NSNull(), "capturedAtMs": pending.capturedAtMs])
  }

  private static func json(_ object: [String: Any]) -> String {
    guard let data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]) else { return "" }
    return String(decoding: data, as: UTF8.self)
  }
}
