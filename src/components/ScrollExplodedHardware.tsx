import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { ExplodedStage } from '../types/ecosync';
import { createContactShadowPlane, createStudioContext } from '../three/studioUtils';
import { buildCoreHardwareModel, buildSenseHardwareModel } from '../three/hardwareModels';

interface ScrollExplodedHardwareProps {
  id: string;
  productType: 'core' | 'sense';
  title: string;
  subtitle: string;
  stages: ExplodedStage[];
  trackHeightClass?: string;
  frameSequenceUrls?: string[];
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Compute separation amount (0 = assembled, 1 = fully separated) with smooth reassembly at the end
function computePhaseEnvelope(
  progress: number,
  enterStart: number,
  enterEnd: number,
  reassembleStart: number,
  reassembleEnd: number
): number {
  const open = smoothstep(enterStart, enterEnd, progress);
  const close = smoothstep(reassembleStart, reassembleEnd, progress);
  return open * (1 - close);
}

export const ScrollExplodedHardware: React.FC<ScrollExplodedHardwareProps> = ({
  id,
  productType,
  title,
  subtitle,
  stages,
  trackHeightClass = 'h-[480vh]',
  frameSequenceUrls,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const seqCanvasRef = useRef<HTMLCanvasElement>(null);

  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);

  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const lastUiSyncRef = useRef(-1);

  const hasImageSequence = Boolean(frameSequenceUrls && frameSequenceUrls.length > 0);

  const syncUiFromProgress = useCallback(
    (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      if (Math.abs(clamped - lastUiSyncRef.current) < 0.004) return;
      lastUiSyncRef.current = clamped;
      setProgressPct(Math.round(clamped * 100));

      let matched = stages.length - 1;
      for (let i = 0; i < stages.length; i++) {
        const [min, max] = stages[i].range;
        if (clamped >= min && clamped <= max) {
          matched = i;
          break;
        }
      }
      setActiveStageIdx(matched);
    },
    [stages]
  );

  // Scroll listener maps exact scroll position within trackRef to [0, 1]
  useEffect(() => {
    const updateFromScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollableDistance = el.offsetHeight - window.innerHeight;
      if (scrollableDistance <= 0) return;

      const raw = -rect.top / scrollableDistance;
      const clamped = Math.max(0, Math.min(1, raw));
      targetProgressRef.current = clamped;
      syncUiFromProgress(clamped);
      requestRenderRef.current?.();
    };

    updateFromScroll();
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateFromScroll);
      window.removeEventListener('resize', updateFromScroll);
    };
  }, [syncUiFromProgress]);

  // Optional external image-sequence canvas renderer
  useEffect(() => {
    if (!hasImageSequence || !frameSequenceUrls) return;
    const canvas = seqCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let disposed = false;
    const images: HTMLImageElement[] = [];

    frameSequenceUrls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      images[index] = img;
    });

    const drawFrame = () => {
      if (disposed) return;
      const p = targetProgressRef.current;
      const idx = Math.min(images.length - 1, Math.floor(p * (images.length - 1)));
      const img = images[idx];
      if (img && img.complete && img.naturalWidth > 0) {
        canvas.width = canvas.clientWidth * Math.min(window.devicePixelRatio, 2);
        canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio, 2);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      }
    };

    requestRenderRef.current = drawFrame;
    drawFrame();

    return () => {
      disposed = true;
      requestRenderRef.current = null;
    };
  }, [hasImageSequence, frameSequenceUrls]);

  // Procedural Three.js PBR Exploded Assembly Studio
  useEffect(() => {
    if (hasImageSequence) return;
    const mount = canvasMountRef.current;
    if (!mount) return;

    let studio: ReturnType<typeof createStudioContext>;
    try {
      studio = createStudioContext(mount, 0x090a0b);
    } catch {
      setWebglFailed(true);
      return;
    }

    const { renderer, scene, isSoftwareGl, maxAnisotropy, disposeEnvironment } = studio;

    const camera = new THREE.PerspectiveCamera(
      36,
      (mount.clientWidth || 800) / (mount.clientHeight || 600),
      0.1,
      50
    );
    camera.position.set(4.1, 2.75, 4.9);
    camera.lookAt(0, 0.15, 0);

    const shadowPlane = createContactShadowPlane(3.4, 0.55);
    shadowPlane.position.set(0, -1.65, 0);
    scene.add(shadowPlane);

    const coreModel = productType === 'core' ? buildCoreHardwareModel(maxAnisotropy) : null;
    const senseModel = productType === 'sense' ? buildSenseHardwareModel(maxAnisotropy, isSoftwareGl) : null;

    if (coreModel) {
      scene.add(coreModel.root);
    }
    if (senseModel) {
      senseModel.root.rotation.set(-0.2, 0.35, 0);
      scene.add(senseModel.root);
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const _camTarget = new THREE.Vector3(0, 0.12, 0);
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();
    let disposed = false;

    const applyExplodedTransform = (p: number) => {
      if (coreModel) {
        // 9-step choreography:
        // 1 (0.00-0.09): Complete CORE
        // 2 (0.09-0.21): Outer enclosure separates
        // 3 (0.21-0.34): Internal PCB reveals
        // 4 (0.34-0.48): ESP32 extracts
        // 5 (0.48-0.62): Energy monitoring module reveals
        // 6 (0.62-0.75): Relay switching circuitry separates
        // 7 (0.75-0.86): Isolated power supply reveals
        // 8 (0.86-0.93): Complete exploded assembly
        // 9 (0.93-1.00): Reassemble finished product
        const enc = computePhaseEnvelope(p, 0.08, 0.21, 0.91, 0.99);
        const pcbReveal = computePhaseEnvelope(p, 0.18, 0.32, 0.91, 0.99);
        const esp = computePhaseEnvelope(p, 0.32, 0.46, 0.91, 0.99);
        const energy = computePhaseEnvelope(p, 0.46, 0.60, 0.91, 0.99);
        const relay = computePhaseEnvelope(p, 0.60, 0.73, 0.91, 0.99);
        const psu = computePhaseEnvelope(p, 0.73, 0.85, 0.91, 0.99);

        coreModel.topEnclosure.position.set(0, 0.22 + enc * 1.45, 0);
        coreModel.bottomEnclosure.position.set(0, -0.18 - enc * 1.2, 0);
        coreModel.mainPcb.position.set(0, pcbReveal * 0.06, 0);

        coreModel.esp32Module.position.set(-0.75 - esp * 0.42, 0.12 + esp * 0.85, esp * 0.35);
        coreModel.energyModule.position.set(0.68 + energy * 0.55, 0.08 + energy * 0.48, 0.38 + energy * 0.42);
        coreModel.relayModule.position.set(0.72 + relay * 0.58, 0.07 + relay * 0.62, -0.28 - relay * 0.35);
        coreModel.powerSupply.position.set(-0.72 - psu * 0.45, 0.06 - psu * 0.58, -0.46 - psu * 0.28);

        // Subtle studio turntable angle synced to scroll (returns cleanly to front hero angle at 1.0)
        const angle = 0.25 + Math.sin(p * Math.PI) * 0.55;
        coreModel.root.rotation.set(0.08, angle, 0);

        const zoomOut = computePhaseEnvelope(p, 0.12, 0.85, 0.91, 0.99);
        camera.position.set(4.1 + zoomOut * 1.25, 2.75 + zoomOut * 0.65, 4.9 + zoomOut * 1.35);
        camera.lookAt(_camTarget);
      }

      if (senseModel) {
        // 8-step choreography for SENSE:
        // 1 (0.00-0.12): Outer enclosure
        // 2 (0.12-0.25): PIR Fresnel lens
        // 3 (0.25-0.39): LDR light sensor
        // 4 (0.39-0.53): DHT11 temp & humidity sensor
        // 5 (0.53-0.67): Sensor-interface PCB
        // 6 (0.67-0.80): Wireless communication electronics
        // 7 (0.80-0.91): Rear mounting plate
        // 8 (0.91-1.00): Fully assembled SENSE
        const front = computePhaseEnvelope(p, 0.08, 0.22, 0.90, 0.99);
        const lens = computePhaseEnvelope(p, 0.12, 0.26, 0.90, 0.99);
        const ldr = computePhaseEnvelope(p, 0.25, 0.39, 0.90, 0.99);
        const dht = computePhaseEnvelope(p, 0.39, 0.53, 0.90, 0.99);
        const pcb = computePhaseEnvelope(p, 0.53, 0.67, 0.90, 0.99);
        const wireless = computePhaseEnvelope(p, 0.67, 0.80, 0.90, 0.99);
        const mountPlate = computePhaseEnvelope(p, 0.78, 0.89, 0.90, 0.99);

        senseModel.frontEnclosure.position.set(0, 0, 0.22 + front * 1.05);
        senseModel.fresnelLens.position.set(0, 0.08, 0.4 + lens * 1.78);
        senseModel.ldrSensor.position.set(-0.56 - ldr * 0.48, -0.45 - ldr * 0.22, 0.12 + ldr * 0.62);
        senseModel.dht11Sensor.position.set(0.54 + dht * 0.48, -0.42 - dht * 0.22, 0.12 + dht * 0.62);
        senseModel.interfacePcb.position.set(0, 0, pcb * 0.05);
        senseModel.wirelessModule.position.set(0, 0.25 + wireless * 0.35, -0.14 - wireless * 0.72);
        senseModel.mountingPlate.position.set(0, 0, -0.26 - mountPlate * 1.45);

        const angle = -0.35 - Math.sin(p * Math.PI) * 0.72;
        senseModel.root.rotation.set(-0.14, angle, 0);

        const zoomOut = computePhaseEnvelope(p, 0.12, 0.86, 0.90, 0.99);
        camera.position.set(3.5 + zoomOut * 1.15, 2.05 + zoomOut * 0.45, 4.1 + zoomOut * 1.15);
        camera.lookAt(_camTarget);
      }
    };

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

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        renderDirty = false;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const target = targetProgressRef.current;
        if (prefersReducedMotion || isSoftwareGl) {
          currentProgressRef.current = target;
        } else {
          currentProgressRef.current = THREE.MathUtils.damp(
            currentProgressRef.current,
            target,
            9,
            dt
          );
        }

        const stillMoving = Math.abs(target - currentProgressRef.current) > 0.0008;
        applyExplodedTransform(currentProgressRef.current);
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (stillMoving || renderDirty) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    requestRenderRef.current = requestRender;
    applyExplodedTransform(targetProgressRef.current);
    requestRender();

    const handleResize = () => {
      if (!mount || disposed) return;
      const w = mount.clientWidth || 800;
      const h = mount.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    return () => {
      disposed = true;
      requestRenderRef.current = null;
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      coreModel?.dispose();
      senseModel?.dispose();
      shadowPlane.geometry.dispose();
      (shadowPlane.material as THREE.MeshBasicMaterial).map?.dispose();
      (shadowPlane.material as THREE.Material).dispose();
      disposeEnvironment();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [hasImageSequence, productType]);

  const jumpToStage = (stage: ExplodedStage) => {
    const el = trackRef.current;
    if (!el) return;
    const mid = (stage.range[0] + stage.range[1]) / 2;
    const scrollableDistance = el.offsetHeight - window.innerHeight;
    const targetTop = el.offsetTop + mid * scrollableDistance;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const activeStage = stages[activeStageIdx] ?? stages[0];

  return (
    <section id={id} ref={trackRef} className={`relative w-full ${trackHeightClass} bg-[#090A0B]`}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Centered Hardware Viewport */}
        {hasImageSequence ? (
          <canvas ref={seqCanvasRef} className="h-full w-full" />
        ) : webglFailed ? (
          <div className="flex h-full w-full items-center justify-center bg-[#090A0B] px-6">
            <div className="max-w-md rounded-lg border border-white/10 bg-[#121417] p-6 text-center">
              <p className="text-sm font-semibold text-[#F5F7F8]">{title}</p>
              <p className="mt-2 text-xs text-[#94A3B8]">{activeStage.explanation}</p>
            </div>
          </div>
        ) : (
          <div ref={canvasMountRef} className="h-full w-full" />
        )}

        {/* Top Header Overlay (Positioned safely outside center silhouette) */}
        <div className="pointer-events-none absolute inset-x-0 top-16 z-10 mx-auto flex max-w-[1440px] items-start justify-between px-6 pt-6 lg:px-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
              {subtitle}
            </p>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#F5F7F8] sm:text-3xl">
              {title}
            </h2>
          </div>

          {/* Minimal Progress Counter */}
          <div className="hidden sm:flex flex-col items-end font-mono tabular-nums">
            <span className="text-xs text-[#94A3B8]">
              Stage {String(activeStage.index).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}
            </span>
            <span className="mt-0.5 text-sm font-medium text-emerald-400">{progressPct}%</span>
          </div>
        </div>

        {/* Bottom Contextual Component Panel + Minimal Stage Progress Rail */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1440px] flex-col gap-4 px-6 pb-6 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:pb-8">
          {/* Synchronized Contextual Explanation Panel (Solid matte surface, zero backdrop-blur over WebGL) */}
          <div className="pointer-events-auto max-w-md rounded-lg border border-white/10 bg-[#111317]/95 p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-xs tracking-wider text-emerald-400 tabular-nums">
                {String(activeStage.index).padStart(2, '0')} · {activeStage.stageLabel}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-bold tracking-tight text-[#F5F7F8]">
              {activeStage.componentName}
            </h3>
            <p className="mt-1 text-sm font-medium text-[#E2E8F0]">{activeStage.role}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              {activeStage.explanation}
            </p>
          </div>

          {/* Minimal Progress Indicator & Interactive Stage Steps */}
          <div className="pointer-events-auto flex flex-col gap-2 rounded-lg border border-white/10 bg-[#111317]/95 px-4 py-3">
            <div className="flex items-center justify-between gap-6">
              <span className="text-[11px] font-medium text-[#94A3B8]">
                Scroll to inspect disassembly
              </span>
              <span className="font-mono text-[11px] text-emerald-400 tabular-nums sm:hidden">
                {progressPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {stages.map((stage, i) => {
                const isActive = i === activeStageIdx;
                const isPast = i < activeStageIdx;
                return (
                  <button
                    key={stage.index}
                    type="button"
                    onClick={() => jumpToStage(stage)}
                    title={stage.componentName}
                    aria-label={`Jump to stage ${stage.index}: ${stage.componentName}`}
                    className={`h-1.5 rounded-sm transition-all cursor-pointer ${
                      isActive
                        ? 'w-8 bg-emerald-400'
                        : isPast
                          ? 'w-4 bg-emerald-600/70 hover:bg-emerald-500'
                          : 'w-4 bg-white/15 hover:bg-white/30'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
