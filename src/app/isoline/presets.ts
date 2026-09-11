import {
  ISOLINE_BACKGROUND_DEFAULT,
  ISOLINE_INVERSE_BACKGROUND,
  ISOLINE_INVERSE_LINE,
  ISOLINE_LINE_COUNT_DEFAULT,
  ISOLINE_LINE_DEFAULT,
  ISOLINE_SEED_DEFAULT,
} from "./constants";
import type { IsolineLookId, IsolineSceneValues } from "./types";

export const isolineFontDefault = {
  color: ISOLINE_LINE_DEFAULT,
  fontId: "inter",
  fontSize: 15,
  fontWeight: "400",
  letterSpacing: "widest",
  lineHeight: "normal",
  opacity: 100,
  textCase: "uppercase",
} as const;

export const isolineReferenceValues = {
  background: ISOLINE_BACKGROUND_DEFAULT,
  breathe: true,
  bulgeAmount: 0.26,
  bulgeAngle: 48,
  font: isolineFontDefault,
  harmonicCount: 3,
  innerRadius: 0.28,
  lineColor: ISOLINE_LINE_DEFAULT,
  lineCount: ISOLINE_LINE_COUNT_DEFAULT,
  look: "reference",
  orbit: true,
  outerRadius: 0.52,
  rotation: 8,
  seed: ISOLINE_SEED_DEFAULT,
  showSubtitle: true,
  showTitle: true,
  smoothness: 0.72,
  speed: 0.35,
  strokeWeight: 0.9,
  subtitle: "IMMERSSION & DISTANCEE",
  title: "TWOLANESS",
} satisfies IsolineSceneValues;

export const isolineLookValues: Record<
  IsolineLookId,
  Partial<IsolineSceneValues>
> = {
  dense: {
    lineCount: 96,
    look: "dense",
    strokeWeight: 0.55,
  },
  drift: {
    bulgeAmount: 0.28,
    harmonicCount: 4,
    look: "drift",
    orbit: true,
    speed: 0.7,
  },
  inverse: {
    background: ISOLINE_INVERSE_BACKGROUND,
    font: {
      ...isolineFontDefault,
      color: ISOLINE_INVERSE_LINE,
    },
    lineColor: ISOLINE_INVERSE_LINE,
    look: "inverse",
  },
  quiet: {
    bulgeAmount: 0.06,
    harmonicCount: 1,
    look: "quiet",
    orbit: false,
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
