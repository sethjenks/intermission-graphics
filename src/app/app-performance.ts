import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import {
  ISOLINE_LINE_COUNT_DEFAULT,
  ISOLINE_LINE_COUNT_MAX,
  ISOLINE_LINE_COUNT_MIN,
} from "./isoline/constants";
import { isolineRendererPipeline } from "./isoline/pipeline";

const isolinePerformanceModel = {
  fixtureAdapters: {
    dimensions: {
      "line-count": {
        apply: (value: number) => value,
        dimensionId: "line-count",
        kind: "continuous" as const,
        observe: (value: number) => value,
      },
    },
  },
  rendererPipeline: isolineRendererPipeline,
  rendererStrategy: "canvas-2d" as const,
  rendererTechnique: {
    exportRenderer: "canvas-2d" as const,
    fidelityRisks: [
      "Hairline strokes can alias if backing pixels fall below the selected render scale.",
    ],
    intentionalRasterizationReason:
      "Preview and image/video export need a single Canvas 2D stroke pass that stays live at high line counts.",
    layers: [
      {
        content: ["geometry", "text"],
        exportMode: "included" as const,
        id: "isoline-ring",
        kind: "product-foreground" as const,
        primitiveCount: "high" as const,
        renderer: "canvas-2d" as const,
        uiSelector: "[data-toolcraft-product-output]",
      },
    ],
    performanceRisks: [
      "Line count scales the number of closed stroked paths rebuilt on every live slider and timeline frame.",
    ],
    previewRenderer: "canvas-2d" as const,
    productRepresentation: "pixel" as const,
    rendererStrategy: "canvas-2d" as const,
    sourceRepresentation: "procedural-data" as const,
    whyNotAlternativeStrategies: [
      "SVG would keep vectors but becomes costly to patch at 120 live isolines during slider drags.",
      "WebGL would add a shader pipeline for a 2D stroke that Canvas 2D already draws crisply.",
      "DOM text cannot represent the closed isoline blend.",
    ],
  },
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        defaultValue: ISOLINE_LINE_COUNT_DEFAULT,
        id: "line-count",
        interactiveMax: ISOLINE_LINE_COUNT_MAX,
        batchMax: ISOLINE_LINE_COUNT_MAX,
        mapping: "direct" as const,
        source: {
          kind: "schema-target" as const,
          target: "ring.lineCount",
          workloadBoundary: "maximum" as const,
        },
        unit: "count",
      },
    ],
  },
} satisfies Omit<ToolcraftEnvelopePerformanceConfig, "scenarios">;

const derivedPaths = deriveToolcraftPerformancePaths(appSchema, {
  ...isolinePerformanceModel,
  scenarios: [],
});

function scenarioForPath(
  path: (typeof derivedPaths)[number],
): ToolcraftPerformanceScenario {
  const coversTargets = path.targets;
  const base = {
    automated: true,
    automatedTestName: `isoline path ${path.id}`,
    browser: true,
    browserTestName: `browser perf: toolcraft path ${path.id}`,
    coversTargets,
    expectedObservable:
      "The isoline ring stays live and keeps selected quality for this derived path.",
    fixture: "isoline compiled fixture",
    id: path.id,
    pathId: path.id,
  };

  if (path.interaction === "export") {
    return {
      ...base,
      actionValue: "export.image",
      completionEvidence: "download",
      controlLabel: "Export PNG",
      interaction: "export",
    };
  }

  if (path.interaction === "control-drag") {
    return {
      ...base,
      controlLabel: "Lines",
      interaction: "control-drag",
    };
  }

  if (path.interaction === "control-change") {
    return {
      ...base,
      controlLabel: "Orbit",
      interaction: "control-change",
    };
  }

  if (path.interaction === "timeline-playback") {
    return {
      ...base,
      controlLabel: "Play",
      interaction: "timeline-playback",
      uiSelector: "[data-toolcraft-product-output]",
    };
  }

  if (path.interaction === "timeline-scrub") {
    return {
      ...base,
      controlLabel: "Playback position",
      interaction: "timeline-scrub",
      uiSelector: "[data-toolcraft-product-output]",
    };
  }

  return {
    ...base,
    interaction: path.interaction,
    uiSelector: "[data-toolcraft-product-output]",
  };
}

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...isolinePerformanceModel,
    scenarios: derivedPaths.map(scenarioForPath),
  });

export const isolineWorkloadBounds = {
  defaultValue: ISOLINE_LINE_COUNT_DEFAULT,
  max: ISOLINE_LINE_COUNT_MAX,
  min: ISOLINE_LINE_COUNT_MIN,
};
