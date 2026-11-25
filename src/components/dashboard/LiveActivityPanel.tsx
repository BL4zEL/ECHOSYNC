import React, { useMemo, useState } from 'react';
import { Activity, Download, Search } from 'lucide-react';
import { useEcosync } from '../../state/ecosyncStore';
import type { DashboardMode, LogCategory, LogSeverity } from '../../types/ecosync';

interface LiveActivityPanelProps {
  mode?: DashboardMode;
}

export const LiveActivityPanel: React.FC<LiveActivityPanelProps> = ({ mode = 'simple' }) => {
  const { activityFeed } = useEcosync();
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | LogCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | LogSeverity>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const rooms = ['all', 'Living Room', 'Bedroom', 'Kitchen', 'Study Room', 'System'];

  const filtered = useMemo(() => {
    return activityFeed.filter((e) => {
      if (roomFilter !== 'all' && e.room !== roomFilter) return false;
      if (mode === 'advanced') {
        if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
        if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
        if (
          searchQuery.trim() !== '' &&
          !`${e.description} ${e.device} ${e.room}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
      }
      return true;
    });
  }, [activityFeed, roomFilter, categoryFilter, severityFilter, searchQuery, mode]);

  const handleExportLogs = () => {
    const header = ['Date', 'Timestamp', 'Room', 'Device', 'Category', 'Severity', 'Status', 'Description'];
    const rows = filtered.map((e) => [
      e.dateIso,
      e.timestamp,
      e.room,
      e.device,
      e.category,
      e.severity,
      e.status,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ecosync-diagnostic-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-[#F5F7F8]">
              {mode === 'advanced' ? 'Technical Logs & Diagnostics' : 'Live System Activity'}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-[#94A3B8]">
            {mode === 'advanced'
              ? 'Timestamped sensor triggers, relay switches, threshold violations, and connection diagnostics'
              : 'Real-time stream of simulated SENSE triggers, CORE relay switches, and system events'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter activity by room"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="rounded-md border border-white/10 bg-[#0B0D10] px-3 py-1.5 text-xs text-[#F5F7F8] focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'All Spaces & System' : r}
              </option>
            ))}
          </select>

          {mode === 'advanced' && (
            <button
              type="button"
              onClick={handleExportLogs}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-[#0B0D10] px-2.5 py-1.5 text-xs text-[#CBD5E1] hover:border-emerald-500/40 hover:text-emerald-300 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {mode === 'advanced' && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs, device, message..."
              className="w-full rounded-md border border-white/10 bg-[#0B0D10] py-1.5 pl-8 pr-3 text-xs text-[#F5F7F8] placeholder:text-[#64748B] focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by event category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | LogCategory)}
            className="rounded-md border border-white/10 bg-[#0B0D10] px-2.5 py-1.5 text-xs text-[#CBD5E1] cursor-pointer"
          >
            <option value="all">All Event Types</option>
            <option value="sensor">Sensor</option>
            <option value="relay">Relay Switching</option>
            <option value="automation">Automation</option>
            <option value="threshold">Threshold</option>
            <option value="connection">Connection</option>
            <option value="system">System</option>
          </select>

          <select
            aria-label="Filter by severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'all' | LogSeverity)}
            className="rounded-md border border-white/10 bg-[#0B0D10] px-2.5 py-1.5 text-xs text-[#CBD5E1] cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="alert">Alert</option>
          </select>
        </div>
      )}

      <div className="mt-4 max-h-[340px] overflow-y-auto divide-y divide-white/[0.06] pr-1">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#64748B]">
            No events recorded for this selection yet.
          </p>
        ) : (
          filtered.map((evt) => (
            <div
              key={evt.id}
              className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs text-[#64748B] tabular-nums shrink-0">
                  {mode === 'advanced' ? `${evt.dateIso} ${evt.timestamp}` : evt.timestamp}
                </span>
                <div>
                  <p className="text-sm text-[#F5F7F8]">{evt.description}</p>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    {evt.room} · <span className="font-mono text-[#64748B]">{evt.device}</span>
                    {mode === 'advanced' && (
                      <span className="ml-2 font-mono text-[10px] uppercase text-[#64748B]">
                        [{evt.category}]
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {mode === 'advanced' && (
                  <span
                    className={`font-mono text-[10px] uppercase ${
                      evt.severity === 'alert'
                        ? 'text-rose-400'
                        : evt.severity === 'warning'
                          ? 'text-amber-300'
                          : 'text-[#64748B]'
                    }`}
                  >
                    {evt.severity}
                  </span>
                )}
                <span
                  className={`font-mono text-[11px] ${
                    evt.status === 'Automated' || evt.status === 'Threshold'
                      ? 'text-emerald-400'
                      : evt.status === 'Manual'
                        ? 'text-[#CBD5E1]'
                        : 'text-[#94A3B8]'
                  }`}
                >
                  {evt.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
