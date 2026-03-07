import Foundation

enum MusicPlatform: String, Codable {
  case appleMusic = "APPLE_MUSIC"
  case spotify = "SPOTIFY"

  var targetPlatform: MusicPlatform {
    switch self {
    case .appleMusic: return .spotify
    case .spotify: return .appleMusic
    }
  }
}

enum LinkParseError: Error, LocalizedError, Equatable {
  case invalidURL
  case unsupportedPlatform
  case unsupportedLinkType
  case missingTrackIdentifier

  var errorDescription: String? {
    switch self {
    case .invalidURL:
      return "Invalid URL."
    case .unsupportedPlatform:
      return "Only Apple Music and Spotify links are supported."
    case .unsupportedLinkType:
      return "Only track links are supported in v1."
    case .missingTrackIdentifier:
      return "Could not find a track identifier in this URL."
    }
  }
}

struct ParsedMusicLink {
  let sourceURL: URL
  let sourcePlatform: MusicPlatform
  let sourceTrackID: String
}

enum MusicLinkParser {
  static func parse(source: String) throws -> ParsedMusicLink {
    guard let url = URL(string: source),
          let host = url.host?.lowercased()
    else {
      throw LinkParseError.invalidURL
    }

    if host.contains("spotify.com") {
      return try parseSpotify(url: url)
    }

    if host.contains("music.apple.com") {
      return try parseAppleMusic(url: url)
    }

    throw LinkParseError.unsupportedPlatform
  }

  private static func parseSpotify(url: URL) throws -> ParsedMusicLink {
    let pathComponents = url.pathComponents.filter { $0 != "/" }
    guard pathComponents.count >= 2 else {
      throw LinkParseError.missingTrackIdentifier
    }

    guard pathComponents[0] == "track" else {
      throw LinkParseError.unsupportedLinkType
    }

    let id = pathComponents[1]
    guard !id.isEmpty else {
      throw LinkParseError.missingTrackIdentifier
    }

    return ParsedMusicLink(sourceURL: url, sourcePlatform: .spotify, sourceTrackID: id)
  }

  private static func parseAppleMusic(url: URL) throws -> ParsedMusicLink {
    let pathComponents = url.pathComponents.filter { $0 != "/" }
    guard pathComponents.count >= 2 else {
      throw LinkParseError.missingTrackIdentifier
    }

    let resourceSegment = pathComponents[pathComponents.count - 2]
    guard resourceSegment == "song" else {
      throw LinkParseError.unsupportedLinkType
    }

    if let idFromQuery = URLComponents(url: url, resolvingAgainstBaseURL: false)?
      .queryItems?
      .first(where: { $0.name == "i" })?
      .value,
      !idFromQuery.isEmpty {
      return ParsedMusicLink(sourceURL: url, sourcePlatform: .appleMusic, sourceTrackID: idFromQuery)
    }

    if let last = pathComponents.last, !last.isEmpty {
      return ParsedMusicLink(sourceURL: url, sourcePlatform: .appleMusic, sourceTrackID: last)
    }

    throw LinkParseError.missingTrackIdentifier
  }
}
