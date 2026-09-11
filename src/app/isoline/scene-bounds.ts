import type { ToolcraftProductSceneBoundsProvider } from "@/toolcraft/runtime";

import { ISOLINE_SCENE_BOUNDS } from "./constants";

export const isolineSceneBoundsProvider: ToolcraftProductSceneBoundsProvider =
  () => [
    {
      height: ISOLINE_SCENE_BOUNDS.height,
      width: ISOLINE_SCENE_BOUNDS.width,
      x: ISOLINE_SCENE_BOUNDS.x,
      y: ISOLINE_SCENE_BOUNDS.y,
    },
  ];
