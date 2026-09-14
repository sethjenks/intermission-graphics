import { isolinePointerHitsObject } from "../app/isoline/hit-test";
import { isolineReferenceValues } from "../app/isoline/presets";
import type {
  IsolineOrientationPose,
  IsolineSceneValues,
} from "../app/isoline/types";
import { readIsolineSceneValues } from "../app/isoline/values";
import {
  ISOLINE_APP_ID,
  ISOLINE_PLAYER_VERSION,
  ISOLINE_PROTOCOL_VERSION,
  parseIsolineSettingsPayload,
} from "../app/isoline/webgl/config";
import {
  IsolineWebGL2Engine,
  type IsolineEngineEvent,
} from "../app/isoline/webgl/engine";

export type IsolinePlayerEventType =
  | "ready"
  | "settings-applied"
  | "warning"
  | "error"
  | "context-restored";

export type IsolinePlayerEvent = {
  code?: string;
  message?: string;
  protocolVersion: number;
  requestId?: string;
  type: IsolinePlayerEventType;
};

export type IsolinePlayerOptions = {
  autoplay?: boolean;
  onEvent?: (event: IsolinePlayerEvent) => void;
};

export type IsolinePlayerInstance = {
  destroy(): void;
  loadSettings(settings: unknown, requestId?: string): void;
  pause(): void;
  resize(): void;
  resume(): void;
  setValues(values: Record<string, unknown>, requestId?: string): void;
};

export type IsolinePlayerGlobal = {
  appId: typeof ISOLINE_APP_ID;
  create(
    canvas: HTMLCanvasElement,
    settings?: unknown,
    options?: IsolinePlayerOptions,
  ): IsolinePlayerInstance;
  protocolVersion: typeof ISOLINE_PROTOCOL_VERSION;
  version: typeof ISOLINE_PLAYER_VERSION;
};

declare global {
  interface Window {
    IsolinePlayer?: IsolinePlayerGlobal;
    webkit?: {
      messageHandlers?: {
        isoline?: {
          postMessage(message: IsolinePlayerEvent): void;
        };
      };
    };
  }
}

function rotateOrientation(
  pose: IsolineOrientationPose,
  yawDelta: number,
  pitchDelta: number,
): IsolineOrientationPose {
  const [x, y, z] = pose.position;
  const radius = Math.max(0.001, Math.hypot(x, y, z));
  const yaw = Math.atan2(x, z) + yawDelta;
  const pitch = Math.max(
    -Math.PI * 0.46,
    Math.min(Math.PI * 0.46, Math.asin(y / radius) + pitchDelta),
  );
  const horizontal = Math.cos(pitch) * radius;
  return {
    position: [
      Math.sin(yaw) * horizontal,
      Math.sin(pitch) * radius,
      Math.cos(yaw) * horizontal,
    ],
    up: [0, 1, 0],
  };
}

function includeBackground(values: Record<string, unknown>): boolean {
  return values["export.includeBackground"] !== false;
}

function emitPlayerEvent(
  canvas: HTMLCanvasElement,
  options: IsolinePlayerOptions,
  event: Omit<IsolinePlayerEvent, "protocolVersion">,
): void {
  const complete = {
    ...event,
    protocolVersion: ISOLINE_PROTOCOL_VERSION,
  };
  options.onEvent?.(complete);
  canvas.dispatchEvent(
    new CustomEvent<IsolinePlayerEvent>("isoline-player", {
      detail: complete,
    }),
  );
  window.webkit?.messageHandlers?.isoline?.postMessage(complete);
}

