import SwiftUI

@main
struct IsolinePlayerHarnessApp: App {
    var body: some Scene {
        WindowGroup {
            IsolineWebView()
                .ignoresSafeArea()
        }
    }
}
