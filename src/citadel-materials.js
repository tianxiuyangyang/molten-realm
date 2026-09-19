import * as THREE from 'three';

// These materials are isolated from the Crimson Threshold. Texture coordinates
// are measured in world units, including for the heavily scaled cliff instances.
function random(seed = 58313) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function basaltTexture() {
  const size = 512, rng = random();
  const grids = [4, 8, 16, 32, 64, 128, 256].map(n => {
    const data = new Float32Array(n * n);
    for (let i = 0; i < data.length; i++) data[i] = rng();
    return { n, data };
  });
  function value(grid, x, y) {
    const { n, data } = grid;
    const gx = x * n / size, gy = y * n / size;
    const ix = Math.floor(gx), iy = Math.floor(gy);
    let fx = gx - ix, fy = gy - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const i1 = iy * n, i2 = ((iy + 1) % n) * n, j = (ix + 1) % n;
    const a = data[i1 + ix] * (1 - fx) + data[i1 + j] * fx;
    const b = data[i2 + ix] * (1 - fx) + data[i2 + j] * fx;
    return a * (1 - fy) + b * fy;
  }

  // Tileable, broken hairline fractures with short mineral-filled branches.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 44; i++) {
    let x = rng() * size, y = rng() * size, direction = rng() * Math.PI * 2;
    const points = [[x, y]], segments = 5 + Math.floor(rng() * 9);
    for (let j = 0; j < segments; j++) {
      direction += (rng() - .5) * 1.1;
      const length = 3 + rng() * 10;
      x += Math.cos(direction) * length; y += Math.sin(direction) * length;
      points.push([x, y]);
    }
    const width = .55 + rng() * 1.65;
    ctx.lineWidth = width; ctx.strokeStyle = `rgb(${110 + i % 5 * 30},0,0)`;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      ctx.beginPath();
      for (let j = 0; j < points.length; j++) {
        const [px, py] = points[j];
        if (j === 0) ctx.moveTo(px + ox, py + oy);
        else ctx.lineTo(px + ox, py + oy);
      }
      ctx.stroke();
    }
  }
  const fractures = ctx.getImageData(0, 0, size, size).data;
  const pixels = new Uint8Array(size * size * 4);
  const byte = n => Math.max(0, Math.min(255, Math.round(n * 255)));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const cloud = value(grids[0], x, y) * .58 + value(grids[1], x, y) * .42;
    const chips = value(grids[2], x, y) * .58 + value(grids[3], x, y) * .42;
    const grain = value(grids[4], x, y) * .57 + value(grids[5], x, y) * .43;
    const micro = value(grids[6], x, y);
    const crack = fractures[i] / 255;
    const mineral = Math.max(0, grain - .68) * 1.2;
    const pore = Math.max(0, .31 - micro) * Math.max(0, .73 - chips) * 2.25;
    // R: linear albedo variation; G: roughness; B: height; A: broad minerals.
    pixels[i] = byte(.37 + cloud * .36 + chips * .31 + (grain - .5) * .32 + mineral * .8 - crack * .42 - pore * 1.3);
    pixels[i + 1] = byte(.81 + chips * .15 + crack * .12 - mineral * .24);
    pixels[i + 2] = byte(.27 + chips * .32 + grain * .26 + (micro - .5) * .08 - crack * .34 - pore * .5);
    pixels[i + 3] = byte(cloud);
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.name = 'Citadel basalt: albedo / roughness / height / minerals';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

const vertexDeclarations = `
varying vec3 vCitadelPosition;
varying vec3 vCitadelNormal;
varying vec3 vCitadelLocal;
varying vec3 vCitadelSize;
varying vec3 vCitadelFace;
`;

const fragmentDeclarations = `
varying vec3 vCitadelPosition;
varying vec3 vCitadelNormal;
varying vec3 vCitadelLocal;
varying vec3 vCitadelSize;
varying vec3 vCitadelFace;
uniform float citadelScale;
uniform float citadelStrata;
uniform float citadelWear;
vec4 citadelSample(vec3 p, vec3 weights) {
  return texture2D(map, p.yz) * weights.x
       + texture2D(map, p.xz) * weights.y
       + texture2D(map, p.xy) * weights.z;
}
`;

