// T2.5 stage 3: the native first screen. It draws the record React Native rendered last time
// (Today or the signed-out welcome) or a neutral screen, with the RN layout and generated tokens:
// `HomeTab.tsx`, `HomeDecisionCard.tsx`, `BottomTabBar.tsx`, `AccountEntryScreen.tsx` (WelcomeScreen).
// No logic beyond layout: every string is already localized in the record. A tap queues one action id
// (`FirstScreenState.tap`) and shows "Opening…" on that control; React Native performs it after handover.
import SwiftUI
import UIKit

/// Shared with the overlay: the one pending action and the 10 s loading hint.
public final class FirstScreenState: ObservableObject {
  @Published public private(set) var pendingAction: String?
  @Published public var showLoading = false
  /// Called once per accepted tap (the Nitro side keeps the single-slot queue).
  public var onAction: ((String) -> Void)?

  public init() {}

  /// First tap wins; later taps are ignored until React Native takes the action.
  public func tap(_ action: String) {
    guard pendingAction == nil else { return }
    pendingAction = action
    onAction?(action)
  }
}

public struct FirstScreenView: View {
  public let decision: FirstScreenDecision
  @ObservedObject public var state: FirstScreenState
  @Environment(\.colorScheme) private var systemScheme
  @Environment(\.sizeCategory) private var sizeCategory

  public init(decision: FirstScreenDecision, state: FirstScreenState) {
    self.decision = decision
    self.state = state
  }

  private var appearance: FirstScreenAppearance? {
    switch decision {
    case .today(let record): return record.appearance
    case .welcome(let record): return record.appearance
    case .neutral(_, let appearance, _): return appearance
    }
  }

  private var strings: FirstScreenNativeStrings {
    switch decision {
    case .today(let record): return .forLocale(record.locale)
    case .welcome(let record): return .forLocale(record.locale)
    case .neutral(_, _, let locale): return .forLocale(locale ?? Locale.preferredLanguages.first)
    }
  }

  public var body: some View {
    let theme = FirstScreenTheme.resolve(appearance: appearance, system: systemScheme, category: UIContentSizeCategory(sizeCategory))
    ZStack(alignment: .top) {
      theme.palette.background.color.ignoresSafeArea()
      switch decision {
      case .today(let record): FirstScreenTodayScreen(view: record.view, theme: theme, strings: strings, state: state)
      case .welcome(let record): FirstScreenWelcomeScreen(view: record.view, theme: theme, strings: strings, state: state)
      case .neutral: FirstScreenNeutralScreen(theme: theme, strings: strings)
      }
      if state.showLoading, decision.kind != "neutral" {
        FirstScreenLoadingBanner(text: loadingText, theme: theme)
      }
    }
    .preferredColorScheme(theme.isDark ? .dark : .light)
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("first-screen-\(decision.kind)")
  }

  private var loadingText: String {
    switch decision {
    case .today(let record): return record.view.loading
    case .welcome(let record): return record.view.loading
    case .neutral: return strings.loading
    }
  }
}

// MARK: - Scrolling

private struct FirstScreenStaticLayoutKey: EnvironmentKey { static let defaultValue = false }

public extension EnvironmentValues {
  /// Snapshot rendering only: `ImageRenderer` does not draw `ScrollView` content, so lay the content out flat.
  var firstScreenStaticLayout: Bool {
    get { self[FirstScreenStaticLayoutKey.self] }
    set { self[FirstScreenStaticLayoutKey.self] = newValue }
  }
}

private struct ScrollContainer<Content: View>: View {
  @Environment(\.firstScreenStaticLayout) private var staticLayout
  @ViewBuilder let content: () -> Content
  var body: some View {
    if staticLayout {
      VStack(spacing: 0) { content() }.frame(maxHeight: .infinity, alignment: .top)
    } else {
      ScrollView { content() }
    }
  }
}

// MARK: - Controls

private struct FirstScreenPressStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label.opacity(configuration.isPressed ? 0.78 : 1)
  }
}

/// A control bound to an action id. While its action is pending it shows "Opening…" and a spinner.
private struct ActionButton<Label: View>: View {
  let action: String
  let strings: FirstScreenNativeStrings
  @ObservedObject var state: FirstScreenState
  var enabled = true
  @ViewBuilder let label: (_ opening: Bool) -> Label

