import React, { useState, useRef } from "react";
import {
  Camera,
  MapPin,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UploadCloud,
  Image as ImageIcon,
  X,
  Eye,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { api, getPhotoUrl } from "../services/api";
import { useToast } from "./Toast";

export const SimpleReportForm = ({ initialLocation, reports = [], onReportSubmitted }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [issueType, setIssueType] = useState("FLOODING");
  const [waterLevel, setWaterLevel] = useState("Knee deep (35-45cm)");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("Concerned Citizen");
  const [lat, setLat] = useState(initialLocation?.lat || 13.0827);
  const [lng, setLng] = useState(initialLocation?.lng || 80.2707);
  const [loading, setLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

  // Real ground photo evidence state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(4)));
          setLng(parseFloat(pos.coords.longitude.toFixed(4)));
          addToast("Exact GPS location locked.", "success");
        },
        () => {
          addToast("GPS access unavailable, using current map coordinates.", "info");
        }
      );
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file (JPEG, PNG, WEBP).", "error");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      addToast("Photo exceeds 15MB limit. Please choose a smaller photo.", "warning");
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    addToast("Ground photo attached! Ready for upload.", "success");
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photoFile) {
      addToast("📸 Ground photographic evidence is mandatory! Please capture or select a photo of the flooded area.", "warning");
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    if (!description.trim()) {
      addToast("Please enter a brief description of the location.", "warning");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Upload real photographic evidence to backend
      addToast("Uploading real ground photo evidence...", "info");
      const uploadRes = await api.uploadHazardPhoto(photoFile);
      const photoUrl = uploadRes.photo_url;

      // Step 2: Submit report with real photo evidence
      const res = await api.submitReport({
        reporter_name: reporterName,
        reporter_phone: "Citizen Ground App",
        report_type: issueType,
        description: description,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        reported_water_level: waterLevel,
        photo_url: photoUrl
      });

      setSubmittedReport(res);
      addToast(`Hazard ${res.report_code} logged with real ground photo!`, "success");

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Reset form
      setDescription("");
      handleRemovePhoto();

      if (onReportSubmitted) {
        onReportSubmitted(res);
      }
    } catch (err) {
      addToast(err.message || "Failed to submit hazard report.", "error");
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
              Submit genuine ground photographic evidence. Real citizen reports update live hazard models and alert rescue squads.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Photo Verified
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

          {/* Step 3: MANDATORY REAL GROUND PHOTO EVIDENCE */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>3. Ground Photographic Evidence <span className="text-rose-400 font-bold">*Mandatory</span></span>
              </label>
              <span className="text-[10px] text-slate-400">Real camera or photo required</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {!photoPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 hover:bg-slate-900/50 rounded-xl p-5 text-center cursor-pointer transition-all group"
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 group-hover:border-emerald-500 flex items-center justify-center text-slate-300 group-hover:text-emerald-400 transition-colors">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white block">
                      Click to Take Photo or Upload Image
                    </span>
                    <span className="text-[10px] text-slate-400">
                      JPEG, PNG, WEBP (Real scene from device camera or gallery)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-900 flex items-center gap-3 p-3">
                <img
                  src={photoPreview}
                  alt="Ground Preview"
                  className="w-24 h-20 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setEnlargedPhoto(photoPreview)}
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Photo Attached & Verified</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate font-mono">
                    {photoFile?.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {(photoFile?.size ? (photoFile.size / 1024).toFixed(1) : 0)} KB • Ready to submit
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEnlargedPhoto(photoPreview)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 font-semibold"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-[10px] flex items-center gap-1 font-semibold"
                  >
                    <X className="w-3 h-3" />
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Location & Note */}
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
                placeholder="e.g. Near bus stop, water entering shops, road completely impassable..."
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
            <span>{loading ? "Submitting Real Hazard Report..." : "Submit Photo-Verified Report"}</span>
          </button>
        </form>

        {/* Confirmation Output */}
        {submittedReport && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Report Verified & Transmitted to Municipal Command
              </span>
              <span className="font-mono text-white text-xs font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                {submittedReport.report_code}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Ground evidence registered. Municipal command center notified and nearest road corridor updated dynamically.
            </p>
          </div>
        )}
      </div>

      {/* Live Ground Reports Feed */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>Real Community Ground Reports ({reports.length})</span>
          </h3>
          <span className="text-[10px] text-slate-400">Live Registry with Real Photo Evidence</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => {
            const isEvacBeacon = r.report_type === "EMERGENCY_EVACUATION";
            const photoSrc = r.photo_url ? getPhotoUrl(r.photo_url) : null;

            return (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2 hover-lift transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-white flex items-center gap-1">
                      {isEvacBeacon ? "🚨 " : "⚠️ "}
                      {r.report_code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.verification_status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                      r.verification_status === "REJECTED" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {r.verification_status}
                    </span>
                  </div>

                  {/* Real Photographic Evidence Thumbnail */}
                  {photoSrc ? (
                    <div
                      onClick={() => setEnlargedPhoto(photoSrc)}
                      className="relative rounded-lg overflow-hidden border border-slate-800 group cursor-pointer aspect-video bg-black/50"
                    >
                      <img
                        src={photoSrc}
                        alt="Ground Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5 opacity-90 group-hover:opacity-100">
                        <span className="text-[9px] font-bold text-white flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded">
                          <Eye className="w-2.5 h-2.5 text-emerald-400" />
                          View Ground Evidence
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-14 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-[10px] text-slate-500">
                      {isEvacBeacon ? "📍 Live GPS Distress Beacon" : "📷 Ground Report"}
                    </div>
                  )}

                  <p className="text-xs text-slate-200 line-clamp-2">{r.description}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-850">
                  <span>Depth: <strong className="text-slate-300">{r.reported_water_level || "Observed"}</strong></span>
                  <span className="font-mono text-slate-400">{r.reported_at?.slice(0, 16) || "Active"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div
            className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                Ground Photographic Evidence (Real Citizen Upload)
              </span>
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center">
              <img
                src={enlargedPhoto}
                alt="Enlarged Ground Evidence"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
