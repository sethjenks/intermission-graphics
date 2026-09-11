import type { ToolcraftProductExportRenderer } from "@/toolcraft/runtime";
import { getToolcraftTimelineLoopProgress } from "@/toolcraft/runtime";

import { drawIsolineScene } from "./draw";
import { readIsolineSceneValuesFromState } from "./values";

export const isolineExportRenderer = {
  baseFileName: "isoline-ring",
  renderFrame: ({ context, frame, state, timeSeconds }) => {
    const values = readIsolineSceneValuesFromState(state);
    const progress = getToolcraftTimelineLoopProgress({
      currentTimeSeconds: timeSeconds,
      durationSeconds: state.timeline.durationSeconds,
    });

    context.save();
    context.translate(-frame.x, -frame.y);
    drawIsolineScene(
      context,
      {
        ...values,
        height: frame.height,
        press: null,
        progress,
        width: frame.width,
      },
      { includeBackground: false },
    );
    context.restore();
  },
} satisfies ToolcraftProductExportRenderer;
