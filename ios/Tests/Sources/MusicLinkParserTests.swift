import XCTest

final class MusicLinkParserTests: XCTestCase {
  func testParseSpotifyTrackLink() throws {
    let parsed = try MusicLinkParser.parse(source: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")
    XCTAssertEqual(parsed.sourcePlatform, .spotify)
    XCTAssertEqual(parsed.sourceTrackID, "4uLU6hMCjMI75M1A2tKUQC")
  }

  func testParseAppleMusicTrackLinkWithQueryTrackID() throws {
    let parsed = try MusicLinkParser.parse(
      source: "https://music.apple.com/us/album/bohemian-rhapsody/1440807861?i=1440807871"
    )
    XCTAssertEqual(parsed.sourcePlatform, .appleMusic)
    XCTAssertEqual(parsed.sourceTrackID, "1440807871")
  }

  func testRejectSpotifyAlbumLink() {
    XCTAssertThrowsError(try MusicLinkParser.parse(source: "https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy")) { error in
      XCTAssertEqual(error as? LinkParseError, .unsupportedLinkType)
    }
  }

  func testRejectAppleMusicAlbumLink() {
    XCTAssertThrowsError(try MusicLinkParser.parse(source: "https://music.apple.com/us/album/1989/1440935467")) { error in
      XCTAssertEqual(error as? LinkParseError, .unsupportedLinkType)
    }
  }

  func testRejectUnsupportedHost() {
    XCTAssertThrowsError(try MusicLinkParser.parse(source: "https://youtube.com/watch?v=dQw4w9WgXcQ")) { error in
      XCTAssertEqual(error as? LinkParseError, .unsupportedPlatform)
    }
  }
}