function stone(texture, properties, { scale = .26, strata = .15, wear = .16 } = {}) {
  const material = new THREE.MeshStandardMaterial({
    map: texture, bumpMap: texture, bumpScale: .23,
    roughness: .96, metalness: .015, ...properties,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.citadelScale = { value: scale };
    shader.uniforms.citadelStrata = { value: strata };
    shader.uniforms.citadelWear = { value: wear };
    shader.vertexShader = vertexDeclarations + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec4 citadelWorld = vec4(position, 1.0);
      vec3 citadelN = normal;
      vCitadelLocal = position;
      vCitadelFace = abs(normal);
      vCitadelSize = vec3(1.0);
      #ifdef USE_INSTANCING
        citadelWorld = instanceMatrix * citadelWorld;
        mat3 citadelInstance = mat3(instanceMatrix);
        vCitadelSize = vec3(length(citadelInstance[0]), length(citadelInstance[1]), length(citadelInstance[2]));
        citadelN /= max(vCitadelSize * vCitadelSize, vec3(.00001));
        citadelN = citadelInstance * citadelN;
      #endif
      vCitadelPosition = (modelMatrix * citadelWorld).xyz;
      vCitadelNormal = normalize(mat3(modelMatrix) * citadelN);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_pars_fragment>', `
      #include <map_pars_fragment>
      ${fragmentDeclarations}
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      vec3 citadelWeights = pow(abs(normalize(vCitadelNormal)), vec3(8.0));
      citadelWeights /= max(dot(citadelWeights, vec3(1.0)), .0001);
      vec4 citadelTex = citadelSample(vCitadelPosition * citadelScale, citadelWeights);
      vec4 citadelBroad = citadelSample(vCitadelPosition * .023 + vec3(.27), citadelWeights);
      float citadelBand = sin(vCitadelPosition.y * 2.6 + citadelBroad.a * 14.0 + sin(vCitadelPosition.y * .41));
      float citadelSeam = 1.0 - smoothstep(.035, .20, abs(citadelBand));
      float citadelGeology = 1.0 + citadelStrata * ((citadelBroad.r - .69) * 1.2 + citadelBand * .065 - citadelSeam * .17);
      vec3 citadelEdgeDistances = max(vec3(0.0), .5 - abs(vCitadelLocal)) * vCitadelSize;
      vec3 citadelFaceWeights = pow(vCitadelFace, vec3(8.0));
      citadelFaceWeights /= max(dot(citadelFaceWeights, vec3(1.0)), .0001);
      float citadelEdgeDistance = dot(vec3(min(citadelEdgeDistances.y, citadelEdgeDistances.z), min(citadelEdgeDistances.x, citadelEdgeDistances.z), min(citadelEdgeDistances.x, citadelEdgeDistances.y)), citadelFaceWeights);
      float citadelEdge = (1.0 - smoothstep(.012, .075, citadelEdgeDistance)) * smoothstep(.51, .77, citadelTex.r);
      float citadelAlbedo = citadelTex.r * citadelGeology + citadelEdge * citadelWear;
      diffuseColor.rgb *= citadelAlbedo;
      // Small mineral and ash variation leaves the warm/cool balance to actual lights.
      diffuseColor.rgb *= mix(vec3(.96, .985, 1.025), vec3(1.04, 1.015, .98), citadelBroad.a);
      float citadelHeight = citadelTex.b - citadelSeam * citadelStrata * .08;
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
      float roughnessFactor = clamp(roughness * citadelTex.g - citadelEdge * .11, .58, 1.0);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
      vec2 citadelSlope = vec2(dFdx(citadelHeight), dFdy(citadelHeight));
      normal = perturbNormalArb(-vViewPosition, normal, citadelSlope * bumpScale, faceDirection);
    `);
  };
  material.customProgramCacheKey = () => 'citadel-world-basalt-v2';
  return material;
}

export function citadelMaterials() {
  const texture = basaltTexture();
  return {
    stone: stone(texture, { color: 0x646872, roughness: .93 }, { strata: .12, wear: .15 }),
    dark: stone(texture, { color: 0x353740, roughness: .88 }, { strata: .12, wear: .10 }),
    edge: stone(texture, { color: 0x81858b, roughness: .83 }, { scale: .34, strata: .08, wear: .13 }),
    rock: stone(texture, { color: 0x50535c, roughness: .94, bumpScale: .44 }, { scale: .20, strata: 1, wear: .075 }),
    ore: stone(texture, { color: 0x542c25, emissive: 0x4b0c03, emissiveIntensity: .12 }, { scale: .31, strata: .6, wear: .08 }),
    red: stone(texture, { color: 0xa32329, emissive: 0x320305, emissiveIntensity: .09, roughness: .83 }, { scale: .52, strata: 0, wear: .035 }),
    stem: stone(texture, { color: 0xa17e63, bumpScale: .15 }, { scale: .43, strata: .22, wear: .07 }),
    hot: new THREE.MeshStandardMaterial({ color: 0xffd97b, emissive: 0xff8417, emissiveIntensity: 3.0, roughness: .52 }),
    magma: new THREE.MeshStandardMaterial({ color: 0xff6509, emissive: 0xff3902, emissiveIntensity: 2.5, roughness: .8 }),
    ember: new THREE.MeshStandardMaterial({ color: 0xffb42b, emissive: 0xff6106, emissiveIntensity: 3.8, roughness: .75 }),
  };
}
