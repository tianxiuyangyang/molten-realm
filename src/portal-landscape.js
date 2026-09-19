import * as THREE from 'three';
import { Blocks, materials, randomSource, noise } from './rendering.js';

// Everything is expressed in the portal area's local coordinates. The area can
// be moved as one group without changing the shape or animation of its rivers.
function moltenMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `
      varying vec2 vGround; varying float vDepth;
      void main(){
        vGround=position.xz;
        vec4 view=modelViewMatrix*vec4(position,1.);
        vDepth=-view.z;
        gl_Position=projectionMatrix*view;
      }`,
    fragmentShader: `
      precision highp float;
      uniform float time; varying vec2 vGround; varying float vDepth;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
      float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.02+5.7;a*=.5;}return s;}
      void main(){
        vec2 p=vGround*.65;
        p+=vec2(fbm(p*.34+time*.022),fbm(p*.31-time*.031))*.84;
        vec2 q=floor(p*10.)/10.;
        float island=fbm(q*1.8+vec2(time*.025,-time*.045));
        float ribbon=abs(sin(q.x*3.4+fbm(q*.8)*8.+time*.11)*sin(q.y*2.9+fbm(q*.67+8.)*7.));
        float crack=1.-smoothstep(.035,.14,ribbon);
        float crust=smoothstep(.51,.73,island)*(1.-crack);
        vec3 molten=mix(vec3(2.0,.12,.001),vec3(3.3,1.0,.015),crack);
        molten+=vec3(.31,.052,.001)*smoothstep(.38,.62,fbm(q*7.));
        vec3 col=mix(molten,vec3(.32,.015,.018),crust*.82);
        float fleck=step(.89,hash(floor(q*9.+time*.017)));
        col+=fleck*vec3(.34,.08,.003);
        col=mix(col,vec3(.23,.027,.043),smoothstep(48.,135.,vDepth)*.73);
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function buildPortalLandscape(group) {
  const rng = randomSource(3330919);
  const mats = materials();
  const material = (source, color, extra = {}) => {
    const result = mats[source].clone();
    result.color.setHex(color);
    Object.assign(result, extra);
    return result;
  };
  mats.basalt = material('rock', 0x29232e, { roughness: .92, metalness: .12 });
  mats.cliff = material('rock', 0x5a4f5c, { roughness: .96, bumpScale: .29 });
  mats.rearCliff = material('rock', 0x302630, { roughness: .97, bumpScale: .24 });
  mats.mineral = material('stone', 0x8d8090, { roughness: .91, bumpScale: .19 });
  mats.ash = material('rock', 0x34222b, { roughness: .99 });
  mats.paving = material('stone', 0x504452, { roughness: .83, metalness: .18 });
  mats.pavingGrain = material('stone', 0x716978, { roughness: .92, metalness: .12 });
  mats.cap = material('red', 0xb81529, { roughness: .79, bumpScale: .09 });
  mats.capLight = material('red', 0xe52939, { roughness: .74, bumpScale: .1 });
  mats.capDark = material('red', 0x720c24, { roughness: .92 });
  mats.ivory = material('stone', 0xe5cdb7, { roughness: .86, metalness: 0 });
  mats.spot = material('stone', 0xf4d8d3, { roughness: .79, metalness: 0 });
  mats.gill = material('stem', 0x864851, { roughness: .94 });
  mats.stemMark = material('stone', 0x694553, { roughness: .97, metalness: 0 });
  mats.grass = material('red', 0xbd0b2a, { roughness: .95 });
  mats.grassLight = material('red', 0xef2635, { roughness: .93 });
  mats.violetOre = material('rock', 0x754875, { roughness: .69, metalness: .27 });
  mats.violetFacet = material('stone', 0xa569b7, { roughness: .61, metalness: .28 });
  mats.violetCore = new THREE.MeshStandardMaterial({ color: 0xb860ef, emissive: 0x9224ff, emissiveIntensity: 2.4, roughness: .4 });
  mats.lampCore = new THREE.MeshStandardMaterial({ color: 0xffef96, emissive: 0xffa012, emissiveIntensity: 5.4, roughness: .28 });
  mats.violetLamp = new THREE.MeshStandardMaterial({ color: 0xe4baff, emissive: 0xb532ff, emissiveIntensity: 5.6, roughness: .3 });
  mats.iron = material('dark', 0x34212c, { roughness: .59, metalness: .67 });
  mats.redFragment = material('red', 0xd22726, { emissive: new THREE.Color(0xc2180a), emissiveIntensity: 1.15, roughness: .78 });
  const blocks = new Blocks(group, mats);
  const B = (k, x, y, z, w, h, d, c = .7 + rng() * .55, angle = 0, bevel = false) => blocks.add(k, x, y, z, w, h, d, c, angle, bevel);

  function riverCenter(z, side) {
    const bend = side > 0 ? .7 : -1.2;
    return side * (9.6 + Math.max(0, 49 - z) * .108 + Math.sin(z * .115 + bend) * 2.3 + (side > 0 ? .7 * Math.sin(z * .22) : 0));
  }
  function riverWidth(z, side) { return 4.9 + Math.sin(z * .16 + side) * .8; }
  function lavaAt(x, z, margin = 0) {
    return [-1, 1].some(side => Math.abs(x - riverCenter(z, side)) < riverWidth(z, side) / 2 + margin);
  }
  function groundHeight(x, z) {
    const outer = Math.max(0, Math.abs(x) - 15);
    return Math.floor((noise(x * .31, z * .32) * .8 + outer * .035 + .4) / .5) * .5;
  }
  function gateClearance(x, z) { return Math.abs(x) < 20 && z > -9 && z < 15; }

  // The incandescent rivers have real winding banks, below the raised basalt
  // terraces. Overlapping bank blocks give the river edges their voxel steps.
  const lava = moltenMaterial();
  for (const side of [-1, 1]) {
    const vertices = [], uv = [], indices = [];
    const rows = 118;
    for (let i = 0; i <= rows; i++) {
      const z = 65 - i * 1.15;
      const center = riverCenter(z, side), width = riverWidth(z, side) + 1.8;
      for (const edge of [-1, 1]) {
        vertices.push(center + edge * width / 2, -.72, z);
        uv.push((edge + 1) / 2, i / rows);
      }
      if (i < rows) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const river = new THREE.Mesh(geometry, lava);
    river.name = `portal-lava-river-${side}`;
    group.add(river);
  }
  B('basalt', 0, -5.2, -3, 120, 6, 150, .65);
  const grid = 2.1;
  for (let x = -48; x <= 48; x += grid) {
    for (let z = -64; z <= 62; z += grid) {
      if (lavaAt(x, z, -.18)) continue;
      const y = groundHeight(x, z);
      const top = Math.abs(x) < 6.4 && z > 14 ? -.32 : y;
      B('basalt', x, top - 1.3, z, grid + .06, 2.6, grid + .06, .53 + rng() * .52);
      B('ash', x, top - .13, z, grid - .025, .28, grid - .025, .7 + rng() * .44);
      if (lavaAt(x, z, 1.5)) {
        B('ore', x + (rng() - .5), top - .62, z + (rng() - .5), 1.0, .8, 1.05, .7);
        if (rng() < .36) B('magma', x + (rng() - .5) * 1.7, top - .76, z + (rng() - .5) * 1.5, .16, .31, .22, .54);
      }
      if (rng() < .09 && !gateClearance(x, z) && Math.abs(x) > 7) B('basalt', x + .3, top + .35, z - .2, .8 + rng() * .7, .7, .8 + rng() * .7, .64);
    }
  }

  // Irregular masonry and recessed glowing faults lead the eye to the gate.
  for (let z = 16; z < 63;) {
    const depth = 1.12 + rng() * .85;
    const half = 4.65 + (z - 16) * .028;
    let x = -half;
    while (x < half - .2) {
      const width = Math.min(1.0 + rng() * 1.9, half - x);
      const top = .24 + rng() * .07;
      B('paving', x + width / 2, top - .2, z + depth / 2, width - .065, .41, depth - .065, .67 + rng() * .46, (rng() - .5) * .025, true);
      if (rng() < .28) B('basalt', x + width / 2 + .1, top + .012, z + depth * .7, width * .42, .025, .12, .49);
      if (rng() < .22) B('magma', x + width, .13, z + depth * .6, .034, .035, depth * .67, .48);
      if (rng() < .2) B('ember', x + width * .6, .16, z + depth, width * .53, .032, .04, .42);
      if (z < 60) {
        const fragments = 3 + Math.floor(rng() * 6);
        for (let fragment = 0; fragment < fragments; fragment++) {
          const patchX = x + .09 + rng() * Math.max(.05, width - .26);
          const patchZ = z + .12 + rng() * Math.max(.05, depth - .29);
          const patchW = Math.min(width * .37, .10 + rng() * .30);
          const patchD = .038 + rng() * .095;
          B(rng() < .27 ? 'basalt' : 'pavingGrain', patchX, top + .009, patchZ, patchW, .025 + rng() * .016, patchD, .32 + rng() * .50, (rng() - .5) * .23);
          if (rng() < .22) B('magma', patchX + patchW * .38, top + .022, patchZ + patchD * .45, .035 + rng() * .067, .021, .045 + rng() * .09, .22 + rng() * .22);
        }
      }
      x += width;
    }
    for (const side of [-1, 1]) {
      B('basalt', side * (half + .37), -.14, z + depth / 2, .67, .83, depth - .08, .62, 0, true);
      if (rng() < .31) B('magma', side * (half + .71), -.39, z + .3, .033, .21, .38, .47);
    }
    z += depth;
  }

  function mushroom(x, z, radius, height, base = groundHeight(x, z), dark = false) {
    const cell = Math.max(.32, radius / 13.0);
    const stemW = radius * .38;
    const stemH = height;
    // Slightly tapering square stems retain the reference's Minecraft-like
    // silhouette; the patchwork is separate inset bark geometry.
    const stemStep = Math.max(.48, radius * .095);
    for (let y = 0; y < stemH; y += stemStep) {
      const width = stemW * (1.02 - .2 * y / stemH);
      B(dark ? 'stemMark' : 'ivory', x + Math.sin(y * .3) * .10, base + y + stemStep / 2, z, width, stemStep + .015, width, .64 + rng() * .49);
      for (const side of [-1, 1]) {
        if (rng() < .57) B('stemMark', x + (rng() - .5) * width * .7, base + y + .15, z + side * (width / 2 + .012), width * (.12 + rng() * .23), stemStep * (.17 + rng() * .37), .035, .63 + rng() * .35);
        if (rng() < .38) B('stemMark', x + side * (width / 2 + .012), base + y + .12, z + (rng() - .5) * width * .6, .035, stemStep * .27, width * .24, .73);
        if (radius > 3) for (let patch = 0; patch < 3; patch++) {
          const sw = width * (.075 + rng() * .11), sh = stemStep * (.18 + rng() * .2);
          B(rng() < .6 ? 'gill' : 'stemMark', x + (rng() - .5) * width * .84, base + y + rng() * stemStep, z + side * (width / 2 + .025), sw, sh, .045, .43 + rng() * .5);
          B(rng() < .65 ? 'gill' : 'ivory', x + side * (width / 2 + .025), base + y + rng() * stemStep, z + (rng() - .5) * width * .84, .045, sh, sw, .42 + rng() * .56);
        }
      }
    }
    B(dark ? 'stemMark' : 'ivory', x, base + .23, z, stemW * 1.23, .46, stemW * 1.18, .74);
    const patches = [];
    for (let i = 0; i < 10; i++) {
      const a = i * 2.399 + radius, r = radius * (.26 + rng() * .64);
      patches.push([Math.cos(a) * r, Math.sin(a) * r, radius * (.095 + rng() * .075)]);
    }
    const dome = radius * .37;
    for (let ix = -Math.ceil(radius / cell); ix <= Math.ceil(radius / cell); ix++) {
      for (let iz = -Math.ceil(radius / cell); iz <= Math.ceil(radius / cell); iz++) {
        const dx = ix * cell, dz = iz * cell;
        const distance = Math.hypot(dx, dz) / radius;
        if (distance > 1 + noise(dx * 2, dz * 2) * .013) continue;
        const rise = Math.floor(Math.pow(Math.max(0, 1 - distance * distance), .68) * dome / (cell * .47)) * cell * .47;
        const bottom = base + height - cell * .26;
        const thickness = .48 + rise;
        const top = bottom + thickness;
        const capKind = dark ? 'capDark' : rng() < .27 ? 'capLight' : rng() < .2 ? 'capDark' : 'cap';
        B(capKind, x + dx, bottom + thickness / 2, z + dz, cell + .01, thickness, cell + .01, .42 + rng() * .88);
        const patch = !dark && patches.some(([px, pz, pr]) => Math.abs(dx - px) + Math.abs(dz - pz) * .87 < pr * 1.3);
        if (patch) B('spot', x + dx, top + .022, z + dz, cell + .015, .085, cell + .015, .77 + rng() * .3);
        else if (rng() < .66) B(dark ? (rng() < .6 ? 'capDark' : 'cap') : (rng() < .53 ? 'capLight' : 'capDark'), x + dx + cell * .12, top + .025, z + dz - cell * .1, cell * .47, .06, cell * .43, .36 + rng() * .72);
        if (distance > .82 && distance < .99) {
          B('gill', x + dx, bottom - .065, z + dz, cell * .86, .09, cell * .86, .56 + rng() * .27);
          if (!dark && patch && distance > .92) B('spot', x + dx, bottom + thickness * .66, z + dz, cell * 1.015, Math.min(thickness * .41, cell * .62), cell * 1.015, .74);
          if (distance > .93 && rng() < .62) {
            const front = dz >= 0 ? 1 : -1;
            B(rng() < .5 ? 'capDark' : 'capLight', x + dx, bottom + thickness * (.3 + rng() * .5), z + dz + front * cell * .505, cell * .41, cell * .33, .035, .41 + rng() * .66);
          }
        }
      }
    }
    // A stepped ring under the cap catches the orange light from the ground.
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      B('gill', x + Math.cos(a) * stemW * .49, base + height - .18, z + Math.sin(a) * stemW * .49, stemW * .43, .29, stemW * .43, .64);
    }
  }
  // Large left and right caps frame the doorway without crossing its opening.
  mushroom(-23.2, 26.2, 6.1, 10.5);
  mushroom(21.6, 20.5, 6.3, 12.4);
  // The foreground fungus grows from a short extension of the river bank.
  B('basalt', 11.4, groundHeight(11.1, 34) - .64, 34, 3.35, 1.28, 3.05, .72);
  B('ash', 11.4, groundHeight(11.1, 34) - .06, 34, 3.31, .14, 3.0, .84);
  mushroom(11.1, 34, 3.9, 3.3);
  mushroom(-19.4, 7.3, 3.45, 5.4);
  mushroom(25.8, 4, 3.15, 4.75);
  mushroom(-27.6, -3, 5.9, 8.7, groundHeight(-27.6, -3), true);
  mushroom(28, -14.5, 7.1, 11.9, groundHeight(28, -14.5), true);
  mushroom(-34.2, 13, 7.2, 13.0, groundHeight(-34.2, 13), true);
  mushroom(-24.3, -22, 4.9, 8.4, groundHeight(-24.3, -22), true);
  mushroom(36, -34, 4.6, 8.1, groundHeight(36, -34), true);
  for (const [x, z, r, h] of [[-14, -10, 1.9, 3.3], [18.4, -12, 2.5, 4], [-31, 34, 2.6, 3.3], [29, 30, 2.3, 3.8], [18, 8, 1.65, 2.5], [-23, 40, 1.7, 2.4], [31, -6, 2.2, 3.7], [-35, -29, 2.4, 4], [23, -32, 2.1, 3.5], [-17, 21, 1.5, 2.4], [30, 45, 2.0, 2.8]]) mushroom(x, z, r, h);

  function tuft(x, y, z, size = 1, bright = false) {
    const count = 5 + Math.floor(rng() * 7);
    for (let j = 0; j < count; j++) {
      const dx = (rng() - .5) * size * .95, dz = (rng() - .5) * size * .85;
      const h = size * (.24 + rng() * .75);
      const w = size * (.095 + rng() * .09);
      B(bright || rng() < .2 ? 'grassLight' : 'grass', x + dx, y + h / 2, z + dz, w, h, w, .52 + rng() * .65);
      if (j % 3 === 0) B('grass', x + dx + w * .75, y + h * .49, z + dz, w * 1.8, w * .85, w, .66);
    }
  }
  // Dense clumps are concentrated on the banks, leaving the paving legible.
  for (let i = 0; i < 1550; i++) {
    const x = (rng() - .5) * 85, z = -43 + rng() * 104;
    if (lavaAt(x, z, .5) || gateClearance(x, z) || (Math.abs(x) < 7.3 && z > 14)) continue;
    if (Math.abs(x) > 34 && rng() < .56) continue;
    const y = groundHeight(x, z) + .03;
    tuft(x, y, z, .5 + rng() * .8, rng() < .14);
  }
  for (const side of [-1, 1]) {
    for (let z = 20; z < 59; z += 3.2) {
      const x = side * (5.8 + (z - 16) * .028 + rng() * .65);
      if (!lavaAt(x, z, .1)) tuft(x, groundHeight(x, z) + .04, z, .9 + rng() * .9, true);
    }
  }

  function oreCluster(x, z, radius = 1.4, purple = true) {
    const y = groundHeight(x, z), cell = radius / 3.4;
    for (let dx = -radius; dx <= radius; dx += cell) {
      for (let dz = -radius; dz <= radius; dz += cell) {
        const rr = (dx * dx + dz * dz) / (radius * radius);
        if (rr > 1) continue;
        const h = Math.ceil(Math.sqrt(1 - rr) * radius * 1.65 / cell) * cell;
        B(purple ? 'violetOre' : 'capDark', x + dx, y + h / 2, z + dz, cell * .98, h, cell * .98, .50 + rng() * .62);
        if (rng() < .62) B(purple ? 'violetFacet' : 'grassLight', x + dx, y + h + .03, z + dz, cell * .88, cell * .30, cell * .86, .67 + rng() * .52);
        if (purple && rng() < .055) B('violetCore', x + dx, y + h + .11, z + dz, cell * .55, .06, cell * .52, .4);
      }
    }
  }
  for (const [x, z, r] of [[-12.8, 39.4, 1.55], [-17.7, 29.5, 1.45], [-11.5, 24.5, 1.35], [15, 29.8, 1.5], [12.7, 17, 1.2], [22.6, 36, 1.7], [-24.7, 16.3, 1.05], [23, -1, 1.1], [-26, -12, 1], [28, 14, .9]]) oreCluster(x, z, r);
  for (const [x, z, r] of [[-8.8, 21, .9], [10.1, 18, .8], [16.4, 10, 1], [-20, 36, 1.1], [23, 29, .9], [-23, 14, 1.0], [33, 40, 1.1]]) oreCluster(x, z, r, false);

  const lanternLights = [];
  function lantern(x, z, purple = false, scale = 1) {
    const base = groundHeight(x, z), h = (purple ? 2.65 : 2.05) * scale;
    const w = .8 * scale, center = base + h;
    B('iron', x, base + h * .47, z, .18 * scale, h * .94, .18 * scale, .85, 0, true);
    B('basalt', x, base + .12, z, .66 * scale, .24, .66 * scale, .75, 0, true);
    B(purple ? 'violetLamp' : 'lampCore', x, center, z, w * .74, w * .90, w * .74, .85);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) B(purple ? 'violetOre' : 'iron', x + dx * w * .43, center, z + dz * w * .43, w * .14, w * 1.04, w * .14, .88, 0, true);
    B(purple ? 'violetFacet' : 'iron', x, center - w * .5, z, w * 1.13, w * .15, w * 1.13, .85, 0, true);
    B(purple ? 'violetFacet' : 'iron', x, center + w * .52, z, w * 1.17, w * .17, w * 1.17, .83, 0, true);
    B(purple ? 'violetOre' : 'iron', x, center + w * .71, z, w * .64, w * .25, w * .64, .8, 0, true);
    B(purple ? 'violetFacet' : 'iron', x, center + w * .89, z, w * .28, w * .15, w * .28, .85);
    if (z > 10 && lanternLights.length < 2) {
      const light = new THREE.PointLight(purple ? 0xac46ff : 0xff740d, purple ? 5 : 7, 6.5 * scale, 1.7);
      light.position.set(x, center, z);
      group.add(light);
      lanternLights.push(light);
    }
  }
  for (const [x, z, purple, s] of [[-12.7, 32, false, 1.08], [12.3, 29, false, 1.1], [-16.8, 20, true, 1], [22.5, 29.5, true, 1.05], [-22, 3, false, .8], [21, 1, false, .8], [-27, -14, true, .7], [27, -11, true, .8], [25, 16, false, .85], [-29, 28, false, .8], [-18, -22, false, .65], [18.5, -25, true, .65]]) lantern(x, z, purple, s);

  // Basalt cliffs are made of broad interlocking columns and rough square
  // faces. Their overhangs and jagged tops form silhouettes behind the fungi.
  for (const side of [-1, 1]) {
    for (let z = -69; z <= 28; z += 3.0) {
      const inner = 38 + noise(z * .19, side * 7) * 4;
      const height = 24 + noise(z * .15, side * 13) * 9 + (z > 8 ? 4 : 0);
      const width = 5.1 + rng() * 3;
      const bottom = z > -12 ? 4 + rng() * 5 : 0;
      B('cliff', side * (inner + width / 2), (height + bottom) / 2, z, width, height - bottom, 3.12, .49 + rng() * .35);
      for (let y = bottom + 1; y < height; y += 1.7) {
        const face = inner + (rng() - .5) * 2;
        const faceWidth = 1.8 + rng() * 1.9, faceDepth = 2.65 + rng() * .55, faceZ = z + (rng() - .5) * .5;
        B(rng() < .28 ? 'basalt' : 'cliff', side * face, y, faceZ, faceWidth, 1.6 + rng() * .6, faceDepth, .46 + rng() * .56);
        if (rng() < .6) B('basalt', side * (face - 1.15), y - .15, z + .35, .8, .7, .85, .53 + rng() * .48);
        if (z > -35) for (let grain = 0; grain < 8; grain++) {
          const grainY = y - .65 + Math.floor(grain / 3) * .45 + rng() * .17;
          const grainZ = faceZ - .9 + (grain % 3) * .61;
          B(rng() < .68 ? 'mineral' : 'cliff', side * (face - faceWidth / 2 - .025), grainY, grainZ, .11, .25 + rng() * .24, .30 + rng() * .24, .49 + rng() * .6);
          if (grain % 3 === 0) B('mineral', side * (face - .38 + rng() * .9), grainY, faceZ + faceDepth / 2 + .018, .3 + rng() * .3, .26 + rng() * .3, .08, .46 + rng() * .55);
        }
      }
      if (rng() < .55) {
        const toothH = 3 + rng() * 7;
        B('basalt', side * (inner + 2), height + toothH / 2, z - .5, 2.2 + rng() * 2.4, toothH, 2.5, .40 + rng() * .25);
        if (rng() < .5) B('basalt', side * (inner + 2.5), height + toothH + 1.0, z - .7, .67, 2.2, .74, .5);
      }
      if (z > -3 && rng() < .62) {
        // Downward stepped teeth beneath the near overhangs.
        for (let j = 0; j < 4; j++) B('cliff', side * (inner + .6), bottom - j * 1.4, z, 2.8 - j * .42, 1.5, 2.6 - j * .35, .52);
      }
    }
  }
  for (let x = -78; x <= 78; x += 3.3) {
    const height = 16 + Math.abs(noise(x * .11, 14)) * 16;
    B('rearCliff', x, height / 2 - 3, -73 - rng() * 7, 3.5, height + 6, 8, .30 + rng() * .27);
    if (rng() < .26) B('basalt', x, height + 1, -74, 1.1, 4 + rng() * 5, 1.3, .41);
  }
  for (const [x, z, h, w] of [[-54, -18, 47, 7], [58, -11, 44, 9], [-48, -51, 38, 8], [42, -55, 36, 7], [-28, -84, 29, 5], [29, -84, 31, 5], [-64, 17, 48, 12], [67, 15, 50, 11]]) {
    B('basalt', x, h / 2, z, w, h, w * .8, .37);
    for (let j = 0; j < 5; j++) {
      const yy = h + rng() * 7;
      B('basalt', x + (rng() - .5) * w * .9, yy - 2, z + (rng() - .5) * w * .6, .7 + rng() * 1.4, 4 + rng() * 4, 1 + rng(), .36);
    }
  }

  // A few broken, molten worlds hang above the canyon, as in the reference.
  function floatingRock(x, y, z, r) {
    const cell = r / 3.6;
    for (let dx = -r; dx <= r; dx += cell) for (let dy = -r; dy <= r; dy += cell) for (let dz = -r; dz <= r; dz += cell) {
      const rr = Math.hypot(dx, dy, dz) / r;
      if (rr > 1 || rr < .65) continue;
      const heat = noise(dx * 3 + 4, dz * 3 + dy) > .36;
      B(heat ? 'redFragment' : 'basalt', x + dx, y + dy, z + dz, cell * .94, cell * .94, cell * .94, heat ? .62 : .5 + rng() * .3);
    }
  }
  floatingRock(-23, 33, -30, 1.95);
  floatingRock(28, 37, -43, 1.55);
  floatingRock(-42, 43, -68, .8);

  blocks.finish();
  // Flames and floating cinders animate on the GPU with no per-frame objects.
  const count = 900, positions = new Float32Array(count * 3), size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rng() - .5) * 103;
    positions[i * 3 + 1] = rng() * 54;
    positions[i * 3 + 2] = -65 + rng() * 123;
    size[i] = .4 + rng() * 1.5;
  }
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sparkGeometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const sparkMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, ratio: { value: 1 } },
    vertexShader: `attribute float size; uniform float time; uniform float ratio; varying float vHeat; void main(){vec3 p=position;p.y=mod(p.y+time*(.28+size*.21),54.);p.x+=sin(time*.18+p.z)*.7;vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;gl_PointSize=clamp(size*ratio*88./-view.z,.7,4.5);vHeat=size;}`,
    fragmentShader: `varying float vHeat; void main(){float a=1.-smoothstep(.15,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(1.,.11+vHeat*.13,.012,a*.81);}`,
  });
  const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
  sparks.name = 'portal-landscape-embers';
  group.add(sparks);
  return {
    blockCount: blocks.count,
    update(t, dpr = 1) {
      lava.uniforms.time.value = t;
      sparkMaterial.uniforms.time.value = t;
      sparkMaterial.uniforms.ratio.value = dpr;
      for (let i = 0; i < lanternLights.length; i++) lanternLights[i].intensity = (lanternLights[i].color.b > .5 ? 5 : 7) * (1 + Math.sin(t * 2.1 + i * 3.3) * .045);
    },
  };
}
