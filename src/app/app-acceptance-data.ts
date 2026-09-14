import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";

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
    expectedObservable: `${target} changes the rendered interactive isoline field.`,
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
    behaviorCoverage: [
      "no-user-facing-transport",
      "no-play-pause",
      "no-scrub",
      "no-duration-control",
      "no-loop-control",
      "no-export-at-time",
    ],
    mode: "autonomous",
    reason:
      "Flow and breathe are decorative self-running motion with no start, end, play, pause, scrub, or duration. Video export is removed, so the field does not need Toolcraft timeline transport.",
  },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: {
      evidence:
        "The user explicitly removed image and video export for this interactive-player project.",
      mode: "user-removed",
    },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "A panel command cannot preserve continuous spatial contact with the line field.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail: "The user explicitly requested that people strum the strings.",
        source: "user-request",
      },
      id: "line-strum",
      reason: "Direct canvas input provides immediate spatial wave feedback.",
      surface: "canvas",
      target: "physics.strength",
    },
    {
      alternative: {
        reason:
          "Direct manipulation cannot provide a stable exact authored strength value.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user requested controls for managing the physical line behavior.",
        source: "user-request",
      },
      id: "strum-strength-properties",
      reason: "The panel exposes a precise persistent strum-strength setting.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: "physics.strength",
    },
    {
      alternative: {
        reason:
          "Panel angle controls would duplicate the direct orbit gesture and orientation gizmo.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The user selected manual orbit with Toolcraft's orientation gizmo.",
        source: "user-request",
      },
      id: "view-orbit",
      reason: "Canvas orbit preserves direct spatial inspection of the XYZ form.",
      surface: "canvas",
      target: "view.orbit",
    },
  ],
  mode: "product",
  productName: "Isoline Ring",
  productSummary:
    "An interactive shader-like isoline instrument for web and iOS.",
  requestedBehavior:
    "Shape a hollow isoline field in XYZ, flow motion through gradient solid, dashed, or particle lines, strum it with physics, orbit the view, and transfer designs into one reusable web and iOS player.",
  viewInteraction: {
    mode: "orbit",
    orientationTargets: ["view.orbit"],
  },
};

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Background field",
      entityId: "background-field",
      groupingReason:
        "These controls own whether the field is included and which solid, gradient, or image fill it uses.",
      id: "background",
      targets: [
        "export.includeBackground",
        "appearance.backgroundFill",
        "appearance.background",
        "appearance.backgroundGradient",
        "appearance.backgroundImage",
      ],
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
      groupingReason: "These switches choose which continuous deformations are live.",
      id: "motion",
      targets: ["motion.flow", "motion.breathe"],
      title: "Motion",
    },
    {
      entity: "Tempo",
      entityId: "tempo",
      groupingReason: "This control sets how quickly continuous flow and breathe travel.",
      id: "tempo",
      targets: ["motion.speed"],
      title: "Tempo",
    },
    {
      entity: "Ink",
      entityId: "ink",
      groupingReason: "This control projects one editable gradient across every line.",
      id: "ink",
      targets: ["ink.gradient"],
      title: "Ink",
    },
    {
      entity: "Spatial form",
      entityId: "space",
      groupingReason:
        "These controls deform and orient the line field in three-dimensional space.",
      id: "space",
      targets: ["space.bendX", "space.bendY", "space.depthZ", "view.orbit"],
      title: "Space",
    },
    {
      entity: "Line construction",
      entityId: "line",
      groupingReason:
        "These controls choose line makeup and shape the radial width profile.",
      id: "line",
      targets: [
        "line.makeup",
        "line.thickness",
        "line.dashLength",
        "line.dashGap",
        "particles.count",
        "particles.size",
        "particles.spread",
        "particles.scatter",
        "particles.return",
        "particles.damping",
      ],
      title: "Line",
    },
    {
      entity: "Line width response",
      entityId: "width-profile",
      groupingReason:
        "This curve maps the inner-to-outer radial position to strip width.",
      id: "width-profile",
      targets: ["line.widthProfile"],
      title: "Width Profile",
    },
    {
      entity: "Strum physics",
      entityId: "physics",
      groupingReason:
        "These controls tune the spatial wave produced by direct strumming.",
      id: "physics",
      targets: [
        "physics.strength",
        "physics.radius",
        "physics.waveSpeed",
        "physics.damping",
        "physics.return",
      ],
      title: "Physics",
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
    automatedTestName: "canvas.renderScale preserves selected backing pixels",
    browser: true,
    browserTestName: "browser: canvas.renderScale preserves selected backing pixels",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Resolution scale changes backing pixels without changing CSS size during interaction and steady state.",
    fixture: "isoline render scale",
    id: "canvas.renderScale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "steady"],
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
  control("export.includeBackground", "switch", {
    backgroundOutputCoverage: [
      "infinity-viewport-color-and-dependency",
      "preview-hidden-when-excluded",
    ],
    evidence: "product-output",
    expectedObservable:
      "Turning Background off hides the preview field and keeps Infinity dependent on Background.",
  }),
  control("appearance.background", "color", {
    evidence: "product-output",
    expectedObservable:
      "The bounded preview and Infinity viewport use the selected field color.",
  }),
  control("appearance.backgroundFill", "segmented", {
    expectedObservable:
      "Type chooses a solid color, gradient, or image as the only field fill.",
    optionCoverage: "each-visible-item",
  }),
  control("appearance.backgroundGradient", "gradient", {
    controlPartCoverage: [
      "gradient.angle",
      "gradient.gradientType",
      "gradient.stops.color",
      "gradient.stops.opacity",
      "gradient.stops.position",
    ],
    expectedObservable:
      "The field fill follows the same gradient type, angle, and stops as Ink.",
  }),
  {
    automated: true,
    automatedTestName: "appearance.backgroundImage upload lifecycle updates the field",
    browser: true,
    browserTestName:
      "browser: appearance.backgroundImage upload lifecycle updates the field",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "Uploading a background image covers the field; rotate and flip change that cover; Clear and Reset remove it.",
    fixture: "isoline background image",
    id: "appearance.backgroundImage",
    kind: "control",
    mediaLifecycleCoverage: [
      "upload",
      "remove",
      "reset",
      "rotate",
      "flip",
      "transform-output",
    ],
    target: "appearance.backgroundImage",
    userAction:
      "Upload a background image, rotate 90°, flip horizontal, clear it, then Reset the Background section.",
  },
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
  control("ring.harmonicCount", "slider"),
  control("ring.bulgeAmount", "slider"),
  control("ring.bulgeAngle", "slider"),
  control("ring.smoothness", "slider"),
  control("space.bendX", "slider"),
  control("space.bendY", "slider"),
  control("space.depthZ", "slider"),
  {
    automated: true,
    automatedTestName: "view.orbit changes rendered spatial pose",
    browser: true,
    browserTestName:
      "browser: orientation gizmo and Orbit tool share the rendered pose",
    canvasHandle: {
      exportCleanTestName: "web and iOS players exclude editor orientation chrome",
      outputObservable: "The isoline field follows the shared orbit pose.",
      testId: "toolcraft-orientation-gizmo",
      writesTarget: "view.orbit",
    },
    componentType: "orientationGizmo",
    evidence: "product-output",
    expectedObservable:
      "Gizmo axis, gizmo drag, and a drag that starts outside the ring rotate the isoline field without strumming.",
    fixture: "spatial isoline field",
    id: "view.orbit",
    interactionId: "view-orbit",
    kind: "canvas-handle",
    orientationGizmoCoverage: "all-required-orientation-gizmo-behavior",
    target: "view.orbit",
    userAction:
      "Drag the orientation gizmo, or press outside the ring and drag to orbit.",
  },
  control("motion.flow", "switch"),
  control("motion.breathe", "switch"),
  control("motion.speed", "slider"),
  control("ink.gradient", "gradient", {
    controlPartCoverage: [
      "gradient.angle",
      "gradient.gradientType",
      "gradient.stops.color",
      "gradient.stops.opacity",
      "gradient.stops.position",
    ],
  }),
  control("line.makeup", "segmented", {
    optionCoverage: "each-visible-item",
  }),
  control("line.thickness", "rangeSlider", {
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
  }),
  control("line.widthProfile", "curves", {
    controlPartCoverage: ["curves.points"],
  }),
  control("line.dashLength", "slider"),
  control("line.dashGap", "slider"),
  control("particles.count", "slider"),
  control("particles.size", "slider"),
  control("particles.spread", "slider"),
  control("particles.scatter", "slider"),
  control("particles.return", "slider"),
  control("particles.damping", "slider"),
  control("physics.strength", "slider", {
    interactionId: "strum-strength-properties",
  }),
  control("physics.radius", "slider"),
  control("physics.waveSpeed", "slider"),
  control("physics.damping", "slider"),
  control("physics.return", "slider"),
  {
    automated: true,
    automatedTestName: "canvas strum creates and settles a spatial wave",
    browser: true,
    browserTestName: "browser: Strum tool deforms the line field and settles",
    canvasHandle: {
      exportCleanTestName: "settings transfer excludes ephemeral strum impulses",
      outputObservable: "The line field deforms around the pointer path.",
      testId: "isoline-strum-surface",
      writesTarget: "physics.strength",
    },
    componentType: "canvasInteraction",
    evidence: "product-output",
    expectedObservable:
      "Dragging on the ring creates a bounded wave that decays back to rest.",
    fixture: "interactive isoline field",
    id: "interaction.strum",
    interactionId: "line-strum",
    kind: "canvas-handle",
    target: "physics.strength",
    userAction: "Press the visible ring and drag across it.",
  },
];
