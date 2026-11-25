import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ZoneId, ZoneSensorState, ApplianceCircuit } from '../types/ecosync';
import {
  createContactShadowPlane,
  createWoodFloorTexture,
  detectSoftwareGl,
} from './studioUtils';

export type SensorKind = 'PIR' | 'LDR' | 'DHT11';

export interface SensorMarkerMeta {
  id: string;
  zoneId: ZoneId;
  kind: SensorKind;
  worldPos: THREE.Vector3;
}

export type CameraViewMode = 'full' | 'interior' | 'room';

export const ROOM_CAMERA_TARGETS: Record<
  ZoneId,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  living: { pos: [-5.9, 5.4, 8.6], target: [-2.95, 1.05, 2.2] },
  study: { pos: [5.9, 5.4, 8.6], target: [2.95, 1.05, 2.2] },
  bedroom: { pos: [-5.6, 6.5, -7.5], target: [-2.95, 1.05, -2.2] },
  kitchen: { pos: [5.6, 6.5, -7.5], target: [2.95, 1.05, -2.2] },
};

export const GLOBAL_CAMERA_PRESETS: Record<
  'full' | 'interior',
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  full: { pos: [12.6, 9.4, 13.4], target: [0, 0.9, 0] },
  interior: { pos: [0.2, 11.8, 7.4], target: [0, 0.7, 0] },
};

function createGrassGroundTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1b2720';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4500; i++) {
    const x = (i * 73) % size;
    const y = (i * 137) % size;
    const shade = (i % 5) * 4;
    ctx.fillStyle = i % 3 === 0 ? `rgb(${24 + shade}, ${40 + shade}, ${31 + shade})` : `rgb(${31 + shade}, ${48 + shade}, ${36 + shade})`;
    ctx.fillRect(x, y, 2, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createStonePatioTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#25292a';
  ctx.fillRect(0, 0, size, size);

  const tile = 128;
  ctx.strokeStyle = 'rgba(12, 14, 15, 0.55)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= size; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createSkyDomeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color(0x0b1218) },
      uHorizonColor: { value: new THREE.Color(0x1b2429) },
      uBottomColor: { value: new THREE.Color(0x111313) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uBottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 col = mix(uHorizonColor, uTopColor, clamp(pow(max(h, 0.0), 0.75), 0.0, 1.0));
        col = mix(uBottomColor, col, smoothstep(-0.15, 0.05, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export interface SmartHomeEngine {
  setCameraGoal: (pos: [number, number, number], target: [number, number, number]) => void;
  syncState: (opts: {
    zones: ZoneSensorState[];
    circuits: ApplianceCircuit[];
    ambientDaylightPct: number;
    selectedRoomId: ZoneId | null;
    showSensors: boolean;
    selectedSensorId: string | null;
  }) => void;
  dispose: () => void;
}

export function mountSmartHomeScene(
  mount: HTMLElement,
  callbacks: {
    onSelectRoom: (zoneId: ZoneId) => void;
    onSelectSensor: (meta: SensorMarkerMeta) => void;
    onUserCameraInteract: () => void;
    onWebglLost: () => void;
  }
): SmartHomeEngine {
  const isSoftwareGl = detectSoftwareGl();

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(mount.clientWidth || 1024, mount.clientHeight || 720);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const fogColor = new THREE.Color(0x161c20);
  scene.background = fogColor;
  scene.fog = new THREE.FogExp2(0x161c20, 0.015);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  pmremGenerator.dispose();

  const camera = new THREE.PerspectiveCamera(
    39,
    (mount.clientWidth || 1024) / (mount.clientHeight || 720),
    0.1,
    140
  );
  camera.position.set(...GLOBAL_CAMERA_PRESETS.full.pos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...GLOBAL_CAMERA_PRESETS.full.target);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.065;
  controls.enablePan = true;
  controls.minDistance = 4.6;
  controls.maxDistance = 26;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI / 2 - 0.08;

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const woodTex = createWoodFloorTexture(maxAnisotropy);
  const grassTex = createGrassGroundTexture(maxAnisotropy);
  const patioTex = createStonePatioTexture(maxAnisotropy);
  textures.push(woodTex, grassTex, patioTex);

  // Sky Dome
  const skyMat = trackMat(createSkyDomeMaterial());
  const skyDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(75, 24, 16)), skyMat);
  scene.add(skyDome);

  // Outdoor Lighting Rig
  const sunLight = new THREE.DirectionalLight(0xfff1d6, 1.8);
  sunLight.position.set(12, 16, 11);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 48;
  sunLight.shadow.camera.left = -12;
  sunLight.shadow.camera.right = 12;
  sunLight.shadow.camera.top = 12;
  sunLight.shadow.camera.bottom = -12;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.025;
  scene.add(sunLight);

  const hemiLight = new THREE.HemisphereLight(0xa5c8e8, 0x1c221d, 0.85);
  scene.add(hemiLight);

  const rimLight = new THREE.DirectionalLight(0x7be0c0, 0.55);
  rimLight.position.set(-10, 6, -12);
  scene.add(rimLight);

  // Shared Architectural Materials
  const grassMat = trackMat(
    new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.94, metalness: 0.02 })
  );
  const patioMat = trackMat(
    new THREE.MeshStandardMaterial({ map: patioTex, roughness: 0.82, metalness: 0.06 })
  );
  const plinthMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1c2021, roughness: 0.82, metalness: 0.08 })
  );
  const woodFloorMat = trackMat(
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62, metalness: 0.05 })
  );
  const wallMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x262b2d, roughness: 0.78, metalness: 0.06 })
  );
  const innerWallMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2f3538, roughness: 0.75, metalness: 0.04 })
  );
  const darkMetalMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x131617, roughness: 0.38, metalness: 0.55 })
  );
  const warmTimberMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x5c4330, roughness: 0.68, metalness: 0.04 })
  );
  const fabricGreyMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3b4248, roughness: 0.9, metalness: 0.02 })
  );
  const fabricLinenMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xcbd5d1, roughness: 0.88, metalness: 0.01 })
  );
  const rugMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2a2f32, roughness: 0.96, metalness: 0.0 })
  );
  const kitchenStoneMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x373e40, roughness: 0.35, metalness: 0.12 })
  );
  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xcfe8f8,
      roughness: 0.08,
      metalness: 0.0,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    })
  );
  const hardwareMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x191d1e, roughness: 0.52, metalness: 0.2 })
  );
  const domeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xdce3e6, roughness: 0.35, metalness: 0.0 })
  );
  const trunkMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3b2c22, roughness: 0.92, metalness: 0.0 })
  );
  const foliageDarkMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x243b2c, roughness: 0.88, metalness: 0.0 })
  );
  const foliageMidMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2f4d38, roughness: 0.85, metalness: 0.0 })
  );

  // =========================================================================
  // LANDSCAPED ARCHITECTURAL SITE (GROUND, PATIO, TREES, SHRUBS, WALKWAY)
  // =========================================================================
  const lawn = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(46, 48)), grassMat);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0;
  lawn.receiveShadow = true;
  scene.add(lawn);

  // Courtyard stone terrace around residence
  const patio = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(15.4, 0.08, 12.6)), patioMat);
  patio.position.set(0, 0.04, 0);
  patio.receiveShadow = true;
  scene.add(patio);

  // Stepping stone path leading from front terrace
  for (let s = 0; s < 4; s++) {
    const stone = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.7, 0.05, 0.75)), patioMat);
    stone.position.set(-1.1, 0.025, 7.1 + s * 1.15);
    stone.receiveShadow = true;
    scene.add(stone);
  }

  // Contact shadow beneath residence
  const houseShadow = createContactShadowPlane(8.8, 0.45);
  houseShadow.position.set(0, 0.082, 0);
  scene.add(houseShadow);

  // Composite Multi-Part Architectural Trees & Shrubs (never single primitives)
  const addTree = (x: number, z: number, scale: number) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.24, 1.5, 10)), trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    const c1 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.1, 1.9, 10)), foliageDarkMat);
    c1.position.y = 2.0;
    c1.castShadow = true;
    const c2 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.85, 1.6, 10)), foliageMidMat);
    c2.position.y = 2.95;
    c2.castShadow = true;
    const c3 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.55, 1.2, 10)), foliageMidMat);
    c3.position.y = 3.75;
    c3.castShadow = true;
    g.add(trunk, c1, c2, c3);
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    scene.add(g);
  };

  const addShrub = (x: number, z: number, scale: number) => {
    const g = new THREE.Group();
    const s1 = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.45, 1)), foliageDarkMat);
    s1.position.set(0, 0.34, 0);
    s1.scale.set(1.2, 0.75, 1.1);
    s1.castShadow = true;
    const s2 = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.32, 1)), foliageMidMat);
    s2.position.set(0.34, 0.26, 0.16);
    s2.castShadow = true;
    const s3 = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.28, 1)), foliageMidMat);
    s3.position.set(-0.28, 0.24, -0.14);
    s3.castShadow = true;
    g.add(s1, s2, s3);
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    scene.add(g);
  };

  addTree(-9.6, -6.8, 1.25);
  addTree(-11.2, 1.8, 1.05);
  addTree(10.2, -6.2, 1.35);
  addTree(10.8, 4.4, 0.95);
  addTree(-5.2, -9.8, 1.15);
  addTree(5.8, -9.5, 1.1);

  addShrub(-7.9, 4.6, 1.0);
  addShrub(-8.1, -2.5, 0.9);
  addShrub(8.1, 3.8, 1.05);
  addShrub(8.2, -3.1, 0.95);
  addShrub(3.4, 6.7, 0.9);

  // =========================================================================
  // ARCHITECTURAL 4-ROOM RESIDENCE
  // =========================================================================
  const houseGroup = new THREE.Group();
  scene.add(houseGroup);

  const plinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(12.4, 0.28, 9.8)), plinthMat);
  plinth.position.set(0, 0.22, 0);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  houseGroup.add(plinth);

  const floor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(11.8, 0.06, 9.2)), woodFloorMat);
  floor.position.set(0, 0.39, 0);
  floor.receiveShadow = true;
  houseGroup.add(floor);

  // Cutaway Architectural Exterior & Interior Partition Walls
  // Center spine walls (dividing 4 quadrants cleanly)
  const midZWallFront = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 2.5, 3.8)), innerWallMat);
  midZWallFront.position.set(0, 1.67, 2.65);
  midZWallFront.castShadow = true;
  midZWallFront.receiveShadow = true;

  const midZWallBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 2.5, 3.8)), innerWallMat);
  midZWallBack.position.set(0, 1.67, -2.65);
  midZWallBack.castShadow = true;
  midZWallBack.receiveShadow = true;

  const midXWallLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.2, 2.5, 0.16)), innerWallMat);
  midXWallLeft.position.set(-3.7, 1.67, 0);
  midXWallLeft.castShadow = true;
  midXWallLeft.receiveShadow = true;

  const midXWallRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.2, 2.5, 0.16)), innerWallMat);
  midXWallRight.position.set(3.7, 1.67, 0);
  midXWallRight.castShadow = true;
  midXWallRight.receiveShadow = true;

  houseGroup.add(midZWallFront, midZWallBack, midXWallLeft, midXWallRight);

  // Left & Right structural corner piers + window glazing so all rooms stay visible
  const buildSideWindowWall = (xPos: number) => {
    const pierBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 2.6, 2.2)), wallMat);
    pierBack.position.set(xPos, 1.72, -3.5);
    pierBack.castShadow = true;
    const pierMid = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 2.6, 1.4)), wallMat);
    pierMid.position.set(xPos, 1.72, 0);
    pierMid.castShadow = true;
    const pierFront = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 2.6, 1.8)), wallMat);
    pierFront.position.set(xPos, 1.72, 3.7);
    pierFront.castShadow = true;
    const glassA = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 2.2, 1.7)), glassMat);
    glassA.position.set(xPos, 1.55, -1.55);
    const glassB = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 2.2, 2.1)), glassMat);
    glassB.position.set(xPos, 1.55, 1.75);
    houseGroup.add(pierBack, pierMid, pierFront, glassA, glassB);
  };
  buildSideWindowWall(-5.85);
  buildSideWindowWall(5.85);

  // Rear structural wall with wide architectural window glazing
  const rearPierL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.2, 2.6, 0.18)), wallMat);
  rearPierL.position.set(-4.75, 1.72, -4.55);
  rearPierL.castShadow = true;
  const rearPierCenter = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.4, 2.6, 0.18)), wallMat);
  rearPierCenter.position.set(0, 1.72, -4.55);
  rearPierCenter.castShadow = true;
  const rearPierR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.2, 2.6, 0.18)), wallMat);
  rearPierR.position.set(4.75, 1.72, -4.55);
  rearPierR.castShadow = true;
  const rearGlassL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.45, 2.2, 0.05)), glassMat);
  rearGlassL.position.set(-2.45, 1.55, -4.55);
  const rearGlassR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.45, 2.2, 0.05)), glassMat);
  rearGlassR.position.set(2.45, 1.55, -4.55);
  houseGroup.add(rearPierL, rearPierCenter, rearPierR, rearGlassL, rearGlassR);

  // Front panoramic low glass balustrade + steel mullion frames
  const frontGlassL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.5, 1.15, 0.05)), glassMat);
  frontGlassL.position.set(-2.95, 1.0, 4.55);
  const frontGlassR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.5, 1.15, 0.05)), glassMat);
  frontGlassR.position.set(2.95, 1.0, 4.55);
  const topFascia = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(12.0, 0.14, 0.22)), darkMetalMat);
  topFascia.position.set(0, 2.98, 4.55);
  houseGroup.add(frontGlassL, frontGlassR, topFascia);

  // =========================================================================
  // ROOM INTERIORS, DYNAMIC LIGHTS, AND ROTATING CEILING FANS
  // =========================================================================
  const roomLights: Record<ZoneId, THREE.PointLight> = {
    living: new THREE.PointLight(0xffdca8, 0, 8.2, 1.7),
    bedroom: new THREE.PointLight(0xffe4be, 0, 7.5, 1.7),
    kitchen: new THREE.PointLight(0xf3f7ff, 0, 8.0, 1.7),
    study: new THREE.PointLight(0xbbe0ff, 0, 7.5, 1.7),
  };

  const bulbMaterials: Record<ZoneId, THREE.MeshStandardMaterial> = {
    living: trackMat(
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfbbf24, emissiveIntensity: 0.05, roughness: 0.2 })
    ),
    bedroom: trackMat(
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xf59e0b, emissiveIntensity: 0.05, roughness: 0.2 })
    ),
    kitchen: trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0x38bdf8, emissiveIntensity: 0.05, roughness: 0.2 })
    ),
    study: trackMat(
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x60a5fa, emissiveIntensity: 0.05, roughness: 0.2 })
    ),
  };

  const fanRotors: Record<ZoneId, THREE.Group> = {
    living: new THREE.Group(),
    bedroom: new THREE.Group(),
    kitchen: new THREE.Group(),
    study: new THREE.Group(),
  };

  const createCeilingFan = (zoneId: ZoneId, x: number, z: number) => {
    const group = fanRotors[zoneId];
    const hub = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 16)),
      hardwareMat
    );
    const stem = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8)),
      darkMetalMat
    );
    stem.position.y = 0.18;
    group.add(hub, stem);
    const bladeGeo = trackGeo(new THREE.BoxGeometry(0.86, 0.02, 0.15));
    for (let b = 0; b < 4; b++) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (b * Math.PI) / 2;
      const blade = new THREE.Mesh(bladeGeo, darkMetalMat);
      blade.position.set(0.49, 0, 0);
      blade.rotation.x = 0.18;
      blade.castShadow = true;
      pivot.add(blade);
      group.add(pivot);
    }
    group.position.set(x, 2.78, z);
    houseGroup.add(group);
  };

  // --- 1. LIVING ROOM (x: -2.95, z: 2.3) ---
  const livingRug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.4, 0.025, 2.4)), rugMat);
  livingRug.position.set(-2.95, 0.435, 2.3);
  livingRug.receiveShadow = true;
  houseGroup.add(livingRug);

  // Sofa composite group
  const sofa = new THREE.Group();
  const sBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.7, 0.34, 0.96)), fabricGreyMat);
  sBase.position.y = 0.21;
  sBase.castShadow = true;
  const sBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.7, 0.48, 0.2)), fabricGreyMat);
  sBack.position.set(0, 0.52, -0.38);
  sBack.castShadow = true;
  const sArmL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.45, 0.96)), fabricGreyMat);
  sArmL.position.set(-1.25, 0.34, 0);
  const sArmR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.45, 0.96)), fabricGreyMat);
  sArmR.position.set(1.25, 0.34, 0);
  sofa.add(sBase, sBack, sArmL, sArmR);
  sofa.position.set(-2.95, 0.42, 1.35);
  houseGroup.add(sofa);

  // Timber coffee table
  const coffeeTable = new THREE.Group();
  const ctTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.4, 0.07, 0.72)), warmTimberMat);
  ctTop.position.y = 0.34;
  ctTop.castShadow = true;
  const ctLeg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.95, 0.3, 0.4)), darkMetalMat);
  ctLeg.position.y = 0.16;
  coffeeTable.add(ctTop, ctLeg);
  coffeeTable.position.set(-2.95, 0.42, 2.65);
  houseGroup.add(coffeeTable);

  // Living pendant fixture + light
  const livingPendant = new THREE.Group();
  const lpCord = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8)), darkMetalMat);
  lpCord.position.y = 0.35;
  const lpShade = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.36, 0.28, 24, 1, true)), hardwareMat);
  const lpBulb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.11, 16, 16)), bulbMaterials.living);
  lpBulb.position.y = -0.05;
  livingPendant.add(lpCord, lpShade, lpBulb);
  livingPendant.position.set(-2.95, 2.55, 2.65);
  houseGroup.add(livingPendant);

  roomLights.living.position.set(-2.95, 2.35, 2.4);
  scene.add(roomLights.living);
  createCeilingFan('living', -2.95, 1.55);

  // --- 2. STUDY ROOM (x: 2.95, z: 2.3) ---
  const desk = new THREE.Group();
  const dTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.3, 0.07, 0.96)), warmTimberMat);
  dTop.position.y = 0.74;
  dTop.castShadow = true;
  const dLegL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.72, 0.85)), darkMetalMat);
  dLegL.position.set(-1.05, 0.36, 0);
  const dLegR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.72, 0.85)), darkMetalMat);
  dLegR.position.set(1.05, 0.36, 0);
  const monitor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.05, 0.56, 0.05)), bulbMaterials.study);
  monitor.position.set(0, 1.15, -0.24);
  const monitorStand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.22, 0.1)), darkMetalMat);
  monitorStand.position.set(0, 0.88, -0.24);
  desk.add(dTop, dLegL, dLegR, monitor, monitorStand);
  desk.position.set(2.95, 0.42, 1.25);
  houseGroup.add(desk);

  // Study task chair + bookcase
  const chair = new THREE.Group();
  const chSeat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.1, 0.56)), fabricGreyMat);
  chSeat.position.y = 0.46;
  const chBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.54, 0.52, 0.09)), fabricGreyMat);
  chBack.position.set(0, 0.75, 0.24);
  const chStem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.05, 0.24, 0.42, 12)), darkMetalMat);
  chStem.position.y = 0.22;
  chair.add(chSeat, chBack, chStem);
  chair.position.set(2.95, 0.42, 2.2);
  houseGroup.add(chair);

  const studyBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.4, 0.08, 0.18)), bulbMaterials.study);
  studyBar.position.set(2.95, 2.58, 2.2);
  houseGroup.add(studyBar);

  roomLights.study.position.set(2.95, 2.35, 2.1);
  scene.add(roomLights.study);
  createCeilingFan('study', 2.95, 2.65);

  // --- 3. BEDROOM (x: -2.95, z: -2.3) ---
  const bed = new THREE.Group();
  const bFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.15, 0.26, 2.45)), warmTimberMat);
  bFrame.position.y = 0.16;
  bFrame.castShadow = true;
  const bMattress = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.0, 0.24, 2.3)), fabricLinenMat);
  bMattress.position.y = 0.39;
  bMattress.castShadow = true;
  const bHeadboard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.25, 0.95, 0.14)), fabricGreyMat);
  bHeadboard.position.set(0, 0.58, -1.16);
  bHeadboard.castShadow = true;
  const bBlanket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.02, 0.06, 1.45)), fabricGreyMat);
  bBlanket.position.set(0, 0.52, 0.42);
  const bPillowL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 0.12, 0.45)), fabricLinenMat);
  bPillowL.position.set(-0.48, 0.55, -0.82);
  const bPillowR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 0.12, 0.45)), fabricLinenMat);
  bPillowR.position.set(0.48, 0.55, -0.82);
  bed.add(bFrame, bMattress, bHeadboard, bBlanket, bPillowL, bPillowR);
  bed.position.set(-2.95, 0.42, -2.55);
  houseGroup.add(bed);

  const nightstand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.52, 0.48)), warmTimberMat);
  nightstand.position.set(-4.5, 0.68, -3.55);
  nightstand.castShadow = true;
  const bedLamp = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.26, 16)), bulbMaterials.bedroom);
  bedLamp.position.set(-4.5, 1.07, -3.55);
  houseGroup.add(nightstand, bedLamp);

  roomLights.bedroom.position.set(-2.95, 2.35, -2.3);
  scene.add(roomLights.bedroom);
  createCeilingFan('bedroom', -2.95, -2.1);

  // --- 4. KITCHEN (x: 2.95, z: -2.3) ---
  const island = new THREE.Group();
  const islBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.8, 0.88, 1.05)), hardwareMat);
  islBase.position.y = 0.44;
  islBase.castShadow = true;
  const islTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.94, 0.08, 1.18)), kitchenStoneMat);
  islTop.position.y = 0.92;
  islTop.castShadow = true;
  island.add(islBase, islTop);
  island.position.set(2.95, 0.42, -1.75);
  houseGroup.add(island);

  const rearCounter = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.4, 0.92, 0.72)), kitchenStoneMat);
  rearCounter.position.set(2.95, 0.88, -3.95);
  rearCounter.castShadow = true;
  const fridge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.88, 2.05, 0.78)), darkMetalMat);
  fridge.position.set(5.1, 1.44, -3.9);
  fridge.castShadow = true;
  const kitchenLightBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.07, 0.16)), bulbMaterials.kitchen);
  kitchenLightBar.position.set(2.95, 2.55, -1.75);
  houseGroup.add(rearCounter, fridge, kitchenLightBar);

  roomLights.kitchen.position.set(2.95, 2.35, -2.1);
  scene.add(roomLights.kitchen);
  createCeilingFan('kitchen', 2.95, -2.8);

  // =========================================================================
  // ECOSYNC CORE & SENSE HARDWARE NODES + MOTION ACTIVITY RINGS
  // =========================================================================
  const coreLedMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x00c987, emissive: 0x00c987, emissiveIntensity: 1.5 })
  );
  const coreGroup = new THREE.Group();
  const coreBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.74, 0.5, 0.14)), hardwareMat);
  const coreLed = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.03, 0.02)), coreLedMat);
  coreLed.position.set(0, 0.02, 0.075);
  coreGroup.add(coreBody, coreLed);
  coreGroup.position.set(0.65, 1.88, -4.38);
  houseGroup.add(coreGroup);

  const senseNodes: Record<
    ZoneId,
    { ledMat: THREE.MeshStandardMaterial; ring: THREE.Mesh; ringMat: THREE.MeshBasicMaterial }
  > = {} as never;

  const senseCoords: Record<ZoneId, { pos: [number, number, number]; rotY: number }> = {
    living: { pos: [-5.68, 2.05, 2.2], rotY: Math.PI / 2 },
    study: { pos: [5.68, 2.05, 2.2], rotY: -Math.PI / 2 },
    bedroom: { pos: [-5.68, 2.05, -2.2], rotY: Math.PI / 2 },
    kitchen: { pos: [5.68, 2.05, -2.2], rotY: -Math.PI / 2 },
  };

  (['living', 'bedroom', 'kitchen', 'study'] as ZoneId[]).forEach((zId) => {
    const cfg = senseCoords[zId];
    const sGroup = new THREE.Group();
    const sBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.34, 0.34, 0.1)), hardwareMat);
    const sDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.1, 14, 10)), domeMat);
    sDome.position.set(0, 0.02, 0.05);
    const ledMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x00c987, emissive: 0x00c987, emissiveIntensity: 0.2 })
    );
    const sLed = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.024, 0.02)), ledMat);
    sLed.position.set(0, -0.1, 0.055);

    const ringMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x00c987,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const ring = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.24, 0.29, 28)), ringMat);
    ring.position.set(0, 0, 0.07);

    sGroup.add(sBox, sDome, sLed, ring);
    sGroup.position.set(...cfg.pos);
    sGroup.rotation.y = cfg.rotY;
    houseGroup.add(sGroup);

    senseNodes[zId] = { ledMat, ring, ringMat };
  });

  // =========================================================================
  // ROOM HITBOXES & EMERALD FLOOR SELECTION OUTLINES (LAYER 1)
  // =========================================================================
  const roomSpecs: Record<ZoneId, { cx: number; cz: number; w: number; d: number }> = {
    living: { cx: -2.95, cz: 2.3, w: 5.5, d: 4.3 },
    study: { cx: 2.95, cz: 2.3, w: 5.5, d: 4.3 },
    bedroom: { cx: -2.95, cz: -2.3, w: 5.5, d: 4.3 },
    kitchen: { cx: 2.95, cz: -2.3, w: 5.5, d: 4.3 },
  };

  const roomPickers: THREE.Mesh[] = [];
  const roomOutlines: Record<ZoneId, { border: THREE.LineLoop; fill: THREE.Mesh }> = {} as never;
  const pickerMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));

  (['living', 'bedroom', 'kitchen', 'study'] as ZoneId[]).forEach((zId) => {
    const sp = roomSpecs[zId];
    const hitMesh = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(sp.w, 2.2, sp.d)),
      pickerMat
    );
    hitMesh.position.set(sp.cx, 1.5, sp.cz);
    hitMesh.userData.zoneId = zId;
    hitMesh.layers.set(1);
    houseGroup.add(hitMesh);
    roomPickers.push(hitMesh);

    const hw = sp.w / 2 - 0.12;
    const hd = sp.d / 2 - 0.12;
    const outlinePts = [
      new THREE.Vector3(-hw, 0, -hd),
      new THREE.Vector3(hw, 0, -hd),
      new THREE.Vector3(hw, 0, hd),
      new THREE.Vector3(-hw, 0, hd),
    ];
    const outlineGeo = trackGeo(new THREE.BufferGeometry().setFromPoints(outlinePts));
    const outlineMat = trackMat(
      new THREE.LineBasicMaterial({ color: 0x00c987, transparent: true, opacity: 0 })
    );
    const border = new THREE.LineLoop(outlineGeo, outlineMat);
    border.position.set(sp.cx, 0.45, sp.cz);

    const fillMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x00c987,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    const fill = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(sp.w - 0.24, sp.d - 0.24)), fillMat);
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(sp.cx, 0.44, sp.cz);

    houseGroup.add(border, fill);
    roomOutlines[zId] = { border, fill };
  });

  // =========================================================================
  // 3D SENSOR MARKERS (PIR, LDR, DHT11) FOR SENSORS MODE (LAYER 2)
  // =========================================================================
  const sensorGroup = new THREE.Group();
  sensorGroup.visible = false;
  houseGroup.add(sensorGroup);

  const sensorPickers: THREE.Mesh[] = [];
  const sensorMetaMap = new Map<string, SensorMarkerMeta>();
  const sensorMeshMap = new Map<string, { sphere: THREE.Mesh; ring: THREE.Mesh }>();

  const KIND_OFFSETS: Record<SensorKind, [number, number, number]> = {
    PIR: [-0.45, 2.32, 0.45],
    LDR: [0.0, 2.32, 0.0],
    DHT11: [0.45, 2.32, -0.45],
  };

  const KIND_COLORS: Record<SensorKind, number> = {
    PIR: 0x00c987,
    LDR: 0xf59e0b,
    DHT11: 0x38bdf8,
  };

  (['living', 'bedroom', 'kitchen', 'study'] as ZoneId[]).forEach((zId) => {
    const sp = roomSpecs[zId];
    (['PIR', 'LDR', 'DHT11'] as SensorKind[]).forEach((kind) => {
      const id = `${zId}-${kind.toLowerCase()}`;
      const off = KIND_OFFSETS[kind];
      const wx = sp.cx + off[0];
      const wy = off[1];
      const wz = sp.cz + off[2];

      const markerHolder = new THREE.Group();
      markerHolder.position.set(wx, wy, wz);

      const sMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: KIND_COLORS[kind],
          emissive: KIND_COLORS[kind],
          emissiveIntensity: 0.9,
          roughness: 0.25,
        })
      );
      const sphere = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.14, 16, 14)), sMat);
      sphere.userData.sensorId = id;
      sphere.layers.set(2);

      const ringMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: KIND_COLORS[kind],
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        })
      );
      const ring = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.19, 0.24, 24)), ringMat);
      ring.rotation.x = -Math.PI / 2;

      const stemMat = trackMat(
        new THREE.MeshBasicMaterial({ color: KIND_COLORS[kind], transparent: true, opacity: 0.4 })
      );
      const stem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 6)), stemMat);
      stem.position.y = -0.35;

      markerHolder.add(sphere, ring, stem);
      sensorGroup.add(markerHolder);

      const meta: SensorMarkerMeta = {
        id,
        zoneId: zId,
        kind,
        worldPos: new THREE.Vector3(wx, wy, wz),
      };
      sensorMetaMap.set(id, meta);
      sensorPickers.push(sphere);
      sensorMeshMap.set(id, { sphere, ring });
    });
  });

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // =========================================================================
  // INTERACTION, SMOOTH CAMERA DAMPING & SYNC LOOP
  // =========================================================================
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = { x: 0, y: 0 };
  let hoveredRoomId: ZoneId | null = null;
  let lastHoverCheck = 0;

  let currentState = {
    zones: [] as ZoneSensorState[],
    circuits: [] as ApplianceCircuit[],
    ambientDaylightPct: 30,
    selectedRoomId: null as ZoneId | null,
    showSensors: false,
    selectedSensorId: null as string | null,
  };

  const cameraGoal = {
    active: false,
    pos: new THREE.Vector3(...GLOBAL_CAMERA_PRESETS.full.pos),
    target: new THREE.Vector3(...GLOBAL_CAMERA_PRESETS.full.target),
  };

  controls.addEventListener('start', () => {
    cameraGoal.active = false;
    callbacks.onUserCameraInteract();
  });

  const updatePointer = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const onPointerDown = (e: PointerEvent) => {
    pointerDown = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - lastHoverCheck < 50) return;
    lastHoverCheck = now;
    updatePointer(e);

    if (currentState.showSensors) {
      raycaster.layers.set(2);
      raycaster.setFromCamera(pointer, camera);
      const sHits = raycaster.intersectObjects(sensorPickers, false);
      if (sHits.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        return;
      }
    }

    raycaster.layers.set(1);
    raycaster.setFromCamera(pointer, camera);
    const rHits = raycaster.intersectObjects(roomPickers, false);
    if (rHits.length > 0) {
      hoveredRoomId = (rHits[0].object.userData.zoneId as ZoneId) ?? null;
      renderer.domElement.style.cursor = 'pointer';
    } else {
      hoveredRoomId = null;
      renderer.domElement.style.cursor = 'grab';
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    const dist = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y);
    if (dist > 6) return;
    updatePointer(e);

    // Sensor markers take click priority when Sensors mode is active
    if (currentState.showSensors) {
      raycaster.layers.set(2);
      raycaster.setFromCamera(pointer, camera);
      const sHits = raycaster.intersectObjects(sensorPickers, false);
      if (sHits.length > 0) {
        const sId = sHits[0].object.userData.sensorId as string | undefined;
        const meta = sId ? sensorMetaMap.get(sId) : undefined;
        if (meta) {
          callbacks.onSelectSensor(meta);
          return;
        }
      }
    }

    raycaster.layers.set(1);
    raycaster.setFromCamera(pointer, camera);
    const rHits = raycaster.intersectObjects(roomPickers, false);
    if (rHits.length > 0) {
      const zId = rHits[0].object.userData.zoneId as ZoneId | undefined;
      if (zId) {
        callbacks.onSelectRoom(zId);
      }
    }
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    callbacks.onWebglLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);

  let lastW = mount.clientWidth || 800;
  let lastH = mount.clientHeight || 600;
  const handleResize = () => {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    if (w <= 0 || h <= 0 || (w === lastW && h === lastH)) return;
    lastW = w;
    lastH = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', handleResize);
  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => handleResize())
      : null;
  resizeObserver?.observe(mount);

  let frameId = 0;
  let disposed = false;
  let lastTime = performance.now();
  let elapsedTime = 0;

  const afterDraw = (cb: () => void) => {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  };

  // Pre-allocated color helpers (Zero GC in render loop)
  const _cDayTop = new THREE.Color(0x1b3448);
  const _cNightTop = new THREE.Color(0x0b1218);
  const _cDayHorizon = new THREE.Color(0x3a525c);
  const _cNightHorizon = new THREE.Color(0x161c20);

  const tick = () => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    elapsedTime += dt;

    // Smooth damped camera goal transition
    if (cameraGoal.active) {
      const k = isSoftwareGl ? 1 : 1 - Math.exp(-5.8 * dt);
      camera.position.lerp(cameraGoal.pos, k);
      controls.target.lerp(cameraGoal.target, k);
      if (
        camera.position.distanceTo(cameraGoal.pos) < 0.04 &&
        controls.target.distanceTo(cameraGoal.target) < 0.04
      ) {
        cameraGoal.active = false;
      }
    }
    controls.update();

    // Update sky & sunlight from ambientDaylightPct
    const dayRatio = currentState.ambientDaylightPct / 100;
    sunLight.intensity = 0.45 + dayRatio * 2.1;
    hemiLight.intensity = 0.55 + dayRatio * 0.55;
    skyMat.uniforms.uTopColor.value.copy(_cNightTop).lerp(_cDayTop, dayRatio);
    skyMat.uniforms.uHorizonColor.value.copy(_cNightHorizon).lerp(_cDayHorizon, dayRatio);
    fogColor.copy(_cNightHorizon).lerp(_cDayHorizon, dayRatio * 0.65);
    (scene.fog as THREE.FogExp2).color.copy(fogColor);

    // Sync Room Lights, Ceiling Fans, Selection Outlines & Sense Activity Rings
    (['living', 'bedroom', 'kitchen', 'study'] as ZoneId[]).forEach((zId) => {
      const zone = currentState.zones.find((z) => z.id === zId);
      const lightOn =
        currentState.circuits.find((c) => c.zoneId === zId && c.category === 'lighting')?.isOn ??
        false;
      const fanOn =
        currentState.circuits.find((c) => c.zoneId === zId && c.category === 'fan')?.isOn ?? false;

      const pLight = roomLights[zId];
      pLight.intensity = THREE.MathUtils.damp(pLight.intensity, lightOn ? 4.2 : 0, 8, dt);
      bulbMaterials[zId].emissiveIntensity = lightOn ? 2.0 : 0.05;

      if (fanOn) {
        fanRotors[zId].rotation.y += dt * 5.2;
      }

      // SENSE indicator & motion ring
      const sNode = senseNodes[zId];
      if (zone && sNode) {
        const occupied = zone.occupied && zone.senseConnected;
        sNode.ledMat.emissiveIntensity = occupied ? 1.8 : 0.1;
        sNode.ledMat.color.setHex(occupied ? 0x00c987 : 0x3b4248);

        if (occupied) {
          const cycle = (elapsedTime * 0.85) % 1;
          const sc = 1 + cycle * 0.9;
          sNode.ring.scale.set(sc, sc, 1);
          sNode.ringMat.opacity = (1 - cycle) * 0.55;
        } else {
          sNode.ringMat.opacity = 0;
        }
      }

      // Room floor outline highlight
      const outline = roomOutlines[zId];
      const isSelected = currentState.selectedRoomId === zId;
      const isHovered = hoveredRoomId === zId;
      const targetBorderOp = isSelected ? 0.95 : isHovered ? 0.55 : 0;
      const targetFillOp = isSelected ? 0.14 : isHovered ? 0.06 : 0;
      const bMat = outline.border.material as THREE.LineBasicMaterial;
      const fMat = outline.fill.material as THREE.MeshBasicMaterial;
      bMat.opacity = THREE.MathUtils.damp(bMat.opacity, targetBorderOp, 10, dt);
      fMat.opacity = THREE.MathUtils.damp(fMat.opacity, targetFillOp, 10, dt);
    });

    // Sensor markers visibility & selected marker highlight
    sensorGroup.visible = currentState.showSensors;
    if (currentState.showSensors) {
      sensorMeshMap.forEach((entry, id) => {
        const selected = currentState.selectedSensorId === id;
        const sc = selected ? 1.38 : 1.0;
        entry.sphere.scale.setScalar(sc);
        entry.ring.scale.setScalar(selected ? 1.55 : 1.0);
        (entry.ring.material as THREE.MeshBasicMaterial).opacity = selected ? 0.95 : 0.45;
      });
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);
  };

  tick();

  return {
    setCameraGoal: (pos, target) => {
      cameraGoal.pos.set(...pos);
      cameraGoal.target.set(...target);
      cameraGoal.active = true;
    },
    syncState: (opts) => {
      currentState = opts;
    },
    dispose: () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      houseShadow.geometry.dispose();
      (houseShadow.material as THREE.MeshBasicMaterial).map?.dispose();
      (houseShadow.material as THREE.Material).dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    },
  };
}
