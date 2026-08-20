import AppKit
import Foundation

guard CommandLine.arguments.count >= 2 else {
    fputs("Usage: swift analyzeQAAReference.swift <reference.png> [threshold]\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let threshold = CommandLine.arguments.count > 2 ? Int(CommandLine.arguments[2]) ?? 150 : 150
let printAllRows = CommandLine.arguments.contains("--all")

guard let data = try? Data(contentsOf: inputURL),
      let bitmap = NSBitmapImageRep(data: data) else {
    fputs("Unable to load reference PNG: \(inputURL.path)\n", stderr)
    exit(1)
}

func isMarkPixel(_ x: Int, _ y: Int) -> Bool {
    var pixel = [Int](repeating: 0, count: 4)
    bitmap.getPixel(&pixel, atX: x, y: y)
    let bright = pixel[0] >= threshold && pixel[1] >= threshold && pixel[2] >= threshold
    let mint = pixel[1] >= threshold && pixel[2] >= threshold - 30 && pixel[1] >= pixel[0] + 50
    return bright || mint
}

var markPixels: [(x: Int, y: Int)] = []
for y in 0..<bitmap.pixelsHigh {
    for x in 0..<bitmap.pixelsWide where isMarkPixel(x, y) {
        markPixels.append((x, y))
    }
}

guard let minX = markPixels.map(\.x).min(),
      let maxX = markPixels.map(\.x).max(),
      let minY = markPixels.map(\.y).min(),
      let maxY = markPixels.map(\.y).max() else {
    fputs("No mark pixels found.\n", stderr)
    exit(1)
}

print("size=\(bitmap.pixelsWide)x\(bitmap.pixelsHigh)")
print("bbox=\(minX),\(minY),\(maxX),\(maxY)")
print("width=\(maxX - minX + 1) height=\(maxY - minY + 1)")

let sampleRows = stride(from: minY, through: maxY, by: printAllRows ? 1 : max(1, (maxY - minY) / 16))
for y in sampleRows {
    var runs: [(Int, Int)] = []
    var runStart: Int?
    for x in minX...maxX {
        let on = isMarkPixel(x, y)
        if on, runStart == nil { runStart = x }
        if !on, let start = runStart {
            runs.append((start, x - 1))
            runStart = nil
        }
    }
    if let start = runStart { runs.append((start, maxX)) }
    print("row=\(y) runs=" + runs.map { "\($0.0)-\($0.1)" }.joined(separator: ","))
}

var labels = [Int](repeating: -1, count: bitmap.pixelsWide * bitmap.pixelsHigh)
var componentBoxes: [(label: Int, minX: Int, minY: Int, maxX: Int, maxY: Int, pixels: Int)] = []
var nextLabel = 0
for y in 0..<bitmap.pixelsHigh {
    for x in 0..<bitmap.pixelsWide where isMarkPixel(x, y) && labels[y * bitmap.pixelsWide + x] == -1 {
        var queue: [(Int, Int)] = [(x, y)]
        labels[y * bitmap.pixelsWide + x] = nextLabel
        var cursor = 0
        var componentMinX = x
        var componentMaxX = x
        var componentMinY = y
        var componentMaxY = y
        var componentPixels = 0
        while cursor < queue.count {
            let point = queue[cursor]
            cursor += 1
            componentPixels += 1
            componentMinX = min(componentMinX, point.0)
            componentMaxX = max(componentMaxX, point.0)
            componentMinY = min(componentMinY, point.1)
            componentMaxY = max(componentMaxY, point.1)
            for neighbor in [(point.0 - 1, point.1), (point.0 + 1, point.1), (point.0, point.1 - 1), (point.0, point.1 + 1)] {
                guard neighbor.0 >= 0, neighbor.0 < bitmap.pixelsWide,
                      neighbor.1 >= 0, neighbor.1 < bitmap.pixelsHigh else { continue }
                let index = neighbor.1 * bitmap.pixelsWide + neighbor.0
                if labels[index] == -1 && isMarkPixel(neighbor.0, neighbor.1) {
                    labels[index] = nextLabel
                    queue.append(neighbor)
                }
            }
        }
        componentBoxes.append((nextLabel, componentMinX, componentMinY, componentMaxX, componentMaxY, componentPixels))
        nextLabel += 1
    }
}

print("components=\(componentBoxes.count)")
for component in componentBoxes.sorted(by: { $0.pixels > $1.pixels }) {
    print("component=\(component.label) bbox=\(component.minX),\(component.minY),\(component.maxX),\(component.maxY) pixels=\(component.pixels)")
    if printAllRows {
        for y in component.minY...component.maxY {
            var componentRuns: [(Int, Int)] = []
            var runStart: Int?
            for x in component.minX...component.maxX {
                let isComponentPixel = labels[y * bitmap.pixelsWide + x] == component.label
                if isComponentPixel, runStart == nil { runStart = x }
                if !isComponentPixel, let start = runStart {
                    componentRuns.append((start, x - 1))
                    runStart = nil
                }
            }
            if let start = runStart { componentRuns.append((start, component.maxX)) }
            if !componentRuns.isEmpty {
                print("componentRow=\(component.label):\(y) runs=" + componentRuns.map { "\($0.0)-\($0.1)" }.joined(separator: ","))
            }
        }
    }
}
