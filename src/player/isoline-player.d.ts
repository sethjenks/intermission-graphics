export type IsolinePlayerEventType =
  | "ready"
  | "settings-applied"
  | "warning"
  | "error"
  | "context-restored";

export type IsolinePlayerEvent = {
  code?: string;
  message?: string;
  protocolVersion: 1;
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
  appId: "intermission-graphics";
  create(
    canvas: HTMLCanvasElement,
    settings?: unknown,
    options?: IsolinePlayerOptions,
  ): IsolinePlayerInstance;
  protocolVersion: 1;
  version: "1.0.0";
};

declare global {
  interface Window {
    IsolinePlayer: IsolinePlayerGlobal;
  }
}
