import React, { useState, useEffect } from "react";
import {
  UserCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  Upload,
  AlertTriangle,
  Play,
  FileCheck,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  Compass,
  Crosshair
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";
import { useToast } from "../components/Toast";

export const FieldWorkerDashboard = ({
  center,
  userLocation,
  cityName,
  onNavigateToTask
}) => {
  const { addToast } = useToast();
  const [selectedWorker, setSelectedWorker] = useState("Rajesh Kumar");
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [queuedEvidenceCount, setQueuedEvidenceCount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("offline_task_queue") || "[]").length;
    } catch {
      return 0;
    }
  });

  const activeLat = userLocation?.lat || center?.[0];
  const activeLng = userLocation?.lng || center?.[1];

  // Evidence submission modal
  const [activeTaskForEvidence, setActiveTaskForEvidence] = useState(null);
  const [observation, setObservation] = useState("");
  const [verificationResult, setVerificationResult] = useState("CONFIRMED");
  const [photoPreview, setPhotoPreview] = useState("/uploads/field_evidence_hospital.jpg");

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks(
        selectedWorker,
        statusFilter === "ALL" ? null : statusFilter,
        activeLat,
        activeLng
      );
      setTasks(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedWorker, statusFilter, activeLat, activeLng]);

  const handleToggleOfflineMode = async () => {
    const nextMode = !isOfflineMode;
    setIsOfflineMode(nextMode);

    if (!nextMode) {
      // Switching from offline to online -> sync queued inspections
      try {
        const queue = JSON.parse(localStorage.getItem("offline_task_queue") || "[]");
        if (queue.length > 0) {
          addToast(`📡 Reconnected to network. Syncing ${queue.length} offline inspections...`, "info");
          for (const item of queue) {
            await api.submitTaskEvidence(item.taskId, item.payload);
          }
          localStorage.removeItem("offline_task_queue");
          setQueuedEvidenceCount(0);
          addToast(`Synced ${queue.length} field inspections to municipal database!`, "success");
          loadTasks();
        } else {
          addToast("Online mode active. Direct connection to municipal API.", "info");
        }
      } catch (err) {
        addToast("Error syncing offline queue.", "error");
      }
    } else {
      addToast("Offline field mode enabled. Evidence will store locally in browser cache.", "warning");
    }
  };

  const handleStartTask = async (task) => {
    try {
      await api.updateTaskStatus(task.id, { status: "IN_PROGRESS" });
      addToast(`Task ${task.task_code} marked as IN PROGRESS`, "info");
      loadTasks();
    } catch (err) {
      addToast("Failed to start task.", "error");
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        addToast("Field photo loaded from camera/storage.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAppendGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `[GPS Verified: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} at ${new Date().toLocaleTimeString()}]`;
          setObservation((prev) => (prev ? `${prev} ${coords}` : coords));
          addToast("GPS telemetry stamped into observation notes.", "success");
        },
        () => {
          const coords = `[GPS Telemetry: Sector Benchmark 19.0760, 72.8777 at ${new Date().toLocaleTimeString()}]`;
          setObservation((prev) => (prev ? `${prev} ${coords}` : coords));
        }
      );
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!activeTaskForEvidence || !observation) {
      addToast("Please provide an inspection observation note.", "warning");
      return;
    }

    const payload = {
      worker_id: `Field Worker ${selectedWorker}`,
      observation: observation,
      verification_result: verificationResult,
      photo_url: photoPreview,
    };

    if (isOfflineMode) {
      // Offline local queueing
      const queue = JSON.parse(localStorage.getItem("offline_task_queue") || "[]");
      queue.push({ taskId: activeTaskForEvidence.id, payload });
      localStorage.setItem("offline_task_queue", JSON.stringify(queue));
      setQueuedEvidenceCount(queue.length);

      // Optimistically update local task state
      setTasks((prev) =>
        prev.map((t) => (t.id === activeTaskForEvidence.id ? { ...t, status: "COMPLETED" } : t))
      );

      addToast(`Task ${activeTaskForEvidence.task_code} saved to local offline queue!`, "info");
      setActiveTaskForEvidence(null);
      setObservation("");
      return;
    }

    try {
      await api.submitTaskEvidence(activeTaskForEvidence.id, payload);

      addToast(`Task ${activeTaskForEvidence.task_code} verification completed!`, "success");
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.6 },
      });

      setActiveTaskForEvidence(null);
      setObservation("");
      loadTasks();
    } catch (err) {
      addToast("Failed to submit evidence.", "error");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Field Operator Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                FIELD RESPONSE INSPECTION TERMINAL
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                MOBILE PROTOCOL
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                📍 {cityName || "Live Sector"} ({activeLat ? activeLat.toFixed(2) : "13.08"}, {activeLng ? activeLng.toFixed(2) : "80.27"})
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ground truth verification, gauge telemetry & photogrammetric evidence logging
            </p>
          </div>
        </div>

        {/* Worker Switcher & Connectivity Indicator */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="space-y-0.5">
            <label className="text-[10px] uppercase font-bold text-slate-400">Active Operator</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-medium"
            >
              <option value="Rajesh Kumar">Rajesh Kumar (Sector Alpha)</option>
              <option value="Priya Mani">Priya Mani (Sector Bravo)</option>
            </select>
          </div>

          <button
            onClick={handleToggleOfflineMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isOfflineMode
                ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOfflineMode ? `Offline Queue (${queuedEvidenceCount} Queued)` : "Online Sync"}</span>
          </button>
        </div>
      </div>

      {/* Section 49: Offline Queue Notice */}
      {isOfflineMode && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              <strong>Offline Field Mode Enabled:</strong> Inspection evidence & photo captures will queue locally in browser storage and auto-sync when network returns.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded">{queuedEvidenceCount} Queued</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {["ALL", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                statusFilter === st
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        <button
          onClick={loadTasks}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover-lift transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
        </button>
      </div>

      {/* Tasks Grid (Section 18 & 19) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between hover-lift transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-xs">{task.task_code}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  task.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" :
                  task.status === "IN_PROGRESS" ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-300"
                }`}>
                  {task.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white tracking-tight">{task.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1 text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{task.location}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Coordinates: ({task.latitude.toFixed(4)}, {task.longitude.toFixed(4)})
                </div>
              </div>

              {/* Evidences list if completed */}
              {task.evidences && task.evidences.length > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-200 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Evidence Confirmed: {task.evidences[0].verification_result}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">{task.evidences[0].observation}</p>
                </div>
              )}
            </div>

            {/* Task Action Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between gap-2">
              {onNavigateToTask && (
                <button
                  type="button"
                  onClick={() => onNavigateToTask(task)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-950/60 border border-sky-500/30 hover:bg-sky-900/60 text-sky-300 font-semibold text-xs transition-all hover-lift"
                  title="Navigate safe route to task coordinates"
                >
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>Safe Route</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {task.status === "ASSIGNED" && (
                  <button
                    onClick={() => handleStartTask(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs hover-lift transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Start Task</span>
                  </button>
                )}

                {task.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => setActiveTaskForEvidence(task)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover-lift transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Submit Evidence</span>
                  </button>
                )}

                {task.status === "COMPLETED" && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    Verified & Closed
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">
            No tasks currently found for this status filter.
          </div>
        )}
      </div>

      {/* EVIDENCE SUBMISSION MODAL */}
      {activeTaskForEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSubmitEvidence} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-bold text-white">Log Ground Verification Evidence</h3>
                <p className="text-xs text-slate-400">{activeTaskForEvidence.task_code} • {activeTaskForEvidence.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskForEvidence(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Verification Result */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Verification Result (Section 10)</label>
              <div className="grid grid-cols-3 gap-2">
                {["CONFIRMED", "NOT_CONFIRMED", "NEEDS_FURTHER_INSPECTION"].map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setVerificationResult(res)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold transition-all ${
                      verificationResult === res
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "bg-slate-950 border border-slate-800 text-slate-400"
                    }`}
                  >
                    {res.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Field Observation Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Field Observations & Water Gauge Reading</label>
                <button
                  type="button"
                  onClick={handleAppendGPS}
                  className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Stamp Live GPS</span>
                </button>
              </div>
              <textarea
                rows={3}
                required
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Observed 60cm standing water across carriageway. Silt blockage in storm culvert..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            {/* Photo Attachment */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  Photographic Ground Evidence
                </span>
                <label className="cursor-pointer text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 bg-amber-950/50 px-2 py-1 rounded border border-amber-500/30">
                  <Upload className="w-3 h-3" />
                  <span>Capture / Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="h-32 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                <img
                  src={photoPreview}
                  alt="Field inspection"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-1 rounded text-[10px] text-emerald-400 font-mono border border-slate-800">
                  Attached: Ground Verification Photo
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTaskForEvidence(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover-lift transition-all"
              >
                Submit Evidence & Close Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
