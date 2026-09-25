import * as THREE from 'three';

const IMAGE_URL = new URL('../assets/scifi-reference.jpg', import.meta.url).href;
const HORIZON_UV = 0.565;
const GRID_X = 240;
const GRID_Y = 156;

function projectRay(u, v, forward, right, up, tanHalfFov, aspect) {
  return forward.clone()
    .addScaledVector(right, (u * 2 - 1) * tanHalfFov * aspect)
    .addScaledVector(up, (1 - v * 2) * tanHalfFov)
    .normalize();
}

function loadReferenceTexture() {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(IMAGE_URL, resolve, undefined, reject);
  });
}

export async function buildSciFiWorld(root, progress = () => {}) {
  progress('载入星渊环境与地貌数据…', 18);
  const reference = await loadReferenceTexture();
  reference.colorSpace = THREE.SRGBColorSpace;
  reference.anisotropy = 8;
  reference.minFilter = THREE.LinearMipmapLinearFilter;
  reference.magFilter = THREE.LinearFilter;
  reference.generateMipmaps = true;
  reference.needsUpdate = true;

  const skyUniforms = {
    referenceMap: { value: reference },
    referenceForward: { value: new THREE.Vector3(0, 0, -1) },
    referenceRight: { value: new THREE.Vector3(1, 0, 0) },
    referenceUp: { value: new THREE.Vector3(0, 1, 0) },
    tanHalfFov: { value: 1 },
    aspect: { value: 1 },
    time: { value: 0 },
  };
  const skyMaterial = new THREE.ShaderMaterial({
    name: 'scifi-reference-projected-nebula',
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vRay;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vRay = world.xyz - cameraPosition;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform sampler2D referenceMap;
      uniform vec3 referenceForward;
      uniform vec3 referenceRight;
      uniform vec3 referenceUp;
      uniform float tanHalfFov;
      uniform float aspect;
      uniform float time;
      varying vec3 vRay;
      void main() {
        vec3 ray = normalize(vRay);
        float depth = dot(ray, referenceForward);
        vec2 uv = vec2(
          0.5 + 0.5 * dot(ray, referenceRight) / max(0.0001, depth * tanHalfFov * aspect),
          0.5 - 0.5 * dot(ray, referenceUp) / max(0.0001, depth * tanHalfFov)
        );
        float visible = step(0.001, depth)
          * step(0.0, uv.x) * step(uv.x, 1.0)
          * step(0.0, uv.y) * step(uv.y, 1.0);
        vec2 textureUv = vec2(uv.x, 1.0 - uv.y);
        vec3 color = texture2D(referenceMap, clamp(textureUv, 0.0, 1.0)).rgb * visible;
        float core = exp(-dot((uv - vec2(0.86, 0.52)) * vec2(0.8, 1.0), (uv - vec2(0.86, 0.52)) * vec2(0.8, 1.0)) * 150.0);
        color += vec3(0.012, 0.011, 0.008) * core * (0.75 + 0.25 * sin(time * 0.55));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(720, 48, 32), skyMaterial);
  sky.name = 'scifi-reference-sky-dome';
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  root.add(sky);

  progress('重建带有起伏深度的潮汐地貌…', 44);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array((GRID_X + 1) * (GRID_Y + 1) * 3);
  const uvs = new Float32Array((GRID_X + 1) * (GRID_Y + 1) * 2);
  const indices = [];
  for (let y = 0; y <= GRID_Y; y++) {
    const v = HORIZON_UV + (1 - HORIZON_UV) * y / GRID_Y;
    for (let x = 0; x <= GRID_X; x++) {
      const u = x / GRID_X;
      const index = y * (GRID_X + 1) + x;
      uvs[index * 2] = u;
      uvs[index * 2 + 1] = 1 - v;
      if (x < GRID_X && y < GRID_Y) {
        const a = index;
        const b = a + GRID_X + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const reliefPixels = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = reference.image.naturalWidth || reference.image.width;
    canvas.height = reference.image.naturalHeight || reference.image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(reference.image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  })();
  const reliefMaterial = new THREE.MeshBasicMaterial({
    name: 'scifi-image-derived-terrain-relief',
    map: reference,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const relief = new THREE.Mesh(geometry, reliefMaterial);
  relief.name = 'scifi-layered-tidal-relief';
  relief.frustumCulled = false;
  relief.renderOrder = -10;
  root.add(relief);

  progress('安置远处探索者与引力核心…', 72);
  const silhouette = new THREE.MeshStandardMaterial({
    color: 0x020505,
    roughness: 0.96,
    metalness: 0,
    emissive: 0x010202,
  });
  const figure = new THREE.Group();
  figure.name = 'solitary-explorer';
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.76, 5, 8), silhouette);
  body.position.y = 0.91;
  figure.add(body);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), silhouette);
  helmet.position.set(0, 1.61, 0.025);
  figure.add(helmet);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.48, 0.17), silhouette);
  pack.position.set(0, 0.96, -0.2);
  figure.add(pack);
  const legs = new THREE.CylinderGeometry(0.055, 0.07, 0.68, 8);
  for (const x of [-0.11, 0.11]) {
    const leg = new THREE.Mesh(legs, silhouette);
    leg.position.set(x, 0.34, 0.015);
    figure.add(leg);
  }
  root.add(figure);

  const coreLight = new THREE.PointLight(0xfff5df, 28, 190, 1.65);
  coreLight.name = 'scifi-gravitational-core-light';
  root.add(coreLight);

  const glowMaterial = new THREE.ShaderMaterial({
    name: 'scifi-core-soft-glow',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float time;
      void main(){
        vec2 p=(vUv-0.5)*vec2(1.0,1.7);
        float d=dot(p,p);
        float halo=exp(-d*13.0);
        float nucleus=exp(-d*155.0);
        float pulse=0.95+0.05*sin(time*0.7);
        vec3 color=mix(vec3(0.62,0.76,0.71),vec3(1.0,0.94,0.78),nucleus);
        gl_FragColor=vec4(color*halo*pulse,halo*0.105);
      }
    `,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMaterial);
  glow.name = 'scifi-soft-core-aura';
  glow.renderOrder = -5;
  root.add(glow);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const localCamera = new THREE.Vector3();
  let viewAspect = 1;
  let viewTanHalfFov = 1;

  function setView(camera, origin) {
    camera.updateMatrixWorld(true);
    camera.getWorldDirection(forward).normalize();
    right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    localCamera.copy(camera.position).sub(origin);
    viewAspect = camera.aspect;
    viewTanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));

    skyUniforms.referenceForward.value.copy(forward);
    skyUniforms.referenceRight.value.copy(right);
    skyUniforms.referenceUp.value.copy(up);
    skyUniforms.tanHalfFov.value = viewTanHalfFov;
    skyUniforms.aspect.value = viewAspect;

    const positionAttribute = geometry.attributes.position;
    const imageWidth = reliefPixels.width;
    const imageHeight = reliefPixels.height;
    for (let y = 0; y <= GRID_Y; y++) {
      const v = HORIZON_UV + (1 - HORIZON_UV) * y / GRID_Y;
      const py = Math.min(imageHeight - 1, Math.floor(v * imageHeight));
      for (let x = 0; x <= GRID_X; x++) {
        const u = x / GRID_X;
        const px = Math.min(imageWidth - 1, Math.floor(u * imageWidth));
        const pixel = (py * imageWidth + px) * 4;
        const red = reliefPixels.data[pixel] / 255;
        const green = reliefPixels.data[pixel + 1] / 255;
        const blue = reliefPixels.data[pixel + 2] / 255;
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        const greenRidge = THREE.MathUtils.clamp((green - Math.max(red, blue) * 0.82) * 5.5, 0, 1);
        const reliefDepth = greenRidge * 3.8 + Math.max(0, luminance - 0.14) * 1.3;
        const ray = projectRay(u, v, forward, right, up, viewTanHalfFov, viewAspect);
        const point = localCamera.clone().addScaledVector(ray, 272 - reliefDepth);
        positionAttribute.setXYZ(y * (GRID_X + 1) + x, point.x, point.y, point.z);
      }
    }
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    const figureRay = projectRay(0.53, 0.654, forward, right, up, viewTanHalfFov, viewAspect);
    figure.position.copy(localCamera).addScaledVector(figureRay, 250);
    figure.rotation.y = Math.atan2(-forward.x, -forward.z);
    const humanScale = (2 * 250 * viewTanHalfFov) * 0.013 / 1.8;
    figure.scale.setScalar(humanScale);

    const coreRay = projectRay(0.86, 0.52, forward, right, up, viewTanHalfFov, viewAspect);
    const corePosition = localCamera.clone().addScaledVector(coreRay, 638);
    coreLight.position.copy(corePosition);
    glow.position.copy(localCamera).addScaledVector(coreRay, 632);
    glow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward.clone().negate());
    const glowHeight = 2 * 632 * viewTanHalfFov * 0.105;
    glow.scale.set(glowHeight * viewAspect * 0.92, glowHeight, 1);
  }

  return {
    blockCount: (GRID_X + 1) * (GRID_Y + 1) + 8,
    setView,
    update(time) {
      skyUniforms.time.value = time;
      glowMaterial.uniforms.time.value = time;
      coreLight.intensity = 27 + Math.sin(time * 0.7) * 1.3;
    },
  };
}
