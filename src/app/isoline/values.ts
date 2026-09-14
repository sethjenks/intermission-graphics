import type { ToolcraftState } from "@/toolcraft/runtime";

import { isolineReferenceValues } from "./presets";
import {
  isolineBackgroundFills,
  isolineCanvasTools,
  isolineLineModes,
  isolineLookIds,
  type IsolineBackgroundFill,
  type IsolineCanvasTool,
  type IsolineCurve,
  type IsolineGradient,
  type IsolineGradientStop,
  type IsolineGradientType,
  type IsolineLineMode,
  type IsolineLookId,
  type IsolineOrientationPose,
  type IsolineSceneValues,
} from "./types";

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asLook(value: unknown): IsolineLookId {
  return isolineLookIds.includes(value as IsolineLookId)
    ? (value as IsolineLookId)
    : "reference";
}

function asCanvasTool(value: unknown): IsolineCanvasTool {
  return isolineCanvasTools.includes(value as IsolineCanvasTool)
    ? (value as IsolineCanvasTool)
    : isolineReferenceValues.canvasTool;
}

function asLineMode(value: unknown): IsolineLineMode {
  return isolineLineModes.includes(value as IsolineLineMode)
    ? (value as IsolineLineMode)
    : isolineReferenceValues.lineMode;
}

function asBackgroundFill(value: unknown): IsolineBackgroundFill {
  return isolineBackgroundFills.includes(value as IsolineBackgroundFill)
    ? (value as IsolineBackgroundFill)
    : isolineReferenceValues.backgroundFill;
}

function asGradientType(
  value: unknown,
  fallback: IsolineGradientType = isolineReferenceValues.gradient.gradientType,
): IsolineGradientType {
  switch (value) {
    case "linear":
    case "radial":
    case "angular":
    case "diamond":
      return value;
    default:
      return fallback;
  }
}

function asGradientStop(
  value: unknown,
  fallback: IsolineGradientStop,
): IsolineGradientStop {
  if (!isRecord(value)) {
    return fallback;
  }
  return {
    color: asString(value.color, fallback.color),
    opacity: asNumber(value.opacity, fallback.opacity),
    position: asString(value.position, fallback.position),
  };
}

function asGradient(
  value: unknown,
  fallback: IsolineGradient = isolineReferenceValues.gradient,
): IsolineGradient {
  if (!isRecord(value)) {
    return fallback;
  }
  const fallbackStops = fallback.stops;
  const stops = Array.isArray(value.stops)
    ? value.stops.map((stop, index) =>
        asGradientStop(
          stop,
          fallbackStops[index] ?? fallbackStops[fallbackStops.length - 1]!,
        ),
      )
    : fallbackStops;
  return {
    angle: asNumber(value.angle, fallback.angle),
    gradientType: asGradientType(value.gradientType, fallback.gradientType),
    stops: stops.length >= 2 ? stops : fallbackStops,
  };
}

function colorsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function resolveIsolineBackgroundGradient(
  values: Pick<IsolineSceneValues, "background" | "backgroundGradient">,
): IsolineGradient {
  const authored = values.backgroundGradient;
  const defaults = isolineReferenceValues.backgroundGradient.stops;
  const usesDefaultColors =
    authored.stops.length === defaults.length &&
    authored.stops.every((stop, index) =>
      colorsMatch(stop.color, defaults[index]?.color ?? ""),
    );
  if (!usesDefaultColors) {
    return authored;
  }
  return {
    ...authored,
    stops: authored.stops.map((stop) => ({
      ...stop,
      color: values.background,
    })),
  };
}

function asCurve(value: unknown): IsolineCurve {
  if (!isRecord(value) || !isRecord(value.points)) {
    return isolineReferenceValues.widthProfile;
  }
  const points = Array.isArray(value.points.RGB)
    ? value.points.RGB.flatMap((point) =>
        isRecord(point) &&
        typeof point.x === "number" &&
        Number.isFinite(point.x) &&
        typeof point.y === "number" &&
        Number.isFinite(point.y)
          ? [{ x: point.x, y: point.y }]
          : [],
      )
    : [];
  if (points.length < 2) {
    return isolineReferenceValues.widthProfile;
  }
  return {
    activeChannel: "RGB",
    points: { RGB: points },
  };
}

function asRange(
  value: unknown,
  fallback: readonly [number, number],
): readonly [number, number] {
  if (
    !Array.isArray(value) ||
    value.length < 2 ||
    typeof value[0] !== "number" ||
    !Number.isFinite(value[0]) ||
    typeof value[1] !== "number" ||
    !Number.isFinite(value[1])
  ) {
    return fallback;
  }
  return [value[0], value[1]];
}

