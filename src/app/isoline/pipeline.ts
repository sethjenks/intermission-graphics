import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

type IsolinePipelinePasses = {
  "export-stroke": ToolcraftRendererPipelinePassContract<void>;
  "isoline-paths": ToolcraftRendererPipelinePassContract<Path2D[]>;
  "preview-stroke": ToolcraftRendererPipelinePassContract<void>;
};

const formTargets = [
  "look.preset",
  "look.seed",
  "ring.innerRadius",
  "ring.outerRadius",
  "ring.lineCount",
  "ring.strokeWeight",
  "ring.harmonicCount",
  "ring.bulgeAmount",
  "ring.bulgeAngle",
  "ring.smoothness",
  "ring.rotation",
  "motion.orbit",
  "motion.breathe",
  "motion.speed",
] as const;

const appearanceTargets = [
  "appearance.background",
  "ink.line",
  "type.title",
  "type.subtitle",
  "type.showTitle",
  "type.showSubtitle",
  "type.font",
] as const;

export const isolineRendererPipeline =
  registerToolcraftRendererPipeline<IsolinePipelinePasses>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: ["isoline-paths", "preview-stroke"],
        mustNotInvalidate: ["export-stroke"],
        targets: ["canvas.initial-render"],
      },
      {
        interaction: "animation-frame",
        invalidates: ["isoline-paths", "preview-stroke"],
        mustNotInvalidate: ["export-stroke"],
        targets: ["runtime.animation-frame"],
      },
      {
        interaction: "control-drag",
        invalidates: ["isoline-paths", "preview-stroke"],
        mustNotInvalidate: ["export-stroke"],
        targets: [
          "ring.innerRadius",
          "ring.outerRadius",
          "ring.lineCount",
          "ring.strokeWeight",
          "ring.harmonicCount",
          "ring.bulgeAmount",
          "ring.bulgeAngle",
          "ring.smoothness",
          "ring.rotation",
          "look.seed",
          "motion.speed",
        ],
      },
      {
        interaction: "control-change",
        invalidates: ["isoline-paths", "preview-stroke"],
        mustNotInvalidate: ["export-stroke"],
        targets: [...formTargets, ...appearanceTargets],
      },
      {
        interaction: "timeline-playback",
        invalidates: ["isoline-paths", "preview-stroke"],
        mustNotInvalidate: ["export-stroke"],
        targets: ["timeline.playback"],
      },
      {
        interaction: "timeline-scrub",
        invalidates: ["isoline-paths", "preview-stroke"],
        mustNotInvalidate: ["export-stroke"],
        targets: ["timeline.playback"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: ["isoline-paths", "preview-stroke", "export-stroke"],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: ["isoline-paths", "preview-stroke", "export-stroke"],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: ["export-stroke"],
        mustNotInvalidate: ["preview-stroke"],
        targets: ["actions.output"],
      },
    ],
    passes: [
      {
        cacheKey: [
          "ring.innerRadius",
          "ring.outerRadius",
          "ring.lineCount",
          "ring.harmonicCount",
          "ring.bulgeAmount",
          "ring.bulgeAngle",
          "ring.smoothness",
          "ring.rotation",
          "look.seed",
          "motion.orbit",
          "motion.breathe",
          "motion.speed",
          "runtime.timeline-progress",
        ],
        cost: {
          dimensions: ["line-count"],
          frequency: "frame",
          relationship: "linear",
        },
        id: "isoline-paths",
        inputs: [...formTargets, "runtime.timeline-progress"],
        invalidatedBy: [...formTargets, "runtime.timeline-progress"],
        kind: "vector-build",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cacheKey: [
          "isoline-paths",
          "ink.line",
          "type.font",
          "type.title",
          "type.subtitle",
          "type.showTitle",
          "type.showSubtitle",
          "appearance.background",
          "canvas.renderScale",
        ],
        cost: {
          dimensions: ["line-count"],
          frequency: "frame",
          relationship: "linear",
        },
        id: "preview-stroke",
        inputs: ["isoline-paths", ...appearanceTargets, "canvas.renderScale"],
        invalidatedBy: ["isoline-paths", ...appearanceTargets, "canvas.renderScale"],
        kind: "composite",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "preview",
        quality: "retina",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["line-count"],
          frequency: "batch",
          relationship: "linear",
        },
        id: "export-stroke",
        inputs: ["isoline-paths", ...appearanceTargets],
        invalidatedBy: ["isoline-paths", ...appearanceTargets],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
    runtimeId: "intermission-isoline-v1",
  });
