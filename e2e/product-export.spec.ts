import { expect } from "@playwright/test";

import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { runToolcraftBrowserAction } from "./browser-proof-session";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { inspectToolcraftVideoDownload } from "./video-artifact-inspection";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";

test.setTimeout(180_000);
import {
  downloadIsolineAction,
  ISOLINE_CREAM,
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

test("browser: export.includeBackground changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await prepareExportProbe(page);
  await page.locator('[data-toolcraft-control-target="canvas.infinity"]').getByRole("switch").click();
  const infinite = await observeInfinityCanvasBackground(page);
  await page.locator('[data-toolcraft-control-target="canvas.infinity"]').getByRole("switch").click();

  await expectToolcraftBackgroundOutputSemantics(
    session.observe((root) => {
      const included =
        root
          .querySelector('[data-toolcraft-control-target="export.includeBackground"] [role="switch"]')
          ?.getAttribute("aria-checked") === "true";
      return {
        backgroundVisible: included,
        outputSignature: included ? "on" : "off",
      };
    }),
    session.controlAction("export.includeBackground", async (field) => {
      await setIsolineSwitch(field, false);
    }),
    {
      backgroundVisible: false,
      outputSignature: "off",
    },
    session.controlAction("actions.output", async (_field, currentPage) =>
      downloadIsolineAction(currentPage, "Export PNG"),
    ),
    async (download) => {
      const inspected = await inspectToolcraftImageDownload({
        backgroundRgba: [0, 0, 0, 0],
        download,
        page,
      });
      return {
        ...inspected.inspection,
        backgroundAlpha: inspected.observation.normalizedPixels[3] ?? 0,
        height: inspected.inspection.height,
        mediaType: inspected.inspection.mediaType,
        width: inspected.inspection.width,
      };
    },
    {
      requirementId: "export.includeBackground",
      video: {
        exportArtifact: session.controlAction("actions.output", async (_field, currentPage) => {
          await setIsolineTimelineSeconds(currentPage, 1);
          return downloadIsolineAction(currentPage, "Export Video");
        }),
        inspectArtifact: async (download) => {
          const inspected = await inspectToolcraftVideoDownload({
            backgroundRgba: ISOLINE_CREAM,
            download,
            page,
            schedule: videoSchedule(1),
          });
          return {
            ...inspected.inspection,
            backgroundIncluded: true,
            mediaType: inspected.inspection.mediaType,
          };
        },
      },
    },
  );

  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await page.locator('[data-toolcraft-control-target="export.includeBackground"]').getByRole("switch").click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    { backgroundExcluded, backgroundRestored, infinite },
    {
      expectedBackgroundColor: "#F6F3EE",
      requirementId: "export.includeBackground",
      target: "export.includeBackground",
    },
  );
});

test("browser: export.image.format changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await prepareExportProbe(page);
  const formats = [
    { label: "JPG", mediaType: "image/jpeg" },
    { label: "PNG", mediaType: "image/png" },
  ] as const;
  let formatIndex = 0;

  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "export.image.format",
    run: async (requirementId) => {
      const format = formats[formatIndex % formats.length]!;
      formatIndex += 1;
      await runToolcraftBrowserAction(
        session.controlAction("export.image.format", async (field, currentPage) => {
          await setIsolineSelect(currentPage, field, format.label);
        }),
      );
      await expectToolcraftExportedArtifact(
        session.controlAction("export.image.format", async (_field, currentPage) =>
          downloadIsolineAction(currentPage, "Export PNG"),
        ),
        async (download) => {
          const inspected = await inspectToolcraftImageDownload({
            backgroundRgba: ISOLINE_CREAM,
            download,
            page,
          });
          expect(inspected.inspection.mediaType).toBe(format.mediaType);
          return inspected.inspection;
        },
        { requirementId },
      );
    },
  });
});

test("browser: export.image.resolution changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await prepareExportProbe(page);
  const sizes = [
    { label: "2K", size: 2048 },
    { label: "4K", size: 4096 },
    { label: "8K", size: 8192 },
  ] as const;
  let sizeIndex = 0;

  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "export.image.resolution",
    run: async (requirementId) => {
      const resolution = sizes[sizeIndex % sizes.length]!;
      sizeIndex += 1;
      await runToolcraftBrowserAction(
        session.controlAction("export.image.resolution", async (field, currentPage) => {
          await setIsolineSelect(currentPage, field, resolution.label);
        }),
      );
      await expectToolcraftExportedArtifact(
        session.controlAction("export.image.resolution", async (_field, currentPage) =>
          downloadIsolineAction(currentPage, "Export PNG"),
        ),
        async (download) => {
          const inspected = await inspectToolcraftImageDownload({
            backgroundRgba: ISOLINE_CREAM,
            download,
            page,
          });
          expect(inspected.inspection.width).toBe(resolution.size);
          expect(inspected.inspection.height).toBe(resolution.size);
          return inspected.inspection;
        },
        { requirementId },
      );
    },
  });
});

test("browser: export.video.format changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await prepareExportProbe(page);
  await setIsolineTimelineSeconds(page, 1);
  const formats = [
    { label: "MP4", mediaType: "video/mp4" },
    { label: "WebM", mediaType: "video/webm" },
  ] as const;
  let formatIndex = 0;

  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "export.video.format",
    run: async (requirementId) => {
      const format = formats[formatIndex % formats.length]!;
      formatIndex += 1;
      await runToolcraftBrowserAction(
        session.controlAction("export.video.format", async (field, currentPage) => {
          await setIsolineSelect(currentPage, field, format.label);
        }),
      );
      await expectToolcraftExportedArtifact(
        session.controlAction("export.video.format", async (_field, currentPage) =>
          downloadIsolineAction(currentPage, "Export Video"),
        ),
        async (download) => {
          const inspected = await inspectToolcraftVideoDownload({
            backgroundRgba: ISOLINE_CREAM,
            download,
            page,
            schedule: videoSchedule(1),
          });
          expect(inspected.inspection.mediaType).toBe(format.mediaType);
          return inspected.inspection;
        },
        { requirementId },
      );
    },
  });
});

test("browser: export.video.resolution changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await prepareExportProbe(page);
  await setIsolineTimelineSeconds(page, 1);
  const sizes = [
    { label: "Current", size: 2048 },
    { label: "4K", size: 2160 },
  ] as const;
  let sizeIndex = 0;

  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "export.video.resolution",
    run: async (requirementId) => {
      const resolution = sizes[sizeIndex % sizes.length]!;
      sizeIndex += 1;
      await runToolcraftBrowserAction(
        session.controlAction("export.video.resolution", async (field, currentPage) => {
          await setIsolineSelect(currentPage, field, resolution.label);
        }),
      );
      await expectToolcraftExportedArtifact(
        session.controlAction("export.video.resolution", async (_field, currentPage) =>
          downloadIsolineAction(currentPage, "Export Video"),
        ),
        async (download) => {
          const inspected = await inspectToolcraftVideoDownload({
            backgroundRgba: ISOLINE_CREAM,
            download,
            page,
            schedule: videoSchedule(1),
          });
          expect(inspected.inspection.width).toBe(resolution.size);
          expect(inspected.inspection.height).toBe(resolution.size);
          return inspected.inspection;
        },
        { requirementId },
      );
    },
  });
});
