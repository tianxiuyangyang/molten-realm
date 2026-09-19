import * as THREE from 'three';
import { Blocks, randomSource } from './rendering.js';

// Secondary construction detail belongs exclusively to the original citadel.
// A separate seed keeps the world generator's terrain and architecture stable.
export function addCitadelDetails(group, mats) {
  const rng = randomSource(934731);
  const iron = new THREE.MeshStandardMaterial({color:0x303033,roughness:.47,metalness:.78});
  const glaze = new THREE.MeshStandardMaterial({color:0x211b20,roughness:.26,metalness:.35});
  const detailMats = { ...mats, iron, glaze };
  const blocks = new Blocks(group, detailMats);
  const B = (kind, x, y, z, w, h, d, shade = .75, angle = 0, bevel = true) =>
    blocks.add(kind, x, y, z, w, h, d, shade, angle, bevel);

  function pointedArch(cx, bottom, front, width, height, layers = 3) {
    const half = width / 2;
    const spring = height - width * .8;
    for (let layer = 0; layer < layers; layer++) {
      const face = front + layer * .17;
      const outset = .31 + layer * .36;
      for (let j = 0; j < Math.ceil(height / .52); j++) {
        const y = Math.min(j * .52 + .26, height);
        const taper = Math.max(0, y - spring) * .55;
        for (const side of [-1, 1]) {
          const x = cx + side * (half + outset - taper);
          B(layer === 1 ? 'edge' : 'dark', x, bottom + y, face,
            layer === 1 ? .21 : .46, .49, .39, .57 + rng() * .18);
          // Narrow, offset worn arrises make the depth of each stone readable.
          if (layer === 0 && j % 3 === 1)
            B('stone', x - side * .18, bottom + y - .15, face + .215,
              .065, .18, .05, .9 + rng() * .14, 0, false);
        }
      }
      const cap = Math.max(.6, width - (height - spring) * 1.1 + outset * 2);
      B(layer === 1 ? 'edge' : 'dark', cx, bottom + height + .19 + layer * .12,
        face, cap, .36, .48, .7);
    }
    // Heavy springing blocks and a small faceted keystone.
    for (const side of [-1, 1]) {
      const x = cx + side * (half + .7);
      B('dark', x, bottom + spring - .15, front + .3, 1.28, .3, .95, .72);
      B('edge', x, bottom + spring + .08, front + .35, 1.4, .12, 1.0, .72);
    }
    B('edge', cx, bottom + height + .39, front + .56, .43, .59, .3, .8);
    B('dark', cx, bottom + height + .55, front + .73, .18, .24, .14, .8);
  }

  pointedArch(13, 21.5, 19.16, 4.5, 9, 3);
  pointedArch(13, 58, .49, 3.6, 11.8, 2);
  // Recessed reveals only touch the sides, preserving the luminous gate opening.
  for (const side of [-1, 1]) {
    for (let y = 21.65; y < 26.5; y += .59) {
      B('dark', 13 + side * 2.16, y, 18.3, .24, .55, 1.19, .48);
      B('iron', 13 + side * 2.17, y + .13, 18.95, .26, .06, .095, .76);
    }
    for (const y of [22.7, 25.1]) {
      B('iron', 13 + side * 2.53, y, 19.48, .49, .23, .085, .68);
      for (const dx of [-.15, .15])
        B('edge', 13 + side * 2.53 + dx, y, 19.535, .065, .065, .055, .62);
    }
  }
  // Shallow courses join the courtyard floor to the gate's existing sill.
  for (let j = 0; j < 6; j++) {
    const y = 18.49 + j * .48;
    const z = 21.78 - j * .57;
    for (let k = -3; k <= 3; k++) {
      B('dark', 13 + k * .91, y, z, .88, .47, .68, .67 + rng() * .15);
      B('edge', 13 + k * .91, y + .225, z + .22, .85, .045, .16, .53 + rng() * .1);
    }
  }

  function cornice(cx, cz, width, depth, height) {
    for (const front of [-1, 1]) {
      for (let x = -width / 2 + .4; x < width / 2; x += .79) {
        B('dark', cx + x, height - .43, cz + front * (depth / 2 + .36),
          .33, .49, .52, .63 + rng() * .16);
        B('edge', cx + x, height - .18, cz + front * (depth / 2 + .48),
          .43, .12, .58, .49 + rng() * .1);
      }
    }
    for (const side of [-1, 1]) {
      for (let z = -depth / 2 + .7; z < depth / 2; z += .79) {
        B('dark', cx + side * (width / 2 + .36), height - .43, cz + z,
          .52, .49, .33, .63 + rng() * .16);
        B('edge', cx + side * (width / 2 + .48), height - .18, cz + z,
          .58, .12, .43, .49 + rng() * .1);
      }
    }
  }
  cornice(13, 0, 30, 25, 32.0);
  cornice(13, -3, 21, 19, 53.1);
  cornice(13, 15, 11, 7, 30.95);
  cornice(13, -6, 11, 11, 72.1);

  // Individual ribs and drip ledges articulate existing buttresses.
  for (const side of [-1, 1]) {
    for (let z = -12; z <= 9; z += 4.2) {
      const x = 13 + side * 16.4;
      for (let y = 19.9; y < 31.4; y += .72) {
        B('edge', x + side * 1.04, y, z, .1, .67, .46, .46 + rng() * .16);
        if (y < 27.8 && rng() < .23)
          B('ore', x + side * 1.10, y, z + .09, .06, .24, .055, .39, 0, false);
      }
      for (const y of [21.1, 25.9, 30.8]) {
        B('dark', x, y, z, 2.22, .26, 2.19, .63);
        B('edge', x + side * .07, y + .14, z, 2.32, .07, 2.27, .59);
      }
    }
  }

  // Recessed stone panels vary the flat side walls without covering their windows.
  for (const side of [-1, 1]) {
    const x = 13 + side * 15.66;
    for (const z of [-8.8, -4.6, -.4, 3.8, 8]) {
      for (const dz of [-.53, .53])
        B('edge', x, 26.1, z + dz, .15, 4.7, .15, .51);
      for (const y of [23.7, 28.5])
        B('edge', x, y, z, .15, .15, 1.2, .53);
      B('dark', x + side * .03, 26.1, z, .08, 4.2, .88, .51);
      for (let y = 24.1; y < 28.1; y += .68)
        B('stone', x + side * .11, y, z - .2, .07, .62, .22, .58 + rng() * .2);
    }
  }

  const start = new THREE.Vector3(-62, 16, 99);
  const end = new THREE.Vector3(13, 18.4, 23);
  const delta = end.clone().sub(start);
  const length = Math.hypot(delta.x, delta.z);
  const direction = delta.clone().normalize();
  const normal = new THREE.Vector3(-direction.z, 0, direction.x);
  const angle = Math.atan2(-direction.z, direction.x);
  const parts = Math.ceil(length / 1.4);
  const point = (t, offset = 0) => start.clone().lerp(end, t).addScaledVector(normal, offset);

  function lantern(x, y, z) {
    // Surround the already-existing fire with an open metal basket; no glass planes.
    for (const yy of [y + .10, y + .73])
      for (const side of [-1, 1]) {
        B('iron', x, yy, z + side * .465, 1.03, .10, .10, .67);
        B('iron', x + side * .465, yy, z, .10, .10, .84, .67);
      }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      B('iron', x + sx * .45, y + .49, z + sz * .45, .10, .84, .10, .74);
      B('edge', x + sx * .47, y + .13, z + sz * .47, .13, .13, .13, .59);
    }
    // Slender strips around each face keep the flame visible between the bars.
    for (const side of [-1, 1]) for (const u of [-.19, .19]) {
      B('iron', x + u, y + .40, z + side * .47, .055, .59, .055, .65);
      B('iron', x + side * .47, y + .40, z + u, .055, .59, .055, .65);
    }
    B('iron', x, y - .08, z, .7, .16, .7, .72);
  }

  for (let i = 0; i < parts; i++) {
    const t = i / (parts - 1);
    const p = point(t);
    for (let j = -3; j <= 3; j++) {
      const q = point(t, j * 1.05);
      // Thin contact patches and chipped arrises follow the same slab orientation.
      for (let n = 0; n < 2; n++) {
        const u = (rng() - .5) * 1.05;
        const v = (rng() - .5) * .7;
        const x = q.x + direction.x * u + normal.x * v;
        const z = q.z + direction.z * u + normal.z * v;
        B(n === 0 ? 'dark' : 'stone', x, p.y + .024 + n * .007, z,
          .12 + rng() * .31, .025 + rng() * .018, .07 + rng() * .2,
          .55 + rng() * .34, angle, false);
      }
      if (rng() < .46) {
        const u = (rng() - .5) * .8;
        B('glaze', q.x + direction.x * u, p.y + .049, q.z + direction.z * u,
          .06 + rng() * .13, .018, .18 + rng() * .42,
          .58 + rng() * .23, angle, false);
      }
      if (rng() < .16) {
        const u = (rng() - .5) * .6;
        const chip = point(t, j * 1.05 + .39);
        B('rock', chip.x + direction.x * u, p.y + .07,
          chip.z + direction.z * u, .06 + rng() * .11, .09, .12, .69, angle);
      }
    }
    if (i % 2 === 0) {
      for (const side of [-1, 1]) {
        const q = point(t, side * 4.0);
        B('iron', q.x, p.y + .52, q.z, .88, .10, 1.03, .53, angle);
        for (const u of [-.29, .29]) {
          const bolt = q.clone().addScaledVector(normal, side * .53).addScaledVector(direction, u);
          B('edge', bolt.x, p.y + .52, bolt.z, .075, .075, .075, .64, angle);
        }
        if (rng() < .45) {
          const q2 = point(t, side * 4.38);
          B('stone', q2.x, p.y + 1.36, q2.z, .22, .08, .055, .97, angle, false);
        }
      }
    }
    if (i % 12 === 3) {
      for (const side of [-1, 1]) {
        const q = point(t, side * 4.5);
        lantern(q.x, p.y + 2.02, q.z);
      }
    }
  }

  // Localised chips on front masonry. Respect every original window and door.
  function weatherFront(cx, front, base, width, height, openings, count) {
    for (let i = 0; i < count; i++) {
      const x = (rng() - .5) * (width - .5);
      const y = rng() * (height - .5) + .25;
      if (openings(x, y)) continue;
      // Keep horizontal trim clean so chips remain attached to a single course.
      if (y % 5.7 < .7) continue;
      const wx = cx + x;
      const wy = base + y;
      const shade = .62 + rng() * .29;
      B(i % 5 ? 'dark' : 'edge', wx, wy, front,
        .035 + rng() * .18, .025 + rng() * .065, .018, shade, 0, false);
      if (i % 4 === 0)
        B('stone', wx + .065, wy - .055, front + .012,
          .055, .02, .025, .93, 0, false);
    }
  }
  weatherFront(13, 19.142, 18.5, 11, 13,
    (x, y) => Math.abs(x) < 3.1 && y > 2.8 && y < 12.9, 270);
  // The nave has one tall central opening; keep chips clear of its full reveal.
  weatherFront(13, 7.141, 33, 21, 21,
    (x, y) => Math.abs(x) < 2.4 && y > 3.6 && y < 16.2, 660);
  weatherFront(13, 13.142, 19, 30, 14,
    (x, y) => Math.abs(x) < 3 && y > 2.6 && y < 12.6, 460);

  // Rubble gathers against the perimeter, leaving the approach and court clear.
  for (let i = 0; i < 160; i++) {
    const theta = rng() * Math.PI * 2;
    const x = 13 + Math.cos(theta) * (24.3 + rng() * 2.4);
    const z = Math.sin(theta) * (19.2 + rng() * 1.5);
    if (Math.abs(x - 13) < 6 && z > 16) continue;
    const s = .09 + rng() * .25;
    B(i % 6 === 0 ? 'ore' : 'rock', x, 18.48 + s * .35, z,
      s * 1.5, s * .7, s, .45 + rng() * .27, rng() * Math.PI);
  }

  blocks.finish();
  return { blockCount: blocks.count };
}
