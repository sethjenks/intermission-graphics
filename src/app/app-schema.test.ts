import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { ISOLINE_LOOP_SECONDS, ISOLINE_SCENE_SIZE } from "./isoline/constants";

describe("appSchema", () => {
  it("publishes the isoline Toolcraft product contract", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.canvas.size).toEqual({
      height: ISOLINE_SCENE_SIZE,
      unit: "px",
      width: ISOLINE_SCENE_SIZE,
    });
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toMatchObject({
      defaultDurationSeconds: ISOLINE_LOOP_SECONDS,
      enabled: true,
      mode: "playback",
    });
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
        "controls.defaults",
        "controls.panel",
        "timeline.playback",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.zoom",
      ]),
    );
    expect(appSchema.assembly.capabilities).not.toContain("canvas.upload");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).toEqual(
      expect.arrayContaining([
        "canvas.center",
        "canvas.setSize",
        "controls.reset",
        "controls.setValue",
        "history.undo",
        "timeline.setCurrentTime",
      ]),
    );
  });

  it("authors isoline product sections after Setup", () => {
    const productSections =
      appSchema.panels.controls?.sections
        .filter((section) => section.title !== "Setup")
        .map((section) => section.title) ?? [];

    expect(productSections).toEqual([
      "Look",
      "Variation",
      "Ring",
      "Motion",
      "Tempo",
      "Ink",
      "Type",
      "Show",
      "Style",
      "Image Export",
      "Video Export",
      "Export",
    ]);
  });

  it("enables playback timeline for orbit and breathe", () => {
    expect(appSchema.assembly.capabilities).toContain("timeline.playback");
    expect(appSchema.assembly.commands).toContain("timeline.setCurrentTime");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
  });

  it("declares line-count workload for the isoline pipeline", () => {
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
