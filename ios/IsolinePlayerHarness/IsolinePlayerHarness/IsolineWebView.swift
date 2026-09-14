import SwiftUI
import UIKit
import WebKit

struct IsolineWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.add(context.coordinator, name: "isoline")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.navigationDelegate = context.coordinator
        context.coordinator.attach(webView)
        context.coordinator.loadHost()
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.evaluateJavaScript("window.__isolineHost?.resize()")
    }

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(
            forName: "isoline"
        )
        webView.evaluateJavaScript("window.__isolineHost?.destroy()")
        coordinator.detach()
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        private static let maximumSettingsBytes = 512 * 1024
        private var notificationTokens: [NSObjectProtocol] = []
        private var settings: Any?
        private weak var webView: WKWebView?

        override init() {
            super.init()
            settings = Self.readBundledSettings()
            let center = NotificationCenter.default
            notificationTokens.append(
                center.addObserver(
                    forName: UIApplication.didEnterBackgroundNotification,
                    object: nil,
                    queue: .main
                ) { [weak self] _ in
                    self?.webView?.evaluateJavaScript(
                        "window.__isolineHost?.pause()"
                    )
                }
            )
            notificationTokens.append(
                center.addObserver(
                    forName: UIApplication.willEnterForegroundNotification,
                    object: nil,
                    queue: .main
                ) { [weak self] _ in
                    self?.webView?.evaluateJavaScript(
                        "window.__isolineHost?.resume()"
                    )
                }
            )
        }

        deinit {
            for token in notificationTokens {
                NotificationCenter.default.removeObserver(token)
            }
        }

        func attach(_ webView: WKWebView) {
            self.webView = webView
        }

        func detach() {
            webView = nil
        }

        func loadHost() {
            guard
                let webView,
                let url = Bundle.main.url(
                    forResource: "index",
                    withExtension: "html",
                    subdirectory: "Resources"
                )
            else {
                return
            }
            webView.loadFileURL(
                url,
                allowingReadAccessTo: url.deletingLastPathComponent()
            )
        }

        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard
                message.name == "isoline",
                message.frameInfo.isMainFrame,
                message.frameInfo.securityOrigin.protocol == "file",
                let event = message.body as? [String: Any],
                event["protocolVersion"] as? Int == 1,
                let type = event["type"] as? String
            else {
                return
            }

            if type == "ready" || type == "context-restored" {
                applySettings()
            }
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            loadHost()
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            let allowed = navigationAction.targetFrame?.isMainFrame != false &&
                navigationAction.request.url?.isFileURL == true
            decisionHandler(allowed ? .allow : .cancel)
        }

        private func applySettings() {
            guard
                let webView,
                let settings,
                JSONSerialization.isValidJSONObject(settings),
                let data = try? JSONSerialization.data(withJSONObject: settings),
                data.count <= Self.maximumSettingsBytes
            else {
                return
            }

            Task { @MainActor in
                _ = try? await webView.callAsyncJavaScript(
                    "window.__isolineHost.loadSettings(settings, requestId)",
                    arguments: [
                        "settings": settings,
                        "requestId": UUID().uuidString,
                    ],
                    in: nil,
                    contentWorld: .page
                )
            }
        }

        private static func readBundledSettings() -> Any? {
            guard
                let url = Bundle.main.url(
                    forResource: "settings",
                    withExtension: "json",
                    subdirectory: "Resources"
                ),
                let data = try? Data(contentsOf: url),
                data.count <= maximumSettingsBytes
            else {
                return nil
            }
            return try? JSONSerialization.jsonObject(with: data)
        }
    }
}
