// Gate check CLI for `scripts/firstScreenNativeGate.test.ts`.
// Input (argv[1]): JSON array of cases { name, nowMs, values: { record, logoutControl, registryA, registryB,
// manifestA, manifestB } (strings or null), slots: [mmkv ids that exist] }.
// Output (stdout): JSON array of { name, kind, reason, profileId, primary }.
import Foundation

struct CaseValues: Decodable {
  let record: String?
  let logoutControl: String?
  let registryA: String?
  let registryB: String?
  let manifestA: String?
  let manifestB: String?
}

struct GateCase: Decodable {
  let name: String
  let nowMs: Double
  let values: CaseValues
  let slots: [String]
}

func data(_ value: String?) -> Data? { value.map { Data($0.utf8) } }

let input = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
let cases = try JSONDecoder().decode([GateCase].self, from: input)
var output: [[String: Any]] = []
for item in cases {
  let values = FirstScreenStoredValues(record: data(item.values.record), logoutControl: data(item.values.logoutControl),
    registryA: data(item.values.registryA), registryB: data(item.values.registryB),
    manifestA: data(item.values.manifestA), manifestB: data(item.values.manifestB))
  let decision = decideFirstScreen(source: FirstScreenFixedSource(values: values, existingSlots: Set(item.slots)), nowMs: item.nowMs)
  var row: [String: Any] = ["name": item.name, "kind": decision.kind, "reason": NSNull(), "profileId": NSNull(), "primary": NSNull()]
  switch decision {
  case .today(let record):
    row["profileId"] = record.profileId
    row["primary"] = record.view.decision.primary.label
  case .welcome(let record):
    row["primary"] = record.view.signIn.label
  case .neutral(let reason, _):
    row["reason"] = reason
  }
  output.append(row)
}
let encoded = try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys])
FileHandle.standardOutput.write(encoded)
