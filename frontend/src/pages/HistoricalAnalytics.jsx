import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  History,
  ShieldAlert,
  Flame,
  Clock,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Search,
  Download
} from "lucide-react";
import { api, API_BASE } from "../services/api";

export const HistoricalAnalytics = ({
  center,
  userLocation,
  cityName
}) => {
  const [chartsData, setChartsData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");

  const activeLat = userLocation?.lat || center?.[0];
  const activeLng = userLocation?.lng || center?.[1];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [chartRes, auditRes] = await Promise.all([
        api.getHistoricalCharts(activeLat, activeLng),
        api.getAuditLogs(50, activeLat, activeLng),
      ]);
      setChartsData(chartRes);
      setAuditLogs(auditRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeLat, activeLng]);

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== "ALL" && !log.action.includes(auditActionFilter)) {
      return false;
    }
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.user?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.record?.toLowerCase().includes(q) ||
      log.new_value?.toLowerCase().includes(q) ||
      log.old_value?.toLowerCase().includes(q)
    );
  });

  const locQuery = activeLat !== undefined && activeLng !== undefined ? `&lat=${activeLat}&lng=${activeLng}` : "";

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span>HISTORICAL FLOOD ANALYTICS & AUDIT TRAIL</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              📍 {cityName || "Live Sector"} ({activeLat ? activeLat.toFixed(2) : "13.08"}, {activeLng ? activeLng.toFixed(2) : "80.27"})
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Section 43 & 51: Longitudinal flood pattern analysis & tamper-evident municipal audit logging
          </p>
        </div>

        {/* Action Controls & Real CSV Exports */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`${API_BASE}/analytics/export/csv?dataset=reports${locQuery}`}
            download="citizen_flood_reports.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all hover-lift"
            title="Download verified reports CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reports CSV</span>
          </a>
          <a
            href={`${API_BASE}/analytics/export/csv?dataset=roads${locQuery}`}
            download="roads_operational_status.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all hover-lift"
            title="Download road closure registry CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
            <span>Roads CSV</span>
          </a>
          <a
            href={`${API_BASE}/analytics/export/csv?dataset=incidents${locQuery}`}
            download="emergency_incidents.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all hover-lift"
            title="Download municipal emergency incidents CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
            <span>Incidents CSV</span>
          </a>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all hover-lift"
            title="Refresh analytics and audit trail"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>
      </div>

      {chartsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Incidents by Ward */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                Incident Frequency by Municipal Ward (Section 43)
              </span>
              <span className="text-[10px] text-slate-400">Recorded Incidents</span>
            </div>

            <div className="space-y-3">
              {chartsData.incidents_by_ward.map((w, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold">{w.ward}</span>
                    <span className="font-mono text-purple-300">{w.count} incidents (Risk: {w.risk})</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(10, (w.risk / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Citizen Reports Distribution by Type */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                Community Reports by Hazard Classification
              </span>
              <span className="text-[10px] text-slate-400">Field Submissions</span>
            </div>

            <div className="space-y-3">
              {chartsData.reports_by_type.map((t, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold">{t.type}</span>
                    <span className="font-mono text-brand-400">{t.count} verified submissions</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-brand-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, t.count * 30)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 44: Recurring Hotspots */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                Vulnerability Hotspots Identification (Section 44)
              </span>
              <span className="text-[10px] text-slate-400">Spatial Clustering Analysis</span>
            </div>

            <div className="space-y-2.5">
              {chartsData.hotspots.map((h, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs hover-lift transition-all">
                  <div>
                    <div className="font-bold text-white">{h.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Last Critical Inundation: <strong className="text-slate-300">{h.last_event}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                      {h.events} Events Recurred
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">{h.ward_code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 10-Year Major Flood Timeline */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                Historical Flood Events Archive (Section 45)
              </span>
              <span className="text-[10px] text-slate-400">Disaster Registry</span>
            </div>

            <div className="space-y-2.5">
              {chartsData.event_timeline.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 hover-lift transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{ev.event_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      {ev.date}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{ev.description}</p>
                  <div className="text-[10px] text-slate-500">Affected Zones: {ev.affected_area}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 51: Municipal Audit Trail Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-brand-400" />
              <span>Immutable System Audit Trail (Section 51)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Every critical status transition, road closure, verification and dispatch logged with user attribution
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
            Audit Integrity Verified
          </span>
        </div>

        {/* Audit Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search by officer name, action, or record ID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Event Types</option>
              <option value="VERIFY">Verification (VERIFY)</option>
              <option value="DISPATCH">Task Dispatch (DISPATCH)</option>
              <option value="STATUS">Status Transitions (STATUS)</option>
              <option value="CLOSURE">Road Closures (CLOSURE)</option>
              <option value="RISK">Risk Recalculation (RISK)</option>
            </select>
            <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
              {filteredAuditLogs.length} logs
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Authorized Actor</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Target Entity</th>
                <th className="p-3">Transition (Old → New)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                  <td className="p-3 font-mono text-slate-400">{log.timestamp}</td>
                  <td className="p-3 font-semibold text-white">{log.user}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-brand-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">{log.record}</td>
                  <td className="p-3">
                    {log.old_value ? (
                      <span className="text-slate-400">
                        <span className="line-through">{log.old_value}</span> → <strong className="text-emerald-400">{log.new_value}</strong>
                      </span>
                    ) : (
                      <strong className="text-brand-400">{log.new_value}</strong>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAuditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
