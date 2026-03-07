import Foundation

enum AppConfig {
  static var backendBaseURL: URL {
    let value = Bundle.main.object(forInfoDictionaryKey: "BACKEND_BASE_URL") as? String
    let fallback = "https://example.music-converter.workers.dev"
    return URL(string: value ?? fallback) ?? URL(string: fallback)!
  }
}
