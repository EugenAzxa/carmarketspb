import Foundation
import Vision
import CoreImage
// For each image: print file, image height, tallest human bbox height in px, count of humans
for path in CommandLine.arguments.dropFirst() {
    guard let ci = CIImage(contentsOf: URL(fileURLWithPath: path)) else { continue }
    let req = VNDetectHumanRectanglesRequest()
    req.upperBodyOnly = false
    let h = VNImageRequestHandler(ciImage: ci)
    try? h.perform([req])
    let rs = req.results ?? []
    let best = rs.map { $0.boundingBox.height * ci.extent.height }.max() ?? 0
    let bw = rs.map { $0.boundingBox.width * ci.extent.width }.max() ?? 0
    if rs.count > 0 { print("\(path.split(separator: "/").last!) \(Int(ci.extent.width))x\(Int(ci.extent.height)) n=\(rs.count) h=\(Int(best)) w=\(Int(bw))") }
}
