export const isolineLookIds = [
  "reference",
  "quiet",
  "drift",
  "dense",
  "inverse",
] as const;

export type IsolineLookId = (typeof isolineLookIds)[number];

export type IsolineFontValue = {
  color: string;
  fontId: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing:
    | "tight"
    | "tighter"
    | "normal"
    | "wide"
    | "wider"
    | "widest";
  lineHeight: "loose" | "none" | "normal" | "relaxed" | "snug" | "tight";
  opacity: number;
  textCase: "capitalize" | "lowercase" | "original" | "titleCase" | "uppercase";
};

export type IsolinePress = {
  active?: boolean;
  strength: number;
  x: number;
  y: number;
};

export type IsolineSceneValues = {
  background: string;
  breathe: boolean;
  bulgeAmount: number;
  bulgeAngle: number;
  font: IsolineFontValue;
  harmonicCount: number;
  innerRadius: number;
  lineColor: string;
  lineCount: number;
  look: IsolineLookId;
  orbit: boolean;
  outerRadius: number;
  rotation: number;
  seed: number;
  showSubtitle: boolean;
  showTitle: boolean;
  smoothness: number;
  speed: number;
  strokeWeight: number;
  subtitle: string;
  title: string;
};

export type IsolineRenderInput = IsolineSceneValues & {
  height: number;
  press: IsolinePress | null;
  progress: number;
  width: number;
};