  var body: some View {
    let opening = state.pendingAction == action
    Button { state.tap(action) } label: { label(opening) }
      .buttonStyle(FirstScreenPressStyle())
      .disabled(!enabled || (state.pendingAction != nil && !opening))
      .accessibilityAddTraits(opening ? .updatesFrequently : [])
      .accessibilityValue(opening ? Text(strings.opening) : Text(""))
      .accessibilityIdentifier("first-screen-action-\(action)")
  }
}

private enum FilledVariant { case primary, decision, secondary, ghost }

/// RN `Button`: radius 14, min height 48 (49 in the decision card), padding 20 × 15.
private struct FilledButton: View {
  let button: FirstScreenButton
  let variant: FilledVariant
  let theme: FirstScreenTheme
  let strings: FirstScreenNativeStrings
  @ObservedObject var state: FirstScreenState
  var enabled = true

  var body: some View {
    let p = theme.palette
    ActionButton(action: button.action, strings: strings, state: state, enabled: enabled) { opening in
      let fill: FirstScreenRGBA? = !enabled ? (variant == .ghost ? nil : p.surfaceInput) : {
        switch variant {
        case .primary: return p.primary
        case .decision: return p.navigationActive
        case .secondary: return p.surface
        case .ghost: return nil
        }
      }()
      let border: FirstScreenRGBA? = !enabled ? (variant == .ghost ? nil : p.border) : {
        switch variant {
        case .primary: return p.primary
        case .decision: return p.navigationActive
        case .secondary: return p.border
        case .ghost: return nil
        }
      }()
      let content: FirstScreenRGBA = !enabled ? p.textMuted : {
        switch variant {
        case .primary, .decision: return p.onPrimary
        case .secondary: return p.textPrimary
        case .ghost: return p.textSecondary
        }
      }()
      HStack(spacing: FirstScreenTokens.Spacing.sm) {
        if opening { ProgressView().tint(content.color).accessibilityHidden(true) }
        Text(opening ? strings.opening : button.label)
          .fsText(FirstScreenTokens.Typography.button, content, theme)
          .multilineTextAlignment(.center)
      }
      .frame(maxWidth: .infinity, minHeight: (variant == .decision ? 49 : 48) * theme.scale)
      .padding(.horizontal, FirstScreenTokens.Spacing.xl)
      .background(RoundedRectangle(cornerRadius: FirstScreenTokens.Radius.button).fill(fill?.color ?? .clear))
      .overlay(RoundedRectangle(cornerRadius: FirstScreenTokens.Radius.button).stroke(border?.color ?? .clear, lineWidth: 1))
      .contentShape(Rectangle())
    }
  }
}

/// RN text link (`Change`, `View activity`, `Open Practice`, secondary decision action).
private struct LinkButton: View {
  let button: FirstScreenButton
  let size: Double
  let weight: Font.Weight
  var chevron = false
  let theme: FirstScreenTheme
  let strings: FirstScreenNativeStrings
  @ObservedObject var state: FirstScreenState

  var body: some View {
    ActionButton(action: button.action, strings: strings, state: state) { opening in
      HStack(spacing: FirstScreenTokens.Spacing.xs) {
        Text(opening ? strings.opening : button.label).fsText(size: size, lineHeight: 18, weight: weight, theme.palette.primary, theme)
        if chevron && !opening { FirstScreenIcon(name: "chevron-right", size: 18, color: theme.palette.accentPurple) }
      }
      .frame(minHeight: 44)
      .contentShape(Rectangle())
    }
  }
}

private struct SectionLabel: View {
  let text: String
  let theme: FirstScreenTheme
  var body: some View {
    Text(text.uppercased())
      .fsText(size: 13, lineHeight: 16, weight: .bold, theme.palette.textMuted, theme, tracking: 0.5)
      .accessibilityAddTraits(.isHeader)
  }
}

