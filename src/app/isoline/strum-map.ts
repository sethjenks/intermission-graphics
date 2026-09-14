import { ISOLINE_CAMERA_FOV } from "./hit-test";
import type { IsolineSceneValues } from "./types";
import { lookAtMat4, multiplyMat4, perspectiveMat4 } from "./webgl/math";

const TWO_PI = Math.PI * 2;

export type IsolineStrumPick = {
  ndcDistance: number;
  world: readonly [number, number, number];
  x: number;
  y: number;
};

function fract(value: number): number {
  return value - Math.floor(value);
}

function hash11(value: number, seed: number): number {
  return fract(Math.sin(value * 127.1 + seed * 311.7) * 43758.5453123);
}

function projectWorld(
  world: readonly [number, number, number],
  viewProjection: Float32Array,
): { w: number; x: number; y: number } {
  const x =
    viewProjection[0]! * world[0] +
    viewProjection[4]! * world[1] +
    viewProjection[8]! * world[2] +
    viewProjection[12]!;
  const y =
    viewProjection[1]! * world[0] +
    viewProjection[5]! * world[1] +
    viewProjection[9]! * world[2] +
    viewProjection[13]!;
  const w =
    viewProjection[3]! * world[0] +
    viewProjection[7]! * world[1] +
    viewProjection[11]! * world[2] +
    viewProjection[15]!;
  const clipW = Math.abs(w) < 1e-6 ? 1e-6 : w;
  return { w: clipW, x: x / clipW, y: y / clipW };
}

export function pointerToIsolineNdc(
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, "height" | "left" | "top" | "width">,
): { x: number; y: number } {
  return {
    x: ((clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1,
    y: 1 - ((clientY - bounds.top) / Math.max(1, bounds.height)) * 2,
  };
}

export function createIsolineViewProjection(
  values: IsolineSceneValues,
  aspect: number,
): Float32Array {
  return multiplyMat4(
    perspectiveMat4(ISOLINE_CAMERA_FOV, aspect, 0.1, 20),
    lookAtMat4(values.orientation.position, [0, 0, 0], values.orientation.up),
  );
}

export function evaluateIsolineSurface(
  theta: number,
  lineT: number,
  values: IsolineSceneValues,
  progress: number,
): {
  planar: readonly [number, number];
  world: readonly [number, number, number];
} {
  const flowPhase =
    (values.flow ? 1 : 0) * fract(progress * values.speed) * TWO_PI;
  const angle = theta - (values.bulgeAngle * Math.PI) / 180 - flowPhase;
  let deform = 0;
  const harmonicCount = values.harmonicCount;
  for (let harmonic = 1; harmonic <= 6; harmonic += 1) {
    const enabled = harmonic <= harmonicCount + 0.01 ? 1 : 0;
    const amplitude =
      values.bulgeAmount *
      (harmonic === 1 ? 1 : 0.55 / harmonic) *
      (0.72 + 0.28 * values.smoothness);
    const phase = harmonic === 1 ? 0 : hash11(harmonic, values.seed) * TWO_PI;
    deform += enabled * amplitude * Math.cos(harmonic * angle + phase);
  }
  deform +=
    (1 - values.smoothness) *
    0.045 *
    Math.sin(theta * 5 + hash11(5, values.seed) * TWO_PI) *
    Math.cos(theta * 3 + hash11(6, values.seed) * TWO_PI);

  const breathe = values.breathe
    ? 1 + 0.035 * Math.sin(fract(progress * Math.max(0.15, values.speed)) * TWO_PI)
    : 1;
  const radius =
    (values.innerRadius + (values.outerRadius - values.innerRadius) * lineT) *
    breathe *
    (1 + deform);
  const rotatedTheta = theta + (values.rotation * Math.PI) / 180;
  const planar: readonly [number, number] = [
    Math.cos(rotatedTheta) * radius,
    Math.sin(rotatedTheta) * radius,
  ];
  const z =
    values.depthZ *
    (Math.sin(theta * 2 + flowPhase + lineT * Math.PI) * 0.32 +
      (lineT - 0.5) * 0.28);
  const bentX =
    planar[0] +
    values.bendX * planar[1] * planar[1] * Math.sign(planar[1]) * 0.55;
  const bentY =
    planar[1] +
    values.bendY * planar[0] * planar[0] * Math.sign(planar[0]) * 0.55;
  return {
    planar,
    world: [bentX, bentY, z],
  };
}

function considerSample(
  theta: number,
  lineT: number,
  pointer: { x: number; y: number },
  values: IsolineSceneValues,
  progress: number,
  viewProjection: Float32Array,
  best: IsolineStrumPick,
): IsolineStrumPick {
  const { planar, world } = evaluateIsolineSurface(
    theta,
    lineT,
    values,
    progress,
  );
  const ndc = projectWorld(world, viewProjection);
  if (ndc.w <= 0) {
    return best;
  }
  const ndcDistance = Math.hypot(ndc.x - pointer.x, ndc.y - pointer.y);
  if (ndcDistance >= best.ndcDistance) {
    return best;
  }
  return {
    ndcDistance,
    world,
    x: planar[0],
    y: planar[1],
  };
}

export function pickIsolineStrumPlanar(
  pointer: { x: number; y: number },
  values: IsolineSceneValues,
  progress: number,
  viewProjection: Float32Array,
): IsolineStrumPick {
  let best: IsolineStrumPick = {
    ndcDistance: Number.POSITIVE_INFINITY,
    world: [0, 0, 0],
    x: 0,
    y: 0,
  };
  for (let step = 0; step < 96; step += 1) {
    const theta = (step / 96) * TWO_PI;
    for (let ring = 0; ring < 7; ring += 1) {
      best = considerSample(
        theta,
        ring / 6,
        pointer,
        values,
        progress,
        viewProjection,
        best,
      );
    }
  }

  const refineTheta = Math.atan2(best.y, best.x);
  for (let step = 0; step < 24; step += 1) {
    const theta = refineTheta - 0.18 + (step / 23) * 0.36;
    for (let ring = 0; ring < 9; ring += 1) {
      best = considerSample(
        theta,
        ring / 8,
        pointer,
        values,
        progress,
        viewProjection,
        best,
      );
    }
  }
  return best;
}

export function mapIsolinePointerToStrum(
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, "height" | "left" | "top" | "width">,
  values: IsolineSceneValues,
  progress: number,
): IsolineStrumPick {
  return pickIsolineStrumPlanar(
    pointerToIsolineNdc(clientX, clientY, bounds),
    values,
    progress,
    createIsolineViewProjection(
      values,
      bounds.width / Math.max(1, bounds.height),
    ),
  );
}
