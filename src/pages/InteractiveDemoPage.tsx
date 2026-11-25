import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Cpu,
  Fan,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Minimize2,
  Radio,
  RotateCcw,
  Sliders,
  Thermometer,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useEcosync } from '../state/ecosyncStore';
import type { AppRoute, ZoneId } from '../types/ecosync';
import {
  GLOBAL_CAMERA_PRESETS,
  mountSmartHomeScene,
  ROOM_CAMERA_TARGETS,
  type CameraViewMode,
  type SensorKind,
  type SensorMarkerMeta,
  type SmartHomeEngine,
} from '../three/smartHomeScene';

interface InteractiveDemoPageProps {
  onNavigate: (route: AppRoute) => void;
}

type DemoMode = 'explore' | 'sensors' | 'automation' | 'system';

const SENSOR_METADATA: Record<
  SensorKind,
  { title: string; purpose: string; accentClass: string }
> = {
  PIR: {
    title: 'PIR Motion Sensor',
    purpose: 'Detects room occupancy and active movement via passive infrared sensing.',
    accentClass: 'text-[#00C987]',
  },
  LDR: {
    title: 'LDR Ambient Light Sensor',
    purpose: 'Measures relative indoor brightness to suppress unnecessary artificial lighting.',
    accentClass: 'text-amber-400',
  },
  DHT11: {
    title: 'DHT11 Climate Sensor',
    purpose: 'Monitors ambient room temperature and relative humidity for fan automation.',
    accentClass: 'text-[#38BDF8]',
  },
};

