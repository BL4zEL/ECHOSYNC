import React, { useEffect } from 'react';
import {
  Droplets,
  Fan,
  Lightbulb,
  Sun,
  Thermometer,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useEcosync } from '../../state/ecosyncStore';
import type { DashboardMode, ZoneId } from '../../types/ecosync';

interface RoomDetailPanelProps {
  roomId: ZoneId | null;
  mode: DashboardMode;
  onSelectRoom: (id: ZoneId) => void;
  onClose: () => void;
}

export const RoomDetailPanel: React.FC<RoomDetailPanelProps> = ({
  roomId,
  mode,
  onSelectRoom,
  onClose,
}) => {
  const {
    zones,
    circuits,
    rules,
    activityFeed,
    toggleZoneOccupancy,
    simulateInactivityTimeout,
    toggleZoneAppliance,
    toggleCircuitAutoMode,
    toggleRuleEnabled,
    setZoneTemperature,
    updateZoneThresholds,
  } = useEcosync();

  useEffect(() => {
    if (!roomId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomId, onClose]);

  if (!roomId) return null;

  const zone = zones.find((z) => z.id === roomId);
  if (!zone) return null;

  const lightCircuit = circuits.find(
    (c) => c.zoneId === zone.id && c.category === 'lighting'
  );
  const fanCircuit = circuits.find(
    (c) => c.zoneId === zone.id && c.category === 'fan'
  );
  const roomActivities = activityFeed
    .filter((evt) => evt.room === zone.name)
    .slice(0, 6);

  const smartLightingRule = rules.find((r) => r.id === 'smart-lighting');
  const daylightRule = rules.find((r) => r.id === 'daylight-optimization');
  const tempRule = rules.find((r) => r.id === 'temp-control');

  const formatElapsed = (sec: number) => {
    if (sec <= 2) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const mins = Math.floor(sec / 60);
    return `${mins}m ago`;
  };

  return (
    <div
      key={zone.id}
      className="fixed inset-0 z-[60] flex justify-end lg:static lg:inset-auto lg:z-auto lg:block"
      aria-label={`${zone.name} details`}
    >
      {/* Mobile / tablet click-outside backdrop */}
      <div
        className="fixed inset-0 bg-black/70 transition-opacity lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dedicated Right-Side Room Panel */}
      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-white/10 bg-[#0D0F12] shadow-2xl lg:h-auto lg:max-w-none lg:overflow-visible lg:rounded-xl lg:border lg:border-white/[0.08] lg:bg-[#0D0F12] lg:shadow-none">
        {/* Panel Header */}
        <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#0D0F12] px-6 py-5 lg:static lg:rounded-t-xl lg:bg-[#0D0F12]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${
                  zone.occupied ? 'bg-emerald-500' : 'bg-[#64748B]'
                }`}
              />
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#F5F7F8]">
                  {zone.name}
                </h2>
                <p className="mt-0.5 text-xs text-[#94A3B8]">
                  {zone.occupied ? 'Occupied' : 'Vacant'} · ECOSYNC SENSE{' '}
                  {zone.senseConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close room detail panel"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-[#121417] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-white/30 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>

          {/* Room Switcher Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {zones.map((z) => {
              const active = z.id === zone.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => onSelectRoom(z.id)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-[#121417] text-[#94A3B8] hover:text-[#F5F7F8]'
                  }`}
                >
                  {z.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Body */}
        <div className="space-y-6 p-6">
          {/* 1. ROOM OVERVIEW */}
          <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                Room Overview
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleZoneOccupancy(zone.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium cursor-pointer ${
                    zone.occupied
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/15 bg-[#0B0D10] text-[#CBD5E1] hover:text-white'
                  }`}
                >
                  {zone.occupied ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Mark Vacant</span>
                    </>
                  ) : (
                    <>
                      <UserX className="h-3.5 w-3.5" />
                      <span>Simulate Motion</span>
                    </>
                  )}
                </button>

                {zone.occupied && (
                  <button
                    type="button"
                    onClick={() => simulateInactivityTimeout(zone.id)}
                    className="rounded-md border border-white/15 bg-[#0B0D10] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] hover:text-white cursor-pointer"
                  >
                    Inactivity Timeout
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3">
                <span className="text-[11px] text-[#94A3B8]">Occupancy</span>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    zone.occupied ? 'text-emerald-400' : 'text-[#CBD5E1]'
                  }`}
                >
                  {zone.occupied ? 'Occupied' : 'Vacant'}
                </p>
                <p className="mt-1.5 font-mono text-[10px] text-[#64748B]">
                  PIR {zone.pirState}
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
                  <Thermometer className="h-3 w-3" /> Temperature
                </span>
                <p className="mt-1 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
                  {Number.isInteger(zone.temperatureC)
                    ? `${zone.temperatureC}°C`
                    : `${zone.temperatureC.toFixed(1)}°C`}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tempRule && zone.temperatureC >= tempRule.thresholdValue
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(10, ((zone.temperatureC - 16) / 18) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
                  <Droplets className="h-3 w-3" /> Humidity
                </span>
                <p className="mt-1 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
                  {zone.humidityPct}%
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-500/80 transition-all"
                    style={{ width: `${Math.min(100, Math.max(5, zone.humidityPct))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
                  <Sun className="h-3 w-3" /> Brightness
                </span>
                <p className="mt-1 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
                  {zone.brightness}{' '}
                  <span className="text-[11px] font-normal text-[#94A3B8]">rel</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      daylightRule && zone.brightness >= daylightRule.thresholdValue
                        ? 'bg-emerald-400'
                        : 'bg-[#94A3B8]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(6, (zone.brightness / 255) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="col-span-2 rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3">
                <span className="text-[11px] text-[#94A3B8]">Last Motion Detected</span>
                <p className="mt-1 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
                  {zone.lastMotionAt}{' '}
                  <span className="text-xs font-normal text-[#94A3B8]">
                    ({formatElapsed(zone.lastMotionSec)})
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Relative LDR scale (0–255 uncalibrated prototype reading)
                </p>
              </div>
            </div>

            {mode === 'advanced' && (
              <div className="mt-3 space-y-3 rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3.5 text-[11px]">
                <div className="flex flex-wrap items-center gap-4 font-mono text-[#94A3B8] tabular-nums">
                  <span>PIR: {zone.pirState}</span>
                  <span>LDR ADC: {zone.ldrRawAdc}</span>
                  <span>DHT11: {zone.dht11Status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
                  <label className="flex flex-col gap-1 text-[#94A3B8]">
                    <span>Room Fan Trigger (°C)</span>
                    <input
                      type="number"
                      min={18}
                      max={34}
                      step={0.5}
                      value={zone.tempThresholdOverrideC ?? tempRule?.thresholdValue ?? 27}
                      onChange={(e) =>
                        updateZoneThresholds(zone.id, {
                          tempThresholdOverrideC: Number(e.target.value),
                        })
                      }
                      className="rounded border border-white/10 bg-[#121417] px-2 py-1 font-mono text-xs text-[#F5F7F8]"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[#94A3B8]">
                    <span>Room Daylight Cutoff (rel)</span>
                    <input
                      type="number"
                      min={60}
                      max={250}
                      step={10}
                      value={zone.daylightThresholdOverride ?? daylightRule?.thresholdValue ?? 200}
                      onChange={(e) =>
                        updateZoneThresholds(zone.id, {
                          daylightThresholdOverride: Number(e.target.value),
                        })
                      }
                      className="rounded border border-white/10 bg-[#121417] px-2 py-1 font-mono text-xs text-[#F5F7F8]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Simulated Temperature Adjustment */}
            <div className="mt-4 border-t border-white/[0.06] pt-3.5">
              <label className="flex flex-col gap-1.5 text-xs text-[#94A3B8]">
                <div className="flex justify-between">
                  <span>Simulate Room Temperature</span>
                  <span className="font-mono text-[#F5F7F8] tabular-nums">
                    {Number.isInteger(zone.temperatureC)
                      ? `${zone.temperatureC}°C`
                      : `${zone.temperatureC.toFixed(1)}°C`}
                  </span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={34}
                  step={0.5}
                  value={zone.temperatureC}
                  onChange={(e) => setZoneTemperature(zone.id, Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* 2. APPLIANCE CONTROL */}
          <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
            <h3 className="border-b border-white/[0.08] pb-3.5 font-mono text-xs uppercase tracking-wider text-emerald-400">
              Appliance Control
            </h3>

            <div className="mt-4 space-y-3">
              {[
                { label: 'Light', circuit: lightCircuit, Icon: Lightbulb, category: 'lighting' as const },
                { label: 'Fan', circuit: fanCircuit, Icon: Fan, category: 'fan' as const },
              ].map(({ label, circuit, Icon, category }) => {
                if (!circuit) return null;
                return (
                  <div
                    key={circuit.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#0B0D10] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                          circuit.isOn
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                            : 'border-white/10 bg-[#121417] text-[#64748B]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#F5F7F8]">
                          {label}:{' '}
                          <span className={circuit.isOn ? 'text-emerald-400' : 'text-[#94A3B8]'}>
                            {circuit.isOn ? 'ON' : 'OFF'}
                          </span>
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          {circuit.name}
                          {mode === 'advanced' ? ` · Relay CH-0${circuit.relayChannel}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCircuitAutoMode(circuit.id)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                          circuit.autoMode
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/10 bg-[#121417] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {circuit.autoMode ? 'Auto' : 'Manual'}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleZoneAppliance(zone.id, category)}
                        className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                          circuit.isOn
                            ? 'bg-emerald-500 text-[#05100B] hover:bg-emerald-400'
                            : 'border border-white/15 bg-[#121417] text-[#CBD5E1] hover:text-white'
                        }`}
                      >
                        {circuit.isOn ? 'Turn OFF' : 'Turn ON'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. AUTOMATION */}
          <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
            <h3 className="border-b border-white/[0.08] pb-3.5 font-mono text-xs uppercase tracking-wider text-emerald-400">
              Automation
            </h3>

            <div className="mt-4 space-y-3">
              {smartLightingRule && (
                <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F5F7F8]">
                      Smart Lighting
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRuleEnabled(smartLightingRule.id)}
                      className={`rounded border px-2 py-0.5 font-mono text-[11px] cursor-pointer ${
                        smartLightingRule.enabled
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                          : 'border-white/10 bg-[#121417] text-[#64748B]'
                      }`}
                    >
                      {smartLightingRule.enabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    Threshold: {smartLightingRule.thresholdLabel} = {smartLightingRule.thresholdValue}{' '}
                    {smartLightingRule.thresholdUnit}
                  </p>
                  <p className="mt-1 text-xs text-[#CBD5E1]">
                    Room state:{' '}
                    {!smartLightingRule.enabled
                      ? 'Automation disabled (manual relay control)'
                      : !zone.occupied
                        ? 'Vacant (Light off)'
                        : daylightRule?.enabled && zone.brightness >= daylightRule.thresholdValue
                          ? 'Occupied (Held off by Daylight Optimization)'
                          : 'Occupied (Light permitted)'}
                  </p>
                </div>
              )}

              {daylightRule && (
                <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F5F7F8]">
                      Daylight Optimization
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRuleEnabled(daylightRule.id)}
                      className={`rounded border px-2 py-0.5 font-mono text-[11px] cursor-pointer ${
                        daylightRule.enabled
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                          : 'border-white/10 bg-[#121417] text-[#64748B]'
                      }`}
                    >
                      {daylightRule.enabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    Threshold: {daylightRule.thresholdLabel} = {daylightRule.thresholdValue}{' '}
                    {daylightRule.thresholdUnit}
                  </p>
                  <p className="mt-1 text-xs text-[#CBD5E1]">
                    Room state:{' '}
                    {zone.brightness >= daylightRule.thresholdValue
                      ? `${zone.brightness} rel sufficient — artificial light reduced`
                      : `${zone.brightness} rel below cutoff`}
                  </p>
                </div>
              )}

              {tempRule && (
                <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F5F7F8]">
                      Automatic Temperature Control
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRuleEnabled(tempRule.id)}
                      className={`rounded border px-2 py-0.5 font-mono text-[11px] cursor-pointer ${
                        tempRule.enabled
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                          : 'border-white/10 bg-[#121417] text-[#64748B]'
                      }`}
                    >
                      {tempRule.enabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    Threshold: {tempRule.thresholdLabel} = {tempRule.thresholdValue.toFixed(1)}{' '}
                    {tempRule.thresholdUnit}
                  </p>
                  <p className="mt-1 text-xs text-[#CBD5E1]">
                    Room state:{' '}
                    {zone.occupied && zone.temperatureC >= tempRule.thresholdValue
                      ? `${zone.temperatureC.toFixed(1)} °C exceeds threshold — fan active`
                      : zone.occupied
                        ? `${zone.temperatureC.toFixed(1)} °C below threshold`
                        : 'Room vacant — fan standby'}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 4. RECENT ACTIVITY */}
          <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
            <h3 className="border-b border-white/[0.08] pb-3.5 font-mono text-xs uppercase tracking-wider text-emerald-400">
              Recent Activity
            </h3>

            {roomActivities.length === 0 ? (
              <p className="mt-4 text-xs text-[#64748B]">
                No recent events recorded for {zone.name}.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-white/[0.06]">
                {roomActivities.map((evt) => (
                  <div key={evt.id} className="py-2.5">
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#64748B] tabular-nums">
                      <span>{evt.timestamp}</span>
                      <span className="text-emerald-400">{evt.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#F5F7F8]">{evt.description}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[#64748B]">{evt.device}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
};
