import { ISOLINE_MOTION_PERIOD_SECONDS } from "../constants";
import type { IsolineSceneValues } from "../types";
import { readIsolineSceneValues } from "../values";

export const ISOLINE_APP_ID = "intermission-graphics";
export const ISOLINE_PLAYER_VERSION = "1.0.0";
export const ISOLINE_PROTOCOL_VERSION = 1;
export const ISOLINE_MAX_SETTINGS_BYTES = 512 * 1024;

const supportedLegacyAppIds = new Set([
  "isoline-ring-webgl-v1",
  "isoline-ring/webgl-v1",
]);

export type IsolineSettingsTimeline = {
  currentTimeSeconds: number;
  durationSeconds: number;
  expanded?: boolean;
  isLooping: boolean;
  isPlaying?: boolean;
};

export type IsolineSettingsPayload = {
  appId: string;
  canvas: {
    mode: "finite" | "infinite";
    size: { height: number; width: number };
  };
  exportedAt?: string;
  source: "toolcraft-settings";
  timeline?: IsolineSettingsTimeline;
  values: Record<string, unknown>;
  version: 1 | 2;
};

export type IsolinePlayerConfig = {
  canvas: IsolineSettingsPayload["canvas"];
  scene: IsolineSceneValues;
  timeline: IsolineSettingsTimeline;
};

export type IsolineSettingsErrorCode =
  | "invalid-payload"
  | "payload-too-large"
  | "unsupported-app"
  | "unsupported-version";

export class IsolineSettingsError extends Error {
  readonly code: IsolineSettingsErrorCode;

  constructor(code: IsolineSettingsErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "IsolineSettingsError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function parseIsolineSettingsPayload(
  input: unknown,
): IsolinePlayerConfig {
  let serialized: string;
  try {
    const encoded = JSON.stringify(input);
    if (typeof encoded !== "string") {
      throw new Error("Not JSON.");
    }
    serialized = encoded;
  } catch {
    throw new IsolineSettingsError(
      "invalid-payload",
      "The settings payload must be serializable JSON.",
    );
  }
  if (new TextEncoder().encode(serialized).byteLength > ISOLINE_MAX_SETTINGS_BYTES) {
    throw new IsolineSettingsError(
      "payload-too-large",
      "The settings payload exceeds the 512 KB player limit.",
    );
  }
  if (
    !isRecord(input) ||
    input.source !== "toolcraft-settings" ||
    !isRecord(input.values) ||
    !isRecord(input.canvas) ||
    (input.timeline !== undefined && !isRecord(input.timeline))
  ) {
    throw new IsolineSettingsError(
      "invalid-payload",
      "Expected a Toolcraft settings payload.",
    );
  }
  if (input.version !== 1 && input.version !== 2) {
    throw new IsolineSettingsError(
      "unsupported-version",
      "This player supports Toolcraft settings versions 1 and 2.",
    );
  }
  if (
    input.appId !== ISOLINE_APP_ID &&
    !supportedLegacyAppIds.has(String(input.appId))
  ) {
    throw new IsolineSettingsError(
      "unsupported-app",
      `Settings for "${String(input.appId)}" cannot be loaded by this player.`,
    );
  }
  if (!isRecord(input.canvas.size)) {
    throw new IsolineSettingsError(
      "invalid-payload",
      "The settings payload has no valid canvas size.",
    );
  }
  const width = positiveNumber(input.canvas.size.width, 2_048);
  const height = positiveNumber(input.canvas.size.height, 2_048);
  return {
    canvas: {
      mode: input.canvas.mode === "infinite" ? "infinite" : "finite",
      size: { height, width },
    },
    scene: readIsolineSceneValues(input.values),
    timeline: {
      currentTimeSeconds: finiteNumber(
        isRecord(input.timeline) ? input.timeline.currentTimeSeconds : 0,
        0,
      ),
      durationSeconds: positiveNumber(
        isRecord(input.timeline) ? input.timeline.durationSeconds : undefined,
        ISOLINE_MOTION_PERIOD_SECONDS,
      ),
      expanded: Boolean(isRecord(input.timeline) && input.timeline.expanded),
      isLooping: !isRecord(input.timeline) || input.timeline.isLooping !== false,
      isPlaying: false,
    },
  };
}

export function createDefaultIsolineSettingsPayload(
  values: Record<string, unknown>,
): IsolineSettingsPayload {
  return {
    appId: ISOLINE_APP_ID,
    canvas: {
      mode: "finite",
      size: { height: 2_048, width: 2_048 },
    },
    source: "toolcraft-settings",
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: ISOLINE_MOTION_PERIOD_SECONDS,
      isLooping: true,
      isPlaying: false,
    },
    values,
    version: 2,
  };
}
