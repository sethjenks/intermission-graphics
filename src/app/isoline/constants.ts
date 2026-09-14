export const ISOLINE_BACKGROUND_DEFAULT = "#F6F3EE";
export const ISOLINE_LINE_DEFAULT = "#2B5BDB";
export const ISOLINE_INVERSE_BACKGROUND = "#111318";
export const ISOLINE_INVERSE_LINE = "#E8EEF7";
export const ISOLINE_BACKGROUND_FILL_TARGET = "appearance.backgroundFill";
export const ISOLINE_BACKGROUND_IMAGE_TARGET = "appearance.backgroundImage";

/** Seconds for Speed=1 to complete one flow/breathe cycle. Motion does not restart. */
export const ISOLINE_MOTION_PERIOD_SECONDS = 12;

export const ISOLINE_LINE_COUNT_MIN = 8;
export const ISOLINE_LINE_COUNT_MAX = 120;
export const ISOLINE_LINE_COUNT_DEFAULT = 46;

export const ISOLINE_PARTICLE_COUNT_MIN = 400;
export const ISOLINE_PARTICLE_COUNT_MAX = 12_000;
export const ISOLINE_PARTICLE_COUNT_DEFAULT = 4_200;

export const ISOLINE_ANGULAR_SAMPLE_MIN = 128;
export const ISOLINE_ANGULAR_SAMPLE_MAX = 512;
export const ISOLINE_ANGULAR_SAMPLE_DEFAULT = 256;

export const ISOLINE_SEED_MIN = 0;
export const ISOLINE_SEED_MAX = 9999;
export const ISOLINE_SEED_DEFAULT = 17;

export const ISOLINE_SCENE_SIZE = 2048;

export const ISOLINE_SCENE_BOUNDS = {
  height: 1800,
  width: 1400,
  x: -700,
  y: -900,
} as const;
