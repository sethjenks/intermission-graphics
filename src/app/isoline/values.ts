import type { ToolcraftState } from "@/toolcraft/runtime";

import { isolineFontDefault, isolineReferenceValues } from "./presets";
import { isolineLookIds, type IsolineFontValue, type IsolineLookId, type IsolineSceneValues } from "./types";

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asLook(value: unknown): IsolineLookId {
  return isolineLookIds.includes(value as IsolineLookId)
    ? (value as IsolineLookId)
    : "reference";
}

function asLetterSpacing(value: unknown): IsolineFontValue["letterSpacing"] {
  switch (value) {
    case "tight":
    case "tighter":
    case "normal":
    case "wide":
    case "wider":
    case "widest":
      return value;
    default:
      return isolineFontDefault.letterSpacing;
  }
}

function asLineHeight(value: unknown): IsolineFontValue["lineHeight"] {
  switch (value) {
    case "loose":
    case "none":
    case "normal":
    case "relaxed":
    case "snug":
    case "tight":
      return value;
    default:
      return isolineFontDefault.lineHeight;
  }
}

function asTextCase(value: unknown): IsolineFontValue["textCase"] {
  switch (value) {
    case "capitalize":
    case "lowercase":
    case "original":
    case "titleCase":
    case "uppercase":
      return value;
    default:
      return isolineFontDefault.textCase;
  }
}

export function readIsolineFont(value: unknown): IsolineFontValue {
  if (typeof value !== "object" || value === null) {
    return isolineFontDefault;
  }

  const record = value as Record<string, unknown>;
  return {
    color: asString(record.color, isolineFontDefault.color),
    fontId: asString(record.fontId, isolineFontDefault.fontId),
    fontSize: asNumber(record.fontSize, isolineFontDefault.fontSize),
    fontWeight: asString(record.fontWeight, isolineFontDefault.fontWeight),
    letterSpacing: asLetterSpacing(record.letterSpacing),
    lineHeight: asLineHeight(record.lineHeight),
    opacity: asNumber(record.opacity, isolineFontDefault.opacity),
    textCase: asTextCase(record.textCase),
  };
}

export function readIsolineSceneValues(
  values: Record<string, unknown>,
): IsolineSceneValues {
  return {
    background: asString(values["appearance.background"], isolineReferenceValues.background),
    breathe: asBoolean(values["motion.breathe"], isolineReferenceValues.breathe),
    bulgeAmount: asNumber(values["ring.bulgeAmount"], isolineReferenceValues.bulgeAmount),
    bulgeAngle: asNumber(values["ring.bulgeAngle"], isolineReferenceValues.bulgeAngle),
    font: readIsolineFont(values["type.font"]),
    harmonicCount: asNumber(
      values["ring.harmonicCount"],
      isolineReferenceValues.harmonicCount,
    ),
    innerRadius: asNumber(values["ring.innerRadius"], isolineReferenceValues.innerRadius),
    lineColor: asString(values["ink.line"], isolineReferenceValues.lineColor),
    lineCount: asNumber(values["ring.lineCount"], isolineReferenceValues.lineCount),
    look: asLook(values["look.preset"]),
    orbit: asBoolean(values["motion.orbit"], isolineReferenceValues.orbit),
    outerRadius: asNumber(values["ring.outerRadius"], isolineReferenceValues.outerRadius),
    rotation: asNumber(values["ring.rotation"], isolineReferenceValues.rotation),
    seed: asNumber(values["look.seed"], isolineReferenceValues.seed),
    showSubtitle: asBoolean(
      values["type.showSubtitle"],
      isolineReferenceValues.showSubtitle,
    ),
    showTitle: asBoolean(values["type.showTitle"], isolineReferenceValues.showTitle),
    smoothness: asNumber(values["ring.smoothness"], isolineReferenceValues.smoothness),
    speed: asNumber(values["motion.speed"], isolineReferenceValues.speed),
    strokeWeight: asNumber(values["ring.strokeWeight"], isolineReferenceValues.strokeWeight),
    subtitle: asString(values["type.subtitle"], isolineReferenceValues.subtitle),
    title: asString(values["type.title"], isolineReferenceValues.title),
  };
}

export function readIsolineSceneValuesFromState(
  state: Readonly<ToolcraftState>,
): IsolineSceneValues {
  return readIsolineSceneValues(state.values);
}
