import * as THREE from 'three';
import { randomSource } from './rendering.js';

const palette = { deep: 0x26394c, stone: 0x66768b, edge: 0x9aa8bc, wet: 0x465a6e, moss: 0x4f705a };
function material(color, options = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .84, metalness: .08, ...options }); }
function emissive(color, strength = 2.2) { return new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: strength, roughness: .2, metalness: .08, clearcoat: .9, clearcoatRoughness: .16, transparent: true, opacity: .9, side: THREE.DoubleSide }); }

function addBox(root, mats, kind, x, y, z, sx, sy, sz, rotationY = 0, rotationZ = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mats[kind]);
  mesh.position.set(x, y, z); mesh.rotation.set(0, rotationY, rotationZ); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
}

function addArch(root, mats, options = {}) {
  const { x = 0, y = 0, z = 0, width = 11, height = 14, depth = 3.2, thickness = 1.55, segments = 15, material = 'stone', innerMaterial = 'edge', broken = false, scale = 1 } = options;
  const group = new THREE.Group(); group.position.set(x, y, z); group.scale.setScalar(scale);
  const legHeight = height * .49, pillarWidth = Math.max(1.35, width * .16), sideOffset = width * .5 - pillarWidth * .5;
  const outerRadius = width * .5, innerRadius = outerRadius - thickness;
  const shape = new THREE.Shape(); shape.moveTo(-outerRadius, 0); shape.lineTo(-outerRadius, legHeight); shape.absarc(0, legHeight, outerRadius, Math.PI, 0, true); shape.lineTo(outerRadius, 0); shape.closePath();
  const opening = new THREE.Path(); opening.moveTo(-innerRadius, 0); opening.lineTo(innerRadius, 0); opening.lineTo(innerRadius, legHeight); opening.absarc(0, legHeight, innerRadius, 0, Math.PI, false); opening.lineTo(-innerRadius, 0); opening.closePath(); shape.holes.push(opening);
  if (!broken) {
    const frameGeometry = new THREE.ExtrudeGeometry(shape, { depth: depth * .72, bevelEnabled: true, bevelSegments: 2, bevelSize: .13, bevelThickness: .11, curveSegments: 24 }); frameGeometry.translate(0, 0, -depth * .36);
    const frame = new THREE.Mesh(frameGeometry, mats[material]); frame.name = 'continuous-masonry-arch'; frame.castShadow = frame.receiveShadow = true; group.add(frame);
  }
  addBox(group, mats, material, -sideOffset, legHeight * .5, 0, pillarWidth, legHeight, depth); addBox(group, mats, material, sideOffset, legHeight * .5, 0, pillarWidth, legHeight, depth);
  for (const side of [-1, 1]) {
    addBox(group, mats, innerMaterial, side * sideOffset, .28, 0, pillarWidth * 1.52, .56, depth * 1.3);
    addBox(group, mats, material, side * sideOffset, .78, 0, pillarWidth * 1.32, .44, depth * 1.2);
    addBox(group, mats, innerMaterial, side * sideOffset, 1.15, 0, pillarWidth * 1.15, .26, depth * 1.08);
    addBox(group, mats, innerMaterial, side * sideOffset, legHeight + .18, 0, pillarWidth * 1.58, .42, depth * 1.32);
    addBox(group, mats, material, side * sideOffset, legHeight + .58, 0, pillarWidth * 1.38, .38, depth * 1.2);
    addBox(group, mats, innerMaterial, side * sideOffset, legHeight + .91, 0, pillarWidth * 1.18, .22, depth * 1.08);
    addBox(group, mats, 'deep', side * sideOffset, legHeight * .5, depth * .51, pillarWidth * .52, legHeight * .57, .16);
    addBox(group, mats, innerMaterial, side * sideOffset, legHeight * .5, depth * .605, pillarWidth * .68, .16, .09);
    for (let row = 0; row < 4; row++) addBox(group, mats, row % 2 ? innerMaterial : material, side * sideOffset, 1.5 + row * 2.25, depth * .55, pillarWidth * .28, .17, .16);
    for (let row = 0; row < 5; row++) {
      const brickY = 1.35 + row * 1.75;
      addBox(group, mats, row % 3 === 0 ? innerMaterial : material, side * (outerRadius + 1.4 + (row % 2) * .42), brickY, -.1, 2.4 + (row % 2) * .65, 1.5, depth * .84, side * .025);
    }
  }
  const radius = width * .5 - pillarWidth * .24, centerY = legHeight, archGroup = new THREE.Group();
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI * i / segments, blockWidth = Math.max(.72, Math.PI * radius / segments * 1.04);
    const block = new THREE.Mesh(new THREE.BoxGeometry(blockWidth, thickness, depth), mats[i % 3 === 0 ? innerMaterial : material]);
    block.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0); block.rotation.z = -angle + Math.PI * .5; block.castShadow = block.receiveShadow = true; archGroup.add(block);
    if (broken && ([0, 1, segments - 1, segments, Math.floor(segments * .58)].includes(i))) block.visible = false;
  }
  archGroup.position.y = centerY; group.add(archGroup);
  if (broken) {
    const apex = legHeight + outerRadius;
    for (const part of [[-width * .37, apex + .42, .2, 2.7], [width * .29, apex + .18, -.1, 2.1], [width * .42, apex + .85, .25, 1.5]]) addBox(group, mats, material, part[0], part[1], part[2], part[3], .65 + part[3] * .16, depth * .94, part[0] > 0 ? -.13 : .11, part[0] > 0 ? -.08 : .06);
    for (let row = 0; row < 3; row++) {
      const count = 7 - row, span = width * .78 - row * 1.1;
      for (let i = 0; i < count; i++) {
        if (row === 0 && (i === 1 || i === count - 2)) continue;
        const x = -span * .5 + (span / Math.max(1, count - 1)) * i + (row % 2 ? .35 : -.18);
        addBox(group, mats, row === 1 && i % 3 === 0 ? innerMaterial : material, x, apex + 1.1 + row * 1.15 + (i % 2) * .12, .05, 2.6 - row * .22, .9, depth * .92, (i % 2 ? -.06 : .04), 0);
      }
    }
  }
  root.add(group); return group;
}

