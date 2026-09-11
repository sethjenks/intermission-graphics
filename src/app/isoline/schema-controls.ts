import {
  ISOLINE_LINE_COUNT_DEFAULT,
  ISOLINE_LINE_COUNT_MAX,
  ISOLINE_LINE_COUNT_MIN,
  ISOLINE_SEED_DEFAULT,
  ISOLINE_SEED_MAX,
  ISOLINE_SEED_MIN,
} from "./constants";
import { isolineFontDefault, isolineReferenceValues } from "./presets";

const always = { mode: "always" as const };

export const isolineBackgroundSection = {
  controls: {
    includeBackground: {
      applicability: always,
      defaultValue: true,
      description:
        "Hides the cream field in preview and PNG when off. Video still keeps the field.",
      label: "Include",
      performanceReason: "Toggles whether preview fills the field.",
      performanceRole: "responsiveness" as const,
      target: "export.includeBackground",
      type: "switch" as const,
    },
    background: {
      applicability: always,
      defaultValue: isolineReferenceValues.background,
      label: false,
      performanceReason: "Changes the field fill color.",
      performanceRole: "responsiveness" as const,
      target: "appearance.background",
      type: "color" as const,
    },
  },
  id: "background",
  title: "Background",
};

export const isolineLookSection = {
  controls: {
    preset: {
      applicability: always,
      defaultValue: isolineReferenceValues.look,
      description: "Applies a complete look from the same isoline family.",
      label: "Preset",
      options: [
        { label: "Reference", value: "reference" },
        { label: "Quiet", value: "quiet" },
        { label: "Drift", value: "drift" },
        { label: "Dense", value: "dense" },
        { label: "Inverse", value: "inverse" },
      ],
      performanceReason: "Swaps a small set of silhouette and color values.",
      performanceRole: "responsiveness" as const,
      target: "look.preset",
      type: "select" as const,
    },
  },
  id: "look",
  title: "Look",
};

export const isolineSeedSection = {
  controls: {
    seed: {
      applicability: always,
      defaultValue: ISOLINE_SEED_DEFAULT,
      description: "Keeps the same language while shifting harmonic phases.",
      label: "Seed",
      max: ISOLINE_SEED_MAX,
      min: ISOLINE_SEED_MIN,
      performanceReason: "Rebuilds isoline phases from a new random offset.",
      performanceRole: "responsiveness" as const,
      sliderValueKind: "continuous" as const,
      step: 1,
      target: "look.seed",
      type: "slider" as const,
    },
    randomize: {
      actions: [{ label: "Randomize", value: "randomize-seed" }],
      applicability: always,
      label: "New seed",
      performanceReason: "Writes a new seed and rebuilds isoline phases.",
      performanceRole: "responsiveness" as const,
      target: "look.randomize",
      type: "actions" as const,
    },
  },
  id: "seed",
  title: "Variation",
};

