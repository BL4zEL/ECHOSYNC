import React from 'react';
import { ArrowDown, ArrowRight, ChevronDown } from 'lucide-react';
import type { AppRoute, ExplodedStage } from '../types/ecosync';
import { ScrollExplodedHardware } from '../components/ScrollExplodedHardware';
import { SystemArchitecture } from '../components/SystemArchitecture';
import coreHeroImg from '../assets/images/ecosync_core_hero_1795517136957.jpg';
import senseHeroImg from '../assets/images/ecosync_sense_hero_1795517136583.jpg';
import duoFinaleImg from '../assets/images/ecosync_duo_finale_1795517137753.jpg';

interface HardwarePageProps {
  onNavigate: (route: AppRoute) => void;
}

const CORE_STAGES: ExplodedStage[] = [
  {
    index: 1,
    range: [0.0, 0.09],
    stageLabel: 'Assembled Unit',
    componentName: 'ECOSYNC CORE',
    role: 'Centralized room control, energy metering, and Wi-Fi processing hub.',
    explanation:
      'Housed in a compact matte charcoal polycarbonate enclosure with recessed thermal ventilation slots and a single emerald indicator bar.',
  },
  {
    index: 2,
    range: [0.09, 0.21],
    stageLabel: 'Outer Enclosure',
    componentName: 'MATTE CHARCOAL ENCLOSURE',
    role: 'Separates the upper and lower polycarbonate shells to expose internal electronics.',
    explanation:
      'Two-piece chamfered polycarbonate housing engineered to enclose both low-voltage logic and isolated AC switching hardware.',
  },
  {
    index: 3,
    range: [0.21, 0.34],
    stageLabel: 'Main Carrier Board',
    componentName: 'PCB',
    role: 'Connects the electronic components and coordinates their operation.',
    explanation:
      'Provides structured signal routing, regulated DC distribution planes, terminal blocks, and clear physical separation between mains load circuits and microcontroller logic.',
  },
  {
    index: 4,
    range: [0.34, 0.48],
    stageLabel: 'Processing Unit',
    componentName: 'ESP32 MICROCONTROLLER',
    role: 'The processing unit responsible for receiving sensor information, executing control logic and wireless communication.',
    explanation:
      'Processes telemetry streamed from ECOSYNC SENSE nodes, evaluates local automation rules, drives relay switching channels, and syncs state over Wi-Fi.',
  },
  {
    index: 5,
    range: [0.48, 0.62],
    stageLabel: 'Metering Subsystem',
    componentName: 'ENERGY MONITORING MODULE',
    role: 'Measures electrical voltage, current, active power and energy consumption.',
    explanation:
      'Based on PZEM-004T-class isolated AC sensing with a toroidal current transformer and precision metering circuit feeding live load readings to the ESP32.',
  },
  {
    index: 6,
    range: [0.62, 0.75],
    stageLabel: 'Load Switching',
    componentName: 'RELAY SWITCHING CIRCUIT',
    role: 'Controls connected appliances according to configured automation rules.',
    explanation:
      'Electromechanical relay stages paired with opto-isolation and driver circuitry allow the low-voltage controller to switch AC appliances safely.',
  },
  {
    index: 7,
    range: [0.75, 0.86],
    stageLabel: 'Power Stage',
    componentName: 'POWER SUPPLY',
    role: 'Provides the required regulated power to the controller electronics.',
    explanation:
      'Isolated AC-to-DC conversion and voltage regulation stage delivering clean, low-ripple DC power for continuous controller and relay driver operation.',
  },
  {
    index: 8,
    range: [0.86, 0.93],
    stageLabel: 'Full Breakdown',
    componentName: 'COMPLETE EXPLODED ASSEMBLY',
    role: 'Unified view of every mechanical and electronic layer inside ECOSYNC CORE.',
    explanation:
      'Polycarbonate enclosure, main PCB, ESP32 microcontroller, energy monitoring module, relay switching circuit, and isolated power supply aligned along one axis.',
  },
  {
    index: 9,
    range: [0.93, 1.0],
    stageLabel: 'Reassembly',
    componentName: 'INTEGRATED ECOSYNC CORE',
    role: 'Converges back into the sealed, wall-ready hardware unit.',
    explanation:
      'All internal assemblies seat back into the matte charcoal enclosure, ready to coordinate sensing and appliance automation across the space.',
  },
];

