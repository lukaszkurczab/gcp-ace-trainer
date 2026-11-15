// T2.5 stage 3: the overlay window that holds the native first screen above React Native's root window
// (design doc §1, §3.2, §7). React Native renders underneath; the overlay leaves only after RN's first
// usable frame, so there is no blank frame. Wired into AppDelegate and Nitro in stage 4.
import SwiftUI
import UIKit

public final class FirstScreenOverlay {
  public static private(set) var current: FirstScreenOverlay?

  public let decision: FirstScreenDecision
  public let state = FirstScreenState()
  private let window: UIWindow
  private var displayLink: CADisplayLink?
  private var onFirstFrame: (() -> Void)?
  private var loadingTimer: Timer?

  private init(decision: FirstScreenDecision, window: UIWindow) {
    self.decision = decision
    self.window = window
  }

  /// Shows the overlay. `onFirstFrame` runs once, on the first display refresh after the view is on screen
  /// (`native_first_frame`). Call on the main thread from `didFinishLaunching`.
  @discardableResult
  public static func present(decision: FirstScreenDecision, frame: CGRect = UIScreen.main.bounds, onFirstFrame: @escaping () -> Void) -> FirstScreenOverlay {
    current?.remove()
    let window = UIWindow(frame: frame)
    window.windowLevel = UIWindow.Level(rawValue: UIWindow.Level.normal.rawValue + 1)
    let overlay = FirstScreenOverlay(decision: decision, window: window)
    overlay.onFirstFrame = onFirstFrame
    let host = UIHostingController(rootView: FirstScreenView(decision: decision, state: overlay.state))
    host.view.backgroundColor = .clear
    window.rootViewController = host
    window.isHidden = false
    current = overlay
    overlay.waitForFirstFrame()
    overlay.loadingTimer = Timer.scheduledTimer(withTimeInterval: 10, repeats: false) { [weak overlay] _ in
      overlay?.state.showLoading = true
    }
    return overlay
  }

  private func waitForFirstFrame() {
    let link = CADisplayLink(target: FirstScreenDisplayLinkTarget { [weak self] in self?.firstFrame() }, selector: #selector(FirstScreenDisplayLinkTarget.tick))
    link.add(to: .main, forMode: .common)
    displayLink = link
  }

  private func firstFrame() {
    displayLink?.invalidate()
    displayLink = nil
    let callback = onFirstFrame
    onFirstFrame = nil
    callback?()
  }

  /// React Native's first usable frame is on screen. `matching` = RN shows the same surface the overlay drew:
  /// crossfade 150 ms; otherwise remove at once (the native picture was stale). No animation with Reduce Motion
  /// or VoiceOver. VoiceOver focus moves to the React Native tree afterwards.
  public func dismiss(matching: Bool, completion: (() -> Void)? = nil) {
    loadingTimer?.invalidate()
    loadingTimer = nil
    let animate = matching && !UIAccessibility.isReduceMotionEnabled && !UIAccessibility.isVoiceOverRunning
    let finish = { [weak self] in
      self?.remove()
      UIAccessibility.post(notification: .screenChanged, argument: nil)
      completion?()
    }
    guard animate else { finish(); return }
    UIView.animate(withDuration: 0.15, delay: 0, options: [.curveEaseOut, .beginFromCurrentState], animations: {
      self.window.alpha = 0
    }, completion: { _ in finish() })
  }

  private func remove() {
    displayLink?.invalidate()
    displayLink = nil
    loadingTimer?.invalidate()
    loadingTimer = nil
    window.isHidden = true
    window.rootViewController = nil
    if FirstScreenOverlay.current === self { FirstScreenOverlay.current = nil }
  }
}

/// CADisplayLink retains its target; this box keeps the overlay itself out of that cycle.
private final class FirstScreenDisplayLinkTarget {
  private let callback: () -> Void
  init(_ callback: @escaping () -> Void) { self.callback = callback }
  @objc func tick() { callback() }
}