function addRuneRing(root, mats, radius, y, z, tube, color) { const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 96), mats[color]); ring.rotation.x = -Math.PI / 2; ring.position.set(0, y, z); ring.name = `sanctum-rune-ring-${radius}`; root.add(ring); return ring; }

function addCrystal(root, mats, x, y, z, height, radius, color, rotation = 0) {
  const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = rotation;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius * .54, radius, height * .62, 6), mats[color]); body.position.y = -height * .31; body.castShadow = true; group.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(radius, height * .38, 6), mats[color]); tip.position.y = -height * .81; tip.rotation.z = Math.PI; group.add(tip); root.add(group); return group;
}

function addGuardian(root, mats, x, z, turn = 0) {
  const group = new THREE.Group(); group.position.set(x, .25, z); group.rotation.y = turn;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.32, .65, 8), mats.edge); pedestal.position.y = .33; group.add(pedestal);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.62, 2.2, 6, 10), mats.stone); body.position.y = 2.2; group.add(body);
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(1.75, .48, .72), mats.edge); shoulders.position.y = 3.05; group.add(shoulders);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.48, 12, 10), mats.wet); head.position.y = 3.75; group.add(head);
  const helmet = new THREE.Mesh(new THREE.ConeGeometry(.58, .85, 6), mats.edge); helmet.position.y = 4.38; group.add(helmet);
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.08, .22, 10), mats.edge); shield.position.set(.72, 2.2, .54); shield.rotation.x = Math.PI / 2; group.add(shield);
  const spear = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 5.2, 8), mats.wet); spear.position.set(-.72, 2.45, .25); spear.rotation.z = -.05; group.add(spear);
  group.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } }); root.add(group); return group;
}

function stoneTexture(seed) {
  const rng = randomSource(seed), canvas = document.createElement('canvas'); canvas.width = canvas.height = 512; const context = canvas.getContext('2d');
  const image = context.createImageData(512, 512);
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const i = (y * 512 + x) * 4, grain = (rng() - .5) * 44; const value = Math.max(92, Math.min(232, 176 + grain)); image.data[i] = value * .88; image.data[i + 1] = value * .94; image.data[i + 2] = value; image.data[i + 3] = 255; }
  context.putImageData(image, 0, 0);
  for (let i = 0; i < 120; i++) { const x = rng() * 512, y = rng() * 512, radius = 8 + rng() * 42, gradient = context.createRadialGradient(x, y, 0, x, y, radius); gradient.addColorStop(0, rng() < .55 ? 'rgba(8,22,30,.20)' : 'rgba(210,230,238,.12)'); gradient.addColorStop(1, 'rgba(0,0,0,0)'); context.fillStyle = gradient; context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill(); }
  for (let i = 0; i < 54; i++) { context.beginPath(); let x = rng() * 512, y = rng() * 512; context.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (rng() - .43) * 28; y += (rng() - .5) * 24; context.lineTo(x, y); } context.strokeStyle = 'rgba(5,13,20,.42)'; context.lineWidth = .6 + rng() * 1.5; context.stroke(); }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(2, 2); map.anisotropy = 8;
  const bump = map.clone(); bump.colorSpace = THREE.NoColorSpace; return { map, bump };
}

function softMistTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128; const context = canvas.getContext('2d'), gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,.8)'); gradient.addColorStop(.35, 'rgba(255,255,255,.28)'); gradient.addColorStop(1, 'rgba(255,255,255,0)'); context.fillStyle = gradient; context.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(canvas);
}

function addWater(root) {
  const geometry = new THREE.PlaneGeometry(190, 137, 90, 65); geometry.rotateX(-Math.PI / 2); const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) position.setY(i, -.12 + Math.sin(position.getX(i) * .12 + position.getZ(i) * .08) * .025 + Math.sin(position.getZ(i) * .31) * .012);
  geometry.computeVertexNormals();
  const waterMaterial = new THREE.ShaderMaterial({ name: 'sanctum-shallow-water', transparent: true, depthWrite: false, uniforms: { time: { value: 0 }, color: { value: new THREE.Color(0x020d15) }, altarCenter: { value: new THREE.Vector2(root.position.x, root.position.z + 13) } }, vertexShader: `varying vec3 vWorld;varying vec3 vNormal;varying vec2 vUv;void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`, fragmentShader: `precision highp float;uniform float time;uniform vec3 color;uniform vec2 altarCenter;varying vec3 vWorld;varying vec3 vNormal;varying vec2 vUv;void main(){float ax=sin(vWorld.x*.18+time*.22)*.018;float az=cos(vWorld.z*.21-time*.17)*.018;vec3 n=normalize(vNormal+vec3(ax,0.,az));vec3 viewDir=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(0.,dot(n,viewDir)),3.);float ripples=.5+.5*sin(vWorld.x*.22+sin(vWorld.z*.14)+time*.22);float altar=exp(-abs(length(vWorld.xz-altarCenter)-12.)*.38);vec3 c=color+vec3(.01,.035,.05)*fresnel+vec3(.008,.055,.085)*altar*(.28+.14*ripples);float alpha=.38+fresnel*.12+altar*.045;gl_FragColor=vec4(c,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }` });
  const water = new THREE.Mesh(geometry, waterMaterial); water.name = 'sanctum-shallow-water'; water.receiveShadow = true; root.add(water); return { waterMaterial };
}

