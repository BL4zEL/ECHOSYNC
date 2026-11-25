import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Activity } from 'lucide-react';
import type { AnalyticsPeriod, DashboardMode } from '../../types/ecosync';
import { useEcosync } from '../../state/ecosyncStore';

interface EnergyAnalyticsPanelProps {
  mode: DashboardMode;
  totalWatts: number;
  cumulativeKwh: number;
  baselineKwh: number;
}

interface DataPoint {
  label: string;
  ecosyncKwh: number;
  baselineKwh: number;
  previousKwh: number;
  peakWatts: number;
}

const PERIOD_LABELS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'hourly', label: 'Hourly' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const EnergyAnalyticsPanel: React.FC<EnergyAnalyticsPanelProps> = ({
  mode,
  totalWatts,
  cumulativeKwh,
  baselineKwh,
}) => {
  const { tariffInrPerKwh, telemetryHistory, zones, circuits } = useEcosync();
  const [period, setPeriod] = useState<AnalyticsPeriod>('daily');
  const [rangeWindow, setRangeWindow] = useState<'current' | 'last7' | 'last30'>('current');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const rangeFactor = rangeWindow === 'current' ? 1 : rangeWindow === 'last7' ? 1.04 : 0.96;

  const series: DataPoint[] = useMemo(() => {
    const liveKwScale = Math.max(0.15, totalWatts / 300);
    if (period === 'hourly') {
      const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      const base = [0.22, 0.18, 0.34, 0.72, 0.68, 0.58, 0.94, 0.64];
      return hours.map((label, idx) => {
        const val =
          idx === hours.length - 1
            ? Number((0.45 * liveKwScale * rangeFactor).toFixed(2))
            : Number((base[idx] * (0.9 + (idx % 2) * 0.08) * rangeFactor).toFixed(2));
        const baseline = Number((val * 1.38).toFixed(2));
        const previous = Number((val * 1.12).toFixed(2));
        return {
          label,
          ecosyncKwh: val,
          baselineKwh: baseline,
          previousKwh: previous,
          peakWatts: idx === hours.length - 1 ? totalWatts : Math.round(val * 340),
        };
      });
    }

    if (period === 'daily') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const vals = [11.4, 10.8, 12.1, 11.6, 12.9, 13.4, Number(cumulativeKwh.toFixed(2))];
      return days.map((label, idx) => {
        const val = Number((vals[idx] * (idx === days.length - 1 ? 1 : rangeFactor)).toFixed(2));
        const baseline =
          idx === days.length - 1
            ? Number(baselineKwh.toFixed(2))
            : Number((val * 1.41).toFixed(2));
        return {
          label,
          ecosyncKwh: val,
          baselineKwh: baseline,
          previousKwh: Number((val * 1.09).toFixed(2)),
          peakWatts: idx === days.length - 1 ? Math.max(totalWatts, 370) : Math.round(val * 36),
        };
      });
    }

    if (period === 'weekly') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const vals = [79.4, 76.8, 74.2, Number((71.5 + cumulativeKwh * 0.4).toFixed(1))];
      return weeks.map((label, idx) => {
        const val = Number((vals[idx] * rangeFactor).toFixed(1));
        return {
          label,
          ecosyncKwh: val,
          baselineKwh: Number((val * 1.42).toFixed(1)),
          previousKwh: Number((val * 1.08).toFixed(1)),
          peakWatts: Math.round(410 + idx * 14),
        };
      });
    }

    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const vals = [348, 362, 339, 318, 304, Math.round(288 + cumulativeKwh)];
    return months.map((label, idx) => {
      const val = Math.round(vals[idx] * rangeFactor);
      return {
        label,
        ecosyncKwh: val,
        baselineKwh: Math.round(val * 1.39),
        previousKwh: Math.round(val * 1.07),
        peakWatts: Math.round(440 + (idx % 3) * 28),
      };
    });
  }, [period, rangeFactor, totalWatts, cumulativeKwh, baselineKwh]);

  const summary = useMemo(() => {
    const total = series.reduce((acc, d) => acc + d.ecosyncKwh, 0);
    const baseline = series.reduce((acc, d) => acc + d.baselineKwh, 0);
    const prev = series.reduce((acc, d) => acc + d.previousKwh, 0);
    const peak = Math.max(...series.map((d) => d.peakWatts), totalWatts);
    const daysCount =
      period === 'hourly' ? 1 : period === 'daily' ? 7 : period === 'weekly' ? 28 : 180;
    const avgDaily = total / daysCount;
    const cost = total * tariffInrPerKwh;
    const savingsPct = baseline > 0 ? Math.round(((baseline - total) / baseline) * 100) : 0;
    const vsPrevPct = prev > 0 ? Math.round(((total - prev) / prev) * 100) : 0;

    return {
      total: Number(total.toFixed(2)),
      avgDaily: Number(avgDaily.toFixed(2)),
      peak,
      cost: Number(cost.toFixed(2)),
      savingsPct,
      savedKwh: Number((baseline - total).toFixed(2)),
      vsPrevPct,
    };
  }, [series, period, totalWatts, tariffInrPerKwh]);

  const handleExportCsv = () => {
    const header = [
      'Period',
      'RangeWindow',
      'ECOSYNC_kWh',
      'Baseline_kWh',
      'Previous_kWh',
      'Estimated_Cost_INR',
      'Peak_Watts',
    ];
    const rows = series.map((d) => [
      d.label,
      rangeWindow,
      d.ecosyncKwh.toFixed(2),
      d.baselineKwh.toFixed(2),
      d.previousKwh.toFixed(2),
      (d.ecosyncKwh * tariffInrPerKwh).toFixed(2),
      String(d.peakWatts),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecosync-energy-${period}-${rangeWindow}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // SVG Geometry
  const svgW = 680;
  const svgH = 220;
  const padL = 46;
  const padR = 20;
  const padT = 18;
  const padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const maxY = useMemo(() => {
    const m = Math.max(...series.map((d) => Math.max(d.baselineKwh, d.ecosyncKwh)));
    return Math.ceil(m * 1.15 * 10) / 10 || 1;
  }, [series]);

  const coords = useMemo(() => {
    return series.map((d, i) => {
      const x =
        series.length === 1
          ? padL + plotW / 2
          : padL + (i / (series.length - 1)) * plotW;
      const yEco = padT + plotH - (d.ecosyncKwh / maxY) * plotH;
      const yBase = padT + plotH - (d.baselineKwh / maxY) * plotH;
      return { ...d, x, yEco, yBase };
    });
  }, [series, maxY, plotW, plotH]);

  const ecoPath = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yEco.toFixed(1)}`)
    .join(' ');
  const ecoArea = `${ecoPath} L ${coords[coords.length - 1].x.toFixed(1)} ${padT + plotH} L ${coords[0].x.toFixed(1)} ${padT + plotH} Z`;
  const basePath = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yBase.toFixed(1)}`)
    .join(' ');

  const activePoint = hoverIdx !== null ? coords[hoverIdx] : coords[coords.length - 1];

  // Real-time Power Trend geometry for Advanced Mode
  const rtMaxW = Math.max(250, ...telemetryHistory.map((t) => t.watts)) * 1.15;
  const rtPath = telemetryHistory
    .map((pt, i) => {
      const x =
        telemetryHistory.length <= 1
          ? 16
          : 16 + (i / (telemetryHistory.length - 1)) * 648;
      const y = 12 + (1 - pt.watts / rtMaxW) * 76;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-[#F5F7F8]">Energy Analytics</h2>
          </div>
          <p className="mt-0.5 text-xs text-[#94A3B8]">
            Simulated consumption vs. unautomated baseline (₹{tariffInrPerKwh.toFixed(2)}/kWh tariff)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === 'advanced' && (
            <select
              aria-label="Select date range window"
              value={rangeWindow}
              onChange={(e) =>
                setRangeWindow(e.target.value as 'current' | 'last7' | 'last30')
              }
              className="rounded-md border border-white/10 bg-[#0B0D10] px-2.5 py-1.5 text-xs text-[#F5F7F8] focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="current">Current Cycle</option>
              <option value="last7">Trailing Window A</option>
              <option value="last30">Trailing Window B</option>
            </select>
          )}

          <div className="flex items-center gap-1 rounded-md border border-white/10 bg-[#0B0D10] p-1">
            {PERIOD_LABELS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPeriod(tab.id);
                  setHoverIdx(null);
                }}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  period === tab.id
                    ? 'bg-emerald-500 text-[#05100B]'
                    : 'text-[#94A3B8] hover:text-[#F5F7F8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'advanced' && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-[#0B0D10] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-emerald-500/40 hover:text-emerald-300 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Period KPI Strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] px-3.5 py-2.5">
          <p className="text-[11px] text-[#94A3B8]">Total Consumption</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
            {summary.total} kWh
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] px-3.5 py-2.5">
          <p className="text-[11px] text-[#94A3B8]">Avg Daily Usage</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
            {summary.avgDaily} kWh
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] px-3.5 py-2.5">
          <p className="text-[11px] text-[#94A3B8]">Peak Active Load</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
            {summary.peak} W
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] px-3.5 py-2.5">
          <p className="text-[11px] text-[#94A3B8]">Estimated Cost</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#F5F7F8] tabular-nums">
            ₹{summary.cost.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-white/[0.06] bg-[#0B0D10] px-3.5 py-2.5 sm:col-span-1">
          <p className="text-[11px] text-[#94A3B8]">Savings vs Baseline</p>
          <p className="mt-1 font-mono text-sm font-semibold text-emerald-400 tabular-nums">
            {summary.savingsPct}% ({summary.savedKwh} kWh)
          </p>
        </div>
      </div>

      {/* Hover Readout Strip + Legend */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#0B0D10] px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums">
          <span className="font-semibold text-[#F5F7F8]">{activePoint.label}</span>
          <span className="text-emerald-400">ECOSYNC: {activePoint.ecosyncKwh} kWh</span>
          <span className="text-[#94A3B8]">Baseline: {activePoint.baselineKwh} kWh</span>
          <span className="text-[#94A3B8]">Prev Period: {activePoint.previousKwh} kWh</span>
          {mode === 'advanced' && (
            <span className="text-[#CBD5E1]">Peak: {activePoint.peakWatts} W</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-emerald-400" />
            ECOSYNC
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t border-dashed border-[#64748B]" />
            Unautomated Baseline
          </span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="mt-4">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full overflow-visible">
          <defs>
            <linearGradient id="ecoAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.33, 0.66, 1].map((t) => {
            const val = maxY * t;
            const y = padT + plotH - t * plotH;
            return (
              <g key={t}>
                <line
                  x1={padL}
                  y1={y}
                  x2={svgW - padR}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[#64748B] font-mono text-[10px] tabular-nums"
                >
                  {val >= 10 ? Math.round(val) : val.toFixed(1)}
                </text>
              </g>
            );
          })}

          <path
            d={basePath}
            fill="none"
            stroke="#64748B"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          <path d={ecoArea} fill="url(#ecoAreaGrad)" />
          <path
            d={ecoPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          <line
            x1={activePoint.x}
            y1={padT}
            x2={activePoint.x}
            y2={padT + plotH}
            stroke="rgba(16,185,129,0.35)"
            strokeWidth="1"
          />

          {coords.map((pt, idx) => {
            const isHovered = activePoint.label === pt.label;
            return (
              <g
                key={pt.label}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(idx)}
                onClick={() => setHoverIdx(idx)}
              >
                <rect
                  x={pt.x - plotW / coords.length / 2}
                  y={padT}
                  width={plotW / coords.length}
                  height={plotH + 20}
                  fill="transparent"
                />
                <circle
                  cx={pt.x}
                  cy={pt.yEco}
                  r={isHovered ? 5 : 3.5}
                  fill={isHovered ? '#34d399' : '#10b981'}
                  stroke="#090A0B"
                  strokeWidth="1.5"
                />
                <text
                  x={pt.x}
                  y={svgH - 8}
                  textAnchor="middle"
                  className={`font-mono text-[10px] ${
                    isHovered ? 'fill-[#F5F7F8] font-semibold' : 'fill-[#64748B]'
                  }`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Advanced Mode: Live Active Power + Voltage/Current/PF Stream & Relay Load Allocation */}
      {mode === 'advanced' && (
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/[0.08] pt-5 lg:grid-cols-12">
          <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-4 lg:col-span-7">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#F5F7F8]">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                Live Active Power Stream (PZEM-004T Sim)
              </span>
              <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                {telemetryHistory[telemetryHistory.length - 1]?.voltageV.toFixed(1)} V ·{' '}
                {telemetryHistory[telemetryHistory.length - 1]?.currentA.toFixed(2)} A · PF{' '}
                {telemetryHistory[telemetryHistory.length - 1]?.powerFactor.toFixed(2)}
              </span>
            </div>
            <svg viewBox="0 0 680 105" className="mt-3 w-full">
              <path
                d={rtPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-[#0B0D10] p-4 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F5F7F8]">
                Estimated Room Draw Breakdown
              </span>
              <span className="font-mono text-[10px] text-[#64748B]">
                Derived from relay states
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              {zones.map((z) => {
                const zoneWatts = circuits
                  .filter((c) => c.zoneId === z.id)
                  .reduce((acc, c) => acc + c.currentWatts, 0);
                const pct = totalWatts > 0 ? Math.round((zoneWatts / totalWatts) * 100) : 0;
                return (
                  <div key={z.id} className="text-xs">
                    <div className="flex justify-between font-mono tabular-nums">
                      <span className="text-[#CBD5E1]">{z.name}</span>
                      <span className="text-[#94A3B8]">
                        {zoneWatts} W ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B] font-mono tabular-nums">
        <span>
          Previous period comparison:{' '}
          <span className={summary.vsPrevPct <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {summary.vsPrevPct > 0 ? `+${summary.vsPrevPct}%` : `${summary.vsPrevPct}%`}
          </span>
        </span>
        <span>Units: kWh (ECOSYNC CORE PZEM-004T simulation)</span>
      </div>
    </section>
  );
};
