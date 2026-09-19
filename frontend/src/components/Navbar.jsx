import React, { useState } from "react";
import {
  ShieldAlert,
  CloudRain,
  MapPin,
  Search,
  Sliders,
  RotateCcw,
  Compass,
  AlertTriangle,
  Crosshair,
  LogOut,
  User,
  ShieldCheck,
  Users,
  UserCheck,
  BarChart3
} from "lucide-react";

export const Navbar = ({
  activeTab,
  setActiveTab,
  weather,
  cityName,
  onSearchCity,
  onUseMyLocation,
  onOpenSimulator,
  onResetDemo,
  isDemoResetting,
  currentUser,
  onLogout,
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchCity(searchInput.trim());
    }
  };

  const QUICK_CITIES = ["Chennai", "Mumbai", "Bengaluru", "Delhi", "Kolkata"];
  const isAuthority = currentUser?.role === "authority";

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Top Bar: Brand, Search, Location & Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/20 ${
                isAuthority
                  ? "bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-500/25"
                  : "bg-gradient-to-tr from-brand-600 to-blue-400 shadow-brand-500/25"
              }`}>
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base lg:text-lg font-bold tracking-tight text-white">
                    SURAKSHA-FLOOD
                  </h1>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isAuthority
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  }`}>
                    {isAuthority ? "Admin Terminal" : "Public Safety"}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Data
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Real-Time Urban Flood Monitoring & Decision Support System
                </p>
              </div>
            </div>

            {/* Mobile Actions: Logout */}
            <div className="flex items-center gap-1.5 lg:hidden">
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Log out & Switch Portal"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
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

          {/* Right Action Buttons & User Profile */}
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
              onClick={onResetDemo}
              disabled={isDemoResetting}
              title="Reset baseline demo data"
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isDemoResetting ? "animate-spin text-brand-400" : ""}`} />
            </button>

            {/* Authenticated User Badge & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                  isAuthority
                    ? "bg-purple-950/40 border-purple-800/60 text-purple-200"
                    : "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
                }`}>
                  {isAuthority ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <div className="text-left leading-tight">
                    <span className="font-bold block text-[11px]">
                      {isAuthority ? "Authority Admin" : "Citizen"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      +91 {currentUser.phone || "Verified"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout & Switch Portal"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Cleaned Dashboard Navigation (Field Responder & Audit Removed) */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 overflow-x-auto">
          <nav className="flex items-center gap-1.5 min-w-max">
            
            {/* For Municipal Authority Admin */}
            {isAuthority && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "dashboard"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Authority Command</span>
              </button>
            )}

            {/* Live Map & Safe Route (Available to both roles) */}
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

            {/* Citizen Reporting Portal / Hazard Oversight */}
            <button
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover-lift ${
                activeTab === "report"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isAuthority ? "Citizen Reports & Hazards" : "Citizen Portal"}</span>
            </button>

            {/* Field Responder & Ground Inspection Terminal (Authority only) */}
            {isAuthority && (
              <button
                onClick={() => setActiveTab("field")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover-lift ${
                  activeTab === "field"
                    ? "bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Field Terminal</span>
              </button>
            )}

            {/* Historical Analytics & Audit Trail */}
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover-lift ${
                activeTab === "analytics"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isAuthority ? "Audit & Analytics" : "Flood Analytics"}</span>
            </button>
          </nav>

          {/* Quick city presets */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Live Cities:</span>
            {QUICK_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => onSearchCity(c)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors font-medium"
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
