import Foundation

@main
struct MonitorParserTests {
    static func main() throws {
        let tokens = [
            MonitorToken(text: "RAM", confidence: 1, x: 0.095, y: 0.65),
            MonitorToken(text: "326.07", confidence: 1, x: 0.098, y: 0.41),
            MonitorToken(text: "JSC", confidence: 1, x: 0.29, y: 0.65),
            MonitorToken(text: "0.00", confidence: 1, x: 0.29, y: 0.41),
            MonitorToken(text: "UI", confidence: 1, x: 0.686, y: 0.71),
            MonitorToken(text: "60", confidence: 1, x: 0.685, y: 0.36),
            MonitorToken(text: "JS", confidence: 1, x: 0.873, y: 0.71),
            MonitorToken(text: "60", confidence: 1, x: 0.879, y: 0.36)
        ]
        guard try parseMonitor(tokens) == MonitorReading(footprintMB: 326.07, uiFPS: 60, jsFPS: 60) else { fatalError("column_binding_failed") }
        func reject(_ value: [MonitorToken], _ expected: MonitorFailure) throws {
            do { _ = try parseMonitor(value) }
            catch let failure as MonitorFailure { guard failure == expected else { fatalError("wrong_failure_category") }; return }
            fatalError("invalid_reading_accepted")
        }
        try reject(tokens.filter { $0.text != "JS" }, .labels)
        try reject(tokens + [tokens[4]], .labels)
        try reject(tokens + [MonitorToken(text: "30", confidence: 1, x: 0.69, y: 0.4)], .reading)
        try reject(tokens.map { $0.text == "UI" ? MonitorToken(text: $0.text, confidence: 0.8, x: $0.x, y: $0.y) : $0 }, .confidence)
        try reject(tokens.map { $0.text == "326.07" ? MonitorToken(text: "NaN", confidence: 1, x: $0.x, y: $0.y) : $0 }, .reading)
        try reject(tokens.map { $0.text == "60" ? MonitorToken(text: "241", confidence: 1, x: $0.x, y: $0.y) : $0 }, .reading)
        try reject(tokens.map { $0.text == "UI" ? MonitorToken(text: $0.text, confidence: 1, x: 0.29, y: $0.y) : $0 }, .labels)
        let stalled = tokens.map { $0.text == "60" ? MonitorToken(text: "0", confidence: 1, x: $0.x, y: $0.y) : $0 }
        guard try parseMonitor(stalled).uiFPS == 0, try parseMonitor(stalled).jsFPS == 0 else { fatalError("stall_hidden") }
        print("monitor_parser_checks: 9 PASS")
    }
}
