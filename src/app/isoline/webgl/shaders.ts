const surfaceFunctions = /* glsl */ `
const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const int MAX_IMPULSES = 8;

uniform float uBendX;
uniform float uBendY;
uniform float uBreathe;
uniform float uBulgeAmount;
uniform float uBulgeAngle;
uniform float uDepthZ;
uniform float uFlow;
uniform float uHarmonicCount;
uniform float uInnerRadius;
uniform vec4 uImpulses[MAX_IMPULSES];
uniform vec2 uImpulseDirections[MAX_IMPULSES];
uniform int uImpulseCount;
uniform float uOuterRadius;
uniform float uProgress;
uniform float uRotation;
uniform float uSeed;
uniform float uSmoothness;
uniform float uSpeed;
uniform float uStrumDamping;
uniform float uStrumRadius;
uniform float uStrumReturn;
uniform float uStrumWaveSpeed;

float hash11(float value) {
  return fract(sin(value * 127.1 + uSeed * 311.7) * 43758.5453123);
}

vec3 surfacePosition(float theta, float lineT) {
  float flowPhase = uFlow * fract(uProgress * uSpeed) * TWO_PI;
  float angle = theta - radians(uBulgeAngle) - flowPhase;
  float deform = 0.0;
  for (int harmonic = 1; harmonic <= 6; harmonic += 1) {
    float enabled = step(float(harmonic), uHarmonicCount + 0.01);
    float amplitude = uBulgeAmount *
      (harmonic == 1 ? 1.0 : 0.55 / float(harmonic)) *
      mix(0.72, 1.0, uSmoothness);
    float phase = harmonic == 1 ? 0.0 : hash11(float(harmonic)) * TWO_PI;
    deform += enabled * amplitude *
      cos(float(harmonic) * angle + phase);
  }
  deform += (1.0 - uSmoothness) * 0.045 *
    sin(theta * 5.0 + hash11(5.0) * TWO_PI) *
    cos(theta * 3.0 + hash11(6.0) * TWO_PI);

  float breathe = mix(
    1.0,
    1.0 + 0.035 * sin(fract(uProgress * max(0.15, uSpeed)) * TWO_PI),
    uBreathe
  );
  float radius = mix(uInnerRadius, uOuterRadius, lineT) * breathe * (1.0 + deform);
  float rotatedTheta = theta + radians(uRotation);
  vec2 radialDirection = vec2(cos(rotatedTheta), sin(rotatedTheta));
  vec2 planar = radialDirection * radius;
  float wave = 0.0;

  for (int index = 0; index < MAX_IMPULSES; index += 1) {
    if (index >= uImpulseCount) {
      break;
    }
    vec4 impulse = uImpulses[index];
    float distanceFromImpulse = distance(planar, impulse.xy);
    float waveFront = impulse.w * uStrumWaveSpeed;
    float width = max(0.025, uStrumRadius);
    float pressWidth = max(0.028, width * 0.32);
    float press = exp(-pow(distanceFromImpulse / pressWidth, 2.0));
    float ring = exp(-pow((distanceFromImpulse - waveFront) / max(0.035, width * 0.7), 2.0));
    float decay = exp(-impulse.w * mix(0.6, 5.0, 1.0 - uStrumDamping));
    float contact = press * (1.0 - smoothstep(0.0, 0.5, impulse.w));
    wave += impulse.z * decay * mix(0.65, 1.0, uStrumReturn) * (
      contact * 1.7 +
      ring * sin((distanceFromImpulse - waveFront) * 22.0) * 0.22
    );
  }

  planar += radialDirection * wave * 0.12;
  float z = uDepthZ * (
    sin(theta * 2.0 + flowPhase + lineT * PI) * 0.32 +
    (lineT - 0.5) * 0.28
  ) + wave * 0.22;
  float originalX = planar.x;
  planar.x += uBendX * planar.y * planar.y * sign(planar.y) * 0.55;
  planar.y += uBendY * originalX * originalX * sign(originalX) * 0.55;
  return vec3(planar, z);
}
`;

