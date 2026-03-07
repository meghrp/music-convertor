import Foundation

@MainActor
final class ConversionViewModel: ObservableObject {
  @Published var inputURL = ""
  @Published var outputURL = ""
  @Published var statusMessage = ""
  @Published var isLoading = false
  @Published var canCopy = false

  private let client: ConversionClientProtocol

  init(client: ConversionClientProtocol = ConversionClient()) {
    self.client = client
  }

  func convert() async {
    statusMessage = ""
    outputURL = ""
    canCopy = false

    do {
      _ = try MusicLinkParser.parse(source: inputURL.trimmingCharacters(in: .whitespacesAndNewlines))
      isLoading = true
      defer { isLoading = false }
      let response = try await client.convert(sourceURL: inputURL)
      outputURL = response.targetURL
      canCopy = true
      statusMessage = "Converted with \(Int(response.confidence * 100))% confidence (\(response.matchedBy))."
    } catch {
      statusMessage = error.localizedDescription
      canCopy = false
    }
  }
}