const SENSE_STAGES: ExplodedStage[] = [
  {
    index: 1,
    range: [0.0, 0.12],
    stageLabel: 'Outer Housing',
    componentName: 'OUTER ENCLOSURE',
    role: 'Matte charcoal polycarbonate casing matching the CORE product family.',
    explanation:
      'Compact square enclosure with chamfered edges, central optical bezel, and lower ventilation slots for unobstructed thermal and humidity airflow.',
  },
  {
    index: 2,
    range: [0.12, 0.25],
    stageLabel: 'Occupancy Optics',
    componentName: 'PIR FRESNEL LENS',
    role: 'Focuses infrared motion signatures onto the passive infrared detector.',
    explanation:
      'Multi-faceted translucent dome lens segments the room field of view so the pyroelectric element detects human occupancy reliably across wide zones.',
  },
  {
    index: 3,
    range: [0.25, 0.39],
    stageLabel: 'Illuminance Sensing',
    componentName: 'LDR LIGHT SENSOR',
    role: 'Measures ambient light intensity across the monitored room.',
    explanation:
      'Light-dependent photoresistor changes electrical resistance proportionally with daylight levels, enabling daylight-aware lighting automation rules.',
  },
  {
    index: 4,
    range: [0.39, 0.53],
    stageLabel: 'Climate Sensing',
    componentName: 'DHT11 TEMPERATURE & HUMIDITY SENSOR',
    role: 'Captures ambient room temperature and relative humidity.',
    explanation:
      'Digital environmental sensor module exposed through the enclosure airflow grille to supply thermal and moisture telemetry to ECOSYNC CORE.',
  },
  {
    index: 5,
    range: [0.53, 0.67],
    stageLabel: 'Signal Conditioning',
    componentName: 'SENSOR-INTERFACE PCB',
    role: 'Connects the PIR, LDR, and DHT11 elements into one coordinated board.',
    explanation:
      'Routes analog voltage divider signals for the LDR, digital data lines for the DHT11, and motion interrupts from the pyroelectric infrared receiver.',
  },
  {
    index: 6,
    range: [0.67, 0.8],
    stageLabel: 'Node Telemetry',
    componentName: 'WIRELESS COMMUNICATION ELECTRONICS',
    role: 'Transmits local environmental readings to ECOSYNC CORE.',
    explanation:
      'Compact sensor-node wireless controller module packages occupancy, ambient light, temperature, and humidity readings for transmission over the local network.',
  },
  {
    index: 7,
    range: [0.8, 0.91],
    stageLabel: 'Wall Integration',
    componentName: 'REAR MOUNTING PLATE',
    role: 'Secures ECOSYNC SENSE flush to walls, ceilings, or architectural panels.',
    explanation:
      'Dedicated matte charcoal backplate featuring recessed keyhole mounting points for straightforward room placement and service access.',
  },
  {
    index: 8,
    range: [0.91, 1.0],
    stageLabel: 'Assembled Sensor',
    componentName: 'FULLY ASSEMBLED ECOSYNC SENSE',
    role: 'Compact environmental sensing node ready for continuous monitoring.',
    explanation:
      'Every optical, environmental, and wireless layer locks cleanly into the matte charcoal polycarbonate body.',
  },
];

const CORE_COMPONENT_CARDS = [
  {
    name: 'ESP32 MICROCONTROLLER',
    summary:
      'The processing unit responsible for receiving sensor information, executing control logic and wireless communication.',
    detail:
      'Coordinates incoming Wi-Fi telemetry from ECOSYNC SENSE nodes, executes deterministic automation rules, and drives relay output channels.',
  },
  {
    name: 'ENERGY MONITORING MODULE',
    summary: 'Measures electrical voltage, current, active power and energy consumption.',
    detail:
      'Utilizes PZEM-004T-class metering architecture with an isolated current transformer to stream real-time electrical readings.',
  },
  {
    name: 'RELAY SWITCHING CIRCUIT',
    summary: 'Controls connected appliances according to configured automation rules.',
    detail:
      'Separates low-voltage ESP32 GPIO signals from AC appliance loads through isolated relay switching stages.',
  },
  {
    name: 'POWER SUPPLY',
    summary: 'Provides the required regulated power to the controller electronics.',
    detail:
      'Steps down and isolates incoming AC supply to deliver clean regulated DC rails for logic and relay actuation.',
  },
  {
    name: 'PCB',
    summary: 'Connects the electronic components and coordinates their operation.',
    detail:
      'Unifies microcontroller headers, metering traces, terminal blocks, and high/low-voltage isolation clearances on a single board.',
  },
];

const CORE_PROPOSED_SPECS = [
  { parameter: 'Controller', value: 'ESP32 microcontroller' },
  { parameter: 'Appliance switching', value: 'Relay circuitry (isolated AC load switching)' },
  { parameter: 'Energy measurement', value: 'PZEM-004T or equivalent metering module' },
  { parameter: 'Connectivity', value: 'Wi-Fi' },
  { parameter: 'Power architecture', value: 'Integrated isolated regulated DC power supply' },
  { parameter: 'Enclosure', value: 'Matte charcoal polycarbonate' },
];

