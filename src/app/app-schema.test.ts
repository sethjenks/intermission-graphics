import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { ISOLINE_SCENE_SIZE } from "./isoline/constants";

describe("appSchema", () => {
  it("publishes the isoline Toolcraft product contract", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(true);
    expect(appSchema.canvas.size).toEqual({
      height: ISOLINE_SCENE_SIZE,
      unit: "px",
      width: ISOLINE_SCENE_SIZE,
    });
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.toolbar).toMatchObject({
      history: true,
      radar: true,
      zoom: true,
    });
    expect(appSchema.assembly.capabilities).toEqual(
      expect.arrayContaining([
        "canvas.draggable",
        "canvas.editableSize",
        "canvas.renderScale",
        "canvas.upload",
        "controls.defaults",
        "controls.panel",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.zoom",
      ]),
    );
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).toEqual(
      expect.arrayContaining([
        "canvas.center",
        "canvas.setSize",
        "controls.reset",
        "controls.setValue",
        "history.undo",
      ]),
    );
    expect(appSchema.assembly.commands).not.toContain("timeline.setCurrentTime");
  });

  it("authors isoline product sections after Setup", () => {
    const productSections =
      appSchema.panels.controls?.sections
        .filter((section) => section.title !== "Setup")
        .map((section) => section.title) ?? [];

    expect(productSections).toEqual([
      "Background",
      "Look",
      "Variation",
      "Ring",
      "Space",
      "Line",
      "Width Profile",
      "Physics",
      "Motion",
      "Tempo",
      "Ink",
    ]);
  });

  it("uses autonomous continuous motion instead of timeline transport", () => {
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).not.toContain("timeline.setCurrentTime");
  });

  it("declares line and particle workload for the isoline pipeline", () => {
    expect(appPerformance.workloadEnvelope.dimensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "line-count",
          source: {
            kind: "schema-target",
            target: "ring.lineCount",
            workloadBoundary: "maximum",
          },
        }),
        expect.objectContaining({
          id: "particle-count",
          source: {
            kind: "schema-target",
            target: "particles.count",
            workloadBoundary: "maximum",
          },
        }),
      ]),
    );
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
  });

  it("declares production reload coverage for the isoline schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("The isoline app must persist user settings in localStorage.");
    }
    expect(appSchema.persistence.include).toContain("canvas");
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      automated: true,
      browser: true,
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: "canvas.size.width",
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});
