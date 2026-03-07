import Foundation

protocol ConversionClientProtocol {
  func convert(sourceURL: String) async throws -> ConvertResponse
}

final class ConversionClient: ConversionClientProtocol {
  private let session: URLSession
  private let baseURL: URL

  init(session: URLSession = .shared, baseURL: URL = AppConfig.backendBaseURL) {
    self.session = session
    self.baseURL = baseURL
  }

  func convert(sourceURL: String) async throws -> ConvertResponse {
    let requestBody = ConvertRequest(sourceURL: sourceURL)
    var request = URLRequest(url: baseURL.appending(path: "convert"))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(requestBody)

    do {
      let (data, response) = try await session.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse else {
        throw ConversionError.invalidResponse
      }

      if (200..<300).contains(httpResponse.statusCode) {
        return try JSONDecoder().decode(ConvertResponse.self, from: data)
      }

      if let apiError = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
        throw ConversionError.server(code: apiError.errorCode, message: apiError.message)
      }

      throw ConversionError.invalidResponse
    } catch let error as ConversionError {
      throw error
    } catch {
      throw ConversionError.network(error)
    }
  }
}
