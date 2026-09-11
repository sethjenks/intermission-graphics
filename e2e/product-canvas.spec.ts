import { ISOLINE_SCENE_BOUNDS, ISOLINE_SCENE_SIZE } from "../src/app/isoline/constants";
import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  expectToolcraftInfinityCanvasVideoExportEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { inspectToolcraftVideoDownload } from "./video-artifact-inspection";
import {
  downloadIsolineAction,
  dragIsolineSlider,
  ISOLINE_CREAM,
  ISOLINE_OUTPUT_SELECTOR,
  openIsolineProofSession,
  pauseIsolineTimeline,
  prepareExportProbe,
  scrollIsolineTarget,
  setIsolineSelect,
  setIsolineTimelineSeconds,
} from "./product-isoline-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(180_000);

function videoSchedule(durationSeconds: number) {
  const frames = Math.round(durationSeconds * 30);
  return Array.from({ length: frames }, (_, index) => ({
    durationSeconds: 1 / 30,
    index,
    timeSeconds: index / 30,
  }));
}

test("browser: canvas.renderScale preserves selected backing pixels", async ({ page }) => {
  await openIsolineProofSession(page);
  await scrollIsolineTarget(page, "canvas.renderScale");
  await expectToolcraftDiscreteSliderMarkers(page, "canvas.renderScale");
  await expectToolcraftCanvasRenderScaleEvidence(page, {
    canvasSelector: ISOLINE_OUTPUT_SELECTOR,
    requirementId: "canvas.renderScale",
    selectedScale: 2,
    target: "canvas.renderScale",
    stateTransitions: [
      {
        run: async () => {
          await dragIsolineSlider(page, "ring.innerRadius", 0.7);
        },
        state: "interaction",
      },
      {
        run: async () => {
          const play = page.getByRole("button", { name: "Play" });
          if (await play.isVisible()) {
            await play.click();
          }
          await page.waitForTimeout(200);
        },
        state: "playback",
      },
      {
        run: async () => {
          await pauseIsolineTimeline(page);
        },
        state: "steady",
      },
    ],
  });
});

test("browser: infinity canvas restores the dormant finite size", async ({ page }) => {
  await openIsolineProofSession(page);
  const before = await observeInfinityCanvas(page);
  await page.locator('[data-toolcraft-control-target="canvas.infinity"]').getByRole("switch").click();
  const enabled = await observeInfinityCanvas(page);
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  if (!box) {
    throw new Error("Canvas viewport should be visible for infinity pan.");
  }
  const startX = box.x + 36;
  const startY = box.y + 36;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 80, startY + 56, { steps: 8 });
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page);
  await page.reload();
  await pauseIsolineTimeline(page);
  const afterReload = await observeInfinityCanvas(page);
  await page.locator('[data-toolcraft-control-target="canvas.infinity"]').getByRole("switch").click();
  const restored = await observeInfinityCanvas(page);
  await page.keyboard.press("Meta+z");
  const undone = await observeInfinityCanvas(page);
  await page.keyboard.press("Meta+Shift+z");
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      expectedFiniteSize: { height: ISOLINE_SCENE_SIZE, width: ISOLINE_SCENE_SIZE },
      expectedSceneRect: ISOLINE_SCENE_BOUNDS,
      requirementId: "canvas.infinity.mode",
      target: "canvas.infinity",
    },
  );
});

test("browser: infinity canvas crops image export to scene bounds", async ({ page }) => {
  await openIsolineProofSession(page);
  await prepareExportProbe(page);
  await setIsolineSelect(
    page,
    page.locator('[data-toolcraft-control-target="export.image.resolution"]'),
    "2K",
  );
  const finiteDownload = await downloadIsolineAction(page, "Export PNG");
  const finite = await inspectToolcraftImageDownload({
    backgroundRgba: ISOLINE_CREAM,
    download: finiteDownload,
    page,
  });
  await page.locator('[data-toolcraft-control-target="canvas.infinity"]').getByRole("switch").click();
  const infiniteDownload = await downloadIsolineAction(page, "Export PNG");
  const infinite = await inspectToolcraftImageDownload({
    backgroundRgba: ISOLINE_CREAM,
    download: infiniteDownload,
    page,
  });
  await expectToolcraftInfinityCanvasImageExportEvidence(
    {
      finite: {
        byteLength: finite.inspection.byteLength,
        height: finite.inspection.height,
        width: finite.inspection.width,
      },
      infinite: {
        byteLength: infinite.inspection.byteLength,
        height: infinite.inspection.height,
        width: infinite.inspection.width,
      },
    },
    {
      expectedFiniteSize: { height: 2048, width: 2048 },
      expectedInfiniteSize: {
        height: 2048,
        width: Math.round((ISOLINE_SCENE_BOUNDS.width / ISOLINE_SCENE_BOUNDS.height) * 2048),
      },
      requirementId: "canvas.infinity.image-export",
      target: "actions.output",
    },
  );
});

test("browser: infinity canvas keeps one video export envelope", async ({ page }) => {
  await openIsolineProofSession(page);
  await setIsolineTimelineSeconds(page, 1);
  const finiteDownload = await downloadIsolineAction(page, "Export Video");
  const finite = await inspectToolcraftVideoDownload({
    backgroundRgba: ISOLINE_CREAM,
    download: finiteDownload,
    page,
    schedule: videoSchedule(1),
  });
  await page.locator('[data-toolcraft-control-target="canvas.infinity"]').getByRole("switch").click();
  const infiniteDownload = await downloadIsolineAction(page, "Export Video");
  const infinite = await inspectToolcraftVideoDownload({
    backgroundRgba: ISOLINE_CREAM,
    download: infiniteDownload,
    page,
    schedule: videoSchedule(1),
  });
  await expectToolcraftInfinityCanvasVideoExportEvidence(
    {
      finite: {
        byteLength: finite.inspection.byteLength,
        durationMs: finite.inspection.durationMs,
        height: finite.inspection.height,
        width: finite.inspection.width,
      },
      infinite: {
        byteLength: infinite.inspection.byteLength,
        durationMs: infinite.inspection.durationMs,
        height: infinite.inspection.height,
        width: infinite.inspection.width,
      },
    },
    {
      expectedFiniteSize: { height: 2048, width: 2048 },
      expectedInfiniteSize: {
        height: 1800,
        width: 1400,
      },
      requirementId: "canvas.infinity.video-export",
      target: "actions.output",
    },
  );
});
