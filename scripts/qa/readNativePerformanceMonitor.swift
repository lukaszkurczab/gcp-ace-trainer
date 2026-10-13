import Foundation
import Vision
import CoreML
import ImageIO
import CryptoKit

enum MonitorFailure: String, Error {
    case arguments, privatePath = "private_path", image, cpu, recognition, labels, reading, confidence
}

struct MonitorToken {
    let text: String
    let confidence: Float
    let x: Double
    let y: Double
}

struct MonitorReading: Equatable {
    let footprintMB: Double
    let uiFPS: Int
    let jsFPS: Int
}

// These coordinates are local to the observed Vision ROI. Bind every number to
// its labeled column; JSC and Views are deliberately excluded.
func parseMonitor(_ tokens: [MonitorToken]) throws -> MonitorReading {
    guard tokens.count <= 128 else { throw MonitorFailure.reading }
    func column(_ label: String, _ range: ClosedRange<Double>) throws -> Double {
        let labels = tokens.filter { $0.text == label }
        guard labels.count == 1, range.contains(labels[0].x), labels[0].y >= 0.55 else { throw MonitorFailure.labels }
        guard labels[0].confidence >= 0.9 else { throw MonitorFailure.confidence }
        let numbers = tokens.filter {
            range.contains($0.x) && (0.25...0.55).contains($0.y)
                && $0.text.range(of: "^[0-9]+(?:\\.[0-9]+)?$", options: .regularExpression) != nil
        }
        guard numbers.count == 1, let value = Double(numbers[0].text), value.isFinite else { throw MonitorFailure.reading }
        guard numbers[0].confidence >= 0.9 else { throw MonitorFailure.confidence }
        return value
    }
    let ram = try column("RAM", 0.02...0.18)
    let ui = try column("UI", 0.61...0.77)
    let js = try column("JS", 0.81...0.97)
    guard ram > 0, ram <= 16384, (0...240).contains(ui), (0...240).contains(js), ui.rounded() == ui, js.rounded() == js else { throw MonitorFailure.reading }
    return MonitorReading(footprintMB: ram, uiFPS: Int(ui), jsFPS: Int(js))
}

func readMonitorImage(_ input: String) throws -> [String: Any] {
    let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
        .appendingPathComponent("artifacts/private/perf06-native-20261013", isDirectory: true).resolvingSymlinksInPath()
    let url = URL(fileURLWithPath: input).standardizedFileURL.resolvingSymlinksInPath()
    guard url.path.hasPrefix(root.path + "/"), url.pathExtension == "png" else { throw MonitorFailure.privatePath }
    guard let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
          attributes[.type] as? FileAttributeType == .typeRegular,
          let size = attributes[.size] as? NSNumber, size.intValue > 0, size.intValue <= 10 * 1024 * 1024,
          let data = try? Data(contentsOf: url), let source = CGImageSourceCreateWithData(data as CFData, nil),
          CGImageSourceGetType(source) as String? == "public.png", CGImageSourceGetCount(source) == 1,
          let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
          (properties[kCGImagePropertyPixelWidth] as? NSNumber)?.intValue == 1206,
          (properties[kCGImagePropertyPixelHeight] as? NSNumber)?.intValue == 2622,
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil),
          image.width == 1206, image.height == 2622 else { throw MonitorFailure.image }
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    request.recognitionLanguages = ["en-US"]
    // Vision uses a bottom-left origin: this is the observed monitor's top strip.
    request.regionOfInterest = CGRect(x: 0, y: 0.87, width: 0.56, height: 0.07)
    do {
        let stages = try request.supportedComputeStageDevices
        guard !stages.isEmpty else { throw MonitorFailure.cpu }
        for (stage, devices) in stages {
            guard let cpu = devices.first(where: { if case .cpu = $0 { return true }; return false }) else { throw MonitorFailure.cpu }
            request.setComputeDevice(cpu, for: stage)
        }
    } catch { throw MonitorFailure.cpu }
    do { try VNImageRequestHandler(cgImage: image).perform([request]) }
    catch { throw MonitorFailure.recognition }
    let results = request.results ?? []
    guard results.count <= 128 else { throw MonitorFailure.reading }
    let tokens = try results.map { item -> MonitorToken in
        guard let candidate = item.topCandidates(1).first, candidate.string.count <= 32 else { throw MonitorFailure.reading }
        return MonitorToken(text: candidate.string, confidence: candidate.confidence, x: item.boundingBox.midX, y: item.boundingBox.midY)
    }
    let reading = try parseMonitor(tokens)
    return [
        "schema": "patternly.perf06.native-monitor-reading.v1",
        "imageSha256": SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined(),
        "nativePhysFootprintMB": reading.footprintMB, "uiCallbackFPS": reading.uiFPS, "jsCallbackFPS": reading.jsFPS,
        "scope": "Displayed native monitor readings: TASK_VM_INFO.phys_footprint in MiB and recent approximately one-second CADisplayLink callback rates. Not ps RSS, instantaneous/presented frames, hitch count or process peak."
    ]
}

#if !PERF06_MONITOR_LIBRARY
@main
struct MonitorReader {
    static func main() {
        do {
            guard CommandLine.arguments.count == 2 else { throw MonitorFailure.arguments }
            let result = try readMonitorImage(CommandLine.arguments[1])
            let data = try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys])
            print(String(decoding: data, as: UTF8.self))
        } catch {
            let category = (error as? MonitorFailure)?.rawValue ?? "reader_failed"
            // No OCR text, input paths, framework errors or runtime payloads.
            fputs("{\"error\":\"monitor_reading_unavailable\",\"stage\":\"\(category)\"}\n", stderr)
            exit(1)
        }
    }
}
#endif
