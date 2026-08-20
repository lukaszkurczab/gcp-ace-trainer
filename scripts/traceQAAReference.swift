import AppKit
import Foundation

guard CommandLine.arguments.count >= 2 else {
    fputs("Usage: swift traceQAAReference.swift <reference.png> [threshold]\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let threshold = CommandLine.arguments.count > 2 ? Int(CommandLine.arguments[2]) ?? 150 : 150
let simplifyTolerance = CommandLine.arguments.count > 3 ? Double(CommandLine.arguments[3]) ?? 1.2 : 1.2

guard let data = try? Data(contentsOf: inputURL),
      let bitmap = NSBitmapImageRep(data: data) else {
    fputs("Unable to load reference PNG.\n", stderr)
    exit(1)
}

func isMarkPixel(_ x: Int, _ y: Int) -> Bool {
    var pixel = [Int](repeating: 0, count: 4)
    bitmap.getPixel(&pixel, atX: x, y: y)
    let bright = pixel[0] >= threshold && pixel[1] >= threshold && pixel[2] >= threshold
    let mint = pixel[1] >= threshold && pixel[2] >= threshold - 30 && pixel[1] >= pixel[0] + 50
    return bright || mint
}

let width = bitmap.pixelsWide
let height = bitmap.pixelsHigh
var labels = [Int](repeating: -1, count: width * height)
var componentSizes: [Int: Int] = [:]
var nextLabel = 0

for y in 0..<height {
    for x in 0..<width where isMarkPixel(x, y) && labels[y * width + x] == -1 {
        var queue: [(Int, Int)] = [(x, y)]
        labels[y * width + x] = nextLabel
        var cursor = 0
        while cursor < queue.count {
            let point = queue[cursor]
            cursor += 1
            componentSizes[nextLabel, default: 0] += 1
            for neighbor in [(point.0 - 1, point.1), (point.0 + 1, point.1), (point.0, point.1 - 1), (point.0, point.1 + 1)] {
                guard neighbor.0 >= 0, neighbor.0 < width,
                      neighbor.1 >= 0, neighbor.1 < height else { continue }
                let index = neighbor.1 * width + neighbor.0
                if labels[index] == -1 && isMarkPixel(neighbor.0, neighbor.1) {
                    labels[index] = nextLabel
                    queue.append(neighbor)
                }
            }
        }
        nextLabel += 1
    }
}

struct Point: Hashable {
    let x: Int
    let y: Int
}

struct Edge: Hashable {
    let from: Point
    let to: Point
}

func edges(for label: Int) -> [Edge] {
    var result: [Edge] = []
    for y in 0..<height {
        for x in 0..<width where labels[y * width + x] == label {
            let top = y == 0 || labels[(y - 1) * width + x] != label
            let right = x == width - 1 || labels[y * width + x + 1] != label
            let bottom = y == height - 1 || labels[(y + 1) * width + x] != label
            let left = x == 0 || labels[y * width + x - 1] != label
            if top { result.append(Edge(from: Point(x: x, y: y), to: Point(x: x + 1, y: y))) }
            if right { result.append(Edge(from: Point(x: x + 1, y: y), to: Point(x: x + 1, y: y + 1))) }
            if bottom { result.append(Edge(from: Point(x: x + 1, y: y + 1), to: Point(x: x, y: y + 1))) }
            if left { result.append(Edge(from: Point(x: x, y: y + 1), to: Point(x: x, y: y))) }
        }
    }
    return result
}

func loops(for label: Int) -> [[Point]] {
    let allEdges = edges(for: label)
    var unused = Set(allEdges)
    var outgoing: [Point: [Edge]] = [:]
    for edge in allEdges { outgoing[edge.from, default: []].append(edge) }
    var result: [[Point]] = []

    while let first = unused.first {
        var loop = [first.from]
        var edge = first
        repeat {
            unused.remove(edge)
            loop.append(edge.to)
            let candidates = (outgoing[edge.to] ?? []).filter { unused.contains($0) }
            guard let next = candidates.first else { break }
            edge = next
        } while edge.from != loop[0] && loop.count < allEdges.count + 1
        if loop.count > 3 { result.append(loop) }
    }
    return result
}

func distanceToSegment(_ point: Point, _ start: Point, _ end: Point) -> Double {
    let px = Double(point.x)
    let py = Double(point.y)
    let sx = Double(start.x)
    let sy = Double(start.y)
    let ex = Double(end.x)
    let ey = Double(end.y)
    let dx = ex - sx
    let dy = ey - sy
    if dx == 0 && dy == 0 { return hypot(px - sx, py - sy) }
    let t = max(0, min(1, ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)))
    return hypot(px - (sx + t * dx), py - (sy + t * dy))
}

func simplify(_ points: [Point], tolerance: Double) -> [Point] {
    guard points.count > 3 else { return points }
    let first = points[0]
    var farthestIndex = 1
    var farthestDistance = 0.0
    for index in 1..<(points.count - 1) {
        let distance = hypot(Double(points[index].x - first.x), Double(points[index].y - first.y))
        if distance > farthestDistance {
            farthestDistance = distance
            farthestIndex = index
        }
    }

    func rdp(_ open: ArraySlice<Point>) -> [Point] {
        guard open.count > 2, let first = open.first, let last = open.last else { return Array(open) }
        var maxDistance = 0.0
        var splitIndex: ArraySlice<Point>.Index?
        for index in open.dropFirst().dropLast().indices {
            let distance = distanceToSegment(open[index], first, last)
            if distance > maxDistance {
                maxDistance = distance
                splitIndex = index
            }
        }
        guard let splitIndex, maxDistance > tolerance else { return [first, last] }
        let left = rdp(open[...splitIndex])
        let right = rdp(open[splitIndex...])
        return left.dropLast() + right
    }

    let firstHalf = rdp(points[0...farthestIndex])
    let secondHalf = rdp(points[farthestIndex...])
    return Array(firstHalf.dropLast() + secondHalf.dropLast())
}

let markPoints = labels.enumerated().compactMap { index, label in label >= 0 ? Point(x: index % width, y: index / width) : nil }
let minReferenceX = Double(markPoints.map(\.x).min()!)
let maxReferenceX = Double(markPoints.map(\.x).max()! + 1)
let minReferenceY = Double(markPoints.map(\.y).min()!)
let maxReferenceY = Double(markPoints.map(\.y).max()! + 1)
let scaleX = 208.0 / (maxReferenceX - minReferenceX)
let scaleY = 208.0 / (maxReferenceY - minReferenceY)

func mapped(_ point: Point) -> (Double, Double) {
    (24.0 + (Double(point.x) - minReferenceX) * scaleX,
     24.0 + (Double(point.y) - minReferenceY) * scaleY)
}

func pathData(_ loop: [Point]) -> String {
    let simplified = simplify(loop, tolerance: simplifyTolerance)
    let values = simplified.map(mapped)
    func midpoint(_ first: (Double, Double), _ second: (Double, Double)) -> (Double, Double) {
        ((first.0 + second.0) / 2, (first.1 + second.1) / 2)
    }
    let start = midpoint(values[0], values[values.count - 1])
    var path = "M\(String(format: "%.2f", start.0)) \(String(format: "%.2f", start.1))"
    for index in values.indices {
        let control = values[index]
        let end = midpoint(values[(index + 1) % values.count], values[index])
        path += " Q\(String(format: "%.2f", control.0)) \(String(format: "%.2f", control.1)) \(String(format: "%.2f", end.0)) \(String(format: "%.2f", end.1))"
    }
    return path + " Z"
}

let labelsBySize = componentSizes.keys.sorted { componentSizes[$0]! > componentSizes[$1]! }
for (index, label) in labelsBySize.enumerated() {
    guard let largestLoop = loops(for: label).max(by: { $0.count < $1.count }) else { continue }
    print("component_\(index + 1) size=\(componentSizes[label]!) points=\(largestLoop.count)")
    print(pathData(largestLoop))
}
