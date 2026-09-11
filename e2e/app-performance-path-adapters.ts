import { deriveToolcraftPerformancePaths } from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import {
  dragToolcraftSliderByTarget,
  dragToolcraftSliderTargetToValue,
} from "./performance-slider-helpers";
import { pauseIsolineTimeline } from "./product-isoline-helpers";
import type {
  ToolcraftPerformanceCanvasBacking,
  ToolcraftPerformancePathAdapter,
} from "./performance-path-adapter-contract";

export const appPerformanceCanvasBacking = {
  canvasSelector: "[data-toolcraft-product-output]",
} as const satisfies ToolcraftPerformanceCanvasBacking;

const performancePaths = deriveToolcraftPerformancePaths(appSchema, appPerformance);

function lineCountApplications(page: import("@playwright/test").Page) {
  return {
    "line-count": {
      applyValue: async (value: unknown) => {
        await dragToolcraftSliderTargetToValue(page, "ring.lineCount", Number(value));
      },
      observeValue: async () => {
        const field = await getToolcraftControlFieldByTarget(page, "ring.lineCount");
        return Number(
          await field.getByRole("slider").first().getAttribute("aria-valuenow"),
        );
      },
    },
  };
}

async function prepareIsolinePage(page: import("@playwright/test").Page) {
  await page.goto("/");
  await pauseIsolineTimeline(page);
}

export const appPerformancePathAdapters: readonly ToolcraftPerformancePathAdapter[] =
  performancePaths.map((path) => {
    const needsLineCount = path.workloadDimensions.includes("line-count");
    const base = {
      pathId: path.id,
      prepare: prepareIsolinePage,
      ...(needsLineCount
        ? { fixtureApplications: lineCountApplications }
        : {}),
    };

    if (path.interaction === "export") {
      return {
        ...base,
        output: {
          kind: "download" as const,
          label: "Export PNG",
          verify: async (download, page) => {
            await inspectToolcraftImageDownload({
              backgroundRgba: [246, 243, 238, 255],
              download,
              page,
            });
          },
        },
      };
    }

    const needsOutcome =
      path.interaction === "control-change" ||
      path.interaction === "control-drag" ||
      path.interaction === "timeline-playback" ||
      path.interaction === "timeline-scrub";

    return {
      ...base,
      action: async ({ page }) => {
        switch (path.interaction) {
          case "control-drag":
            await dragToolcraftSliderByTarget(page, "ring.lineCount", 0.8, {
              pathId: path.id,
            });
            return;
          case "control-change":
            await page
              .locator('[data-toolcraft-control-target="motion.orbit"]')
              .getByRole("switch")
              .click();
            return;
          case "timeline-playback":
            await page.getByRole("button", { name: "Play" }).click();
            return;
          case "timeline-scrub": {
            const scrubber = page.getByRole("slider", { name: "Playback position" });
            if (!(await scrubber.isVisible())) {
              await page
                .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
                .getByRole("switch")
                .click();
            }
            await scrubber.press("ArrowRight");
            return;
          }
          case "viewport-drag":
            await page.mouse.move(360, 280);
            await page.mouse.down();
            await page.mouse.move(420, 320, { steps: 8 });
            await page.mouse.up();
            return;
          case "viewport-zoom":
            await page.getByRole("button", { name: "Zoom in" }).click();
            return;
          case "initial-render":
          case "animation-frame":
            await page.locator("[data-toolcraft-product-output]").waitFor();
            return;
          case "export":
          case "mask-drag":
          case "media-import":
            throw new Error(`Isoline performance adapter does not run "${path.interaction}".`);
          default: {
            const exhaustive: never = path.interaction;
            throw new Error(`Unhandled isoline performance interaction ${String(exhaustive)}`);
          }
        }
      },
      ...(needsOutcome
        ? {
            observeOutcome: ({ page }: { page: import("@playwright/test").Page }) =>
              getToolcraftProductObservableSnapshot(page),
          }
        : {}),
    };
  });
