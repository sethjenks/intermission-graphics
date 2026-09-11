import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
  getToolcraftControlApplicabilityCases,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { isolineExportRenderer } from "./isoline/export-renderer";
import { sampleIsolineRadius } from "./isoline/geometry";
import { getIsolineLookPatch, isolineReferenceValues } from "./isoline/presets";
import { isolineSceneBoundsProvider } from "./isoline/scene-bounds";
import type { IsolineRenderInput } from "./isoline/types";
import { readIsolineSceneValues } from "./isoline/values";
import { appSchema } from "./app-schema";
import { ISOLINE_SCENE_BOUNDS, ISOLINE_SCENE_SIZE } from "./isoline/constants";

function referenceInput(
  overrides: Partial<IsolineRenderInput> = {},
): IsolineRenderInput {
  return {
    ...isolineReferenceValues,
    height: ISOLINE_SCENE_SIZE,
    press: null,
    progress: 0,
    width: ISOLINE_SCENE_SIZE,
    ...overrides,
  };
}

function sceneFromValues(
  values: Record<string, unknown>,
): ReturnType<typeof readIsolineSceneValues> {
  return readIsolineSceneValues({
    "appearance.background": isolineReferenceValues.background,
    "ink.line": isolineReferenceValues.lineColor,
    "look.preset": isolineReferenceValues.look,
    "look.seed": isolineReferenceValues.seed,
    "motion.breathe": isolineReferenceValues.breathe,
    "motion.orbit": isolineReferenceValues.orbit,
    "motion.speed": isolineReferenceValues.speed,
    "ring.bulgeAmount": isolineReferenceValues.bulgeAmount,
    "ring.bulgeAngle": isolineReferenceValues.bulgeAngle,
    "ring.harmonicCount": isolineReferenceValues.harmonicCount,
    "ring.innerRadius": isolineReferenceValues.innerRadius,
    "ring.lineCount": isolineReferenceValues.lineCount,
    "ring.outerRadius": isolineReferenceValues.outerRadius,
    "ring.rotation": isolineReferenceValues.rotation,
    "ring.smoothness": isolineReferenceValues.smoothness,
    "ring.strokeWeight": isolineReferenceValues.strokeWeight,
    "type.font": isolineReferenceValues.font,
    "type.showSubtitle": isolineReferenceValues.showSubtitle,
    "type.showTitle": isolineReferenceValues.showTitle,
    "type.subtitle": isolineReferenceValues.subtitle,
    "type.title": isolineReferenceValues.title,
    ...values,
  });
}