function engineEventToPlayerEvent(
  event: IsolineEngineEvent,
): Omit<IsolinePlayerEvent, "protocolVersion"> | null {
  switch (event.type) {
    case "context-restored":
      return { type: "context-restored" };
    case "error":
      return {
        code: "renderer-error",
        message: event.error.message,
        type: "error",
      };
    case "context-lost":
      return {
        code: "context-lost",
        message: "The WebGL2 context was lost; restoration is pending.",
        type: "warning",
      };
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

class BrowserIsolinePlayer implements IsolinePlayerInstance {
  private readonly autonomousMotion: boolean;
  private readonly canvas: HTMLCanvasElement;
  private destroyed = false;
  private engine: IsolineWebGL2Engine;
  private readonly options: IsolinePlayerOptions;
  private pointer:
    | {
        lastX: number;
        lastY: number;
        mode: "orbit" | "strum";
        pointerId: number;
      }
    | undefined;
  private resizeObserver: ResizeObserver | null = null;
  private scene: IsolineSceneValues = isolineReferenceValues;
  private values: Record<string, unknown> = {};

  constructor(
    canvas: HTMLCanvasElement,
    settings: unknown,
    options: IsolinePlayerOptions,
  ) {
    this.canvas = canvas;
    this.options = options;
    this.autonomousMotion =
      options.autoplay ??
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.engine = new IsolineWebGL2Engine(canvas, this.scene, {
      continuous: this.autonomousMotion,
      onEvent: (engineEvent) => {
        const playerEvent = engineEventToPlayerEvent(engineEvent);
        if (playerEvent) {
          emitPlayerEvent(this.canvas, this.options, playerEvent);
        }
      },
    });
    canvas.tabIndex = canvas.tabIndex >= 0 ? canvas.tabIndex : 0;
    canvas.setAttribute(
      "aria-label",
      "Interactive isoline field. Drag the ring to strum. Drag outside the ring to orbit.",
    );
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerEnd);
    canvas.addEventListener("pointercancel", this.onPointerEnd);
    canvas.addEventListener("lostpointercapture", this.onPointerEnd);
    canvas.addEventListener("keydown", this.onKeyDown);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas);
    }
    if (settings !== undefined) {
      this.loadSettings(settings);
    } else {
      this.applyScene();
      if (this.autonomousMotion) {
        this.engine.useContinuousTime();
      } else {
        this.engine.freezeMotion(0);
      }
    }
    this.resize();
    this.engine.start();
    emitPlayerEvent(canvas, options, { type: "ready" });
  }

  private applyScene(): void {
    this.engine.setScene(this.scene, {
      includeBackground: includeBackground(this.values),
      progress: 0,
    });
  }

  private addImpulse(event: PointerEvent, directionX: number, directionY: number): void {
    const pick = this.engine.pickStrumFromPointer(
      event.clientX,
      event.clientY,
      this.canvas.getBoundingClientRect(),
    );
    this.engine.addImpulse({
      amplitude: this.scene.strumStrength,
      directionX,
      directionY,
      x: pick.x,
      y: pick.y,
    });
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.destroyed || event.button !== 0) {
      return;
    }
    const hitsObject = isolinePointerHitsObject(
      event.clientX,
      event.clientY,
      this.canvas.getBoundingClientRect(),
      {
        bulgeAmount: this.scene.bulgeAmount,
        cameraPosition: this.scene.orientation.position,
        innerRadius: this.scene.innerRadius,
        outerRadius: this.scene.outerRadius,
      },
    );
    this.pointer = {
      lastX: event.clientX,
      lastY: event.clientY,
      mode: hitsObject ? "strum" : "orbit",
      pointerId: event.pointerId,
    };
    this.canvas.setPointerCapture(event.pointerId);
    if (hitsObject) {
      this.addImpulse(event, 1, 0);
    }
    event.preventDefault();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.pointer || this.pointer.pointerId !== event.pointerId) {
      return;
    }
    const deltaX = event.clientX - this.pointer.lastX;
    const deltaY = this.pointer.lastY - event.clientY;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < 2) {
      return;
    }
    this.pointer.lastX = event.clientX;
    this.pointer.lastY = event.clientY;
    if (this.pointer.mode === "strum") {
      this.addImpulse(
        event,
        deltaX / Math.max(1, distance),
        deltaY / Math.max(1, distance),
      );
    } else {
      this.scene = {
        ...this.scene,
        orientation: rotateOrientation(
          this.scene.orientation,
          deltaX * 0.007,
          deltaY * 0.007,
        ),
      };
      this.applyScene();
    }
    event.preventDefault();
  };

  private onPointerEnd = (event: PointerEvent): void => {
    if (!this.pointer || this.pointer.pointerId !== event.pointerId) {
      return;
    }
    this.pointer = undefined;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    event.preventDefault();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Space") {
      this.engine.addImpulse({
        amplitude: this.scene.strumStrength,
        directionX: 1,
        directionY: 0,
        x: 0,
        y: 0,
      });
      event.preventDefault();
      return;
    }
    if (
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      return;
    }
    const yaw =
      event.key === "ArrowLeft" ? -0.08 : event.key === "ArrowRight" ? 0.08 : 0;
    const pitch =
      event.key === "ArrowUp" ? 0.08 : event.key === "ArrowDown" ? -0.08 : 0;
    this.scene = {
      ...this.scene,
      orientation: rotateOrientation(this.scene.orientation, yaw, pitch),
    };
    this.applyScene();
    event.preventDefault();
  };

  loadSettings(settings: unknown, requestId?: string): void {
    if (this.destroyed) {
      return;
    }
    try {
      const config = parseIsolineSettingsPayload(settings);
      this.values =
        typeof settings === "object" &&
        settings !== null &&
        "values" in settings &&
        typeof settings.values === "object" &&
        settings.values !== null
          ? { ...(settings.values as Record<string, unknown>) }
          : {};
      this.scene = config.scene;
      this.engine.clearImpulses();
      this.engine.setScene(this.scene, {
        includeBackground: includeBackground(this.values),
      });
      if (this.autonomousMotion) {
        this.engine.useContinuousTime();
      } else {
        this.engine.freezeMotion(0);
      }
      emitPlayerEvent(this.canvas, this.options, {
        requestId,
        type: "settings-applied",
      });
    } catch (error) {
      emitPlayerEvent(this.canvas, this.options, {
        code:
          error instanceof Error && "code" in error
            ? String(error.code)
            : "invalid-settings",
        message: error instanceof Error ? error.message : String(error),
        requestId,
        type: "error",
      });
    }
  }

  setValues(values: Record<string, unknown>, requestId?: string): void {
    if (this.destroyed) {
      return;
    }
    this.values = { ...this.values, ...values };
    this.scene = readIsolineSceneValues(this.values);
    this.applyScene();
    emitPlayerEvent(this.canvas, this.options, {
      requestId,
      type: "settings-applied",
    });
  }

  pause(): void {
    this.engine.pause();
  }

  resume(): void {
    this.engine.resume();
  }

  resize(): void {
    if (this.destroyed) {
      return;
    }
    const bounds = this.canvas.getBoundingClientRect();
    this.engine.resize(
      Math.max(1, bounds.width),
      Math.max(1, bounds.height),
      window.devicePixelRatio || 1,
    );
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerEnd);
    this.canvas.removeEventListener("pointercancel", this.onPointerEnd);
    this.canvas.removeEventListener("lostpointercapture", this.onPointerEnd);
    this.canvas.removeEventListener("keydown", this.onKeyDown);
    this.engine.destroy();
  }
}

export const IsolinePlayer: IsolinePlayerGlobal = {
  appId: ISOLINE_APP_ID,
  create: (canvas, settings, options = {}) =>
    new BrowserIsolinePlayer(canvas, settings, options),
  protocolVersion: ISOLINE_PROTOCOL_VERSION,
  version: ISOLINE_PLAYER_VERSION,
};

if (typeof window !== "undefined") {
  window.IsolinePlayer = IsolinePlayer;
}