const gradientFragmentFunctions = /* glsl */ `
uniform float uGradientAngle;
uniform vec4 uGradientColors[8];
uniform int uGradientCount;
uniform float uGradientPositions[8];
uniform int uGradientType;

vec4 gradientColor(vec3 position) {
  float angle = radians(uGradientAngle);
  vec2 direction = vec2(cos(angle), sin(angle));
  float coordinate = dot(position.xy, direction) * 0.8 + 0.5;
  if (uGradientType == 1) {
    coordinate = length(position.xy) / 0.9;
  } else if (uGradientType == 2) {
    coordinate = fract(atan(position.y, position.x) / 6.283185307179586 + 1.0);
  } else if (uGradientType == 3) {
    coordinate = (abs(position.x) + abs(position.y)) / 1.25;
  }
  coordinate = clamp(coordinate, 0.0, 1.0);

  vec4 color = uGradientColors[0];
  for (int index = 1; index < 8; index += 1) {
    if (index >= uGradientCount) {
      break;
    }
    float start = uGradientPositions[index - 1];
    float finish = max(start + 0.0001, uGradientPositions[index]);
    float amount = smoothstep(start, finish, coordinate);
    color = mix(color, uGradientColors[index], amount);
  }
  return color;
}
`;

export const lineVertexShader = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

${surfaceFunctions}

uniform int uAngularSamples;
uniform float uLineCount;
uniform mat4 uViewProjection;
uniform vec2 uResolution;
uniform float uThicknessInner;
uniform float uThicknessOuter;
uniform float uWidthProfile[16];

out float vArc;
out float vEdge;
out vec3 vWorld;

float widthProfile(float lineT) {
  float scaled = clamp(lineT, 0.0, 1.0) * 15.0;
  int lower = int(floor(scaled));
  int upper = min(15, lower + 1);
  return mix(uWidthProfile[lower], uWidthProfile[upper], fract(scaled));
}

void main() {
  int sampleIndex = gl_VertexID / 2;
  float side = mod(float(gl_VertexID), 2.0) * 2.0 - 1.0;
  float lineT = uLineCount <= 1.0
    ? 0.0
    : float(gl_InstanceID) / (uLineCount - 1.0);
  float theta = float(sampleIndex) / float(uAngularSamples) * TWO_PI;
  float nextTheta = float(sampleIndex + 1) / float(uAngularSamples) * TWO_PI;
  vec3 world = surfacePosition(theta, lineT);
  vec3 nextWorld = surfacePosition(nextTheta, lineT);
  vec4 clip = uViewProjection * vec4(world, 1.0);
  vec4 nextClip = uViewProjection * vec4(nextWorld, 1.0);
  vec2 currentNdc = clip.xy / max(0.0001, clip.w);
  vec2 nextNdc = nextClip.xy / max(0.0001, nextClip.w);
  vec2 tangent = normalize(nextNdc - currentNdc + vec2(0.000001));
  vec2 normal = vec2(-tangent.y, tangent.x);
  float profile = widthProfile(lineT);
  float widthPixels = mix(uThicknessInner, uThicknessOuter, profile);
  vec2 offset = normal * side * widthPixels / max(uResolution, vec2(1.0));
  clip.xy += offset * clip.w * 2.0;

  gl_Position = clip;
  vArc = float(sampleIndex) / float(uAngularSamples);
  vEdge = side;
  vWorld = world;
}
`;

export const lineFragmentShader = /* glsl */ `#version 300 es
precision highp float;

${gradientFragmentFunctions}

uniform float uDashGap;
uniform float uDashLength;
uniform int uLineMode;

in float vArc;
in float vEdge;
in vec3 vWorld;
out vec4 outColor;

