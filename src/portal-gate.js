import * as THREE from 'three';
import { Blocks, materials, randomSource } from './rendering.js';
import { buildPortalLightning } from './portal-lightning.js';
import { buildPortalParticles } from './portal-particles.js';

// The gateway is a freestanding masonry structure.  Its opening, mouldings,
// reliefs and energy branches all retain depth when seen from an orbiting camera.
export function buildPortalGate(group) {
  const rng = randomSource(33391);
  const mat = materials();
  mat.basalt = mat.dark.clone();
  mat.basalt.color.set(0x514858);
  mat.basalt.roughness = .78;
  mat.basalt.metalness = .21;
  mat.basalt.bumpScale = .16;
  mat.polished = mat.edge.clone();
  mat.polished.color.set(0x67527d);
  mat.polished.roughness = .46;
  mat.polished.metalness = .36;
  mat.recess = mat.dark.clone();
  mat.recess.color.set(0x140f1d);
  mat.brick = mat.red.clone();
  mat.brick.color.set(0x8b1725);
  mat.brick.emissive.set(0x4a0610);
  mat.brick.emissiveIntensity = .28;
  mat.ash = mat.basalt.clone();
  mat.ash.color.set(0x9b91a3);
  mat.ash.roughness = .86;
  mat.mineral = mat.basalt.clone();
  mat.mineral.color.set(0x756085);
  mat.mineral.metalness = .32;
  mat.fracture = mat.basalt.clone();
  mat.fracture.color.set(0x312b38);
  const emissive = (color, strength) => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: strength, roughness: .38, metalness: .2,
  });
  mat.violet = emissive(0x7320da, 1.25);
  mat.lilac = emissive(0x9c49ef, .65);
  mat.cyan = emissive(0x05bbff, 3.1);
  mat.blue = emissive(0x454eef, 2.3);
  mat.magenta = emissive(0xca16ef, 2.25);
  mat.fire = emissive(0xff5a03, 2.6);
  mat.gold = emissive(0xff9512, 2.0);
  mat.whitehot = emissive(0xffc964, 2.4);
  mat.metal = new THREE.MeshStandardMaterial({ color: 0x393031, metalness: .78, roughness: .48 });
  const blocks = new Blocks(group, mat);
  const add = (kind, x, y, z, w, h, d, tone = 1, bevel = false) =>
    blocks.add(kind, x, y, z, w, h, d, tone, 0, bevel);
  const vary = () => .69 + rng() * .56;

  // A broad, chipped ashlar dais and individually laid stair treads.
  for (let layer = 0; layer < 3; layer++) {
    const width = 19 - layer * 1.7;
    const front = 8.3 - layer * .8;
    for (let x = -width; x < width; x += 2) {
      for (let z = -3.4; z < front; z += 1.7) {
        add(layer === 2 ? 'polished' : 'basalt', x + .99, .46 + layer * .88, z + .82,
          1.95, .84, 1.64, vary(), layer === 2);
        if (layer === 2) for (let chip = 0; chip < 3; chip++) {
          add(chip === 0 ? 'ash' : 'fracture',x + .22 + rng() * 1.48,2.665,z + .22 + rng() * 1.22,
            .14+rng()*.47,.03,.055+rng()*.12,.53+rng()*.6);
        }
      }
    }
  }
  for (let i = 0; i < 8; i++) {
    const y = .15 + i * .37;
    const z = 14.4 - i * 1.03;
    const width = 9.5 - i * .17;
    add('recess', 0, y / 2, z, width, Math.max(.3, y), 1.4, .85);
    const columns = 5;
    for (let j = 0; j < columns; j++) {
      const w = width / columns;
      add('basalt', (j + .5) * w - width / 2, y + .15, z, w - .045, .3, 1.2, vary(), true);
      add('polished', (j + .5) * w - width / 2, y + .29, z + .48, w - .065, .085, .12, .8);
    }
  }
  for (let side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      add('basalt', side * (5.7 + .13 * i), .6 + i * .25, 12.5 - i * 1.1, 1.25, 1.15 + i * .3, 1.07, vary(), true);
    }
  }

  function apertureHalfWidth(y) {
    if (y < 4.4) return 0;
    if (y < 5.6) return 3.15;
    if (y < 7.2) return 4.65;
    if (y < 8.8) return 5.9;
    if (y < 18.4) return 7.0;
    if (y < 20) return 5.9;
    if (y < 21.6) return 4.55;
    if (y < 23.2) return 2.85;
    return 0;
  }
  function outerHalfWidth(y) {
    if (y < 4.8) return 17.6;
    if (y < 7.2) return 16.0;
    if (y < 10.4) return 14.4;
    if (y < 13.6) return 13.1;
    if (y < 16) return 14.0;
    if (y < 18.4) return 15.4;
    if (y < 20) return 14.3;
    if (y < 25.6) return 12.8;
    if (y < 27.2) return 9.8;
    if (y < 28) return 6.7;
    if (y < 28.8) return 3.6;
    return 1.65;
  }
  // Each row is cut around the actual opening, never hidden behind a billboard.
  for (let row = 0; row < 34; row++) {
    const y = 3.2 + row * .8;
    const outer = outerHalfWidth(y), inner = apertureHalfWidth(y);
    for (const side of [-1, 1]) {
      let x = inner || .035;
      while (x < outer - .06) {
        let w = Math.min(outer - x, 1.15 + rng() * 1.18);
        if (outer - x - w < .45) w = outer - x;
        const cx = side * (x + w / 2);
        const blockZ = -.9 + (rng() - .5) * .12;
        add('basalt', cx, y, blockZ, w - .055, .752, 4.3, vary(), true);
        // Broken mineral inclusions and thin planar chips break up the long
        // uniform ashlar bands, while retaining deeply shadowed mortar joints.
        for (let fleck = 0; fleck < 8; fleck++) {
          const sw = .09 + rng() * Math.min(.35, w * .27);
          const sh = .055 + rng() * .11;
          const fx = cx + (rng()-.5) * Math.max(.05,w-sw-.12);
          const fy = y + (rng()-.5) * (.66-sh);
          const kind = fleck < 2 ? 'ash' : fleck < 6 ? 'mineral' : 'fracture';
          add(kind,fx,fy,blockZ+2.176+rng()*.018,sw,sh,.036,.55+rng()*.63);
          if (fleck === 1 || fleck === 4) {
            add(kind,fx+sw*.17,fy+sh*.65,blockZ+2.187,sw*.48,sh*.45,.052,.55+rng()*.3);
          }
        }
        if (rng() < .63) add('ash',cx + (rng()-.5)*w*.5,y+.322,blockZ+2.185,
          .15+rng()*w*.28,.024,.046,.44+rng()*.42);
        if (rng() < .45) add('fracture',cx + (rng()-.5)*w*.6,y-.15+rng()*.24,blockZ+2.2,
          .13+rng()*.4,.027,.048,.75);
        x += w;
      }
    }
  }
  // Structural tiers and buttresses give the silhouette its stepped shoulders.
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 6; tier++) {
      const x = side * (15.6 - tier * .77), y = 3.7 + tier * 1.46;
      add('recess', x, y, 1.46, 2.25, 1.42, 1.1, .85);
      add('basalt', x, y + .49, 1.68, 2.32, .34, 1.48, 1.03, true);
    }
    add('basalt', side * 12.4, 17.65, 1.5, 5.3, 1.7, 1.3, .86, true);
    add('polished', side * 12.4, 17.1, 2.12, 5.4, .16, .13, .53);
    add('recess', side * 10.75, 17.1, 1.7, 3.6, 12.55, .9, .8);
    // Black inset shafts bordered with worked purple stone.
    for (const dx of [-1.45, 1.45]) {
      add('basalt', side * 10.75 + dx, 16.0, 2.3, .45, 10.4, .75, .78, true);
      add('polished', side * 10.75 + dx, 16.0, 2.72, .11, 10.4, .1, .7);
    }
    for (let y = 10.9; y < 22; y += 2.2) {
      add('basalt', side * 10.75, y, 2.48, 3.7, .32, .72, .75, true);
    }
    // Two bands of inset crimson brickwork, warm reflected light from below.
    for (const band of [{ y: 5.7, rows: 7 }, { y: 22.55, rows: 4 }]) {
      for (let r = 0; r < band.rows; r++) {
        for (let c = 0; c < 3; c++) {
          const bw = 1.25, shift = r % 2 ? .26 : -.12;
          add('brick', side * 10.55 + (c - 1) * bw + shift, band.y + r * .53,
            2.47, bw - .065, .48, .45, .77 + rng() * .5, true);
        }
      }
    }
    add('polished', side * 10.75, 9.36, 2.57, 4.1, .34, .85, .65, true);
    // Deep narrow vertical orange runnels, broken by little iron fasteners.
    for (const shaft of [{ x: 10.75, y: 12.8, h: 4.45 }, { x: 14.1, y: 7.8, h: 2.5 }]) {
      const x = side * shaft.x;
      add('recess', x, shaft.y, 2.3, .66, shaft.h + .45, .65, 1);
      add('fire', x, shaft.y, 2.66, .11, shaft.h, .11, .9);
      add('gold', x + .17 * side, shaft.y - .2, 2.61, .055, shaft.h * .66, .06, .7);
      for (let k = -1; k <= 1; k++) add('metal', x, shaft.y + k * shaft.h * .34, 2.76, .64, .11, .11);
    }
    for (let j = 0; j < 3; j++) {
      add('polished', side * (4.5 + j * 1.35), 25.95, 1.8, 1.15, .3, .85, .53, true);
    }
    add('fire', side * 5.6, 24.75, 2.18, 1.8, .1, .12, .87);
    add('gold', side * 5.6, 24.88, 2.17, 1.25, .055, .09, .7);
  }

  const opening = [
    [-2.85,4.4],[2.85,4.4],[2.85,5.6],[4.35,5.6],[4.35,7.2],[5.6,7.2],
    [5.6,8.8],[6.7,8.8],[6.7,18.4],[5.6,18.4],[5.6,20],[4.25,20],
    [4.25,21.6],[2.55,21.6],[2.55,23.0],[-2.55,23.0],[-2.55,21.6],
    [-4.25,21.6],[-4.25,20],[-5.6,20],[-5.6,18.4],[-6.7,18.4],
    [-6.7,8.8],[-5.6,8.8],[-5.6,7.2],[-4.35,7.2],[-4.35,5.6],[-2.85,5.6],
  ];
  function outline(points, kind, width, z, depth, scale = 1, centerY = 13.7) {
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const ax = a[0] * scale, bx = b[0] * scale;
      const ay = centerY + (a[1] - centerY) * scale, by = centerY + (b[1] - centerY) * scale;
      add(kind, (ax + bx) / 2, (ay + by) / 2, z,
        Math.max(width, Math.abs(bx - ax) + width), Math.max(width, Math.abs(by - ay) + width), depth, 1, kind === 'polished');
    }
  }
  outline(opening, 'recess', .82, 1.67, .95, 1.055);
  outline(opening, 'polished', .44, 2.12, .78, 1.035);
  outline(opening, 'violet', .14, 2.56, .115, 1.034);
  outline(opening, 'basalt', .37, 1.83, .64, .965);
  outline(opening, 'lilac', .062, 2.19, .09, .973);
  outline(opening, 'violet', .062, .77, .12, .99);
  // Amber corner marks are independent segments, like the source's rune brackets.
  for (const side of [-1, 1]) {
    for (const bracket of [{ x: 5.5, y: 17.8, h: 1.05 }, { x: 4.1, y: 19.25, h: .7 },
      { x: 5.55, y: 8.9, h: 1.1 }, { x: 4.1, y: 7.1, h: .8 }]) {
      add('fire', side * bracket.x, bracket.y, 2.03, .12, bracket.h, .12);
      add('gold', side * (bracket.x - .52), bracket.y + bracket.h / 2, 2.035, 1.05, .12, .12);
    }
  }
  // A recessed, chamfered crest and its pixel-carved nested violet sigil.
  add('recess', 0, 26.7, 1.45, 4.8, 5.05, 1.1);
  const crest = [[0,29.35],[.55,29.35],[.55,28.85],[1.15,28.85],[1.15,28.35],
    [1.8,28.35],[1.8,25.5],[1.2,25.5],[1.2,24.9],[.55,24.9],[.55,24.4],
    [-.55,24.4],[-.55,24.9],[-1.2,24.9],[-1.2,25.5],[-1.8,25.5],[-1.8,28.35],
    [-1.15,28.35],[-1.15,28.85],[-.55,28.85],[-.55,29.35]];
  outline(crest, 'polished', .25, 2.2, .33);
  const crestSmall = crest.map(([x,y]) => [x * .7,26.82 + (y - 26.82) * .69]);
  outline(crestSmall, 'violet', .18, 2.38, .12);
  for (const [x,y,w,h] of [[0,27.32,1.07,.19],[-.44,26.91,.19,.8],[0,26.51,1.06,.18],[.46,26.9,.18,.8],
    [0,26.9,.23,.35],[.68,27.51,.19,.45],[-.62,26.48,.2,.54]]) add('lilac',x,y,2.42,w,h,.1,.78);

  // Square panels contain an octagonal, orange, hollow rune instead of decals.
  const rune = [[-.48,1.0],[.48,1.0],[.48,.78],[.83,.78],[.83,.42],[1.02,.42],
    [1.02,-.42],[.83,-.42],[.83,-.78],[.48,-.78],[.48,-1],[-.48,-1],[-.48,-.78],
    [-.83,-.78],[-.83,-.42],[-1.02,-.42],[-1.02,.42],[-.83,.42],[-.83,.78],[-.48,.78]];
  for (const side of [-1, 1]) {
    const x = side * 10.85, y = 22.16;
    add('polished',x,y,2.46,3.58,3.55,.6,.88,true);
    add('recess',x,y,2.81,3.05,3.02,.14,.9);
    for (const [ox,oy,w,h] of [[0,1.49,3.28,.14],[0,-1.49,3.28,.14],[-1.49,0,.14,3.05],[1.49,0,.14,3.05]])
      add('brick',x+ox,y+oy,2.93,w,h,.16,.9);
    outline(rune.map(([rx,ry])=>[x+rx,y+ry]),'fire',.17,3.01,.11);
    const inner = [[-.3,.35],[.3,.35],[.3,-.35],[-.3,-.35]];
    outline(inner.map(([rx,ry])=>[x+rx,y+ry]),'gold',.12,3.03,.12);
    add('fire',x,y,3.04,.19,.19,.13,1);
    for (const s of [-1,1]) add('metal',x+s*1.25,y+s*1.24,3.02,.16,.16,.2,1,true);
    // Diamond-shaped relief farther down each column uses actual rotated cubes.
    const diamond = new THREE.Mesh(new THREE.BoxGeometry(1.68,1.68,.38),mat.polished);
    diamond.rotation.z=Math.PI/4;diamond.position.set(side*10.75,17.0,2.87);diamond.castShadow=true;group.add(diamond);
    const recess = new THREE.Mesh(new THREE.BoxGeometry(1.15,1.15,.12),mat.recess);
    recess.rotation.z=Math.PI/4;recess.position.set(side*10.75,17,3.1);group.add(recess);
    add('fire',side*10.75,17,3.22,.28,.28,.13,.65);
  }

  function lantern(x,y,z) {
    add('basalt',x,y-.55,z,1.8,.34,1.25,.9,true);
    add('metal',x,y-.29,z,.78,.13,.75);
    add('gold',x,y+.19,z,.58,.83,.52,.9,true);
    add('whitehot',x,y+.2,z+.285,.27,.54,.05,.75);
    for (const sx of [-1,1]) for (const sz of [-1,1]) add('metal',x+sx*.35,y+.16,z+sz*.34,.105,.94,.105);
    add('metal',x,y+.66,z,.94,.18,.85);
    add('metal',x,y+.84,z,.68,.2,.65);
    add('metal',x,y+1.01,z,.19,.19,.2);
    const lamp = new THREE.PointLight(0xffa320,32,8,2);lamp.position.set(x,y+.4,z+.8);group.add(lamp);
  }
  lantern(-10.65,5.54,3.2);lantern(10.65,5.54,3.2);
  for (let i=0;i<4;i++) {
    add('basalt',0,3.13+i*.33,3.8-i*.38,4.85-i*.55,.32,1.3,.88,true);
    add('polished',0,3.29+i*.33,4.37-i*.38,4.82-i*.55,.065,.09,.84);
  }

  // The same branch composition is now continuously deformed and pulsed on the GPU.
  const branches = [
    {k:'gold',w:.29,p:[[0,4.5],[-.35,5.8],[.45,7.1],[-.32,8.9],[.28,10.0],[-.2,11.15]]},
    {k:'fire',w:.17,p:[[.05,5],[-1.05,7.1],[-.55,8.4],[-1.4,9.8],[-1.8,12],[-2.6,13.25],[-2.4,14.3]]},
    {k:'gold',w:.13,p:[[0,6.2],[1.4,7.2],[1.72,8.9],[3.1,9.7],[3.55,11.4],[4.7,12.9],[4.95,14.4]]},
    {k:'cyan',w:.20,p:[[-.5,9.5],[-.35,11.0],[-1.15,12.4],[-.65,14.2],[-.95,15.8],[.02,17.3],[-.2,19.1],[.4,20.3],[.23,21.9]]},
    {k:'cyan',w:.22,p:[[-.24,10.5],[1.15,12],[1.65,13.9],[2.55,14.9],[3.05,16.0],[4.3,16.7],[4.75,18.4]]},
    {k:'blue',w:.125,p:[[-.9,12.4],[-2.1,13.5],[-2.55,15.3],[-3.6,16.4],[-3.3,17.6],[-2.0,18.45],[-1.2,17.85]]},
    {k:'cyan',w:.12,p:[[-2.5,15.25],[-3.6,14.6],[-4.25,13.0],[-5.35,12.2],[-5.9,10.7]]},
    {k:'magenta',w:.135,p:[[-.35,8.3],[-2.0,9.2],[-2.7,10.7],[-4.1,11.8],[-4.3,13.2],[-5.9,14.3],[-6.1,15.4]]},
    {k:'magenta',w:.115,p:[[.28,7.5],[2.4,8.1],[3.7,8.9],[4.25,10.3],[5.7,11.2]]},
    {k:'fire',w:.13,p:[[-.2,11.1],[1.15,11.8],[1.25,13.2],[2.1,14.0],[2.1,15.7],[1.35,17.1],[1.8,18.7]]},
    {k:'blue',w:.1,p:[[1.8,13.85],[1.9,16.7],[1.1,18.35],[1.55,20.0]]},
    {k:'cyan',w:.1,p:[[-.5,14.2],[-2.0,16.15],[-1.6,17.5],[-2.2,19],[-2.2,20.3]]},
    {k:'gold',w:.1,p:[[-.1,9.2],[-2.2,8.1],[-3.8,8.7],[-4.5,10.15]]},
    {k:'blue',w:.095,p:[[2.55,14.9],[3.65,13.65],[4.6,14.9],[5.5,15.6],[5.8,17.0]]},
    {k:'magenta',w:.09,p:[[-4.1,11.8],[-5.6,10.7],[-5.0,9.3],[-4.3,9.0]]},
    {k:'fire',w:.095,p:[[.1,5.3],[1.5,6.3],[2.4,5.8],[2.7,7.1]]},
    {k:'gold',w:.085,p:[[-2.1,13.5],[-3.9,14],[-4.4,15.8],[-4.0,17]]},
  ];
  const lightning=buildPortalLightning(group,branches,mat);
  const particles=buildPortalParticles(group);
  const shape = new THREE.Shape(opening.map(([x,y])=>new THREE.Vector2(x,y)));
  const energyMaterial = new THREE.ShaderMaterial({
    transparent:false,depthWrite:true,side:THREE.DoubleSide,
    uniforms:{time:{value:0}},
    vertexShader:`varying vec2 vLocal;void main(){vLocal=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float;varying vec2 vLocal;uniform float time;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.1+13.;a*=.5;}return v;}
      void main(){
        vec2 p=vLocal;float rise=p.y-4.4;
        vec2 flow=vec2(p.x*.28+sin(rise*.38-time*.6)*.32,rise*.21-time*.36);
        float angle=time*.23+sin(rise*.2-time*.3)*.3;
        flow=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*flow;
        float n=fbm(flow+vec2(fbm(flow*1.5),0.));
        float energy=exp(-abs(p.x)*(.31+.085*rise))*exp(-rise*.28);
        float vapour=smoothstep(.23,.82,n)*(.5+.5*exp(-abs(p.x)*.25));
        float cloud=fbm(vec2(p.x*.62,rise*.35-time*.4));
        vec3 purple=vec3(.025,.012,.066)+vec3(.20,.058,.45)*(vapour*.93+.13);
        vec3 core=mix(vec3(2.3,.21,.003),vec3(1.2,.12,.012),smoothstep(0.,5.,rise))*energy*(.7+cloud*.8);
        float whirl=sin(p.x*.8+rise*.54+fbm(flow*2.)*6.-time*1.1);
        vec3 aura=vec3(.08,.14,.32)*smoothstep(.5,.92,whirl)*vapour*.5;
        float ring=pow(.5+.5*sin(length(vec2(p.x*.8,rise*.65))*2.2-time*2.8),12.);
        vec3 ripple=vec3(.040,.055,.115)*ring*vapour;
        gl_FragColor=vec4(purple+core*(.9+.12*sin(time*2.2))+aura+ripple,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const energySurface = new THREE.Mesh(new THREE.ShapeGeometry(shape),energyMaterial);
  energySurface.position.z=-.42;energySurface.name='Portal energy membrane';group.add(energySurface);

  // Soft light falls out of the opening onto the carved frame and real steps.
  const violetLight = new THREE.PointLight(0xa336ff,240,38,2);
  violetLight.position.set(0,13,4.4);group.add(violetLight);
  const cyanLight = new THREE.PointLight(0x458dff,36,18,2);
  cyanLight.position.set(0,17,2.8);group.add(cyanLight);
  const rootLight = new THREE.PointLight(0xff780e,65,17,2);
  rootLight.position.set(0,5.3,3.7);group.add(rootLight);
  blocks.finish();
  // Emissive detail does not need shadow-map passes.
  group.traverse(object=>{if(object.isInstancedMesh&&['violet','lilac','cyan','blue','magenta','fire','gold','whitehot','ash','mineral','fracture'].some(n=>object.name.startsWith(n)))object.castShadow=false;});
  return {
    blockCount:blocks.count+lightning.count+particles.count,
    energyBlockCount:lightning.count+particles.count,
    update(t,dpr) {
      lightning.update(t);
      particles.update(t,dpr);
      energyMaterial.uniforms.time.value=t;
      rootLight.intensity=66+Math.sin(t*3.1)*9+Math.sin(t*5.7)*3;
      violetLight.intensity=230+Math.sin(t*1.35)*13;
      cyanLight.intensity=36+Math.sin(t*2.1)*7;
    },
  };
}
