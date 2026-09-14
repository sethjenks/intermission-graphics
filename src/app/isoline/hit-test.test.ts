import { describe, expect, it } from "vitest";

import { isolinePointerHitsObject } from "./hit-test";
import { isolineReferenceValues } from "./presets";

const bounds = { height: 1000, left: 0, top: 0, width: 1000 };
const geometry = {
  bulgeAmount: isolineReferenceValues.bulgeAmount,
  cameraPosition: isolineReferenceValues.orientation.position,
  innerRadius: isolineReferenceValues.innerRadius,
  outerRadius: isolineReferenceValues.outerRadius,
};

describe("isolinePointerHitsObject", () => {
  it("hits the projected ring and misses the hole and surrounding field", () => {
    expect(isolinePointerHitsObject(680, 500, bounds, geometry)).toBe(true);
    expect(isolinePointerHitsObject(500, 500, bounds, geometry)).toBe(false);
    expect(isolinePointerHitsObject(80, 120, bounds, geometry)).toBe(false);
    expect(isolinePointerHitsObject(820, 500, bounds, geometry)).toBe(false);
  });
});
