import {
  ISOLINE_SCENE_BOUNDS,
  ISOLINE_SCENE_SIZE,
} from "../src/app/isoline/constants";
import {
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import {
  dragIsolineSlider,
  ISOLINE_OUTPUT_SELECTOR,
  openIsolineProofSession,
  pauseIsolineTimeline,
  scrollIsolineTarget,
} from "./product-isoline-helpers";
import { test } from "./toolcraft-product-test";

test("browser: canvas.renderScale preserves selected backing pixels", async ({
  page,
}) => {
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
          await pauseIsolineTimeline(page);
        },
        state: "steady",
      },
    ],
  });
});

test("browser: infinity canvas restores the dormant finite size", async ({
  page,
}) => {
  await openIsolineProofSession(page);
  const before = await observeInfinityCanvas(page);
  await page
    .locator('[data-toolcraft-control-target="canvas.infinity"]')
    .getByRole("switch")
    .click();
  const enabled = await observeInfinityCanvas(page);
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  if (!box) {
    throw new Error("Canvas viewport should be visible for infinity pan.");
  }
  await page.mouse.move(box.x + 36, box.y + 36);
  await page.mouse.down();
  await page.mouse.move(box.x + 116, box.y + 92, { steps: 8 });
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page);
  await page.reload();
  await pauseIsolineTimeline(page);
  const afterReload = await observeInfinityCanvas(page);
  await page
    .locator('[data-toolcraft-control-target="canvas.infinity"]')
    .getByRole("switch")
    .click();
  const restored = await observeInfinityCanvas(page);
  await page.keyboard.press("Meta+z");
  const undone = await observeInfinityCanvas(page);
  await page.keyboard.press("Meta+Shift+z");
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      expectedFiniteSize: {
        height: ISOLINE_SCENE_SIZE,
        width: ISOLINE_SCENE_SIZE,
      },
      expectedSceneRect: ISOLINE_SCENE_BOUNDS,
      requirementId: "canvas.infinity.mode",
      target: "canvas.infinity",
    },
  );
});