private struct Card<Content: View>: View {
  let theme: FirstScreenTheme
  var radius: Double = FirstScreenTokens.Radius.xl
  var padding: Double = FirstScreenTokens.Spacing.lg
  var spacing: Double = FirstScreenTokens.Spacing.md
  @ViewBuilder let content: () -> Content
  var body: some View {
    VStack(alignment: .leading, spacing: spacing) { content() }
      .padding(padding)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(RoundedRectangle(cornerRadius: radius).fill(theme.palette.surface.color))
      .overlay(RoundedRectangle(cornerRadius: radius).stroke(theme.palette.border.color, lineWidth: 1))
  }
}

/// Stacks vertically in large-text layouts, like the RN `...LargeText` styles.
private struct AdaptiveRow<Leading: View, Trailing: View>: View {
  let large: Bool
  var spacing: Double = FirstScreenTokens.Spacing.md
  @ViewBuilder let leading: () -> Leading
  @ViewBuilder let trailing: () -> Trailing
  var body: some View {
    if large {
      VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.sm) { leading(); trailing() }
        .frame(maxWidth: .infinity, alignment: .leading)
    } else {
      HStack(alignment: .center, spacing: spacing) { leading(); Spacer(minLength: 0); trailing() }
    }
  }
}

// MARK: - Today

private struct FirstScreenTodayScreen: View {
  let view: FirstScreenTodayView
  let theme: FirstScreenTheme
  let strings: FirstScreenNativeStrings
  @ObservedObject var state: FirstScreenState

