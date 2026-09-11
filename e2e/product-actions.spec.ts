import {
  expectToolcraftImageExportArtifact,
  expectToolcraftVideoExportArtifact,
} from "./browser-media-export-evidence";
import { test } from "./toolcraft-product-test";

test.setTimeout(180_000);
import {
  downloadIsolineAction,
  dragIsolineSlider,
  ISOLINE_BLUE,
  ISOLINE_CREAM,
  ISOLINE_EXPORT_BOUNDS,
  ISOLINE_EXPORT_PIXELS,
  openIsolineProofSession,
  prepareExportProbe,
  setIsolineSelect,
  setIsolineSwitch,
  setIsolineTimelineSeconds,
} from "./product-isoline-helpers";

function videoSchedule(durationSeconds: number) {
  const frames = Math.round(durationSeconds * 30);
  return Array.from({ length: frames }, (_, index) => ({
    durationSeconds: 1 / 30,
    index,
    timeSeconds: index / 30,
  }));
}

test("browser: actions.output exports isoline artifacts", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await prepareExportProbe(page);
  await setIsolineSelect(
    page,
    page.locator('[data-toolcraft-control-target="export.image.resolution"]'),
    "2K",
  );
  await expectToolcraftImageExportArtifact(
    session.controlAction("actions.output", async (_field, currentPage) =>
      downloadIsolineAction(currentPage, "Export PNG"),
    ),
    {
      backgroundRgba: ISOLINE_CREAM,
      expectedBounds: ISOLINE_EXPORT_BOUNDS,
      expectedHeight: 2048,
      expectedMediaType: "image/png",
      expectedPixels: [...ISOLINE_EXPORT_PIXELS],
      expectedWidth: 2048,
      page,
      requirementId: "actions.output",
    },
  );

  await setIsolineTimelineSeconds(page, 1);
  await setIsolineSwitch(
    page.locator('[data-toolcraft-control-target="motion.orbit"]'),
    false,
  );
  await dragIsolineSlider(page, "ring.lineCount", 1);
  await expectToolcraftVideoExportArtifact(
    session.controlAction("actions.output", async (_field, currentPage) =>
      downloadIsolineAction(currentPage, "Export Video"),
    ),
    {
      animated: true,
      backgroundRgba: ISOLINE_CREAM,
      expectedDurationSeconds: 1,
      expectedHeight: 2048,
      expectedMediaType: "video/mp4",
      expectedSamples: [0, 0.5, 29 / 30].map((timeSeconds) => ({
        pixels: [...ISOLINE_EXPORT_PIXELS],
        timeSeconds,
      })),
      expectedWidth: 2048,
      page,
      requirementId: "actions.output",
      schedule: videoSchedule(1),
    },
  );
});
