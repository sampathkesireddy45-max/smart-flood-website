import React, { useState } from "react";
import { X, Sliders, Play, RotateCcw, AlertTriangle, CloudRain, Clock, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "./Toast";

export const WhatIfSimulator = ({ wards = [], onClose, onSimulationComplete }) => {
  const { addToast } = useToast();
  const [rainfallRate, setRainfallRate] = useState(45); // mm/hr
  const [durationHours, setDurationHours] = useState(3.0); // hours
  const [selectedWardId, setSelectedWardId] = useState("");
  const [clogFactor, setClogFactor] = useState(0.2); // 20%
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const handleRunSimulation = async () => {
    try {
      setLoading(true);
      const res = await api.runSimulation({
        rainfall_rate: parseFloat(rainfallRate),
        rainfall_duration_hours: parseFloat(durationHours),
        selected_ward_id: selectedWardId ? parseInt(selectedWardId) : null,
        drainage_clog_factor: parseFloat(clogFactor),
      });
      setSimulationResult(res);
      addToast("Scenario simulation completed successfully.", "info");
      if (onSimulationComplete) {
        onSimulationComplete(res);
      }
    } catch (err) {
      addToast("Error running simulation.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>What-If Flood Scenario Simulator</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Prototype Model
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Stress-test city infrastructure under hypothetical extreme weather scenarios
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

        {/* Notice Banner */}
        <div className="px-5 py-2.5 bg-amber-950/30 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Scenario simulation:</strong> Strictly decision-support exploration. Not represented as an actual meteorological forecast.
          </span>
        </div>

        {/* Controls and Sliders */}
        <div className="p-5 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Slider 1: Rainfall Intensity */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-brand-400" />
                  Hypothetical Rainfall Rate
                </span>
                <span className="font-mono font-bold text-brand-400 text-sm">{rainfallRate} mm/hr</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="5"
                value={rainfallRate}
                onChange={(e) => setRainfallRate(e.target.value)}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Light (10mm)</span>
                <span>Monsoon (45mm)</span>
                <span>Cloudburst (100mm+)</span>
              </div>
            </div>

            {/* Slider 2: Duration */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Rainfall Duration
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm">{durationHours} Hours</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="24"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 Hour</span>
                <span>4 Hours</span>
                <span>24 Hours</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ward Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Urban Ward</label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-brand-500"
              >
                <option value="">All Municipal Wards (City-Wide)</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 3: Drain Clogging */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">Drain Network Silt / Blockage Factor</label>
                <span className="text-rose-400 font-bold font-mono">{Math.round(clogFactor * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.8"
                step="0.1"
                value={clogFactor}
                onChange={(e) => setClogFactor(e.target.value)}
                className="w-full accent-rose-500 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs shadow-lg shadow-brand-500/25 hover-lift transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{loading ? "Computing Hazard Vectors..." : "Run Scenario Simulation"}</span>
            </button>
          </div>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-brand-500/30 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-brand-300 uppercase tracking-wide">
                  Simulation Projection Summary
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Total Simulated Precip: {simulationResult.input_parameters.total_simulated_precipitation_mm} mm
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Wards Evaluated</div>
                  <div className="text-xl font-bold text-white mt-0.5">{simulationResult.wards.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30">
                  <div className="text-[11px] text-rose-300">Est. Roads Inundated</div>
                  <div className="text-xl font-bold text-rose-400 mt-0.5">{simulationResult.estimated_affected_roads}</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30">
                  <div className="text-[11px] text-amber-300">Critical Facilities at Risk</div>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">{simulationResult.estimated_facilities_at_risk}</div>
                </div>
              </div>

              {/* Ward Risk Delta Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Ward Vulnerability Shifts:</span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {simulationResult.wards.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{w.ward_name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({w.ward_code})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">
                          {w.baseline_score} → <strong className="text-white">{w.simulated_score}</strong>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          w.simulated_risk_level === "CRITICAL" ? "bg-rose-500/20 text-rose-400" :
                          w.simulated_risk_level === "HIGH" ? "bg-orange-500/20 text-orange-400" : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {w.simulated_risk_level} (+{w.delta})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all hover-lift"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
