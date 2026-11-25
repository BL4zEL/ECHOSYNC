import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useEcosync } from '../state/ecosyncStore';
import type { AppRoute } from '../types/ecosync';
import homeHeroDuskImg from '../assets/images/home_hero_dusk_1795519094765.jpg';
import coreHeroImg from '../assets/images/ecosync_core_hero_1795517136957.jpg';
import homeSenseArchImg from '../assets/images/home_sense_architectural_1795519094205.jpg';
import duoFinaleImg from '../assets/images/ecosync_duo_finale_1795517137753.jpg';
import homeArchImg from '../assets/images/ecosync_home_architecture_1795517138450.jpg';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
  focusSection?: 'about' | 'features' | 'contact' | null;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, focusSection = null }) => {
  const { zones, circuits, totalWatts, estimatedSavingsPct } = useEcosync();

  useEffect(() => {
    if (!focusSection) return;
    const idMap = {
      about: 'system-story',
      features: 'features',
      contact: 'contact',
    };
    const el = document.getElementById(idMap[focusSection]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusSection]);

  // Interactive architectural space response simulator on the homepage
  const [simOccupied, setSimOccupied] = useState<boolean>(true);
  const [simBrightDaylight, setSimBrightDaylight] = useState<boolean>(false);
  const [simWarmRoom, setSimWarmRoom] = useState<boolean>(false);

  const simLightOn = simOccupied && !simBrightDaylight;
  const simFanOn = simOccupied && simWarmRoom;
  const simWatts = (simLightOn ? 36 : 0) + (simFanOn ? 65 : 0);
  const simSavingsNote = !simOccupied
    ? '100% standby cutoff — zero idle draw'
    : simBrightDaylight && !simWarmRoom
      ? 'Daylight sufficient — lighting suppressed'
      : simWarmRoom
        ? 'Climate threshold reached — active cooling'
        : 'Balanced presence illumination';

  const scrollToSystem = () => {
    const el = document.getElementById('system-story');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#111313] text-[#F2F4F2]">
      {/* =================================================================== */}
      {/* 1. CINEMATIC HERO — ARCHITECTURAL DUSK INTERIOR                     */}
      {/* =================================================================== */}
      <section className="relative flex min-h-screen flex-col justify-between overflow-hidden border-b border-white/[0.08]">
        {/* Architectural dusk background */}
        <div className="absolute inset-0 bg-[#111313]">
          <img
            src={homeHeroDuskImg}
            alt="Modern concrete and timber architectural residence at dusk equipped with ECOSYNC ambient hardware"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center opacity-90"
          />
          {/* Measured contrast scrims preserving right-side hardware silhouette */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#111313]/92 via-[#111313]/58 to-[#111313]/20"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#111313] via-transparent to-[#111313]/45"
          />
        </div>

        {/* Top spacer for fixed transparent navbar */}
        <div className="h-20" aria-hidden="true" />

        {/* Editorial Keynote Foreground */}
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <p className="font-mono text-xs tracking-[0.12em] text-[#9CA3AF]">
              Architectural Energy Platform
            </p>

            <h1 className="mt-5 text-[clamp(2.75rem,5.4vw,5.25rem)] font-bold leading-[0.98] tracking-[-0.035em] text-[#F2F4F2]">
              <span className="block">YOUR SPACE.</span>
              <span className="block text-[#00C987]">THINKING SMARTER.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-[#D1D5DB] sm:text-lg">
              Intelligent energy management that understands your environment, adapts to your
              needs and helps eliminate unnecessary energy consumption.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToSystem}
                className="inline-flex items-center gap-2.5 rounded-sm bg-[#00C987] px-6 py-3.5 text-sm font-semibold text-[#071510] transition-colors hover:bg-[#19DBA0] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Explore the System</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/demo')}
                className="inline-flex items-center gap-2.5 rounded-sm border border-white/25 bg-[#111313]/70 px-6 py-3.5 text-sm font-semibold text-[#F2F4F2] backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-[#242626]/80 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Experience the Demo</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Hairline Anchor */}
        <div className="relative z-10 border-t border-white/[0.08] bg-[#111313]/55 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs text-[#9CA3AF] lg:px-10">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tracking-wider">
              <span className="text-[#F2F4F2]">ECOSYNC CORE</span>
              <span aria-hidden="true">·</span>
              <span>ECOSYNC SENSE</span>
              <span aria-hidden="true">·</span>
              <span>LOCAL RELAY AUTOMATION</span>
            </div>

            <button
              type="button"
              onClick={scrollToSystem}
              className="inline-flex items-center gap-2 font-mono text-xs text-[#D1D5DB] transition-colors hover:text-[#00C987] cursor-pointer"
            >
              <span>Scroll to discover</span>
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. SPACE INTELLIGENCE — ASYMMETRIC THESIS & LIVE RESPONSE SIMULATOR */}
      {/* =================================================================== */}
      <section
        id="system-story"
        className="border-b border-white/[0.08] bg-[#111313] py-24 lg:py-32"
      >
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Editorial Narrative */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5"
            >
              <p className="font-mono text-xs tracking-[0.08em] text-[#00C987]">
                01. Ambient Intelligence
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-[#F2F4F2] sm:text-4xl lg:text-[2.75rem] [text-wrap:balance]">
                Power should follow presence, not habit.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#9CA3AF]">
                Lighting and climate run continuously in empty rooms because switches rely on
                memory. ECOSYNC replaces manual guesswork with continuous room awareness—reading
                occupancy, ambient daylight, and temperature at the edge.
              </p>
              <p className="mt-4 text-base leading-relaxed text-[#9CA3AF]">
                Every rule executes locally inside the space controller, responding without cloud
                latency while metering real electrical load.
              </p>

              <div className="mt-9 border-t border-white/[0.08] pt-6">
                <button
                  type="button"
                  onClick={() => onNavigate('/demo')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#00C987] transition-colors hover:text-[#19DBA0] cursor-pointer"
                >
                  <span>Test inside the 3D Space Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            {/* Tactile Teenage-Engineering-Inspired Architectural Response Console */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <div className="border border-white/[0.08] bg-[#181A1A] p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                  <div>
                    <p className="font-mono text-xs text-[#9CA3AF]">
                      Interactive Signal Loop
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-[#F2F4F2]">
                      Simulate Room Conditions
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-[#38BDF8] tabular-nums">
                    Local Eval &lt; 15 ms
                  </span>
                </div>

                {/* 3 Tactile Environment Switches */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setSimOccupied((prev) => !prev)}
                    className={`flex flex-col items-start justify-between border p-4 text-left transition-colors cursor-pointer ${
                      simOccupied
                        ? 'border-[#00C987]/50 bg-[#00C987]/[0.08]'
                        : 'border-white/[0.08] bg-[#111313] hover:border-white/25'
                    }`}
                  >
                    <span className="font-mono text-xs text-[#9CA3AF]">
                      PIR Presence
                    </span>
                    <span className="mt-3 text-base font-semibold text-[#F2F4F2]">
                      {simOccupied ? 'Occupied' : 'Vacant'}
                    </span>
                    <span className="mt-1 font-mono text-xs text-[#00C987]">
                      Click to toggle
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimBrightDaylight((prev) => !prev)}
                    className={`flex flex-col items-start justify-between border p-4 text-left transition-colors cursor-pointer ${
                      simBrightDaylight
                        ? 'border-[#38BDF8]/50 bg-[#38BDF8]/[0.08]'
                        : 'border-white/[0.08] bg-[#111313] hover:border-white/25'
                    }`}
                  >
                    <span className="font-mono text-xs text-[#9CA3AF]">
                      LDR Daylight
                    </span>
                    <span className="mt-3 text-base font-semibold text-[#F2F4F2]">
                      {simBrightDaylight ? 'Bright (220 rel)' : 'Dusk (95 rel)'}
                    </span>
                    <span className="mt-1 font-mono text-xs text-[#38BDF8]">
                      Click to toggle
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimWarmRoom((prev) => !prev)}
                    className={`flex flex-col items-start justify-between border p-4 text-left transition-colors cursor-pointer ${
                      simWarmRoom
                        ? 'border-amber-400/50 bg-amber-400/[0.08]'
                        : 'border-white/[0.08] bg-[#111313] hover:border-white/25'
                    }`}
                  >
                    <span className="font-mono text-xs text-[#9CA3AF]">
                      DHT11 Climate
                    </span>
                    <span className="mt-3 text-base font-semibold text-[#F2F4F2]">
                      {simWarmRoom ? '29°C Warm' : '24°C Ambient'}
                    </span>
                    <span className="mt-1 font-mono text-xs text-[#9CA3AF]">
                      Click to toggle
                    </span>
                  </button>
                </div>

                {/* Live Relay Output Strip */}
                <div className="mt-6 grid grid-cols-1 divide-y divide-white/[0.08] border border-white/[0.08] bg-[#111313] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="p-4">
                    <p className="font-mono text-[11px] text-[#9CA3AF]">Lighting Relay</p>
                    <p
                      className={`mt-1.5 font-mono text-sm font-semibold ${
                        simLightOn ? 'text-[#00C987]' : 'text-[#9CA3AF]'
                      }`}
                    >
                      {simLightOn ? 'ENERGIZED · ON' : 'CUTOFF · OFF'}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="font-mono text-[11px] text-[#9CA3AF]">Climate Relay</p>
                    <p
                      className={`mt-1.5 font-mono text-sm font-semibold ${
                        simFanOn ? 'text-[#00C987]' : 'text-[#9CA3AF]'
                      }`}
                    >
                      {simFanOn ? 'ENERGIZED · ON' : 'STANDBY · OFF'}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="font-mono text-[11px] text-[#9CA3AF]">Simulated Draw</p>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-[#F2F4F2] tabular-nums">
                      {simWatts} W
                    </p>
                  </div>
                </div>

                <p className="mt-4 font-mono text-xs text-[#9CA3AF]">{simSavingsNote}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. HARDWARE LINEUP — ASYMMETRIC INDUSTRIAL PRODUCT SHOWCASE         */}
      {/* =================================================================== */}
      <section className="border-b border-white/[0.08] bg-[#161818] py-24 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="flex flex-col gap-6 border-b border-white/[0.08] pb-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-xs tracking-[0.08em] text-[#00C987]">
                02. Industrial Design
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-[#F2F4F2] sm:text-4xl lg:text-[2.75rem] [text-wrap:balance]">
                Two instruments. One continuous loop.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/technology')}
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#F2F4F2] transition-colors hover:text-[#00C987] lg:self-auto cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Inspect Hardware &amp; Engineering</span>
              <ArrowUpRight className="h-4 w-4 text-[#00C987]" />
            </button>
          </div>

          {/* Asymmetric 7 + 5 Product Showcase */}
          <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            {/* ECOSYNC CORE — Dominant 7-Col Feature */}
            <motion.article
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <button
                type="button"
                onClick={() => onNavigate('/technology')}
                aria-label="Inspect ECOSYNC CORE hardware"
                className="group block w-full cursor-pointer overflow-hidden border border-white/[0.08] bg-[#111313]"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-[#1A1C1C] to-[#0D0F0F]">
                  <img
                    src={coreHeroImg}
                    alt="ECOSYNC CORE matte charcoal energy controller unit"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </button>

              <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-[#F2F4F2]">ECOSYNC CORE</h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#9CA3AF]">
                    Precision matte charcoal enclosure housing local rule execution, 8-channel
                    high-voltage relay switching, and line-level electrical metering.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/technology')}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[#00C987] hover:text-[#19DBA0] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>View Core Teardown</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.08] border-y border-white/[0.08] py-3.5 font-mono text-xs tabular-nums">
                <div className="pr-4">
                  <span className="block text-[#6B7280]">Compute</span>
                  <span className="mt-0.5 block text-[#F2F4F2]">ESP32 Dual-Core</span>
                </div>
                <div className="px-4">
                  <span className="block text-[#6B7280]">Switching</span>
                  <span className="mt-0.5 block text-[#F2F4F2]">8-Channel Relays</span>
                </div>
                <div className="pl-4">
                  <span className="block text-[#6B7280]">Metering</span>
                  <span className="mt-0.5 block text-[#F2F4F2]">PZEM-004T AC</span>
                </div>
              </div>
            </motion.article>

            {/* ECOSYNC SENSE — Architectural 5-Col Offset */}
            <motion.article
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5"
            >
              <button
                type="button"
                onClick={() => onNavigate('/technology')}
                aria-label="Inspect ECOSYNC SENSE hardware"
                className="group block w-full cursor-pointer overflow-hidden border border-white/[0.08] bg-[#111313]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#1A1C1C] to-[#0D0F0F]">
                  <img
                    src={homeSenseArchImg}
                    alt="ECOSYNC SENSE architectural environmental sensor mounted on concrete wall"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </button>

              <div className="mt-6">
                <h3 className="text-2xl font-bold tracking-tight text-[#F2F4F2]">ECOSYNC SENSE</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
                  Flush architectural room node combining passive infrared motion detection, ambient
                  brightness sensing, and digital temperature-humidity feedback.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.08] border-y border-white/[0.08] py-3.5 font-mono text-xs tabular-nums">
                <div className="pr-3">
                  <span className="block text-[#6B7280]">Motion</span>
                  <span className="mt-0.5 block text-[#F2F4F2]">PIR Fresnel</span>
                </div>
                <div className="px-3">
                  <span className="block text-[#6B7280]">Light</span>
                  <span className="mt-0.5 block text-[#F2F4F2]">LDR Relative</span>
                </div>
                <div className="pl-3">
                  <span className="block text-[#6B7280]">Climate</span>
                  <span className="mt-0.5 block text-[#F2F4F2]">DHT11 Digital</span>
                </div>
              </div>
            </motion.article>
          </div>

          {/* Full-Bleed Studio Duo Plinth Band */}
          <div className="mt-16 grid grid-cols-1 items-center gap-0 border border-white/[0.08] bg-[#111313] lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#0D0F0F]">
                <img
                  src={duoFinaleImg}
                  alt="ECOSYNC CORE and ECOSYNC SENSE resting together on matte stone plinth"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="p-8 lg:col-span-5 lg:p-12">
              <p className="font-mono text-xs tracking-[0.08em] text-[#38BDF8]">
                Scroll-Driven Teardown
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#F2F4F2] sm:text-3xl">
                Designed from the PCB out.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#9CA3AF]">
                Explore every layer of the polycarbonate shell, relay power stage, and sensor
                transducer array on our dedicated Technology &amp; Hardware presentation.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/technology')}
                className="mt-8 inline-flex items-center gap-2 rounded-sm border border-white/20 bg-[#242626] px-5 py-3 text-xs font-semibold tracking-wide text-[#F2F4F2] transition-colors hover:border-[#00C987] hover:text-[#00C987] cursor-pointer"
              >
                <span>Open Technology Page</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. INTELLIGENT FEATURES & CENTRALIZED ARCHITECTURE                  */}
      {/* =================================================================== */}
      <section
        id="features"
        className="border-b border-white/[0.08] bg-[#111313] py-24 lg:py-32"
      >
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Live Store Architectural Console Preview */}
            <div className="lg:col-span-7">
              <div className="border border-white/[0.08] bg-[#161818] p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                  <div>
                    <p className="font-mono text-xs text-[#9CA3AF]">
                      Simulated Architecture Snapshot
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#F2F4F2]">
                      Active Space Telemetry
                    </h3>
                  </div>
                  <div className="flex items-center gap-5 font-mono text-xs tabular-nums">
                    <span className="text-[#38BDF8]">{totalWatts} W active</span>
                    <span className="text-[#00C987]">{estimatedSavingsPct}% saved</span>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-white/[0.06]">
                  {zones.map((zone) => {
                    const light = circuits.find(
                      (c) => c.zoneId === zone.id && c.category === 'lighting'
                    );
                    const fan = circuits.find(
                      (c) => c.zoneId === zone.id && c.category === 'fan'
                    );
                    return (
                      <div
                        key={zone.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-3.5 text-sm"
                      >
                        <div className="min-w-[140px]">
                          <p className="font-semibold text-[#F2F4F2]">{zone.name}</p>
                          <p
                            className={`text-xs ${
                              zone.occupied ? 'text-[#00C987]' : 'text-[#6B7280]'
                            }`}
                          >
                            {zone.occupied ? 'Occupied' : 'Vacant'}
                          </p>
                        </div>

                        <div className="flex items-center gap-5 font-mono text-xs text-[#9CA3AF] tabular-nums">
                          <span>
                            {Number.isInteger(zone.temperatureC)
                              ? `${zone.temperatureC}°C`
                              : `${zone.temperatureC.toFixed(1)}°C`}
                          </span>
                          <span>{zone.humidityPct}%</span>
                          <span>{zone.brightness} rel</span>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span
                            className={
                              light?.isOn ? 'text-[#00C987]' : 'text-[#6B7280]'
                            }
                          >
                            Light {light?.isOn ? 'ON' : 'OFF'}
                          </span>
                          <span aria-hidden="true" className="text-white/15">
                            /
                          </span>
                          <span
                            className={
                              fan?.isOn ? 'text-[#00C987]' : 'text-[#6B7280]'
                            }
                          >
                            Fan {fan?.isOn ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Editorial Copy + Features Overview */}
            <div className="lg:col-span-5">
              <p className="font-mono text-xs tracking-[0.08em] text-[#00C987]">
                03. Core Capabilities
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-[#F2F4F2] sm:text-4xl [text-wrap:balance]">
                Every room, legible at a glance.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#9CA3AF]">
                ECOSYNC coordinates occupancy-based lighting, daylight optimization, automated
                temperature fan control, and PZEM-004T energy monitoring across every connected
                room without manual switching.
              </p>

              <button
                type="button"
                onClick={() => onNavigate('/demo')}
                className="mt-8 inline-flex items-center gap-2.5 rounded-sm bg-[#F2F4F2] px-6 py-3 text-sm font-semibold text-[#111313] transition-colors hover:bg-white cursor-pointer"
              >
                <span>Explore 3D Interactive Demo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 5 Public Feature Pillars */}
          <div className="mt-16 grid grid-cols-1 gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                title: 'Occupancy Lighting',
                detail: 'PIR Fresnel detection activates room lights on entry and cuts standby draw on vacancy.',
              },
              {
                title: 'Daylight Optimization',
                detail: 'LDR ambient light feedback suppresses artificial fixtures whenever daylight is sufficient.',
              },
              {
                title: 'Climate Fan Automation',
                detail: 'DHT11 thermal monitoring triggers ceiling and exhaust fans only in occupied warm rooms.',
              },
              {
                title: 'Energy Monitoring',
                detail: 'PZEM-004T AC sensing tracks active power, voltage, current, and cumulative kWh draw.',
              },
              {
                title: 'Centralized Control',
                detail: 'Unified ESP32 rule execution bridges local SENSE nodes with high-voltage relay channels.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#111313] p-6">
                <h3 className="text-sm font-semibold text-[#F2F4F2]">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#9CA3AF]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. ARCHITECTURAL CLOSING CALL TO ACTION                             */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#111313] py-24 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="relative overflow-hidden border border-white/[0.08] bg-[#161818]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-6 lg:p-16">
                <p className="font-mono text-xs tracking-[0.08em] text-[#00C987]">
                  Interactive Experience
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-[1.06] tracking-[-0.03em] text-[#F2F4F2] sm:text-4xl lg:text-5xl [text-wrap:balance]">
                  See how your space responds.
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-[#9CA3AF]">
                  Step inside the 3D residential simulation or inspect the complete ESP32 CORE and
                  SENSE hardware architecture.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('/demo')}
                    className="inline-flex items-center gap-2 rounded-sm bg-[#00C987] px-6 py-3.5 text-sm font-semibold text-[#071510] transition-colors hover:bg-[#19DBA0] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Experience the Demo</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/technology')}
                    className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-[#111313] px-6 py-3.5 text-sm font-semibold text-[#F2F4F2] transition-colors hover:border-white/40 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Explore Technology</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="h-full min-h-[320px] w-full overflow-hidden">
                  <img
                    src={homeArchImg}
                    alt="Minimalist timber and concrete residence at twilight illuminated by ECOSYNC automation"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 6. CONTACT & ABOUT THE PROJECT                                      */}
      {/* =================================================================== */}
      <section id="contact" className="bg-[#0F1111] py-20 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-10 border border-white/[0.08] bg-[#161818] p-8 sm:p-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="font-mono text-xs tracking-[0.08em] text-[#00C987]">
                About the Project &amp; Contact
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#F2F4F2] sm:text-3xl">
                ECOSYNC IoT Smart Energy Platform
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#9CA3AF]">
                ECOSYNC combines ESP32-based local control, distributed PIR/LDR/DHT11 room sensing,
                isolated relay switching, and PZEM-004T AC energy metering to eliminate idle
                residential and workspace electricity waste.
              </p>
            </div>

            <div className="flex flex-col justify-between gap-6 border-t border-white/[0.08] pt-6 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <dl className="space-y-3 text-xs">
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-2.5">
                  <dt className="text-[#9CA3AF]">Project Repository</dt>
                  <dd className="font-mono text-[#F2F4F2]">github.com/BL4zEL/ECOSYNC</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-2.5">
                  <dt className="text-[#9CA3AF]">Architecture</dt>
                  <dd className="font-mono text-[#F2F4F2]">ESP32 CORE + SENSE Nodes</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#9CA3AF]">Interactive Showcase</dt>
                  <dd className="font-mono text-[#00C987]">Simulated Prototype Data</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/demo')}
                  className="inline-flex items-center gap-2 rounded-sm bg-[#00C987] px-4 py-2.5 text-xs font-semibold text-[#071510] hover:bg-[#19DBA0] cursor-pointer"
                >
                  <span>Launch 3D Demo</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/technology')}
                  className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-[#111313] px-4 py-2.5 text-xs font-semibold text-[#F2F4F2] hover:border-white/35 cursor-pointer"
                >
                  <span>Hardware Architecture</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