export const isolineRingSection = {
  controls: {
    innerRadius: {
      applicability: always,
      defaultValue: isolineReferenceValues.innerRadius,
      label: "Inner",
      max: 0.7,
      min: 0.08,
      performanceReason: "Changes hole size and rebuilds every isoline.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "silhouette",
      sliderValueKind: "continuous" as const,
      step: 0.01,
      target: "ring.innerRadius",
      type: "slider" as const,
    },
    outerRadius: {
      applicability: always,
      defaultValue: isolineReferenceValues.outerRadius,
      label: "Outer",
      max: 0.9,
      min: 0.16,
      performanceReason: "Changes ring width and rebuilds every isoline.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "silhouette",
      sliderValueKind: "continuous" as const,
      step: 0.01,
      target: "ring.outerRadius",
      type: "slider" as const,
    },
    rotation: {
      applicability: always,
      defaultValue: isolineReferenceValues.rotation,
      label: "Turn",
      max: 360,
      min: 0,
      performanceReason: "Rotates the shared silhouette.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "silhouette",
      sliderValueKind: "continuous" as const,
      step: 1,
      target: "ring.rotation",
      type: "slider" as const,
      unit: "°",
    },
    lineCount: {
      applicability: always,
      defaultValue: ISOLINE_LINE_COUNT_DEFAULT,
      description: "Number of closed contour steps between the hole and the outer edge.",
      label: "Lines",
      max: ISOLINE_LINE_COUNT_MAX,
      min: ISOLINE_LINE_COUNT_MIN,
      performanceReason: "Each added isoline is another stroked closed path.",
      performanceRole: "workload" as const,
      semanticGroup: "isolines",
      sliderValueKind: "continuous" as const,
      step: 1,
      target: "ring.lineCount",
      type: "slider" as const,
    },
    strokeWeight: {
      applicability: always,
      defaultValue: isolineReferenceValues.strokeWeight,
      label: "Weight",
      max: 24,
      min: 0.35,
      performanceReason: "Changes stroke thickness on every isoline.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "isolines",
      sliderValueKind: "continuous" as const,
      step: 0.05,
      target: "ring.strokeWeight",
      type: "slider" as const,
      unit: "px",
    },
    harmonicCount: {
      applicability: always,
      defaultValue: isolineReferenceValues.harmonicCount,
      label: "Harmonics",
      max: 6,
      min: 1,
      performanceReason: "Adds angular frequencies to the shared deformation.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "deform",
      markerCount: 6,
      sliderValueKind: "discrete" as const,
      step: 1,
      target: "ring.harmonicCount",
      type: "slider" as const,
      variant: "discrete" as const,
    },
    bulgeAmount: {
      applicability: always,
      defaultValue: isolineReferenceValues.bulgeAmount,
      label: "Bulge",
      max: 0.45,
      min: 0,
      performanceReason: "Scales the shared harmonic deformation.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "deform",
      sliderValueKind: "continuous" as const,
      step: 0.01,
      target: "ring.bulgeAmount",
      type: "slider" as const,
    },
    bulgeAngle: {
      applicability: always,
      defaultValue: isolineReferenceValues.bulgeAngle,
      label: "Angle",
      max: 360,
      min: 0,
      performanceReason: "Aims the primary bulge around the ring.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "deform",
      sliderValueKind: "continuous" as const,
      step: 1,
      target: "ring.bulgeAngle",
      type: "slider" as const,
      unit: "°",
    },
    smoothness: {
      applicability: always,
      defaultValue: isolineReferenceValues.smoothness,
      label: "Smooth",
      max: 1,
      min: 0,
      performanceReason: "Blends harmonic regularity against residual noise.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "deform",
      sliderValueKind: "continuous" as const,
      step: 0.01,
      target: "ring.smoothness",
      type: "slider" as const,
    },
  },
  id: "ring",
  title: "Ring",
};

export const isolineMotionSection = {
  controls: {
    orbit: {
      applicability: always,
      defaultValue: isolineReferenceValues.orbit,
      description: "Walks the bulge around the ring over one timeline loop.",
      label: "Orbit",
      performanceReason: "Adds a timeline-driven phase to isoline rebuilds.",
      performanceRole: "responsiveness" as const,
      target: "motion.orbit",
      type: "switch" as const,
    },
    breathe: {
      applicability: always,
      defaultValue: isolineReferenceValues.breathe,
      description: "Scales the ring in and out once per loop.",
      label: "Breathe",
      performanceReason: "Adds a timeline-driven scale to isoline rebuilds.",
      performanceRole: "responsiveness" as const,
      target: "motion.breathe",
      type: "switch" as const,
    },
  },
  id: "motion",
  layoutGroups: [
    {
      columns: 2 as const,
      controls: ["orbit", "breathe"],
      layout: "inline" as const,
    },
  ],
  title: "Motion",
};

export const isolineTempoSection = {
  controls: {
    speed: {
      applicability: always,
      defaultValue: isolineReferenceValues.speed,
      label: "Speed",
      max: 2,
      min: 0,
      performanceReason: "Changes how far orbit and breathe travel in one loop.",
      performanceRole: "responsiveness" as const,
      sliderValueKind: "continuous" as const,
      step: 0.05,
      target: "motion.speed",
      type: "slider" as const,
    },
  },
  id: "tempo",
  title: "Tempo",
};

export const isolineInkSection = {
  controls: {
    line: {
      applicability: always,
      defaultValue: isolineReferenceValues.lineColor,
      label: "Line",
      performanceReason: "Recolors every isoline stroke.",
      performanceRole: "responsiveness" as const,
      target: "ink.line",
      type: "color" as const,
    },
  },
  id: "ink",
  title: "Ink",
};

