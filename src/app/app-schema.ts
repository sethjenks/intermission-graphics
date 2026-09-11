import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { ISOLINE_LOOP_SECONDS, ISOLINE_SCENE_SIZE } from "./isoline/constants";
import {
  isolineBackgroundSection,
  isolineExportActionsSection,
  isolineImageExportSection,
  isolineInkSection,
  isolineLookSection,
  isolineMotionSection,
  isolineRingSection,
  isolineSeedSection,
  isolineShowSection,
  isolineStyleSection,
  isolineTempoSection,
  isolineTypeSection,
  isolineVideoExportSection,
} from "./isoline/schema-controls";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: true,
    size: {
      height: ISOLINE_SCENE_SIZE,
      unit: "px",
      width: ISOLINE_SCENE_SIZE,
    },
    sizing: { mode: "editable-output" },
    upload: false,
  },
  identity: appIdentity,
  panels: {
    controls: {
      sections: [
        isolineBackgroundSection,
        isolineLookSection,
        isolineSeedSection,
        isolineRingSection,
        isolineMotionSection,
        isolineTempoSection,
        isolineInkSection,
        isolineTypeSection,
        isolineShowSection,
        isolineStyleSection,
        isolineImageExportSection,
        isolineVideoExportSection,
        isolineExportActionsSection,
      ],
      title: "Controls",
    },
    timeline: {
      defaultDurationSeconds: ISOLINE_LOOP_SECONDS,
      enabled: true,
      mode: "playback",
    },
  },
  toolbar: {
    history: true,
    radar: true,
    zoom: true,
  },
});
