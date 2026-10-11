import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  type WebGLProgramParametersWithUniforms,
} from "three";

// Geometry and materials shared by every building so the GPU only sees a handful of unique resources.
export const unitBox = new BoxGeometry(1, 1, 1);
export const shrubGeometry = new IcosahedronGeometry(1, 0);
export const poleGeometry = new CylinderGeometry(0.5, 0.7, 1, 6);
export const bladeGeometry = new BoxGeometry(0.16, 1, 0.04);
export const coneGeometry = new ConeGeometry(1, 1, 7);

export const sharedMaterials = {
  timber: new MeshStandardMaterial({ color: "#d8b77c", roughness: 0.74 }),
  terrace: new MeshStandardMaterial({ color: "#6fae62", roughness: 0.86 }),
  shrubA: new MeshStandardMaterial({ color: "#4f9a5a", roughness: 0.8, flatShading: true }),
  shrubB: new MeshStandardMaterial({ color: "#8cc46f", roughness: 0.8, flatShading: true }),
  solar: new MeshStandardMaterial({ color: "#1f4a63", emissive: "#8fd3c8", emissiveIntensity: 0.1, roughness: 0.2, metalness: 0.35 }),
  frame: new MeshStandardMaterial({ color: "#e9e1cf", roughness: 0.5, metalness: 0.2 }),
  turbine: new MeshStandardMaterial({ color: "#f7f1e1", roughness: 0.4 }),
};

export interface VineUniform {
  value: number;
}

// Painted-on windows, lit panes and hanging vines, computed in the fragment shader from object-space
// coordinates. This replaces dozens of tiny meshes per building with zero extra draw calls.
export function makeBuildingShaderPatch(seed: number, vine: VineUniform) {
  return (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uSeed = { value: (seed % 997) + 0.5 };
    shader.uniforms.uVine = vine;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 vLocal;
         varying vec3 vObjN;
         varying vec3 vScale;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vec3 sc = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
         vLocal = position * sc;
         vObjN = normal;
         vScale = sc;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uSeed;
         uniform float uVine;
         varying vec3 vLocal;
         varying vec3 vObjN;
         varying vec3 vScale;
         float hash21(vec2 p) {
           p = fract(p * vec2(123.34, 456.21));
           p += dot(p, p + 45.32);
           return fract(p.x * p.y);
         }`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
         float winGlow = 0.0;
         float side = 0.0;
         vec2 wuv = vec2(0.0);
         float rise = vLocal.y + vScale.y * 0.5;
         if (abs(vObjN.x) > 0.5) { wuv = vec2(vLocal.z, rise); side = 1.0; }
         else if (abs(vObjN.z) > 0.5) { wuv = vec2(vLocal.x, rise); side = 2.0; }
         if (side > 0.0) {
           vec2 cell = vec2(0.82, 0.96);
           vec2 id = floor(wuv / cell);
           vec2 f = fract(wuv / cell);
           float rnd = hash21(id + uSeed + side * 7.0);
           if (wuv.y > 0.55 && f.x > 0.2 && f.x < 0.8 && f.y > 0.26 && f.y < 0.78) {
             vec3 glass = mix(vec3(0.30, 0.54, 0.58), vec3(0.62, 0.86, 0.82), f.y);
             diffuseColor.rgb = mix(diffuseColor.rgb, glass, 0.66);
             winGlow = step(0.76, rnd);
           }
           if (wuv.y > 0.55 && f.y < 0.07) { diffuseColor.rgb *= 0.88; }
           float colRnd = hash21(vec2(id.x, side) + uSeed * 1.7);
           if (uVine > 0.5 && colRnd < 0.2 && f.x > 0.12 && f.x < 0.88) {
             float len = (0.3 + 0.6 * hash21(vec2(id.x + 3.0, side + uSeed))) * vScale.y;
             float fromTop = vScale.y - wuv.y;
             if (fromTop < len) {
               float leaf = hash21(floor(wuv * vec2(5.0, 4.0)) + uSeed);
               if (leaf > 0.28) {
                 diffuseColor.rgb = mix(vec3(0.20, 0.47, 0.24), vec3(0.50, 0.76, 0.32), leaf);
                 winGlow = 0.0;
               }
             }
           }
         }`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += winGlow * vec3(1.0, 0.78, 0.42) * 0.32;`,
      );
  };
}
