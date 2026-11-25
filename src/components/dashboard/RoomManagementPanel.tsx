import React from 'react';
import {
  ChevronRight,
  Droplets,
  Fan,
  Lightbulb,
  Sun,
  Thermometer,
} from 'lucide-react';
import { useEcosync } from '../../state/ecosyncStore';
import type { DashboardMode, ZoneId } from '../../types/ecosync';

interface RoomManagementPanelProps {
  mode: DashboardMode;
  selectedRoomId: ZoneId | null;
  onSelectRoom: (id: ZoneId) => void;
}

export const RoomManagementPanel: React.FC<RoomManagementPanelProps> = ({
  mode,
  selectedRoomId,
  onSelectRoom,
}) => {
  const { zones, circuits, toggleZoneAppliance } = useEcosync();

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
      <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#F5F7F8]">Room Monitoring & Control</h2>
          <p className="mt-0.5 text-xs text-[#94A3B8]">
            Click any room row to open its full sensor, appliance, automation, and activity view
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Occupied
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#64748B]" />
            Vacant
          </span>
        </div>
      </div>

      {/* Interactive Compact Room Rows */}
      <div className="mt-2 divide-y divide-white/[0.06]">
        {zones.map((zone) => {
          const lightCircuit = circuits.find(
            (c) => c.zoneId === zone.id && c.category === 'lighting'
          );
          const fanCircuit = circuits.find(
            (c) => c.zoneId === zone.id && c.category === 'fan'
          );
          const isSelected = selectedRoomId === zone.id;

          return (
            <div
              key={zone.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectRoom(zone.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRoom(zone.id);
                }
              }}
              aria-label={`Open details for ${zone.name}`}
              aria-pressed={isSelected}
              className={`group flex flex-col gap-3 px-3.5 py-4 -mx-3.5 rounded-lg border transition-colors cursor-pointer ${
                selectedRoomId
                  ? '2xl:flex-row 2xl:items-center 2xl:justify-between'
                  : 'lg:flex-row lg:items-center lg:justify-between'
              } ${
                isSelected
                  ? 'border-emerald-500/40 bg-emerald-500/[0.07]'
                  : 'border-transparent hover:bg-white/[0.03]'
              }`}
            >
              {/* Room Identity & Occupancy Indicator */}
              <div className="flex items-center gap-3 min-w-[190px]">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    zone.occupied ? 'bg-emerald-500' : 'bg-[#64748B]'
                  }`}
                />
                <div>
                  <span className="text-sm font-semibold text-[#F5F7F8] group-hover:text-emerald-400 transition-colors">
                    {zone.name}
                  </span>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className={zone.occupied ? 'text-emerald-400' : 'text-[#94A3B8]'}>
                      {zone.occupied ? 'Occupied' : 'Vacant'}
                    </span>
                    {!zone.senseConnected && (
                      <span className="font-mono text-[11px] text-amber-400">· SENSE Offline</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Environmental Telemetry Strip */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-xs text-[#CBD5E1] tabular-nums">
                <span className="inline-flex items-center gap-1.5" title="Temperature">
                  <Thermometer className="h-3.5 w-3.5 text-[#64748B]" />
                  {Number.isInteger(zone.temperatureC)
                    ? `${zone.temperatureC}°C`
                    : `${zone.temperatureC.toFixed(1)}°C`}
                </span>
                <span className="inline-flex items-center gap-1.5" title="Humidity">
                  <Droplets className="h-3.5 w-3.5 text-[#64748B]" />
                  {zone.humidityPct}%
                </span>
                <span
                  className="inline-flex items-center gap-1.5"
                  title="Ambient Brightness (Relative Reading)"
                >
                  <Sun className="h-3.5 w-3.5 text-[#64748B]" />
                  {zone.brightness} rel
                </span>

                {mode === 'advanced' && (
                  <span className="text-[11px] text-[#94A3B8]">
                    PIR:{zone.pirState} · ADC:{zone.ldrRawAdc} · DHT11:{zone.dht11Status}
                  </span>
                )}
              </div>

              {/* Direct Light, Fan, and Open Panel Controls */}
              <div
                className="flex flex-wrap items-center gap-2 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => toggleZoneAppliance(zone.id, 'lighting')}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    lightCircuit?.isOn
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      : 'border-white/10 bg-[#0B0D10] text-[#94A3B8] hover:text-[#F5F7F8]'
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Light {lightCircuit?.isOn ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleZoneAppliance(zone.id, 'fan')}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    fanCircuit?.isOn
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      : 'border-white/10 bg-[#0B0D10] text-[#94A3B8] hover:text-[#F5F7F8]'
                  }`}
                >
                  <Fan className="h-3.5 w-3.5" />
                  <span>Fan {fanCircuit?.isOn ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectRoom(zone.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#0B0D10] px-2.5 py-1.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-emerald-500/40 hover:text-emerald-400 cursor-pointer"
                >
                  <span>Inspect</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
