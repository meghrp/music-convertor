import Messages
import SwiftUI
import UIKit

final class MessagesViewController: MSMessagesAppViewController {
  private let viewModel = ConversionViewModel()
  private var hostController: UIHostingController<ConversionView>?

  override func viewDidLoad() {
    super.viewDidLoad()
    let swiftUIView = ConversionView(
      viewModel: viewModel,
      onSendLink: { [weak self] link in
        await self?.insertConvertedLink(link)
      }
    )
    let hostController = UIHostingController(rootView: swiftUIView)
    hostController.view.translatesAutoresizingMaskIntoConstraints = false
    addChild(hostController)
    view.addSubview(hostController.view)
    hostController.didMove(toParent: self)
    NSLayoutConstraint.activate([
      hostController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      hostController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      hostController.view.topAnchor.constraint(equalTo: view.topAnchor),
      hostController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])
    self.hostController = hostController
  }

  @MainActor
  private func insertConvertedLink(_ link: String) async {
    guard let conversation = activeConversation else {
      viewModel.statusMessage = "Couldn't access your conversation. Please try again."
      return
    }

    await withCheckedContinuation { continuation in
      conversation.insertText(link) { [weak self] error in
        Task { @MainActor [weak self] in
          if let error {
            self?.viewModel.statusMessage = "Couldn't insert link: \(error.localizedDescription)"
          } else {
            self?.viewModel.statusMessage = "Converted link inserted. Tap Send."
            self?.requestPresentationStyle(.compact)
          }
        }
        continuation.resume()
      }
    }
  }
}
