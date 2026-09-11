import { ISOLINE_SCENE_SIZE } from "./constants";
import { buildIsolinePaths } from "./geometry";
import type { IsolineFontValue, IsolineRenderInput } from "./types";

const letterSpacingEm: Record<IsolineFontValue["letterSpacing"], number> = {
  normal: 0.28,
  tight: 0.12,
  tighter: 0.04,
  wide: 0.42,
  wider: 0.58,
  widest: 0.78,
};

const lineHeightFactor: Record<IsolineFontValue["lineHeight"], number> = {
  loose: 1.75,
  none: 1,
  normal: 1.2,
  relaxed: 1.45,
  snug: 1.1,
  tight: 1.05,
};

function applyTextCase(value: string, textCase: IsolineFontValue["textCase"]): string {
  switch (textCase) {
    case "capitalize":
      return value.replace(/\b\w/g, (character) => character.toUpperCase());
    case "lowercase":
      return value.toLocaleLowerCase();
    case "titleCase":
      return value.replace(/\w\S*/g, (word) => {
        const [first = "", ...rest] = word;
        return `${first.toLocaleUpperCase()}${rest.join("").toLocaleLowerCase()}`;
      });
    case "uppercase":
      return value.toLocaleUpperCase();
    case "original":
      return value;
    default: {
      const exhaustive: never = textCase;
      return exhaustive;
    }
  }
}

function fontFamilyName(fontId: string): string {
  switch (fontId) {
    case "geist":
      return "Geist";
    case "ibm-plex-mono":
      return "IBM Plex Mono";
    case "space-grotesk":
      return "Space Grotesk";
    default:
      return "Inter";
  }
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: IsolineFontValue,
): void {
  const display = applyTextCase(text, font.textCase);
  if (!display) {
    return;
  }

  const size = Math.max(8, font.fontSize);
  context.font = `${font.fontWeight} ${size}px "${fontFamilyName(font.fontId)}", sans-serif`;
  context.fillStyle = font.color;
  context.globalAlpha = Math.max(0, Math.min(1, font.opacity / 100));
  context.textAlign = "center";
  context.textBaseline = "middle";

  const spacing = size * letterSpacingEm[font.letterSpacing];
  const characters = [...display];
  const widths = characters.map((character) => context.measureText(character).width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    spacing * Math.max(0, characters.length - 1);
  let cursor = x - total / 2;

  for (const [index, character] of characters.entries()) {
    const width = widths[index] ?? 0;
    context.fillText(character, cursor + width / 2, y);
    cursor += width + spacing;
  }

  context.globalAlpha = 1;
}

export function drawIsolineScene(
  context: CanvasRenderingContext2D,
  input: IsolineRenderInput,
  options: { clearCanvas?: boolean; includeBackground: boolean },
): void {
  const { height, width } = input;
  context.save();

  if (options.includeBackground) {
    context.fillStyle = input.background;
    context.fillRect(0, 0, width, height);
  } else if (options.clearCanvas) {
    context.clearRect(0, 0, width, height);
  }

  const sceneScale = Math.min(width, height) / ISOLINE_SCENE_SIZE;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.strokeStyle = input.lineColor;
  context.lineWidth = Math.max(0.35, input.strokeWeight) * sceneScale;
  context.miterLimit = 2;

  for (const path of buildIsolinePaths(input)) {
    context.stroke(path);
  }

  const scaledFont = {
    ...input.font,
    fontSize: input.font.fontSize * sceneScale,
  };
  const titleY = height * 0.11;
  const subtitleY = height * 0.89;
  const typeOffset = scaledFont.fontSize * lineHeightFactor[scaledFont.lineHeight];

  if (input.showTitle && input.title.trim()) {
    drawTrackedText(context, input.title, width / 2, titleY, scaledFont);
  }

  if (input.showSubtitle && input.subtitle.trim()) {
    drawTrackedText(
      context,
      input.subtitle,
      width / 2,
      subtitleY + (typeOffset - scaledFont.fontSize) / 2,
      scaledFont,
    );
  }

  context.restore();
}
