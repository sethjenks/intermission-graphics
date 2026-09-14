import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "./toolcraft-product-test";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const playerPath = path.join(
  repositoryRoot,
  "dist",
  "isoline-player",
  "isoline-player.iife.js",
);

const settings = {
  appId: "intermission-graphics",
  canvas: { mode: "finite", size: { height: 2_048, width: 2_048 } },
  source: "toolcraft-settings",
  timeline: {
    currentTimeSeconds: 0,
    durationSeconds: 12,
    isLooping: true,
    isPlaying: false,
  },
  values: {
    "appearance.background": "#F6F3EE",
    "export.includeBackground": true,
    "interaction.canvasTool": "strum",
  },
  version: 2,
};

test("standalone player renders independent WebGL2 instances and tears down", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.setContent(`
    <style>
      canvas { width: 320px; height: 240px; }
    </style>
    <canvas id="first"></canvas>
    <canvas id="second"></canvas>
  `);
  await page.addScriptTag({ path: playerPath });

  const result = await page.evaluate(async (payload) => {
    const first = document.querySelector("#first");
    const second = document.querySelector("#second");
    if (!(first instanceof HTMLCanvasElement) || !(second instanceof HTMLCanvasElement)) {
      throw new Error("Missing test canvases.");
    }
    const events: string[] = [];
    first.addEventListener("isoline-player", (event) => {
      events.push((event as CustomEvent<{ type: string }>).detail.type);
    });
    const firstPlayer = window.IsolinePlayer!.create(first, payload);
    const secondPlayer = window.IsolinePlayer!.create(second, payload);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const firstContext = first.getContext("webgl2");
    const secondContext = second.getContext("webgl2");
    const pixels = new Uint8Array(first.width * first.height * 4);
    firstContext?.readPixels(
      0,
      0,
      first.width,
      first.height,
      firstContext.RGBA,
      firstContext.UNSIGNED_BYTE,
      pixels,
    );
    let foregroundPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const distance =
        Math.abs((pixels[index] ?? 0) - 246) +
        Math.abs((pixels[index + 1] ?? 0) - 243) +
        Math.abs((pixels[index + 2] ?? 0) - 238);
      if (distance > 40) {
        foregroundPixels += 1;
      }
    }
    firstPlayer.setValues({ "line.makeup": "particles", "particles.count": 800 });
    firstPlayer.pause();
    firstPlayer.resume();
    secondPlayer.resize();
    firstPlayer.loadSettings({ bad: true }, "bad-settings");
    const dimensions = [
      first.width,
      first.height,
      second.width,
      second.height,
    ];
    firstPlayer.destroy();
    firstPlayer.destroy();
    secondPlayer.destroy();
    const recreated = window.IsolinePlayer!.create(first, payload, {
      autoplay: false,
    });
    recreated.destroy();
    return {
      appId: window.IsolinePlayer!.appId,
      dimensions,
      events,
      firstContext: Boolean(firstContext),
      foregroundPixels,
      protocolVersion: window.IsolinePlayer!.protocolVersion,
      secondContext: Boolean(secondContext),
    };
  }, settings);

  expect(result.appId).toBe("intermission-graphics");
  expect(result.protocolVersion).toBe(1);
  expect(result.firstContext).toBe(true);
  expect(result.foregroundPixels).toBeGreaterThan(100);
  expect(result.secondContext).toBe(true);
  expect(result.dimensions.every((dimension) => dimension > 0)).toBe(true);
  expect(result.events).toContain("ready");
  expect(result.events).toContain("settings-applied");
  expect(result.events).toContain("error");
  expect(requests).toEqual([]);
});
