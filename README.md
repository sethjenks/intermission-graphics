# Intermission Graphics

Isoline Ring is a Toolcraft studio for topographic torus animations. Open the app, tune presets and sliders, then use **Export Settings** to download a JSON design for the standalone WebGL player.

## Live studio

https://intermission-graphics.vercel.app

Tune presets and sliders there, then use **Export Settings** in the panel to download a JSON design.

## Local

```bash
npm install
npm run dev
```

Requires Node 22+.

## Player embed

```bash
npm run build:player
```

That writes a framework-free IIFE to `dist/isoline-player/`. See [docs/isoline-player.md](docs/isoline-player.md) for the full web and native protocol.

## Mobile app

Do not embed the Toolcraft studio. Ship the standalone WebGL2 player plus a settings JSON.

1. In the studio, tune the look and click **Export Settings**.
2. From this repo, run `npm run build:player`.
3. Bundle these files in the app (see `examples/isoline-player/` and `ios/IsolinePlayerHarness/`):
   - `isoline-player.iife.js`
   - a host HTML page with a full-bleed `<canvas id="isoline">`
   - `start.js` that calls `window.IsolinePlayer.create(canvas)`
   - the exported `settings.json`
4. Load that HTML from the app bundle in a WebView. Keep the files local. Do not point the WebView at the Vercel studio.

The player needs WebGL2. Gestures (strum, orbit) stay inside the WebView, so do not put a native scroll view on top of them. Line weight is authored for a 2048 design size — move the camera closer with `view.orbit` in the settings if the ring looks small on a phone.

### iOS

`ios/IsolinePlayerHarness` is the reference `WKWebView` host for iOS 18+. Copy the built player, host HTML, and settings into the app bundle. Load the local HTML with read access limited to that folder. Inject settings with `callAsyncJavaScript(arguments:)` instead of interpolating JSON into a script string.

Pause when the app backgrounds, resume on foreground, call `resize` on rotation, and reload the host if the web process dies. Accept `isoline` bridge messages only from the main frame and the local file origin.

```swift
webView.loadFileURL(hostURL, allowingReadAccessTo: hostURL.deletingLastPathComponent())

// After the player posts ready:
_ = try await webView.callAsyncJavaScript(
  "window.__isolineHost.loadSettings(settings, requestId)",
  arguments: ["settings": settings, "requestId": UUID().uuidString],
  in: nil,
  contentWorld: .page
)
```

### React Native

Use `react-native-webview` and the same local HTML/JS files. On Android, load from `file:///android_asset/...`. On iOS, load the bundled file URL. When the page posts `ready` or `context-restored`, inject settings. Pause and resume with `AppState`.

```tsx
import { useRef } from "react";
import { Platform } from "react-native";
import { WebView } from "react-native-webview";

const settings = require("./assets/isoline/settings.json");

export function IsolineField() {
  const webViewRef = useRef<WebView>(null);
  const applySettings = `
    window.__isolineHost?.loadSettings(${JSON.stringify(settings)});
    true;
  `;

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      allowFileAccess
      allowFileAccessFromFileURLs
      javaScriptEnabled
      scrollEnabled={false}
      onMessage={(event) => {
        const payload = JSON.parse(event.nativeEvent.data);
        if (payload.type === "ready" || payload.type === "context-restored") {
          webViewRef.current?.injectJavaScript(applySettings);
        }
      }}
      source={
        Platform.OS === "ios"
          ? require("./assets/isoline/index.html")
          : { uri: "file:///android_asset/isoline/index.html" }
      }
    />
  );
}
```

The iOS harness is the safer pattern: it passes settings as an argument instead of stringifying them into JavaScript. Mirror that if you wrap the WebView in native code.

Android needs a WebView new enough for WebGL2. Test a real device.

### Talking to the player

| Method | Use |
| --- | --- |
| `loadSettings(json)` | Apply a Toolcraft settings export |
| `setValues({ "ring.lineCount": 80 })` | Live tweaks without a full reload |
| `pause` / `resume` | App background or screen blur |
| `resize` | Rotation or layout change |
| `destroy` | Unmount |

Events come back as `ready`, `settings-applied`, `warning`, `error`, and `context-restored`. Payloads must use app id `intermission-graphics` and are rejected above 512 KB.

A rewrite in React Native Skia or a native GL view is a new renderer, not a drop-in of this player.
