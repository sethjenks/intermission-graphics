import { expect } from "@playwright/test";

import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { runToolcraftBrowserAction } from "./browser-proof-session";
import { inspectToolcraftVideoDownload } from "./video-artifact-inspection";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";
import {
  downloadIsolineAction,
  dragIsolineSlider,
  ISOLINE_BLUE,
  openIsolineProofSession,
  prepareExportProbe,
  setIsolineHexColor,
  setIsolineSwitch,
  setIsolineTimelineSeconds,
} from "./product-isoline-helpers";

test.setTimeout(180_000);

const fieldColors = ["#111318", "#C45A3B"] as const;

function videoSchedule(durationSeconds: number) {
  const frames = Math.round(durationSeconds * 30);
  return Array.from({ length: frames }, (_, index) => ({
    durationSeconds: 1 / 30,
    index,
    timeSeconds: index / 30,
  }));
}

function hexToRgba(hex: string): readonly [number, number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    255,
  ];
}

test("browser: appearance.background changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await prepareExportProbe(page);
  await dragIsolineSlider(page, "ring.lineCount", 1);
  await setIsolineSwitch(
    page.locator('[data-toolcraft-control-target="motion.orbit"]'),
    false,
  );
  await setIsolineTimelineSeconds(page, 1);
  let colorIndex = 0;

  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "appearance.background",
    run: async (requirementId) => {
      const hex = fieldColors[colorIndex % fieldColors.length]!;
      colorIndex += 1;
      const paper = hexToRgba(hex);
      await runToolcraftBrowserAction(
        session.controlAction("appearance.background", async (field) => {
          await setIsolineHexColor(field, hex);
        }),
      );
      await expectToolcraftExportedArtifact(
        session.controlAction("appearance.background", async (_field, currentPage) =>
          downloadIsolineAction(currentPage, "Export Video"),
        ),
        async (download) => {
          const inspected = await inspectToolcraftVideoDownload({
            backgroundRgba: paper,
            download,
            page,
            schedule: videoSchedule(1),
          });
          const sample = inspected.observations[0];
          expect(sample, "Exported video must decode at least one frame.").toBeTruthy();
          const pixels = sample!.normalizedPixels;
          const center = (32 * 64 + 32) * 4;
          const line = (32 * 64 + 44) * 4;
          const paperDistance = Math.hypot(
            (pixels[center] ?? 0) - paper[0],
            (pixels[center + 1] ?? 0) - paper[1],
            (pixels[center + 2] ?? 0) - paper[2],
          );
          const lineDistance = Math.hypot(
            (pixels[line] ?? 0) - ISOLINE_BLUE[0],
            (pixels[line + 1] ?? 0) - ISOLINE_BLUE[1],
            (pixels[line + 2] ?? 0) - ISOLINE_BLUE[2],
          );
          expect(paperDistance, `Center pixel should match ${hex}.`).toBeLessThanOrEqual(48);
          expect(lineDistance, "Ring pixel should stay cobalt.").toBeLessThanOrEqual(48);
          return inspected.inspection;
        },
        { requirementId },
      );
    },
  });
});