  var body: some View {
    VStack(spacing: 0) {
      ScrollContainer {
        VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.xl) {
          intro
          decisionCard
          if let plan = view.secondaryPlan { secondaryPlan(plan) }
          if let goal = view.goalInvitation { goalInvitation(goal) }
          if let firstUse = view.firstUse { firstUseState(firstUse) }
          if let overview = view.overview { overviewSection(overview) }
          if let focus = view.focus { focusSection(focus) }
          if let activity = view.activity { activitySection(activity) }
        }
        .padding(FirstScreenTokens.Spacing.xl)
      }
      FirstScreenTabBar(tabs: view.tabs, theme: theme, strings: strings, state: state)
    }
  }

  private var intro: some View {
    VStack(alignment: .leading, spacing: 18) {
      Text(view.title).fsText(FirstScreenTokens.Typography.title, theme.palette.textPrimary, theme).accessibilityAddTraits(.isHeader)
      ActionButton(action: view.track.change.action, strings: strings, state: state) { opening in
        AdaptiveRow(large: theme.largeText, spacing: FirstScreenTokens.Spacing.sm) {
          HStack(spacing: FirstScreenTokens.Spacing.sm) {
            FirstScreenIcon(name: view.track.icon, size: 22, color: theme.palette.primary)
              .frame(width: 32, height: 32)
              .background(RoundedRectangle(cornerRadius: 8).fill(theme.palette.accentTeal.opacity(0.08)))
            Text(view.track.label).fsText(FirstScreenTokens.Typography.heading, theme.palette.textPrimary, theme).multilineTextAlignment(.leading)
          }
        } trailing: {
          Text(opening ? strings.opening : view.track.change.label).fsText(size: 13, lineHeight: 18, weight: .semibold, theme.palette.primary, theme)
        }
        .frame(minHeight: 44)
        .contentShape(Rectangle())
      }
      .accessibilityElement(children: .combine)
      .accessibilityLabel("\(view.track.label), \(view.track.change.label)")
    }
  }

  private var decisionCard: some View {
    let d = view.decision
    let p = theme.palette
    return VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.lg) {
      let heading = Group {
        FirstScreenIcon(name: d.icon, size: 24, color: d.muted ? p.textMuted : p.accentTeal)
          .frame(width: 44, height: 44)
          .background(RoundedRectangle(cornerRadius: 14).fill(p.surfaceInput.color))
          .overlay(RoundedRectangle(cornerRadius: 14).stroke(p.choiceActive.color, lineWidth: 1))
        VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.xxs) {
          Text(d.title).fsText(size: 22, lineHeight: 28, weight: .semibold, p.textPrimary, theme, tracking: -0.3).accessibilityAddTraits(.isHeader)
          Text(d.detail).fsText(size: 14, lineHeight: 22, weight: .regular, p.textSecondary, theme)
        }
      }
      if theme.largeText {
        VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.md) { heading }
      } else {
        HStack(alignment: .top, spacing: FirstScreenTokens.Spacing.md) { heading }
      }
      FilledButton(button: d.primary, variant: .decision, theme: theme, strings: strings, state: state, enabled: d.enabled)
      if let secondary = d.secondary {
        LinkButton(button: FirstScreenButton(label: secondary.label, action: secondary.action), size: 14, weight: .semibold, chevron: secondary.chevron, theme: theme, strings: strings, state: state)
          .frame(maxWidth: .infinity)
      }
    }
    .padding(FirstScreenTokens.Spacing.xl)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(RoundedRectangle(cornerRadius: 22).fill(p.surface.color))
    .overlay(alignment: .topLeading) {
      RoundedRectangle(cornerRadius: 2).fill(p.navigationActive.color).frame(width: 3, height: 44).offset(x: -1, y: 19).accessibilityHidden(true)
    }
    .overlay(RoundedRectangle(cornerRadius: 22).stroke(p.navigationActive.color, lineWidth: 1))
    .clipShape(RoundedRectangle(cornerRadius: 22))
  }

  private func secondaryPlan(_ plan: FirstScreenTodayView.SecondaryPlan) -> some View {
    Card(theme: theme) {
      Text(plan.title).fsText(size: 22, lineHeight: 28, weight: .semibold, theme.palette.textPrimary, theme, tracking: -0.3)
      Text(plan.detail).fsText(size: 14, lineHeight: 22, weight: .regular, theme.palette.textSecondary, theme)
      FilledButton(button: plan.button, variant: .secondary, theme: theme, strings: strings, state: state)
    }
  }

  private func goalInvitation(_ goal: FirstScreenTodayView.GoalInvitation) -> some View {
    Card(theme: theme) {
      AdaptiveRow(large: theme.largeText) {
        HStack(alignment: .top, spacing: FirstScreenTokens.Spacing.md) {
          routeTile
          VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.xxs) {
            Text(goal.title).fsText(FirstScreenTokens.Typography.bodyStrong, theme.palette.textPrimary, theme)
            if let detail = goal.detail { Text(detail).fsText(FirstScreenTokens.Typography.body, theme.palette.textSecondary, theme) }
          }
        }
      } trailing: { EmptyView() }
      FilledButton(button: goal.primary, variant: .primary, theme: theme, strings: strings, state: state)
      LinkButton(button: goal.notNow, size: 14, weight: .semibold, theme: theme, strings: strings, state: state).frame(maxWidth: .infinity)
    }
  }

  private var routeTile: some View {
    FirstScreenIcon(name: "route", size: 20, color: theme.palette.accentTeal)
      .frame(width: 40, height: 40)
      .background(RoundedRectangle(cornerRadius: 12).fill(theme.palette.accentTeal.opacity(0.08)))
  }

  private func firstUseState(_ firstUse: FirstScreenTodayView.FirstUse) -> some View {
    Card(theme: theme, radius: 18) {
      HStack(alignment: .top, spacing: FirstScreenTokens.Spacing.md) {
        routeTile
        VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.xxs) {
          Text(firstUse.title).fsText(FirstScreenTokens.Typography.bodyStrong, theme.palette.textPrimary, theme)
          Text(firstUse.detail).fsText(FirstScreenTokens.Typography.body, theme.palette.textSecondary, theme)
        }
      }
    }
    .accessibilityElement(children: .combine)
  }

  private func overviewSection(_ overview: FirstScreenTodayView.Overview) -> some View {
    VStack(alignment: .leading, spacing: 2) {
      SectionLabel(text: overview.label, theme: theme)
      ForEach(Array(overview.rows.enumerated()), id: \.offset) { index, row in
        AdaptiveRow(large: theme.largeText, spacing: FirstScreenTokens.Spacing.sm) {
          Text(row.label).fsText(size: 14, lineHeight: 22, weight: .regular, theme.palette.textSecondary, theme)
        } trailing: {
          Text(row.value).fsText(FirstScreenTokens.Typography.bodyStrong, theme.palette.textPrimary, theme)
            .multilineTextAlignment(theme.largeText ? .leading : .trailing)
        }
        .padding(.vertical, 10)
        .overlay(alignment: .bottom) {
          if index < overview.rows.count - 1 { Rectangle().fill(theme.palette.border.color).frame(height: 1) }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(row.label): \(row.value)")
      }
    }
  }

  private func focusSection(_ focus: FirstScreenTodayView.Focus) -> some View {
    VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.sm) {
      SectionLabel(text: focus.label, theme: theme)
      AdaptiveRow(large: theme.largeText) {
        Text(focus.title).fsText(size: 15, lineHeight: 18, weight: .medium, theme.palette.textPrimary, theme)
      } trailing: {
        LinkButton(button: focus.button, size: 13, weight: .semibold, theme: theme, strings: strings, state: state)
      }
    }
  }

  private func activitySection(_ activity: FirstScreenTodayView.Activity) -> some View {
    VStack(alignment: .leading, spacing: FirstScreenTokens.Spacing.sm) {
      SectionLabel(text: activity.label, theme: theme)
      AdaptiveRow(large: theme.largeText) {
        if let title = activity.title {
          Text(title).fsText(size: 14, lineHeight: 18, weight: .medium, theme.palette.textPrimary, theme)
        } else {
          Text(activity.empty).fsText(FirstScreenTokens.Typography.small, theme.palette.textSecondary, theme)
        }
      } trailing: {
        LinkButton(button: activity.button, size: 13, weight: .semibold, theme: theme, strings: strings, state: state)
      }
      .frame(minHeight: 44)
    }
  }
}

