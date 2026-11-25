import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Cpu,
  Eye,
  Plus,
  Power,
  Radio,
  RotateCcw,
  Search,
  Settings,
  Sliders,
  Sun,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useEcosync } from '../state/ecosyncStore';
import type {
  AppManagementRoute,
  AppRoute,
  AutomationSystemId,
  DashboardMode,
  ZoneId,
} from '../types/ecosync';
import { EnergyAnalyticsPanel } from '../components/dashboard/EnergyAnalyticsPanel';
import { RoomManagementPanel } from '../components/dashboard/RoomManagementPanel';
import { RoomDetailPanel } from '../components/dashboard/RoomDetailPanel';
import { LiveActivityPanel } from '../components/dashboard/LiveActivityPanel';

interface DashboardPageProps {
  currentRoute: AppManagementRoute;
  onNavigate: (route: AppRoute) => void;
}

const APP_NAV_ITEMS: { route: AppManagementRoute; label: string }[] = [
  { route: '/app', label: 'Overview' },
  { route: '/app/rooms', label: 'Rooms' },
  { route: '/app/analytics', label: 'Analytics' },
  { route: '/app/automation', label: 'Automation' },
  { route: '/app/devices', label: 'Devices & Logs' },
  { route: '/app/settings', label: 'Settings' },
];

const MODE_STORAGE_KEY = 'ecosync_app_mode';

function readStoredMode(): DashboardMode {
  try {
    const val = window.localStorage.getItem(MODE_STORAGE_KEY);
    return val === 'advanced' ? 'advanced' : 'simple';
  } catch {
    return 'simple';
  }
}