export const isolineTypeSection = {
  controls: {
    title: {
      applicability: always,
      commitMode: "content" as const,
      defaultValue: isolineReferenceValues.title,
      label: "Title",
      performanceReason: "Replaces the top caption string.",
      performanceRole: "responsiveness" as const,
      target: "type.title",
      textValueKind: "single-line" as const,
      type: "text" as const,
    },
    subtitle: {
      applicability: always,
      commitMode: "content" as const,
      defaultValue: isolineReferenceValues.subtitle,
      label: "Subtitle",
      performanceReason: "Replaces the bottom caption string.",
      performanceRole: "responsiveness" as const,
      target: "type.subtitle",
      textValueKind: "single-line" as const,
      type: "text" as const,
    },
  },
  id: "type",
  title: "Type",
};

export const isolineShowSection = {
  controls: {
    showTitle: {
      applicability: always,
      defaultValue: isolineReferenceValues.showTitle,
      label: "Title on",
      performanceReason: "Shows or hides the top caption.",
      performanceRole: "responsiveness" as const,
      target: "type.showTitle",
      type: "switch" as const,
    },
    showSubtitle: {
      applicability: always,
      defaultValue: isolineReferenceValues.showSubtitle,
      label: "Subtitle on",
      performanceReason: "Shows or hides the bottom caption.",
      performanceRole: "responsiveness" as const,
      target: "type.showSubtitle",
      type: "switch" as const,
    },
  },
  id: "show",
  layoutGroups: [
    {
      columns: 2 as const,
      controls: ["showTitle", "showSubtitle"],
      layout: "inline" as const,
    },
  ],
  title: "Show",
};

export const isolineStyleSection = {
  controls: {
    font: {
      applicability: always,
      defaultValue: isolineFontDefault,
      label: false,
      performanceReason: "Restyles both captions through the shared type block.",
      performanceRole: "responsiveness" as const,
      target: "type.font",
      type: "fontPicker" as const,
    },
  },
  id: "style",
  title: "Style",
};

export const isolineImageExportSection = {
  controls: {
    imageFormat: {
      applicability: always,
      defaultValue: "png",
      label: "Format",
      options: [
        { label: "PNG", value: "png" },
        { label: "JPG", value: "jpg" },
      ],
      performanceReason: "Selects the still encoder.",
      performanceRole: "responsiveness" as const,
      target: "export.image.format",
      type: "select" as const,
    },
    imageResolution: {
      applicability: always,
      defaultValue: "4k",
      label: "Resolution",
      options: [
        { label: "2K", value: "2k" },
        { label: "4K", value: "4k" },
        { label: "8K", value: "8k" },
      ],
      performanceReason: "Sets still long-edge output size.",
      performanceRole: "responsiveness" as const,
      target: "export.image.resolution",
      type: "select" as const,
    },
  },
  id: "image-export",
  layoutGroups: [
    {
      columns: 2 as const,
      controls: ["imageFormat", "imageResolution"],
      layout: "inline" as const,
    },
  ],
  title: "Image Export",
};

export const isolineVideoExportSection = {
  controls: {
    videoFormat: {
      applicability: always,
      defaultValue: "mp4",
      label: "Format",
      options: [
        { label: "MP4", value: "mp4" },
        { label: "WebM", value: "webm" },
      ],
      performanceReason: "Selects the video container.",
      performanceRole: "responsiveness" as const,
      target: "export.video.format",
      type: "select" as const,
    },
    videoResolution: {
      applicability: always,
      defaultValue: "current",
      label: "Resolution",
      options: [
        { label: "Current", value: "current" },
        { label: "4K", value: "4k" },
      ],
      performanceReason: "Sets video frame size.",
      performanceRole: "responsiveness" as const,
      target: "export.video.resolution",
      type: "select" as const,
    },
  },
  id: "video-export",
  layoutGroups: [
    {
      columns: 2 as const,
      controls: ["videoFormat", "videoResolution"],
      layout: "inline" as const,
    },
  ],
  title: "Video Export",
};

export const isolineExportActionsSection = {
  actionGroup: "secondary" as const,
  controls: {
    output: {
      actions: [
        {
          icon: "upload-simple" as const,
          label: "Export PNG",
          role: "export-image" as const,
          value: "export.image",
        },
        {
          icon: "upload-simple" as const,
          label: "Export Video",
          role: "export-video" as const,
          value: "export.video",
        },
      ],
      applicability: always,
      target: "actions.output",
      type: "panelActions" as const,
    },
  },
  id: "export",
  title: "Export",
};
