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
  ISOLINE_PARTICLE_COUNT_DEFAULT,
  ISOLINE_PARTICLE_COUNT_MAX,
  ISOLINE_PARTICLE_COUNT_MIN,
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
      "particle-count": {
        apply: (value: number) => value,
        dimensionId: "particle-count",
        kind: "continuous" as const,
        observe: (value: number) => value,
      },
    },
  },
  rendererPipeline: isolineRendererPipeline,
  rendererStrategy: "webgl" as const,
  rendererTechnique: {
    exportRenderer: "none" as const,
    fidelityRisks: [
      "Cross-GPU antialiasing and floating-point precision can shift line edges slightly.",
      "Particle density and line continuity can diverge if retained state is not rebuilt after context restoration.",
    ],
    intentionalRasterizationReason:
      "The product is an interactive shader-like spatial field whose thick lines and particles require GPU rasterization.",
    layers: [
      {
        content: ["geometry", "shader"],
        exportMode: "excluded" as const,
        id: "isoline-ring",
        kind: "product-foreground" as const,
        primitiveCount: "high" as const,
        renderer: "webgl" as const,
        uiSelector: "[data-toolcraft-product-output]",
      },
    ],
    performanceRisks: [
      "Line count scales instanced strip vertices on every rendered frame.",
      "Particle count scales transform-feedback simulation and point rendering.",
    ],
    previewRenderer: "webgl" as const,
    productRepresentation: "pixel" as const,
    rendererStrategy: "webgl" as const,
    sourceRepresentation: "procedural-data" as const,
    whyNotAlternativeStrategies: [
      "Canvas 2D cannot share a shader runtime with iOS WKWebView or keep particle physics on the GPU.",
      "SVG becomes costly to patch for dense animated strips and particle scattering.",
      "WebGPU would exclude the iOS 18 deployment baseline.",
    ],
  },
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        defaultValue: ISOLINE_LINE_COUNT_DEFAULT,
        id: "line-count",
        interactiveMax: ISOLINE_LINE_COUNT_MAX,
        mapping: "direct" as const,
        source: {
          kind: "schema-target" as const,
          target: "ring.lineCount",
          workloadBoundary: "maximum" as const,
        },
        unit: "count",
      },
      {
        defaultValue: ISOLINE_PARTICLE_COUNT_DEFAULT,
        id: "particle-count",
        interactiveMax: ISOLINE_PARTICLE_COUNT_MAX,
        mapping: "direct" as const,
        source: {
          kind: "schema-target" as const,
          target: "particles.count",
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

  if (path.interaction === "control-drag") {
    return {
      ...base,
      controlLabel: path.targets.includes("particles.count")
        ? "Particles count"
        : "Lines",
      interaction: "control-drag",
    };
  }

  if (path.interaction === "control-change") {
    return {
      ...base,
      controlLabel: "Flow",
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

  if (path.interaction === "export") {
    throw new Error("The Isoline player has no product artifact export path.");
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
  lineCount: {
    defaultValue: ISOLINE_LINE_COUNT_DEFAULT,
    max: ISOLINE_LINE_COUNT_MAX,
    min: ISOLINE_LINE_COUNT_MIN,
  },
  particleCount: {
    defaultValue: ISOLINE_PARTICLE_COUNT_DEFAULT,
    max: ISOLINE_PARTICLE_COUNT_MAX,
    min: ISOLINE_PARTICLE_COUNT_MIN,
  },
};
