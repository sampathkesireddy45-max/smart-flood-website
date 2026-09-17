import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CloudRain,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Navigation,
  Sparkles,
  X
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";
import { useToast } from "./Toast";

const DEMO_STEPS = [
  {
    step: 1,
    title: "1. Baseline City Operations",
    badge: "NORMAL STATE",
    role: "Authority Command",
    description:
      "Municipal wards operate under normal baseline precipitation (18 mm/hr). All key arterial bridges and corridors are open.",
    actionPrompt: "Click to simulate sudden torrential monsoon cloudburst.",
  },
  {
    step: 2,
    title: "2. Real-Time Rainfall Surge",
    badge: "METEOROLOGY",
    role: "Telemetry Layer",
    description:
      "Precipitation surges to 58 mm/hr. The explainable risk engine recalculates Ward 101 and Ward 102 risk indices into CRITICAL status.",
    actionPrompt: "Witness citizen report incoming from flood-affected road.",
  },
  {
    step: 3,
    title: "3. Citizen Submits Flood Report",
    badge: "CITIZEN SUBMISSION",
    role: "Citizen Portal",
    description:
      "Citizen Arun Kumar submits report RPT-DEMO-999 with photo and GPS location outside Metropolitan Hospital showing waist-deep water.",
    actionPrompt: "Switch to Authority Command to review and verify report.",
  },
  {
    step: 4,
    title: "4. Authority Verifies & Dispatches Task",
    badge: "INCIDENT DISPATCH",
    role: "Authority Command",
    description:
      "Chief Disaster Officer verifies report, auto-spawns Incident INC-DEMO-777, and dispatches emergency inspection task TSK-DEMO-555 to Field Worker Rajesh.",
    actionPrompt: "Switch to Field Worker Terminal to upload inspection evidence.",
  },
  {
    step: 5,
    title: "5. Field Worker Evidence & Road Closure",
    badge: "FIELD VERIFICATION",
    role: "Field Worker Terminal",
    description:
      "Rajesh confirms 80cm flood depth with photo. Authority marks Central Hospital Link Way as CLOSED. Metropolitan Hospital accessibility auto-updates to AFFECTED!",
    actionPrompt: "Calculate safe detour route avoiding the closed corridor.",
  },
  {
    step: 6,
    title: "6. Flood-Aware Safe Route Recomputation",
    badge: "DECISION COMPLETE",
    role: "Safe Routing Engine",
    description:
      "The NetworkX routing engine eliminates the flooded road and recommends a safe detour via the elevated Ring Road corridor. Operational loop verified!",
    actionPrompt: "Demo scenario complete! Reset or restart anytime.",
  },
];

export const SihDemoWalkthrough = ({ onClose, onStepTriggered, onResetDemo }) => {
  const { addToast } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const step = DEMO_STEPS[currentStepIndex];

  const handleExecuteStep = async (stepNum) => {
    try {
      setLoading(true);
      const res = await api.triggerDemoStep(stepNum);
      addToast(`SIH Demo Step ${stepNum} Triggered: ${step.title}`, "success");

      if (stepNum === 6) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      if (onStepTriggered) {
        onStepTriggered(res);
      }
    } catch (err) {
      addToast("Failed to trigger demo step.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      handleExecuteStep(DEMO_STEPS[nextIdx].step);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      handleExecuteStep(DEMO_STEPS[prevIdx].step);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  SIH 2026 Judge Demonstration Tour
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Section 84
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-End Operational Lifecycle: Predict → Report → Verify → Respond → Route
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker Bar */}
        <div className="px-5 pt-4 pb-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => {
                setCurrentStepIndex(idx);
                handleExecuteStep(s.step);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center text-[10px] font-bold whitespace-nowrap transition-all ${
                idx === currentStepIndex
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30"
                  : idx < currentStepIndex
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-900 text-slate-500 hover:text-slate-300"
              }`}
            >
              Step {s.step}
            </button>
          ))}
        </div>

        {/* Step Detail Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {step.badge}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
              Role: {step.role}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white tracking-tight">{step.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
          </div>

          {/* Action Callout Box */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="text-xs text-amber-200">
              <span className="font-bold text-amber-300">Operational Effect: </span>
              {step.actionPrompt}
            </div>
            <button
              onClick={() => handleExecuteStep(step.step)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover-lift transition-all shrink-0 disabled:opacity-50"
            >
              {loading ? "Triggering..." : "Execute Step Now"}
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold hover-lift transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === DEMO_STEPS.length - 1 || loading}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-30 hover-lift shadow-md shadow-amber-500/20"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