export function buildSciFiWorld(root, progress = () => {}) {
  const rng = randomSource(555218);
  const texture = stoneTexture(55502), textured = { map: texture.map, bumpMap: texture.bump, bumpScale: .18 };
  const mats = { deep: material(palette.deep, { ...textured, roughness: .98, bumpScale: .25 }), stone: material(palette.stone, { ...textured, roughness: .9 }), edge: material(palette.edge, { ...textured, roughness: .76, metalness: .18, bumpScale: .11 }), wet: material(palette.wet, { ...textured, roughness: .58, metalness: .22, bumpScale: .1 }), moss: material(palette.moss, { ...textured, roughness: .96, bumpScale: .2 }), black: material(0x080f18, { roughness: 1 }), cyan: emissive(0x39cfff, 1.9), blue: emissive(0x247bff, 1.45), violet: emissive(0x8f4cff, 2.25), lilac: emissive(0xc476ff, 1.75) };
  progress('塑造地下水域与冷色洞窟光照…', 16);
  const hemisphere = new THREE.HemisphereLight(0x87acd0, 0x07141d, 1.75); hemisphere.position.set(-root.position.x, 1 - root.position.y, -root.position.z); root.add(hemisphere);
  const key = new THREE.DirectionalLight(0x8eb9dc, 2.1); key.position.set(-35, 62, 42); key.target.position.set(0, 4, -18); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -60, right: 60, top: 75, bottom: -35, far: 190 }); root.add(key, key.target);
  const frontFill = new THREE.DirectionalLight(0x9cbfe0, 2.65); frontFill.position.set(0, 24, 54); frontFill.target.position.set(0, 9, -8); root.add(frontFill, frontFill.target);
  const cyanLight = new THREE.PointLight(0x28cfff, 125, 95, 1.8); cyanLight.position.set(5, 7, -43); root.add(cyanLight);
  const violetLight = new THREE.PointLight(0x713dff, 55, 72, 1.8); violetLight.position.set(-2, 23, 4); root.add(violetLight);
  const waterLight = new THREE.PointLight(0x0d8eae, 34, 85, 1.7); waterLight.position.set(0, .6, 12); root.add(waterLight);
  const altarLight = new THREE.PointLight(0x35ddff, 72, 46, 1.85); altarLight.position.set(0, 4.5, 13); root.add(altarLight);
  const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x06121d, side: THREE.BackSide, fog: false }); const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 40, 24), skyMaterial); sky.name = 'sanctum-cavern-darkness'; root.add(sky);
  addBox(root, mats, 'deep', 0, -.65, -4, 150, 1, 130);
  const water = addWater(root);

  progress('砌筑两侧断裂石拱与远端门廊…', 31);
  const leftArch = addArch(root, mats, { x: -14, z: -10, width: 24, height: 24, depth: 4.2, thickness: 2.1, broken: true });
  const rightArch = addArch(root, mats, { x: 23, z: -12, width: 22.5, height: 23.5, depth: 4.1, thickness: 2, broken: true }); leftArch.rotation.y = .015; rightArch.rotation.y = -.02;
  addArch(root, mats, { x: 9, z: -43, width: 8.8, height: 12.5, depth: 3.1, thickness: 1.25, segments: 13, material: 'wet', scale: .82 });
  addArch(root, mats, { x: 9, z: -51, width: 6.5, height: 9.5, depth: 2.5, thickness: 1, segments: 12, material: 'stone', scale: .66 });
  const portalMaterial = new THREE.ShaderMaterial({ name: 'sanctum-distant-gateway', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { time: { value: 0 } }, vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, fragmentShader: `precision highp float;varying vec2 vUv;uniform float time;void main(){vec2 p=(vUv-.5)*vec2(1.7,1.);float d=length(p);float curtain=.62+.22*sin(vUv.y*31.+sin(vUv.x*17.+time*.35)*2.-time*.8);float edge=smoothstep(1.,.55,d);float core=exp(-d*d*5.);vec3 color=mix(vec3(.05,.45,.8),vec3(.42,1.4,1.7),core);gl_FragColor=vec4(color*(.55+curtain*.45),edge*(.34+core*.58));}` });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 7.4), portalMaterial); portal.position.set(9, 5.2, -50.5); portal.name = 'sanctum-distant-energy-door'; root.add(portal);

  progress('铺设远端阶梯、断裂石板与中央祭坛…', 48);
  for (let i = 0; i < 15; i++) { const t = i / 14, z = -35 - t * 12, width = 8.4 - t * 2.1; addBox(root, mats, i % 4 === 0 ? 'edge' : 'wet', 9, .22 + i * .19, z, width, .44, 1.08); }
  for (let i = 0; i < 10; i++) { const t = i / 9, x = -17 + t * 12, z = 39 - t * 21; addBox(root, mats, i % 3 === 0 ? 'edge' : 'wet', x + (rng() - .5) * .34, .18 + rng() * .1, z + (rng() - .5) * .3, 5.5 - t * .9, .42, 3.8 - t * .55, -.52 + (rng() - .5) * .05, (rng() - .5) * .035); }
  for (let i = 0; i < 22; i++) { const x = -29 + rng() * 58, z = -2 + rng() * 35; if (Math.abs(x) < 8 && z > 4) continue; const size = .7 + rng() * 2.2; addBox(root, mats, rng() < .22 ? 'moss' : 'stone', x, .35 + rng() * .5, z, size, .35 + rng() * .8, size * (.65 + rng() * .6), rng() * .5 - .25, rng() * .18 - .09); }
  const altar = new THREE.Group(); altar.name = 'central-rune-altar'; root.add(altar);
  for (let layer = 0; layer < 4; layer++) { const radius = 12.4 - layer * 1.25, disk = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + .28, .62, 48), mats[layer % 2 ? 'wet' : 'edge']); disk.position.set(0, .38 + layer * .54, 13); disk.castShadow = disk.receiveShadow = true; altar.add(disk); }
  addRuneRing(altar, mats, 10.2, 2.53, 13, .16, 'cyan'); addRuneRing(altar, mats, 7.2, 2.56, 13, .13, 'blue'); addRuneRing(altar, mats, 4.1, 2.6, 13, .11, 'cyan');
  const core = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.5, .14, 48), mats.cyan); core.position.set(0, 2.68, 13); altar.add(core);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 8.5; const rune = addBox(altar, mats, i % 2 ? 'blue' : 'cyan', Math.cos(a) * r, 2.67, 13 + Math.sin(a) * r, .28, .08, 1.1); rune.rotation.y = -a; }
  for (let i = 0; i < 18; i++) { const a = rng() * Math.PI * 2, r = 13 + rng() * 7; addBox(root, mats, rng() < .4 ? 'moss' : 'stone', Math.cos(a) * r, .25 + rng() * .38, 13 + Math.sin(a) * r, .8 + rng() * 1.8, .35 + rng() * .65, .7 + rng() * 1.9, rng() * .7, rng() * .16 - .08); }
  addGuardian(root, mats, -10.5, -2.5, .18); addGuardian(root, mats, 11.5, -5, -.24);

  progress('悬挂洞窟岩层与蓝紫发光晶簇…', 69);
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 38; i++) { const rock = new THREE.Mesh(rockGeometry, i % 5 === 0 ? mats.stone : mats.deep); rock.position.set(-50 + rng() * 100, 41 + rng() * 6, -62 + rng() * 77); rock.scale.set(6 + rng() * 10, 2.2 + rng() * 4.4, 5 + rng() * 10); rock.rotation.set(rng() * .45, rng() * Math.PI, rng() * .35); rock.castShadow = rock.receiveShadow = true; root.add(rock); }
  for (let i = 0; i < 34; i++) { const x = -43 + rng() * 86, z = -58 + rng() * 57; if (Math.abs(x) < 12 && z < -18 && rng() < .55) continue; const h = 3 + rng() * 6.2, radius = .28 + rng() * .72; addCrystal(root, mats, x, 42 + rng() * 4, z, h, radius, rng() < .48 ? 'violet' : rng() < .52 ? 'lilac' : 'cyan', rng() * Math.PI); }
  for (const [x, z, h, r, kind] of [[-20,-23,10,1.1,'violet'],[-7,-28,13,1.25,'cyan'],[4,-25,14,1.35,'cyan'],[18,-25,10.5,1.05,'violet'],[-33,-15,9,.9,'lilac'],[35,-19,9.5,1,'violet']]) addCrystal(root, mats, x, 44, z, h, r, kind, rng() * Math.PI);

  progress('补齐墙面断柱、倒塌石碑与冷雾…', 84);
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) { const x = side * (29 + rng() * 10), z = -50 + i * 6 + rng() * 2, h = 5 + rng() * 9; addBox(root, mats, 'deep', x, h * .5, z, 3.2 + rng() * 2.8, h, 3.4, rng() * .12, rng() * .06 - .03); addBox(root, mats, 'stone', x - side * 1.65, h * .62, z + .15, .36, h * .52, 2.2, 0, .02); if (rng() < .7) addBox(root, mats, 'edge', x, h + .2, z, 4.1, .45, 3.8, rng() * .1, 0); }
  for (let i = 0; i < 16; i++) { const side = i % 2 ? -1 : 1, x = side * (13 + rng() * 19), z = -7 + rng() * 33, h = 2 + rng() * 4; addBox(root, mats, 'edge', x, h * .5, z, .8 + rng() * 1.5, h, .45 + rng() * .8, rng() * .8, rng() * .22 - .11); }
  const mistTexture = softMistTexture();
  for (let i = 0; i < 24; i++) { const mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTexture, color: 0x2b88a2, transparent: true, opacity: .055, depthWrite: false, blending: THREE.AdditiveBlending })); mist.position.set(-42 + rng() * 84, 1 + rng() * 11, -60 + rng() * 64); mist.scale.set(10 + rng() * 16, 4 + rng() * 8, 1); root.add(mist); }
  return { blockCount: 510, setView() {}, update(time) { water.waterMaterial.uniforms.time.value = time; portalMaterial.uniforms.time.value = time; cyanLight.intensity = 118 + Math.sin(time * .8) * 8; violetLight.intensity = 50 + Math.sin(time * .47 + 1.1) * 8; } };
}
