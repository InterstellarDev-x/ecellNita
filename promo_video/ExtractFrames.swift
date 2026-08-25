import Foundation
import AVFoundation
import AppKit

guard CommandLine.arguments.count == 3 else {
    fputs("usage: ExtractFrames <video.mp4> <output-directory>\n", stderr)
    exit(2)
}
let asset = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
let out = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

for (index, second) in [0.6, 2.2, 4.7, 7.2, 9.6, 11.8, 14.0, 16.5].enumerated() {
    let image = try generator.copyCGImage(at: CMTime(seconds: second, preferredTimescale: 600), actualTime: nil)
    let bitmap = NSBitmapImageRep(cgImage: image)
    let data = bitmap.representation(using: .png, properties: [:])!
    try data.write(to: out.appendingPathComponent(String(format: "%02d.png", index + 1)))
}
print("extracted 8 preview frames")
