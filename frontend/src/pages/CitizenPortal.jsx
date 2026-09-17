import React, { useState, useEffect } from "react";
import {
  Compass,
  AlertTriangle,
  Camera,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Navigation,
  LifeBuoy,
  Phone,
  FileText,
  Hospital,
  HelpCircle,
  Eye
} from "lucide-react";
import confetti from "canvas-confetti";
import { MapView } from "../components/MapView";
import { RouteFinder } from "../components/RouteFinder";
import { api } from "../services/api";
import { useToast } from "../components/Toast";

export const CitizenPortal = ({ weather }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("map"); // map | report | tracking | route | facilities
  const [reports, setReports] = useState([]);
  const [wards, setWards] = useState([]);
  const [roads, setRoads] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [drainageAssets, setDrainageAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);
  const [routePickingMode, setRoutePickingMode] = useState(null);

  // Citizen Report Form State
  const [issueType, setIssueType] = useState("FLOODING");
  const [description, setDescription] = useState("");
  const [waterLevel, setWaterLevel] = useState("Knee deep (35-45cm)");
  const [reporterName, setReporterName] = useState("Local Resident");
  const [reporterPhone, setReporterPhone] = useState("");
  const [lat, setLat] = useState(13.0827);
  const [lng, setLng] = useState(80.2707);
  const [submittedReport, setSubmittedReport] = useState(null);

  const loadCitizenData = async () => {
    try {
      setLoading(true);
      const [rptRes, wardRes, roadRes, facRes, drainRes] = await Promise.all([
        api.getReports(),
        api.getRiskAreas(),
        api.getRoads(),
        api.getFacilities(),
        api.getDrainageAssets(),
      ]);
      setReports(rptRes);
      setWards(wardRes);
      setRoads(roadRes);
      setFacilities(facRes);
      setDrainageAssets(drainRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitizenData();
  }, []);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(4)));
          setLng(parseFloat(pos.coords.longitude.toFixed(4)));
          addToast("GPS Location locked.", "success");
        },
        () => {
          // Default to high-risk basin zone for demo
          setLat(13.0835);
          setLng(80.2810);
          addToast("Demo location coordinates assigned.", "info");
        }
      );
    } else {
      setLat(13.0835);
      setLng(80.2810);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!description) {
      addToast("Please provide a description of the flood or obstruction.", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await api.submitReport({
        reporter_name: reporterName,
        reporter_phone: reporterPhone || "+91 98401 00000",
        report_type: issueType,
        description: description,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        reported_water_level: waterLevel,
        photo_url: "/uploads/demo_report_photo.jpg"
      });

      setSubmittedReport(res);
      addToast(`Report ${res.report_code} logged in municipal system!`, "success");

      // Celebratory feedback
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });

      setDescription("");
      loadCitizenData();
    } catch (err) {
      addToast("Failed to submit report. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Emergency Advisory Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Active Monsoon Flood Advisory
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                LIVE UPDATE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Heavy waterlogging reported along Marina Coastal Arterial & Adyar River Causeway. Use safe routing before traveling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("report")}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover-lift transition-all"
          >
            Report Inundation
          </button>
          <button
            onClick={() => setActiveTab("route")}
            className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 hover-lift transition-all"
          >
            Find Safe Route
          </button>
        </div>
      </div>

      {/* Citizen Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === "map"
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Compass className="w-4 h-4" />
          Public Flood Hazard Map
        </button>

        <button
          onClick={() => setActiveTab("report")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === "report"
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Camera className="w-4 h-4" />
          Report Waterlogging / Drain
        </button>

        <button
          onClick={() => setActiveTab("route")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === "route"
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Navigation className="w-4 h-4" />
          Safe Lower-Risk Route
        </button>

        <button
          onClick={() => setActiveTab("tracking")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === "tracking"
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          Track My Submissions ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab("facilities")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === "facilities"
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Hospital className="w-4 h-4" />
          Emergency Relief Shelters
        </button>
      </div>

      {/* VIEW 1: PUBLIC FLOOD MAP */}
      {activeTab === "map" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Official Public Flood Inundation & Accessibility Map (Section 41)
            </h3>
            <span className="text-[11px] text-slate-400">
              Only verified and public safety information displayed
            </span>
          </div>

          <MapView
            wards={wards}
            roads={roads}
            facilities={facilities}
            reports={reports.filter((r) => r.verification_status === "VERIFIED")}
            drainageAssets={[]} // Redacted from citizen view per Section 41
            incidents={[]} // Operational details shielded
            activeRoute={activeRoute}
            height="520px"
          />
        </div>
      )}

      {/* VIEW 2: REPORT AN ISSUE FORM */}
      {activeTab === "report" && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Report Flood or Drainage Obstruction</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your submission feeds directly into municipal risk recalculations and triggers emergency dispatch.
            </p>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-4">
            {/* Issue Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hazard Type (Section 14)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["FLOODING", "WATERLOGGING", "BLOCKED_DRAIN", "ROAD_OBSTRUCTION", "OTHER"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIssueType(type)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      issueType === type
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {type.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Water Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Observed Water Inundation Level</label>
              <select
                value={waterLevel}
                onChange={(e) => setWaterLevel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="Ankle deep (10-15cm)">Ankle deep (10 - 15 cm)</option>
                <option value="Knee deep (35-45cm)">Knee deep (35 - 45 cm)</option>
                <option value="Waist deep (>70cm)">Waist deep (&gt; 70 cm - Vehicle Hazard)</option>
                <option value="Submerged (>1 meter)">Submerged (&gt; 1 meter - Life Hazard)</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Description of Situation</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify landmarks, stranded vehicles, blocked culvert trash racks..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            {/* GPS Location & Map Coordinates */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Incident GPS Location
                </span>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Fetch Current GPS
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude"
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude"
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                />
              </div>
            </div>

            {/* Reporter Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Your Name (Optional)</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Mobile Phone (For SMS updates)</label>
                <input
                  type="text"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="+91 98400..."
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 hover-lift transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Submitting to Municipal Registry..." : "Submit Flood Report"}</span>
            </button>
          </form>

          {/* Submitted Confirmation Card */}
          {submittedReport && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Report Logged Successfully!</span>
              </div>
              <div className="text-xs text-slate-300">
                Tracking Code: <strong className="text-white font-mono">{submittedReport.report_code}</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                Status: <span className="text-amber-400 font-semibold">{submittedReport.status}</span> (Sent to Authority Desk)
              </div>
              {submittedReport.duplicate_notice && (
                <div className="text-[10px] text-amber-300 mt-1">
                  {submittedReport.duplicate_notice}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SAFE ROUTE FINDER */}
      {activeTab === "route" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <RouteFinder
              currentRoute={activeRoute}
              onRouteCalculated={(rt) => setActiveRoute(rt)}
              facilities={facilities}
              origin={routeOrigin}
              destination={routeDestination}
              onChangeOrigin={(loc) => setRouteOrigin(loc)}
              onChangeDestination={(loc) => setRouteDestination(loc)}
              pickingMode={routePickingMode}
              setPickingMode={(mode) => setRoutePickingMode(mode)}
              onClearRoute={() => setActiveRoute(null)}
            />
          </div>
          <div className="lg:col-span-2">
            <MapView
              wards={wards}
              roads={roads}
              facilities={facilities}
              reports={reports}
              drainageAssets={drainageAssets}
              incidents={[]}
              activeRoute={activeRoute}
              origin={routeOrigin}
              destination={routeDestination}
              pickingMode={routePickingMode}
              onPickLocation={(latlng, mode) => {
                if (!latlng || !mode) {
                  setRoutePickingMode(null);
                  return;
                }
                const loc = {
                  name: mode === "origin" 
                    ? `Start (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`
                    : `Destination (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`,
                  lat: parseFloat(latlng.lat.toFixed(4)),
                  lng: parseFloat(latlng.lng.toFixed(4))
                };
                if (mode === "origin") setRouteOrigin(loc);
                else setRouteDestination(loc);
                setRoutePickingMode(null);
              }}
              onSetOriginFromMap={(loc) => setRouteOrigin(loc)}
              onSetDestinationFromMap={(loc) => setRouteDestination(loc)}
              height="550px"
            />
          </div>
        </div>
      )}

      {/* VIEW 4: TRACK MY SUBMISSIONS */}
      {activeTab === "tracking" && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Citizen Ground Submissions Registry</h3>
            <p className="text-xs text-slate-400">
              Live verification status and operational progress of community reports
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((rpt) => (
              <div key={rpt.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs">{rpt.report_code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rpt.verification_status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" :
                    rpt.verification_status === "REJECTED" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {rpt.verification_status}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{rpt.description}</p>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-850 space-y-1">
                  <div>Type: <strong className="text-slate-200">{rpt.report_type}</strong></div>
                  <div>Water Depth: <strong className="text-amber-400">{rpt.reported_water_level}</strong></div>
                  {rpt.verified_by && (
                    <div className="text-[10px] text-emerald-400">
                      ✓ Verified by {rpt.verified_by}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: EMERGENCY RELIEF SHELTERS */}
      {activeTab === "facilities" && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Public Emergency Relief Centers & Hospitals</h3>
            <p className="text-xs text-slate-400">
              Designated safe zones, hospitals, and high-ground shelters with real-time road accessibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {facilities.map((fac) => (
              <div key={fac.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover-lift transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{fac.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    fac.accessibility_status === "ACCESSIBLE" ? "bg-emerald-500/20 text-emerald-400" :
                    fac.accessibility_status === "AT_RISK" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                  }`}>
                    {fac.accessibility_status}
                  </span>
                </div>

                <div className="text-xs text-slate-300">{fac.address}</div>
                <div className="text-[11px] text-slate-400">{fac.contact_information}</div>

                <div className="mt-2 pt-2 border-t border-slate-850 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Type: <strong className="text-slate-300">{fac.facility_type}</strong></span>
                  <span className="text-emerald-400 font-semibold">24/7 Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
