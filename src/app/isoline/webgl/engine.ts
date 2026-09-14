import { ISOLINE_MOTION_PERIOD_SECONDS, ISOLINE_SCENE_SIZE } from "../constants";
import { ISOLINE_CAMERA_FOV } from "../hit-test";
import {
  pickIsolineStrumPlanar,
  pointerToIsolineNdc,
  type IsolineStrumPick,
} from "../strum-map";
import type {
  IsolineBackgroundImage,
  IsolineGradient,
  IsolineGradientStop,
  IsolineGradientType,
  IsolineImpulse,
  IsolineLineMode,
  IsolineSceneValues,
} from "../types";
import { resolveIsolineBackgroundGradient } from "../values";
import { createEmptyVertexArray, selectIsolineAngularSamples } from "./geometry";
import { lookAtMat4, multiplyMat4, perspectiveMat4 } from "./math";
import {
  advanceIsolineImpulses,
  appendIsolineImpulse,
  consumeIsolineFixedSteps,
  createIsolineFixedStepClock,
  resetIsolineFixedStepClock,
  type IsolineFixedStepClock,
} from "./physics";
import { createProgram } from "./program";
import {
  fieldFragmentShader,
  fieldVertexShader,
  lineFragmentShader,
  lineVertexShader,
  particleFragmentShader,
  particleUpdateFragmentShader,
  particleUpdateVertexShader,
  particleVertexShader,
} from "./shaders";

const MAX_GRADIENT_STOPS = 8;

export type IsolineEngineEvent =
  | { type: "context-lost" }
  | { type: "context-restored" }
  | { error: Error; type: "error" };

export type IsolineEngineOptions = {
  continuous?: boolean;
  onEvent?: (event: IsolineEngineEvent) => void;
};

type ParticleResources = {
  buffers: readonly [WebGLBuffer, WebGLBuffer];
  count: number;
  feedbacks: readonly [WebGLTransformFeedback, WebGLTransformFeedback];
  readIndex: 0 | 1;
  vertexArrays: readonly [WebGLVertexArrayObject, WebGLVertexArrayObject];
};

