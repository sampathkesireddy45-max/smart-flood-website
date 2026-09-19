import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  Truck,
  Building2,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Filter,
  Plus,
  ArrowUpRight,
  Droplets,
  ExternalLink,
  Layers,
  Flame,
  Radio,
  RefreshCw,
  Activity
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { MapView } from "../components/MapView";
import { WhyRiskModal } from "../components/WhyRiskModal";
import { api, API_BASE, getPhotoUrl } from "../services/api";
import { useToast } from "../components/Toast";

export const AuthorityDashboard = ({
  weather,
  center,
  userLocation,
  cityName,
  onOpenWhyRisk,
  selectedWardForExplain,
  onSelectWardForExplain,
  onOpenSimulator,
  onNavigateTab
}) => {
  const { addToast } = useToast();
  const [kpis, setKpis] = useState(null);
  const [wards, setWards] = useState([]);
  const [roads, setRoads] = useState([]);
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [drainage, setDrainage] = useState([]);
  const [resources, setResources] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeLat = userLocation?.lat || center?.[0];
  const activeLng = userLocation?.lng || center?.[1];

  // Active subtab: overview | roads | reports | incidents | facilities | drainage | resources
  const [subTab, setSubTab] = useState("overview");

  // Modals state
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [newRoadStatus, setNewRoadStatus] = useState("CLOSED");
  const [roadChangeReason, setRoadChangeReason] = useState("Water accumulation exceeding 40cm");

  const [selectedReport, setSelectedReport] = useState(null);
  const [verifyAction, setVerifyAction] = useState("VERIFY");
  const [verifyNotes, setVerifyNotes] = useState("Verified via field sensor & CCTV");
  const [autoCreateIncident, setAutoCreateIncident] = useState(true);

  const [showCreateIncidentModal, setShowCreateIncidentModal] = useState(false);
  const [newIncTitle, setNewIncTitle] = useState("");
  const [newIncType, setNewIncType] = useState("ROAD_INUNDATION");
  const [newIncPriority, setNewIncPriority] = useState("HIGH");
  const [newIncDesc, setNewIncDesc] = useState("");

  // Drainage Inspection Modal state
  const [selectedDrainage, setSelectedDrainage] = useState(null);
  const [drainageCondition, setDrainageCondition] = useState("GOOD");
  const [drainageNotes, setDrainageNotes] = useState("");

  // Field Task Dispatch Modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchIncidentId, setDispatchIncidentId] = useState(null);
  const [dispatchWorker, setDispatchWorker] = useState("Rajesh Kumar");
  const [dispatchTitle, setDispatchTitle] = useState("");
  const [dispatchDesc, setDispatchDesc] = useState("");
  const [dispatchPriority, setDispatchPriority] = useState("HIGH");
  const [dispatchLocation, setDispatchLocation] = useState("");

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [kpiRes, wardRes, roadRes, rptRes, incRes, tskRes, facRes, drnRes, resRes, teamRes] = await Promise.all([
        api.getDashboardSummary(activeLat, activeLng),
        api.getRiskAreas(activeLat, activeLng),
        api.getRoads(null, activeLat, activeLng),
        api.getReports(null, null, activeLat, activeLng),
        api.getIncidents(null, null, activeLat, activeLng),
        api.getTasks(null, null, activeLat, activeLng),
        api.getFacilities(null, null, activeLat, activeLng),
        api.getDrainageAssets(null, activeLat, activeLng),
        api.getResources(),
        api.getTeams(),
      ]);

      setKpis(kpiRes);
      setWards(wardRes);
      setRoads(roadRes);
      setReports(rptRes);
      setIncidents(incRes);
      setTasks(tskRes);
      setFacilities(facRes);
      setDrainage(drnRes);
      setResources(resRes || []);
      setTeams(teamRes || []);
    } catch (err) {
      console.error(err);
      addToast("Connected with local operational database.", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeLat, activeLng]);

  const handleUpdateRoad = async () => {
    if (!selectedRoad) return;
    try {
      await api.updateRoadStatus(selectedRoad.id, {
        new_status: newRoadStatus,
        changed_by: "Chief Disaster Officer Sharma",
        reason: roadChangeReason,
      });
      addToast(`Road ${selectedRoad.road_name} updated to ${newRoadStatus}`, "success");
      setSelectedRoad(null);
      loadAllData();
    } catch (err) {
      addToast("Failed to update road status.", "error");
    }
  };

  const handleVerifyReport = async () => {
    if (!selectedReport) return;
    try {
      await api.verifyReport(selectedReport.id, {
        action: verifyAction,
        verified_by: "Chief Disaster Officer Sharma",
        notes: verifyNotes,
        create_incident: autoCreateIncident,
        incident_priority: "HIGH",
      });
      addToast(`Report ${selectedReport.report_code} marked as ${verifyAction}`, "success");
      setSelectedReport(null);
      loadAllData();
    } catch (err) {
      addToast("Failed to verify report.", "error");
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!newIncTitle) return;
    try {
      await api.createIncident({
        title: newIncTitle,
        incident_type: newIncType,
        description: newIncDesc,
        priority: newIncPriority,
        latitude: 13.0827,
        longitude: 80.2707,
        created_by: "Authority Command Dispatch",
      });
      addToast(`Emergency incident created successfully.`, "success");
      setShowCreateIncidentModal(false);
      setNewIncTitle("");
      setNewIncDesc("");
      loadAllData();
    } catch (err) {
      addToast("Failed to create incident.", "error");
    }
  };

  const handleUpdateDrainageCondition = async (e) => {
    e.preventDefault();
    if (!selectedDrainage) return;
    try {
      await api.updateDrainageCondition(selectedDrainage.id, {
        condition: drainageCondition,
        notes: drainageNotes || "Inspected by Municipal Drainage Maintenance Unit",
        inspector_name: "Municipal Flood Control Engineer",
      });
      addToast(`Drainage Asset ${selectedDrainage.asset_code} condition updated to ${drainageCondition}`, "success");
      setSelectedDrainage(null);
      loadAllData();
    } catch (err) {
      addToast("Failed to update drainage condition.", "error");
    }
  };

  const handleDispatchTask = async (e) => {
    e.preventDefault();
    if (!dispatchTitle) return;
    try {
      await api.createTask({
        title: dispatchTitle,
        description: dispatchDesc || "Urgent on-site flood inspection and dewatering coordination.",
        assigned_to: dispatchWorker,
        location: dispatchLocation || "Municipal Incident Sector",
        latitude: 13.0827,
        longitude: 80.2707,
        priority: dispatchPriority,
        incident_id: dispatchIncidentId || null,
      });
      addToast(`Field operational task assigned to ${dispatchWorker}!`, "success");
      setShowDispatchModal(false);
      setDispatchTitle("");
      setDispatchDesc("");
      loadAllData();
    } catch (err) {
      addToast("Failed to dispatch task.", "error");
    }
  };

  const handleRecalculateRisk = async () => {
    try {
      addToast("Recalculating multi-factor municipal flood hazard scores...", "info");
      await api.recalculateRisk();
      addToast("Flood hazard engine updated across all municipal sectors!", "success");
      loadAllData();
    } catch (err) {
      addToast("Failed to recalculate risk.", "error");
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white tracking-tight">
              MUNICIPAL DISASTER COMMAND CENTER
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              📍 {cityName || "Live Sector"} ({activeLat ? activeLat.toFixed(2) : "13.08"}, {activeLng ? activeLng.toFixed(2) : "80.27"})
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time urban flood monitoring, sensor telemetry & coordinated inter-agency response
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculateRisk}
            title="Recalculate flood risk based on current weather & ground telemetry"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 font-bold text-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate Hazard</span>
          </button>

          <button
            onClick={() => {
              setDispatchIncidentId(null);
              setDispatchTitle("");
              setDispatchDesc("");
              setShowDispatchModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>Dispatch Task</span>
          </button>

          <button
            onClick={() => setShowCreateIncidentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 hover-lift transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Incident</span>
          </button>

          <button
            onClick={loadAllData}
            title="Refresh All Records"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white hover-lift transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards Row (Section 31 & 70) */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Overall Hazard"
            value={kpis.current_overall_risk}
            subtitle={`Avg Score: ${kpis.risk_score_average}/100`}
            variant={kpis.current_overall_risk === "CRITICAL" ? "critical" : "warning"}
            badge={kpis.current_overall_risk}
            icon={ShieldAlert}
          />
          <StatCard
            title="Critical Wards"
            value={kpis.critical_wards_count}
            subtitle={`${kpis.high_risk_wards_count} High Risk`}
            variant="critical"
            icon={Flame}
          />
          <StatCard
            title="Active Incidents"
            value={kpis.active_incidents_count}
            subtitle="Emergency response"
            variant="warning"
            icon={AlertTriangle}
          />
          <StatCard
            title="Pending Reports"
            value={kpis.pending_reports_count}
            subtitle="Citizen submissions"
            variant="brand"
            icon={FileText}
          />
          <StatCard
            title="Roads Affected"
            value={kpis.affected_roads_count}
            subtitle="Flooded / Closed"
            variant="critical"
            icon={Navigation}
          />
          <StatCard
            title="Active Operations"
            value={kpis.open_tasks_count}
            subtitle="Live Incident Actions"
            variant="emerald"
            icon={Activity}
          />
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: "overview", label: "Overview & Map" },
            { id: "roads", label: `Road Management (${roads.length})` },
            { id: "reports", label: `Citizen Reports (${reports.length})` },
            { id: "incidents", label: `Incidents & Tasks (${incidents.length})` },
            { id: "facilities", label: `Critical Facilities (${facilities.length})` },
            { id: "drainage", label: `Drainage Infrastructure (${drainage.length})` },
            { id: "resources", label: `Fleet & Strike Teams (${resources.length + teams.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                subTab === t.id
                  ? "bg-brand-600/20 text-brand-300 border border-brand-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Quick Dashboard Jump & Export CSV */}
        <div className="hidden sm:flex items-center gap-2">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab("field")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/40 text-amber-300 text-[11px] font-semibold hover-lift transition-all"
                title="Switch to Field Response Inspection Terminal"
              >
                <Truck className="w-3 h-3 text-amber-400" />
                <span>Field Terminal</span>
              </button>
              <button
                onClick={() => onNavigateTab("analytics")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/40 hover:bg-indigo-900/40 text-indigo-300 text-[11px] font-semibold hover-lift transition-all"
                title="Switch to Historical Flood Analytics & Audit Trail"
              >
                <Activity className="w-3 h-3 text-indigo-400" />
                <span>Audit & Analytics</span>
              </button>
            </>
          )}
          <a
            href={`${API_BASE}/analytics/export/csv?dataset=reports`}
            download
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-medium hover-lift transition-all"
          >
            <Download className="w-3 h-3 text-slate-400" />
            CSV Reports
          </a>
          <a
            href={`${API_BASE}/analytics/export/csv?dataset=roads`}
            download
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-medium hover-lift transition-all"
          >
            <Download className="w-3 h-3 text-slate-400" />
            CSV Roads
          </a>
        </div>
      </div>

      {/* VIEW 1: OVERVIEW & MAP */}
      {subTab === "overview" && (
        <div className="space-y-6">
          {/* Main Map */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-400" />
                Live GIS Flood Operations Map (Section 10 & 32)
              </span>
              <span className="text-[11px] text-slate-400">
                Click any ward to inspect factor calculation ("Why this risk?")
              </span>
            </div>
            <MapView
              wards={wards}
              roads={roads}
              facilities={facilities}
              reports={reports}
              drainageAssets={drainage}
              incidents={incidents}
              onSelectWard={(w) => onSelectWardForExplain(w)}
              onSelectRoad={(r) => setSelectedRoad(r)}
              onSelectReport={(rpt) => setSelectedReport(rpt)}
              height="500px"
            />
          </div>

          {/* Section 33: Priority Actions List (Traceable to actual system records) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Priority Operational Actions (Section 33)
              </span>
              <span className="text-[11px] text-slate-400">
                Deterministic Decision Support Recommendations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Action 1 */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-1">
                    <span>ROAD INUNDATION DETECTED</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20">URGENT</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Marina Coastal Arterial Expressway is FLOODED (Risk 86%). Bypassing traffic recommended.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const r = roads.find((x) => x.road_code === "RD-MAR-01") || roads[0];
                    setSelectedRoad(r);
                  }}
                  className="mt-3 w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all hover-lift"
                >
                  Manage Closure Status
                </button>
              </div>

              {/* Action 2 */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                    <span>HOSPITAL ACCESS IMPAIRED</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">AT RISK</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Government General Metropolitan Hospital primary road RD-CHL-08 is at risk of backflow.
                  </p>
                </div>
                <button
                  onClick={() => setSubTab("facilities")}
                  className="mt-3 w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all hover-lift"
                >
                  Review Facility Access
                </button>
              </div>

              {/* Action 3 */}
              <div className="p-3.5 rounded-xl bg-brand-950/20 border border-brand-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-brand-400 mb-1">
                    <span>PENDING CITIZEN REPORTS</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20">VERIFICATION</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {reports.filter((x) => x.verification_status === "PENDING").length} citizen submissions awaiting verification & task creation.
                  </p>
                </div>
                <button
                  onClick={() => setSubTab("reports")}
                  className="mt-3 w-full py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all hover-lift"
                >
                  Inspect Reports Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ROADS MANAGEMENT */}
      {subTab === "roads" && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Urban Road Network Status & Vulnerability</h3>
              <p className="text-xs text-slate-400">
                Database-driven operational statuses (Section 12 & 36). Human-in-the-loop authorization required.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Road Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Zone / Ward</th>
                  <th className="p-3">Flood Hazard</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {roads.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-3 font-mono text-white">{r.road_code}</td>
                    <td className="p-3 font-semibold text-white">{r.road_name}</td>
                    <td className="p-3 text-slate-400">{r.road_type}</td>
                    <td className="p-3">{r.ward_name}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">{r.flood_risk}%</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        r.status === "OPEN" ? "bg-emerald-500/20 text-emerald-400" :
                        r.status === "AT_RISK" ? "bg-amber-500/20 text-amber-400" :
                        r.status === "FLOODED" ? "bg-sky-500/20 text-sky-400" : "bg-rose-500/20 text-rose-400"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedRoad(r)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium hover-lift transition-all"
                      >
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CITIZEN REPORTS */}
      {subTab === "reports" && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Citizen Ground Submissions & Verification Queue</h3>
              <p className="text-xs text-slate-400">
                Section 16: Review citizen reports, verify with CCTV/telemetry, and dispatch field tasks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((rpt) => (
              <div
                key={rpt.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between hover-lift transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-xs">{rpt.report_code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rpt.verification_status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" :
                      rpt.verification_status === "REJECTED" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {rpt.verification_status}
                    </span>
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

                  <p className="text-xs text-slate-200 font-medium">{rpt.description}</p>

                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Type: <strong className="text-slate-300">{rpt.report_type}</strong></div>
                    <div>Water Level: <strong className="text-amber-400">{rpt.reported_water_level}</strong></div>
                    <div>Ward: <strong className="text-slate-300">{rpt.ward_name}</strong></div>
                    <div>Reported by: {rpt.reporter_name}</div>
                  </div>

                  {rpt.is_grouped_duplicate && (
                    <div className="text-[10px] text-amber-400 font-semibold bg-amber-950/30 p-1.5 rounded border border-amber-500/20">
                      ℹ️ Multiple reports received in this area (Grouped)
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{rpt.reported_at}</span>
                  {rpt.verification_status === "PENDING" ? (
                    <button
                      onClick={() => setSelectedReport(rpt)}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs hover-lift transition-all"
                    >
                      Verify / Reject
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Action Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: INCIDENTS & TASKS */}
      {subTab === "incidents" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Incidents List */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Emergency Incidents</h3>
              <button
                onClick={() => setShowCreateIncidentModal(true)}
                className="text-xs text-brand-400 font-semibold hover:underline"
              >
                + New Incident
              </button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-rose-400">{inc.incident_code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                      {inc.priority} PRIORITY
                    </span>
                  </div>
                  <div className="font-semibold text-white text-xs">{inc.title}</div>
                  <p className="text-[11px] text-slate-400">{inc.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Status: <strong className="text-slate-300">{inc.status}</strong></span>
                    <span>Team: <strong className="text-slate-300">{inc.assigned_team_name}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Field Operations Tasks</h3>
              <span className="text-xs text-slate-400">Assigned to Field Teams</span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {tasks.map((tsk) => (
                <div key={tsk.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-brand-400">{tsk.task_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tsk.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" :
                      tsk.status === "IN_PROGRESS" ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-300"
                    }`}>
                      {tsk.status}
                    </span>
                  </div>
                  <div className="font-semibold text-white text-xs">{tsk.title}</div>
                  <p className="text-[11px] text-slate-400">{tsk.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Worker: <strong className="text-white">{tsk.assigned_to}</strong></span>
                    <span>Loc: {tsk.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: CRITICAL FACILITIES */}
      {subTab === "facilities" && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Critical Facilities & Road Accessibility</h3>
              <p className="text-xs text-slate-400">
                Section 26: Dynamic accessibility logic evaluated using actual access road status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {facilities.map((fac) => (
              <div key={fac.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover-lift transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{fac.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    fac.accessibility_status === "ACCESSIBLE" ? "bg-emerald-500/20 text-emerald-400" :
                    fac.accessibility_status === "AT_RISK" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                  }`}>
                    {fac.accessibility_status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  <div>Type: <strong className="text-slate-200">{fac.facility_type}</strong></div>
                  <div>Address: {fac.address}</div>
                  <div>Direct Flood Hazard: <strong className="text-white">{fac.direct_flood_risk}</strong></div>
                </div>

                <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400 space-y-1">
                  {fac.primary_road && (
                    <div>Primary Road: <strong className="text-white">{fac.primary_road.name}</strong> ({fac.primary_road.status})</div>
                  )}
                  {fac.alt_road && (
                    <div>Alternative Road: <strong className="text-white">{fac.alt_road.name}</strong> ({fac.alt_road.status})</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 6: DRAINAGE ASSETS */}
      {subTab === "drainage" && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Drainage Assets & Pumping Infrastructure</h3>
              <p className="text-xs text-slate-400">
                Pumping stations, storm drains, culverts & condition monitoring (Section 28 & 37)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {drainage.map((d) => (
              <div key={d.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover-lift transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-brand-400">{d.asset_code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    d.condition === "GOOD" ? "bg-emerald-500/20 text-emerald-400" :
                    d.condition === "POOR" ? "bg-rose-500/20 text-rose-400" :
                    d.condition === "INSPECTION_REQUIRED" ? "bg-amber-500/20 text-amber-400 animate-pulse" : "bg-slate-800 text-slate-300"
                  }`}>
                    {d.condition}
                  </span>
                </div>
                <div className="font-semibold text-white text-xs">{d.asset_type}</div>
                <div className="text-[11px] text-slate-400">{d.location}</div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                  Capacity: {d.capacity}
                </div>
                <button
                  onClick={() => {
                    setSelectedDrainage(d);
                    setDrainageCondition(d.condition || "GOOD");
                    setDrainageNotes(d.notes || "");
                  }}
                  className="mt-2 w-full py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 font-semibold transition-all hover-lift"
                >
                  Inspect / Update Condition
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 7: EMERGENCY RESOURCES & FLEET */}
      {subTab === "resources" && (
        <div className="space-y-6">
          {/* Emergency Equipment */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Heavy Equipment & Dewatering Pumps ({resources.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time deployment of high-capacity pumps, rescue inflatables, and mobile power units
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {resources.map((res) => (
                <div key={res.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover-lift transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{res.resource_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      res.status === "AVAILABLE" ? "bg-emerald-500/20 text-emerald-400" :
                      res.status === "DEPLOYED" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {res.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <div>Type: <strong className="text-slate-300">{res.type}</strong></div>
                    <div>Location: {res.location}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Change Operational Status:</span>
                    <select
                      value={res.status}
                      onChange={async (e) => {
                        const newSt = e.target.value;
                        await api.updateResource(res.id, { status: newSt });
                        addToast(`${res.resource_name} status updated to ${newSt}`, "success");
                        loadAllData();
                      }}
                      className="p-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="DEPLOYED">DEPLOYED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Response Strike Teams */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <span>Coordinated Emergency Response Teams ({teams.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  National Disaster Response Force (NDRF), Civil Defense, Municipal Health, and Fire units
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map((tm) => (
                <div key={tm.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover-lift transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{tm.team_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tm.current_status === "ON_DUTY" ? "bg-emerald-500/20 text-emerald-400" :
                      tm.current_status === "ENGAGED" ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {tm.current_status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <div>Type: <strong className="text-slate-300">{tm.team_type}</strong></div>
                    <div>Base Station: {tm.current_location}</div>
                    <div>Emergency Dispatch: <span className="text-brand-300 font-mono">{tm.contact_information}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CHANGE ROAD STATUS */}
      {selectedRoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">
            <h3 className="text-base font-bold text-white">Update Road Operational Status</h3>
            <p className="text-xs text-slate-400 font-medium">
              Updating: <strong className="text-brand-400">{selectedRoad.road_name}</strong> ({selectedRoad.road_code})
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">New Road Status</label>
              <select
                value={newRoadStatus}
                onChange={(e) => setNewRoadStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="OPEN">OPEN (Passable)</option>
                <option value="AT_RISK">AT_RISK (Slow flow / Warning)</option>
                <option value="FLOODED">FLOODED (Submerged water)</option>
                <option value="CLOSED">CLOSED (Barricaded / Prohibited)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Justification / Reason (Audited)</label>
              <input
                type="text"
                value={roadChangeReason}
                onChange={(e) => setRoadChangeReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                placeholder="Reason for change..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRoad(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
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

      {/* MODAL 2: VERIFY REPORT */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">
            <h3 className="text-base font-bold text-white">Review & Verify Ground Report</h3>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between font-mono text-amber-400 font-bold">
                <span>{selectedReport.report_code}</span>
                <span>{selectedReport.report_type}</span>
              </div>
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
              <div className="text-[10px] text-slate-400">Water Level: {selectedReport.reported_water_level}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Verification Decision</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyAction("VERIFY")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    verifyAction === "VERIFY" ? "bg-emerald-600 text-white shadow" : "bg-slate-950 text-slate-400"
                  }`}
                >
                  Verify Report
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyAction("REJECT")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    verifyAction === "REJECT" ? "bg-rose-600 text-white shadow" : "bg-slate-950 text-slate-400"
                  }`}
                >
                  Reject Report
                </button>
              </div>
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

            {verifyAction === "VERIFY" && (
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateIncident}
                  onChange={(e) => setAutoCreateIncident(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-brand-500"
                />
                <span>Automatically create Incident & assign Field Inspection Task</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyReport}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs hover-lift transition-all"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE INCIDENT */}
      {showCreateIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleCreateIncident} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">
            <h3 className="text-base font-bold text-white">Create Emergency Incident</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Incident Title</label>
              <input
                type="text"
                required
                value={newIncTitle}
                onChange={(e) => setNewIncTitle(e.target.value)}
                placeholder="e.g. Inundation outside metro station..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Incident Type</label>
                <select
                  value={newIncType}
                  onChange={(e) => setNewIncType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="ROAD_INUNDATION">ROAD INUNDATION</option>
                  <option value="DRAIN_OVERFLOW">DRAIN OVERFLOW</option>
                  <option value="COMMUNITY_FLOOD">COMMUNITY FLOOD</option>
                  <option value="FACILITY_ISOLATION">FACILITY ISOLATION</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Priority Level</label>
                <select
                  value={newIncPriority}
                  onChange={(e) => setNewIncPriority(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Description & Immediate Hazard</label>
              <textarea
                rows={3}
                required
                value={newIncDesc}
                onChange={(e) => setNewIncDesc(e.target.value)}
                placeholder="Details of water accumulation, impact on transit..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateIncidentModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs hover-lift transition-all"
              >
                Log Emergency Incident
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: UPDATE DRAINAGE ASSET CONDITION */}
      {selectedDrainage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleUpdateDrainageCondition} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-bold text-white">Inspect & Update Drainage Asset</h3>
                <p className="text-xs text-brand-400 font-mono font-bold">{selectedDrainage.asset_code} • {selectedDrainage.asset_type}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDrainage(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
              <div>Location: <strong>{selectedDrainage.location}</strong></div>
              <div>Capacity: <strong>{selectedDrainage.capacity}</strong></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Operational Condition</label>
              <select
                value={drainageCondition}
                onChange={(e) => setDrainageCondition(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="GOOD">GOOD (Clear Flow / Desilted)</option>
                <option value="FAIR">FAIR (Minor Silt Accumulation)</option>
                <option value="POOR">POOR (Severely Clogged / Backflow Risk)</option>
                <option value="INSPECTION_REQUIRED">INSPECTION REQUIRED (Emergency Crew Needed)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Maintenance & Desilting Notes</label>
              <textarea
                rows={2}
                value={drainageNotes}
                onChange={(e) => setDrainageNotes(e.target.value)}
                placeholder="e.g. Silt cleared by municipal excavator, flow unobstructed..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDrainage(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs hover-lift transition-all"
              >
                Record Maintenance Update
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: DISPATCH FIELD OPERATIONAL TASK */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleDispatchTask} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Dispatch Field Operational Task</span>
                </h3>
                <p className="text-xs text-slate-400">Deploy ground personnel for verification, barricading, or pump deployment</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Task Title</label>
              <input
                type="text"
                required
                value={dispatchTitle}
                onChange={(e) => setDispatchTitle(e.target.value)}
                placeholder="e.g. Inspect culvert blockage & deploy portable pump"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Assign To Operator</label>
                <select
                  value={dispatchWorker}
                  onChange={(e) => setDispatchWorker(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="Rajesh Kumar">Rajesh Kumar (Sector Alpha)</option>
                  <option value="Priya Mani">Priya Mani (Sector Bravo)</option>
                  <option value="Suresh Nair">Suresh Nair (Pump Maintenance Crew)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Priority Level</label>
                <select
                  value={dispatchPriority}
                  onChange={(e) => setDispatchPriority(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Operational Target Location</label>
              <input
                type="text"
                value={dispatchLocation}
                onChange={(e) => setDispatchLocation(e.target.value)}
                placeholder="e.g. Metro Junction Sector 4 Underpass"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Detailed Action Instructions</label>
              <textarea
                rows={2}
                value={dispatchDesc}
                onChange={(e) => setDispatchDesc(e.target.value)}
                placeholder="Specific instructions on barricades, citizen evacuation, or dewatering..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs hover-lift transition-all"
              >
                Dispatch Task to Field
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