export const InteractiveDemoPage: React.FC<InteractiveDemoPageProps> = ({ onNavigate }) => {
  const {
    zones,
    circuits,
    rules,
    activityFeed,
    ambientDaylightPct,
    totalWatts,
    averageVoltage,
    coreConnected,
    setAmbientDaylightPct,
    toggleZoneOccupancy,
    toggleZoneAppliance,
    toggleRuleEnabled,
    setZoneTemperature,
  } = useEcosync();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SmartHomeEngine | null>(null);

  const [demoMode, setDemoMode] = useState<DemoMode>('explore');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('full');
  const [selectedRoomId, setSelectedRoomId] = useState<ZoneId | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<SensorMarkerMeta | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const latestEventIdRef = useRef<string | null>(activityFeed[0]?.id ?? null);

  // Brief notification whenever a new event enters activityFeed
  useEffect(() => {
    const head = activityFeed[0];
    if (!head || head.id === latestEventIdRef.current) return;
    latestEventIdRef.current = head.id;
    setToastMessage(`${head.room}: ${head.description}`);
    const timer = window.setTimeout(() => {
      setToastMessage((curr) => (curr === `${head.room}: ${head.description}` ? null : curr));
    }, 3400);
    return () => window.clearTimeout(timer);
  }, [activityFeed]);

  // Escape key dismisses sensor popover, help guide, or contextual room panel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedSensor) {
        setSelectedSensor(null);
      } else if (showHelp) {
        setShowHelp(false);
      } else if (selectedRoomId) {
        setSelectedRoomId(null);
        setCameraMode('full');
        engineRef.current?.setCameraGoal(
          GLOBAL_CAMERA_PRESETS.full.pos,
          GLOBAL_CAMERA_PRESETS.full.target
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedSensor, showHelp, selectedRoomId]);

  // Fullscreen sync
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleSelectRoomFrom3D = useCallback((zoneId: ZoneId) => {
    setSelectedRoomId(zoneId);
    setSelectedSensor(null);
    setCameraMode('room');
    const goal = ROOM_CAMERA_TARGETS[zoneId];
    engineRef.current?.setCameraGoal(goal.pos, goal.target);
  }, []);

  const handleSelectSensorFrom3D = useCallback((meta: SensorMarkerMeta) => {
    setSelectedSensor(meta);
    setSelectedRoomId(meta.zoneId);
  }, []);

  // Mount Three.js engine once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;
    try {
      const engine = mountSmartHomeScene(mount, {
        onSelectRoom: handleSelectRoomFrom3D,
        onSelectSensor: handleSelectSensorFrom3D,
        onUserCameraInteract: () => {},
        onWebglLost: () => setWebglFailed(true),
      });
      engineRef.current = engine;
      return () => {
        engine.dispose();
        engineRef.current = null;
      };
    } catch {
      setWebglFailed(true);
    }
  }, [handleSelectRoomFrom3D, handleSelectSensorFrom3D]);

  // Keep 3D engine synchronized with React store state
  useEffect(() => {
    engineRef.current?.syncState({
      zones,
      circuits,
      ambientDaylightPct,
      selectedRoomId,
      showSensors: demoMode === 'sensors',
      selectedSensorId: selectedSensor?.id ?? null,
    });
  }, [zones, circuits, ambientDaylightPct, selectedRoomId, demoMode, selectedSensor]);

  const handleCameraPreset = (mode: CameraViewMode) => {
    setCameraMode(mode);
    if (mode === 'full') {
      engineRef.current?.setCameraGoal(
        GLOBAL_CAMERA_PRESETS.full.pos,
        GLOBAL_CAMERA_PRESETS.full.target
      );
    } else if (mode === 'interior') {
      engineRef.current?.setCameraGoal(
        GLOBAL_CAMERA_PRESETS.interior.pos,
        GLOBAL_CAMERA_PRESETS.interior.target
      );
    } else if (mode === 'room') {
      const targetId = selectedRoomId ?? 'living';
      if (!selectedRoomId) setSelectedRoomId(targetId);
      const goal = ROOM_CAMERA_TARGETS[targetId];
      engineRef.current?.setCameraGoal(goal.pos, goal.target);
    }
  };

  const handleResetView = () => {
    setSelectedRoomId(null);
    setSelectedSensor(null);
    setCameraMode('full');
    engineRef.current?.setCameraGoal(
      GLOBAL_CAMERA_PRESETS.full.pos,
      GLOBAL_CAMERA_PRESETS.full.target
    );
  };

  const handleCloseRoomPanel = () => {
    setSelectedRoomId(null);
    setCameraMode('full');
    engineRef.current?.setCameraGoal(
      GLOBAL_CAMERA_PRESETS.full.pos,
      GLOBAL_CAMERA_PRESETS.full.target
    );
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el || !document.fullscreenEnabled) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if blocked by iframe policy
    }
  };

  const connectedSenseCount = zones.filter((z) => z.senseConnected).length;
  const activeRelayCount = circuits.filter((c) => c.isOn).length;

  const selectedZone = useMemo(
    () => (selectedRoomId ? zones.find((z) => z.id === selectedRoomId) ?? null : null),
    [selectedRoomId, zones]
  );

  const selectedLightCircuit = useMemo(
    () =>
      selectedRoomId
        ? circuits.find((c) => c.zoneId === selectedRoomId && c.category === 'lighting')
        : undefined,
    [selectedRoomId, circuits]
  );

  const selectedFanCircuit = useMemo(
    () =>
      selectedRoomId
        ? circuits.find((c) => c.zoneId === selectedRoomId && c.category === 'fan')
        : undefined,
    [selectedRoomId, circuits]
  );

  const selectedRoomActivity = useMemo(
    () =>
      selectedZone
        ? activityFeed.filter((evt) => evt.room === selectedZone.name).slice(0, 5)
        : [],
    [selectedZone, activityFeed]
  );

  const smartLightingRule = rules.find((r) => r.id === 'smart-lighting');
  const daylightRule = rules.find((r) => r.id === 'daylight-optimization');
  const tempRule = rules.find((r) => r.id === 'temp-control');

  const sensorZone = selectedSensor
    ? zones.find((z) => z.id === selectedSensor.zoneId) ?? null
    : null;

  const formatTemp = (t: number) => (Number.isInteger(t) ? `${t}°C` : `${t.toFixed(1)}°C`);

  const targetSimRoomId: ZoneId = selectedRoomId ?? 'study';
  const targetSimZone = zones.find((z) => z.id === targetSimRoomId);

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-[#111313] text-[#F2F4F2]"
    >
      {/* =================================================================== */}
      {/* A. TOP SYSTEM BAR                                                   */}
      {/* =================================================================== */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#111313] px-4 py-2.5 lg:px-6">
        {/* Left: Residence & Hardware Status */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-semibold tracking-wide text-[#F2F4F2] whitespace-nowrap">
            ECOSYNC RESIDENCE
          </span>
          <span className="font-mono text-[11px] text-[#00C987] whitespace-nowrap">
            DEMO ACTIVE · SIMULATED
          </span>
          <span className="hidden sm:inline text-white/15" aria-hidden="true">
            |
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-[#9CA3AF] whitespace-nowrap">
            CORE:{' '}
            <span className={coreConnected ? 'text-[#F2F4F2]' : 'text-rose-400'}>
              {coreConnected ? 'Online' : 'Offline'}
            </span>
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-[#9CA3AF] whitespace-nowrap">
            SENSE:{' '}
            <span className="text-[#F2F4F2]">
              {connectedSenseCount}/{zones.length}
            </span>
          </span>
        </div>

        {/* Centre: Simulated Load & Voltage */}
        <div className="flex items-center gap-5 font-mono text-xs tabular-nums">
          <div className="flex items-center gap-2">
            <span className="text-[#9CA3AF]">Load</span>
            <span className="font-semibold text-[#00C987]">{totalWatts} W</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#9CA3AF]">Voltage</span>
            <span className="font-semibold text-[#F2F4F2]">{averageVoltage.toFixed(1)} V</span>
          </div>
          <span className="hidden xl:inline text-[11px] text-[#6B7280]">
            Simulated prototype telemetry
          </span>
        </div>

        {/* Right: Reset View, Help, Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex items-center gap-1.5 rounded-sm border border-white/15 bg-[#1B1F1E] px-2.5 py-1.5 text-xs font-medium text-[#F2F4F2] transition-colors hover:border-[#00C987] cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#00C987]" />
            <span>Reset View</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            aria-label="Toggle interaction guide"
            aria-expanded={showHelp}
            className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              showHelp
                ? 'border-[#00C987]/50 bg-[#00C987]/15 text-[#00C987]'
                : 'border-white/15 bg-[#1B1F1E] text-[#9CA3AF] hover:text-[#F2F4F2]'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {typeof document !== 'undefined' && document.fullscreenEnabled && (
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="hidden sm:inline-flex items-center justify-center rounded-sm border border-white/15 bg-[#1B1F1E] p-1.5 text-[#9CA3AF] transition-colors hover:text-[#F2F4F2] cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* B. MAIN STAGE: 3D HOUSE VIEWPORT + CONTEXTUAL RIGHT PANEL           */}
      {/* =================================================================== */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        <div className="relative flex-1 overflow-hidden">
          {webglFailed ? (
            <div className="flex h-full w-full items-center justify-center p-6">
              <div className="max-w-md border border-white/10 bg-[#1B1F1E] p-6 text-center">
                <h2 className="text-lg font-bold text-[#F2F4F2]">3D Residence Unavailable</h2>
                <p className="mt-2 text-sm text-[#9CA3AF]">
                  WebGL context could not be initialized. Explore the hardware architecture and
                  technical specifications instead.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/technology')}
                  className="mt-4 rounded-sm bg-[#00C987] px-4 py-2 text-xs font-semibold text-[#071510] cursor-pointer"
                >
                  Explore Technology
                </button>
              </div>
            </div>
          ) : (
            <div ref={canvasMountRef} className="h-full w-full" />
          )}

          {/* Quiet Instruction Tag when no room is selected */}
          {!selectedRoomId && (
            <div className="pointer-events-none absolute left-5 top-4 z-10 border border-white/10 bg-[#1B1F1E]/95 px-3.5 py-2 text-xs text-[#D1D5DB]">
              Select a room to explore.
            </div>
          )}

          {/* Automation Trigger Toast Notification */}
          {toastMessage && (
            <div
              role="status"
              className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 border border-[#00C987]/40 bg-[#111313]/95 px-4 py-2 text-xs font-medium text-[#F2F4F2] shadow-lg"
            >
              <span className="mr-2 font-mono text-[#00C987]">ECOSYNC</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Interaction Guide Popover */}
          {showHelp && (
            <div className="absolute right-4 top-4 z-30 w-72 border border-white/15 bg-[#1B1F1E]/95 p-4 text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <span className="font-semibold text-[#F2F4F2]">Interaction Guide</span>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  aria-label="Close interaction guide"
                  className="text-[#9CA3AF] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="mt-3 space-y-2 text-[#9CA3AF]">
                <li>
                  <span className="text-[#F2F4F2] font-medium">Click a room:</span> Select Living
                  Room, Bedroom, Kitchen, or Study Room directly in 3D.
                </li>
                <li>
                  <span className="text-[#F2F4F2] font-medium">Orbit / Zoom / Pan:</span> Left-drag
                  to rotate, scroll to zoom, right-drag to pan.
                </li>
                <li>
                  <span className="text-[#F2F4F2] font-medium">Sensors mode:</span> Click any PIR,
                  LDR, or DHT11 marker inside the house to inspect its reading.
                </li>
                <li>
                  <span className="text-[#F2F4F2] font-medium">Escape key:</span> Dismisses the open
                  panel or sensor popover.
                </li>
              </ul>
            </div>
          )}

          {/* Sensor Marker Info Popover (when clicking a 3D sensor in Sensors mode) */}
          {demoMode === 'sensors' && selectedSensor && sensorZone && (
            <div className="absolute left-5 top-16 z-20 w-72 border border-white/15 bg-[#1B1F1E]/95 p-4 text-xs shadow-2xl">
              <div className="flex items-start justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                <div>
                  <span
                    className={`font-mono text-[11px] font-semibold ${
                      SENSOR_METADATA[selectedSensor.kind].accentClass
                    }`}
                  >
                    {selectedSensor.kind} SENSOR
                  </span>
                  <h3 className="mt-0.5 text-sm font-semibold text-[#F2F4F2]">
                    {SENSOR_METADATA[selectedSensor.kind].title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSensor(null)}
                  aria-label="Close sensor details"
                  className="text-[#9CA3AF] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <dl className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-[#9CA3AF]">Room</dt>
                  <dd className="font-medium text-[#F2F4F2]">{sensorZone.name}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Purpose</dt>
                  <dd className="mt-0.5 text-[#D1D5DB]">
                    {SENSOR_METADATA[selectedSensor.kind].purpose}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-white/[0.06] pt-2">
                  <dt className="text-[#9CA3AF]">Simulated Reading</dt>
                  <dd className="font-mono font-semibold text-[#00C987] tabular-nums">
                    {selectedSensor.kind === 'PIR'
                      ? `${sensorZone.occupied ? 'Occupied' : 'Vacant'} (${sensorZone.pirState})`
                      : selectedSensor.kind === 'LDR'
                        ? `${sensorZone.brightness} rel`
                        : `${formatTemp(sensorZone.temperatureC)} · ${sensorZone.humidityPct}%`}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9CA3AF]">Status</dt>
                  <dd className="font-mono text-[#F2F4F2]">
                    {sensorZone.senseConnected ? 'Simulated Online' : 'Disconnected'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* ================================================================= */}
          {/* D. COMPACT FLOATING BOTTOM INTERACTION TOOLBAR                    */}
          {/* ================================================================= */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex w-[min(780px,94vw)] -translate-x-1/2 flex-col items-center gap-2">
            {/* Mode-Specific Compact Action Strip */}
            <div className="pointer-events-auto w-full border border-white/[0.1] bg-[#1B1F1E]/95 p-3 shadow-2xl">
              {/* Top Row: 4 Mode Selector + Camera Presets */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-2.5">
                <div className="flex items-center gap-1" role="tablist" aria-label="Demo modes">
                  {(
                    [
                      { id: 'explore', label: 'Explore', Icon: Compass },
                      { id: 'sensors', label: 'Sensors', Icon: Radio },
                      { id: 'automation', label: 'Automation', Icon: Sliders },
                      { id: 'system', label: 'System', Icon: Cpu },
                    ] as const
                  ).map(({ id, label, Icon }) => {
                    const active = demoMode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          setDemoMode(id);
                          if (id !== 'sensors') setSelectedSensor(null);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-[#00C987] text-[#071510]'
                            : 'text-[#9CA3AF] hover:bg-white/[0.05] hover:text-[#F2F4F2]'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Camera View Mode Switcher */}
                <div className="flex items-center gap-1" role="group" aria-label="Camera views">
                  {(
                    [
                      { id: 'full', label: 'Full House' },
                      { id: 'interior', label: 'Interior View' },
                      { id: 'room', label: 'Selected Room' },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleCameraPreset(preset.id)}
                      className={`rounded-sm border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        cameraMode === preset.id
                          ? 'border-[#00C987]/50 bg-[#00C987]/15 text-[#00C987]'
                          : 'border-white/10 bg-[#111313] text-[#9CA3AF] hover:text-[#F2F4F2]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Row: Active Mode Controls */}
              {demoMode === 'explore' && (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#9CA3AF]">
                  <span>
                    Click Living Room, Bedroom, Kitchen, or Study Room directly in the 3D model to
                    inspect and control it.
                  </span>
                  <span className="font-mono text-[11px] text-[#6B7280]">
                    Drag to orbit · Scroll to zoom
                  </span>
                </div>
              )}

              {demoMode === 'sensors' && (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 text-[#D1D5DB]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#00C987]" />
                      PIR Occupancy
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#D1D5DB]">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      LDR Brightness
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#D1D5DB]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#38BDF8]" />
                      DHT11 Temp &amp; Humidity
                    </span>
                  </div>
                  <span className="text-[#9CA3AF]">
                    Click any marker inside the 3D house to view sensor details
                  </span>
                </div>
              )}

              {demoMode === 'automation' && (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                  {/* Rule enable toggles */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rules.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRuleEnabled(r.id)}
                        className={`rounded-sm border px-2.5 py-1 text-[11px] font-medium cursor-pointer whitespace-nowrap ${
                          r.enabled
                            ? 'border-[#00C987]/40 bg-[#00C987]/15 text-[#00C987]'
                            : 'border-white/10 bg-[#111313] text-[#6B7280]'
                        }`}
                      >
                        {r.name}: {r.enabled ? 'ON' : 'OFF'}
                      </button>
                    ))}
                  </div>

                  {/* Simulation Triggers */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleZoneOccupancy(targetSimRoomId)}
                      className="rounded-sm border border-white/15 bg-[#111313] px-2.5 py-1 text-[11px] font-medium text-[#F2F4F2] hover:border-[#00C987] cursor-pointer whitespace-nowrap"
                    >
                      Motion ({targetSimZone?.name ?? 'Room'})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAmbientDaylightPct(ambientDaylightPct >= 60 ? 20 : 85)
                      }
                      className="rounded-sm border border-white/15 bg-[#111313] px-2.5 py-1 text-[11px] font-medium text-[#F2F4F2] hover:border-[#00C987] cursor-pointer whitespace-nowrap"
                    >
                      {ambientDaylightPct >= 60 ? 'Dim Daylight' : 'Bright Daylight'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setZoneTemperature(
                          targetSimRoomId,
                          (targetSimZone?.temperatureC ?? 25) >= 27 ? 24 : 28.5
                        )
                      }
                      className="rounded-sm border border-white/15 bg-[#111313] px-2.5 py-1 text-[11px] font-medium text-[#F2F4F2] hover:border-[#00C987] cursor-pointer whitespace-nowrap"
                    >
                      {(targetSimZone?.temperatureC ?? 25) >= 27
                        ? 'Cool Temp (24°C)'
                        : 'Temp Threshold (28.5°C)'}
                    </button>
                  </div>
                </div>
              )}

              {demoMode === 'system' && (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="border border-white/10 bg-[#111313] px-2 py-1 text-[#00C987]">
                      SENSE ({connectedSenseCount}/4)
                    </span>
                    <ArrowRight className="h-3 w-3 text-[#6B7280]" />
                    <span className="border border-white/10 bg-[#111313] px-2 py-1 text-[#F2F4F2]">
                      CORE (ESP32 · {activeRelayCount}/8 relays)
                    </span>
                    <ArrowRight className="h-3 w-3 text-[#6B7280]" />
                    <span className="border border-white/10 bg-[#111313] px-2 py-1 text-[#38BDF8]">
                      Lights &amp; Fans ({totalWatts} W)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate('/technology')}
                      className="text-xs font-medium text-[#00C987] hover:underline cursor-pointer"
                    >
                      Hardware Breakdown
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('/features')}
                      className="text-xs font-medium text-[#F2F4F2] hover:text-[#00C987] cursor-pointer"
                    >
                      System Features
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* C. CONTEXTUAL ROOM CONTROL PANEL (Right Side Desktop / Bottom Sheet) */}
        {/* =================================================================== */}
        {selectedZone && (
          <aside
            aria-label={`${selectedZone.name} controls`}
            className="fixed inset-x-0 bottom-0 z-30 max-h-[68vh] overflow-y-auto border-t border-white/[0.1] bg-[#1B1F1E] shadow-2xl md:static md:inset-auto md:z-20 md:max-h-none md:w-[370px] md:shrink-0 md:border-l md:border-t-0 lg:w-[400px]"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#1B1F1E] px-5 py-4">
              <div>
                <p className="font-mono text-[11px] text-[#00C987]">Selected Space</p>
                <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#F2F4F2]">
                  {selectedZone.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseRoomPanel}
                aria-label="Close room panel"
                className="inline-flex items-center gap-1 rounded-sm border border-white/15 bg-[#111313] px-2.5 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Close</span>
              </button>
            </div>

            <div className="space-y-5 p-5 text-xs">
              {/* ROOM STATUS */}
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                    Room Status
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleZoneOccupancy(selectedZone.id)}
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                      selectedZone.occupied
                        ? 'border-[#00C987]/50 bg-[#00C987]/15 text-[#00C987]'
                        : 'border-white/15 bg-[#111313] text-[#D1D5DB] hover:border-white/35'
                    }`}
                  >
                    {selectedZone.occupied ? (
                      <>
                        <UserCheck className="h-3 w-3" />
                        <span>Mark Vacant</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-3 w-3" />
                        <span>Simulate Motion</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div className="border border-white/[0.08] bg-[#111313] p-3">
                    <span className="text-[11px] text-[#9CA3AF]">Occupancy</span>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        selectedZone.occupied ? 'text-[#00C987]' : 'text-[#D1D5DB]'
                      }`}
                    >
                      {selectedZone.occupied ? 'Occupied' : 'Vacant'}
                    </p>
                  </div>

                  <div className="border border-white/[0.08] bg-[#111313] p-3">
                    <span className="text-[11px] text-[#9CA3AF]">Temp / Humidity</span>
                    <p className="mt-1 font-mono text-sm font-semibold text-[#F2F4F2] tabular-nums">
                      {formatTemp(selectedZone.temperatureC)} · {selectedZone.humidityPct}%
                    </p>
                  </div>

                  <div className="border border-white/[0.08] bg-[#111313] p-3">
                    <span className="text-[11px] text-[#9CA3AF]">Brightness (Rel)</span>
                    <p className="mt-1 font-mono text-sm font-semibold text-[#F2F4F2] tabular-nums">
                      {selectedZone.brightness} rel
                    </p>
                  </div>

                  <div className="border border-white/[0.08] bg-[#111313] p-3">
                    <span className="text-[11px] text-[#9CA3AF]">Last Motion</span>
                    <p className="mt-1 font-mono text-sm font-semibold text-[#F2F4F2] tabular-nums">
                      {selectedZone.lastMotionAt}
                    </p>
                  </div>
                </div>

                {/* Room Temp Simulation Slider */}
                <label className="mt-3 flex flex-col gap-1.5 border border-white/[0.08] bg-[#111313] p-3">
                  <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
                    <span className="inline-flex items-center gap-1">
                      <Thermometer className="h-3 w-3" /> Simulated Room Temp
                    </span>
                    <span className="font-mono text-[#F2F4F2] tabular-nums">
                      {formatTemp(selectedZone.temperatureC)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={34}
                    step={0.5}
                    value={selectedZone.temperatureC}
                    onChange={(e) => setZoneTemperature(selectedZone.id, Number(e.target.value))}
                    className="w-full accent-[#00C987] cursor-pointer"
                  />
                </label>
              </section>

              {/* APPLIANCES */}
              <section className="border-t border-white/[0.08] pt-4">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                  Appliances
                </h3>

                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between border border-white/[0.08] bg-[#111313] px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Lightbulb
                        className={`h-4 w-4 ${
                          selectedLightCircuit?.isOn ? 'text-[#00C987]' : 'text-[#6B7280]'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-[#F2F4F2]">Lighting</p>
                        <p className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                          {selectedLightCircuit?.isOn ? 'ON' : 'OFF'} ·{' '}
                          {selectedLightCircuit?.currentWatts ?? 0} W
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleZoneAppliance(selectedZone.id, 'lighting')}
                      className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        selectedLightCircuit?.isOn
                          ? 'bg-[#00C987] text-[#071510]'
                          : 'border border-white/15 bg-[#1B1F1E] text-[#D1D5DB] hover:text-white'
                      }`}
                    >
                      {selectedLightCircuit?.isOn ? 'Turn OFF' : 'Turn ON'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between border border-white/[0.08] bg-[#111313] px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Fan
                        className={`h-4 w-4 ${
                          selectedFanCircuit?.isOn ? 'text-[#00C987]' : 'text-[#6B7280]'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-[#F2F4F2]">Fan</p>
                        <p className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                          {selectedFanCircuit?.isOn ? 'ON' : 'OFF'} ·{' '}
                          {selectedFanCircuit?.currentWatts ?? 0} W
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleZoneAppliance(selectedZone.id, 'fan')}
                      className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        selectedFanCircuit?.isOn
                          ? 'bg-[#00C987] text-[#071510]'
                          : 'border border-white/15 bg-[#1B1F1E] text-[#D1D5DB] hover:text-white'
                      }`}
                    >
                      {selectedFanCircuit?.isOn ? 'Turn OFF' : 'Turn ON'}
                    </button>
                  </div>
                </div>
              </section>

              {/* AUTOMATION */}
              <section className="border-t border-white/[0.08] pt-4">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                  Automation
                </h3>

                <div className="mt-3 space-y-2">
                  {smartLightingRule && (
                    <div className="border border-white/[0.08] bg-[#111313] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#F2F4F2]">Smart Lighting</span>
                        <button
                          type="button"
                          onClick={() => toggleRuleEnabled(smartLightingRule.id)}
                          className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] cursor-pointer ${
                            smartLightingRule.enabled
                              ? 'border-[#00C987]/40 bg-[#00C987]/15 text-[#00C987]'
                              : 'border-white/10 bg-[#1B1F1E] text-[#6B7280]'
                          }`}
                        >
                          {smartLightingRule.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">
                        Trigger: Occupancy detected ({smartLightingRule.thresholdValue}s vacancy
                        timeout)
                      </p>
                    </div>
                  )}

                  {daylightRule && (
                    <div className="border border-white/[0.08] bg-[#111313] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#F2F4F2]">Daylight Optimization</span>
                        <button
                          type="button"
                          onClick={() => toggleRuleEnabled(daylightRule.id)}
                          className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] cursor-pointer ${
                            daylightRule.enabled
                              ? 'border-[#00C987]/40 bg-[#00C987]/15 text-[#00C987]'
                              : 'border-white/10 bg-[#1B1F1E] text-[#6B7280]'
                          }`}
                        >
                          {daylightRule.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">
                        Trigger: Suppresses light when brightness &gt;= {daylightRule.thresholdValue}{' '}
                        rel
                      </p>
                    </div>
                  )}

                  {tempRule && (
                    <div className="border border-white/[0.08] bg-[#111313] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#F2F4F2]">
                          Automatic Temperature Control
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRuleEnabled(tempRule.id)}
                          className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] cursor-pointer ${
                            tempRule.enabled
                              ? 'border-[#00C987]/40 bg-[#00C987]/15 text-[#00C987]'
                              : 'border-white/10 bg-[#1B1F1E] text-[#6B7280]'
                          }`}
                        >
                          {tempRule.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">
                        Trigger: Activates fan when occupied &amp; temp &gt;={' '}
                        {tempRule.thresholdValue.toFixed(1)}°C
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* RECENT ACTIVITY */}
              <section className="border-t border-white/[0.08] pt-4">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                  Recent Activity
                </h3>
                {selectedRoomActivity.length === 0 ? (
                  <p className="mt-2 text-[#6B7280]">No recent events for {selectedZone.name}.</p>
                ) : (
                  <div className="mt-2.5 divide-y divide-white/[0.06] border border-white/[0.08] bg-[#111313]">
                    {selectedRoomActivity.map((evt) => (
                      <div key={evt.id} className="px-3 py-2">
                        <div className="flex justify-between font-mono text-[10px] text-[#6B7280] tabular-nums">
                          <span>{evt.timestamp}</span>
                          <span className="text-[#00C987]">{evt.status}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#F2F4F2]">{evt.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
