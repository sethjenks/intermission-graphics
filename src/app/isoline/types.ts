export const isolineLookIds = [
  "reference",
  "quiet",
  "drift",
  "dense",
  "inverse",
] as const;

export type IsolineLookId = (typeof isolineLookIds)[number];

export const isolineBackgroundFills = ["solid", "gradient", "image"] as const;

export type IsolineBackgroundFill = (typeof isolineBackgroundFills)[number];

export const isolineLineModes = ["solid", "dashed", "particles"] as const;

export type IsolineLineMode = (typeof isolineLineModes)[number];

export const isolineCanvasTools = ["strum", "orbit"] as const;

export type IsolineCanvasTool = (typeof isolineCanvasTools)[number];

export type IsolineGradientType =
  | "linear"
  | "radial"
  | "angular"
  | "diamond";

export type IsolineGradientStop = {
  color: string;
  opacity: number;
  position: string;
};

export type IsolineGradient = {
  angle: number;
  gradientType: IsolineGradientType;
  stops: readonly IsolineGradientStop[];
};

export type IsolineCurvePoint = {
  x: number;
  y: number;
};

export type IsolineCurve = {
  activeChannel: "RGB";
  points: {
    RGB: readonly IsolineCurvePoint[];
  };
};

export type IsolineOrientationPose = {
  position: readonly [number, number, number];
  up: readonly [number, number, number];
};

export type IsolineImpulse = {
  amplitude: number;
  directionX: number;
  directionY: number;
  elapsedSeconds: number;
  x: number;
  y: number;
};

export type IsolineBackgroundImage = {
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotationDeg: 0 | 90 | 180 | 270;
  source: TexImageSource;
};

export type IsolineSceneValues = {
  background: string;
  backgroundFill: IsolineBackgroundFill;
  backgroundGradient: IsolineGradient;
  bendX: number;
  bendY: number;
  breathe: boolean;
  bulgeAmount: number;
  bulgeAngle: number;
  canvasTool: IsolineCanvasTool;
  dashGap: number;
  dashLength: number;
  depthZ: number;
  flow: boolean;
  gradient: IsolineGradient;
  harmonicCount: number;
  innerRadius: number;
  lineCount: number;
  lineMode: IsolineLineMode;
  lineThickness: readonly [number, number];
  look: IsolineLookId;
  orientation: IsolineOrientationPose;
  outerRadius: number;
  particleCount: number;
  particleDamping: number;
  particleReturn: number;
  particleScatter: number;
  particleSize: number;
  particleSpread: number;
  rotation: number;
  seed: number;
  smoothness: number;
  speed: number;
  strumDamping: number;
  strumRadius: number;
  strumReturn: number;
  strumStrength: number;
  strumWaveSpeed: number;
  widthProfile: IsolineCurve;
};

export type IsolineRenderInput = IsolineSceneValues & {
  height: number;
  impulses: readonly IsolineImpulse[];
  progress: number;
  width: number;
};
