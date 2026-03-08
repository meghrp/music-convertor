import SwiftUI
import UIKit

struct ConversionView: View {
  @ObservedObject var viewModel: ConversionViewModel
  let onSendLink: (String) async -> Void

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

      Button {
        Task {
          await viewModel.convert()
          guard !viewModel.outputURL.isEmpty else { return }
          await onSendLink(viewModel.outputURL)
        }
      } label: {
        if viewModel.isLoading {
          ProgressView()
            .frame(maxWidth: .infinity)
        } else {
          Text("Convert & Insert")
            .frame(maxWidth: .infinity)
        }
      }
      .buttonStyle(.bordered)
      .disabled(viewModel.isLoading || viewModel.inputURL.isEmpty)

      if !viewModel.outputURL.isEmpty {
        let convertedURL = URL(string: viewModel.outputURL)
        VStack(alignment: .leading, spacing: 8) {
          Text("Converted Link")
            .font(.subheadline)
            .foregroundStyle(.secondary)
          Text(viewModel.outputURL)
            .font(.footnote)
            .textSelection(.enabled)
          HStack(spacing: 8) {
            Button("Copy Link") {
              UIPasteboard.general.string = viewModel.outputURL
              viewModel.statusMessage = "Copied link to clipboard."
            }
            .buttonStyle(.bordered)
            .disabled(!viewModel.canCopy)

            if let convertedURL {
              Link("Open Link", destination: convertedURL)
                .buttonStyle(.bordered)
            } else {
              Button("Open Link") {}
                .buttonStyle(.bordered)
                .disabled(true)
            }
          }
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
