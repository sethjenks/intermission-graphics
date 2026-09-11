"use client";

import * as React from "react";
import {
  getToolcraftTimelineLoopProgress,
  shouldIncludeToolcraftPreviewBackground,
  TOOLCRAFT_CANVAS_RENDER_SCALE,
} from "@/toolcraft/runtime";
import {
  useToolcraftDispatch,
  useToolcraftEvaluatedValues,
  useToolcraftPipelinePass,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import { drawIsolineScene } from "./draw";
import { buildIsolinePaths } from "./geometry";
import styles from "./isoline-canvas.module.css";
import { isolineRendererPipeline } from "./pipeline";
import { getIsolineLookPatch } from "./presets";
import type { IsolineLookId, IsolinePress } from "./types";
import { readIsolineSceneValues } from "./values";

const pathPass = isolineRendererPipeline.getPass("isoline-paths");
const previewPass = isolineRendererPipeline.getPass("preview-stroke");

function readRenderScale(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : TOOLCRAFT_CANVAS_RENDER_SCALE.defaultValue;
}

export function IsolineCanvas(): React.JSX.Element | null {
  const frame = useToolcraftProductSceneFrame();
  const dispatch = useToolcraftDispatch();
  const evaluatedValues = useToolcraftEvaluatedValues();
  const timeline = useToolcraftSelector((state) => state.timeline);
  const canvasMode = useToolcraftSelector((state) => state.canvas.mode);
  const includeBackground = useToolcraftSelector((state) =>
    shouldIncludeToolcraftPreviewBackground({ state }),
  );
  const values = readIsolineSceneValues(evaluatedValues);
  const renderScale = readRenderScale(evaluatedValues["canvas.renderScale"]);
  const progress = getToolcraftTimelineLoopProgress(timeline);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pressRef = React.useRef<IsolinePress | null>(null);
  const [press, setPress] = React.useState<IsolinePress | null>(null);
  const previousLook = React.useRef<IsolineLookId | null>(null);

  React.useEffect(() => {
    const look = values.look;
    if (previousLook.current === null) {
      previousLook.current = look;
      return;
    }
    if (previousLook.current === look) {
      return;
    }
    previousLook.current = look;
    const patch = getIsolineLookPatch(look);
    const historyGroup = `look.preset:${look}`;
    const writes: ReadonlyArray<readonly [string, unknown]> = [
      ["look.seed", patch.seed],
      ["ring.innerRadius", patch.innerRadius],
      ["ring.outerRadius", patch.outerRadius],
      ["ring.lineCount", patch.lineCount],
      ["ring.strokeWeight", patch.strokeWeight],
      ["ring.harmonicCount", patch.harmonicCount],
      ["ring.bulgeAmount", patch.bulgeAmount],
      ["ring.bulgeAngle", patch.bulgeAngle],
      ["ring.smoothness", patch.smoothness],
      ["ring.rotation", patch.rotation],
      ["motion.orbit", patch.orbit],
      ["motion.breathe", patch.breathe],
      ["motion.speed", patch.speed],
      ["appearance.background", patch.background],
      ["ink.line", patch.lineColor],
      ["type.font", patch.font],
    ];
    for (const [target, value] of writes) {
      dispatch({
        historyGroup,
        label: "Apply look",
        target,
        type: "controls.setValue",
        value,
      });
    }
  }, [dispatch, values.look]);

  React.useEffect(() => {
    let frameId = 0;
    const tick = () => {
      const current = pressRef.current;
      if (current && current.strength > 0.002 && !current.active) {
        const next = {
          ...current,
          strength: current.strength * 0.88,
        };
        pressRef.current = next.strength < 0.002 ? null : next;
        setPress(pressRef.current);
      }
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const pathState = useToolcraftPipelinePass(
    pathPass,
    {
      "look.seed": values.seed,
      "motion.breathe": values.breathe,
      "motion.orbit": values.orbit,
      "motion.speed": values.speed,
      "ring.bulgeAmount": values.bulgeAmount,
      "ring.bulgeAngle": values.bulgeAngle,
      "ring.harmonicCount": values.harmonicCount,
      "ring.innerRadius": values.innerRadius,
      "ring.lineCount": values.lineCount,
      "ring.outerRadius": values.outerRadius,
      "ring.rotation": values.rotation,
      "ring.smoothness": values.smoothness,
      "runtime.timeline-progress": progress,
    },
    () =>
      buildIsolinePaths({
        ...values,
        height: frame.kind === "finite" || frame.kind === "infinite" ? frame.rect.height : 1,
        press,
        progress,
        width: frame.kind === "finite" || frame.kind === "infinite" ? frame.rect.width : 1,
      }),
  );

  useToolcraftPipelinePass(
    previewPass,
    {
      "appearance.background": values.background,
      "canvas.renderScale": canvasMode,
      "ink.line": values.lineColor,
      "isoline-paths": pathState.status,
      "type.font": values.font.fontId,
      "type.showSubtitle": values.showSubtitle,
      "type.showTitle": values.showTitle,
      "type.subtitle": values.subtitle,
      "type.title": values.title,
    },
    () => undefined,
  );

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (frame.kind !== "finite" && frame.kind !== "infinite")) {
      return;
    }

    const rect = frame.rect;
    const cssWidth = Math.max(1, canvas.clientWidth);
    const cssHeight = Math.max(1, canvas.clientHeight);
    const ratio = (window.devicePixelRatio || 1) * renderScale;
    canvas.width = Math.max(1, Math.round(cssWidth * ratio));
    canvas.height = Math.max(1, Math.round(cssHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.setTransform(
      (cssWidth / rect.width) * ratio,
      0,
      0,
      (cssHeight / rect.height) * ratio,
      0,
      0,
    );
    drawIsolineScene(
      context,
      {
        ...values,
        height: rect.height,
        press,
        progress,
        width: rect.width,
      },
      { clearCanvas: true, includeBackground },
    );
  }, [frame, includeBackground, press, progress, renderScale, values]);

  if (frame.kind !== "finite" && frame.kind !== "infinite") {
    return null;
  }

  const pointerToPress = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): IsolinePress => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    const localX = (event.clientX - bounds.left) / Math.max(1, bounds.width);
    const localY = (event.clientY - bounds.top) / Math.max(1, bounds.height);
    return {
      active: true,
      strength: 1,
      x: localX * 2 - 1,
      y: 1 - localY * 2,
    };
  };

  return (
    <canvas
      className={styles.root}
      data-isoline-ink={`${values.lineColor}:${values.strokeWeight}:${values.lineCount}`}
      data-isoline-paper={values.background}
      data-isoline-type={JSON.stringify({
        color: values.font.color,
        fontId: values.font.fontId,
        fontSize: values.font.fontSize,
        fontWeight: values.font.fontWeight,
        letterSpacing: values.font.letterSpacing,
        lineHeight: values.font.lineHeight,
        opacity: values.font.opacity,
        showSubtitle: values.showSubtitle,
        showTitle: values.showTitle,
        subtitle: values.subtitle,
        textCase: values.font.textCase,
        title: values.title,
      })}
      data-timeline-progress={progress.toFixed(4)}
      data-toolcraft-product-output=""
      onPointerCancel={() => {
        if (pressRef.current) {
          pressRef.current = { ...pressRef.current, active: false };
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        const next = pointerToPress(event);
        if (frame.kind === "infinite") {
          const radius = Math.hypot(next.x, next.y);
          const inner = values.innerRadius * 0.7;
          const outer = values.outerRadius * 1.45;
          if (radius < inner || radius > outer) {
            return;
          }
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        pressRef.current = next;
        setPress(next);
        event.stopPropagation();
      }}
      onPointerMove={(event) => {
        if (!pressRef.current?.active) {
          return;
        }
        const next = pointerToPress(event);
        pressRef.current = next;
        setPress(next);
        event.stopPropagation();
      }}
      onPointerUp={() => {
        if (pressRef.current) {
          pressRef.current = { ...pressRef.current, active: false };
        }
      }}
      ref={canvasRef}
    />
  );
}
