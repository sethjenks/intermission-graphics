import {
  ISOLINE_ANGULAR_SAMPLE_DEFAULT,
  ISOLINE_ANGULAR_SAMPLE_MAX,
  ISOLINE_ANGULAR_SAMPLE_MIN,
} from "../constants";

export function selectIsolineAngularSamples(
  pixelWidth: number,
  deformation: number,
): number {
  const projectedComplexity =
    Math.max(1, pixelWidth) * (1 + Math.max(0, deformation) * 1.5);
  if (projectedComplexity >= 1_800) {
    return ISOLINE_ANGULAR_SAMPLE_MAX;
  }
  if (projectedComplexity >= 900) {
    return ISOLINE_ANGULAR_SAMPLE_DEFAULT;
  }
  return ISOLINE_ANGULAR_SAMPLE_MIN;
}

export function createEmptyVertexArray(
  gl: WebGL2RenderingContext,
): WebGLVertexArrayObject {
  const vertexArray = gl.createVertexArray();
  if (!vertexArray) {
    throw new Error("WebGL2 could not allocate a vertex array.");
  }
  return vertexArray;
}
