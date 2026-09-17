import React, { useState } from "react";
import {
  Camera,
  MapPin,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Droplet
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";
import { useToast } from "./Toast";

export const SimpleReportForm = ({ initialLocation, reports = [], onReportSubmitted }) => {
  const { addToast } = useToast();
  const [issueType, setIssueType] = useState("FLOODING");
  const [waterLevel, setWaterLevel] = useState("Knee deep (35-45cm)");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("Citizen");
  const [lat, setLat] = useState(initialLocation?.lat || 13.0827);
  const [lng, setLng] = useState(initialLocation?.lng || 80.2707);
  const [loading, setLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(4)));
          setLng(parseFloat(pos.coords.longitude.toFixed(4)));
          addToast("Exact GPS location locked.", "success");
        },
        () => {
          addToast("GPS access unavailable, using map pin.", "info");
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      addToast("Please enter a brief description.", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await api.submitReport({
        reporter_name: reporterName,
        reporter_phone: "+91 98400 11223",
        report_type: issueType,
        description: description,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        reported_water_level: waterLevel,
        photo_url: "/uploads/demo_report.jpg"
      });

      setSubmittedReport(res);
      addToast(`Report ${res.report_code} logged successfully!`, "success");

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setDescription("");
      if (onReportSubmitted) {
        onReportSubmitted(res);
      }
    } catch (err) {
      addToast("Failed to submit report.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top Simple Form Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Report Local Flooding or Blocked Drain</span>
            </h2>
            <p className="text-xs text-slate-400">
              Your ground report updates real-time hazard models and notifies disaster response teams
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
            3 Simple Steps
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Step 1: Issue Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">1. Select Hazard Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "FLOODING", label: "🌊 Road Flooding" },
                { id: "WATERLOGGING", label: "🌧️ Waterlogging" },
                { id: "BLOCKED_DRAIN", label: "🌀 Blocked Drain" },
                { id: "ROAD_OBSTRUCTION", label: "🚧 Road Obstruction" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIssueType(item.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    issueType === item.id
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Water Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">2. Observed Water Depth</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: "Ankle deep (10-15cm)", label: "Ankle Deep", sub: "10-15 cm" },
                { val: "Knee deep (35-45cm)", label: "Knee Deep", sub: "35-45 cm" },
                { val: "Waist deep (>70cm)", label: "Waist Deep", sub: "70cm+ (Vehicle Trap)" },
                { val: "Submerged (>1m)", label: "Submerged", sub: ">1 Meter (Critical)" },
              ].map((lvl) => (
                <button
                  key={lvl.val}
                  type="button"
                  onClick={() => setWaterLevel(lvl.val)}
                  className={`py-2 px-2 rounded-xl text-center transition-all ${
                    waterLevel === lvl.val
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">{lvl.label}</div>
                  <div className="text-[10px] opacity-80">{lvl.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Location & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Exact GPS Coordinates
                </span>
                <button
                  type="button"
                  onClick={handleUseGPS}
                  className="text-xs text-emerald-400 font-bold hover:underline"
                >
                  Auto-Detect GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                  placeholder="Longitude"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Description / Landmark</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. In front of metro station, water entering ground floor shops..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 hover-lift transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "Submitting to Municipal Command..." : "Submit Report (Instant Action)"}</span>
          </button>
        </form>

        {/* Confirmation Output */}
        {submittedReport && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Report Verified & Sent to Response Team
              </span>
              <span className="font-mono text-white text-xs font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                {submittedReport.report_code}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Status: <strong className="text-amber-400">PENDING AUTHORITY VERIFICATION</strong>. An emergency task will be assigned if hazard exceeds threshold.
            </p>
          </div>
        )}
      </div>

      {/* Live Ground Reports Feed */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>Community Ground Reports Feed ({reports.length})</span>
          </h3>
          <span className="text-[10px] text-slate-400">Live Municipal Registry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5 hover-lift transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-white">{r.report_code}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  r.verification_status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" :
                  r.verification_status === "REJECTED" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {r.verification_status}
                </span>
              </div>
              <p className="text-xs text-slate-300">{r.description}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                <span>Depth: <strong className="text-slate-300">{r.reported_water_level}</strong></span>
                <span>{r.reported_at}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
