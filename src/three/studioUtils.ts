import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

export function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export interface StudioContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  isSoftwareGl: boolean;
  maxAnisotropy: number;
  disposeEnvironment: () => void;
}

export function createStudioContext(
  container: HTMLElement,
  backgroundHex = 0x090a0b
): StudioContext {
  const isSoftwareGl = detectSoftwareGl();

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundHex);
  scene.fog = new THREE.FogExp2(backgroundHex, 0.025);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  pmremGenerator.dispose();

  // Warm key directional light
  const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
  keyLight.position.set(5, 7, 5);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 25;
  const d = 5;
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  // Cool hemisphere fill
  const hemiLight = new THREE.HemisphereLight(0xcbe2ff, 0x1a1e24, 0.75);
  scene.add(hemiLight);

  // Crisp emerald-tinted rim light from rear-left
  const rimLight = new THREE.DirectionalLight(0xa7f3d0, 1.35);
  rimLight.position.set(-5, 3, -5);
  scene.add(rimLight);

  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    const softbox = new THREE.RectAreaLight(0xffffff, 2.2, 6, 3);
    softbox.position.set(0, 6, 3);
    softbox.lookAt(0, 0, 0);
    scene.add(softbox);
  }

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  return {
    renderer,
    scene,
    isSoftwareGl,
    maxAnisotropy,
    disposeEnvironment: () => {
      envTarget.dispose();
    },
  };
}

export function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

export function createPolycarbonateBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = 115 + Math.floor(Math.random() * 26);
    imgData.data[i] = v;
    imgData.data[i + 1] = v;
    imgData.data[i + 2] = v;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createPcbTexture(
  variant: 'core' | 'sense',
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep matte emerald-black solder mask
  ctx.fillStyle = '#09241b';
  ctx.fillRect(0, 0, size, size);

  // Subtle internal ground plane grid
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.14)';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Copper/emerald signal traces
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  const traceCount = variant === 'core' ? 18 : 12;
  for (let t = 0; t < traceCount; t++) {
    const y = 36 + (t * (size - 72)) / traceCount;
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(140 + (t % 4) * 32, y);
    ctx.lineTo(175 + (t % 4) * 32, y + (t % 2 === 0 ? 18 : -18));
    ctx.lineTo(size - 36, y + (t % 2 === 0 ? 18 : -18));
    ctx.stroke();
  }

  // High-voltage isolation silkscreen boundary on CORE
  if (variant === 'core') {
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(size * 0.56, 20);
    ctx.lineTo(size * 0.56, size - 20);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Gold plated vias & pads
  ctx.fillStyle = '#d4af37';
  for (let p = 0; p < 28; p++) {
    const px = 40 + ((p * 67) % (size - 80));
    const py = 40 + ((p * 97) % (size - 80));
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#05150f';
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4af37';
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createLdrTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d6cfc2';
  ctx.fillRect(0, 0, size, size);

  // Serpentine CdS photoresistor track
  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const y = 38 + i * 26;
    if (i === 0) ctx.moveTo(40, y);
    else ctx.lineTo(i % 2 === 0 ? 40 : size - 40, y);
    ctx.lineTo(i % 2 === 0 ? size - 40 : 40, y);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWoodFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2d2219';
  ctx.fillRect(0, 0, size, size);

  const plankH = 64;
  for (let row = 0; row < size / plankH; row++) {
    const y = row * plankH;
    const toneShift = (row % 3) * 6 - 6;
    ctx.fillStyle = `rgb(${46 + toneShift}, ${34 + toneShift}, ${25 + toneShift})`;
    ctx.fillRect(0, y, size, plankH - 2);

    ctx.strokeStyle = 'rgba(18, 13, 9, 0.45)';
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 6; g++) {
      ctx.beginPath();
      ctx.moveTo(0, y + 10 + g * 9);
      ctx.bezierCurveTo(170, y + 8 + g * 9, 340, y + 14 + g * 9, size, y + 10 + g * 9);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowPlane(radius = 3.2, opacity = 0.48): THREE.Mesh {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
  grad.addColorStop(0.55, `rgba(0, 0, 0, ${opacity * 0.4})`);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