const SENSE_PROPOSED_SPECS = [
  { parameter: 'Occupancy detection', value: 'PIR sensor with multi-faceted Fresnel lens' },
  { parameter: 'Ambient light', value: 'LDR (Light Dependent Resistor)' },
  { parameter: 'Temperature and humidity', value: 'DHT11 digital sensor module' },
  { parameter: 'Communication', value: 'Dedicated wireless sensor-node interface' },
  { parameter: 'Mounting', value: 'Detachable rear wall-mounting plate' },
  { parameter: 'Enclosure', value: 'Matte charcoal polycarbonate (CORE design family)' },
];

export const HardwarePage: React.FC<HardwarePageProps> = ({ onNavigate }) => {
  const scrollToSection = (elementId: string) => {
    const target = document.getElementById(elementId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#090A0B] text-[#F5F7F8]">
      {/* SECTION 1 — HARDWARE INTRODUCTION */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-between overflow-hidden border-b border-white/[0.08] bg-[#090A0B]">
        <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-12 lg:px-10 lg:py-20">
          {/* Left Editorial Statement */}
          <div className="lg:col-span-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-400">
              Hardware & Engineering
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-[#F5F7F8] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] [text-wrap:balance]">
              ENGINEERED TO THINK. BUILT TO CONNECT.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
              Behind every intelligent space is a compact ecosystem of sensors, processing and
              control hardware.
            </p>

            {/* Two Navigation Options: Explore CORE / Explore SENSE */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => scrollToSection('core-exploded')}
                className="inline-flex items-center gap-2.5 rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#05100B] transition-colors hover:bg-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Explore CORE</span>
                <ArrowDown className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sense-exploded')}
                className="inline-flex items-center gap-2.5 rounded-md border border-white/15 bg-[#121417] px-6 py-3 text-sm font-semibold text-[#F5F7F8] transition-colors hover:border-white/30 hover:bg-[#191C21] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Explore SENSE</span>
                <ArrowDown className="h-4 w-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Right Floating Dark Studio Product Pairing */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => scrollToSection('core-exploded')}
                className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D0E11] text-left transition-colors hover:border-emerald-500/40 cursor-pointer"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#090A0B]">
                  <img
                    src={coreHeroImg}
                    alt="ECOSYNC CORE matte charcoal energy controller unit in dark studio lighting"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="border-t border-white/[0.06] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-wide text-[#F5F7F8]">
                      ECOSYNC CORE
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    ESP32 processing · Relay switching · Energy metering
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sense-exploded')}
                className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D0E11] text-left transition-colors hover:border-emerald-500/40 cursor-pointer sm:translate-y-6"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#090A0B]">
                  <img
                    src={senseHeroImg}
                    alt="ECOSYNC SENSE compact matte charcoal environmental sensor unit with Fresnel dome"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="border-t border-white/[0.06] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-wide text-[#F5F7F8]">
                      ECOSYNC SENSE
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    PIR occupancy · LDR light · DHT11 climate
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Scroll Indicator */}
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 pb-8 lg:px-10">
          <button
            type="button"
            onClick={() => scrollToSection('core-exploded')}
            className="inline-flex items-center gap-2 text-xs font-medium tracking-wider text-[#64748B] transition-colors hover:text-[#CBD5E1] cursor-pointer"
          >
            <ChevronDown className="h-4 w-4 text-emerald-500" />
            <span>Scroll to explore internal hardware architecture</span>
          </button>
          <span className="hidden sm:inline font-mono text-xs text-[#64748B]">
            CORE & SENSE
          </span>
        </div>
      </section>

      {/* SECTION 2 & SECTION 3 — ECOSYNC CORE: SCROLL-DRIVEN EXPLODED VIEW + CONTEXTUAL EXPLANATIONS */}
      <ScrollExplodedHardware
        id="core-exploded"
        productType="core"
        title="ECOSYNC CORE — Internal Architecture"
        subtitle="Scroll-Driven Disassembly"
        stages={CORE_STAGES}
        trackHeightClass="h-[520vh]"
      />

      {/* SECTION 3 COMPLEMENT — CORE COMPONENT REFERENCE GRID */}
      <section className="border-t border-white/[0.08] bg-[#0C0E11] py-20 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
              CORE Subsystems
            </p>
            <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-[#F5F7F8] sm:text-3xl">
              Component Architecture Breakdown
            </h2>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Every subsystem inside ECOSYNC CORE serves a dedicated role across sensing intake,
              control computation, load isolation, and electrical measurement.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CORE_COMPONENT_CARDS.map((card, i) => (
              <div
                key={card.name}
                className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#121417] p-6"
              >
                <div>
                  <span className="font-mono text-xs text-emerald-400 tabular-nums">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 text-base font-bold tracking-tight text-[#F5F7F8]">
                    {card.name}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#E2E8F0]">
                    {card.summary}
                  </p>
                </div>
                <p className="mt-4 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-[#94A3B8]">
                  {card.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — ECOSYNC SENSE: SCROLL-DRIVEN EXPLODED VIEW */}
      <ScrollExplodedHardware
        id="sense-exploded"
        productType="sense"
        title="ECOSYNC SENSE — Environmental Node"
        subtitle="Scroll-Driven Disassembly"
        stages={SENSE_STAGES}
        trackHeightClass="h-[460vh]"
      />

      {/* SECTION 5 — HOW CORE AND SENSE WORK TOGETHER */}
      <SystemArchitecture />

      {/* SECTION 6 — TECHNICAL SPECIFICATIONS */}
      <section className="border-t border-white/[0.08] bg-[#090A0B] py-24 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
              Engineering Documentation
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#F5F7F8] sm:text-4xl">
              Technical Specifications
            </h2>
            <p className="mt-3 text-base text-[#94A3B8]">
              Specification records below explicitly separate proposed system design parameters from
              verified manufactured hardware qualification figures.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* CORE Specs */}
            <div className="rounded-xl border border-white/10 bg-[#121417] p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
                <div>
                  <h3 className="text-xl font-bold text-[#F5F7F8]">ECOSYNC CORE</h3>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Controller, relay switching, and energy metering module
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  Proposed Design Specification
                </span>
              </div>

              <dl className="mt-5 divide-y divide-white/[0.06]">
                {CORE_PROPOSED_SPECS.map((row) => (
                  <div
                    key={row.parameter}
                    className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <dt className="text-sm font-medium text-[#94A3B8]">{row.parameter}</dt>
                    <dd className="font-mono text-sm text-[#F5F7F8] sm:text-right">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* SENSE Specs */}
            <div className="rounded-xl border border-white/10 bg-[#121417] p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
                <div>
                  <h3 className="text-xl font-bold text-[#F5F7F8]">ECOSYNC SENSE</h3>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Multi-sensor occupancy, ambient light, and climate node
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  Proposed Design Specification
                </span>
              </div>

              <dl className="mt-5 divide-y divide-white/[0.06]">
                {SENSE_PROPOSED_SPECS.map((row) => (
                  <div
                    key={row.parameter}
                    className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <dt className="text-sm font-medium text-[#94A3B8]">{row.parameter}</dt>
                    <dd className="font-mono text-sm text-[#F5F7F8] sm:text-right">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Explicit Distinction: Proposed Design vs Verified Manufactured Hardware */}
          <div className="mt-8 rounded-xl border border-white/10 bg-[#101215] p-7">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                <h4 className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                  Proposed Design Specifications
                </h4>
                <p className="mt-2.5 text-sm leading-relaxed text-[#CBD5E1]">
                  All component selections listed above (ESP32, relay switching circuitry,
                  PZEM-004T or equivalent energy monitoring, Wi-Fi connectivity, PIR, LDR, DHT11,
                  and matte charcoal polycarbonate enclosures) represent the proposed ECOSYNC
                  hardware architecture.
                </p>
              </div>
              <div className="border-t border-white/[0.08] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <h4 className="font-mono text-xs uppercase tracking-wider text-[#94A3B8]">
                  Verified Manufactured Hardware Specifications
                </h4>
                <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                  Physical enclosure dimensions, electrical load ratings, operating temperature and
                  humidity envelopes, and regulatory compliance certifications are intentionally
                  excluded until finalized production hardware completes laboratory verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — FINAL PRODUCT PRESENTATION */}
      <section className="border-t border-white/[0.08] bg-[#070809] py-24 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D0F12]">
            <div className="aspect-[16/9] w-full overflow-hidden bg-black">
              <img
                src={duoFinaleImg}
                alt="ECOSYNC CORE and ECOSYNC SENSE side by side on a dark basalt plinth"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col items-center px-6 py-14 text-center sm:px-12 lg:py-16">
              <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-[#F5F7F8] sm:text-4xl lg:text-5xl [text-wrap:balance]">
                SMALL IN FORM. INTELLIGENT BY DESIGN.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
                Designed to bring intelligent sensing, energy monitoring and appliance automation
                into every space.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('/demo')}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#05100B] transition-colors hover:bg-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore Interactive Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-[#121417] px-6 py-3 text-sm font-semibold text-[#F5F7F8] transition-colors hover:border-white/30 hover:bg-[#191C21] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Return to ECOSYNC Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
