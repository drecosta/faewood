import * as THREE from 'three';
import { BUBBLE_RADIUS } from './heightfield.js';
import { mulberry32, TAU, lerp } from '../core/utils.js';

export function buildBubble(scene, quality) {
  const group = new THREE.Group();
  group.name = 'bubble';
  scene.add(group);

  const shellMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide,
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vP; varying vec2 vUv;
      void main(){
        vUv = uv; vN = normalize(normalMatrix * normal);
        vec4 wp = modelMatrix * vec4(position,1.0);
        vP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; uniform float uNight; varying vec3 vN; varying vec3 vP; varying vec2 vUv;
      void main(){
        vec3 view = normalize(cameraPosition - vP);
        float fres = pow(1.0 - abs(dot(view, normalize(vN))), 2.4);
        float waves = sin(vUv.y*38.0 + uTime*0.25 + sin(vUv.x*20.0)*1.5)*0.5+0.5;
        float shimmer = sin(vUv.x*46.0 - uTime*0.18)*0.5+0.5;
        vec3 irid = mix(vec3(0.45,0.95,0.82), vec3(0.65,0.62,1.0), shimmer);
        irid = mix(irid, vec3(1.0,0.72,0.88), waves*0.4);
        float alpha = 0.045 + fres*0.3 + waves*0.018;
        alpha *= mix(0.75, 1.25, uNight);
        gl_FragColor = vec4(irid*(0.6+fres), alpha);
      }`,
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(BUBBLE_RADIUS, 40, 28), shellMat);
  shell.position.y = 12;
  group.add(shell);

  const rimMat = shellMat.clone();
  rimMat.uniforms = THREE.UniformsUtils.clone(shellMat.uniforms);
  rimMat.side = THREE.FrontSide;
  rimMat.blending = THREE.AdditiveBlending;
  const rim = new THREE.Mesh(shell.geometry, rimMat);
  rim.position.y = 12;
  rim.scale.setScalar(1.004);
  group.add(rim);

  const starGeo = new THREE.BufferGeometry();
  const rng = mulberry32(1234);
  const sp = [], ss = [];
  for (let i = 0; i < 260; i++) {
    const u = rng(), v = rng() * 0.72 + 0.14;
    const phi = u * TAU, theta = Math.acos(2 * v - 1);
    const r = BUBBLE_RADIUS - 1.5;
    sp.push(Math.sin(theta) * Math.cos(phi) * r, 12 + Math.cos(theta) * r, Math.sin(theta) * Math.sin(phi) * r);
    ss.push(0.5 + rng() * 1.4);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  starGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(ss, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    vertexShader: `
      attribute float aSize; varying float vTw; uniform float uTime;
      void main(){
        vTw = 0.6 + 0.4*sin(uTime*1.7 + position.x*0.4 + position.z);
        vec4 mv = modelViewMatrix*vec4(position,1.0);
        gl_PointSize = aSize * 3.5 * (60.0 / -mv.z);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying float vTw; uniform float uNight;
      void main(){
        float d = length(gl_PointCoord-0.5);
        float a = smoothstep(0.5,0.0,d)*vTw*uNight;
        gl_FragColor = vec4(vec3(0.85,0.95,1.0), a);
      }`,
  });
  group.add(new THREE.Points(starGeo, starMat));

  const count = quality.fireflies;
  const flyGeo = new THREE.BufferGeometry();
  const fp = [], fs = [], seed = [];
  for (let i = 0; i < count; i++) {
    const a = rng() * TAU, r = 4 + Math.sqrt(rng()) * 43;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    fp.push(x, 1.5 + rng() * 12, z);
    fs.push(0.7 + rng() * 1.6);
    seed.push(rng() * 100);
  }
  flyGeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  flyGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(fs, 1));
  flyGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  const flyMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    vertexShader: `
      attribute float aSize; attribute float aSeed; uniform float uTime; uniform float uNight;
      varying float vGlow;
      void main(){
        vec3 p = position;
        p.x += sin(uTime*0.42 + aSeed)*1.7;
        p.y += sin(uTime*0.67 + aSeed*1.7)*0.9;
        p.z += cos(uTime*0.37 + aSeed*0.8)*1.7;
        vGlow = (0.35 + 0.65*pow(0.5+0.5*sin(uTime*2.4+aSeed*3.0), 2.0)) * (0.5 + uNight*0.9);
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_PointSize = aSize * 15.0 * (28.0 / -mv.z);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying float vGlow;
      void main(){
        float d = length(gl_PointCoord-0.5);
        float glow = smoothstep(0.5,0.0,d);
        float core = smoothstep(0.16,0.0,d);
        vec3 col = mix(vec3(0.65,1.0,0.62), vec3(1.0,0.95,0.55), core);
        gl_FragColor = vec4(col, (glow*0.35+core*0.75)*vGlow);
      }`,
  });
  group.add(new THREE.Points(flyGeo, flyMat));

  const motesGeo = new THREE.BufferGeometry();
  const mp = [];
  for (let i = 0; i < Math.min(220, count * 2); i++) {
    const a = rng() * TAU, r = rng() * 46;
    mp.push(Math.cos(a) * r, 0.8 + rng() * 14, Math.sin(a) * r);
  }
  motesGeo.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
  const motes = new THREE.Points(motesGeo, new THREE.PointsMaterial({
    color: 0xfff1c4, size: 0.13, transparent: true, opacity: 0.38,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  group.add(motes);

  return {
    group,
    update(dt, elapsed, night) {
      shellMat.uniforms.uTime.value = elapsed;
      shellMat.uniforms.uNight.value = night;
      rimMat.uniforms.uTime.value = elapsed;
      rimMat.uniforms.uNight.value = night;
      starMat.uniforms.uTime.value = elapsed;
      starMat.uniforms.uNight.value = night;
      flyMat.uniforms.uTime.value = elapsed;
      flyMat.uniforms.uNight.value = night;
      motes.rotation.y = elapsed * 0.004;
    },
  };
}
