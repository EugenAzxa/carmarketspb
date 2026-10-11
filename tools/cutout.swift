import Foundation
import Vision
import CoreImage
import AppKit
let args = CommandLine.arguments
let inURL = URL(fileURLWithPath: args[1]); let outURL = URL(fileURLWithPath: args[2])
let ci = CIImage(contentsOf: inURL)!
let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = .accurate
req.outputPixelFormat = kCVPixelFormatType_OneComponent8
let h = VNImageRequestHandler(ciImage: ci)
try! h.perform([req])
let mask = CIImage(cvPixelBuffer: req.results!.first!.pixelBuffer)
let sx = ci.extent.width / mask.extent.width, sy = ci.extent.height / mask.extent.height
let m = mask.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
let clear = CIImage(color: .clear).cropped(to: ci.extent)
let out = ci.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: m])
let ctx = CIContext()
try! ctx.writePNGRepresentation(of: out, to: outURL, format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
print("ok")
