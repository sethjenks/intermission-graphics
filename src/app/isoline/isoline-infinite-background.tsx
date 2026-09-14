"use client";

import type { JSX } from "react";
import { useToolcraftEvaluatedValues } from "@/toolcraft/runtime/react";

import styles from "./isoline-infinite-background.module.css";
import type { IsolineGradient, IsolineGradientStop } from "./types";
import { useIsolineBackgroundImage } from "./use-isoline-background-image";
import {
  readIsolineSceneValues,
  resolveIsolineBackgroundGradient,
} from "./values";

function hexToRgba(color: string, opacity: number): string {
  const hex = /^#[\da-f]{6}$/iu.test(color) ? color.slice(1) : "F6F3EE";
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity / 100})`;
}

function stopCss(stop: IsolineGradientStop): string {
  return `${hexToRgba(stop.color, stop.opacity)} ${stop.position}`;
}

function gradientCss(gradient: IsolineGradient): string {
  const stops = gradient.stops.map(stopCss).join(", ");
  switch (gradient.gradientType) {
    case "linear":
      return `linear-gradient(${gradient.angle}deg, ${stops})`;
    case "radial":
      return `radial-gradient(circle at center, ${stops})`;
    case "angular":
      return `conic-gradient(from ${gradient.angle}deg at center, ${stops})`;
    case "diamond":
      return `radial-gradient(closest-side at center, ${stops})`;
    default: {
      const exhaustive: never = gradient.gradientType;
      throw new Error(`Unhandled gradient type ${String(exhaustive)}`);
    }
  }
}

export function IsolineInfiniteBackground(): JSX.Element {
  const values = readIsolineSceneValues(useToolcraftEvaluatedValues());
  const { asset, url } = useIsolineBackgroundImage();
  const fill = values.backgroundFill;

  switch (fill) {
    case "solid":
      return (
        <div
          className={styles.root}
          data-isoline-infinite-fill="solid"
          style={{ backgroundColor: values.background }}
        />
      );
    case "gradient":
      return (
        <div
          className={styles.root}
          data-isoline-infinite-fill="gradient"
          style={{
            backgroundImage: gradientCss(
              resolveIsolineBackgroundGradient(values),
            ),
          }}
        />
      );
    case "image": {
      if (!asset || !url) {
        return (
          <div
            className={styles.root}
            data-isoline-infinite-fill="image"
            style={{ backgroundColor: values.background }}
          />
        );
      }
      const flipX = asset.transform?.flipHorizontal ? -1 : 1;
      const flipY = asset.transform?.flipVertical ? -1 : 1;
      const rotationDeg = asset.transform?.rotationDeg ?? 0;
      return (
        <div className={styles.root} data-isoline-infinite-fill="image">
          <img
            alt=""
            className={styles.image}
            src={url}
            style={{
              transform: `rotate(${rotationDeg}deg) scale(${flipX}, ${flipY})`,
            }}
          />
        </div>
      );
    }
    default: {
      const exhaustive: never = fill;
      throw new Error(`Unhandled background fill ${String(exhaustive)}`);
    }
  }
}
