# Intermission Graphics

Isoline Ring is a Toolcraft studio for topographic torus animations. Open the app, tune presets and sliders, then use **Export Settings** to download a JSON design for the standalone WebGL player.

## Live studio

The public tuner is deployed on Vercel after this repository is connected. Use **Export Settings** in the panel to take a design with you.

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

That writes a framework-free IIFE to `dist/isoline-player/`. See [docs/isoline-player.md](docs/isoline-player.md) for web embeds, iOS `WKWebView`, and React Native WebView.
