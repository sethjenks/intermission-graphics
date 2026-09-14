export class IsolineShaderError extends Error {
  readonly code: "compile-failed" | "link-failed";

  constructor(
    code: "compile-failed" | "link-failed",
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "IsolineShaderError";
  }
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new IsolineShaderError(
      "compile-failed",
      "WebGL2 could not allocate a shader.",
    );
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "Unknown shader compiler error.";
    gl.deleteShader(shader);
    throw new IsolineShaderError("compile-failed", log);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  transformFeedbackVaryings?: readonly string[],
): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new IsolineShaderError(
      "link-failed",
      "WebGL2 could not allocate a program.",
    );
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  if (transformFeedbackVaryings) {
    gl.transformFeedbackVaryings(
      program,
      [...transformFeedbackVaryings],
      gl.INTERLEAVED_ATTRIBS,
    );
  }
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "Unknown shader linker error.";
    gl.deleteProgram(program);
    throw new IsolineShaderError("link-failed", log);
  }
  return program;
}

export function getUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (location === null) {
    throw new IsolineShaderError(
      "link-failed",
      `Shader uniform "${name}" is unavailable.`,
    );
  }
  return location;
}