/// RN `BottomTabBar` with Today selected. Other tabs queue `open_tab:<id>`.
private struct FirstScreenTabBar: View {
  let tabs: [FirstScreenTodayView.Tab]
  let theme: FirstScreenTheme
  let strings: FirstScreenNativeStrings
  @ObservedObject var state: FirstScreenState

  var body: some View {
    let p = theme.palette
    HStack(spacing: 0) {
      ForEach(tabs, id: \.id) { tab in
        let active = tab.id == "home"
        let item = VStack(spacing: FirstScreenTokens.Spacing.xxs) {
          RoundedRectangle(cornerRadius: 1).fill(active ? p.navigationActive.color : .clear).frame(width: 20, height: 2)
          FirstScreenIcon(name: tab.icon, size: 24, color: active ? p.navigationActive : p.navigationTextMuted)
          Text(tab.label)
            .fsText(FirstScreenTokens.Typography.navigationLabel, active ? p.navigationTextPrimary : p.navigationTextMuted, theme)
            .lineLimit(1)
            .minimumScaleFactor(0.5)
        }
        .frame(maxWidth: .infinity, minHeight: active ? 48 : 44)
        .padding(.horizontal, FirstScreenTokens.Spacing.xs)
        if active {
          item.accessibilityElement(children: .combine).accessibilityAddTraits([.isButton, .isSelected])
        } else {
          ActionButton(action: "open_tab:\(tab.id)", strings: strings, state: state) { _ in item.contentShape(Rectangle()) }
            .accessibilityLabel(tab.label)
        }
      }
    }
    .background(p.navigationSurface.color.ignoresSafeArea(edges: .bottom))
    .overlay(alignment: .top) { Rectangle().fill(p.navigationBorder.color).frame(height: 1) }
    .shadow(color: p.effectsShadow.opacity(0.14), radius: 7, x: 0, y: -8)
  }
}

// MARK: - Welcome (signed out)

private struct FirstScreenWelcomeScreen: View {
  let view: FirstScreenWelcomeView
  let theme: FirstScreenTheme
  let strings: FirstScreenNativeStrings
  @ObservedObject var state: FirstScreenState

