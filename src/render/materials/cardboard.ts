import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector4 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';
import { TUNING } from '../../config/tuning';
import { GREY_GLSL, NOISE_GLSL, WORLD } from './greyChunk';

/**
 * The outer world material: grey cardboard with fibres, 2-step toon light from the right,
 * ink outlines (inverted hull variant), haze, and the grey-to-colour zones.
 * Colours come from vertex colours (the "true" restored colour); the shader greys them.
 * Variants by define: GROUND (cobbles), INK (outline hull), EXTRUDE (outline by normals),
 * IGNORE_GREY (disturbances), EMISSIVE, UNLIT, SKY.
 */
const VERTEX = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<instancesDeclaration>
uniform mat4 viewProjection;
uniform vec3 uCamPos;
uniform vec4 uHazeCfg;
uniform float uOutline;
varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vFog;
void main(void) {
#include<instancesVertex>
  vec3 p = position;
#ifdef EXTRUDE
  p += normal * uOutline;
#endif
  vec4 wp = finalWorld * vec4(p, 1.0);
#ifdef VERTEXCOLOR
  vColor = color;
#else
  vColor = vec4(1.0);
#endif
  vNormal = normalize(mat3(finalWorld) * normal);
  vWorld = wp.xyz;
  float d = distance(wp.xyz, uCamPos);
  vFog = uHazeCfg.z * smoothstep(uHazeCfg.x, uHazeCfg.y, d);
  gl_Position = viewProjection * wp;
#ifdef SKY
  gl_Position.z = gl_Position.w * 0.9999;
#endif
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uLightDir;
uniform vec4 uHazeCfg;
uniform vec3 uHaze;
uniform vec3 uShade;
uniform vec3 uInk;
uniform vec3 uTint;
uniform vec4 uDark;
uniform vec4 uEmissive;
uniform vec4 uWave;
uniform float uTime;
varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vFog;
${NOISE_GLSL}
${GREY_GLSL}
void main(void) {
#if defined(INK)
  gl_FragColor = vec4(mix(uInk, uHaze, vFog), 1.0);
#elif defined(SKY)
  vec3 col = vColor.rgb * uTint;
  vec3 skyc = mix(col, lwGrey(col) * 1.02, 1.0 - uSat);
  // A storm darkens the sky (uHazeCfg.w = storm).
  skyc = mix(skyc, vec3(0.42, 0.42, 0.46), uHazeCfg.w * 0.55);
  gl_FragColor = vec4(skyc, 1.0);
#else
  vec3 col = vColor.rgb * uTint;
  vec3 n = normalize(vNormal);
  // Fibres: low-frequency brightness noise + fine vertical streaks on cut faces.
  float fib = lwFbm(vWorld.xz * 0.9 + vWorld.y * 0.7) - 0.5;
  float streak = (lwNoise(vec2(vWorld.y * 22.0, (vWorld.x + vWorld.z) * 1.5)) - 0.5) * (1.0 - abs(n.y));
  float fibre = 1.0 + fib * 0.12 + streak * 0.06;
#ifdef GROUND
  // Cobbles in the square and lanes (vertex alpha = cobble mask).
  vec2 q = vWorld.xz * 1.6;
  vec2 cell = fract(q + vec2(0.0, floor(q.x) * 0.5)) - 0.5;
  float stone = smoothstep(0.5, 0.36, max(abs(cell.x), abs(cell.y)));
  fibre *= mix(1.0, mix(0.84, 1.0, stone), 1.0 - vColor.a);
#endif
#ifdef IGNORE_GREY
  vec3 base = col;
  float zone = 0.0;
#else
  float zone = lwZone(vWorld);
  float sat = max(uSat, zone);
  vec3 base = mix(lwGrey(col), col, sat) * (1.0 + ${TUNING.world.zoneBrighten.toFixed(2)} * zone);
#endif
  base *= fibre;
#ifdef UNLIT
  vec3 c = base;
#else
  float ndl = dot(n, uLightDir);
  float lit = smoothstep(0.05, 0.14, ndl);
  vec3 shadeCol = base * mix(vec3(0.66, 0.67, 0.72), uShade / max(lwGrey(base).r, 0.2) * 0.5 + 0.35, 0.25);
  vec3 c = mix(shadeCol, base, 0.72 + 0.28 * lit);
  c *= 0.92 + 0.1 * clamp(n.y, 0.0, 1.0);
#endif
#ifdef EMISSIVE
  c = mix(c, col * 1.25, uEmissive.x);
  c += col * uEmissive.y;
#endif
#ifdef WINDOWS
  // Each pane lights up when the town's light passes its own threshold (vertex alpha).
  float on = smoothstep(vColor.a - 0.04, vColor.a + 0.04, uEmissive.z);
  c = mix(vec3(0.16, 0.15, 0.14), col * 1.35, on);
#endif
  // The bloom wave: a warm ring runs over the town after a connection.
  float wd = abs(distance(vWorld.xz, uWave.xy) - uWave.z);
  c = mix(c, vec3(1.0, 0.92, 0.72), smoothstep(2.2, 0.0, wd) * uWave.w * 0.55);
#ifndef IGNORE_GREY
  // The world darkens around a pushed disturbance.
  float dd = distance(vWorld.xz, uDark.xy);
  c *= 1.0 - uDark.w * smoothstep(uDark.z, 0.0, dd);
#endif
  gl_FragColor = vec4(mix(c, uHaze, vFog), 1.0);
#endif
}
`;

Effect.ShadersStore['lwCardVertexShader'] = VERTEX;
Effect.ShadersStore['lwCardFragmentShader'] = FRAGMENT;

export interface CardboardOptions {
  ground?: boolean;
  ink?: boolean;
  extrude?: number;
  ignoreGrey?: boolean;
  emissive?: boolean;
  unlit?: boolean;
  sky?: boolean;
  backFaces?: boolean;
  windows?: boolean;
}

const all = new Set<ShaderMaterial>();
const dark = new Vector4();
const haze = new Vector4();
const wave = new Vector4();

export function createCardboardMaterial(scene: Scene, name: string, o: CardboardOptions = {}): ShaderMaterial {
  const defines = ['#define VERTEXCOLOR'];
  if (o.ground) defines.push('#define GROUND');
  if (o.ink) defines.push('#define INK');
  if (o.extrude) defines.push('#define EXTRUDE');
  if (o.ignoreGrey) defines.push('#define IGNORE_GREY');
  if (o.emissive) defines.push('#define EMISSIVE');
  if (o.unlit) defines.push('#define UNLIT');
  if (o.sky) defines.push('#define SKY');
  if (o.windows) defines.push('#define WINDOWS');
  const m = new ShaderMaterial(
    name,
    scene,
    { vertex: 'lwCard', fragment: 'lwCard' },
    {
      attributes: ['position', 'normal', 'color'],
      uniforms: [
        'world',
        'viewProjection',
        'uCamPos',
        'uHazeCfg',
        'uOutline',
        'uLightDir',
        'uHaze',
        'uShade',
        'uInk',
        'uTint',
        'uDark',
        'uEmissive',
        'uWave',
        'uTime',
        'uSat',
        'uZones',
      ],
      defines,
    },
  );
  m.setFloat('uOutline', o.extrude ?? 0);
  m.setColor3('uTint', Color3.White());
  m.setVector4('uEmissive', new Vector4(0, 0, 0, 0));
  // Ink hulls are drawn from their back faces; everything else from the front.
  m.backFaceCulling = true;
  if (o.ink && o.extrude) m.cullBackFaces = false;
  if (o.backFaces) m.backFaceCulling = false;
  all.add(m);
  m.onDisposeObservable.add(() => all.delete(m));
  return m;
}

/** Push the shared WORLD values into every cardboard material. Call once per frame. */
export function updateCardboardUniforms(): void {
  const t = TUNING.world;
  haze.set(t.hazeStart * (1 - 0.45 * WORLD.hazeBoost), t.hazeEnd * (1 - 0.35 * WORLD.hazeBoost), 0.92, WORLD.storm);
  for (const m of all) {
    m.setFloat('uTime', WORLD.time);
    m.setFloat('uSat', WORLD.saturation);
    m.setArray4('uZones', WORLD.zones as never as number[]);
    m.setVector3('uCamPos', WORLD.camPos);
    m.setColor3('uHaze', WORLD.haze);
    m.setColor3('uShade', WORLD.shade);
    m.setColor3('uInk', WORLD.ink);
    m.setVector3('uLightDir', WORLD.lightDir);
    dark.set(WORLD.dark[0], WORLD.dark[1], WORLD.dark[2], WORLD.dark[3]);
    m.setVector4('uDark', dark);
    m.setVector4('uHazeCfg', haze);
    wave.set(WORLD.wave[0], WORLD.wave[1], WORLD.wave[2], WORLD.wave[3]);
    m.setVector4('uWave', wave);
  }
}