void main() {
  if (uLineMode == 1) {
    float period = max(0.0001, uDashLength + uDashGap);
    if (mod(vArc, period) > uDashLength) {
      discard;
    }
  }
  float edgeAlpha = 1.0 - smoothstep(0.72, 1.0, abs(vEdge));
  vec4 color = gradientColor(vWorld);
  outColor = vec4(color.rgb, color.a * edgeAlpha);
}
`;

export const particleUpdateVertexShader = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

${surfaceFunctions}

layout(location = 0) in vec3 aOffset;
layout(location = 1) in vec3 aVelocity;

uniform float uDeltaSeconds;
uniform float uParticleDamping;
uniform float uParticleReturn;
uniform float uParticleScatter;
uniform float uParticleSpread;
uniform float uLineCount;

out vec3 nextOffset;
out vec3 nextVelocity;

void main() {
  float index = float(gl_VertexID);
  float lineT = hash11(index * 1.37);
  float theta = hash11(index * 2.11 + 7.0) * TWO_PI;
  vec3 home = surfacePosition(theta, lineT);
  vec3 velocity = aVelocity;

  for (int impulseIndex = 0; impulseIndex < MAX_IMPULSES; impulseIndex += 1) {
    if (impulseIndex >= uImpulseCount) {
      break;
    }
    vec4 impulse = uImpulses[impulseIndex];
    vec2 delta = home.xy + aOffset.xy - impulse.xy;
    float distanceFromImpulse = length(delta);
    float falloff = exp(-pow(distanceFromImpulse / max(0.03, uStrumRadius), 2.0));
    vec2 direction = length(delta) > 0.0001
      ? normalize(delta)
      : uImpulseDirections[impulseIndex];
    velocity += vec3(direction, 0.45) *
      impulse.z * uParticleScatter * falloff * uDeltaSeconds * 7.0;
  }

  vec3 deterministicSpread = vec3(
    hash11(index + 31.0) - 0.5,
    hash11(index + 47.0) - 0.5,
    hash11(index + 59.0) - 0.5
  ) * uParticleSpread * 0.03;
  velocity += (-aOffset + deterministicSpread) *
    uParticleReturn * uDeltaSeconds * 8.0;
  velocity *= pow(clamp(uParticleDamping, 0.0, 0.9999), uDeltaSeconds * 60.0);
  nextVelocity = velocity;
  nextOffset = aOffset + velocity * uDeltaSeconds;
  gl_Position = vec4(0.0);
}
`;

export const particleUpdateFragmentShader = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  outColor = vec4(0.0);
}
`;

export const particleVertexShader = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

${surfaceFunctions}

layout(location = 0) in vec3 aOffset;
layout(location = 1) in vec3 aVelocity;

uniform mat4 uViewProjection;
uniform float uParticleSize;
uniform float uLineCount;

out vec3 vWorld;

void main() {
  float index = float(gl_VertexID);
  float lineT = hash11(index * 1.37);
  float theta = hash11(index * 2.11 + 7.0) * TWO_PI;
  vec3 world = surfacePosition(theta, lineT) + aOffset;
  gl_Position = uViewProjection * vec4(world, 1.0);
  gl_PointSize = max(1.0, uParticleSize);
  vWorld = world;
}
`;

export const particleFragmentShader = /* glsl */ `#version 300 es
precision highp float;

${gradientFragmentFunctions}

in vec3 vWorld;
out vec4 outColor;

void main() {
  vec2 point = gl_PointCoord * 2.0 - 1.0;
  float distanceFromCenter = dot(point, point);
  if (distanceFromCenter > 1.0) {
    discard;
  }
  float alpha = 1.0 - smoothstep(0.55, 1.0, distanceFromCenter);
  vec4 color = gradientColor(vWorld);
  outColor = vec4(color.rgb, color.a * alpha);
}
`;

export const fieldVertexShader = /* glsl */ `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 ndc = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
  vUv = ndc * 0.5 + 0.5;
  gl_Position = vec4(ndc, 0.0, 1.0);
}
`;

export const fieldFragmentShader = /* glsl */ `#version 300 es
precision highp float;

${gradientFragmentFunctions}

uniform int uHasImage;
uniform sampler2D uImage;
uniform vec2 uCoverScale;
uniform vec2 uFlip;
uniform int uRotation;

in vec2 vUv;
out vec4 outColor;

vec2 coverUv(vec2 uv) {
  vec2 centered = (uv - 0.5) * uFlip;
  if (uRotation == 1) {
    centered = vec2(-centered.y, centered.x);
  } else if (uRotation == 2) {
    centered = -centered;
  } else if (uRotation == 3) {
    centered = vec2(centered.y, -centered.x);
  }
  return centered * uCoverScale + 0.5;
}

void main() {
  if (uHasImage == 1) {
    outColor = texture(uImage, coverUv(vUv));
    return;
  }
  vec3 position = vec3(vUv * 2.0 - 1.0, 0.0);
  outColor = gradientColor(position);
}
`;