describe("isoline acceptance", () => {
  it("timeline playback controls drive rendered output", () => {
    const start = sampleIsolineRadius(referenceInput({ progress: 0 }), 20, 30);
    const mid = sampleIsolineRadius(referenceInput({ progress: 0.5 }), 20, 30);
    expect(mid).not.toBe(start);
    expect(appSchema.panels.timeline?.defaultDurationSeconds).toBe(12);
  });

  it("canvas.renderScale preserves selected backing pixels", () => {
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.canvas.renderScale.defaultValue).toBe(2);
  });

  it("infinity canvas restores the dormant finite size", () => {
    expect(appSchema.canvas.sizing.mode).toBe("editable-output");
    expect(appSchema.canvas.size.width).toBe(ISOLINE_SCENE_SIZE);
    expect(appSchema.canvas.size.height).toBe(ISOLINE_SCENE_SIZE);
  });

  it("infinity canvas crops image export to scene bounds", () => {
    expect(isolineSceneBoundsProvider({} as never)).toEqual([ISOLINE_SCENE_BOUNDS]);
    expect(ISOLINE_SCENE_BOUNDS.width).not.toBe(ISOLINE_SCENE_BOUNDS.height);
  });

  it("infinity canvas keeps one video export envelope", () => {
    const first = isolineSceneBoundsProvider({} as never);
    const later = isolineSceneBoundsProvider({} as never);
    expect(later).toEqual(first);
  });

  it("export.includeBackground changes product output", () => {
    expect(appAcceptance.find((entry) => entry.id === "export.includeBackground")).toMatchObject({
      backgroundOutputCoverage: "all-required-background-output",
    });
  });

  it("appearance.background changes product output", () => {
    expect(sceneFromValues({ "appearance.background": "#111318" }).background).toBe(
      "#111318",
    );
  });

  it("look.preset changes product output", () => {
    expect(getIsolineLookPatch("quiet").bulgeAmount).toBeLessThan(
      getIsolineLookPatch("drift").bulgeAmount,
    );
    expect(getIsolineLookPatch("dense").lineCount).toBeGreaterThan(
      isolineReferenceValues.lineCount,
    );
    expect(getIsolineLookPatch("inverse").background).not.toBe(
      isolineReferenceValues.background,
    );
  });

  it("look.seed changes product output", () => {
    const a = sampleIsolineRadius(referenceInput({ seed: 17 }), 20, 40);
    const b = sampleIsolineRadius(referenceInput({ seed: 91 }), 20, 40);
    expect(a).not.toBe(b);
  });

  it("look.randomize changes product output", () => {
    expect(
      appAcceptance.find((entry) => entry.id === "look.randomize")?.evidence,
    ).toBe("product-output");
  });

  it("ring.innerRadius changes product output", () => {
    const tight = sampleIsolineRadius(referenceInput({ innerRadius: 0.2 }), 0, 0);
    const open = sampleIsolineRadius(referenceInput({ innerRadius: 0.4 }), 0, 0);
    expect(open).toBeGreaterThan(tight);
  });

  it("ring.outerRadius changes product output", () => {
    const narrow = sampleIsolineRadius(referenceInput({ outerRadius: 0.4 }), 45, 0);
    const wide = sampleIsolineRadius(referenceInput({ outerRadius: 0.7 }), 45, 0);
    expect(wide).toBeGreaterThan(narrow);
  });

  it("ring.rotation changes product output", () => {
    const a = sampleIsolineRadius(referenceInput({ rotation: 8 }), 20, 20);
    const b = sampleIsolineRadius(referenceInput({ rotation: 80 }), 20, 20);
    expect(a).not.toBe(b);
  });

  it("ring.lineCount changes product output", () => {
    expect(sceneFromValues({ "ring.lineCount": 96 }).lineCount).toBe(96);
  });

  it("ring.strokeWeight changes product output", () => {
    expect(sceneFromValues({ "ring.strokeWeight": 2.4 }).strokeWeight).toBe(2.4);
  });

  it("ring.harmonicCount changes product output", () => {
    const quiet = sampleIsolineRadius(referenceInput({ harmonicCount: 1 }), 18, 50);
    const busy = sampleIsolineRadius(referenceInput({ harmonicCount: 5 }), 18, 50);
    expect(quiet).not.toBe(busy);
  });

  it("ring.bulgeAmount changes product output", () => {
    const calm = sampleIsolineRadius(referenceInput({ bulgeAmount: 0.04 }), 18, 20);
    const strong = sampleIsolineRadius(referenceInput({ bulgeAmount: 0.4 }), 18, 20);
    expect(Math.abs(strong - calm)).toBeGreaterThan(1);
  });

  it("ring.bulgeAngle changes product output", () => {
    const a = sampleIsolineRadius(referenceInput({ bulgeAngle: 48 }), 18, 20);
    const b = sampleIsolineRadius(referenceInput({ bulgeAngle: 200 }), 18, 20);
    expect(a).not.toBe(b);
  });

  it("ring.smoothness changes product output", () => {
    const smooth = sampleIsolineRadius(referenceInput({ smoothness: 1 }), 18, 70);
    const noisy = sampleIsolineRadius(referenceInput({ smoothness: 0 }), 18, 70);
    expect(smooth).not.toBe(noisy);
  });

  it("motion.orbit changes product output", () => {
    const parked = sampleIsolineRadius(
      referenceInput({ orbit: false, progress: 0.4 }),
      18,
      20,
    );
    const orbiting = sampleIsolineRadius(
      referenceInput({ orbit: true, progress: 0.4 }),
      18,
      20,
    );
    expect(orbiting).not.toBe(parked);
  });

  it("motion.breathe changes product output", () => {
    const still = sampleIsolineRadius(
      referenceInput({ breathe: false, progress: 0.25 }),
      18,
      20,
    );
    const live = sampleIsolineRadius(
      referenceInput({ breathe: true, progress: 0.25 }),
      18,
      20,
    );
    expect(live).not.toBe(still);
  });

  it("motion.speed changes product output", () => {
    const slow = sampleIsolineRadius(referenceInput({ speed: 0.2, progress: 0.4 }), 18, 20);
    const fast = sampleIsolineRadius(referenceInput({ speed: 1.6, progress: 0.4 }), 18, 20);
    expect(fast).not.toBe(slow);
  });

  it("ink.line changes product output", () => {
    expect(sceneFromValues({ "ink.line": "#E8EEF7" }).lineColor).toBe("#E8EEF7");
  });

  it("type.title changes product output", () => {
    expect(sceneFromValues({ "type.title": "LANES" }).title).toBe("LANES");
  });

  it("type.showTitle changes product output", () => {
    expect(sceneFromValues({ "type.showTitle": false }).showTitle).toBe(false);
  });

  it("type.subtitle changes product output", () => {
    expect(sceneFromValues({ "type.subtitle": "NEAR & FAR" }).subtitle).toBe("NEAR & FAR");
  });

  it("type.showSubtitle changes product output", () => {
    expect(sceneFromValues({ "type.showSubtitle": false }).showSubtitle).toBe(false);
  });

  it("type.font changes product output", () => {
    const font = sceneFromValues({
      "type.font": {
        ...isolineReferenceValues.font,
        fontSize: 22,
        letterSpacing: "tight",
        textCase: "lowercase",
      },
    }).font;
    expect(font.fontSize).toBe(22);
    expect(font.letterSpacing).toBe("tight");
    expect(font.textCase).toBe("lowercase");
  });

  it("export.image.format changes product output", () => {
    expect(appSchema.panels.controls?.sections.some((section) =>
      Object.values(section.controls).some((control) => control.target === "export.image.format"),
    )).toBe(true);
  });

  it("export.image.resolution changes product output", () => {
    expect(appSchema.panels.controls?.sections.some((section) =>
      Object.values(section.controls).some((control) => control.target === "export.image.resolution"),
    )).toBe(true);
  });

  it("export.video.format changes product output", () => {
    expect(appSchema.panels.controls?.sections.some((section) =>
      Object.values(section.controls).some((control) => control.target === "export.video.format"),
    )).toBe(true);
  });

  it("export.video.resolution changes product output", () => {
    expect(appSchema.panels.controls?.sections.some((section) =>
      Object.values(section.controls).some((control) => control.target === "export.video.resolution"),
    )).toBe(true);
  });

  it("limits applicability peers to switches and export selects", () => {
    const caseCount = (target: string) =>
      getToolcraftControlApplicabilityCases({
        schema: appSchema,
        sectionInventory: appControlSectionInventory,
        target,
      }).length;

    expect(caseCount("look.preset")).toBe(0);
    expect(caseCount("look.seed")).toBe(0);
    expect(caseCount("motion.speed")).toBe(0);
    expect(caseCount("type.title")).toBe(0);
    expect(caseCount("motion.orbit")).toBe(2);
    expect(caseCount("motion.breathe")).toBe(2);
    expect(caseCount("type.showTitle")).toBe(2);
    expect(caseCount("appearance.background")).toBe(2);
    expect(caseCount("export.image.format")).toBe(3);
    expect(caseCount("export.image.resolution")).toBe(2);
    expect(caseCount("export.video.format")).toBe(2);
    expect(caseCount("export.video.resolution")).toBe(2);
  });

  it("actions.output exports isoline artifacts", () => {
    expect(isolineExportRenderer.baseFileName).toBe("isoline-ring");
    expect(typeof isolineExportRenderer.renderFrame).toBe("function");
  });
});

describe("isoline performance paths", () => {
  for (const scenario of appPerformance.scenarios) {
    it(scenario.automatedTestName, () => {
      expect(scenario.pathId).toBe(scenario.id);
      expect(scenario.browserTestName).toBe(`browser perf: toolcraft path ${scenario.pathId}`);
    });
  }
});
