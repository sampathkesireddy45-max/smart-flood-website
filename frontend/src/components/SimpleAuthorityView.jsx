import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Flame,
  Truck,
  Building2,
  Navigation,
  RefreshCw,
  Plus
} from "lucide-react";
import { StatCard } from "./StatCard";
import { api, API_BASE, getPhotoUrl } from "../services/api";
import { useToast } from "./Toast";

export const SimpleAuthorityView = ({
  kpis,
  roads = [],
  reports = [],
  facilities = [],
  onOpenWhyRisk,
  onRefreshData
}) => {
  const { addToast } = useToast();
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [roadStatus, setRoadStatus] = useState("CLOSED");
  const [roadReason, setRoadReason] = useState("Severe water accumulation >50cm");

  const [selectedReport, setSelectedReport] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState("Verified via ground sensor & CCTV");

  const handleUpdateRoad = async () => {
    if (!selectedRoad) return;
    try {
      await api.updateRoadStatus(selectedRoad.id, {
        new_status: roadStatus,
        changed_by: "Chief Disaster Officer Sharma",
        reason: roadReason,
      });
      addToast(`Road ${selectedRoad.road_name} updated to ${roadStatus}`, "success");
      setSelectedRoad(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      addToast("Failed to update road status.", "error");
    }
  };

  const handleVerifyReport = async (action) => {
    if (!selectedReport) return;
    try {
      await api.verifyReport(selectedReport.id, {
        action: action,
        verified_by: "Chief Disaster Officer Sharma",
        notes: verifyNotes,
        create_incident: action === "VERIFY",
        incident_priority: "HIGH",
      });
      addToast(`Report ${selectedReport.report_code} marked as ${action}`, "success");
      setSelectedReport(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      addToast("Failed to verify report.", "error");
    }
  };

  const pendingReports = reports.filter((r) => r.verification_status === "PENDING");

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <span>MUNICIPAL FLOOD COMMAND DASHBOARD</span>
          </h2>
          <p className="text-xs text-slate-400">
            Decision-support controls: Road closures, report verification & inter-agency coordination
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`${API_BASE}/analytics/export/csv?dataset=reports`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold hover-lift transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
          <button
            onClick={onRefreshData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Clean Key Performance Indicators */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="City Risk Level"
            value={kpis.current_overall_risk}
            subtitle={`Average Index: ${kpis.risk_score_average}/100`}
            variant={kpis.current_overall_risk === "CRITICAL" ? "critical" : "warning"}
            badge={kpis.current_overall_risk}
            icon={Flame}
            onClick={onOpenWhyRisk}
          />
          <StatCard
            title="Inundated Roads"
            value={kpis.affected_roads_count}
            subtitle="Flooded / Closed"
            variant="critical"
            icon={Navigation}
          />
          <StatCard
            title="Pending Reports"
            value={kpis.pending_reports_count}
            subtitle="Requires verification"
            variant="warning"
            icon={AlertTriangle}
          />
          <StatCard
            title="Accessible Shelters"
            value={facilities.filter((f) => f.accessibility_status === "ACCESSIBLE").length}
            subtitle={`${facilities.length} Total Facilities`}
            variant="emerald"
            icon={Building2}
          />
        </div>
      )}

      {/* 2 Simple Action Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Panel 1: Manage Roads & Closures */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Road Network Passability (Section 12 & 36)
              </h3>
              <p className="text-[11px] text-slate-400">Click any road to modify closure status</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{roads.length} Monitored</span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {roads.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRoad(r)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer hover-lift transition-all"
              >
                <div>
                  <div className="font-bold text-white">{r.road_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{r.road_code} • Hazard: {r.flood_risk}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === "OPEN" ? "bg-emerald-500/20 text-emerald-400" :
                    r.status === "AT_RISK" ? "bg-amber-500/20 text-amber-400" :
                    r.status === "FLOODED" ? "bg-sky-500/20 text-sky-400" : "bg-rose-500/20 text-rose-400"
                  }`}>
                    {r.status}
                  </span>
                  <span className="text-slate-500 text-[11px]">Edit →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Pending Citizen Verifications */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Citizen Verification Queue (Section 16)
              </h3>
              <p className="text-[11px] text-slate-400">Verify to auto-spawn incident and dispatch task</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {pendingReports.length} Pending
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {pendingReports.map((rpt) => (
              <div
                key={rpt.id}
                onClick={() => setSelectedReport(rpt)}
                className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-500 flex flex-col justify-between text-xs cursor-pointer hover-lift transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">{rpt.report_code}</span>
                  <span className="text-[10px] text-slate-400">{rpt.reported_water_level}</span>
                </div>
                {rpt.photo_url && (
                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-black/50 aspect-video">
                    <img
                      src={getPhotoUrl(rpt.photo_url)}
                      alt="Ground Evidence"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                )}
                <p className="text-slate-200 text-[11px] font-medium">{rpt.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                  <span>By: {rpt.reporter_name}</span>
                  <span className="text-amber-400 font-bold">Review & Verify →</span>
                </div>
              </div>
            ))}

            {pendingReports.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                ✓ No pending citizen reports awaiting verification.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROAD STATUS MODAL */}
      {selectedRoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">
            <h3 className="text-base font-bold text-white">Modify Road Operational Status</h3>
            <p className="text-xs text-slate-400 font-medium">
              Updating: <strong className="text-brand-400">{selectedRoad.road_name}</strong>
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Status</label>
              <select
                value={roadStatus}
                onChange={(e) => setRoadStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-medium"
              >
                <option value="OPEN">OPEN (Normal Flow)</option>
                <option value="AT_RISK">AT_RISK (Slow / Water on curbs)</option>
                <option value="FLOODED">FLOODED (Submerged)</option>
                <option value="CLOSED">CLOSED (Barricaded)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Reason (Logged to Audit Trail)</label>
              <input
                type="text"
                value={roadReason}
                onChange={(e) => setRoadReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRoad(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRoad}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs hover-lift transition-all"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT VERIFY MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">
            <h3 className="text-base font-bold text-white">Verify Citizen Inundation Report</h3>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-xs space-y-2">
              <div className="font-mono font-bold text-amber-400">{selectedReport.report_code}</div>
              {selectedReport.photo_url && (
                <div className="rounded-lg overflow-hidden border border-slate-800 bg-black/60 aspect-video">
                  <img
                    src={getPhotoUrl(selectedReport.photo_url)}
                    alt="Ground Evidence"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
              )}
              <p className="text-slate-200">{selectedReport.description}</p>
              <div className="text-[10px] text-slate-400">Water Depth: {selectedReport.reported_water_level}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Verification Notes</label>
              <input
                type="text"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyReport("REJECT")}
                className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => handleVerifyReport("VERIFY")}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs hover-lift transition-all"
              >
                Verify & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
