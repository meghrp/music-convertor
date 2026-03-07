import SwiftUI
import UIKit

struct ConversionView: View {
  @ObservedObject var viewModel: ConversionViewModel

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Music Link Converter")
        .font(.headline)

      TextField("Paste Apple Music or Spotify track link", text: $viewModel.inputURL)
        .textInputAutocapitalization(.never)
        .keyboardType(.URL)
        .textFieldStyle(.roundedBorder)

      Button {
        Task { await viewModel.convert() }
      } label: {
        if viewModel.isLoading {
          ProgressView()
            .frame(maxWidth: .infinity)
        } else {
          Text("Convert")
            .frame(maxWidth: .infinity)
        }
      }
      .buttonStyle(.borderedProminent)
      .disabled(viewModel.isLoading || viewModel.inputURL.isEmpty)

      if !viewModel.outputURL.isEmpty {
        VStack(alignment: .leading, spacing: 8) {
          Text("Converted Link")
            .font(.subheadline)
            .foregroundStyle(.secondary)
          Text(viewModel.outputURL)
            .font(.footnote)
            .textSelection(.enabled)
          Button("Copy") {
            UIPasteboard.general.string = viewModel.outputURL
            viewModel.statusMessage = "Copied link to clipboard."
          }
          .buttonStyle(.bordered)
          .disabled(!viewModel.canCopy)
        }
      }

      if !viewModel.statusMessage.isEmpty {
        Text(viewModel.statusMessage)
          .font(.footnote)
          .foregroundStyle(.secondary)
      }

      Spacer()
    }
    .padding()
  }
}
