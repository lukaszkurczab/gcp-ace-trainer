import AppKit
import Foundation

guard CommandLine.arguments.count == 4 else {
    fputs("Usage: swift renderBrandAssets.swift <input.svg> <output.png> <pixel-size>\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
guard let pixelSize = Int(CommandLine.arguments[3]), pixelSize > 0 else {
    fputs("pixel-size must be a positive integer.\n", stderr)
    exit(2)
}

guard let sourceImage = NSImage(contentsOf: inputURL) else {
    fputs("Unable to load SVG: \(inputURL.path)\n", stderr)
    exit(1)
}

let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: pixelSize,
    pixelsHigh: pixelSize,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bitmapFormat: [],
    bytesPerRow: 0,
    bitsPerPixel: 0
)
guard let bitmap else {
    fputs("Unable to create bitmap.\n", stderr)
    exit(1)
}

bitmap.size = NSSize(width: pixelSize, height: pixelSize)
guard let graphicsContext = NSGraphicsContext(bitmapImageRep: bitmap) else {
    fputs("Unable to create graphics context.\n", stderr)
    exit(1)
}

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = graphicsContext
graphicsContext.imageInterpolation = .high
sourceImage.draw(in: NSRect(x: 0, y: 0, width: pixelSize, height: pixelSize), from: .zero, operation: .sourceOver, fraction: 1)
graphicsContext.flushGraphics()
NSGraphicsContext.restoreGraphicsState()

guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
    fputs("Unable to encode PNG.\n", stderr)
    exit(1)
}

do {
    try pngData.write(to: outputURL, options: .atomic)
} catch {
    fputs("Unable to write PNG: \(error)\n", stderr)
    exit(1)
}
