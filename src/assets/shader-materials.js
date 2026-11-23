import * as THREE from 'three';

export function createWingMaterial(color = '#a9f5df') {
  return new THREE.ShaderMaterial({
    name: 'WingGlowShader',
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uFlap: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uTime; uniform float uFlap;
      varying vec2 vUv;
      void main(){
        float edge = smoothstep(0.0,0.22,vUv.x)*smoothstep(1.0,0.72,vUv.x);
        float veins = pow(abs(sin(vUv.x*24.0 + vUv.y*7.0)), 12.0)*0.22;
        float shimmer = 0.5+0.5*sin(uTime*2.5 + vUv.x*8.0 - vUv.y*5.0);
        vec3 c = mix(uColor, vec3(1.0), 0.35 + shimmer*0.35 + veins);
        float a = (0.24 + shimmer*0.16 + veins) * edge * (0.85 - uFlap*0.2);
        gl_FragColor = vec4(c, a);
      }`,
  });
}

export function applyWind(material, uniforms, strength = 0.12) {
  if (!material || material.userData?.faewoodWind === strength) return material;
  material.userData = material.userData || {};
  material.userData.faewoodWind = strength;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float sway = sin(uTime*1.1 + instanceMatrix[3].x*0.35 + instanceMatrix[3].z*0.27) * ${strength.toFixed(3)};
          transformed.x += sway * max(position.y, 0.0);
          transformed.z += cos(uTime*0.9 + instanceMatrix[3].z*0.4) * ${(strength * 0.6).toFixed(3)} * max(position.y, 0.0);
        #endif`);
  };
  material.customProgramCacheKey = () => 'faewood-wind-' + strength;
  material.needsUpdate = true;
  return material;
}
