"use client";

import * as React from "react";
import {
  shouldIncludeToolcraftPreviewBackground,
  TOOLCRAFT_CANVAS_RENDER_SCALE,
} from "@/toolcraft/runtime";
import {
  useToolcraftDispatch,
  useToolcraftEvaluatedValues,
  useToolcraftModelOrbitInteraction,
  useToolcraftPipelinePass,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import styles from "./isoline-canvas.module.css";
import { isolinePointerHitsObject } from "./hit-test";
import { useIsolineBackgroundImage } from "./use-isoline-background-image";
import { isolineRendererPipeline } from "./pipeline";
import { getIsolineLookPatch } from "./presets";
import type { IsolineLookId, IsolineOrientationPose } from "./types";
import { readIsolineSceneValues } from "./values";
import { selectIsolineAngularSamples } from "./webgl/geometry";
import { IsolineWebGL2Engine } from "./webgl/engine";

const linePass = isolineRendererPipeline.getPass("line-render");
const parameterPass = isolineRendererPipeline.getPass("parametric-grid");
const particlePass = isolineRendererPipeline.getPass("particle-render");
const particleStatePass = isolineRendererPipeline.getPass("particle-state");
const physicsPass = isolineRendererPipeline.getPass("physics-step");

function readRenderScale(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : TOOLCRAFT_CANVAS_RENDER_SCALE.defaultValue;
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

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function IsolineCanvas(): React.JSX.Element | null {
  const frame = useToolcraftProductSceneFrame();
  const dispatch = useToolcraftDispatch();
  const evaluatedValues = useToolcraftEvaluatedValues();
  const includeBackground = useToolcraftSelector((state) =>
    shouldIncludeToolcraftPreviewBackground({ state }),
  );
  const values = readIsolineSceneValues(evaluatedValues);
  const { asset: backgroundImageAsset, url: backgroundImageUrl } =
    useIsolineBackgroundImage();
  const renderScale = readRenderScale(evaluatedValues["canvas.renderScale"]);
  const reducedMotion = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const engineRef = React.useRef<IsolineWebGL2Engine | null>(null);
  const pointerRef = React.useRef<{
    lastClientX: number;
    lastClientY: number;
    mode: "orbit" | "strum";
    pointerId: number;
  } | null>(null);
  const previousLook = React.useRef<IsolineLookId | null>(null);
  const previousReducedMotion = React.useRef<boolean | null>(null);
  const [impulseVersion, setImpulseVersion] = React.useState(0);
  const [lastStrum, setLastStrum] = React.useState<string | undefined>();
  const [pointerTool, setPointerTool] = React.useState<"orbit" | "strum" | null>(
    null,
  );
  const [webglError, setWebglError] = React.useState<string | null>(null);
  const [webglReady, setWebglReady] = React.useState(false);

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
      ["ring.harmonicCount", patch.harmonicCount],
      ["ring.bulgeAmount", patch.bulgeAmount],
      ["ring.bulgeAngle", patch.bulgeAngle],
      ["ring.smoothness", patch.smoothness],
      ["ring.rotation", patch.rotation],
      ["space.bendX", patch.bendX],
      ["space.bendY", patch.bendY],
      ["space.depthZ", patch.depthZ],
      ["line.thickness", patch.lineThickness],
      ["motion.flow", patch.flow],
      ["motion.breathe", patch.breathe],
      ["motion.speed", patch.speed],
      ["appearance.background", patch.background],
      ["appearance.backgroundFill", patch.backgroundFill],
      ["appearance.backgroundGradient", patch.backgroundGradient],
      ["ink.gradient", patch.gradient],
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

  const frameWidth =
    frame.kind === "finite" || frame.kind === "infinite" ? frame.rect.width : 1;
  const angularSamples = selectIsolineAngularSamples(
    frameWidth * renderScale,
    values.bulgeAmount +
      Math.abs(values.bendX) +
      Math.abs(values.bendY) +
      values.depthZ,
  );

  useToolcraftPipelinePass(
    parameterPass,
    {
      "renderer.angular-samples": angularSamples,
      "ring.lineCount": values.lineCount,
    },
    () => undefined,
  );
  useToolcraftPipelinePass(
    particleStatePass,
    {
      "look.seed": values.seed,
      "particles.count": values.particleCount,
    },
    () => undefined,
  );
  useToolcraftPipelinePass(
    physicsPass,
    {
      "interaction.impulses": impulseVersion,
      "particle-state": values.particleCount,
      "particles.damping": values.particleDamping,
      "particles.return": values.particleReturn,
      "particles.scatter": values.particleScatter,
      "particles.size": values.particleSize,
      "particles.spread": values.particleSpread,
      "physics.damping": values.strumDamping,
      "physics.radius": values.strumRadius,
      "physics.return": values.strumReturn,
      "physics.strength": values.strumStrength,
      "physics.waveSpeed": values.strumWaveSpeed,
    },
    () => undefined,
  );
  useToolcraftPipelinePass(
    linePass,
    {
      "appearance.background": values.background,
      "appearance.backgroundFill": values.backgroundFill,
      "appearance.backgroundGradient": JSON.stringify(values.backgroundGradient),
      "appearance.backgroundImage": backgroundImageAsset?.id ?? "",
      "canvas.renderScale": renderScale,
      "ink.gradient": JSON.stringify(values.gradient),
      "interaction.impulses": impulseVersion,
      "line.dashGap": values.dashGap,
      "line.dashLength": values.dashLength,
      "line.makeup": values.lineMode,
      "line.thickness": values.lineThickness.join(":"),
      "line.widthProfile": JSON.stringify(values.widthProfile),
      "look.preset": values.look,
      "look.seed": values.seed,
      "motion.breathe": values.breathe,
      "motion.flow": values.flow,
      "motion.speed": values.speed,
      "parametric-grid": angularSamples,
      "particles.damping": values.particleDamping,
      "particles.return": values.particleReturn,
      "particles.scatter": values.particleScatter,
      "particles.size": values.particleSize,
      "particles.spread": values.particleSpread,
      "physics.damping": values.strumDamping,
      "physics.radius": values.strumRadius,
      "physics.return": values.strumReturn,
      "physics.strength": values.strumStrength,
      "physics.waveSpeed": values.strumWaveSpeed,
      "ring.bulgeAmount": values.bulgeAmount,
      "ring.bulgeAngle": values.bulgeAngle,
      "ring.harmonicCount": values.harmonicCount,
      "ring.innerRadius": values.innerRadius,
      "ring.lineCount": values.lineCount,
      "ring.outerRadius": values.outerRadius,
      "ring.rotation": values.rotation,
      "ring.smoothness": values.smoothness,
      "runtime.animation-frame": "continuous",
      "space.bendX": values.bendX,
      "space.bendY": values.bendY,
      "space.depthZ": values.depthZ,
      "view.orbit": JSON.stringify(values.orientation),
    },
    () => undefined,
  );
  useToolcraftPipelinePass(
    particlePass,
    {
      "appearance.background": values.background,
      "appearance.backgroundFill": values.backgroundFill,
      "appearance.backgroundGradient": JSON.stringify(values.backgroundGradient),
      "appearance.backgroundImage": backgroundImageAsset?.id ?? "",
      "canvas.renderScale": renderScale,
      "ink.gradient": JSON.stringify(values.gradient),
      "line.dashGap": values.dashGap,
      "line.dashLength": values.dashLength,
      "line.makeup": values.lineMode,
      "line.thickness": values.lineThickness.join(":"),
      "line.widthProfile": JSON.stringify(values.widthProfile),
      "look.preset": values.look,
      "look.seed": values.seed,
      "motion.breathe": values.breathe,
      "motion.flow": values.flow,
      "motion.speed": values.speed,
      "particles.size": values.particleSize,
      "physics-step": impulseVersion,
      "ring.bulgeAmount": values.bulgeAmount,
      "ring.bulgeAngle": values.bulgeAngle,
      "ring.harmonicCount": values.harmonicCount,
      "ring.innerRadius": values.innerRadius,
      "ring.lineCount": values.lineCount,
      "ring.outerRadius": values.outerRadius,
      "ring.rotation": values.rotation,
      "ring.smoothness": values.smoothness,
      "runtime.animation-frame": "continuous",
      "space.bendX": values.bendX,
      "space.bendY": values.bendY,
      "space.depthZ": values.depthZ,
      "view.orbit": JSON.stringify(values.orientation),
    },
    () => undefined,
  );

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      engineRef.current ||
      (frame.kind !== "finite" && frame.kind !== "infinite")
    ) {
      return;
    }
    try {
      const engine = new IsolineWebGL2Engine(canvas, values, {
        continuous: true,
        onEvent: (event) => {
          if (event.type === "error") {
            setWebglError(event.error.message);
            setWebglReady(false);
          } else if (event.type === "context-lost") {
            setWebglReady(false);
          } else if (event.type === "context-restored") {
            setWebglError(null);
            setWebglReady(true);
          }
        },
      });
      engineRef.current = engine;
      engine.start();
      setWebglError(null);
      setWebglReady(true);
    } catch (error) {
      setWebglReady(false);
      setWebglError(
        error instanceof Error ? error.message : "WebGL2 initialization failed.",
      );
    }
  }, [frame.kind]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (
      !canvas ||
      !engine ||
      (frame.kind !== "finite" && frame.kind !== "infinite")
    ) {
      return;
    }
    const cssWidth = Math.max(1, canvas.clientWidth);
    const cssHeight = Math.max(1, canvas.clientHeight);
    engine.resize(
      cssWidth,
      cssHeight,
      (window.devicePixelRatio || 1) * renderScale,
    );
    engine.setScene(values, { includeBackground });
  }, [frame, includeBackground, renderScale, values]);

  React.useLayoutEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    if (
      values.backgroundFill !== "image" ||
      !backgroundImageAsset ||
      !backgroundImageUrl
    ) {
      engine.setBackgroundImage(null);
      return;
    }
    const image = new Image();
    let cancelled = false;
    image.decoding = "async";
    image.onload = () => {
      void image.decode().then(
        () => {
          if (cancelled) {
            return;
          }
          engine.setBackgroundImage({
            flipHorizontal: Boolean(
              backgroundImageAsset.transform?.flipHorizontal,
            ),
            flipVertical: Boolean(backgroundImageAsset.transform?.flipVertical),
            rotationDeg: backgroundImageAsset.transform?.rotationDeg ?? 0,
            source: image,
          });
        },
        () => undefined,
      );
    };
    image.src = backgroundImageUrl;
    return () => {
      cancelled = true;
    };
  }, [
    backgroundImageAsset,
    backgroundImageUrl,
    values.backgroundFill,
    webglReady,
  ]);

  React.useLayoutEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    if (reducedMotion) {
      engine.freezeMotion(0);
    } else if (previousReducedMotion.current === true) {
      engine.useContinuousTime();
    }
    previousReducedMotion.current = reducedMotion;
  }, [reducedMotion, webglReady]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const onFreezeMotion = () => {
      engineRef.current?.freezeMotion();
    };
    canvas.addEventListener("isoline:freeze-motion", onFreezeMotion);
    return () =>
      canvas.removeEventListener("isoline:freeze-motion", onFreezeMotion);
  }, [webglReady]);

  React.useEffect(
    () => () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    },
    [],
  );

  React.useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        engineRef.current?.pause();
      } else {
        engineRef.current?.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const hitsObject = React.useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return false;
      }
      return isolinePointerHitsObject(
        clientX,
        clientY,
        canvas.getBoundingClientRect(),
        {
          bulgeAmount: values.bulgeAmount,
          cameraPosition: values.orientation.position,
          innerRadius: values.innerRadius,
          outerRadius: values.outerRadius,
        },
      );
    },
    [
      values.bulgeAmount,
      values.innerRadius,
      values.orientation.position,
      values.outerRadius,
    ],
  );

  const orbitHandlers = useToolcraftModelOrbitInteraction<HTMLCanvasElement>({
    enabled: true,
    historyLabel: "Orbit isoline view",
    hitTest: (clientX, clientY) => !hitsObject(clientX, clientY),
    target: "view.orbit",
  });

  if (frame.kind !== "finite" && frame.kind !== "infinite") {
    return null;
  }

  const addStrumImpulse = (
    event: React.PointerEvent<HTMLCanvasElement>,
    directionX: number,
    directionY: number,
  ): void => {
    const pick = engineRef.current?.pickStrumFromPointer(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
    );
    if (!pick) {
      return;
    }
    engineRef.current?.addImpulse({
      amplitude: values.strumStrength,
      directionX,
      directionY,
      x: pick.x,
      y: pick.y,
    });
    setLastStrum(
      `${pick.x.toFixed(3)},${pick.y.toFixed(3)},${pick.ndcDistance.toFixed(3)}`,
    );
    setImpulseVersion((version) => version + 1);
  };

  const finishStrum = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }
    pointerRef.current = null;
    setPointerTool(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <canvas
      aria-keyshortcuts="Space ArrowUp ArrowDown ArrowLeft ArrowRight"
      aria-label="Interactive isoline field. Drag the ring to strum. Drag outside the ring to orbit. Press Space to strum; arrow keys orbit."
      className={styles.root}
      data-isoline-field={JSON.stringify({
        fill: values.backgroundFill,
        gradient:
          values.backgroundFill === "gradient"
            ? values.backgroundGradient
            : null,
        image:
          values.backgroundFill === "image" && backgroundImageAsset
            ? {
                flipHorizontal: Boolean(
                  backgroundImageAsset.transform?.flipHorizontal,
                ),
                flipVertical: Boolean(
                  backgroundImageAsset.transform?.flipVertical,
                ),
                id: backgroundImageAsset.id,
                rotationDeg: backgroundImageAsset.transform?.rotationDeg ?? 0,
              }
            : null,
      })}
      data-isoline-ink={JSON.stringify({
        gradient: values.gradient,
        mode: values.lineMode,
        thickness: values.lineThickness,
      })}
      data-isoline-physics={impulseVersion}
      data-isoline-space={JSON.stringify({
        bendX: values.bendX,
        bendY: values.bendY,
        depthZ: values.depthZ,
        orientation: values.orientation,
      })}
      data-isoline-strum={lastStrum}
      data-isoline-tool={pointerTool ?? "idle"}
      data-motion-clock={reducedMotion ? "frozen" : "continuous"}
      data-toolcraft-product-output=""
      data-webgl2-error={webglError ?? undefined}
      data-webgl2-ready={webglReady ? "true" : "false"}
      onKeyDown={(event) => {
        if (event.code === "Space") {
          engineRef.current?.addImpulse({
            amplitude: values.strumStrength,
            directionX: 1,
            directionY: 0,
            x: 0,
            y: 0,
          });
          setImpulseVersion((version) => version + 1);
          event.preventDefault();
          event.stopPropagation();
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
        dispatch({
          label: "Orbit isoline view",
          target: "view.orbit",
          type: "controls.setValue",
          value: rotateOrientation(values.orientation, yaw, pitch),
        });
        event.preventDefault();
        event.stopPropagation();
      }}
      onLostPointerCapture={(event) => {
        if (pointerRef.current?.mode === "strum") {
          finishStrum(event);
          return;
        }
        orbitHandlers.onLostPointerCapture(event);
        setPointerTool(null);
      }}
      onPointerCancel={(event) => {
        if (pointerRef.current?.mode === "strum") {
          finishStrum(event);
          return;
        }
        orbitHandlers.onPointerCancel(event);
        setPointerTool(null);
      }}
      onPointerDown={(event) => {
        if (
          event.button !== 0 ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          return;
        }
        if (hitsObject(event.clientX, event.clientY)) {
          pointerRef.current = {
            lastClientX: event.clientX,
            lastClientY: event.clientY,
            mode: "strum",
            pointerId: event.pointerId,
          };
          setPointerTool("strum");
          event.currentTarget.setPointerCapture(event.pointerId);
          addStrumImpulse(event, 1, 0);
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        setPointerTool("orbit");
        orbitHandlers.onPointerDown(event);
      }}
      onPointerMove={(event) => {
        const pointer = pointerRef.current;
        if (pointer?.mode === "strum" && pointer.pointerId === event.pointerId) {
          const deltaX = event.clientX - pointer.lastClientX;
          const deltaY = pointer.lastClientY - event.clientY;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance >= 3) {
            pointer.lastClientX = event.clientX;
            pointer.lastClientY = event.clientY;
            addStrumImpulse(
              event,
              deltaX / Math.max(1, distance),
              deltaY / Math.max(1, distance),
            );
          }
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        orbitHandlers.onPointerMove(event);
      }}
      onPointerUp={(event) => {
        if (pointerRef.current?.mode === "strum") {
          finishStrum(event);
          return;
        }
        orbitHandlers.onPointerUp(event);
        setPointerTool(null);
      }}
      ref={canvasRef}
      role="img"
      tabIndex={0}
    />
  );
}
