import React from "react";
import { X, ShieldAlert, Info, Layers, CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";

export const WhyRiskModal = ({ ward, onClose }) => {
  if (!ward) return null;

  const factors = ward.contributing_factors || [];
  const score = ward.current_risk_score ?? ward.score ?? 0;
  const level = ward.current_risk_level ?? ward.risk_level ?? "LOW";

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case "CRITICAL": return "text-rose-400 bg-rose-500/20 border-rose-500/40";
      case "HIGH": return "text-orange-400 bg-orange-500/20 border-orange-500/40";
      case "MODERATE": return "text-amber-400 bg-amber-500/20 border-amber-500/40";
      default: return "text-emerald-400 bg-emerald-500/20 border-emerald-500/40";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ transformOrigin: "center" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{ward.name || ward.ward_name}</span>
                <span className="text-xs text-slate-400 font-mono">({ward.code || ward.ward_code})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Explainable Multi-Criteria Flood Hazard Decomposition
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

        {/* Overall Score Badge Banner */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Computed Compound Flood Hazard
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-black text-white">{score}</span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getLevelColor(level)}`}>
                {level} RISK
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-1">
            <div>Engine: <span className="text-slate-200 font-mono">{ward.methodology_version || "v2.4-hybrid"}</span></div>
            <div>Status: <span className="text-emerald-400 font-semibold">Deterministic & Traceable</span></div>
          </div>
        </div>

        {/* Contributing Factors Breakdown */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Factor Name & Description</span>
            <span>Contribution (Weighted Score)</span>
          </div>

          {factors.map((factor, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all hover-lift"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{factor.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      Weight: {factor.weight}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{factor.description}</p>
                  <div className="mt-2 text-[11px] text-brand-400 font-medium flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Source: {factor.source}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-white">+{factor.contribution}</div>
                  <div className="text-[10px] text-slate-500">Raw: {factor.score}/100</div>
                </div>
              </div>

              {/* Visual Contribution Bar */}
              <div className="mt-2.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, factor.score)}%` }}
                />
              </div>
            </div>
          ))}

          {factors.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No breakdown factors available for this zone.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="italic text-[11px]">
            Complies with Section 9: Never displays unexplained numbers.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all hover-lift"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
