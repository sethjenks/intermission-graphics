# Isoline Player

`npm run build:player` creates a framework-free WebGL2 player in
`dist/isoline-player/` and a versioned ZIP beside it. The same files run as a
plain web embed or as bundled local resources in an iOS 18+ `WKWebView`.

## Web

Serve the build directory over HTTP, load `isoline-player.iife.js`, and create
an instance on an existing canvas:

```html
<canvas id="isoline"></canvas>
<script src="/isoline-player.iife.js"></script>
<script>
  const player = window.IsolinePlayer.create(
    document.querySelector("#isoline"),
    toolcraftSettings
  );
  window.addEventListener("pagehide", () => player.destroy(), { once: true });
</script>
```

The public instance supports `loadSettings`, `setValues`, `pause`, `resume`,
`resize`, and idempotent `destroy`. Multiple canvases receive independent
contexts, schedulers, physics state, and settings. Flow and breathe are
continuous; a timeline block in older settings JSON is ignored for looping.

Line weight is authored against the 2048 design size so Toolcraft and embeds
keep the same hairline density. To fill a phone or web canvas, move the camera
closer with `view.orbit` in the exported settings; the bundled example does
this so the ring occupies the view instead of sitting small on the 2048 field.

## Settings

Use Toolcraft’s **Export Settings** JSON as the portable design. The player
accepts payload versions 1 and 2 for `intermission-graphics`, applies defaults
for missing values, ignores unknown value targets, and rejects unsupported app
IDs, newer versions, malformed payloads, and payloads above 512 KB.

## iOS

Copy the built player, host HTML, and settings into the app bundle. Load the
local HTML with read access restricted to its containing directory. Send
settings with `callAsyncJavaScript(arguments:)`; do not interpolate JSON into
source strings. Accept `isoline` bridge messages only from the expected main
frame and local security origin.

The included `ios/IsolinePlayerHarness` demonstrates lifecycle pause/resume,
orientation resize, bounded settings injection, typed bridge messages, offline
content security policy, and web-process termination recovery.

WebGL2 is mandatory. Audio and haptic output are intentionally outside the
player protocol.
