import * as THREE from 'three';
import { randomSource } from './rendering.js';

// A non-voxel, orbit-view science-fiction landscape. The root is intentionally
// self-contained so the parent scene can place this region at any world offset.
export function buildSciFiWorld(root, progress = () => {}) {
  const rng = randomSource(4440917);
  let objectCount = 0;
  const animated = [];

  progress('展开深空星幕与引力漩涡…', 14);
  root.add(new THREE.HemisphereLight(0x52697a, 0x03100c, 0.42));
  const fill = new THREE.DirectionalLight(0x7196a4, 0.46);
  fill.position.set(-80, 120, 70);
  fill.target.position.set(12, 0, -28);
  root.add(fill, fill.target);

  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 vDirection;
      void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;
      varying vec3 vDirection; uniform float time;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.04+vec2(9.1,4.7);a*=.5;}return v;}
      void main(){vec3 d=normalize(vDirection);float h=d.y;
        vec2 p=d.xz/(abs(h)+.32);float cloud=fbm(p*1.8+vec2(time*.001,-time*.0006));
        vec3 col=mix(vec3(.001,.004,.006),vec3(.004,.011,.015),smoothstep(-.35,.55,h));
        col+=vec3(.006,.018,.021)*smoothstep(.43,.85,cloud)*(1.-smoothstep(.15,.8,h));
        float haze=pow(max(0.,1.-abs(h)),5.); col+=vec3(.004,.012,.015)*haze;
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(620, 48, 32), skyMaterial);
  sky.name = 'sci-fi-deep-space-sky';
  root.add(sky);
  objectCount++;

  const starPositions = new Float32Array(2300 * 3);
  const starSizes = new Float32Array(2300);
  const starPhases = new Float32Array(2300);
  for (let i = 0; i < 2300; i++) {
    const radius = 190 + rng() * 270;
    const azimuth = rng() * Math.PI * 2;
    const elevation = Math.asin(rng() * 1.6 - .8);
    starPositions[i * 3] = Math.cos(azimuth) * Math.cos(elevation) * radius;
    starPositions[i * 3 + 1] = Math.sin(elevation) * radius;
    starPositions[i * 3 + 2] = Math.sin(azimuth) * Math.cos(elevation) * radius;
    starSizes[i] = .45 + rng() * 2.1;
    starPhases[i] = rng() * 6.28;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  starGeometry.setAttribute('phase', new THREE.BufferAttribute(starPhases, 1));
  const starMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, ratio: { value: 1 } },
    vertexShader: `attribute float size;attribute float phase;uniform float time;uniform float ratio;
      varying float vPulse;void main(){vec3 p=position;float pulse=sin(time*.35+phase)*.18;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp((size+pulse)*ratio*120./max(1.,-mv.z),.45,4.);vPulse=pulse;}`,
    fragmentShader: `varying float vPulse;void main(){float d=length(gl_PointCoord-.5);
      float a=1.-smoothstep(.08,.5,d);vec3 c=mix(vec3(.32,.62,.68),vec3(1.,.97,.82),.55+vPulse);
      gl_FragColor=vec4(c,a*.82);}`,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.name = 'sci-fi-starfield';
  stars.frustumCulled = false;
  root.add(stars);
  objectCount += 2300;

  progress('编织螺旋星流与白色汇聚核心…', 34);
  const core = new THREE.Vector3(42, 16, -72);
  const vortex = new THREE.Group();
  vortex.name = 'gravitational-vortex';
  vortex.position.copy(core);
  root.add(vortex);

  const darkRibbon = new THREE.MeshStandardMaterial({
    color: 0x102326, emissive: 0x0b2528, emissiveIntensity: 1.55,
    roughness: .58, metalness: .25, transparent: true, opacity: .40,
    depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const cyanRibbon = new THREE.MeshStandardMaterial({
    color: 0x9abeb8, emissive: 0x2f8582, emissiveIntensity: 2.15,
    roughness: .43, metalness: .18, transparent: true, opacity: .64,
    depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const spiralPoint = (strand, t) => {
    const angle = t * Math.PI * 8.4 + strand * Math.PI * 2 / 12;
    const radius = 2.2 + Math.pow(t, .79) * 76;
    return new THREE.Vector3(
      Math.cos(angle) * radius * 1.12,
      Math.sin(angle) * radius * .52,
      -t * 104 - 2,
    );
  };
  for (let strand = 0; strand < 12; strand++) {
    const points = [];
    for (let j = 0; j <= 150; j++) points.push(spiralPoint(strand, j / 150));
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 150, .38 + (strand % 3) * .13, 7, false);
    const ribbon = new THREE.Mesh(geometry, strand % 3 === 0 ? cyanRibbon : darkRibbon);
    ribbon.name = `vortex-ribbon-${strand}`;
    ribbon.rotation.y = -.17;
    vortex.add(ribbon);
    animated.push({ object: ribbon, phase: strand * .23, base: ribbon.rotation.z });
    objectCount += 150;
  }
  // Concentric luminous arcs make the funnel read at a distance while the
  // tube strands preserve real volume when the camera orbits around it.
  for (let ring = 0; ring < 9; ring++) {
    const radius = 8 + ring * 8.7;
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(radius, .12 + ring * .018, 8, 100),
      ring % 2 ? darkRibbon : cyanRibbon,
    );
    torus.name = `vortex-ring-${ring}`;
    torus.rotation.x = -.15 + ring * .008;
    torus.rotation.y = .12;
      torus.position.z = -ring * 9.2;
    torus.scale.y = .57;
    vortex.add(torus);
    animated.push({ object: torus, phase: ring * .31, base: torus.rotation.z });
    objectCount++;
  }

  const coreMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;uniform float time;varying vec3 vNormal;
      void main(){float rim=pow(1.-max(0.,dot(vNormal,vec3(0.,0.,1.))),2.2);
      float pulse=.78+.22*sin(time*2.4);vec3 col=mix(vec3(1.,.73,.33),vec3(1.,1.,.94),rim*.8+.25);
      gl_FragColor=vec4(col*pulse,.72+rim*.25);}`,
  });
  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(4.8, 48, 32), coreMaterial);
  coreSphere.name = 'vortex-white-core';
  vortex.add(coreSphere);
  const coreHalo = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xdaf3dc, transparent: true, opacity: .065, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  vortex.add(coreHalo);
  const coreLight = new THREE.PointLight(0xd9fff1, 260, 150, 2);
  coreLight.position.copy(core);
  root.add(coreLight);
  objectCount += 3;

  const flowMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv;varying vec3 vPos;void main(){vUv=uv;vPos=position;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;uniform float time;varying vec2 vUv;varying vec3 vPos;
      float hash(vec2 p){return fract(sin(dot(p,vec2(41.7,113.1)))*43758.5);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
      float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.05+7.3;a*=.5;}return v;}
      void main(){vec2 p=vPos.xz*.045;float n=fbm(p+vec2(time*.018,-time*.011));
        float ribbon=abs(sin(p.x*2.2+n*5.1+time*.08)*sin(p.y*1.4-n*4.));
        float current=1.-smoothstep(.08,.34,ribbon);float pools=smoothstep(.46,.75,n);
        vec3 col=mix(vec3(.005,.028,.018),vec3(.018,.135,.068),pools);
        col+=vec3(.028,.32,.15)*current;col+=vec3(.012,.095,.052)*n;
        float edge=smoothstep(.0,.12,vUv.y)*smoothstep(1.,.85,vUv.y);gl_FragColor=vec4(col*edge,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const terrainGeometry = new THREE.PlaneGeometry(270, 225, 150, 124);
  const terrainPos = terrainGeometry.attributes.position;
  for (let i = 0; i < terrainPos.count; i++) {
    const x = terrainPos.getX(i), z = terrainPos.getY(i);
    const y = -7 + Math.sin(x * .038) * 1.15 + Math.sin(z * .058 + x * .021) * .72 + Math.sin((x + z) * .11) * .28;
    terrainPos.setZ(i, y);
  }
  terrainGeometry.rotateX(-Math.PI / 2);
  terrainGeometry.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeometry, flowMaterial);
  terrain.name = 'green-fluid-dunes';
  terrain.position.set(0, 0, 8);
  root.add(terrain);
  objectCount += terrainPos.count;

  const poolMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x103f2a, emissive: 0x073c20, emissiveIntensity: .55,
    roughness: .28, metalness: .35, clearcoat: .8, clearcoatRoughness: .16,
    transparent: true, opacity: .84,
  });
  for (let i = 0; i < 14; i++) {
    const x = (rng() - .5) * 176, z = -72 + rng() * 155;
    const pool = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), poolMaterial);
    pool.scale.set(3.8 + rng() * 8, .09 + rng() * .1, 1.3 + rng() * 3.6);
    pool.position.set(x, -5.95 + rng() * .2, z);
    pool.rotation.y = rng() * Math.PI;
    root.add(pool);
    objectCount++;
  }

  progress('铺设绿色流体地貌与反射水面…', 62);
  const duneMaterial = new THREE.MeshStandardMaterial({
    color: 0x153f31, emissive: 0x0a281b, emissiveIntensity: .48,
    roughness: .52, metalness: .18, transparent: true, opacity: .78,
  });
  for (let i = 0; i < 10; i++) {
    const points = [];
    const z = -72 + i * 18;
    for (let j = 0; j <= 22; j++) {
      const x = -128 + j * 11.6;
      points.push(new THREE.Vector3(x, -5.2 + Math.sin(j * .67 + i) * .55 + i * .025, z + Math.sin(j * .43 + i) * 3.2));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const band = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 1.05 + (i % 3) * .24, 8, false), duneMaterial);
    band.name = `fluid-current-${i}`;
    root.add(band);
    animated.push({ object: band, phase: i * .48, base: 0 });
    objectCount += 80;
  }

  progress('安装远景信标与尺度参照…', 78);
  const metal = new THREE.MeshStandardMaterial({ color: 0x152025, metalness: .88, roughness: .31 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x6e9c94, emissive: 0x1d7060, emissiveIntensity: 2.1, metalness: .58, roughness: .25 });
  function pylon(x, z, height, turn) {
    const group = new THREE.Group();
    group.position.set(x, -5.2, z);
    group.rotation.y = turn;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.9, 1.2, 6), metal);
    base.position.y = .6;group.add(base);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.9, height, 6), metal);
    shaft.position.y = height / 2 + 1.1;group.add(shaft);
    for (const y of [2.2, height * .52, height - 1.1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, .12, 6, 24), trim);
      ring.rotation.x = Math.PI / 2;ring.position.y = y;group.add(ring);
    }
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(.78, 1), trim);
    beacon.position.y = height + 1.25;group.add(beacon);
    root.add(group);objectCount += 6;
  }
  pylon(-68, -30, 16, -.18);pylon(83, -13, 23, .24);pylon(-18, -92, 11, .55);

  const explorer = new THREE.Group();
  explorer.position.set(7, -4.9, -24);
  const suit = new THREE.MeshStandardMaterial({ color: 0x111a1c, metalness: .5, roughness: .62 });
  const visor = new THREE.MeshStandardMaterial({ color: 0x7ce7d8, emissive: 0x2cc6ae, emissiveIntensity: 2.8, metalness: .35, roughness: .17 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.33, .43, 1.05, 8), suit);body.position.y = .6;explorer.add(body);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.32, 16, 12), suit);helmet.position.y = 1.3;explorer.add(helmet);
  const face = new THREE.Mesh(new THREE.SphereGeometry(.24, 12, 8), visor);face.scale.set(.72, .42, .18);face.position.set(0, 1.31, .25);explorer.add(face);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(.34, .56, .16), suit);pack.position.set(0, .65, -.31);explorer.add(pack);
  root.add(explorer);objectCount += 4;

  return {
    blockCount: objectCount,
    update(time, dpr = 1) {
      skyMaterial.uniforms.time.value = time;
      starMaterial.uniforms.time.value = time;
      starMaterial.uniforms.ratio.value = dpr;
      coreMaterial.uniforms.time.value = time;
      flowMaterial.uniforms.time.value = time;
      vortex.rotation.y = Math.sin(time * .022) * .035;
      vortex.rotation.z = Math.sin(time * .017) * .018;
      for (const item of animated) {
        item.object.rotation.z = item.base + Math.sin(time * .17 + item.phase) * .018;
      }
      coreSphere.scale.setScalar(.96 + Math.sin(time * 2.2) * .035);
      coreLight.intensity = 240 + Math.sin(time * 2.2) * 28;
    },
  };
}
