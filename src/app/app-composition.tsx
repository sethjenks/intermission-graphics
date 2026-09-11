import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { isolineExportRenderer } from "./isoline/export-renderer";
import { IsolineCanvas } from "./isoline/isoline-canvas";
import { isolineRendererPipeline } from "./isoline/pipeline";
import { isolineSceneBoundsProvider } from "./isoline/scene-bounds";
import {
  ISOLINE_SEED_MAX,
  ISOLINE_SEED_MIN,
} from "./isoline/constants";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <IsolineCanvas />,
  exportRenderer: isolineExportRenderer,
  modelPresentation: { mode: "runtime" },
  onPanelAction: ({ action, dispatch }) => {
    if (action.value !== "randomize-seed") {
      return;
    }

    const nextSeed =
      ISOLINE_SEED_MIN +
      Math.floor(Math.random() * (ISOLINE_SEED_MAX - ISOLINE_SEED_MIN + 1));
    dispatch({
      label: "Randomize seed",
      target: "look.seed",
      type: "controls.setValue",
      value: nextSeed,
    });
  },
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration: isolineRendererPipeline,
  sceneBoundsProvider: isolineSceneBoundsProvider,
  schema: appSchema,
};
