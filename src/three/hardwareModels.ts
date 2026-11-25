import * as THREE from 'three';
import {
  createLdrTexture,
  createPcbTexture,
  createPolycarbonateBumpTexture,
  createRoundedRectShape,
} from './studioUtils';

export interface CoreHardwareParts {
  root: THREE.Group;
  topEnclosure: THREE.Group;
  bottomEnclosure: THREE.Group;
  mainPcb: THREE.Group;
  esp32Module: THREE.Group;
  energyModule: THREE.Group;
  relayModule: THREE.Group;
  powerSupply: THREE.Group;
  dispose: () => void;
}

export interface SenseHardwareParts {
  root: THREE.Group;
  frontEnclosure: THREE.Group;
  fresnelLens: THREE.Group;
  ldrSensor: THREE.Group;
  dht11Sensor: THREE.Group;
  interfacePcb: THREE.Group;
  wirelessModule: THREE.Group;
  mountingPlate: THREE.Group;
  dispose: () => void;
}

export function buildCoreHardwareModel(maxAnisotropy: number): CoreHardwareParts {
  const root = new THREE.Group();
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

  const polyBump = createPolycarbonateBumpTexture(maxAnisotropy);
  const pcbTex = createPcbTexture('core', maxAnisotropy);
  textures.push(polyBump, pcbTex);

  const matteCharcoal = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1c1f24,
      roughness: 0.62,
      metalness: 0.12,
      bumpMap: polyBump,
      bumpScale: 0.004,
    })
  );

  const darkTrim = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.45,
      metalness: 0.35,
    })
  );

  const emeraldLedMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
    })
  );

  const pcbMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: pcbTex,
      roughness: 0.55,
      metalness: 0.2,
    })
  );

  const brushedMetal = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x9ca3af,
      metalness: 0.9,
      roughness: 0.22,
      anisotropy: 0.75,
    })
  );

  const goldPinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.2,
    })
  );

  const copperCoilMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xb87333,
      metalness: 0.85,
      roughness: 0.28,
    })
  );

  const relayBlueMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.4,
      metalness: 0.08,
    })
  );

  const transformerYellowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      roughness: 0.5,
      metalness: 0.05,
    })
  );

  const darkIcMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x15181c,
      roughness: 0.38,
      metalness: 0.2,
    })
  );

  // 1. TOP ENCLOSURE (Bevelled matte charcoal polycarbonate shell + emerald LED slit)
  const topEnclosure = new THREE.Group();
  const shellShape = createRoundedRectShape(3.2, 2.2, 0.18);
  const topShellGeo = trackGeo(
    new THREE.ExtrudeGeometry(shellShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
    })
  );
  topShellGeo.rotateX(-Math.PI / 2);
  topShellGeo.center();
  const topShellMesh = new THREE.Mesh(topShellGeo, matteCharcoal);
  topShellMesh.castShadow = true;
  topShellMesh.receiveShadow = true;
  topEnclosure.add(topShellMesh);

  // Seam groove & emerald LED bar
  const ledGeo = trackGeo(new THREE.BoxGeometry(0.75, 0.04, 0.06));
  const ledMesh = new THREE.Mesh(ledGeo, emeraldLedMat);
  ledMesh.position.set(0.35, 0.18, 0.15);
  topEnclosure.add(ledMesh);

  const grooveGeo = trackGeo(new THREE.BoxGeometry(3.22, 0.02, 0.03));
  const grooveMesh = new THREE.Mesh(grooveGeo, darkTrim);
  grooveMesh.position.set(0, 0.17, 0.15);
  topEnclosure.add(grooveMesh);

  topEnclosure.position.set(0, 0.22, 0);
  root.add(topEnclosure);

  // 2. BOTTOM ENCLOSURE (Base chassis + side cooling vents)
  const bottomEnclosure = new THREE.Group();
  const botShellGeo = trackGeo(
    new THREE.ExtrudeGeometry(shellShape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
    })
  );
  botShellGeo.rotateX(-Math.PI / 2);
  botShellGeo.center();
  const botShellMesh = new THREE.Mesh(botShellGeo, matteCharcoal);
  botShellMesh.castShadow = true;
  botShellMesh.receiveShadow = true;
  bottomEnclosure.add(botShellMesh);

  // Side ventilation fins (instanced for clean draw calls)
  const finGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.14, 0.08));
  const finInst = new THREE.InstancedMesh(finGeo, darkTrim, 12);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 6; i++) {
    dummy.position.set(1.62, 0.02, -0.5 + i * 0.2);
    dummy.updateMatrix();
    finInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(-1.62, 0.02, -0.5 + i * 0.2);
    dummy.updateMatrix();
    finInst.setMatrixAt(i + 6, dummy.matrix);
  }
  finInst.instanceMatrix.needsUpdate = true;
  finInst.computeBoundingSphere();
  bottomEnclosure.add(finInst);

  bottomEnclosure.position.set(0, -0.18, 0);
  root.add(bottomEnclosure);

  // 3. MAIN PCB (Connects electronic components & coordinates operation)
  const mainPcb = new THREE.Group();
  const pcbGeo = trackGeo(new THREE.BoxGeometry(2.85, 0.06, 1.85));
  const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
  pcbMesh.castShadow = true;
  pcbMesh.receiveShadow = true;
  mainPcb.add(pcbMesh);

  // Screw terminal block along rear edge
  const termBaseGeo = trackGeo(new THREE.BoxGeometry(1.1, 0.16, 0.24));
  const termBase = new THREE.Mesh(termBaseGeo, emeraldLedMat);
  termBase.material = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.5, metalness: 0.1 })
  );
  termBase.position.set(0.6, 0.11, -0.74);
  mainPcb.add(termBase);

  const screwGeo = trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12));
  for (let s = 0; s < 5; s++) {
    const screw = new THREE.Mesh(screwGeo, brushedMetal);
    screw.position.set(0.2 + s * 0.2, 0.2, -0.74);
    mainPcb.add(screw);
  }

  // Socket header rails on PCB for ESP32
  const headerGeo = trackGeo(new THREE.BoxGeometry(0.75, 0.08, 0.06));
  const header1 = new THREE.Mesh(headerGeo, darkIcMat);
  header1.position.set(-0.75, 0.07, -0.22);
  const header2 = new THREE.Mesh(headerGeo, darkIcMat);
  header2.position.set(-0.75, 0.07, 0.22);
  mainPcb.add(header1, header2);

  mainPcb.position.set(0, 0.0, 0);
  root.add(mainPcb);

  // 4. ESP32 MICROCONTROLLER MODULE
  const esp32Module = new THREE.Group();
  const espBoardGeo = trackGeo(new THREE.BoxGeometry(0.88, 0.04, 0.56));
  const espBoard = new THREE.Mesh(espBoardGeo, darkIcMat);
  espBoard.castShadow = true;
  esp32Module.add(espBoard);

  const rfShieldGeo = trackGeo(new THREE.BoxGeometry(0.48, 0.09, 0.44));
  const rfShield = new THREE.Mesh(rfShieldGeo, brushedMetal);
  rfShield.position.set(-0.08, 0.06, 0);
  rfShield.castShadow = true;
  esp32Module.add(rfShield);

  // Gold PCB antenna trace at right edge
  const antGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.015, 0.36));
  const ant = new THREE.Mesh(antGeo, goldPinMat);
  ant.position.set(0.32, 0.025, 0);
  esp32Module.add(ant);

  // Dual rows of gold pins
  const pinGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8));
  for (let p = 0; p < 8; p++) {
    const px = -0.35 + p * 0.1;
    const pinTop = new THREE.Mesh(pinGeo, goldPinMat);
    pinTop.position.set(px, -0.05, -0.22);
    const pinBot = new THREE.Mesh(pinGeo, goldPinMat);
    pinBot.position.set(px, -0.05, 0.22);
    esp32Module.add(pinTop, pinBot);
  }

  esp32Module.position.set(-0.75, 0.12, 0);
  root.add(esp32Module);

  // 5. ENERGY MONITORING MODULE (PZEM-004T architecture with CT toroid + shunt)
  const energyModule = new THREE.Group();
  const emBoardGeo = trackGeo(new THREE.BoxGeometry(0.95, 0.04, 0.72));
  const emBoard = new THREE.Mesh(emBoardGeo, pcbMat);
  emBoard.castShadow = true;
  energyModule.add(emBoard);

  // Toroidal Current Transformer Coil
  const toroidCoreGeo = trackGeo(new THREE.TorusGeometry(0.16, 0.055, 16, 32));
  const toroidCore = new THREE.Mesh(toroidCoreGeo, darkIcMat);
  toroidCore.rotation.x = Math.PI / 2;
  toroidCore.position.set(-0.22, 0.1, 0.1);
  energyModule.add(toroidCore);

  const toroidWireGeo = trackGeo(new THREE.TorusGeometry(0.16, 0.06, 10, 24, Math.PI * 1.4));
  const toroidWire = new THREE.Mesh(toroidWireGeo, copperCoilMat);
  toroidWire.rotation.x = Math.PI / 2;
  toroidWire.position.set(-0.22, 0.1, 0.1);
  energyModule.add(toroidWire);

  // Shunt bar + metering IC
  const shuntGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.06, 0.05));
  const shunt = new THREE.Mesh(shuntGeo, copperCoilMat);
  shunt.position.set(0.22, 0.05, -0.15);
  const meteringIcGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.04, 0.18));
  const meteringIc = new THREE.Mesh(meteringIcGeo, darkIcMat);
  meteringIc.position.set(0.2, 0.04, 0.14);
  energyModule.add(shunt, meteringIc);

  energyModule.position.set(0.68, 0.08, 0.38);
  root.add(energyModule);

  // 6. RELAY SWITCHING CIRCUITRY
  const relayModule = new THREE.Group();
  const relaySubBoardGeo = trackGeo(new THREE.BoxGeometry(0.92, 0.035, 0.56));
  const relaySubBoard = new THREE.Mesh(relaySubBoardGeo, darkTrim);
  relayModule.add(relaySubBoard);

  const relayCubeGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.24, 0.28));
  for (let r = 0; r < 2; r++) {
    const relay = new THREE.Mesh(relayCubeGeo, relayBlueMat);
    relay.position.set(-0.2 + r * 0.4, 0.14, 0);
    relay.castShadow = true;
    relayModule.add(relay);
  }

  // Optocoupler chips
  const optoGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.05, 0.08));
  for (let o = 0; o < 2; o++) {
    const opto = new THREE.Mesh(optoGeo, darkIcMat);
    opto.position.set(-0.2 + o * 0.4, 0.04, 0.22);
    relayModule.add(opto);
  }

  relayModule.position.set(0.72, 0.07, -0.28);
  root.add(relayModule);

  // 7. ISOLATED POWER SUPPLY
  const powerSupply = new THREE.Group();
  const psuBoardGeo = trackGeo(new THREE.BoxGeometry(0.84, 0.035, 0.62));
  const psuBoard = new THREE.Mesh(psuBoardGeo, darkTrim);
  powerSupply.add(psuBoard);

  // Isolation transformer
  const txBodyGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.22, 0.26));
  const txBody = new THREE.Mesh(txBodyGeo, transformerYellowMat);
  txBody.position.set(-0.14, 0.13, 0);
  txBody.castShadow = true;
  powerSupply.add(txBody);

  // Electrolytic capacitors
  const capGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.18, 16));
  const cap1 = new THREE.Mesh(capGeo, darkIcMat);
  cap1.position.set(0.22, 0.11, -0.14);
  const cap2 = new THREE.Mesh(capGeo, darkIcMat);
  cap2.position.set(0.22, 0.11, 0.14);
  const capTopGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 16));
  const capTop1 = new THREE.Mesh(capTopGeo, brushedMetal);
  capTop1.position.set(0.22, 0.205, -0.14);
  const capTop2 = new THREE.Mesh(capTopGeo, brushedMetal);
  capTop2.position.set(0.22, 0.205, 0.14);
  powerSupply.add(cap1, cap2, capTop1, capTop2);

  powerSupply.position.set(-0.72, 0.06, -0.46);
  root.add(powerSupply);

  return {
    root,
    topEnclosure,
    bottomEnclosure,
    mainPcb,
    esp32Module,
    energyModule,
    relayModule,
    powerSupply,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}

