import Foundation
import AVFoundation
import CoreVideo

guard CommandLine.arguments.count == 5,
      let width = Int(CommandLine.arguments[1]),
      let height = Int(CommandLine.arguments[2]),
      let fps = Int32(CommandLine.arguments[3]) else {
    fputs("usage: RawVideoEncoder <width> <height> <fps> <output.mp4>\n", stderr)
    exit(2)
}

let outputURL = URL(fileURLWithPath: CommandLine.arguments[4])
try? FileManager.default.removeItem(at: outputURL)

let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 10_000_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoExpectedSourceFrameRateKey: fps
    ]
]

let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
        kCVPixelBufferIOSurfacePropertiesKey as String: [:]
    ]
)

guard writer.canAdd(input) else {
    fputs("cannot add video input\n", stderr)
    exit(3)
}
writer.add(input)
guard writer.startWriting() else {
    fputs("failed to start writer: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(4)
}
writer.startSession(atSourceTime: .zero)

let frameBytes = width * height * 4
let stdin = FileHandle.standardInput
var frameIndex: Int64 = 0

while true {
    var payload = Data()
    payload.reserveCapacity(frameBytes)
    while payload.count < frameBytes {
        let chunk = stdin.readData(ofLength: frameBytes - payload.count)
        if chunk.isEmpty { break }
        payload.append(chunk)
    }
    if payload.isEmpty { break }
    if payload.count != frameBytes {
        fputs("incomplete final frame\n", stderr)
        exit(5)
    }

    while !input.isReadyForMoreMediaData { usleep(1_000) }

    var pixelBuffer: CVPixelBuffer?
    let status = CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pixelBuffer)
    guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
        fputs("failed to allocate pixel buffer\n", stderr)
        exit(6)
    }

    CVPixelBufferLockBaseAddress(buffer, [])
    let destination = CVPixelBufferGetBaseAddress(buffer)!
    let destinationStride = CVPixelBufferGetBytesPerRow(buffer)
    payload.withUnsafeBytes { source in
        guard let sourceBase = source.baseAddress else { return }
        for row in 0..<height {
            memcpy(destination.advanced(by: row * destinationStride),
                   sourceBase.advanced(by: row * width * 4),
                   width * 4)
        }
    }
    CVPixelBufferUnlockBaseAddress(buffer, [])

    let time = CMTime(value: frameIndex, timescale: fps)
    guard adaptor.append(buffer, withPresentationTime: time) else {
        fputs("failed to append frame \(frameIndex): \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
        exit(7)
    }
    frameIndex += 1
}

input.markAsFinished()
let semaphore = DispatchSemaphore(value: 0)
writer.finishWriting { semaphore.signal() }
semaphore.wait()

guard writer.status == .completed else {
    fputs("writer failed: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(8)
}
print("encoded \(frameIndex) frames")
