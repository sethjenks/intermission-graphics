import type { IsolinePress, IsolineRenderInput } from "./types";

const SAMPLE_COUNT = 240;
const TWO_PI = Math.PI * 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let hash = t;
    hash = Math.imul(hash ^ (hash >>> 15), hash | 1);
    hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61);
    return ((hash ^ (hash >>> 14)) >>> 0) / 4294967296;
  };
}

function shortestAngleDelta(from: number, to: number): number {
  const delta = ((to - from + Math.PI) % TWO_PI) - Math.PI;
  return delta < -Math.PI ? delta + TWO_PI : delta;
}

function pressOffset(
  theta: number,
  radiusNorm: number,
  press: IsolinePress | null,
): number {
  if (!press || press.strength <= 0.001) {
    return 0;
  }

  const pressAngle = Math.atan2(press.y, press.x);
  const angular = shortestAngleDelta(theta, pressAngle);
  const angularFalloff = Math.exp(-(angular * angular) / 0.42);
  const radialFalloff = Math.exp(
    -((radiusNorm - 0.5) * (radiusNorm - 0.5)) / 0.18,
  );
  return press.strength * 0.16 * angularFalloff * radialFalloff;
}

type IsolineForm = {
  breatheScale: number;
  bulgeAngle: number;
  extent: number;
  harmonicCount: number;
  harmonicPhases: number[];
  inner: number;
  lineCount: number;
  noiseAmount: number;
  outer: number;
  press: IsolinePress | null;
  smoothness: number;
};

function createIsolineForm(input: IsolineRenderInput): IsolineForm {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const random = mulberry32(Math.round(input.seed));
  const inner = clamp(input.innerRadius, 0.08, 0.7);
  const orbitTurns = input.orbit ? input.progress * input.speed : 0;
  const rotation = ((input.rotation + orbitTurns * 360) * Math.PI) / 180;
  const smoothness = clamp(input.smoothness, 0, 1);

  return {
    breatheScale: input.breathe
      ? 1 + 0.035 * Math.sin(input.progress * TWO_PI * Math.max(0.15, input.speed))
      : 1,
    bulgeAngle: (input.bulgeAngle * Math.PI) / 180 + rotation,
    extent: Math.min(width, height),
    harmonicCount: Math.round(clamp(input.harmonicCount, 1, 6)),
    harmonicPhases: Array.from({ length: 6 }, () => random() * TWO_PI),
    inner,
    lineCount: Math.round(clamp(input.lineCount, 8, 120)),
    noiseAmount: (1 - smoothness) * 0.045,
    outer: clamp(Math.max(input.outerRadius, inner + 0.04), inner + 0.04, 0.9),
    press: input.press,
    smoothness,
  };
}

function radiusAt(
  form: IsolineForm,
  bulgeAmount: number,
  lineIndex: number,
  sampleIndex: number,
): number {
  const t =
    form.lineCount === 1
      ? 0
      : clamp(lineIndex, 0, form.lineCount - 1) / (form.lineCount - 1);
  const theta = (clamp(sampleIndex, 0, SAMPLE_COUNT) / SAMPLE_COUNT) * TWO_PI;
  let deform = 0;

  for (let harmonic = 1; harmonic <= form.harmonicCount; harmonic += 1) {
    const amplitude =
      bulgeAmount *
      (harmonic === 1 ? 1 : 0.55 / harmonic) *
      (0.72 + form.smoothness * 0.28);
    const phase = harmonic === 1 ? 0 : form.harmonicPhases[harmonic - 1]!;
    deform += amplitude * Math.cos(harmonic * (theta - form.bulgeAngle) + phase);
  }

  deform +=
    form.noiseAmount *
    Math.sin(5 * theta + form.harmonicPhases[4]!) *
    Math.cos(3 * theta + form.harmonicPhases[5]!);

  const radiusNorm = lerp(form.inner, form.outer, t);
  return (
    (form.extent / 2) *
    radiusNorm *
    form.breatheScale *
    (1 + deform + pressOffset(theta, radiusNorm, form.press))
  );
}

export function sampleIsolineRadius(
  input: IsolineRenderInput,
  lineIndex: number,
  sampleIndex: number,
): number {
  return radiusAt(createIsolineForm(input), input.bulgeAmount, lineIndex, sampleIndex);
}

export function buildIsolinePaths(input: IsolineRenderInput): Path2D[] {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const centerX = width / 2;
  const centerY = height / 2;
  const form = createIsolineForm(input);
  const paths: Path2D[] = [];

  for (let line = 0; line < form.lineCount; line += 1) {
    const path = new Path2D();

    for (let sample = 0; sample <= SAMPLE_COUNT; sample += 1) {
      const theta = (sample / SAMPLE_COUNT) * TWO_PI;
      const radius = radiusAt(form, input.bulgeAmount, line, sample);
      const x = centerX + Math.cos(theta) * radius;
      const y = centerY - Math.sin(theta) * radius;

      if (sample === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    path.closePath();
    paths.push(path);
  }

  return paths;
}
