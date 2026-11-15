// T2.5 (D18 path (i)): the first-screen record, as written by React Native
// (`src/application/bootstrap/firstScreenRecord.ts`). Field names and nullability mirror the TS types exactly.
// D23: one schema, exact match, no migration. Anything that does not decode is treated as absent.
import Foundation

public let firstScreenSchema = 2
/// Same bound as `FIRST_SCREEN_MAX_BYTES`; a larger value is never decoded.
public let firstScreenMaxBytes = 16 * 1024

public struct FirstScreenButton: Decodable, Equatable {
  public let label: String
  /// One of `FirstScreenActionId`; React Native maps it back to the Home handler.
  public let action: String
}

public struct FirstScreenChevronButton: Decodable, Equatable {
  public let label: String
  public let action: String
  public let chevron: Bool
}

public struct FirstScreenTodayView: Decodable, Equatable {
  public struct Track: Decodable, Equatable { public let label: String; public let icon: String; public let change: FirstScreenButton }
  public struct Decision: Decodable, Equatable {
    public let icon: String
    public let title: String
    public let detail: String
    public let primary: FirstScreenButton
    public let enabled: Bool
    public let muted: Bool
    public let secondary: FirstScreenChevronButton?
  }
  public struct SecondaryPlan: Decodable, Equatable { public let title: String; public let detail: String; public let button: FirstScreenButton }
  public struct GoalInvitation: Decodable, Equatable { public let title: String; public let detail: String?; public let primary: FirstScreenButton; public let notNow: FirstScreenButton }
  public struct FirstUse: Decodable, Equatable { public let title: String; public let detail: String }
  public struct Row: Decodable, Equatable { public let label: String; public let value: String }
  public struct Overview: Decodable, Equatable { public let label: String; public let rows: [Row] }
  public struct Focus: Decodable, Equatable { public let label: String; public let title: String; public let button: FirstScreenButton }
  public struct Activity: Decodable, Equatable { public let label: String; public let title: String?; public let empty: String; public let button: FirstScreenButton }
  public struct Tab: Decodable, Equatable { public let id: String; public let label: String; public let icon: String }

  public let title: String
  public let track: Track
  public let decision: Decision
  public let secondaryPlan: SecondaryPlan?
  public let goalInvitation: GoalInvitation?
  public let firstUse: FirstUse?
  public let overview: Overview?
  public let focus: Focus?
  public let activity: Activity?
  public let tabs: [Tab]
  public let loading: String
}

public struct FirstScreenWelcomeView: Decodable, Equatable {
  public let brand: String
  public let title: String
  public let detail: String
  public let signIn: FirstScreenButton
  public let register: FirstScreenButton
  public let guest: FirstScreenButton
  public let loading: String
}

public enum FirstScreenAppearance: String, Decodable, Equatable { case system, light, dark }

public struct FirstScreenTodayRecord: Equatable {
  public let locale: String
  public let appearance: FirstScreenAppearance
  public let capturedAt: String
  public let validUntilMs: Double
  public let profileId: String
  public let actor: String
  public let revision: String
  public let view: FirstScreenTodayView
}

public struct FirstScreenWelcomeRecord: Equatable {
  public let locale: String
  public let appearance: FirstScreenAppearance
  public let capturedAt: String
  public let validUntilMs: Double
  public let view: FirstScreenWelcomeView
}

public enum FirstScreenRecord: Equatable {
  case today(FirstScreenTodayRecord)
  case welcome(FirstScreenWelcomeRecord)

  public var validUntilMs: Double {
    switch self {
    case .today(let record): return record.validUntilMs
    case .welcome(let record): return record.validUntilMs
    }
  }

  public var locale: String {
    switch self {
    case .today(let record): return record.locale
    case .welcome(let record): return record.locale
    }
  }

  public var appearance: FirstScreenAppearance {
    switch self {
    case .today(let record): return record.appearance
    case .welcome(let record): return record.appearance
    }
  }
}

private struct Envelope: Decodable {
  let schema: Int
  let kind: String
}

private struct TodayWire: Decodable {
  let schema: Int; let kind: String; let locale: String; let appearance: FirstScreenAppearance
  let capturedAt: String; let validUntilMs: Double; let profileId: String; let actor: String; let revision: String
  let view: FirstScreenTodayView
}

private struct WelcomeWire: Decodable {
  let schema: Int; let kind: String; let locale: String; let appearance: FirstScreenAppearance
  let capturedAt: String; let validUntilMs: Double
  let view: FirstScreenWelcomeView
}

public enum FirstScreenRecordProblem: String, Error, Equatable {
  case absent, tooLarge = "too_large", schema, malformed
}

/// Decodes the stored value. Never throws: every failure is a reason for the neutral screen.
public func decodeFirstScreenRecord(_ data: Data?) -> Result<FirstScreenRecord, FirstScreenRecordProblem> {
  guard let data, !data.isEmpty else { return .failure(.absent) }
  guard data.count <= firstScreenMaxBytes else { return .failure(.tooLarge) }
  let decoder = JSONDecoder()
  guard let envelope = try? decoder.decode(Envelope.self, from: data) else { return .failure(.malformed) }
  guard envelope.schema == firstScreenSchema else { return .failure(.schema) }
  switch envelope.kind {
  case "today":
    guard let wire = try? decoder.decode(TodayWire.self, from: data), !wire.profileId.isEmpty else { return .failure(.malformed) }
    return .success(.today(FirstScreenTodayRecord(locale: wire.locale, appearance: wire.appearance, capturedAt: wire.capturedAt,
      validUntilMs: wire.validUntilMs, profileId: wire.profileId, actor: wire.actor, revision: wire.revision, view: wire.view)))
  case "welcome":
    guard let wire = try? decoder.decode(WelcomeWire.self, from: data) else { return .failure(.malformed) }
    return .success(.welcome(FirstScreenWelcomeRecord(locale: wire.locale, appearance: wire.appearance, capturedAt: wire.capturedAt,
      validUntilMs: wire.validUntilMs, view: wire.view)))
  default:
    return .failure(.malformed)
  }
}