  var body: some View {
    let p = theme.palette
    ScrollContainer {
      VStack(spacing: theme.largeText ? FirstScreenTokens.Spacing.xxxl : 0) {
        VStack(spacing: FirstScreenTokens.Spacing.lg) {
          FirstScreenMark(theme: theme, size: 96)
          Text(view.brand).fsText(size: 36, lineHeight: 44, weight: .bold, p.textPrimary, theme, tracking: -0.6)
          Text(view.title).fsText(size: 30, lineHeight: 38, weight: .bold, p.textPrimary, theme)
            .multilineTextAlignment(.center)
            .padding(.top, FirstScreenTokens.Spacing.xl)
            .accessibilityAddTraits(.isHeader)
          Text(view.detail).fsText(size: 16, lineHeight: 24, weight: .regular, p.textSecondary, theme).multilineTextAlignment(.center)
        }
        if !theme.largeText { Spacer(minLength: FirstScreenTokens.Spacing.xxxl) }
        VStack(spacing: FirstScreenTokens.Spacing.md) {
          entry(view.signIn, fill: p.primary, border: p.primary, label: p.onPrimary, minHeight: 56)
          entry(view.register, fill: p.surface, border: p.border, label: p.textPrimary, minHeight: 56)
          entry(view.guest, fill: nil, border: nil, label: p.primary, minHeight: 44)
        }
      }
      .padding(.horizontal, FirstScreenTokens.Spacing.xl)
      .padding(.top, theme.largeText ? FirstScreenTokens.Spacing.xl : 120)
      .padding(.bottom, theme.largeText ? FirstScreenTokens.Spacing.lg : 34)
      .frame(minHeight: UIScreen.main.bounds.height - 100)
    }
  }

  private func entry(_ button: FirstScreenButton, fill: FirstScreenRGBA?, border: FirstScreenRGBA?, label: FirstScreenRGBA, minHeight: CGFloat) -> some View {
    ActionButton(action: button.action, strings: strings, state: state) { opening in
      HStack(spacing: FirstScreenTokens.Spacing.sm) {
        if opening { ProgressView().tint(label.color).accessibilityHidden(true) }
        Text(opening ? strings.opening : button.label).fsText(size: 16, lineHeight: 22, weight: .semibold, label, theme).multilineTextAlignment(.center)
      }
      .frame(maxWidth: .infinity, minHeight: minHeight * theme.scale)
      .padding(.horizontal, FirstScreenTokens.Spacing.xl)
      .background(RoundedRectangle(cornerRadius: 16).fill(fill?.color ?? .clear))
      .overlay(RoundedRectangle(cornerRadius: 16).stroke(border?.color ?? .clear, lineWidth: 1))
      .contentShape(Rectangle())
    }
  }
}

// MARK: - Neutral and loading

/// RN `PatternlyMark`: mint on dark, navy on light.
private struct FirstScreenMark: View {
  let theme: FirstScreenTheme
  let size: CGFloat
  var body: some View {
    Image(theme.isDark ? "brand-mark-mint" : "brand-mark-navy", bundle: firstScreenResourceBundle)
      .resizable()
      .scaledToFit()
      .frame(width: size, height: size)
      .accessibilityHidden(true)
  }
}

/// No usable record: background, mark and a spinner. Not "usable" in the D19 sense; reported as `kind=neutral`.
private struct FirstScreenNeutralScreen: View {
  let theme: FirstScreenTheme
  let strings: FirstScreenNativeStrings
  var body: some View {
    VStack(spacing: FirstScreenTokens.Spacing.xxl) {
      FirstScreenMark(theme: theme, size: 72)
      ProgressView().tint(theme.palette.textMuted.color)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(strings.loading)
  }
}

/// Shown when React Native has not taken over 10 s after the first frame (design doc §3.2).
private struct FirstScreenLoadingBanner: View {
  let text: String
  let theme: FirstScreenTheme
  var body: some View {
    HStack(spacing: FirstScreenTokens.Spacing.sm) {
      ProgressView().tint(theme.palette.textSecondary.color).accessibilityHidden(true)
      Text(text).fsText(FirstScreenTokens.Typography.caption, theme.palette.textSecondary, theme)
    }
    .padding(.horizontal, FirstScreenTokens.Spacing.md)
    .padding(.vertical, FirstScreenTokens.Spacing.xs)
    .background(Capsule().fill(theme.palette.elevatedSurface.color))
    .overlay(Capsule().stroke(theme.palette.border.color, lineWidth: 1))
    .padding(.top, FirstScreenTokens.Spacing.xs)
    .accessibilityElement(children: .combine)
    .accessibilityAddTraits(.updatesFrequently)
  }
}
