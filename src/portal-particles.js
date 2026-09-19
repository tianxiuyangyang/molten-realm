import * as THREE from 'three';
import { randomSource } from './rendering.js';

// Tiny solid voxels retain their depth when the gateway is viewed from the side.
// All trajectories run on the GPU; the scene needs one draw and one time update.
export function buildPortalParticles(group) {
  const count = 320;
  const rng = randomSource(734333);
  const seed = new Float32Array(count * 4);
  const shape = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const palettes = [
    [new THREE.Color(0xffad26), new THREE.Color(0xffe18b), new THREE.Color(0xff6b18)],
    [new THREE.Color(0x65dbff), new THREE.Color(0xa787ff), new THREE.Color(0xe778ff)],
    [new THREE.Color(0xffbf4b), new THREE.Color(0x96ebff), new THREE.Color(0xc49cff)],
  ];
  for (let i = 0; i < count; i++) {
    const type = i < 126 ? 0 : i < 290 ? 1 : 2;
    const width = type === 0 ? .045 + rng() * .055 : .045 + rng() * .06;
    const height = type === 2 ? .28 + rng() * .32 : width * (1.15 + rng() * 1.8);
    // Seed: lateral direction, individual variation, birth phase, inverse lifetime.
    seed.set([rng() * 2 - 1, rng(), rng(),
      type === 0 ? .20 + rng() * .22 : type === 1 ? .052 + rng() * .045 : .29 + rng() * .16], i * 4);
    shape.set([width, height, type, rng() * Math.PI * 2], i * 4);
    const color = palettes[type][Math.floor(rng() * 3)];
    colors.set([color.r, color.g, color.b], i * 3);
  }

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = cube.index;
  geometry.setAttribute('position', cube.getAttribute('position'));
  geometry.setAttribute('normal', cube.getAttribute('normal'));
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  geometry.setAttribute('aShape', new THREE.InstancedBufferAttribute(shape, 4));
  geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));
  geometry.instanceCount = count;
  // GPU displacement is not visible to Three's automatic geometry bounds.
  geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-6.5, 4.3, -.1), new THREE.Vector3(6.5, 23.1, .8));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 13.7, .35), 11.6);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `
      uniform float time;
      attribute vec4 aSeed;
      attribute vec4 aShape;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vFacet;

      // Expand only after a lower step; contract before an upper step. This
      // conservative smooth boundary avoids a sideways jump at each stone tier.
      float openingWidth(float y) {
        float width = 2.45;
        width += 1.45 * smoothstep(5.65, 6.18, y);
        width += 1.20 * smoothstep(7.25, 7.80, y);
        width += 1.05 * smoothstep(8.85, 9.40, y);
        width -= 1.10 * smoothstep(17.65, 18.35, y);
        width -= 1.35 * smoothstep(19.25, 19.95, y);
        width -= 1.70 * smoothstep(20.85, 21.55, y);
        return width;
      }

      void main() {
        float life = fract(time * aSeed.w + aSeed.z);
        float phase = aShape.w;
        float type = aShape.z;
        float x;
        float y;
        float z = .30 + sin(time * .70 + phase + life * 5.0) * .23;
        float stretch = 1.0;
        if (type < .5) {
          // A warm fountain spreads as it rises from the lower molten root.
          y = 4.58 + pow(life, .88) * (5.3 + aSeed.y * 1.0);
          x = aSeed.x * (.65 + life * 1.55);
          x += sin(life * 7.0 + phase + time * .8) * (.08 + life * .28);
        } else if (type < 1.5) {
          y = 4.72 + life * 17.84;
          // Each mote drifts around its own vertical helix inside the aperture.
          float radius = .30 + aSeed.y * .48;
          float angle = time * (.35 + aSeed.y * .3) + phase + life * 4.0;
          x = aSeed.x * (2.4 + sin(life * 3.141593) * 3.0) + sin(angle) * radius;
          z = .31 + cos(angle) * .26;
        } else {
          // Sparse faster streaks carry a readable upward surge through the field.
          y = 4.78 + pow(life, 1.28) * (12.0 + aSeed.y * 5.15);
          x = aSeed.x * (1.1 + life * 4.8) + sin(phase + life * 6.0) * .32;
          stretch = .70 + life * .65;
        }
        vec3 size = vec3(aShape.x, aShape.y * stretch, aShape.x * .8);
        float extent = size.y * .5 + .09;
        float halfWidth = min(openingWidth(y - extent), openingWidth(y + extent));
        x = clamp(x, -halfWidth + size.x, halfWidth - size.x);
        vec3 vertex = position * size;
        float tilt = sin(phase + time * .65) * .18;
        vertex.xy = mat2(cos(tilt), sin(tilt), -sin(tilt), cos(tilt)) * vertex.xy;
        vertex += vec3(x, y, z);
        float birth = smoothstep(.0, .085, life);
        float death = 1.0 - smoothstep(.76, 1.0, life);
        float shimmer = .78 + .22 * sin(time * (3.2 + aSeed.y * 2.8) + phase);
        vAlpha = birth * death * shimmer * (type < .5 ? .9 : .73);
        vColor = aColor * (type < .5 ? 3.2 : 2.7);
        vFacet = .62 + .30 * abs(normal.z) + .08 * max(normal.y, 0.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vFacet;
      void main() {
        gl_FragColor = vec4(vColor * vFacet, vAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const sparks = new THREE.Mesh(geometry, material);
  sparks.name = 'Animated portal voxel sparks';
  sparks.castShadow = false;
  sparks.receiveShadow = false;
  group.add(sparks);

  return {
    count,
    // World-sized cubes project naturally at every DPR, unlike fixed-pixel points.
    update(t, dpr) {
      material.uniforms.time.value = t;
    },
  };
}
