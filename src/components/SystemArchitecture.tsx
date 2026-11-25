import React, { useState } from 'react';
import { Cpu, Eye, Radio, Zap, Activity, Server, ArrowRight, ArrowDown } from 'lucide-react';

interface ArchitectureStep {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  purpose: string;
  signalDetail: string;
  category: 'sensing' | 'processing' | 'actuation' | 'software';
  icon: React.FC<{ className?: string }>;
}

const ARCHITECTURE_STEPS: ArchitectureStep[] = [
  {
    id: 'sense',
    order: 1,
    title: 'ECOSYNC SENSE',
    subtitle: 'Distributed environmental node',
    purpose:
      'Captures continuous room-level occupancy, ambient light, temperature, and humidity conditions.',
    signalDetail: 'PIR motion pulse · LDR analog voltage · DHT11 digital temperature & humidity frame',
    category: 'sensing',
    icon: Eye,
  },
  {
    id: 'readings',
    order: 2,
    title: 'Sensor readings',
    subtitle: 'Wireless telemetry transmission',
    purpose:
      'Transmits conditioned environmental state packets over the local wireless network to the controller.',
    signalDetail: 'Periodic environmental state & instantaneous occupancy interrupt events',
    category: 'sensing',
    icon: Radio,
  },
  {
    id: 'core',
    order: 3,
    title: 'ECOSYNC CORE',
    subtitle: 'ESP32 central room controller',
    purpose:
      'Receives incoming sensor data over Wi-Fi and serves as the local automation and metering hub.',
    signalDetail: 'ESP32 Wi-Fi transceiver · local state synchronization',
    category: 'processing',
    icon: Cpu,
  },
  {
    id: 'logic',
    order: 4,
    title: 'Processing and control logic',
    subtitle: 'Automated rule evaluation',
    purpose:
      'Evaluates occupancy, daylight thresholds, and thermal rules on the ESP32 to determine circuit state.',
    signalDetail: 'Deterministic rule evaluation · GPIO relay drive signal',
    category: 'processing',
    icon: Activity,
  },
  {
    id: 'relays',
    order: 5,
    title: 'Relay-controlled appliances',
    subtitle: 'Isolated load switching',
    purpose:
      'Switches connected lighting, climate fans, and outlets cleanly using isolated relay circuitry.',
    signalDetail: 'Opto-isolated relay actuation · AC appliance circuit control',
    category: 'actuation',
    icon: Zap,
  },
  {
    id: 'metering',
    order: 6,
    title: 'Energy monitoring',
    subtitle: 'PZEM-004T metering feedback',
    purpose:
      'Measures real-time electrical voltage, current, active power, and cumulative energy consumption.',
    signalDetail: 'Voltage (V) · Current (A) · Active Power (W) · Energy (kWh)',
    category: 'actuation',
    icon: Activity,
  },
  {
    id: 'software',
    order: 7,
    title: 'Centralized ECOSYNC software',
    subtitle: 'Monitoring software & rules',
    purpose:
      'Aggregates live telemetry, visualizes historical load, and allows manual overrides or rule configuration.',
    signalDetail: 'Bi-directional telemetry stream · remote circuit control & rule sync',
    category: 'software',
    icon: Server,
  },
];

const SCENARIOS = [
  {
    id: 'occupancy',
    label: 'Occupancy + Low Light',
    summary:
      'SENSE detects entry via PIR and measures low lux via LDR; CORE evaluates the lighting rule and energizes the lighting relay while metering power draw.',
    activeSteps: ['sense', 'readings', 'core', 'logic', 'relays', 'metering', 'software'],
  },
  {
    id: 'vacancy',
    label: 'Extended Vacancy Cutoff',
    summary:
      'SENSE reports prolonged vacancy; CORE triggers the idle cutoff rule, opens the workstation relay to eliminate standby draw, and logs zero watts to the dashboard.',
    activeSteps: ['sense', 'readings', 'core', 'logic', 'relays', 'metering', 'software'],
  },
  {
    id: 'manual',
    label: 'Dashboard Override',
    summary:
      'An operator toggles an appliance circuit from Centralized ECOSYNC software; CORE updates relay state directly and streams updated PZEM-004T consumption back.',
    activeSteps: ['software', 'core', 'logic', 'relays', 'metering'],
  },
];

