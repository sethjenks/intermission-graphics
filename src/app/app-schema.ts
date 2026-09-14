import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { ISOLINE_SCENE_SIZE } from "./isoline/constants";
import {
  isolineBackgroundSection,
  isolineInkSection,
  isolineLineSection,
  isolineLookSection,
  isolineMotionSection,
  isolinePhysicsSection,
  isolineRingSection,
  isolineSeedSection,
  isolineSpaceSection,
  isolineTempoSection,
  isolineWidthProfileSection,
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
    upload: true,
  },
  identity: appIdentity,
  panels: {
    controls: {
      sections: [
        isolineBackgroundSection,
        isolineLookSection,
        isolineSeedSection,
        isolineRingSection,
        isolineSpaceSection,
        isolineLineSection,
        isolineWidthProfileSection,
        isolinePhysicsSection,
        isolineMotionSection,
        isolineTempoSection,
        isolineInkSection,
      ],
      title: "Controls",
    },
  },
  settingsTransfer: {
    appId: "intermission-graphics",
    enabled: "auto",
    fileName: "isoline-ring-settings",
  },
  toolbar: {
    history: true,
    radar: true,
    zoom: true,
  },
});
