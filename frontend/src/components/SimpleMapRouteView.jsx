import React, { useState, useEffect } from "react";
import { MapView } from "./MapView";
import { RouteFinder } from "./RouteFinder";
import { LiveRainForecast } from "./LiveRainForecast";
import { MapPin, AlertCircle, ShieldCheck, Navigation, Crosshair, Droplets } from "lucide-react";
import { useToast } from "./Toast";

export const SimpleMapRouteView = ({
  wards = [],
  roads = [],
  facilities = [],
  reports = [],
  incidents = [],
  drainageAssets = [],
  center,
  zoom,
  userLocation,
  cityName,
  targetDestination,
  onUseMyLocation,
  onSelectWard,
  onSelectRoad,
  onReportAtLocation
}) => {
  const { addToast } = useToast();
  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedMapPoint, setSelectedMapPoint] = useState(null);
  
  // Safe Route Origin & Destination State
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [pickingMode, setPickingMode] = useState(null); // "origin" | "destination" | null

  // Initialize origin to user GPS if detected
  useEffect(() => {
    if (userLocation && !origin) {
      setOrigin({
        name: "My Current Location (GPS)",
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
    }
  }, [userLocation]);

  // Handle external destination targeting (e.g. field task coordinates)
  useEffect(() => {
    if (targetDestination) {
      setDestination(targetDestination);
    }
  }, [targetDestination]);

  // Initialize destination to first hospital or prominent shelter
  useEffect(() => {
    if (facilities.length > 0 && !destination && !targetDestination) {
      const hospital = facilities.find((f) => f.facility_type === "HOSPITAL") || facilities[0];
      setDestination({
        name: `${hospital.name} (${hospital.facility_type})`,
        lat: hospital.latitude,
        lng: hospital.longitude,
        type: hospital.facility_type,
      });
    }
  }, [facilities, targetDestination]);

  const handleMapClick = (latlng) => {
    setSelectedMapPoint({
      lat: parseFloat(latlng.lat.toFixed(4)),
      lng: parseFloat(latlng.lng.toFixed(4)),
    });
  };

  const handlePickLocation = (latlng, mode) => {
    if (!latlng || !mode) {
      setPickingMode(null);
      return;
    }

    const loc = {
      name: mode === "origin" 
        ? `Selected Start (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`
        : `Selected Destination (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`,
      lat: parseFloat(latlng.lat.toFixed(4)),
      lng: parseFloat(latlng.lng.toFixed(4)),
    };

    if (mode === "origin") {
      setOrigin(loc);
      addToast(`📍 Current Location set to map point: ${loc.lat}, ${loc.lng}`, "success");
    } else {
      setDestination(loc);
      addToast(`🎯 Destination set to map point: ${loc.lat}, ${loc.lng}`, "success");
    }

    setPickingMode(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Real-World Live Weather & 12-Hour Rain Forecast Widget */}
      <LiveRainForecast
        userLocation={userLocation || { lat: center[0], lng: center[1] }}
        cityName={cityName}
        onRefreshLocation={onUseMyLocation}
      />

      {/* 2. Main Real-World GIS Map & Quick Route Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Real-World Interactive Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-400" />
                <span>Real-World Urban Flood Map ({cityName})</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Click map to select current location/destination, inspect flood risk, or report hazards
              </p>
            </div>

            {selectedMapPoint && (
              <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg">
                <span className="text-slate-400">Point:</span>
                <span className="font-mono text-white font-bold">
                  {selectedMapPoint.lat}, {selectedMapPoint.lng}
                </span>
                <button
                  onClick={() => {
                    setOrigin({
                      name: `Point (${selectedMapPoint.lat}, ${selectedMapPoint.lng})`,
                      lat: selectedMapPoint.lat,
                      lng: selectedMapPoint.lng
                    });
                    addToast("📍 Set as Start Location", "info");
                  }}
                  className="text-emerald-400 font-bold hover:underline ml-1"
                >
                  Set Start
                </button>
                <button
                  onClick={() => {
                    setDestination({
                      name: `Point (${selectedMapPoint.lat}, ${selectedMapPoint.lng})`,
                      lat: selectedMapPoint.lat,
                      lng: selectedMapPoint.lng
                    });
                    addToast("🎯 Set as Destination", "info");
                  }}
                  className="text-rose-400 font-bold hover:underline ml-1"
                >
                  Set Dest
                </button>
                <button
                  onClick={() => onReportAtLocation && onReportAtLocation(selectedMapPoint)}
                  className="text-amber-400 font-bold hover:underline ml-1"
                >
                  Report
                </button>
              </div>
            )}
          </div>

          <MapView
            wards={wards}
            roads={roads}
            facilities={facilities}
            reports={reports}
            incidents={incidents}
            drainageAssets={drainageAssets}
            activeRoute={activeRoute}
            origin={origin}
            destination={destination}
            pickingMode={pickingMode}
            onPickLocation={handlePickLocation}
            onSetOriginFromMap={(loc) => {
              setOrigin(loc);
              addToast("📍 Set as Start Location", "success");
            }}
            onSetDestinationFromMap={(loc) => {
              setDestination(loc);
              addToast("🎯 Set as Destination", "success");
            }}
            userLocation={userLocation}
            center={center}
            zoom={zoom}
            onMapClick={handleMapClick}
            onSelectWard={onSelectWard}
            onSelectRoad={onSelectRoad}
            height="580px"
          />
        </div>

        {/* Right 1 Col: Safe Route Navigator & Quick Summary */}
        <div className="space-y-4">
          <RouteFinder
            currentRoute={activeRoute}
            onRouteCalculated={(rt) => setActiveRoute(rt)}
            facilities={facilities}
            userLocation={userLocation}
            origin={origin}
            destination={destination}
            onChangeOrigin={(loc) => setOrigin(loc)}
            onChangeDestination={(loc) => setDestination(loc)}
            pickingMode={pickingMode}
            setPickingMode={(mode) => setPickingMode(mode)}
            onClearRoute={() => setActiveRoute(null)}
          />

          {/* Quick Real-Time Safety Highlights */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Area Safety & Infrastructure Highlights</span>
            </h4>
            <div className="text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Accessible Hospitals:</span>
                <span className="font-bold text-emerald-400">
                  {facilities.filter((f) => f.accessibility_status === "ACCESSIBLE").length} open
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Impassable / Flooded Roads:</span>
                <span className="font-bold text-rose-400">
                  {roads.filter((r) => r.status === "CLOSED" || r.status === "FLOODED").length} segments
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Drainage Assets Monitored:</span>
                <span className="font-bold text-cyan-400">
                  {drainageAssets.length || 4} active culverts/pumps
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verified Citizen Warnings:</span>
                <span className="font-bold text-amber-400">
                  {reports.filter((r) => r.verification_status === "VERIFIED").length} active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