export const SystemArchitecture: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('core');
  const [scenarioId, setScenarioId] = useState<string>('occupancy');

  const selectedStep =
    ARCHITECTURE_STEPS.find((s) => s.id === selectedId) ?? ARCHITECTURE_STEPS[0];
  const activeScenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  return (
    <section className="border-t border-white/[0.08] bg-[#0B0D10] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
              System Architecture
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#F5F7F8] sm:text-4xl">
              How CORE and SENSE work together
            </h2>
            <p className="mt-3 text-base text-[#94A3B8]">
              Select any stage in the signal chain below to inspect how environmental sensing flows
              through local control logic into metered appliance automation.
            </p>
          </div>

          {/* Interactive Scenario Selector */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-[#121417] p-1">
            {SCENARIOS.map((sc) => {
              const active = sc.id === scenarioId;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setScenarioId(sc.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-[#05100B]'
                      : 'text-[#94A3B8] hover:text-[#F5F7F8]'
                  }`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scenario Summary Strip */}
        <div className="mt-8 rounded-lg border border-white/[0.08] bg-[#121417] px-5 py-4">
          <p className="text-sm text-[#CBD5E1]">
            <span className="font-semibold text-emerald-400">{activeScenario.label}: </span>
            {activeScenario.summary}
          </p>
        </div>

        {/* Main Interactive Flow Chain + Detail Panel */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Interactive Pipeline Visualization (7 stages connected by animated signal lines) */}
          <div className="lg:col-span-7">
            <div className="flex flex-col">
              {ARCHITECTURE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isSelected = step.id === selectedId;
                const isActiveInScenario = activeScenario.activeSteps.includes(step.id);
                const isLast = idx === ARCHITECTURE_STEPS.length - 1;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(step.id)}
                      className={`group flex w-full items-center justify-between gap-4 rounded-lg border px-5 py-4 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-[#141A18]'
                          : isActiveInScenario
                            ? 'border-white/15 bg-[#121417] hover:border-white/30'
                            : 'border-white/[0.06] bg-[#0E1013] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                            isSelected
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                              : 'border-white/10 bg-white/[0.03] text-[#CBD5E1]'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs text-[#64748B] tabular-nums">
                              0{step.order}
                            </span>
                            <span className="text-sm font-semibold text-[#F5F7F8]">
                              {step.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#94A3B8]">{step.subtitle}</p>
                        </div>
                      </div>

                      <ArrowRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isSelected
                            ? 'translate-x-0.5 text-emerald-400'
                            : 'text-[#64748B] group-hover:text-[#CBD5E1]'
                        }`}
                      />
                    </button>

                    {!isLast && (
                      <div className="relative flex h-9 items-center pl-10">
                        <svg
                          className="h-9 w-6 overflow-visible"
                          viewBox="0 0 24 36"
                          aria-hidden="true"
                        >
                          <line
                            x1="12"
                            y1="0"
                            x2="12"
                            y2="36"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="1.5"
                          />
                          {isActiveInScenario && (
                            <line
                              x1="12"
                              y1="0"
                              x2="12"
                              y2="36"
                              stroke="#10b981"
                              strokeWidth="2"
                              className="animate-signal-flow"
                            />
                          )}
                        </svg>
                        <ArrowDown
                          className={`-ml-1.5 h-3.5 w-3.5 ${
                            isActiveInScenario ? 'text-emerald-400' : 'text-[#475569]'
                          }`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Component Purpose Inspection Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-xl border border-white/10 bg-[#121417] p-7">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 tabular-nums">
                  Stage 0{selectedStep.order} of 07
                </span>
                <span className="text-xs font-medium capitalize text-[#94A3B8]">
                  {selectedStep.category} layer
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight text-[#F5F7F8]">
                {selectedStep.title}
              </h3>
              <p className="mt-1 text-sm text-emerald-400">{selectedStep.subtitle}</p>

              <div className="mt-6 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Component Purpose
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#E2E8F0]">
                    {selectedStep.purpose}
                  </p>
                </div>

                <div className="rounded-lg border border-white/[0.08] bg-[#0B0D10] p-4">
                  <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#64748B]">
                    Signal & Interface Flow
                  </h4>
                  <p className="mt-1.5 font-mono text-xs leading-relaxed text-emerald-300">
                    {selectedStep.signalDetail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
