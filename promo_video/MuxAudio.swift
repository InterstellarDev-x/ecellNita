import Foundation
import AVFoundation

guard CommandLine.arguments.count == 4 else {
    fputs("usage: MuxAudio <video.mp4> <audio.wav> <output.mp4>\n", stderr)
    exit(2)
}

let videoURL = URL(fileURLWithPath: CommandLine.arguments[1])
let audioURL = URL(fileURLWithPath: CommandLine.arguments[2])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[3])
try? FileManager.default.removeItem(at: outputURL)

let videoAsset = AVURLAsset(url: videoURL)
let audioAsset = AVURLAsset(url: audioURL)
let composition = AVMutableComposition()

guard let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
      let sourceAudio = audioAsset.tracks(withMediaType: .audio).first,
      let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
      let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
    fputs("missing audio or video track\n", stderr)
    exit(3)
}

let duration = videoAsset.duration
try videoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: sourceVideo, at: .zero)
videoTrack.preferredTransform = sourceVideo.preferredTransform
let audioDuration = CMTimeMinimum(audioAsset.duration, duration)
try audioTrack.insertTimeRange(CMTimeRange(start: .zero, duration: audioDuration), of: sourceAudio, at: .zero)

guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
    fputs("could not create exporter\n", stderr)
    exit(4)
}
exporter.outputURL = outputURL
exporter.outputFileType = .mp4
exporter.shouldOptimizeForNetworkUse = true

let semaphore = DispatchSemaphore(value: 0)
exporter.exportAsynchronously { semaphore.signal() }
semaphore.wait()

guard exporter.status == .completed else {
    fputs("export failed: \(exporter.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(5)
}
print("muxed final reel")
