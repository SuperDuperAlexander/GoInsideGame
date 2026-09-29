import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';

/** Additive light: the chest light, beams, the fountain water, the light bridge. Soft at the rim. */
Effect.ShadersStore['lwLightVertexShader'] = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
#include<instancesDeclaration>
uniform mat4 viewProjection;
uniform vec3 uCamPos;
varying float vRim;
varying vec3 vWorld;
void main(void) {
#include<instancesVertex>
  vec4 wp = finalWorld * vec4(position, 1.0);
  vec3 n = normalize(mat3(finalWorld) * normal);
  vec3 v = normalize(uCamPos - wp.xyz);
  vRim = abs(dot(n, v));
  vWorld = wp.xyz;
  gl_Position = viewProjection * wp;
}
`;
Effect.ShadersStore['lwLightFragmentShader'] = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uCore;
uniform float uIntensity;
uniform float uSoft;
uniform float uTime;
varying float vRim;
varying vec3 vWorld;
void main(void) {
  float a = mix(1.0, pow(vRim, 1.6), uSoft);
  float flick = 0.94 + 0.06 * sin(uTime * 3.1 + vWorld.y * 4.0);
  vec3 c = mix(uColor, uCore, pow(vRim, 3.0)) * a * uIntensity * flick;
  gl_FragColor = vec4(c, 1.0);
}
`;

export interface LightMaterial extends ShaderMaterial {
  lwSet(intensity: number): void;
}

export function createLightMaterial(scene: Scene, name: string, color: string, core: string, soft = 1): LightMaterial {
  const m = new ShaderMaterial(
    name,
    scene,
    { vertex: 'lwLight', fragment: 'lwLight' },
    {
      attributes: ['position', 'normal'],
      uniforms: ['world', 'viewProjection', 'uCamPos', 'uColor', 'uCore', 'uIntensity', 'uSoft', 'uTime'],
      needAlphaBlending: true,
    },
  ) as LightMaterial;
  m.alphaMode = Constants.ALPHA_ADD;
  m.disableDepthWrite = true;
  m.backFaceCulling = false;
  m.setColor3('uColor', Color3.FromHexString(color));
  m.setColor3('uCore', Color3.FromHexString(core));
  m.setFloat('uIntensity', 1);
  m.setFloat('uSoft', soft);
  m.setFloat('uTime', 0);
  m.lwSet = (i: number) => m.setFloat('uIntensity', i);
  m.onBindObservable.add(() => {
    const cam = scene.activeCamera;
    if (cam) m.setVector3('uCamPos', cam.globalPosition);
    m.setFloat('uTime', performance.now() / 1000);
  });
  return m;
}
