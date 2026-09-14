import { describe, expect, it, vi } from "vitest";

import { appAcceptance } from "./app-acceptance-data";
import { appComposition } from "./app-composition";
import { appSchema } from "./app-schema";
import {
  ISOLINE_ANGULAR_SAMPLE_DEFAULT,
  ISOLINE_ANGULAR_SAMPLE_MAX,
  ISOLINE_ANGULAR_SAMPLE_MIN,
} from "./isoline/constants";
import { isolineReferenceValues } from "./isoline/presets";
import {
  advanceIsolineImpulses,
  consumeIsolineFixedSteps,
  createIsolineFixedStepClock,
} from "./isoline/webgl/physics";
import { selectIsolineAngularSamples } from "./isoline/webgl/geometry";
import {
  fieldFragmentShader,
  lineFragmentShader,
  lineVertexShader,
  particleVertexShader,
} from "./isoline/webgl/shaders";
import {
  readIsolineSceneValues,
  readIsolineSceneValuesFromState,
  resolveIsolineBackgroundGradient,
} from "./isoline/values";

describe("Isoline WebGL2 product", () => {
  it("maps canonical schema values into one shared renderer configuration", () => {
    const values = readIsolineSceneValues({});

    expect(values).toEqual(isolineReferenceValues);
    expect(
      readIsolineSceneValues({ "appearance.backgroundFill": "wash" })
        .backgroundFill,
    ).toBe("solid");
    expect(values.gradient.gradientType).toBe("angular");
    expect(values.backgroundGradient.gradientType).toBe("linear");
    expect(values.lineMode).toBe("solid");
    expect(values.canvasTool).toBe("strum");
    expect(values.orientation.position).toHaveLength(3);
  });

  it("normalizes imported compound and conditional values", () => {
    const values = readIsolineSceneValues({
      "appearance.backgroundFill": "image",
      "appearance.backgroundGradient": {
        angle: 45,
        gradientType: "radial",
        stops: [
          { color: "#112233", opacity: 100, position: "0%" },
          { color: "#445566", opacity: 40, position: "100%" },
        ],
      },
      "ink.gradient": {
        angle: 90,
        gradientType: "diamond",
        stops: [
          { color: "#000000", opacity: 25, position: "0%" },
          { color: "#FFFFFF", opacity: 80, position: "100%" },
        ],
      },
      "interaction.canvasTool": "orbit",
      "line.makeup": "particles",
      "line.thickness": [1, 4],
      "line.widthProfile": {
        activeChannel: "RGB",
        points: {
          RGB: [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
          ],
        },
      },
      "view.orbit": { position: [1, 2, 4], up: [0, 1, 0] },
    });

    expect(values.backgroundFill).toBe("image");
    expect(values.backgroundGradient.gradientType).toBe("radial");
    expect(values.gradient.gradientType).toBe("diamond");
    expect(values.canvasTool).toBe("orbit");
    expect(values.lineMode).toBe("particles");
    expect(values.lineThickness).toEqual([1, 4]);
    expect(values.widthProfile.points.RGB[0]).toEqual({ x: 0, y: 1 });
    expect(values.orientation.position).toEqual([1, 2, 4]);
  });

  it("reads renderer values from Toolcraft state without product-local storage", () => {
    const values = readIsolineSceneValuesFromState({
      values: {
        "motion.flow": false,
        "space.depthZ": 0.8,
      },
    } as unknown as Parameters<typeof readIsolineSceneValuesFromState>[0]);

    expect(values.flow).toBe(false);
    expect(values.depthZ).toBe(0.8);
  });

  it("uses the Setup color for an unedited cream background gradient", () => {
    const resolved = resolveIsolineBackgroundGradient({
      background: "#111318",
      backgroundGradient: isolineReferenceValues.backgroundGradient,
    });

    expect(resolved.stops.every((stop) => stop.color === "#111318")).toBe(true);
  });

  it("selects bounded angular sampling tiers", () => {
    expect(selectIsolineAngularSamples(400, 0)).toBe(
      ISOLINE_ANGULAR_SAMPLE_MIN,
    );
    expect(selectIsolineAngularSamples(1_000, 0)).toBe(
      ISOLINE_ANGULAR_SAMPLE_DEFAULT,
    );
    expect(selectIsolineAngularSamples(2_000, 1)).toBe(
      ISOLINE_ANGULAR_SAMPLE_MAX,
    );
  });

  it("advances fixed-step physics independently of display refresh", () => {
    const clock = createIsolineFixedStepClock();
    const step = vi.fn();

    expect(consumeIsolineFixedSteps(clock, 1, step)).toBe(0);
    expect(consumeIsolineFixedSteps(clock, 1 + 1 / 30, step)).toBe(2);
    expect(step).toHaveBeenCalledTimes(2);
  });

  it("decays and removes ephemeral impulses deterministically", () => {
    const impulse = {
      amplitude: 1,
      directionX: 1,
      directionY: 0,
      elapsedSeconds: 0,
      x: 0,
      y: 0,
    };

    expect(advanceIsolineImpulses([impulse], 0.5, 0.8)[0]?.elapsedSeconds).toBe(
      0.5,
    );
    expect(advanceIsolineImpulses([impulse], 10, 0.8)).toEqual([]);
  });

  it("ships GLSL ES 3.00 line and particle programs", () => {
    expect(lineVertexShader).toContain("#version 300 es");
    expect(lineVertexShader).toContain("gl_VertexID");
    expect(lineFragmentShader).toContain("uGradientType");
    expect(fieldFragmentShader).toContain("uHasImage");
    expect(particleVertexShader).toContain("gl_PointSize");
  });

  it("keeps settings transfer and removes product artifact exporters", () => {
    expect(appSchema.settingsTransfer.appId).toBe("intermission-graphics");
    expect(appComposition).not.toHaveProperty("exportRenderer");
    expect(JSON.stringify(appSchema)).not.toContain("export.image.format");
    expect(JSON.stringify(appSchema)).not.toContain("export.video.format");
    expect(JSON.stringify(appSchema)).not.toContain("actions.output");
  });
});

describe("Isoline acceptance catalog", () => {
  const schemaTargets = new Set(
    appSchema.panels.controls?.sections.flatMap((section) =>
      Object.values(section.controls).map((control) => control.target),
    ) ?? [],
  );

  for (const acceptance of appAcceptance) {
    it(acceptance.automatedTestName, () => {
      expect(acceptance.expectedObservable.trim().length).toBeGreaterThan(0);
      if (acceptance.target && acceptance.kind !== "runtime") {
        expect(schemaTargets.has(acceptance.target)).toBe(true);
      }
    });
  }
});