export function buildSenseHardwareModel(
  maxAnisotropy: number,
  isSoftwareGl: boolean
): SenseHardwareParts {
  const root = new THREE.Group();
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

  const polyBump = createPolycarbonateBumpTexture(maxAnisotropy);
  const pcbTex = createPcbTexture('sense', maxAnisotropy);
  const ldrTex = createLdrTexture(maxAnisotropy);
  textures.push(polyBump, pcbTex, ldrTex);

  const matteCharcoal = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1c1f24,
      roughness: 0.62,
      metalness: 0.12,
      bumpMap: polyBump,
      bumpScale: 0.004,
    })
  );

  const darkTrim = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.45,
      metalness: 0.35,
    })
  );

  const fresnelMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf1f5f9,
      roughness: 0.25,
      metalness: 0.0,
      transmission: isSoftwareGl ? 0 : 0.72,
      transparent: true,
      opacity: isSoftwareGl ? 0.65 : 0.92,
      ior: 1.48,
      thickness: 0.4,
      flatShading: true,
    })
  );

  const pcbMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: pcbTex,
      roughness: 0.55,
      metalness: 0.2,
    })
  );

  const ldrFaceMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: ldrTex,
      roughness: 0.25,
      metalness: 0.1,
    })
  );

  const dhtBlueMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.45,
      metalness: 0.05,
    })
  );

  const brushedMetal = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x9ca3af,
      metalness: 0.9,
      roughness: 0.22,
      anisotropy: 0.7,
    })
  );

  const goldPinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2,
    })
  );

  // 1. FRONT OUTER ENCLOSURE
  const frontEnclosure = new THREE.Group();
  const faceShape = createRoundedRectShape(2.1, 2.1, 0.22);
  const frontGeo = trackGeo(
    new THREE.ExtrudeGeometry(faceShape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 4,
    })
  );
  frontGeo.center();
  const frontMesh = new THREE.Mesh(frontGeo, matteCharcoal);
  frontMesh.castShadow = true;
  frontMesh.receiveShadow = true;
  frontEnclosure.add(frontMesh);

  // Bezel ring around Fresnel dome
  const bezelGeo = trackGeo(new THREE.TorusGeometry(0.56, 0.045, 16, 48));
  const bezelMesh = new THREE.Mesh(bezelGeo, darkTrim);
  bezelMesh.position.set(0, 0.08, 0.16);
  frontEnclosure.add(bezelMesh);

  // Subtle acoustic / thermal grille slots at bottom front
  const slotGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.05, 0.04));
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 7; col++) {
      const slot = new THREE.Mesh(slotGeo, darkTrim);
      slot.position.set(-0.3 + col * 0.1, -0.68 - row * 0.09, 0.16);
      frontEnclosure.add(slot);
    }
  }

  frontEnclosure.position.set(0, 0, 0.22);
  root.add(frontEnclosure);

  // 2. PIR FRESNEL LENS
  const fresnelLens = new THREE.Group();
  const domeGeo = trackGeo(new THREE.IcosahedronGeometry(0.52, 2));
  // Clip bottom hemisphere visually by scaling & offsetting
  const dome = new THREE.Mesh(domeGeo, fresnelMat);
  dome.scale.set(1, 1, 0.72);
  fresnelLens.add(dome);

  const collarGeo = trackGeo(new THREE.CylinderGeometry(0.53, 0.55, 0.08, 32));
  collarGeo.rotateX(Math.PI / 2);
  const collar = new THREE.Mesh(collarGeo, darkTrim);
  collar.position.set(0, 0, -0.04);
  fresnelLens.add(collar);

  fresnelLens.position.set(0, 0.08, 0.4);
  root.add(fresnelLens);

  // 3. LDR LIGHT SENSOR
  const ldrSensor = new THREE.Group();
  const ldrDiscGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24));
  ldrDiscGeo.rotateX(Math.PI / 2);
  const ldrDisc = new THREE.Mesh(ldrDiscGeo, ldrFaceMat);
  ldrSensor.add(ldrDisc);

  const leadGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8));
  leadGeo.rotateX(Math.PI / 2);
  const lead1 = new THREE.Mesh(leadGeo, brushedMetal);
  lead1.position.set(-0.06, 0, -0.14);
  const lead2 = new THREE.Mesh(leadGeo, brushedMetal);
  lead2.position.set(0.06, 0, -0.14);
  ldrSensor.add(lead1, lead2);

  ldrSensor.position.set(-0.56, -0.45, 0.12);
  root.add(ldrSensor);

  // 4. DHT11 TEMPERATURE & HUMIDITY SENSOR
  const dht11Sensor = new THREE.Group();
  const dhtBodyGeo = trackGeo(new THREE.BoxGeometry(0.42, 0.52, 0.18));
  const dhtBody = new THREE.Mesh(dhtBodyGeo, dhtBlueMat);
  dhtBody.castShadow = true;
  dht11Sensor.add(dhtBody);

  // Front grille bars on DHT11
  const barGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.03, 0.03));
  for (let b = 0; b < 4; b++) {
    const bar = new THREE.Mesh(barGeo, darkTrim);
    bar.position.set(0, -0.1 + b * 0.09, 0.09);
    dht11Sensor.add(bar);
  }

  // 4 metallic pins
  const dhtPinGeo = trackGeo(new THREE.BoxGeometry(0.025, 0.16, 0.025));
  for (let p = 0; p < 4; p++) {
    const pin = new THREE.Mesh(dhtPinGeo, goldPinMat);
    pin.position.set(-0.12 + p * 0.08, -0.34, 0);
    dht11Sensor.add(pin);
  }

  dht11Sensor.position.set(0.54, -0.42, 0.12);
  root.add(dht11Sensor);

  // 5. SENSOR-INTERFACE PCB
  const interfacePcb = new THREE.Group();
  const pcbShape = createRoundedRectShape(1.75, 1.75, 0.14);
  const pcbGeo = trackGeo(
    new THREE.ExtrudeGeometry(pcbShape, {
      depth: 0.06,
      bevelEnabled: false,
    })
  );
  pcbGeo.center();
  const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
  pcbMesh.castShadow = true;
  interfacePcb.add(pcbMesh);

  // Pyroelectric infrared sensor can in center of PCB
  const pirCanGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.19, 0.14, 24));
  pirCanGeo.rotateX(Math.PI / 2);
  const pirCan = new THREE.Mesh(pirCanGeo, brushedMetal);
  pirCan.position.set(0, 0.08, 0.09);
  const pirWinGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.11, 0.03));
  const pirWin = new THREE.Mesh(pirWinGeo, darkTrim);
  pirWin.position.set(0, 0.08, 0.16);
  interfacePcb.add(pirCan, pirWin);

  interfacePcb.position.set(0, 0, 0);
  root.add(interfacePcb);

  // 6. WIRELESS COMMUNICATION ELECTRONICS
  const wirelessModule = new THREE.Group();
  const wlBoardGeo = trackGeo(new THREE.BoxGeometry(0.66, 0.48, 0.05));
  const wlBoard = new THREE.Mesh(wlBoardGeo, darkTrim);
  wirelessModule.add(wlBoard);

  const wlShieldGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.34, 0.08));
  const wlShield = new THREE.Mesh(wlShieldGeo, brushedMetal);
  wlShield.position.set(-0.08, 0, -0.05);
  wirelessModule.add(wlShield);

  const wlAntGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.36, 0.02));
  const wlAnt = new THREE.Mesh(wlAntGeo, goldPinMat);
  wlAnt.position.set(0.22, 0, -0.03);
  wirelessModule.add(wlAnt);

  wirelessModule.position.set(0, 0.25, -0.14);
  root.add(wirelessModule);

  // 7. REAR MOUNTING PLATE
  const mountingPlate = new THREE.Group();
  const backGeo = trackGeo(
    new THREE.ExtrudeGeometry(faceShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    })
  );
  backGeo.center();
  const backMesh = new THREE.Mesh(backGeo, matteCharcoal);
  backMesh.castShadow = true;
  mountingPlate.add(backMesh);

  // Keyhole mount recesses
  const keyholeGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16));
  keyholeGeo.rotateX(Math.PI / 2);
  const kh1 = new THREE.Mesh(keyholeGeo, darkTrim);
  kh1.position.set(-0.48, 0.48, -0.08);
  const kh2 = new THREE.Mesh(keyholeGeo, darkTrim);
  kh2.position.set(0.48, 0.48, -0.08);
  mountingPlate.add(kh1, kh2);

  mountingPlate.position.set(0, 0, -0.26);
  root.add(mountingPlate);

  return {
    root,
    frontEnclosure,
    fresnelLens,
    ldrSensor,
    dht11Sensor,
    interfacePcb,
    wirelessModule,
    mountingPlate,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