type EngineResources = {
  fieldProgram: WebGLProgram;
  imageTexture: WebGLTexture;
  lineProgram: WebGLProgram;
  lineVertexArray: WebGLVertexArrayObject;
  particleProgram: WebGLProgram;
  particleUpdateProgram: WebGLProgram;
  particles: ParticleResources | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseHexColor(color: string): readonly [number, number, number] {
  const normalized = /^#[\da-f]{6}$/iu.test(color) ? color.slice(1) : "2B5BDB";
  return [
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  ];
}

function parseStopPosition(position: string): number {
  const parsed = Number.parseFloat(position);
  return clamp(Number.isFinite(parsed) ? parsed / 100 : 0, 0, 1);
}

function normalizeGradientStops(
  stops: readonly IsolineGradientStop[],
): readonly IsolineGradientStop[] {
  return [...stops]
    .slice(0, MAX_GRADIENT_STOPS)
    .sort((left, right) => parseStopPosition(left.position) - parseStopPosition(right.position));
}

function gradientTypeIndex(type: IsolineGradientType): number {
  switch (type) {
    case "linear":
      return 0;
    case "radial":
      return 1;
    case "angular":
      return 2;
    case "diamond":
      return 3;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

function lineModeIndex(mode: IsolineLineMode): number {
  switch (mode) {
    case "solid":
      return 0;
    case "dashed":
      return 1;
    case "particles":
      return 2;
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

function sampleWidthProfile(values: IsolineSceneValues): Float32Array {
  const points = [...values.widthProfile.points.RGB].sort(
    (left, right) => left.x - right.x,
  );
  const samples = new Float32Array(16);
  for (let index = 0; index < samples.length; index += 1) {
    const x = index / (samples.length - 1);
    let rightIndex = points.findIndex((point) => point.x >= x);
    if (rightIndex < 0) {
      rightIndex = points.length - 1;
    }
    const right = points[rightIndex] ?? { x: 1, y: 1 };
    const left = points[Math.max(0, rightIndex - 1)] ?? right;
    const span = Math.max(0.0001, right.x - left.x);
    const amount = clamp((x - left.x) / span, 0, 1);
    samples[index] = clamp(left.y + (right.y - left.y) * amount, 0, 1);
  }
  return samples;
}

function requireWebGLObject<T>(value: T | null, message: string): T {
  if (value === null) {
    throw new Error(message);
  }
  return value;
}

export class IsolineWebGL2Engine {
  readonly canvas: HTMLCanvasElement;

  private motionClock: "continuous" | "frozen" = "continuous";
  private motionElapsedSeconds = 0;
  private clock: IsolineFixedStepClock = createIsolineFixedStepClock();
  private contextLost = false;
  private cssHeight = 1;
  private cssWidth = 1;
  private destroyed = false;
  private pixelRatio = 1;
  private frameId = 0;
  private gl: WebGL2RenderingContext;
  private impulses: IsolineImpulse[] = [];
  private backgroundImage: IsolineBackgroundImage | null = null;
  private includeBackground = true;
  private options: IsolineEngineOptions;
  private paused = true;
  private particleFramesRemaining = 0;
  private progress = 0;
  private resources: EngineResources;
  private values: IsolineSceneValues;

  constructor(
    canvas: HTMLCanvasElement,
    values: IsolineSceneValues,
    options: IsolineEngineOptions = {},
  ) {
    this.canvas = canvas;
    this.cssWidth = Math.max(1, canvas.clientWidth || canvas.width || 1);
    this.cssHeight = Math.max(1, canvas.clientHeight || canvas.height || 1);
    this.values = values;
    this.options = options;
    this.gl = this.createContext();
    this.resources = this.createResources();
    this.handleContextLost = this.handleContextLost.bind(this);
    this.handleContextRestored = this.handleContextRestored.bind(this);
    canvas.addEventListener("webglcontextlost", this.handleContextLost);
    canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
  }

  private createContext(): WebGL2RenderingContext {
    const context = this.canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
    });
    if (!context) {
      throw new Error("WebGL2 is required to render the Isoline player.");
    }
    return context;
  }

  private createResources(): EngineResources {
    const gl = this.gl;
    return {
      fieldProgram: createProgram(gl, fieldVertexShader, fieldFragmentShader),
      imageTexture: requireWebGLObject(
        gl.createTexture(),
        "WebGL2 could not allocate a background image texture.",
      ),
      lineProgram: createProgram(gl, lineVertexShader, lineFragmentShader),
      lineVertexArray: createEmptyVertexArray(gl),
      particleProgram: createProgram(gl, particleVertexShader, particleFragmentShader),
      particleUpdateProgram: createProgram(
        gl,
        particleUpdateVertexShader,
        particleUpdateFragmentShader,
        ["nextOffset", "nextVelocity"],
      ),
      particles: null,
    };
  }

  private deleteParticleResources(particles: ParticleResources | null): void {
    if (!particles) {
      return;
    }
    for (const vertexArray of particles.vertexArrays) {
      this.gl.deleteVertexArray(vertexArray);
    }
    for (const feedback of particles.feedbacks) {
      this.gl.deleteTransformFeedback(feedback);
    }
    for (const buffer of particles.buffers) {
      this.gl.deleteBuffer(buffer);
    }
  }

  private deleteResources(): void {
    this.deleteParticleResources(this.resources.particles);
    this.gl.deleteVertexArray(this.resources.lineVertexArray);
    this.gl.deleteProgram(this.resources.fieldProgram);
    this.gl.deleteProgram(this.resources.lineProgram);
    this.gl.deleteProgram(this.resources.particleProgram);
    this.gl.deleteProgram(this.resources.particleUpdateProgram);
    this.gl.deleteTexture(this.resources.imageTexture);
  }

  private handleContextLost(event: Event): void {
    event.preventDefault();
    this.contextLost = true;
    this.options.onEvent?.({ type: "context-lost" });
  }

  private handleContextRestored(): void {
    if (this.destroyed) {
      return;
    }
    try {
      this.gl = this.createContext();
      this.resources = this.createResources();
      this.contextLost = false;
      this.impulses = [];
      resetIsolineFixedStepClock(this.clock);
      this.options.onEvent?.({ type: "context-restored" });
      this.requestFrame();
    } catch (error) {
      this.options.onEvent?.({
        error: error instanceof Error ? error : new Error(String(error)),
        type: "error",
      });
    }
  }

  private setUniform1f(program: WebGLProgram, name: string, value: number): void {
    const location = this.gl.getUniformLocation(program, name);
    if (location !== null) {
      this.gl.uniform1f(location, value);
    }
  }

  private setUniform1i(program: WebGLProgram, name: string, value: number): void {
    const location = this.gl.getUniformLocation(program, name);
    if (location !== null) {
      this.gl.uniform1i(location, value);
    }
  }

  private applySurfaceUniforms(program: WebGLProgram): void {
    const gl = this.gl;
    const values = this.values;
    this.setUniform1f(program, "uBendX", values.bendX);
    this.setUniform1f(program, "uBendY", values.bendY);
    this.setUniform1f(program, "uBreathe", values.breathe ? 1 : 0);
    this.setUniform1f(program, "uBulgeAmount", values.bulgeAmount);
    this.setUniform1f(program, "uBulgeAngle", values.bulgeAngle);
    this.setUniform1f(program, "uDepthZ", values.depthZ);
    this.setUniform1f(program, "uFlow", values.flow ? 1 : 0);
    this.setUniform1f(program, "uHarmonicCount", values.harmonicCount);
    this.setUniform1f(program, "uInnerRadius", values.innerRadius);
    this.setUniform1f(program, "uOuterRadius", values.outerRadius);
    this.setUniform1f(program, "uProgress", this.progress);
    this.setUniform1f(program, "uRotation", values.rotation);
    this.setUniform1f(program, "uSeed", values.seed);
    this.setUniform1f(program, "uSmoothness", values.smoothness);
    this.setUniform1f(program, "uSpeed", values.speed);
    this.setUniform1f(program, "uStrumDamping", values.strumDamping);
    this.setUniform1f(program, "uStrumRadius", values.strumRadius);
    this.setUniform1f(program, "uStrumReturn", values.strumReturn);
    this.setUniform1f(program, "uStrumWaveSpeed", values.strumWaveSpeed);
    this.setUniform1i(program, "uImpulseCount", this.impulses.length);

    const impulseValues = new Float32Array(8 * 4);
    const impulseDirections = new Float32Array(8 * 2);
    this.impulses.forEach((impulse, index) => {
      impulseValues.set(
        [impulse.x, impulse.y, impulse.amplitude, impulse.elapsedSeconds],
        index * 4,
      );
      impulseDirections.set(
        [impulse.directionX, impulse.directionY],
        index * 2,
      );
    });
    const impulseLocation = gl.getUniformLocation(program, "uImpulses[0]");
    if (impulseLocation !== null) {
      gl.uniform4fv(impulseLocation, impulseValues);
    }
    const directionLocation = gl.getUniformLocation(
      program,
      "uImpulseDirections[0]",
    );
    if (directionLocation !== null) {
      gl.uniform2fv(directionLocation, impulseDirections);
    }
  }

  private applyGradientUniforms(
    program: WebGLProgram,
    gradient: IsolineGradient = this.values.gradient,
  ): void {
    const gl = this.gl;
    const stops = normalizeGradientStops(gradient.stops);
    const colors = new Float32Array(MAX_GRADIENT_STOPS * 4);
    const positions = new Float32Array(MAX_GRADIENT_STOPS);
    stops.forEach((stop, index) => {
      const [red, green, blue] = parseHexColor(stop.color);
      colors.set([red, green, blue, clamp(stop.opacity / 100, 0, 1)], index * 4);
      positions[index] = parseStopPosition(stop.position);
    });
    this.setUniform1f(program, "uGradientAngle", gradient.angle);
    this.setUniform1i(
      program,
      "uGradientType",
      gradientTypeIndex(gradient.gradientType),
    );
    this.setUniform1i(program, "uGradientCount", stops.length);
    const colorsLocation = gl.getUniformLocation(program, "uGradientColors[0]");
    if (colorsLocation !== null) {
      gl.uniform4fv(colorsLocation, colors);
    }
    const positionsLocation = gl.getUniformLocation(
      program,
      "uGradientPositions[0]",
    );
    if (positionsLocation !== null) {
      gl.uniform1fv(positionsLocation, positions);
    }
  }

  private viewProjection(): Float32Array {
    const { position, up } = this.values.orientation;
    const view = lookAtMat4(position, [0, 0, 0], up);
    const projection = perspectiveMat4(
      ISOLINE_CAMERA_FOV,
      this.canvas.width / Math.max(1, this.canvas.height),
      0.1,
      20,
    );
    return multiplyMat4(projection, view);
  }

  private applyViewProjection(program: WebGLProgram): void {
    const location = this.gl.getUniformLocation(program, "uViewProjection");
    if (location !== null) {
      this.gl.uniformMatrix4fv(location, false, this.viewProjection());
    }
  }

  private ensureParticles(): ParticleResources {
    const count = Math.max(1, Math.round(this.values.particleCount));
    const current = this.resources.particles;
    if (current?.count === count) {
      return current;
    }
    this.deleteParticleResources(current);
    const gl = this.gl;
    const buffers: [WebGLBuffer, WebGLBuffer] = [
      requireWebGLObject(gl.createBuffer(), "WebGL2 could not allocate particle state."),
      requireWebGLObject(gl.createBuffer(), "WebGL2 could not allocate particle state."),
    ];
    const vertexArrays: [WebGLVertexArrayObject, WebGLVertexArrayObject] = [
      requireWebGLObject(gl.createVertexArray(), "WebGL2 could not allocate particle input."),
      requireWebGLObject(gl.createVertexArray(), "WebGL2 could not allocate particle input."),
    ];
    const feedbacks: [WebGLTransformFeedback, WebGLTransformFeedback] = [
      requireWebGLObject(
        gl.createTransformFeedback(),
        "WebGL2 could not allocate particle feedback.",
      ),
      requireWebGLObject(
        gl.createTransformFeedback(),
        "WebGL2 could not allocate particle feedback.",
      ),
    ];
    const initial = new Float32Array(count * 6);

    for (let index = 0; index < 2; index += 1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[index]!);
      gl.bufferData(gl.ARRAY_BUFFER, initial, gl.DYNAMIC_COPY);
      gl.bindVertexArray(vertexArrays[index]!);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[index]!);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, feedbacks[index]!);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffers[index]!);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    const particles: ParticleResources = {
      buffers,
      count,
      feedbacks,
      readIndex: 0,
      vertexArrays,
    };
    this.resources.particles = particles;
    return particles;
  }

  private updateParticles(deltaSeconds: number): void {
    const gl = this.gl;
    const particles = this.ensureParticles();
    const writeIndex: 0 | 1 = particles.readIndex === 0 ? 1 : 0;
    const program = this.resources.particleUpdateProgram;
    gl.useProgram(program);
    this.applySurfaceUniforms(program);
    this.setUniform1f(program, "uDeltaSeconds", deltaSeconds);
    this.setUniform1f(program, "uLineCount", this.values.lineCount);
    this.setUniform1f(program, "uParticleDamping", this.values.particleDamping);
    this.setUniform1f(program, "uParticleReturn", this.values.particleReturn);
    this.setUniform1f(program, "uParticleScatter", this.values.particleScatter);
    this.setUniform1f(program, "uParticleSpread", this.values.particleSpread);
    gl.bindVertexArray(particles.vertexArrays[particles.readIndex]);
    gl.bindTransformFeedback(
      gl.TRANSFORM_FEEDBACK,
      particles.feedbacks[writeIndex],
    );
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, particles.count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null);
    particles.readIndex = writeIndex;
  }

  private sourceSize(
    source: TexImageSource,
  ): { height: number; width: number } {
    if ("naturalWidth" in source && "naturalHeight" in source) {
      return {
        height: Math.max(1, source.naturalHeight),
        width: Math.max(1, source.naturalWidth),
      };
    }
    if ("videoWidth" in source && "videoHeight" in source) {
      return {
        height: Math.max(1, source.videoHeight),
        width: Math.max(1, source.videoWidth),
      };
    }
    if ("displayWidth" in source && "displayHeight" in source) {
      return {
        height: Math.max(1, source.displayHeight),
        width: Math.max(1, source.displayWidth),
      };
    }
    if ("width" in source && "height" in source) {
      return {
        height: Math.max(1, source.height),
        width: Math.max(1, source.width),
      };
    }
    return { height: 1, width: 1 };
  }

  private coverScale(
    image: IsolineBackgroundImage,
  ): readonly [number, number] {
    const size = this.sourceSize(image.source);
    const rotated = image.rotationDeg === 90 || image.rotationDeg === 270;
    const imageWidth = rotated ? size.height : size.width;
    const imageHeight = rotated ? size.width : size.height;
    const canvasAspect = this.canvas.width / Math.max(1, this.canvas.height);
    const imageAspect = imageWidth / imageHeight;
    if (imageAspect > canvasAspect) {
      return [imageAspect / canvasAspect, 1];
    }
    return [1, canvasAspect / imageAspect];
  }

  private drawField(): void {
    const fill = this.values.backgroundFill;
    switch (fill) {
      case "solid":
        return;
      case "gradient":
        this.drawFieldQuad(null);
        return;
      case "image": {
        const image = this.backgroundImage;
        if (!image) {
          return;
        }
        this.drawFieldQuad(image);
        return;
      }
      default: {
        const exhaustive: never = fill;
        throw new Error(`Unhandled background fill ${String(exhaustive)}`);
      }
    }
  }

  private drawFieldQuad(image: IsolineBackgroundImage | null): void {
    const gl = this.gl;
    const program = this.resources.fieldProgram;
    gl.useProgram(program);
    this.applyGradientUniforms(
      program,
      resolveIsolineBackgroundGradient(this.values),
    );
    this.setUniform1i(program, "uHasImage", image ? 1 : 0);
    this.setUniform1i(program, "uImage", 0);
    const [coverX, coverY] = image ? this.coverScale(image) : [1, 1];
    const coverLocation = gl.getUniformLocation(program, "uCoverScale");
    if (coverLocation !== null) {
      gl.uniform2f(coverLocation, coverX, coverY);
    }
    const flipLocation = gl.getUniformLocation(program, "uFlip");
    if (flipLocation !== null) {
      gl.uniform2f(
        flipLocation,
        image?.flipHorizontal ? -1 : 1,
        image?.flipVertical ? -1 : 1,
      );
    }
    this.setUniform1i(
      program,
      "uRotation",
      image ? image.rotationDeg / 90 : 0,
    );
    if (image) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.resources.imageTexture);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (image) {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  private drawLines(): void {
    const gl = this.gl;
    const program = this.resources.lineProgram;
    const samples = selectIsolineAngularSamples(
      this.canvas.width,
      this.values.bulgeAmount +
        Math.abs(this.values.bendX) +
        Math.abs(this.values.bendY) +
        this.values.depthZ,
    );
    gl.useProgram(program);
    this.applySurfaceUniforms(program);
    this.applyGradientUniforms(program);
    this.applyViewProjection(program);
    this.setUniform1i(program, "uAngularSamples", samples);
    this.setUniform1f(program, "uLineCount", this.values.lineCount);
    this.setUniform1i(program, "uLineMode", lineModeIndex(this.values.lineMode));
    this.setUniform1f(program, "uDashLength", this.values.dashLength);
    this.setUniform1f(program, "uDashGap", this.values.dashGap);
    this.setUniform1f(program, "uThicknessInner", this.values.lineThickness[0]);
    this.setUniform1f(program, "uThicknessOuter", this.values.lineThickness[1]);
    const resolution = gl.getUniformLocation(program, "uResolution");
    if (resolution !== null) {
      const aspect = this.cssWidth / Math.max(1, this.cssHeight);
      gl.uniform2f(resolution, ISOLINE_SCENE_SIZE, ISOLINE_SCENE_SIZE / aspect);
    }
    const profile = gl.getUniformLocation(program, "uWidthProfile[0]");
    if (profile !== null) {
      gl.uniform1fv(profile, sampleWidthProfile(this.values));
    }
    gl.bindVertexArray(this.resources.lineVertexArray);
    gl.drawArraysInstanced(
      gl.TRIANGLE_STRIP,
      0,
      (samples + 1) * 2,
      Math.max(1, Math.round(this.values.lineCount)),
    );
    gl.bindVertexArray(null);
  }

  private drawParticles(): void {
    const gl = this.gl;
    const particles = this.ensureParticles();
    const program = this.resources.particleProgram;
    gl.useProgram(program);
    this.applySurfaceUniforms(program);
    this.applyGradientUniforms(program);
    this.applyViewProjection(program);
    this.setUniform1f(program, "uLineCount", this.values.lineCount);
    this.setUniform1f(
      program,
      "uParticleSize",
      this.values.particleSize * this.pixelRatio,
    );
    gl.bindVertexArray(particles.vertexArrays[particles.readIndex]);
    gl.drawArrays(gl.POINTS, 0, particles.count);
    gl.bindVertexArray(null);
  }

  private renderFrame(timeSeconds: number): void {
    if (this.destroyed || this.paused || this.contextLost) {
      return;
    }
    consumeIsolineFixedSteps(this.clock, timeSeconds, (deltaSeconds) => {
      if (this.motionClock === "continuous") {
        this.motionElapsedSeconds += deltaSeconds;
        this.progress =
          this.motionElapsedSeconds / ISOLINE_MOTION_PERIOD_SECONDS;
      }
      this.impulses = advanceIsolineImpulses(
        this.impulses,
        deltaSeconds,
        this.values.strumDamping,
      );
      if (this.values.lineMode === "particles") {
        this.updateParticles(deltaSeconds);
      }
    });

    const gl = this.gl;
    const [red, green, blue] = parseHexColor(this.values.background);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(red, green, blue, this.includeBackground ? 1 : 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (this.includeBackground) {
      this.drawField();
    }
    if (this.values.lineMode === "particles") {
      this.drawParticles();
      this.particleFramesRemaining = Math.max(
        0,
        this.particleFramesRemaining - 1,
      );
    } else {
      this.drawLines();
    }
    this.canvas.dataset.motionClock = this.motionClock;
    this.canvas.dataset.motionProgress = this.progress.toFixed(4);
  }

  private requestFrame(): void {
    if (
      this.destroyed ||
      this.paused ||
      this.contextLost ||
      this.frameId !== 0
    ) {
      return;
    }
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  private tick = (timeMilliseconds: number): void => {
    if (this.destroyed || this.paused) {
      this.frameId = 0;
      return;
    }
    try {
      this.renderFrame(timeMilliseconds / 1_000);
    } catch (error) {
      this.options.onEvent?.({
        error: error instanceof Error ? error : new Error(String(error)),
        type: "error",
      });
      this.pause();
      return;
    }
    this.frameId = 0;
    if (
      this.options.continuous !== false ||
      this.impulses.length > 0 ||
      this.particleFramesRemaining > 0
    ) {
      this.requestFrame();
    }
  };

  setScene(
    values: IsolineSceneValues,
    options: { includeBackground: boolean; progress?: number },
  ): void {
    const particleCountChanged =
      Math.round(values.particleCount) !== Math.round(this.values.particleCount);
    this.values = values;
    this.includeBackground = options.includeBackground;
    if (this.motionClock === "frozen" && options.progress !== undefined) {
      this.progress = options.progress;
    }
    if (particleCountChanged && this.resources.particles) {
      this.deleteParticleResources(this.resources.particles);
      this.resources.particles = null;
    }
    this.requestFrame();
  }

  resize(cssWidth: number, cssHeight: number, pixelRatio: number): void {
    this.cssWidth = Math.max(1, cssWidth);
    this.cssHeight = Math.max(1, cssHeight);
    this.pixelRatio = Math.max(0.5, pixelRatio);
    const width = Math.max(1, Math.round(cssWidth * pixelRatio));
    const height = Math.max(1, Math.round(cssHeight * pixelRatio));
    if (this.canvas.width !== width) {
      this.canvas.width = width;
    }
    if (this.canvas.height !== height) {
      this.canvas.height = height;
    }
    this.requestFrame();
  }

  getMotionProgress(): number {
    return this.progress;
  }

  pickStrumFromPointer(
    clientX: number,
    clientY: number,
    bounds: Pick<DOMRect, "height" | "left" | "top" | "width">,
  ): IsolineStrumPick {
    return pickIsolineStrumPlanar(
      pointerToIsolineNdc(clientX, clientY, bounds),
      this.values,
      this.progress,
      this.viewProjection(),
    );
  }

  setBackgroundImage(image: IsolineBackgroundImage | null): void {
    this.backgroundImage = image;
    this.canvas.dataset.isolineImage = image ? "ready" : "none";
    if (image) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.resources.imageTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image.source,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    this.requestFrame();
  }

  addImpulse(impulse: Omit<IsolineImpulse, "elapsedSeconds">): void {
    this.impulses = appendIsolineImpulse(this.impulses, {
      ...impulse,
      elapsedSeconds: 0,
    });
    this.particleFramesRemaining = 360;
    this.requestFrame();
  }

  clearImpulses(): void {
    this.impulses = [];
  }

  useContinuousTime(elapsedSeconds?: number): void {
    this.motionClock = "continuous";
    if (elapsedSeconds !== undefined) {
      this.motionElapsedSeconds = Math.max(0, elapsedSeconds);
      this.progress = this.motionElapsedSeconds / ISOLINE_MOTION_PERIOD_SECONDS;
    }
  }

  freezeMotion(progress?: number): void {
    this.motionClock = "frozen";
    if (progress !== undefined) {
      this.progress = progress;
    }
    this.canvas.dataset.motionClock = this.motionClock;
    this.canvas.dataset.motionProgress = this.progress.toFixed(4);
  }

  start(): void {
    if (this.destroyed || !this.paused) {
      return;
    }
    this.paused = false;
    resetIsolineFixedStepClock(this.clock);
    this.requestFrame();
  }

  pause(): void {
    if (this.paused) {
      return;
    }
    this.paused = true;
    window.cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    resetIsolineFixedStepClock(this.clock);
  }

  resume(): void {
    this.start();
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.pause();
    this.destroyed = true;
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.handleContextRestored,
    );
    if (!this.contextLost) {
      this.deleteResources();
    }
  }
}
