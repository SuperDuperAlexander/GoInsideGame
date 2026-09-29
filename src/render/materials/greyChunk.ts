import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PALETTE } from '../../config/palette';
import { TUNING } from '../../config/tuning';

/**
 * Values shared by every outer material, updated once per frame.
 * The grey-to-colour system: global saturation + 8 colour zones (x, z, radius, strength).
 */
export const WORLD = {
  time: 0,
  saturation: TUNING.world.startSaturation as number,
  zones: new Float32Array(TUNING.world.maxZones * 4),
  camPos: new Vector3(),
  haze: Color3.FromHexString(PALETTE.outer.haze),
  /** x, z, radius, amount: the world grows darker around a pushed disturbance. */
  dark: new Float32Array(4),
  /** 0..1 extra haze from restlessness. */
  hazeBoost: 0,
  lightDir: new Vector3(0.62, 0.72, -0.3).normalize(),
  shade: Color3.FromHexString(PALETTE.outer.card600),
  ink: Color3.FromHexString(PALETTE.outer.ink),
};

export const NOISE_GLSL = /* glsl */ `
float lwHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lwNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(lwHash(i), lwHash(i + vec2(1.0, 0.0)), u.x), mix(lwHash(i + vec2(0.0, 1.0)), lwHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float lwFbm(vec2 p) { return lwNoise(p) * 0.55 + lwNoise(p * 2.13 + 3.1) * 0.3 + lwNoise(p * 4.7 + 7.7) * 0.15; }
`;

/** Shared GLSL: zone strength at a world point, and grey/colour mix. */
export const GREY_GLSL = /* glsl */ `
uniform float uSat;
uniform vec4 uZones[${TUNING.world.maxZones}];
float lwZone(vec3 w) {
  float z = 0.0;
  float torn = (lwNoise(w.xz * 0.9) - 0.5) * 1.2;
  for (int i = 0; i < ${TUNING.world.maxZones}; i++) {
    vec4 q = uZones[i];
    if (q.w <= 0.0) continue;
    float d = distance(w.xz, q.xy) + torn;
    z = max(z, q.w * smoothstep(q.z, q.z - ${TUNING.world.zoneEdge.toFixed(1)}, d));
  }
  return z;
}
vec3 lwGrey(vec3 c) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return vec3(l) * vec3(1.0, 0.985, 0.955);
}
`;
