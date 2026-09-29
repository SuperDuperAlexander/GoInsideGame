import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';
import { PALETTE } from '../../config/palette';
import { NOISE_GLSL } from './greyChunk';

/**
 * The inner world material: thin white paper-cut planes, lit from behind by warm gold.
 * Cut pattern by alpha test (lace, leaves, waves, solid); the threshold breathes a little.
 * Back light is brightest at thin areas and cut edges (rim glow). Front ivory, cool shade facing away.
 */
Effect.ShadersStore['lwPaperVertexShader'] = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
#include<instancesDeclaration>
uniform mat4 viewProjection;
uniform vec3 uCamPos;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vDist;
void main(void) {
#include<instancesVertex>
  vec4 wp = finalWorld * vec4(position, 1.0);
  vUv = uv;
  vNormal = normalize(mat3(finalWorld) * normal);
  vWorld = wp.xyz;
  vDist = distance(wp.xyz, uCamPos);
  gl_Position = viewProjection * wp;
}
`;

Effect.ShadersStore['lwPaperFragmentShader'] = /* glsl */ `
precision highp float;
uniform vec3 uCamPos;
uniform vec3 uIvory;
uniform vec3 uShadow;
uniform vec3 uGold;
uniform vec3 uAmber;
uniform vec3 uNight;
uniform vec3 uTint;
uniform float uTime;
uniform float uPattern;
uniform float uScale;
uniform float uThreshold;
uniform float uLight;
uniform float uGlow;
uniform float uDim;
uniform vec4 uHole;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vDist;
${NOISE_GLSL}
float pattern(vec2 uv) {
  vec2 p = uv * uScale;
  if (uPattern < 0.5) {
    // Lace: rosettes on a grid, joined by thin bridges.
    vec2 g = fract(p) - 0.5;
    float r = length(g);
    float a = atan(g.y, g.x);
    float petals = 0.5 + 0.5 * cos(a * 6.0 + floor(p.x) * 1.3);
    float ring = abs(r - 0.34) * 3.0;
    return min(r * 2.2 + 0.25 - petals * 0.35, ring + 0.2) + (lwNoise(p * 3.0) - 0.5) * 0.12;
  } else if (uPattern < 1.5) {
    // Leaves: flowing organic noise.
    return lwFbm(p * 1.3 + vec2(0.0, uTime * 0.02)) * 1.25;
  } else if (uPattern < 2.5) {
    // Waves: layered wavy bands.
    float w = sin(p.y * 6.2832 + sin(p.x * 3.1416) * 1.3) * 0.5 + 0.5;
    return w * 0.9 + lwNoise(p * 2.0) * 0.25;
  }
  return 1.0;
}
void main(void) {
  float v = pattern(vUv);
  float th = uThreshold + sin(uTime * 0.7 + vWorld.x * 0.3) * 0.02;
  // A cut shape (door) in uv space: x0, y0, x1, y1 (active when x1 > x0).
  if (uHole.z > uHole.x) {
    vec2 q = vUv;
    float arch = uHole.w - (uHole.z - uHole.x) * 0.5;
    bool inRect = q.x > uHole.x && q.x < uHole.z && q.y > uHole.y && q.y < arch;
    vec2 c = vec2((uHole.x + uHole.z) * 0.5, arch);
    bool inArch = q.y >= arch && distance(q, c) < (uHole.z - uHole.x) * 0.5;
    if (inRect || inArch) discard;
  }
  if (uPattern < 2.5 && v < th) discard;
  float edge = uPattern < 2.5 ? 1.0 - smoothstep(0.0, 0.1, v - th) : 0.0;
  vec3 n = normalize(vNormal);
  vec3 toCam = normalize(uCamPos - vWorld);
  float facing = abs(dot(n, toCam));
  float depth = clamp(vDist / 18.0, 0.0, 1.0);
  vec3 back = mix(uGold, uAmber, depth);
  vec3 front = mix(uShadow, uIvory, 0.55 + 0.45 * facing) * uTint;
  vec3 c = mix(front, back, 0.28 * uLight);
  c += back * edge * (0.45 + 0.9 * uLight);
  c += back * uGlow;
  // Far layers sink into the night.
  c = mix(c, uNight, smoothstep(12.0, 40.0, vDist) * 0.8);
  c *= 1.0 - uDim;
  gl_FragColor = vec4(c, 1.0);
}
`;

export type Pattern = 'lace' | 'leaves' | 'waves' | 'solid';
const PATTERN_ID: Record<Pattern, number> = { lace: 0, leaves: 1, waves: 2, solid: 3 };

export interface PaperOptions {
  pattern: Pattern;
  scale?: number;
  threshold?: number;
  tint?: string;
}

export interface PaperMaterial extends ShaderMaterial {
  lw: { threshold: number; light: number; glow: number };
}

const all = new Set<PaperMaterial>();
export const INNER = { time: 0, light: 0.4, dim: 0, camPos: null as null | { x: number; y: number; z: number } };

export function createPaperMaterial(scene: Scene, name: string, o: PaperOptions): PaperMaterial {
  const m = new ShaderMaterial(
    name,
    scene,
    { vertex: 'lwPaper', fragment: 'lwPaper' },
    {
      attributes: ['position', 'normal', 'uv'],
      uniforms: [
        'world', 'viewProjection', 'uCamPos', 'uIvory', 'uShadow', 'uGold', 'uAmber', 'uNight', 'uTint', 'uTime',
        'uPattern', 'uScale', 'uThreshold', 'uLight', 'uGlow', 'uDim', 'uHole',
      ],
    },
  ) as PaperMaterial;
  m.backFaceCulling = false;
  const I = PALETTE.inner;
  m.setColor3('uIvory', Color3.FromHexString(I.ivory));
  m.setColor3('uShadow', Color3.FromHexString(I.shadow));
  m.setColor3('uGold', Color3.FromHexString(I.gold));
  m.setColor3('uAmber', Color3.FromHexString(I.amber));
  m.setColor3('uNight', Color3.FromHexString(I.night));
  m.setColor3('uTint', Color3.FromHexString(o.tint ?? I.white));
  m.setFloat('uPattern', PATTERN_ID[o.pattern]);
  m.setFloat('uScale', o.scale ?? 3);
  m.setVector4('uHole', { x: 0, y: 0, z: 0, w: 0 } as never);
  m.lw = { threshold: o.threshold ?? 0.45, light: 1, glow: 0 };
  all.add(m);
  m.onDisposeObservable.add(() => all.delete(m));
  return m;
}

export function setHole(m: PaperMaterial, x0: number, y0: number, x1: number, y1: number): void {
  m.setVector4('uHole', { x: x0, y: y0, z: x1, w: y1 } as never);
}

/** Once per frame, inner world only. */
export function updatePaperUniforms(cam: { x: number; y: number; z: number }): void {
  for (const m of all) {
    m.setVector3('uCamPos', cam as never);
    m.setFloat('uTime', INNER.time);
    m.setFloat('uThreshold', m.lw.threshold);
    m.setFloat('uLight', INNER.light * m.lw.light);
    m.setFloat('uGlow', m.lw.glow);
    m.setFloat('uDim', INNER.dim);
  }
}
