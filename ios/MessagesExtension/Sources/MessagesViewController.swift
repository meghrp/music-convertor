import Messages
import SwiftUI
import UIKit

final class MessagesViewController: MSMessagesAppViewController {
  private let viewModel = ConversionViewModel()
  private var hostController: UIHostingController<ConversionView>?

  override func viewDidLoad() {
    super.viewDidLoad()
    let swiftUIView = ConversionView(viewModel: viewModel)
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
}
