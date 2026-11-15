// T2.5 stage 3: maps the generated tokens (FirstScreenTokens.swift) to SwiftUI.
// Text follows Dynamic Type like React Native does (`fontScale`, capped by `maxFontSizeMultiplier={2}`),
// and switches to the stacked "large text" layouts at the same threshold as RN (fontScale ≥ 1.3).
import SwiftUI
import UIKit

extension FirstScreenRGBA {
  var color: Color { Color(.sRGB, red: r / 255, green: g / 255, blue: b / 255, opacity: a) }
  func opacity(_ value: Double) -> Color { Color(.sRGB, red: r / 255, green: g / 255, blue: b / 255, opacity: a * value) }
}

/// Font scale of the current content size category, as React Native reports it, capped at 2.
func firstScreenFontScale(_ category: UIContentSizeCategory) -> CGFloat {
  let metrics = UIFontMetrics(forTextStyle: .body)
  let traits = UITraitCollection(preferredContentSizeCategory: category)
  return min(2, metrics.scaledValue(for: 17, compatibleWith: traits) / 17)
}

struct FirstScreenTheme {
  let palette: FirstScreenPalette
  let scale: CGFloat
  var largeText: Bool { scale >= 1.3 }

  static func resolve(appearance: FirstScreenAppearance?, system: ColorScheme, category: UIContentSizeCategory) -> FirstScreenTheme {
    let dark: Bool
    switch appearance {
    case .light: dark = false
    case .dark: dark = true
    case .system, .none: dark = system == .dark
    }
    return FirstScreenTheme(palette: dark ? FirstScreenTokens.dark : FirstScreenTokens.light, scale: firstScreenFontScale(category))
  }

  var isDark: Bool { palette == FirstScreenTokens.dark }
}

private func firstScreenFontWeight(_ name: String) -> Font.Weight {
  switch name {
  case "bold": return .bold
  case "semibold": return .semibold
  case "medium": return .medium
  default: return .regular
  }
}

/// RN text: size, line height and weight from the tokens, scaled like `fontScale`.
struct FirstScreenText: ViewModifier {
  let size: Double
  let lineHeight: Double
  let weight: Font.Weight
  let color: Color
  let tracking: Double
  let scale: CGFloat

  func body(content: Content) -> some View {
    let fontSize = CGFloat(size) * scale
    // UIKit's system font line height is ~1.2 × size; RN's fixed lineHeight adds the rest as spacing.
    let spacing = max(0, CGFloat(lineHeight) * scale - fontSize * 1.2)
    content
      .font(.system(size: fontSize, weight: weight))
      .tracking(CGFloat(tracking))
      .lineSpacing(spacing)
      .padding(.vertical, spacing / 2)
      .foregroundColor(color)
      .fixedSize(horizontal: false, vertical: true)
  }
}

extension View {
  func fsText(_ style: FirstScreenTextStyle, _ color: FirstScreenRGBA, _ theme: FirstScreenTheme, tracking: Double = 0) -> some View {
    modifier(FirstScreenText(size: style.size, lineHeight: style.lineHeight, weight: firstScreenFontWeight(style.weight), color: color.color, tracking: tracking, scale: theme.scale))
  }

  func fsText(size: Double, lineHeight: Double, weight: Font.Weight, _ color: FirstScreenRGBA, _ theme: FirstScreenTheme, tracking: Double = 0) -> some View {
    modifier(FirstScreenText(size: size, lineHeight: lineHeight, weight: weight, color: color.color, tracking: tracking, scale: theme.scale))
  }
}

/// RN `Icon`: the same SVGs (generated asset catalog), tinted, never read by VoiceOver.
struct FirstScreenIcon: View {
  let name: String
  let size: CGFloat
  let color: FirstScreenRGBA

  var body: some View {
    Image("icon-\(name)", bundle: firstScreenResourceBundle)
      .renderingMode(.template)
      .resizable()
      .scaledToFit()
      .frame(width: size, height: size)
      .foregroundColor(color.color)
      .accessibilityHidden(true)
  }
}

/// The pod ships its asset catalog in a resource bundle named `PatternlyFirstScreen`.
let firstScreenResourceBundle: Bundle = {
  let host = Bundle(for: FirstScreenBundleToken.self)
  if let url = host.url(forResource: "PatternlyFirstScreen", withExtension: "bundle"), let bundle = Bundle(url: url) { return bundle }
  return host
}()

private final class FirstScreenBundleToken {}
