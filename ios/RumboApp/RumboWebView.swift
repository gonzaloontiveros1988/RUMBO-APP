import SwiftUI
import WebKit
import UIKit

struct RumboWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let contentController = WKUserContentController()
        let configuration = WKWebViewConfiguration()
        configuration.userContentController = contentController

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 7/255, green: 21/255, blue: 34/255, alpha: 1)
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        let bridge = RumboHealthKitBridge(webView: webView)
        context.coordinator.healthKitBridge = bridge
        contentController.add(bridge, name: "rumboHealthKit")

        loadRumbo(into: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    private func loadRumbo(into webView: WKWebView) {
        guard let webDirectory = Bundle.main.resourceURL?.appendingPathComponent("rumbo-next", isDirectory: true),
              let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "rumbo-next") else {
            webView.loadHTMLString("""
                <html><body style="background:#071522;color:white;font:17px -apple-system;padding:32px">
                <h2>RUMBO no encuentra su interfaz</h2>
                <p>En Xcode, añade la carpeta <b>rumbo-next</b> al proyecto como una carpeta azul y asegúrate de incluirla en
                <b>Copy Bundle Resources</b>.</p></body></html>
                """, baseURL: nil)
            return
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: webDirectory)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        // Keep the message handler alive for as long as the WKWebView exists.
        var healthKitBridge: RumboHealthKitBridge?

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if url.isFileURL || url.absoluteString == "about:blank" {
                decisionHandler(.allow)
            } else {
                // Do not expose the HealthKit message handler to external websites.
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
            }
        }
    }
}
