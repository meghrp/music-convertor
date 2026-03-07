import Foundation

struct ConvertRequest: Codable {
  let sourceURL: String

  enum CodingKeys: String, CodingKey {
    case sourceURL = "sourceUrl"
  }
}

struct ConvertResponse: Codable {
  let sourcePlatform: MusicPlatform
  let targetPlatform: MusicPlatform
  let sourceTrackID: String
  let targetURL: String
  let matchedBy: String
  let confidence: Double

  enum CodingKeys: String, CodingKey {
    case sourcePlatform
    case targetPlatform
    case sourceTrackID = "sourceTrackId"
    case targetURL = "targetUrl"
    case matchedBy
    case confidence
  }
}

struct APIErrorResponse: Codable {
  let errorCode: String
  let message: String
}

enum ConversionError: Error, LocalizedError {
  case invalidResponse
  case server(code: String, message: String)
  case network(Error)

  var errorDescription: String? {
    switch self {
    case .invalidResponse:
      return "Received an invalid response from the conversion server."
    case let .server(code, message):
      return "\(code): \(message)"
    case let .network(error):
      return error.localizedDescription
    }
  }
}
