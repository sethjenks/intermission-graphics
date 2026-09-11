import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { ISOLINE_LOOP_SECONDS } from "./isoline/constants";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

function control(
  target: string,
  componentType: string,
  extras: Partial<ToolcraftComponentAcceptance> = {},
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${target} changes product output`,
    browser: true,
    browserTestName: `browser: ${target} changes product output`,
    componentType,
    evidence: "product-output",
    expectedObservable: `${target} changes the rendered isoline ring or captions.`,
    fixture: `${target} isoline fixture`,
    id: target,
    kind: "control",
    target,
    userAction: `Change ${target} in the controls panel.`,
    ...extras,
  };
}

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence:
        "One forward orbit and one breathe cycle complete in 12 seconds so the first and last frames stitch without reversing.",
      seconds: ISOLINE_LOOP_SECONDS,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: {
      evidence:
        "Export a square still (1:1, at least 2000px) and a looping video/GIF of the idle motion.",
      mode: "user-requested",
    },
  },
  interactionOwnership: [],
  mode: "product",
  productName: "Isoline Ring",
  productSummary:
    "A procedural topographic torus generator for stills and looping motion.",
  requestedBehavior:
    "Build a hollow isoline ring from blended inner and outer paths, deform it with harmonics, caption it, animate orbit and breathe on the Toolcraft timeline, and export PNG plus video.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The product is a flat line drawing with no three-dimensional scene or model.",
  },
};

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Background field",
      entityId: "background-field",
      groupingReason:
        "These controls own whether the cream field is included and which color fills it.",
      id: "background",
      targets: ["export.includeBackground", "appearance.background"],
      title: "Background",
    },
    {
      entity: "Look",
      entityId: "look",
      groupingReason: "This control applies one complete isoline family look.",
      id: "look",
      targets: ["look.preset"],
      title: "Look",
    },
    {
      entity: "Seed",
      entityId: "seed",
      groupingReason: "These controls pick a new silhouette without leaving the family.",
      id: "seed",
      targets: ["look.seed", "look.randomize"],
      title: "Variation",
    },
    {
      entity: "Ring",
      entityId: "ring",
      groupingReason:
        "These controls author the isoline torus silhouette, density, and deformation together.",
      id: "ring",
      targets: [
        "ring.innerRadius",
        "ring.outerRadius",
        "ring.rotation",
        "ring.lineCount",
        "ring.strokeWeight",
        "ring.harmonicCount",
        "ring.bulgeAmount",
        "ring.bulgeAngle",
        "ring.smoothness",
      ],
      title: "Ring",
    },
    {
      entity: "Motion",
      entityId: "motion",
      groupingReason: "These switches choose which timeline deformations are live.",
      id: "motion",
      targets: ["motion.orbit", "motion.breathe"],
      title: "Motion",
    },
    {
      entity: "Tempo",
      entityId: "tempo",
      groupingReason: "This control sets how far orbit and breathe travel in one loop.",
      id: "tempo",
      targets: ["motion.speed"],
      title: "Tempo",
    },
    {
      entity: "Ink",
      entityId: "ink",
      groupingReason: "This control colors every isoline stroke.",
      id: "ink",
      targets: ["ink.line"],
      title: "Ink",
    },
    {
      entity: "Type",
      entityId: "type",
      groupingReason: "These controls edit the two caption strings.",
      id: "type",
      targets: ["type.title", "type.subtitle"],
      title: "Type",
    },
    {
      entity: "Show",
      entityId: "show",
      groupingReason: "These switches show or hide the two captions.",
      id: "show",
      targets: ["type.showTitle", "type.showSubtitle"],
      title: "Show",
    },
    {
      entity: "Style",
      entityId: "style",
      groupingReason: "The shared type block restyles both captions together.",
      id: "style",
      targets: ["type.font"],
      title: "Style",
    },
    {
      entity: "Image export",
      entityId: "image-export",
      groupingReason:
        "Image format and resolution are one delivery stage for stills.",
      id: "image-export",
      targets: ["export.image.format", "export.image.resolution"],
      title: "Image Export",
    },
    {
      entity: "Video export",
      entityId: "video-export",
      groupingReason:
        "Video format and resolution are one delivery stage for motion.",
      id: "video-export",
      targets: ["export.video.format", "export.video.resolution"],
      title: "Video Export",
    },
  ];

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName:
      "declares production reload coverage for the isoline schema",
    browser: true,
    browserTestName:
      "browser: app restores exact canvas, values, and panel workspace slices after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size and zoom, isoline values, and the moved and collapsed Controls workspace remain visibly restored after a real browser reload.",
    fixture: "isoline persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "canvas.size.width",
    userAction:
      "Edit Canvas width and zoom, move and collapse Controls, wait for persistence, and reload the page.",
  },
  {
    automated: true,
    automatedTestName: "timeline playback controls drive rendered output",
    browser: true,
    browserTestName: "browser: timeline playback controls drive rendered output",
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Pause, scrub, duration, and a forward seamless loop change the isoline phase through runtime timeline progress.",
    fixture: "isoline timeline playback",
    id: "timeline.playback",
    kind: "runtime",
    target: "timeline.playback",
    timelineCoverage: "playback",
    timelineLoopProof: {
      direction: "forward-only",
      durationChange: "reproved-after-edit",
      reversePlayback: "forbidden",
      seam: "first-last-match",
    },
    timelinePlaybackCoverage: [
      "pause-resume",
      "scrub",
      "duration",
      "loop",
      "rendered-frame",
    ],
    userAction:
      "Pause, scrub, edit duration, and confirm first and last frames stitch without reverse motion.",
  },
  {
    automated: true,
    automatedTestName: "canvas.renderScale preserves selected backing pixels",
    browser: true,
    browserTestName: "browser: canvas.renderScale preserves selected backing pixels",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Resolution scale changes backing pixels without changing CSS size during interaction, playback, and steady state.",
    fixture: "isoline render scale",
    id: "canvas.renderScale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "playback", "steady"],
    },
    target: "canvas.renderScale",
    userAction: "Change Resolution scale and inspect canvas backing pixels.",
  },
  {
    automated: true,
    automatedTestName: "infinity canvas restores the dormant finite size",
    browser: true,
    browserTestName: "browser: infinity canvas restores the dormant finite size",
    componentType: "switch",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity canvas hides finite size controls and restores the previous finite size when turned off.",
    fixture: "isoline infinity mode",
    id: "canvas.infinity.mode",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Enable Infinity canvas, then disable it.",
  },
  {
    automated: true,
    automatedTestName: "infinity canvas crops image export to scene bounds",
    browser: true,
    browserTestName: "browser: infinity canvas crops image export to scene bounds",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinite PNG export crops to the isoline scene bounds provider union.",
    fixture: "isoline infinity image export",
    id: "canvas.infinity.image-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "actions.output",
    userAction: "Enable Infinity canvas and export PNG.",
  },
  {
    automated: true,
    automatedTestName: "infinity canvas keeps one video export envelope",
    browser: true,
    browserTestName: "browser: infinity canvas keeps one video export envelope",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinite video export uses one scene-bounds envelope for every scheduled frame.",
    fixture: "isoline infinity video export",
    id: "canvas.infinity.video-export",
    infinityCanvasCoverage: "scene-bounds-video-export",
    kind: "runtime",
    target: "actions.output",
    userAction: "Enable Infinity canvas and export video.",
  },
  control("export.includeBackground", "switch", {
    backgroundOutputCoverage: "all-required-background-output",
    evidence: "product-output",
    expectedObservable:
      "Turning Background off hides the preview field, makes PNG transparent, keeps Infinity dependent on Background, and preserves video background.",
  }),
  control("appearance.background", "color", {
    evidence: "exported-bytes",
    expectedObservable:
      "Video frames pick up the paper color, including when preview fill is hidden.",
  }),
  control("look.preset", "select", {
    optionCoverage: "each-visible-item",
  }),
  control("look.seed", "slider"),
  control("look.randomize", "actions", {
    expectedObservable: "Randomize writes a new look.seed and rebuilds the silhouette.",
  }),
  control("ring.innerRadius", "slider"),
  control("ring.outerRadius", "slider"),
  control("ring.rotation", "slider"),
  control("ring.lineCount", "slider"),
  control("ring.strokeWeight", "slider"),
  control("ring.harmonicCount", "slider"),
  control("ring.bulgeAmount", "slider"),
  control("ring.bulgeAngle", "slider"),
  control("ring.smoothness", "slider"),
  control("motion.orbit", "switch"),
  control("motion.breathe", "switch"),
  control("motion.speed", "slider"),
  control("ink.line", "color"),
  control("type.title", "text"),
  control("type.showTitle", "switch"),
  control("type.subtitle", "text"),
  control("type.showSubtitle", "switch"),
  control("type.font", "fontPicker", {
    controlPartCoverage: [
      "fontPicker.fontId",
      "fontPicker.fontWeight",
      "fontPicker.fontSize",
      "fontPicker.letterSpacing",
      "fontPicker.lineHeight",
      "fontPicker.textCase",
      "fontPicker.color",
      "fontPicker.opacity",
    ],
  }),
  control("export.image.format", "select", {
    evidence: "exported-bytes",
    expectedObservable: "PNG and JPG stills decode as different image types.",
    optionCoverage: "each-visible-item",
  }),
  control("export.image.resolution", "select", {
    evidence: "exported-bytes",
    expectedObservable: "2K, 4K, and 8K stills decode at different pixel sizes.",
    optionCoverage: "each-visible-item",
  }),
  control("export.video.format", "select", {
    evidence: "exported-bytes",
    expectedObservable: "MP4 and WebM loops decode as different containers.",
    optionCoverage: "each-visible-item",
  }),
  control("export.video.resolution", "select", {
    evidence: "exported-bytes",
    expectedObservable: "Current and 4K loops decode at different frame sizes.",
    optionCoverage: "each-visible-item",
  }),
  {
    actionCoverage: ["export.image", "export.video"],
    automated: true,
    automatedTestName: "actions.output exports isoline artifacts",
    browser: true,
    browserTestName: "browser: actions.output exports isoline artifacts",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export PNG and Export Video download isoline artifacts that consume format, resolution, background, and timeline progress.",
    exportArtifactCoverage: [
      "all-required-image-export-behavior",
      "all-required-video-export-behavior",
    ],
    fixture: "isoline export fixture",
    id: "actions.output",
    kind: "control",
    target: "actions.output",
    userAction: "Click Export PNG and Export Video.",
  },
];
