import { describe, expect, it } from "vitest";

import {
  ISOLINE_APP_ID,
  IsolineSettingsError,
  createDefaultIsolineSettingsPayload,
  parseIsolineSettingsPayload,
} from "./config";

describe("Isoline player settings adapter", () => {
  it("loads the versioned Toolcraft payload and applies missing defaults", () => {
    const payload = createDefaultIsolineSettingsPayload({
      "line.makeup": "dashed",
      "space.depthZ": 0.75,
    });
    const config = parseIsolineSettingsPayload(payload);

    expect(payload.appId).toBe(ISOLINE_APP_ID);
    expect(config.scene.lineMode).toBe("dashed");
    expect(config.scene.depthZ).toBe(0.75);
    expect(config.scene.strumStrength).toBeGreaterThan(0);
  });

  it("migrates the supported legacy app identity", () => {
    const payload = {
      ...createDefaultIsolineSettingsPayload({}),
      appId: "isoline-ring-webgl-v1",
      version: 1 as const,
    };

    expect(parseIsolineSettingsPayload(payload).scene.lineMode).toBe("solid");
  });

  it("rejects unsupported app identities and newer payload versions", () => {
    expect(() =>
      parseIsolineSettingsPayload({
        ...createDefaultIsolineSettingsPayload({}),
        appId: "another-app",
      }),
    ).toThrow(IsolineSettingsError);
    expect(() =>
      parseIsolineSettingsPayload({
        ...createDefaultIsolineSettingsPayload({}),
        version: 3,
      }),
    ).toThrowError(/versions 1 and 2/u);
  });

  it("accepts settings without a timeline transport block", () => {
    const { timeline: _timeline, ...payload } =
      createDefaultIsolineSettingsPayload({});

    expect(parseIsolineSettingsPayload(payload).scene.lineMode).toBe("solid");
  });

  it("rejects oversized settings before parsing values", () => {
    expect(() =>
      parseIsolineSettingsPayload({
        ...createDefaultIsolineSettingsPayload({}),
        values: { unknown: "x".repeat(600_000) },
      }),
    ).toThrowError(/512 KB/u);
  });
});
