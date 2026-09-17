import React, { useState, useEffect } from "react";
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Route as RouteIcon,
  Crosshair,
  Droplets,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "./Toast";

const DEFAULT_PRESETS = [
  { name: "Harbour South Residential Sector", lat: 13.0815, lng: 80.2850, type: "NEIGHBORHOOD" },
  { name: "Anna Central Metro Station", lat: 13.0820, lng: 80.2650, type: "TRANSIT" },
  { name: "Government General Metropolitan Hospital", lat: 13.0835, lng: 80.2690, type: "HOSPITAL" },
  { name: "Adyar River Bridge Causeway", lat: 13.0680, lng: 80.2590, type: "LANDMARK" },
  { name: "Highland Civic Emergency Shelter", lat: 13.0995, lng: 80.2560, type: "SHELTER" },
  { name: "Tech Corridor South Ridge", lat: 13.0580, lng: 80.2350, type: "NEIGHBORHOOD" },
];

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const RouteFinder = ({
  onRouteCalculated,
  currentRoute,
  facilities = [],
  userLocation = null,
  origin = null,
  destination = null,
  onChangeOrigin,
  onChangeDestination,
  pickingMode = null,
  setPickingMode,
  onClearRoute
}) => {
  const { addToast } = useToast();

  // Internal location state if not controlled externally
  const [origLoc, setOrigLoc] = useState(
    origin || (userLocation ? { ...userLocation, name: "My Current Location (GPS)" } : DEFAULT_PRESETS[0])
  );
  const [destLoc, setDestLoc] = useState(
    destination || DEFAULT_PRESETS[2] // Default to Metropolitan Hospital
  );

  const [mode, setMode] = useState("citizen");
  const [avoidFlooded, setAvoidFlooded] = useState(true);
  const [avoidDrainageLeakage, setAvoidDrainageLeakage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);

  // Synchronize when external origin/destination changes (e.g. from map click)
  useEffect(() => {
    if (origin) {
      setOrigLoc(origin);
    }
  }, [origin]);

  useEffect(() => {
    if (destination) {
      setDestLoc(destination);
    }
  }, [destination]);

  // Synchronize with user GPS when detected
  useEffect(() => {
    if (userLocation && (!origLoc || origLoc.name === "Harbour South Residential Sector")) {
      const gpsLoc = {
        name: "My Current Location (GPS)",
        lat: userLocation.lat,
        lng: userLocation.lng,
      };
      setOrigLoc(gpsLoc);
      if (onChangeOrigin) onChangeOrigin(gpsLoc);
    }
  }, [userLocation]);

  // Auto-adapt destination if current destination is a default preset in another city (> 60km away)
  useEffect(() => {
    if (!origLoc) return;
    const isDestFarDefault =
      destLoc &&
      DEFAULT_PRESETS.some((p) => p.name === destLoc.name) &&
      haversineKm(origLoc.lat, origLoc.lng, destLoc.lat, destLoc.lng) > 60;

    if (isDestFarDefault || !destLoc) {
      if (facilities && facilities.length > 0) {
        // Find closest facility within 50km
        const nearby = facilities
          .map((f) => ({
            ...f,
            distKm: haversineKm(origLoc.lat, origLoc.lng, f.latitude, f.longitude),
          }))
          .filter((f) => f.distKm < 50)
          .sort((a, b) => a.distKm - b.distKm);

        if (nearby.length > 0) {
          const best = nearby.find((f) => f.facility_type === "HOSPITAL") || nearby[0];
          updateDestination({
            name: `${best.name} (${best.facility_type})`,
            lat: best.latitude,
            lng: best.longitude,
            type: best.facility_type,
          });
          return;
        }
      }

      // If no close facilities found and origin is far from Chennai, create local safe assembly zone
      if (haversineKm(origLoc.lat, origLoc.lng, 13.0827, 80.2707) > 60) {
        updateDestination({
          name: "Local Emergency Safe Zone / Shelter",
          lat: parseFloat((origLoc.lat + 0.025).toFixed(4)),
          lng: parseFloat((origLoc.lng + 0.02).toFixed(4)),
          type: "SHELTER",
        });
      }
    }
  }, [origLoc, facilities]);

  const updateOrigin = (loc) => {
    setOrigLoc(loc);
    if (onChangeOrigin) onChangeOrigin(loc);
  };

  const updateDestination = (loc) => {
    setDestLoc(loc);
    if (onChangeDestination) onChangeDestination(loc);
  };

  const handleUseGpsAsOrigin = () => {
    if (userLocation) {
      const loc = {
        name: "My Current Location (GPS)",
        lat: userLocation.lat,
        lng: userLocation.lng,
      };
      updateOrigin(loc);
      addToast("📍 Origin set to your detected GPS location.", "success");
      return;
    }

    if (navigator.geolocation) {
      addToast("Fetching current GPS coordinates...", "info");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            name: "My Current Location (GPS)",
            lat: parseFloat(pos.coords.latitude.toFixed(4)),
            lng: parseFloat(pos.coords.longitude.toFixed(4)),
          };
          updateOrigin(loc);
          addToast("📍 Origin locked to GPS location.", "success");
        },
        () => {
          addToast("GPS access unavailable. Centered on Metro Harbour.", "warning");
        },
        { timeout: 6000 }
      );
    }
  };

  const handleSwap = () => {
    const temp = { ...origLoc };
    updateOrigin(destLoc);
    updateDestination(temp);
    addToast("Origin and Destination swapped.", "info");
  };

  const handleCalculateRoute = async () => {
    if (!origLoc || !destLoc) {
      addToast("Please select both origin and destination.", "warning");
      return;
    }

    if (
      Math.abs(origLoc.lat - destLoc.lat) < 0.0001 &&
      Math.abs(origLoc.lng - destLoc.lng) < 0.0001
    ) {
      addToast("Origin and Destination cannot be at the same location.", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await api.calculateRoute({
        origin_lat: origLoc.lat,
        origin_lng: origLoc.lng,
        dest_lat: destLoc.lat,
        dest_lng: destLoc.lng,
        avoid_floods: avoidFlooded,
        avoid_drainage_leakage: avoidDrainageLeakage,
        mode: mode,
        origin_name: origLoc.name,
        dest_name: destLoc.name
      });

      if (onRouteCalculated) {
        onRouteCalculated(res);
      }

      const avoidedSummary = [];
      if (res.avoided_roads?.length) avoidedSummary.push(`${res.avoided_roads.length} flooded roads`);
      if (res.avoided_drainage_leakages?.length) avoidedSummary.push(`${res.avoided_drainage_leakages.length} drainage leaks`);

      const summaryText = avoidedSummary.length > 0 
        ? `Safely bypassed ${avoidedSummary.join(" & ")}!`
        : "Safest flood-aware route computed.";

      addToast(summaryText, "success");
    } catch (err) {
      console.error("Route calculation error:", err);
      addToast("Failed to compute routing path. Using resilient corridor fallback.", "error");
    } finally {
      setLoading(false);
    }
  };

  const nearbyFacilities = facilities
    .filter((f) => origLoc && haversineKm(origLoc.lat, origLoc.lng, f.latitude, f.longitude) <= 45)
    .map((f) => ({
      ...f,
      distKm: haversineKm(origLoc.lat, origLoc.lng, f.latitude, f.longitude),
    }))
    .sort((a, b) => a.distKm - b.distKm);

  const otherFacilities = facilities.filter(
    (f) => !origLoc || haversineKm(origLoc.lat, origLoc.lng, f.latitude, f.longitude) > 45
  );

  // Compile list of available destination places
  const allDestinations = [
    ...DEFAULT_PRESETS,
    ...facilities.map((f) => ({
      name: `${f.name} (${f.facility_type})`,
      lat: f.latitude,
      lng: f.longitude,
      type: f.facility_type,
    })),
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Flood-Aware Safe Route Navigator</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                Live Engine
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Calculates safest route dynamically avoiding flooded roads & drainage leakage
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setMode("citizen")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === "citizen"
                ? "bg-brand-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Citizen
          </button>
          <button
            onClick={() => setMode("emergency")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === "emergency"
                ? "bg-rose-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Emergency
          </button>
        </div>
      </div>

      {/* Location Selection Form */}
      <div className="space-y-3">
        {/* 1. Origin / Current Location */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-850">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Origin / Current Location
            </label>

            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={handleUseGpsAsOrigin}
                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1 transition-all"
                title="Use browser GPS location"
              >
                <Crosshair className="w-3 h-3" />
                <span>My GPS</span>
              </button>

              {setPickingMode && (
                <button
                  type="button"
                  onClick={() => setPickingMode(pickingMode === "origin" ? null : "origin")}
                  className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition-all ${
                    pickingMode === "origin"
                      ? "bg-amber-500 text-slate-950 font-bold animate-pulse"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                  title="Click anywhere on the map to set origin"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{pickingMode === "origin" ? "Click Map..." : "Pick Map"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <select
              value={origLoc?.name || ""}
              onChange={(e) => {
                const found = DEFAULT_PRESETS.find((p) => p.name === e.target.value);
                if (found) updateOrigin(found);
              }}
              className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-brand-500"
            >
              {origLoc && (
                <option value={origLoc.name}>
                  📍 {origLoc.name} ({origLoc.lat.toFixed(4)}, {origLoc.lng.toFixed(4)})
                </option>
              )}
              <optgroup label="Popular Neighborhoods & Transit">
                {DEFAULT_PRESETS.map((p, idx) => (
                  <option key={idx} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1">
          <button
            type="button"
            onClick={handleSwap}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
            title="Swap Origin & Destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Destination Location */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-850">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Destination Location
            </label>

            {setPickingMode && (
              <button
                type="button"
                onClick={() => setPickingMode(pickingMode === "destination" ? null : "destination")}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
                  pickingMode === "destination"
                    ? "bg-rose-500 text-white font-bold animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
                title="Click anywhere on the map to set destination"
              >
                <MapPin className="w-3 h-3" />
                <span>{pickingMode === "destination" ? "Click Map..." : "Pick Map"}</span>
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={destLoc?.name || ""}
              onChange={(e) => {
                const found = allDestinations.find((p) => p.name === e.target.value);
                if (found) updateDestination(found);
              }}
              className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-brand-500"
            >
              {destLoc && !allDestinations.some((d) => d.name === destLoc.name) && (
                <option value={destLoc.name}>
                  🎯 {destLoc.name} ({destLoc.lat.toFixed(4)}, {destLoc.lng.toFixed(4)})
                </option>
              )}
              {nearbyFacilities.length > 0 && (
                <optgroup label="Local Emergency Facilities (< 45 km)">
                  {nearbyFacilities.map((f, i) => (
                    <option key={`fac-near-${i}`} value={`${f.name} (${f.facility_type})`}>
                      {f.facility_type === "HOSPITAL" ? "🏥" : f.facility_type === "SHELTER" ? "⛺" : "🏢"}{" "}
                      {f.name} ({f.distKm.toFixed(1)} km)
                    </option>
                  ))}
                </optgroup>
              )}
              {otherFacilities.length > 0 && (
                <optgroup label={nearbyFacilities.length > 0 ? "Other Regional Facilities" : "Critical Facilities & Hospitals"}>
                  {otherFacilities.map((f, i) => (
                    <option key={`fac-other-${i}`} value={`${f.name} (${f.facility_type})`}>
                      {f.facility_type === "HOSPITAL" ? "🏥" : f.facility_type === "SHELTER" ? "⛺" : "🏢"}{" "}
                      {f.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Regional Landmarks & Presets">
                {DEFAULT_PRESETS.map((p, idx) => (
                  <option key={`def-${idx}`} value={p.name}>
                    📍 {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Manual Coordinates Toggle */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowManualCoords(!showManualCoords)}
          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
        >
          <span>{showManualCoords ? "Hide" : "Fine-tune GPS coordinates manually"}</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>

        {showManualCoords && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-2 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-emerald-400 block mb-0.5">Origin Lat / Lng:</span>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    step="0.0001"
                    value={origLoc?.lat || ""}
                    onChange={(e) => updateOrigin({ ...origLoc, lat: parseFloat(e.target.value) })}
                    className="p-1 rounded bg-slate-900 border border-slate-800 font-mono text-white text-[10px]"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={origLoc?.lng || ""}
                    onChange={(e) => updateOrigin({ ...origLoc, lng: parseFloat(e.target.value) })}
                    className="p-1 rounded bg-slate-900 border border-slate-800 font-mono text-white text-[10px]"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-rose-400 block mb-0.5">Destination Lat / Lng:</span>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    step="0.0001"
                    value={destLoc?.lat || ""}
                    onChange={(e) => updateDestination({ ...destLoc, lat: parseFloat(e.target.value) })}
                    className="p-1 rounded bg-slate-900 border border-slate-800 font-mono text-white text-[10px]"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={destLoc?.lng || ""}
                    onChange={(e) => updateDestination({ ...destLoc, lng: parseFloat(e.target.value) })}
                    className="p-1 rounded bg-slate-900 border border-slate-800 font-mono text-white text-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Avoidance Preference Toggles */}
      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Hazard Avoidance Engine
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={avoidFlooded}
              onChange={(e) => setAvoidFlooded(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[11px] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Avoid Flooded Roads</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={avoidDrainageLeakage}
              onChange={(e) => setAvoidDrainageLeakage(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[11px] font-medium flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Avoid Drainage Leaks</span>
            </span>
          </label>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex gap-2">
        <button
          onClick={handleCalculateRoute}
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-blue-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs shadow-lg shadow-brand-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <RouteIcon className="w-4 h-4" />
          <span>{loading ? "Analyzing Hazard Corridors..." : "Calculate Safest Route"}</span>
        </button>

        {currentRoute && onClearRoute && (
          <button
            onClick={onClearRoute}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs"
            title="Clear current route"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Route Results Panel */}
      {currentRoute && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5 animate-fade-in shadow-2xl">
          {/* Header & Safety Rating */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">
                  {currentRoute.flood_avoidance_rating || "Safe Detour"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {currentRoute.safety_label}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-slate-300">
                Est. Time:{" "}
                <strong className="text-white text-sm">
                  {currentRoute.estimated_time_minutes >= 60
                    ? `${Math.floor(currentRoute.estimated_time_minutes / 60)}h ${currentRoute.estimated_time_minutes % 60}m`
                    : `${currentRoute.estimated_time_minutes} min`}
                </strong>
              </div>
              <div className="text-[10px] text-slate-400">{currentRoute.distance_km} km total</div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">
                {currentRoute.is_detour_active ? "Safe Detour Delta" : "Route Distance"}
              </span>
              <div className="font-bold text-white mt-0.5">
                {currentRoute.is_detour_active
                  ? `+${currentRoute.detour_delta_km || 0} km`
                  : `${currentRoute.distance_km} km`}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Floods Bypassed</span>
              <div className={`font-bold mt-0.5 ${currentRoute.avoided_roads?.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {currentRoute.avoided_roads?.length || 0}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Drain Leaks Avoided</span>
              <div className={`font-bold mt-0.5 ${currentRoute.avoided_drainage_leakages?.length > 0 ? "text-cyan-400" : "text-emerald-400"}`}>
                {currentRoute.avoided_drainage_leakages?.length || 0}
              </div>
            </div>
          </div>

          {/* Avoided Flood Roads List */}
          {currentRoute.avoided_roads && currentRoute.avoided_roads.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Bypassed Flooded & Closed Corridors</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentRoute.avoided_roads.map((road, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium"
                  >
                    🚫 {road}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Avoided Drainage Leakage List */}
          {currentRoute.avoided_drainage_leakages && currentRoute.avoided_drainage_leakages.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                <span>Avoided Drainage Leakage & Silt Blockages</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentRoute.avoided_drainage_leakages.map((drain, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-medium"
                  >
                    💧 {drain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Traversed Real Streets List */}
          {currentRoute.traversed_roads && currentRoute.traversed_roads.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Real Streets & Arterials Traversed ({currentRoute.traversed_roads.length})</span>
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {currentRoute.traversed_roads.slice(0, 8).map((r, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-medium"
                  >
                    ✓ {r.road_name} ({r.distance_meters > 1000 ? `${(r.distance_meters / 1000).toFixed(1)} km` : `${Math.round(r.distance_meters)} m`})
                  </span>
                ))}
                {currentRoute.traversed_roads.length > 8 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{currentRoute.traversed_roads.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Advisory Warnings */}
          {currentRoute.warnings && currentRoute.warnings.length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-slate-850">
              {currentRoute.warnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-300/90 leading-tight">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
