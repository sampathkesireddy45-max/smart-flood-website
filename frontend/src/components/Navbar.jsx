import React, { useState } from "react";
import {
  ShieldAlert,
  CloudRain,
  MapPin,
  Search,
  Sliders,
  Award,
  RotateCcw,
  Compass,
  AlertTriangle,
  BarChart3,
  Crosshair,
  Truck,
  History
} from "lucide-react";

export const Navbar = ({
  activeTab,
  setActiveTab,
  weather,
  cityName,
  onSearchCity,
  onUseMyLocation,
  onOpenSimulator,
  onOpenDemoTour,
  onResetDemo,
  isDemoResetting
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchCity(searchInput.trim());
    }
  };

  const QUICK_CITIES = ["Chennai", "Mumbai", "Bengaluru", "Delhi", "Kolkata"];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Top Bar: Brand, Search, Location & Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base lg:text-lg font-bold tracking-tight text-white">
                    SURAKSHA-FLOOD
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Real-Time Urban Flood Monitoring & Decision Support System
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                onClick={onOpenDemoTour}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Tour
              </button>
            </div>
          </div>

          {/* Center: Search City & Exact Location */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search city (e.g. Chennai, Mumbai)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </form>

            <button
              type="button"
              onClick={onUseMyLocation}
              title="Locate my exact current coordinates"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-emerald-400 text-xs font-semibold whitespace-nowrap hover-lift transition-all"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Location</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {weather && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <CloudRain className="w-4 h-4 text-brand-400 animate-bounce" />
                <div className="text-left">
                  <span className="font-bold text-white">{weather.rainfall_rate} mm/hr</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">{weather.description}</span>
                </div>
              </div>
            )}

            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-brand-500/40 text-brand-300 hover:bg-brand-500/10 text-xs font-semibold hover-lift transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-brand-400" />
              <span>Simulator</span>
            </button>

            <button
              onClick={onOpenDemoTour}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover-lift transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Judge Tour</span>
            </button>

            <button
              onClick={onResetDemo}
              disabled={isDemoResetting}
              title="Reset baseline demo data"
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isDemoResetting ? "animate-spin text-brand-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Bottom Bar: Multi-Role Dashboard Navigation (5 views) */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 overflow-x-auto">
          <nav className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "map"
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Live Map & Safe Route</span>
            </button>

            <button
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "report"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Citizen Portal</span>
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "dashboard"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Authority Command</span>
            </button>

            <button
              onClick={() => setActiveTab("fieldworker")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "fieldworker"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Field Responder</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "analytics"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Analytics & Audit</span>
            </button>
          </nav>

          {/* Quick city presets */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Quick:</span>
            {QUICK_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => onSearchCity(c)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