function asVector3(
  value: unknown,
  fallback: readonly [number, number, number],
): readonly [number, number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((entry) => typeof entry !== "number" || !Number.isFinite(entry))
  ) {
    return fallback;
  }
  return [value[0] as number, value[1] as number, value[2] as number];
}

function asOrientation(value: unknown): IsolineOrientationPose {
  if (!isRecord(value)) {
    return isolineReferenceValues.orientation;
  }
  return {
    position: asVector3(
      value.position,
      isolineReferenceValues.orientation.position,
    ),
    up: asVector3(value.up, isolineReferenceValues.orientation.up),
  };
}

export function readIsolineSceneValues(
  values: Record<string, unknown>,
): IsolineSceneValues {
  return {
    background: asString(values["appearance.background"], isolineReferenceValues.background),
    backgroundFill: asBackgroundFill(values["appearance.backgroundFill"]),
    backgroundGradient: asGradient(
      values["appearance.backgroundGradient"],
      isolineReferenceValues.backgroundGradient,
    ),
    bendX: asNumber(values["space.bendX"], isolineReferenceValues.bendX),
    bendY: asNumber(values["space.bendY"], isolineReferenceValues.bendY),
    breathe: asBoolean(values["motion.breathe"], isolineReferenceValues.breathe),
    bulgeAmount: asNumber(values["ring.bulgeAmount"], isolineReferenceValues.bulgeAmount),
    bulgeAngle: asNumber(values["ring.bulgeAngle"], isolineReferenceValues.bulgeAngle),
    canvasTool: asCanvasTool(values["interaction.canvasTool"]),
    dashGap: asNumber(values["line.dashGap"], isolineReferenceValues.dashGap),
    dashLength: asNumber(values["line.dashLength"], isolineReferenceValues.dashLength),
    depthZ: asNumber(values["space.depthZ"], isolineReferenceValues.depthZ),
    flow: asBoolean(values["motion.flow"], isolineReferenceValues.flow),
    gradient: asGradient(values["ink.gradient"]),
    harmonicCount: asNumber(
      values["ring.harmonicCount"],
      isolineReferenceValues.harmonicCount,
    ),
    innerRadius: asNumber(values["ring.innerRadius"], isolineReferenceValues.innerRadius),
    lineCount: asNumber(values["ring.lineCount"], isolineReferenceValues.lineCount),
    lineMode: asLineMode(values["line.makeup"]),
    lineThickness: asRange(
      values["line.thickness"],
      isolineReferenceValues.lineThickness,
    ),
    look: asLook(values["look.preset"]),
    orientation: asOrientation(values["view.orbit"]),
    outerRadius: asNumber(values["ring.outerRadius"], isolineReferenceValues.outerRadius),
    particleCount: asNumber(
      values["particles.count"],
      isolineReferenceValues.particleCount,
    ),
    particleDamping: asNumber(
      values["particles.damping"],
      isolineReferenceValues.particleDamping,
    ),
    particleReturn: asNumber(
      values["particles.return"],
      isolineReferenceValues.particleReturn,
    ),
    particleScatter: asNumber(
      values["particles.scatter"],
      isolineReferenceValues.particleScatter,
    ),
    particleSize: asNumber(
      values["particles.size"],
      isolineReferenceValues.particleSize,
    ),
    particleSpread: asNumber(
      values["particles.spread"],
      isolineReferenceValues.particleSpread,
    ),
    rotation: asNumber(values["ring.rotation"], isolineReferenceValues.rotation),
    seed: asNumber(values["look.seed"], isolineReferenceValues.seed),
    smoothness: asNumber(values["ring.smoothness"], isolineReferenceValues.smoothness),
    speed: asNumber(values["motion.speed"], isolineReferenceValues.speed),
    strumDamping: asNumber(
      values["physics.damping"],
      isolineReferenceValues.strumDamping,
    ),
    strumRadius: asNumber(
      values["physics.radius"],
      isolineReferenceValues.strumRadius,
    ),
    strumReturn: asNumber(
      values["physics.return"],
      isolineReferenceValues.strumReturn,
    ),
    strumStrength: asNumber(
      values["physics.strength"],
      isolineReferenceValues.strumStrength,
    ),
    strumWaveSpeed: asNumber(
      values["physics.waveSpeed"],
      isolineReferenceValues.strumWaveSpeed,
    ),
    widthProfile: asCurve(values["line.widthProfile"]),
  };
}

export function readIsolineSceneValuesFromState(
  state: Readonly<ToolcraftState>,
): IsolineSceneValues {
  return readIsolineSceneValues(state.values);
}