function formatUptime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const {
    zones,
    circuits,
    rules,
    ambientDaylightPct,
    tariffInrPerKwh,
    totalWatts,
    averageVoltage,
    totalCurrentAmps,
    apparentPowerVa,
    reactivePowerVar,
    frequencyHz,
    powerFactor,
    cumulativeKwh,
    baselineKwh,
    estimatedCostInr,
    estimatedSavingsPct,
    coreConnected,
    wifiRssiDbm,
    uptimeSeconds,
    lastUpdatedAt,
    energyThresholds,
    bridgeConfig,
    setAmbientDaylightPct,
    setTariffInrPerKwh,
    updateEnergyThresholds,
    updateBridgeConfig,
    toggleZoneOccupancy,
    simulateInactivityTimeout,
    toggleCircuitManual,
    toggleCircuitAutoMode,
    toggleRuleEnabled,
    updateRuleThreshold,
    updateRuleDetails,
    createCustomRule,
    deleteCustomRule,
    setZoneTemperature,
    updateZoneThresholds,
    toggleCoreConnection,
    toggleSenseConnection,
    resetSimulationMetrics,
  } = useEcosync();

  const [mode, setMode] = useState<DashboardMode>(readStoredMode);
  const [selectedRoomId, setSelectedRoomId] = useState<ZoneId | null>(null);

  // Devices relay table filters
  const [zoneFilter, setZoneFilter] = useState<'all' | ZoneId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom automation rule creation form (Advanced Mode)
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleSensor, setNewRuleSensor] = useState('DHT11 Temperature Sensor');
  const [newRuleLabel, setNewRuleLabel] = useState('Upper Trigger');
  const [newRuleVal, setNewRuleVal] = useState(28);
  const [newRuleUnit, setNewRuleUnit] = useState('°C');
  const [newRuleHyst, setNewRuleHyst] = useState(1);
  const [newRulePriority, setNewRulePriority] = useState(4);
  const [newRuleZone, setNewRuleZone] = useState<ZoneId | 'all'>('all');

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  }, [mode]);

  const occupiedCount = zones.filter((z) => z.occupied).length;
  const connectedSenseCount = zones.filter((z) => z.senseConnected).length;
  const closedRelayCount = circuits.filter((c) => c.isOn).length;

  const senseOverallStatus =
    connectedSenseCount === zones.length
      ? 'Connected'
      : connectedSenseCount === 0
        ? 'Disconnected'
        : `Partial (${connectedSenseCount}/${zones.length})`;

  const sensorCommStatus =
    !coreConnected || connectedSenseCount === 0
      ? 'Disconnected'
      : connectedSenseCount < zones.length
        ? 'Degraded'
        : 'Nominal';

  const thresholdViolations = useMemo(() => {
    const list: string[] = [];
    if (totalWatts > energyThresholds.powerLimitW) {
      list.push(`Active power (${totalWatts} W) exceeds ${energyThresholds.powerLimitW} W limit`);
    }
    if (cumulativeKwh > energyThresholds.dailyEnergyLimitKwh) {
      list.push(
        `Daily energy (${cumulativeKwh.toFixed(2)} kWh) exceeds ${energyThresholds.dailyEnergyLimitKwh} kWh limit`
      );
    }
    if (estimatedCostInr > energyThresholds.dailyCostLimitInr) {
      list.push(
        `Estimated cost (₹${estimatedCostInr.toFixed(2)}) exceeds ₹${energyThresholds.dailyCostLimitInr} limit`
      );
    }
    return list;
  }, [totalWatts, cumulativeKwh, estimatedCostInr, energyThresholds]);

  const filteredCircuits = useMemo(() => {
    return circuits.filter((c) => {
      const matchesZone = zoneFilter === 'all' || c.zoneId === zoneFilter;
      const matchesQuery =
        searchQuery.trim() === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesZone && matchesQuery;
    });
  }, [circuits, zoneFilter, searchQuery]);

  const getRuleThresholdBounds = (id: AutomationSystemId) => {
    if (id === 'smart-lighting') return { min: 30, max: 300, step: 15 };
    if (id === 'daylight-optimization') return { min: 100, max: 250, step: 10 };
    if (id === 'temp-control') return { min: 20, max: 32, step: 0.5 };
    return { min: 0, max: 300, step: 1 };
  };

  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    createCustomRule({
      name: newRuleName,
      shortDescription: newRuleDesc || 'Custom automated threshold rule.',
      sensorSource: newRuleSensor,
      thresholdLabel: newRuleLabel,
      thresholdValue: newRuleVal,
      thresholdUnit: newRuleUnit,
      hysteresis: newRuleHyst,
      priority: newRulePriority,
      targetZoneId: newRuleZone,
    });
    setNewRuleName('');
    setNewRuleDesc('');
    setShowCreateRule(false);
  };

  return (
    <div className="min-h-screen bg-[#090A0B] text-[#F5F7F8]">
      {/* Standalone Management Application Shell Header */}
      <div className="border-b border-white/[0.08] bg-[#0D0F12]">
        <div className="mx-auto max-w-[1440px] px-6 py-5 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold tracking-[0.18em] text-[#F2F4F2]">
                  ECOSYNC
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400">
                  Management Console
                </span>
                <span className="text-[#475569]" aria-hidden="true">
                  /
                </span>
                <span className="font-mono text-[11px] font-medium tracking-wider text-amber-300">
                  {bridgeConfig.transport === 'simulation'
                    ? 'SIMULATED TELEMETRY ACTIVE'
                    : `READY (${bridgeConfig.transport.toUpperCase()} · SIMULATED)`}
                </span>
              </div>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-[#F5F7F8] sm:text-2xl">
                {mode === 'advanced'
                  ? 'Energy Operations & Engineering Console'
                  : 'Smart Home Energy Management'}
              </h1>
            </div>

            {/* Persistent Simple / Advanced Mode Switch */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex items-center rounded-md border border-white/10 bg-[#121417] p-1"
                role="group"
                aria-label="Management application mode"
              >
                <button
                  type="button"
                  onClick={() => setMode('simple')}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    mode === 'simple'
                      ? 'bg-emerald-500 text-[#05100B]'
                      : 'text-[#94A3B8] hover:text-[#F5F7F8]'
                  }`}
                >
                  Simple Mode
                </button>
                <button
                  type="button"
                  onClick={() => setMode('advanced')}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    mode === 'advanced'
                      ? 'bg-emerald-500 text-[#05100B]'
                      : 'text-[#94A3B8] hover:text-[#F5F7F8]'
                  }`}
                >
                  Advanced Mode
                </button>
              </div>
            </div>
          </div>

          {/* System Health Strip */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-[#121417] px-4 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    coreConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="text-[#94A3B8]">ECOSYNC CORE:</span>
                <span
                  className={`font-medium ${
                    coreConnected ? 'text-[#F5F7F8]' : 'text-rose-400'
                  }`}
                >
                  {coreConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    connectedSenseCount === zones.length
                      ? 'bg-emerald-500'
                      : connectedSenseCount > 0
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                  }`}
                />
                <span className="text-[#94A3B8]">ECOSYNC SENSE:</span>
                <span className="font-medium text-[#F5F7F8]">{senseOverallStatus}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#94A3B8]">Sensor comm:</span>
                <span
                  className={`font-medium ${
                    sensorCommStatus === 'Nominal'
                      ? 'text-emerald-400'
                      : sensorCommStatus === 'Degraded'
                        ? 'text-amber-300'
                        : 'text-rose-400'
                  }`}
                >
                  {sensorCommStatus}
                </span>
              </div>

              {mode === 'advanced' && (
                <>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#94A3B8]">
                    <span>Relays:</span>
                    <span className="text-[#F5F7F8]">{closedRelayCount}/8 closed</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#94A3B8]">
                    <span>Uptime:</span>
                    <span className="text-[#F5F7F8]">{formatUptime(uptimeSeconds)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
              Last update: <span className="text-[#F5F7F8]">{lastUpdatedAt}</span>
            </div>
          </div>

          {/* Dedicated /app/* Navigation Bar */}
          <nav
            className="mt-4 flex flex-wrap items-center gap-2"
            aria-label="Management application sections"
          >
            {APP_NAV_ITEMS.map((item) => {
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className={`rounded-md border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/[0.08] bg-[#121417] text-[#94A3B8] hover:text-[#F5F7F8]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        {/* Threshold Violation Banner (Advanced Mode) */}
        {mode === 'advanced' && thresholdViolations.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Configured Threshold Alert</p>
              <ul className="mt-1 space-y-0.5">
                {thresholdViolations.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROUTE: /app (OVERVIEW)                                       */}
        {/* ============================================================ */}
        {currentRoute === '/app' && (
          <div className="space-y-8">
            {mode === 'simple' ? (
              <section aria-label="Primary energy summary">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
                    <span className="text-xs font-medium text-[#94A3B8]">Energy Consumed</span>
                    <p className="mt-2 font-mono text-2xl font-semibold text-[#F5F7F8] tabular-nums">
                      {cumulativeKwh.toFixed(2)}{' '}
                      <span className="text-sm font-normal text-[#94A3B8]">kWh</span>
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">Simulated cycle usage</p>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
                    <span className="text-xs font-medium text-[#94A3B8]">
                      Estimated Electricity Cost
                    </span>
                    <p className="mt-2 font-mono text-2xl font-semibold text-[#F5F7F8] tabular-nums">
                      ₹{estimatedCostInr.toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      At ₹{tariffInrPerKwh.toFixed(2)} / kWh tariff
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
                    <span className="text-xs font-medium text-[#94A3B8]">Estimated Savings</span>
                    <p className="mt-2 font-mono text-2xl font-semibold text-emerald-400 tabular-nums">
                      {estimatedSavingsPct}%
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {rules.filter((r) => r.enabled).length} of {rules.length} automations active
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
                    <span className="text-xs font-medium text-[#94A3B8]">Occupied Rooms</span>
                    <p className="mt-2 font-mono text-2xl font-semibold text-[#F5F7F8] tabular-nums">
                      {occupiedCount}{' '}
                      <span className="text-sm font-normal text-[#94A3B8]">/ {zones.length}</span>
                    </p>
                    <p className="mt-1 text-xs text-[#64748B] truncate">
                      {zones
                        .filter((z) => z.occupied)
                        .map((z) => z.name)
                        .join(', ') || 'All rooms vacant'}
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <div className="space-y-6">
                {/* Electrical Measurements (PZEM-004T Supported + Derived) */}
                <section aria-label="Electrical measurements">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                      Electrical Measurements (PZEM-004T Bus · Simulated)
                    </h2>
                    <span className="font-mono text-[11px] text-[#64748B]">
                      Wi-Fi RSSI: {coreConnected ? `${wifiRssiDbm} dBm` : 'Offline'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                    {[
                      { label: 'Voltage', val: `${averageVoltage.toFixed(1)} V`, sub: 'AC RMS' },
                      { label: 'Current', val: `${totalCurrentAmps.toFixed(2)} A`, sub: 'Line RMS' },
                      {
                        label: 'Active Power',
                        val: `${totalWatts} W`,
                        sub: `${closedRelayCount}/8 relays`,
                        accent: true,
                      },
                      { label: 'Apparent Power', val: `${apparentPowerVa} VA`, sub: 'V × I' },
                      { label: 'Reactive Power', val: `${reactivePowerVar} VAR`, sub: 'Calculated' },
                      { label: 'Power Factor', val: `${powerFactor.toFixed(2)} PF`, sub: 'Bus avg' },
                      { label: 'Frequency', val: `${frequencyHz.toFixed(1)} Hz`, sub: 'Nominal AC' },
                      {
                        label: 'Accum. Energy',
                        val: `${cumulativeKwh.toFixed(3)} kWh`,
                        sub: `₹${estimatedCostInr.toFixed(2)}`,
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="rounded-xl border border-white/[0.08] bg-[#121417] p-3.5"
                      >
                        <span className="text-[11px] text-[#94A3B8]">{card.label}</span>
                        <p
                          className={`mt-1 font-mono text-base font-semibold tabular-nums ${
                            card.accent ? 'text-emerald-400' : 'text-[#F5F7F8]'
                          }`}
                        >
                          {card.val}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-[#64748B]">{card.sub}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Energy Performance & System Health Summary */}
                <section aria-label="Energy performance summary">
                  <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-[#38BDF8]">
                    Energy Performance Projections (Simulated)
                  </h2>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                    <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-4">
                      <span className="text-xs text-[#94A3B8]">Daily Consumption</span>
                      <p className="mt-1 font-mono text-lg font-semibold text-[#F5F7F8] tabular-nums">
                        {cumulativeKwh.toFixed(2)} kWh
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-4">
                      <span className="text-xs text-[#94A3B8]">Weekly Projected</span>
                      <p className="mt-1 font-mono text-lg font-semibold text-[#F5F7F8] tabular-nums">
                        {(cumulativeKwh * 6.4).toFixed(1)} kWh
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-4">
                      <span className="text-xs text-[#94A3B8]">Monthly Projected</span>
                      <p className="mt-1 font-mono text-lg font-semibold text-[#F5F7F8] tabular-nums">
                        {(cumulativeKwh * 26.8).toFixed(0)} kWh
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-4">
                      <span className="text-xs text-[#94A3B8]">Peak Demand</span>
                      <p className="mt-1 font-mono text-lg font-semibold text-[#F5F7F8] tabular-nums">
                        {Math.max(totalWatts, 370)} W
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-4">
                      <span className="text-xs text-[#94A3B8]">Avg Power Draw</span>
                      <p className="mt-1 font-mono text-lg font-semibold text-[#F5F7F8] tabular-nums">
                        {Math.round((totalWatts + 148) / 2)} W
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-4">
                      <span className="text-xs text-[#94A3B8]">Savings vs Baseline</span>
                      <p className="mt-1 font-mono text-lg font-semibold text-emerald-400 tabular-nums">
                        {estimatedSavingsPct}% ({(baselineKwh - cumulativeKwh).toFixed(2)} kWh)
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Room Monitoring & Control + Right-Side Room Detail Panel */}
            <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-12">
              <div className={selectedRoomId ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}>
                <RoomManagementPanel
                  mode={mode}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                />
              </div>

              {selectedRoomId && (
                <div className="lg:col-span-6 xl:col-span-5">
                  <RoomDetailPanel
                    roomId={selectedRoomId}
                    mode={mode}
                    onSelectRoom={setSelectedRoomId}
                    onClose={() => setSelectedRoomId(null)}
                  />
                </div>
              )}
            </div>

            {/* Automation Status */}
            <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
              <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#F5F7F8]">Automation Status</h2>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    Control rules evaluated locally by ECOSYNC CORE using SENSE readings
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('/app/automation')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-[#0B0D10] px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:border-emerald-500/40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Configure Rules</span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col justify-between rounded-lg border border-white/[0.08] bg-[#0B0D10] p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#F5F7F8]">{rule.name}</h3>
                          <p className="mt-1 text-xs text-[#94A3B8]">{rule.shortDescription}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleRuleEnabled(rule.id)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                            rule.enabled
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                              : 'border-white/10 bg-[#121417] text-[#64748B] hover:text-[#CBD5E1]'
                          }`}
                        >
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      <dl className="mt-4 space-y-2 border-t border-white/[0.06] pt-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-[#64748B]">Threshold</dt>
                          <dd className="font-mono text-[#F5F7F8] tabular-nums">
                            {rule.thresholdLabel}: {rule.thresholdValue} {rule.thresholdUnit}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-[#64748B]">Condition</dt>
                          <dd className="text-right text-[#CBD5E1]">{rule.currentCondition}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-4 border-t border-white/[0.06] pt-3">
                      <p className="text-[11px] text-[#64748B]">
                        Last triggered: <span className="text-[#94A3B8]">{rule.lastTriggered}</span>
                      </p>
                      {mode === 'advanced' && (
                        <p className="mt-1 font-mono text-[11px] text-emerald-400">
                          Priority P{rule.priority} · {rule.triggerDescription}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <EnergyAnalyticsPanel
                  mode={mode}
                  totalWatts={totalWatts}
                  cumulativeKwh={cumulativeKwh}
                  baselineKwh={baselineKwh}
                />
              </div>
              <div className="xl:col-span-5">
                <LiveActivityPanel mode={mode} />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROUTE: /app/rooms (ROOM MANAGEMENT)                          */}
        {/* ============================================================ */}
        {currentRoute === '/app/rooms' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#121417] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-[#F5F7F8]">
                  Ambient Daylight Simulation (LDR Input)
                </h2>
                <p className="mt-0.5 text-xs text-[#94A3B8]">
                  Adjust outdoor daylight to test LDR brightness readings and Daylight Optimization
                  across all four rooms
                </p>
              </div>
              <label className="flex items-center gap-3 text-xs text-[#CBD5E1]">
                <Sun className="h-4 w-4 text-emerald-400" />
                <span>Daylight</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ambientDaylightPct}
                  onChange={(e) => setAmbientDaylightPct(Number(e.target.value))}
                  className="w-40 accent-emerald-500 cursor-pointer"
                />
                <span className="w-10 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
                  {ambientDaylightPct}%
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-12">
              <div className={selectedRoomId ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}>
                <RoomManagementPanel
                  mode={mode}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                />
              </div>

              {selectedRoomId && (
                <div className="lg:col-span-6 xl:col-span-5">
                  <RoomDetailPanel
                    roomId={selectedRoomId}
                    mode={mode}
                    onSelectRoom={setSelectedRoomId}
                    onClose={() => setSelectedRoomId(null)}
                  />
                </div>
              )}
            </div>

            <LiveActivityPanel mode={mode} />
          </div>
        )}

        {/* ============================================================ */}
        {/* ROUTE: /app/analytics (DETAILED ENERGY ANALYTICS)            */}
        {/* ============================================================ */}
        {currentRoute === '/app/analytics' && (
          <div className="space-y-6">
            <EnergyAnalyticsPanel
              mode={mode}
              totalWatts={totalWatts}
              cumulativeKwh={cumulativeKwh}
              baselineKwh={baselineKwh}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* ROUTE: /app/automation (AUTOMATION CONFIGURATION)            */}
        {/* ============================================================ */}
        {currentRoute === '/app/automation' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
              <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    <h2 className="text-base font-bold text-[#F5F7F8]">
                      Automation Engine & Threshold Controls
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Configure rule thresholds, hysteresis, priority, or trigger simulated sensor
                    events
                  </p>
                </div>

                {mode === 'advanced' && (
                  <button
                    type="button"
                    onClick={() => setShowCreateRule((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-[#05100B] hover:bg-emerald-400 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Custom Rule</span>
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleZoneOccupancy('study')}
                  className="rounded-md border border-white/15 bg-[#0B0D10] px-3 py-1.5 text-xs font-medium text-[#F5F7F8] hover:border-emerald-500/40 cursor-pointer"
                >
                  Toggle Study Room Motion
                </button>
                <button
                  type="button"
                  onClick={() => setZoneTemperature('living', 28.0)}
                  className="rounded-md border border-white/15 bg-[#0B0D10] px-3 py-1.5 text-xs font-medium text-[#F5F7F8] hover:border-emerald-500/40 cursor-pointer"
                >
                  Raise Living Room Temp to 28°C
                </button>
                <button
                  type="button"
                  onClick={() => setAmbientDaylightPct(85)}
                  className="rounded-md border border-white/15 bg-[#0B0D10] px-3 py-1.5 text-xs font-medium text-[#F5F7F8] hover:border-emerald-500/40 cursor-pointer"
                >
                  Simulate Bright Daylight (85%)
                </button>
                <button
                  type="button"
                  onClick={() => simulateInactivityTimeout('living')}
                  className="rounded-md border border-white/15 bg-[#0B0D10] px-3 py-1.5 text-xs font-medium text-[#F5F7F8] hover:border-emerald-500/40 cursor-pointer"
                >
                  Trigger Living Room Inactivity Timeout
                </button>
              </div>

              {mode === 'advanced' && showCreateRule && (
                <form
                  onSubmit={handleCreateRuleSubmit}
                  className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-[#0B0D10] p-4 sm:grid-cols-3"
                >
                  <input
                    type="text"
                    required
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="Rule Name (e.g. Peak Demand Cutoff)"
                    className="rounded border border-white/10 bg-[#121417] px-3 py-2 text-xs text-[#F5F7F8]"
                  />
                  <input
                    type="text"
                    value={newRuleDesc}
                    onChange={(e) => setNewRuleDesc(e.target.value)}
                    placeholder="Short Description"
                    className="rounded border border-white/10 bg-[#121417] px-3 py-2 text-xs text-[#F5F7F8]"
                  />
                  <select
                    value={newRuleSensor}
                    onChange={(e) => setNewRuleSensor(e.target.value)}
                    className="rounded border border-white/10 bg-[#121417] px-3 py-2 text-xs text-[#F5F7F8]"
                  >
                    <option>PIR Motion Sensor</option>
                    <option>LDR Ambient Light Sensor</option>
                    <option>DHT11 Temperature Sensor</option>
                    <option>PZEM-004T Energy Monitor</option>
                  </select>
                  <input
                    type="text"
                    value={newRuleLabel}
                    onChange={(e) => setNewRuleLabel(e.target.value)}
                    placeholder="Threshold Label"
                    className="rounded border border-white/10 bg-[#121417] px-3 py-2 text-xs text-[#F5F7F8]"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newRuleVal}
                      onChange={(e) => setNewRuleVal(Number(e.target.value))}
                      className="w-24 rounded border border-white/10 bg-[#121417] px-3 py-2 font-mono text-xs text-[#F5F7F8]"
                    />
                    <input
                      type="text"
                      value={newRuleUnit}
                      onChange={(e) => setNewRuleUnit(e.target.value)}
                      placeholder="Unit"
                      className="w-20 rounded border border-white/10 bg-[#121417] px-3 py-2 font-mono text-xs text-[#F5F7F8]"
                    />
                    <input
                      type="number"
                      value={newRuleHyst}
                      onChange={(e) => setNewRuleHyst(Number(e.target.value))}
                      placeholder="Hyst"
                      className="w-20 rounded border border-white/10 bg-[#121417] px-3 py-2 font-mono text-xs text-[#F5F7F8]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={newRuleZone}
                      onChange={(e) => setNewRuleZone(e.target.value as ZoneId | 'all')}
                      className="rounded border border-white/10 bg-[#121417] px-3 py-2 text-xs text-[#F5F7F8]"
                    >
                      <option value="all">All Rooms</option>
                      <option value="living">Living Room</option>
                      <option value="bedroom">Bedroom</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="study">Study Room</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newRulePriority}
                      onChange={(e) => setNewRulePriority(Number(e.target.value))}
                      title="Priority"
                      className="w-16 rounded border border-white/10 bg-[#121417] px-2 py-2 font-mono text-xs text-[#F5F7F8]"
                    />
                    <button
                      type="submit"
                      className="rounded bg-emerald-500 px-3 py-2 text-xs font-semibold text-[#05100B] cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {rules.map((rule) => {
                const bounds = getRuleThresholdBounds(rule.id);
                return (
                  <div
                    key={rule.id}
                    className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#121417] p-6"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#64748B]">
                            {rule.sensorSource}
                          </span>
                          <h3 className="mt-1 text-lg font-bold text-[#F5F7F8]">{rule.name}</h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleRuleEnabled(rule.id)}
                            className={`rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer shrink-0 ${
                              rule.enabled
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                : 'border-white/10 bg-[#0B0D10] text-[#64748B] hover:text-white'
                            }`}
                          >
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </button>

                          {mode === 'advanced' && rule.isCustom && (
                            <button
                              type="button"
                              onClick={() => deleteCustomRule(rule.id)}
                              aria-label={`Delete ${rule.name}`}
                              className="rounded-md border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-2.5 text-sm text-[#94A3B8]">{rule.shortDescription}</p>

                      <div className="mt-5 rounded-lg border border-white/[0.06] bg-[#0B0D10] p-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#94A3B8]">{rule.thresholdLabel}</span>
                          <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                            {rule.thresholdValue} {rule.thresholdUnit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={bounds.min}
                          max={bounds.max}
                          step={bounds.step}
                          value={rule.thresholdValue}
                          onChange={(e) =>
                            updateRuleThreshold(rule.id, Number(e.target.value))
                          }
                          className="mt-3 w-full accent-emerald-500 cursor-pointer"
                        />

                        {mode === 'advanced' && (
                          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
                            <label className="flex flex-col gap-1 text-[#94A3B8]">
                              <span>Hysteresis ({rule.thresholdUnit})</span>
                              <input
                                type="number"
                                step={0.5}
                                value={rule.hysteresis ?? 0}
                                onChange={(e) =>
                                  updateRuleDetails(rule.id, {
                                    hysteresis: Number(e.target.value),
                                  })
                                }
                                className="rounded border border-white/10 bg-[#121417] px-2 py-1 font-mono text-[#F5F7F8]"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-[#94A3B8]">
                              <span>Priority</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={rule.priority}
                                onChange={(e) =>
                                  updateRuleDetails(rule.id, {
                                    priority: Number(e.target.value),
                                  })
                                }
                                className="rounded border border-white/10 bg-[#121417] px-2 py-1 font-mono text-[#F5F7F8]"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs">
                        <p className="text-[#94A3B8]">
                          Condition: <span className="text-[#F5F7F8]">{rule.currentCondition}</span>
                        </p>
                        <p className="text-[#94A3B8]">
                          Last triggered:{' '}
                          <span className="text-[#CBD5E1]">{rule.lastTriggered}</span>
                        </p>
                        {mode === 'advanced' && (
                          <p className="pt-1 font-mono text-[11px] text-emerald-400">
                            {rule.triggerDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <LiveActivityPanel mode={mode} />
          </div>
        )}

        {/* ============================================================ */}
        {/* ROUTE: /app/devices (DEVICES, DIAGNOSTICS & TECHNICAL LOGS)  */}
        {/* ============================================================ */}
        {currentRoute === '/app/devices' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* ECOSYNC CORE Card */}
              <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-6 lg:col-span-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0B0D10] text-emerald-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#F5F7F8]">ECOSYNC CORE</h2>
                      <p className="text-xs text-[#94A3B8]">
                        ESP32 Controller · PZEM-004T Metering · 8-Channel Relays
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleCoreConnection}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer shrink-0 ${
                      coreConnected
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {coreConnected ? (
                      <>
                        <Wifi className="h-3.5 w-3.5" />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3.5 w-3.5" />
                        <span>Disconnected</span>
                      </>
                    )}
                  </button>
                </div>

                <dl className="mt-4 divide-y divide-white/[0.06] text-xs font-mono tabular-nums">
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#94A3B8]">Controller State</dt>
                    <dd className="text-[#F5F7F8]">
                      {coreConnected ? 'ESP32 Online (Simulated)' : 'ESP32 Offline'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#94A3B8]">Active Power (PZEM-004T)</dt>
                    <dd className="text-[#F5F7F8]">{totalWatts} W</dd>
                  </div>
                  {mode === 'advanced' && (
                    <>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-[#94A3B8]">Voltage / Current</dt>
                        <dd className="text-[#F5F7F8]">
                          {averageVoltage.toFixed(1)} V · {totalCurrentAmps.toFixed(2)} A
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-[#94A3B8]">Apparent / Power Factor</dt>
                        <dd className="text-[#F5F7F8]">
                          {apparentPowerVa} VA · {powerFactor.toFixed(2)} PF
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-[#94A3B8]">Wi-Fi RSSI / Uptime</dt>
                        <dd className="text-[#F5F7F8]">
                          {coreConnected ? `${wifiRssiDbm} dBm` : 'N/A'} · {formatUptime(uptimeSeconds)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>

              {/* 4 ECOSYNC SENSE Nodes */}
              <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-6 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Eye className="h-4 w-4 text-emerald-400" />
                    <h2 className="text-base font-bold text-[#F5F7F8]">ECOSYNC SENSE Nodes</h2>
                  </div>
                  <span className="font-mono text-xs text-[#94A3B8]">
                    {connectedSenseCount} / {zones.length} Online
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {zones.map((z) => (
                    <div
                      key={z.id}
                      className="rounded-lg border border-white/[0.08] bg-[#0B0D10] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#F5F7F8]">{z.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleSenseConnection(z.id)}
                          className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium cursor-pointer ${
                            z.senseConnected
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          }`}
                        >
                          <Radio className="h-3 w-3" />
                          <span>{z.senseConnected ? 'Connected' : 'Disconnected'}</span>
                        </button>
                      </div>

                      <div className="mt-3 space-y-1 font-mono text-xs text-[#94A3B8] tabular-nums">
                        <div className="flex justify-between">
                          <span>Occupancy (PIR)</span>
                          <span className="text-[#F5F7F8]">
                            {z.occupied ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>DHT11 Temp / RH</span>
                          <span className="text-[#F5F7F8]">
                            {z.temperatureC.toFixed(1)} °C · {z.humidityPct}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>LDR Brightness</span>
                          <span className="text-[#F5F7F8]">{z.brightness} rel</span>
                        </div>
                        {mode === 'advanced' && (
                          <div className="mt-2 space-y-1.5 border-t border-white/[0.06] pt-2 text-[11px]">
                            <div className="flex justify-between">
                              <span>PIR / ADC / DHT11</span>
                              <span className="text-emerald-400">
                                {z.pirState} · {z.ldrRawAdc} · {z.dht11Status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <label className="flex flex-col gap-0.5 text-[#94A3B8]">
                                <span>LDR Offset</span>
                                <input
                                  type="number"
                                  min={-50}
                                  max={50}
                                  value={z.ldrCalibrationOffset}
                                  onChange={(e) =>
                                    updateZoneThresholds(z.id, {
                                      ldrCalibrationOffset: Number(e.target.value),
                                    })
                                  }
                                  className="rounded border border-white/10 bg-[#121417] px-2 py-0.5 text-[#F5F7F8]"
                                />
                              </label>
                              <label className="flex flex-col gap-0.5 text-[#94A3B8]">
                                <span>Temp Offset (°C)</span>
                                <input
                                  type="number"
                                  min={-5}
                                  max={5}
                                  step={0.5}
                                  value={z.tempCalibrationOffset}
                                  onChange={(e) =>
                                    updateZoneThresholds(z.id, {
                                      tempCalibrationOffset: Number(e.target.value),
                                    })
                                  }
                                  className="rounded border border-white/10 bg-[#121417] px-2 py-0.5 text-[#F5F7F8]"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 8-Channel Appliance Relay Table */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
              <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <div>
                    <h2 className="text-base font-bold text-[#F5F7F8]">
                      ECOSYNC CORE · Appliance Relay Channels
                    </h2>
                    <p className="mt-0.5 text-xs text-[#94A3B8]">
                      Manual relay overrides or automatic SENSE-driven switching across all 8
                      channels
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter appliances..."
                      className="rounded-md border border-white/10 bg-[#0B0D10] py-1.5 pl-8 pr-3 text-xs text-[#F5F7F8] placeholder:text-[#64748B] focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 rounded-md border border-white/10 bg-[#0B0D10] p-1">
                    {(['all', 'living', 'bedroom', 'kitchen', 'study'] as const).map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZoneFilter(z)}
                        className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                          zoneFilter === z
                            ? 'bg-emerald-500 text-[#05100B]'
                            : 'text-[#94A3B8] hover:text-[#F5F7F8]'
                        }`}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-xs font-medium text-[#64748B]">
                      <th className="py-3 pr-4">Channel</th>
                      <th className="py-3 pr-4">Appliance</th>
                      <th className="py-3 pr-4">Control Mode</th>
                      {mode === 'advanced' && <th className="py-3 pr-4 text-right">Est. Draw</th>}
                      <th className="py-3 text-right">Relay State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredCircuits.map((circuit) => (
                      <tr key={circuit.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 pr-4 font-mono text-xs text-[#64748B] tabular-nums">
                          CH-0{circuit.relayChannel}
                        </td>
                        <td className="py-3.5 pr-4 font-medium text-[#F5F7F8]">{circuit.name}</td>
                        <td className="py-3.5 pr-4">
                          <button
                            type="button"
                            onClick={() => toggleCircuitAutoMode(circuit.id)}
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                              circuit.autoMode
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-white/10 bg-[#0B0D10] text-[#94A3B8] hover:text-[#F5F7F8]'
                            }`}
                          >
                            {circuit.autoMode ? 'Auto via SENSE' : 'Manual Override'}
                          </button>
                        </td>
                        {mode === 'advanced' && (
                          <td className="py-3.5 pr-4 text-right font-mono text-xs text-[#CBD5E1] tabular-nums">
                            {circuit.currentWatts} W · {circuit.powerFactor.toFixed(2)} PF
                          </td>
                        )}
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => toggleCircuitManual(circuit.id)}
                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              circuit.isOn
                                ? 'bg-emerald-500 text-[#05100B] hover:bg-emerald-400'
                                : 'border border-white/15 bg-[#0B0D10] text-[#94A3B8] hover:text-[#F5F7F8]'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            <span>{circuit.isOn ? 'ON' : 'OFF'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <LiveActivityPanel mode={mode} />
          </div>
        )}

        {/* ============================================================ */}
        {/* ROUTE: /app/settings (SETTINGS & SYSTEM INTEGRATION)         */}
        {/* ============================================================ */}
        {currentRoute === '/app/settings' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4">
                <Settings className="h-4 w-4 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold text-[#F5F7F8]">
                    {mode === 'advanced'
                      ? 'Professional System & Telemetry Configuration'
                      : 'Household Energy Settings'}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    Changes apply immediately across both Simple and Advanced views
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Everyday Tariff & Cycle Controls */}
                <div className="space-y-4 rounded-lg border border-white/[0.08] bg-[#0B0D10] p-5">
                  <h3 className="text-sm font-semibold text-[#F5F7F8]">Billing & Simulation Cycle</h3>
                  <label className="flex flex-col gap-1.5 text-xs text-[#94A3B8]">
                    <span>Electricity Tariff (₹ / kWh)</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      step={0.1}
                      value={tariffInrPerKwh}
                      onChange={(e) => setTariffInrPerKwh(Number(e.target.value))}
                      className="rounded-md border border-white/10 bg-[#121417] px-3 py-2 font-mono text-sm text-[#F5F7F8]"
                    />
                  </label>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={resetSimulationMetrics}
                      className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-[#121417] px-4 py-2 text-xs font-semibold text-[#F5F7F8] hover:border-emerald-500/40 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Reset Simulated Cycle Counters</span>
                    </button>
                  </div>
                </div>

                {/* Advanced Alert Thresholds & ESP32 Hardware Integration */}
                {mode === 'advanced' ? (
                  <>
                    <div className="space-y-4 rounded-lg border border-white/[0.08] bg-[#0B0D10] p-5">
                      <h3 className="text-sm font-semibold text-[#F5F7F8]">
                        Alert & Energy Thresholds
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                        <label className="flex flex-col gap-1 text-[#94A3B8]">
                          <span>Power Limit (W)</span>
                          <input
                            type="number"
                            value={energyThresholds.powerLimitW}
                            onChange={(e) =>
                              updateEnergyThresholds({ powerLimitW: Number(e.target.value) })
                            }
                            className="rounded border border-white/10 bg-[#121417] px-2.5 py-2 font-mono text-[#F5F7F8]"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[#94A3B8]">
                          <span>Daily Energy (kWh)</span>
                          <input
                            type="number"
                            step={0.5}
                            value={energyThresholds.dailyEnergyLimitKwh}
                            onChange={(e) =>
                              updateEnergyThresholds({
                                dailyEnergyLimitKwh: Number(e.target.value),
                              })
                            }
                            className="rounded border border-white/10 bg-[#121417] px-2.5 py-2 font-mono text-[#F5F7F8]"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[#94A3B8]">
                          <span>Daily Cost (₹)</span>
                          <input
                            type="number"
                            value={energyThresholds.dailyCostLimitInr}
                            onChange={(e) =>
                              updateEnergyThresholds({
                                dailyCostLimitInr: Number(e.target.value),
                              })
                            }
                            className="rounded border border-white/10 bg-[#121417] px-2.5 py-2 font-mono text-[#F5F7F8]"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-white/[0.08] bg-[#0B0D10] p-5 lg:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#F5F7F8]">
                          ESP32 Hardware Communication & Sampling
                        </h3>
                        <span className="font-mono text-[11px] text-amber-300">
                          Simulated mode active — no physical ESP32 attached
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
                        <label className="flex flex-col gap-1 text-[#94A3B8]">
                          <span>Telemetry Source</span>
                          <select
                            value={bridgeConfig.transport}
                            onChange={(e) =>
                              updateBridgeConfig({
                                transport: e.target.value as 'simulation' | 'mqtt' | 'http',
                              })
                            }
                            className="rounded border border-white/10 bg-[#121417] px-2.5 py-2 text-[#F5F7F8]"
                          >
                            <option value="simulation">Internal Simulation</option>
                            <option value="mqtt">MQTT Broker (Standby)</option>
                            <option value="http">ESP32 HTTP REST (Standby)</option>
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-[#94A3B8]">
                          <span>Broker / Controller Endpoint</span>
                          <input
                            type="text"
                            value={bridgeConfig.brokerOrEndpoint}
                            onChange={(e) =>
                              updateBridgeConfig({ brokerOrEndpoint: e.target.value })
                            }
                            className="rounded border border-white/10 bg-[#121417] px-2.5 py-2 font-mono text-[#F5F7F8]"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[#94A3B8]">
                          <span>Topic / Namespace</span>
                          <input
                            type="text"
                            value={bridgeConfig.topicPrefix}
                            onChange={(e) => updateBridgeConfig({ topicPrefix: e.target.value })}
                            className="rounded border border-white/10 bg-[#121417] px-2.5 py-2 font-mono text-[#F5F7F8]"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[#94A3B8]">
                          <span>Data Refresh Interval</span>
                          <select
                            value={bridgeConfig.pollIntervalMs}
                            onChange={(e) =>
                              updateBridgeConfig({ pollIntervalMs: Number(e.target.value) })
                            }
                            className="rounded border border-white/10 bg-[#121417] px-2.5 py-2 font-mono text-[#F5F7F8]"
                          >
                            <option value={1000}>1000 ms (1s)</option>
                            <option value={3000}>3000 ms (3s)</option>
                            <option value={5000}>5000 ms (5s)</option>
                            <option value={10000}>10000 ms (10s)</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col justify-between rounded-lg border border-white/[0.08] bg-[#0B0D10] p-5 text-xs text-[#94A3B8]">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F7F8]">
                        Professional Controls
                      </h3>
                      <p className="mt-2 leading-relaxed">
                        Switch to Advanced Mode in the header above to configure alert thresholds,
                        hysteresis deadbands, sensor calibration offsets, and ESP32 MQTT/HTTP
                        communication intervals.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMode('advanced')}
                      className="mt-4 self-start rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 cursor-pointer"
                    >
                      Switch to Advanced Mode
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
