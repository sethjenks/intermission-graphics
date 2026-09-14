import type { IsolineImpulse } from "../types";

export const ISOLINE_FIXED_STEP_SECONDS = 1 / 60;
export const ISOLINE_MAX_IMPULSES = 8;
const MAX_CATCH_UP_STEPS = 5;

export type IsolineFixedStepClock = {
  accumulatorSeconds: number;
  lastTimeSeconds: number | null;
};

export function createIsolineFixedStepClock(): IsolineFixedStepClock {
  return {
    accumulatorSeconds: 0,
    lastTimeSeconds: null,
  };
}

export function resetIsolineFixedStepClock(clock: IsolineFixedStepClock): void {
  clock.accumulatorSeconds = 0;
  clock.lastTimeSeconds = null;
}

export function consumeIsolineFixedSteps(
  clock: IsolineFixedStepClock,
  timeSeconds: number,
  step: (deltaSeconds: number) => void,
): number {
  if (clock.lastTimeSeconds === null) {
    clock.lastTimeSeconds = timeSeconds;
    return 0;
  }
  const elapsed = Math.min(0.25, Math.max(0, timeSeconds - clock.lastTimeSeconds));
  clock.lastTimeSeconds = timeSeconds;
  clock.accumulatorSeconds += elapsed;
  let steps = 0;
  while (
    clock.accumulatorSeconds >= ISOLINE_FIXED_STEP_SECONDS &&
    steps < MAX_CATCH_UP_STEPS
  ) {
    step(ISOLINE_FIXED_STEP_SECONDS);
    clock.accumulatorSeconds -= ISOLINE_FIXED_STEP_SECONDS;
    steps += 1;
  }
  if (steps === MAX_CATCH_UP_STEPS) {
    clock.accumulatorSeconds = Math.min(
      clock.accumulatorSeconds,
      ISOLINE_FIXED_STEP_SECONDS,
    );
  }
  return steps;
}

export function advanceIsolineImpulses(
  impulses: readonly IsolineImpulse[],
  deltaSeconds: number,
  damping: number,
): IsolineImpulse[] {
  const lifetime = 1.25 + Math.max(0, Math.min(1, damping)) * 5;
  return impulses
    .map((impulse) => ({
      ...impulse,
      elapsedSeconds: impulse.elapsedSeconds + deltaSeconds,
    }))
    .filter((impulse) => impulse.elapsedSeconds <= lifetime);
}

export function appendIsolineImpulse(
  impulses: readonly IsolineImpulse[],
  impulse: IsolineImpulse,
): IsolineImpulse[] {
  return [...impulses, impulse].slice(-ISOLINE_MAX_IMPULSES);
}
