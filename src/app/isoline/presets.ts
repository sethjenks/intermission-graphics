import {
  ISOLINE_BACKGROUND_DEFAULT,
  ISOLINE_INVERSE_BACKGROUND,
  ISOLINE_INVERSE_LINE,
  ISOLINE_LINE_COUNT_DEFAULT,
  ISOLINE_LINE_DEFAULT,
  ISOLINE_PARTICLE_COUNT_DEFAULT,
  ISOLINE_SEED_DEFAULT,
} from "./constants";
import type { IsolineLookId, IsolineSceneValues } from "./types";

export const isolineGradientDefault = {
  angle: 20,
  gradientType: "angular",
  stops: [
    { color: ISOLINE_LINE_DEFAULT, opacity: 100, position: "0%" },
    { color: "#6E8FFF", opacity: 100, position: "48%" },
    { color: "#173A9F", opacity: 100, position: "100%" },
  ],
} as const;

export const isolineBackgroundGradientDefault = {
  angle: 0,
  gradientType: "linear",
  stops: [
    { color: ISOLINE_BACKGROUND_DEFAULT, opacity: 100, position: "0%" },
    { color: ISOLINE_BACKGROUND_DEFAULT, opacity: 100, position: "100%" },
  ],
} as const;

export const isolineWidthProfileDefault = {
  activeChannel: "RGB",
  points: {
    RGB: [
      { x: 0, y: 0 },
      { x: 0.46, y: 0.62 },
      { x: 1, y: 1 },
    ],
  },
} as const;

export const isolineOrientationDefault = {
  position: [0, 0.65, 4.5],
  up: [0, 1, 0],
} as const;

export const isolineReferenceValues = {
  background: ISOLINE_BACKGROUND_DEFAULT,
  backgroundFill: "solid",
  backgroundGradient: isolineBackgroundGradientDefault,
  bendX: 0.12,
  bendY: -0.08,
  breathe: true,
  bulgeAmount: 0.26,
  bulgeAngle: 48,
  canvasTool: "strum",
  dashGap: 0.035,
  dashLength: 0.08,
  depthZ: 0.34,
  flow: true,
  gradient: isolineGradientDefault,
  harmonicCount: 3,
  innerRadius: 0.28,
  lineCount: ISOLINE_LINE_COUNT_DEFAULT,
  lineMode: "solid",
  lineThickness: [0.65, 1.6],
  look: "reference",
  orientation: isolineOrientationDefault,
  outerRadius: 0.52,
  particleCount: ISOLINE_PARTICLE_COUNT_DEFAULT,
  particleDamping: 0.88,
  particleReturn: 0.18,
  particleScatter: 0.75,
  particleSize: 2.2,
  particleSpread: 0.24,
  rotation: 8,
  seed: ISOLINE_SEED_DEFAULT,
  smoothness: 0.72,
  speed: 0.35,
  strumDamping: 0.86,
  strumRadius: 0.28,
  strumReturn: 0.2,
  strumStrength: 0.7,
  strumWaveSpeed: 1.2,
  widthProfile: isolineWidthProfileDefault,
} satisfies IsolineSceneValues;

export const isolineLookValues: Record<
  IsolineLookId,
  Partial<IsolineSceneValues>
> = {
  dense: {
    lineCount: 96,
    lineThickness: [0.45, 0.9],
    look: "dense",
  },
  drift: {
    bulgeAmount: 0.28,
    bendX: 0.2,
    harmonicCount: 4,
    look: "drift",
    flow: true,
    speed: 0.7,
  },
  inverse: {
    background: ISOLINE_INVERSE_BACKGROUND,
    backgroundFill: "solid",
    backgroundGradient: {
      angle: 0,
      gradientType: "linear",
      stops: [
        { color: ISOLINE_INVERSE_BACKGROUND, opacity: 100, position: "0%" },
        { color: ISOLINE_INVERSE_BACKGROUND, opacity: 100, position: "100%" },
      ],
    },
    gradient: {
      ...isolineGradientDefault,
      stops: [
        { color: ISOLINE_INVERSE_LINE, opacity: 100, position: "0%" },
        { color: "#91B4FF", opacity: 100, position: "50%" },
        { color: "#FFFFFF", opacity: 100, position: "100%" },
      ],
    },
    look: "inverse",
  },
  quiet: {
    bulgeAmount: 0.06,
    depthZ: 0.08,
    harmonicCount: 1,
    look: "quiet",
    flow: false,
    speed: 0.15,
  },
  reference: isolineReferenceValues,
};

export function getIsolineLookPatch(look: IsolineLookId): IsolineSceneValues {
  return {
    ...isolineReferenceValues,
    ...isolineLookValues[look],
    look,
  };
}
