import * as THREE from 'three';
import { randomSource } from './rendering.js';

// Animated atmosphere for the photoreal science-fiction region. The effect is
// deliberately a self-contained group: it does not change camera controls or
// assume a particular parent scene. Coordinates are local, with the vortex
// axis on +Z and the luminous aperture close to the origin.
const NOISE = `
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise21(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.)),f.x),f.y);}
float fbm2(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise21(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
`;

function makeStars(group, rng, count, radius, depth) {
  const positions = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    // A thick shell around the aperture leaves a clear, readable bright core.
    const angle = rng() * Math.PI * 2;
    const r = 4.8 + Math.pow(rng(), .72) * radius;
    const z = -depth * (.12 + rng() * .92);
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = Math.sin(angle) * r * (.68 + rng() * .4);
    positions[i * 3 + 2] = z;
    seed.set([angle, rng(), .35 + rng() * 1.4, .3 + rng() * 1.9], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -depth * .5), radius + depth);
  const material = new THREE.ShaderMaterial({
    name: 'scifi-vortex-stars', transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, uniforms: { time: { value: 0 }, ratio: { value: 1 } },
    vertexShader: `
      attribute vec4 aSeed; uniform float time; uniform float ratio;
      varying float vGlow;
      void main(){
        vec3 p=position; float r=length(p.xy); float a=atan(p.y,p.x);
        a+=time*(.006+aSeed.z*.010)+sin(time*.18+aSeed.x*4.0)*.035;
        r+=sin(time*(.18+aSeed.z*.08)+aSeed.y*12.0)*.035;
        p.xy=vec2(cos(a),sin(a))*r; p.z+=sin(time*.10+aSeed.y*15.0)*.12;
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
        float twinkle=.70+.30*sin(time*(2.0+aSeed.z)+aSeed.x*11.0);
        vGlow=twinkle*aSeed.w; gl_PointSize=clamp((.65+aSeed.w*1.8)*ratio*82.0/max(1.0,-mv.z),.55,4.8);
      }
    `,
    fragmentShader: `
      varying float vGlow;
      void main(){float d=length(gl_PointCoord-.5);float core=1.-smoothstep(.04,.48,d);float halo=1.-smoothstep(.20,.52,d);gl_FragColor=vec4(vec3(.72,.86,.90)*vGlow,core*.95+halo*.18);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'scifi-vortex-starfield'; points.frustumCulled = false; group.add(points);
  return { points, material, count };
}

function makeRibbon(group, rng, index, radius, depth) {
  const segments = 128;
  const width = .65 + rng() * 1.35;
  const baseAngle = rng() * Math.PI * 2;
  const twist = 2.5 + rng() * 2.8;
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const uvs = new Float32Array((segments + 1) * 2 * 2);
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const r = .8 + Math.pow(t, .78) * radius;
    const angle = baseAngle + t * twist + Math.sin(t * 8.2 + index) * .12;
    const centre = new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r * (.73 + .05 * Math.sin(index)), -t * depth);
    const side = new THREE.Vector3(-Math.sin(angle), Math.cos(angle) * (.73 + .05 * Math.sin(index)), 0).normalize();
    const localWidth = width * (.28 + .72 * t) * (.88 + .12 * Math.sin(t * 17. + index));
    for (let s = 0; s < 2; s++) {
      const p = centre.clone().addScaledVector(side, (s ? 1 : -1) * localWidth);
      const n = (i * 2 + s) * 3; positions[n] = p.x; positions[n + 1] = p.y; positions[n + 2] = p.z;
      const uv = (i * 2 + s) * 2; uvs[uv] = t; uvs[uv + 1] = s;
    }
    if (i < segments) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    name: 'scifi-energy-ribbon', side: THREE.DoubleSide, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, tint: { value: new THREE.Color(index % 3 ? 0x89c7bd : 0xa5d8e7) } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float; uniform float time; uniform vec3 tint; varying vec2 vUv; ${NOISE}
      void main(){float edge=smoothstep(0.,.18,vUv.y)*(1.-smoothstep(.82,1.,vUv.y));float flow=fbm2(vec2(vUv.x*5.-time*.10,vUv.y*3.+time*.035));float strands=smoothstep(.48,.74,flow)*(.45+.55*sin(vUv.x*64.-time*2.2+flow*4.)*.5+.5);float star=pow(max(0.,sin(vUv.x*190.+flow*9.-time*4.)),28.)*(.3+.7*flow);float alpha=edge*(.18+flow*.45+star*.62);vec3 color=tint*(.55+flow*1.05+star*2.8);gl_FragColor=vec4(color,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const ribbon = new THREE.Mesh(geometry, material); ribbon.name = `scifi-energy-ribbon-${index + 1}`; ribbon.renderOrder = 2; group.add(ribbon);
  return { material, count: (segments + 1) * 2 };
}

function makeAperture(group) {
  const geometry = new THREE.SphereGeometry(2.25, 48, 32);
  const material = new THREE.ShaderMaterial({
    name: 'scifi-wormhole-aperture', transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float; uniform float time; varying vec3 vNormal; varying vec3 vPosition; ${NOISE}
      void main(){float rim=pow(1.-abs(vNormal.z),2.7);float turbulence=fbm2(vPosition.xy*1.6+vec2(time*.12,-time*.08));float pulse=.75+.25*sin(time*1.8);vec3 color=mix(vec3(.10,.33,.36),vec3(.78,1.,.92),rim+turbulence*.35);float alpha=(.20+rim*.72+turbulence*.14)*pulse;gl_FragColor=vec4(color* (1.2+rim*2.1),alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const aperture = new THREE.Mesh(geometry, material); aperture.name = 'scifi-luminous-aperture'; aperture.position.z = -.18; group.add(aperture);
  const ringMaterial = new THREE.ShaderMaterial({
    name: 'scifi-aperture-ring', transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float time; varying vec2 vUv; void main(){float edge=smoothstep(.03,.22,vUv.y)*(1.-smoothstep(.78,1.,vUv.y));float pulse=.70+.30*sin(time*2.4+vUv.x*18.);gl_FragColor=vec4(.54,1.,.90,edge*pulse*.72);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.45, 128, 8), ringMaterial); ring.name = 'scifi-aperture-ring'; ring.position.z = .05; group.add(ring);
  return { materials: [material, ringMaterial], count: geometry.attributes.position.count + ring.geometry.attributes.position.count };
}

export function createSciFiEffects(group, options = {}) {
  const radius = options.radius ?? 28;
  const depth = options.depth ?? 24;
  const rng = randomSource(options.seed ?? 444);
  const starfield = makeStars(group, rng, options.starCount ?? 2600, radius, depth);
  const ribbons = [];
  const ribbonCount = options.ribbonCount ?? 8;
  for (let i = 0; i < ribbonCount; i++) ribbons.push(makeRibbon(group, rng, i, radius * (.72 + rng() * .32), depth * (.72 + rng() * .35)));
  const aperture = makeAperture(group);
  return {
    count: starfield.count + ribbons.reduce((sum, item) => sum + item.count, 0) + aperture.count,
    update(time, dpr = 1) {
      starfield.material.uniforms.time.value = time; starfield.material.uniforms.ratio.value = dpr;
      for (const ribbon of ribbons) ribbon.material.uniforms.time.value = time;
      for (const material of aperture.materials) material.uniforms.time.value = time;
    },
  };
}

// Alias kept for scene builders that use the existing build* naming pattern.
export const buildSciFiEffects = createSciFiEffects;
