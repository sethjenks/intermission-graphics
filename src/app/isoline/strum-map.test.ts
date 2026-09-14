import { describe, expect, it } from "vitest";

import { isolineReferenceValues } from "./presets";
import {
  createIsolineViewProjection,
  evaluateIsolineSurface,
  pickIsolineStrumPlanar,
  pointerToIsolineNdc,
} from "./strum-map";

describe("isoline strum mapping", () => {
  it("recovers the planar point under a projected surface sample", () => {
    const values = isolineReferenceValues;
    const viewProjection = createIsolineViewProjection(values, 1);
    const sample = evaluateIsolineSurface(0.9, 0.55, values, 0.2);
    const projected = {
      x:
        (viewProjection[0]! * sample.world[0] +
          viewProjection[4]! * sample.world[1] +
          viewProjection[8]! * sample.world[2] +
          viewProjection[12]!) /
        (viewProjection[3]! * sample.world[0] +
          viewProjection[7]! * sample.world[1] +
          viewProjection[11]! * sample.world[2] +
          viewProjection[15]!),
      y:
        (viewProjection[1]! * sample.world[0] +
          viewProjection[5]! * sample.world[1] +
          viewProjection[9]! * sample.world[2] +
          viewProjection[13]!) /
        (viewProjection[3]! * sample.world[0] +
          viewProjection[7]! * sample.world[1] +
          viewProjection[11]! * sample.world[2] +
          viewProjection[15]!),
    };

    const picked = pickIsolineStrumPlanar(
      projected,
      values,
      0.2,
      viewProjection,
    );

    expect(picked.ndcDistance).toBeLessThan(0.02);
    expect(picked.x).toBeCloseTo(sample.planar[0], 1);
    expect(picked.y).toBeCloseTo(sample.planar[1], 1);
  });

  it("maps a right-side canvas click to the positive-x side of the ring", () => {
    const bounds = { height: 1000, left: 0, top: 0, width: 1000 };
    const pointer = pointerToIsolineNdc(680, 500, bounds);
    const picked = pickIsolineStrumPlanar(
      pointer,
      isolineReferenceValues,
      0,
      createIsolineViewProjection(isolineReferenceValues, 1),
    );

    expect(picked.x).toBeGreaterThan(0.15);
    expect(Math.abs(picked.y)).toBeLessThan(0.35);
    expect(picked.ndcDistance).toBeLessThan(0.12);

    const projected = projectWorld(
      picked.world,
      createIsolineViewProjection(isolineReferenceValues, 1),
    );
    expect(Math.abs(projected.x - pointer.x)).toBeLessThan(0.12);
    expect(Math.abs(projected.y - pointer.y)).toBeLessThan(0.12);
  });

  it("maps an upper canvas click to the positive-y side of the ring", () => {
    const bounds = { height: 1000, left: 0, top: 0, width: 1000 };
    const pointer = pointerToIsolineNdc(500, 320, bounds);
    const viewProjection = createIsolineViewProjection(isolineReferenceValues, 1);
    const picked = pickIsolineStrumPlanar(
      pointer,
      isolineReferenceValues,
      0,
      viewProjection,
    );

    expect(picked.y).toBeGreaterThan(0.12);
    expect(picked.ndcDistance).toBeLessThan(0.08);
  });
});

function projectWorld(
  world: readonly [number, number, number],
  viewProjection: Float32Array,
): { x: number; y: number } {
  const w =
    viewProjection[3]! * world[0] +
    viewProjection[7]! * world[1] +
    viewProjection[11]! * world[2] +
    viewProjection[15]!;
  const clipW = Math.abs(w) < 1e-6 ? 1e-6 : w;
  return {
    x:
      (viewProjection[0]! * world[0] +
        viewProjection[4]! * world[1] +
        viewProjection[8]! * world[2] +
        viewProjection[12]!) / clipW,
    y:
      (viewProjection[1]! * world[0] +
        viewProjection[5]! * world[1] +
        viewProjection[9]! * world[2] +
        viewProjection[13]!) / clipW,
  };
}
