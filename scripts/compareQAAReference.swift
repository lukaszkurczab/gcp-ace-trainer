import AppKit
import Foundation

guard CommandLine.arguments.count == 4 else {
    fputs("Usage: swift compareQAAReference.swift <reference.png> <candidate.png> <output-prefix>\n", stderr)
    exit(2)
}

let referenceURL = URL(fileURLWithPath: CommandLine.arguments[1])
let candidateURL = URL(fileURLWithPath: CommandLine.arguments[2])
let outputPrefix = CommandLine.arguments[3]
let threshold = 150

guard let referenceData = try? Data(contentsOf: referenceURL),
      let reference = NSBitmapImageRep(data: referenceData),
      let candidateData = try? Data(contentsOf: candidateURL),
      let candidate = NSBitmapImageRep(data: candidateData) else {
    fputs("Unable to load comparison images.\n", stderr)
    exit(1)
}

struct Mask {
    let width: Int
    let height: Int
    let pixels: [Bool]
    let minX: Int
    let minY: Int
    let maxX: Int
    let maxY: Int

    var boundsWidth: Int { maxX - minX + 1 }
    var boundsHeight: Int { maxY - minY + 1 }
}

func isMarkPixel(_ bitmap: NSBitmapImageRep, _ x: Int, _ y: Int) -> Bool {
    var pixel = [Int](repeating: 0, count: 4)
    bitmap.getPixel(&pixel, atX: x, y: y)
    let bright = pixel[0] >= threshold && pixel[1] >= threshold && pixel[2] >= threshold
    let mint = pixel[1] >= threshold && pixel[2] >= threshold - 30 && pixel[1] >= pixel[0] + 50
    return bright || mint
}

func makeMask(_ bitmap: NSBitmapImageRep) -> Mask {
    var pixels = [Bool](repeating: false, count: bitmap.pixelsWide * bitmap.pixelsHigh)
    var points: [(Int, Int)] = []
    for y in 0..<bitmap.pixelsHigh {
        for x in 0..<bitmap.pixelsWide where isMarkPixel(bitmap, x, y) {
            pixels[y * bitmap.pixelsWide + x] = true
            points.append((x, y))
        }
    }
    guard let minX = points.map(\.0).min(),
          let maxX = points.map(\.0).max(),
          let minY = points.map(\.1).min(),
          let maxY = points.map(\.1).max() else {
        fatalError("Comparison image does not contain a detectable mark")
    }
    return Mask(width: bitmap.pixelsWide, height: bitmap.pixelsHigh, pixels: pixels, minX: minX, minY: minY, maxX: maxX, maxY: maxY)
}

let referenceMask = makeMask(reference)
let candidateMask = makeMask(candidate)
let canvasSize = 640
let targetWidth = 520.0
let canvasCenter = Double(canvasSize) / 2

func normalizedSourcePoint(_ mask: Mask, x: Int, y: Int) -> (Int, Int)? {
    let scale = targetWidth / Double(mask.boundsWidth)
    let originX = canvasCenter - targetWidth / 2
    let originY = canvasCenter - Double(mask.boundsHeight) * scale / 2
    let sourceX = Int(((Double(x) - originX) / scale + Double(mask.minX)).rounded())
    let sourceY = Int(((Double(y) - originY) / scale + Double(mask.minY)).rounded())
    guard sourceX >= 0, sourceX < mask.width, sourceY >= 0, sourceY < mask.height else { return nil }
    return (sourceX, sourceY)
}

func makeBitmap() -> NSBitmapImageRep {
    NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: canvasSize,
        pixelsHigh: canvasSize,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bitmapFormat: [],
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
}

func write(_ bitmap: NSBitmapImageRep, to path: String) {
    guard let data = bitmap.representation(using: .png, properties: [:]) else {
        fatalError("Unable to encode \(path)")
    }
    try! data.write(to: URL(fileURLWithPath: path), options: .atomic)
}

func setPixel(_ bitmap: NSBitmapImageRep, _ color: [Int], x: Int, y: Int) {
    var color = color
    bitmap.setPixel(&color, atX: x, y: y)
}

let referenceOutput = makeBitmap()
let candidateOutput = makeBitmap()
let overlayOutput = makeBitmap()
let differenceOutput = makeBitmap()
var referenceCount = 0
var candidateCount = 0
var intersectionCount = 0
var unionCount = 0

for y in 0..<canvasSize {
    for x in 0..<canvasSize {
        setPixel(referenceOutput, [10, 19, 36, 255], x: x, y: y)
        setPixel(candidateOutput, [10, 19, 36, 255], x: x, y: y)
        setPixel(overlayOutput, [10, 19, 36, 255], x: x, y: y)
        setPixel(differenceOutput, [10, 19, 36, 255], x: x, y: y)
    }
}

for y in 0..<canvasSize {
    for x in 0..<canvasSize {
        guard let source = normalizedSourcePoint(referenceMask, x: x, y: y),
              referenceMask.pixels[source.1 * referenceMask.width + source.0] else { continue }
        referenceCount += 1
        setPixel(referenceOutput, [247, 246, 243, 255], x: x, y: y)
        setPixel(overlayOutput, [247, 246, 243, 255], x: x, y: y)
    }
}

for y in 0..<canvasSize {
    for x in 0..<canvasSize {
        guard let source = normalizedSourcePoint(candidateMask, x: x, y: y),
              candidateMask.pixels[source.1 * candidateMask.width + source.0] else { continue }
        candidateCount += 1
        setPixel(candidateOutput, [25, 206, 160, 255], x: x, y: y)
        let existing = overlayOutput.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB)
        if let existing, existing.redComponent > 0.7, existing.greenComponent > 0.7 {
            setPixel(overlayOutput, [255, 196, 90, 255], x: x, y: y)
        } else {
            setPixel(overlayOutput, [25, 206, 160, 255], x: x, y: y)
        }
    }
}

for y in 0..<canvasSize {
    for x in 0..<canvasSize {
        let referencePixel = referenceOutput.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB)
        let candidatePixel = candidateOutput.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB)
        let referenceOn = (referencePixel?.redComponent ?? 0) > 0.7
        let candidateOn = (candidatePixel?.greenComponent ?? 0) > 0.5
        if referenceOn && candidateOn { intersectionCount += 1 }
        if referenceOn || candidateOn { unionCount += 1 }
        if referenceOn && !candidateOn {
            setPixel(differenceOutput, [255, 90, 90, 255], x: x, y: y)
        } else if !referenceOn && candidateOn {
            setPixel(differenceOutput, [25, 206, 160, 255], x: x, y: y)
        } else if referenceOn && candidateOn {
            setPixel(differenceOutput, [247, 246, 243, 255], x: x, y: y)
        }
    }
}

write(referenceOutput, to: "\(outputPrefix)-reference-normalized.png")
write(candidateOutput, to: "\(outputPrefix)-candidate-normalized.png")
write(overlayOutput, to: "\(outputPrefix)-overlay.png")
write(differenceOutput, to: "\(outputPrefix)-difference.png")

print("reference_bbox=\(referenceMask.minX),\(referenceMask.minY),\(referenceMask.maxX),\(referenceMask.maxY)")
print("candidate_bbox=\(candidateMask.minX),\(candidateMask.minY),\(candidateMask.maxX),\(candidateMask.maxY)")
print("normalized_pixels=reference:\(referenceCount),candidate:\(candidateCount),intersection:\(intersectionCount),union:\(unionCount),iou:\(String(format: "%.4f", Double(intersectionCount) / Double(max(1, unionCount))))")
