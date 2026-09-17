import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import {
  Compass,
  Crosshair,
  Globe,
  ShieldCheck
} from "lucide-react";

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createCustomIcon = (emoji, bgClass, pulse = false) => {
  return L.divIcon({
    className: "custom-pin",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${bgClass} text-white shadow-xl border-2 border-white/80 ${pulse ? 'animate-bounce' : ''}">
        ${pulse ? '<span class="absolute -inset-1 rounded-full bg-rose-500 opacity-60 animate-ping"></span>' : ''}
        <span class="text-xs font-bold leading-none">${emoji}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const userLocationIcon = L.divIcon({
  className: "user-location-pin",
  html: `
    <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white shadow-xl border-2 border-white ring-4 ring-blue-500/30 animate-pulse">
      <span class="w-2.5 h-2.5 rounded-full bg-white"></span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const originIcon = L.divIcon({
  className: "origin-pin",
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-2xl border-2 border-white ring-4 ring-emerald-500/30">
      <span class="text-xs font-black">A</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const destinationIcon = L.divIcon({
  className: "dest-pin",
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white shadow-2xl border-2 border-white ring-4 ring-rose-500/30">
      <span class="text-xs font-black">B</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const drainageLeakIcon = L.divIcon({
  className: "drainage-leak-pin",
  html: `
    <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-cyan-600 text-white shadow-xl border-2 border-white ring-2 ring-cyan-400/50 animate-pulse">
      <span class="text-xs">💧</span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const floodedHazardIcon = L.divIcon({
  className: "flooded-hazard-pin",
  html: `
    <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 text-white shadow-xl border-2 border-white ring-2 ring-rose-400/50">
      <span class="text-xs">🚫</span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const hospitalIcon = createCustomIcon("🏥", "bg-rose-600");
const fireIcon = createCustomIcon("🚒", "bg-orange-600");
const policeIcon = createCustomIcon("👮", "bg-blue-600");
const shelterIcon = createCustomIcon("⛺", "bg-emerald-600");
const schoolIcon = createCustomIcon("🏫", "bg-amber-600");
const reportIcon = createCustomIcon("⚠️", "bg-amber-500", true);
const drainAssetIcon = createCustomIcon("🚰", "bg-sky-600");

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom(), { animate: true, duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

function RouteBoundsController({ activeRoute, origin, destination }) {
  const map = useMap();
  useEffect(() => {
    if (activeRoute && activeRoute.route_geometry && activeRoute.route_geometry.length > 1) {
      try {
        const bounds = L.latLngBounds(activeRoute.route_geometry);
        if (origin?.lat && origin?.lng) bounds.extend([origin.lat, origin.lng]);
        if (destination?.lat && destination?.lng) bounds.extend([destination.lat, destination.lng]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
      } catch (err) {
        // ignore if coordinates invalid
      }
    }
  }, [activeRoute, origin, destination, map]);
  return null;
}

function MapClickHandler({ onMapClick, pickingMode, onPickLocation }) {
  useMapEvents({
    click(e) {
      if (pickingMode && onPickLocation) {
        onPickLocation(e.latlng, pickingMode);
      } else if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

export const MapView = ({
  wards = [],
  roads = [],
  facilities = [],
  reports = [],
  incidents = [],
  drainageAssets = [],
  activeRoute = null,
  origin = null,
  destination = null,
  pickingMode = null,
  onPickLocation = null,
  onSetOriginFromMap = null,
  onSetDestinationFromMap = null,
  userLocation = null,
  onSelectWard,
  onSelectRoad,
  onSelectReport,
  onMapClick,
  center = [13.0827, 80.2707],
  zoom = 13,
  height = "520px",
  showControls = true
}) => {
  const [mapStyle, setMapStyle] = useState("streets");
  const [clickedPoint, setClickedPoint] = useState(null);

  const [layers, setLayers] = useState({
    floodRisk: true,
    roads: true,
    facilities: true,
    drainage: true,
    reports: true,
    hazards: true
  });

  const tileUrls = {
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics',
    },
  };

  const getWardColor = (level) => {
    switch (level) {
      case "CRITICAL": return "#ef4444";
      case "HIGH": return "#f97316";
      case "MODERATE": return "#eab308";
      default: return "#10b981";
    }
  };

  const getRoadColor = (status) => {
    switch (status) {
      case "CLOSED": return "#ef4444";
      case "FLOODED": return "#0284c7";
      case "AT_RISK": return "#f59e0b";
      default: return "#10b981";
    }
  };

  const getFacilityIcon = (type) => {
    switch (type) {
      case "HOSPITAL": return hospitalIcon;
      case "FIRE_STATION": return fireIcon;
      case "POLICE_STATION": return policeIcon;
      case "SHELTER": return shelterIcon;
      case "SCHOOL": return schoolIcon;
      default: return hospitalIcon;
    }
  };

  const handleInternalMapClick = (latlng) => {
    setClickedPoint({
      lat: parseFloat(latlng.lat.toFixed(4)),
      lng: parseFloat(latlng.lng.toFixed(4))
    });
    if (onMapClick) {
      onMapClick(latlng);
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 ${
        pickingMode ? "ring-2 ring-amber-500 cursor-crosshair" : ""
      }`}
      style={{ height }}
    >
      {/* Top Left: Street / Satellite Toggle */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1 p-1 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg text-xs">
        <button
          onClick={() => setMapStyle("streets")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            mapStyle === "streets"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Street Map</span>
        </button>
        <button
          onClick={() => setMapStyle("satellite")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            mapStyle === "satellite"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Satellite View</span>
        </button>
      </div>

      {/* Picking Mode Floating Banner */}
      {pickingMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-3 px-4 py-2.5 bg-slate-950/95 backdrop-blur-md rounded-xl border border-amber-500 shadow-2xl text-xs animate-bounce">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Crosshair className="w-4 h-4 animate-spin" />
            <span>
              {pickingMode === "origin"
                ? "📍 Click anywhere on map to set Current Location"
                : "🎯 Click anywhere on map to set Destination"}
            </span>
          </div>
          <button
            onClick={() => onPickLocation && onPickLocation(null, null)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Top Right: Layer Toggles */}
      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] bg-slate-950/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-lg text-xs text-slate-300 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={layers.roads}
              onChange={() => setLayers((p) => ({ ...p, roads: !p.roads }))}
              className="rounded bg-slate-800 border-slate-700 text-brand-500 focus:ring-0"
            />
            <span>Roads</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={layers.drainage}
              onChange={() => setLayers((p) => ({ ...p, drainage: !p.drainage }))}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Drainage</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={layers.facilities}
              onChange={() => setLayers((p) => ({ ...p, facilities: !p.facilities }))}
              className="rounded bg-slate-800 border-slate-700 text-brand-500 focus:ring-0"
            />
            <span>Shelters/Hospitals</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={layers.reports}
              onChange={() => setLayers((p) => ({ ...p, reports: !p.reports }))}
              className="rounded bg-slate-800 border-slate-700 text-brand-500 focus:ring-0"
            />
            <span>Live Reports</span>
          </label>
        </div>
      )}

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg text-[10px] text-slate-300 flex items-center gap-3">
        <span className="font-bold text-white">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Start
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Destination
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-1 bg-sky-400 rounded" /> Safe Route
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-1 bg-rose-500 rounded" /> Flooded
        </span>
        <span className="flex items-center gap-1">
          <span>💧</span> Drain Leak
        </span>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: "#0b1120" }}
      >
        <TileLayer
          url={tileUrls[mapStyle].url}
          attribution={tileUrls[mapStyle].attribution}
          maxZoom={19}
        />

        <MapController center={center} zoom={zoom} />
        <RouteBoundsController activeRoute={activeRoute} origin={origin} destination={destination} />
        <MapClickHandler
          onMapClick={handleInternalMapClick}
          pickingMode={pickingMode}
          onPickLocation={onPickLocation}
        />

        {/* 1. Ward Risk Polygons */}
        {layers.floodRisk &&
          wards.map((w) => {
            if (!w.boundary_geojson) return null;
            let coords;
            try {
              coords = JSON.parse(w.boundary_geojson);
            } catch (e) {
              return null;
            }
            const color = getWardColor(w.current_risk_level);
            return (
              <Polygon
                key={`ward-${w.id}`}
                positions={coords}
                pathOptions={{
                  color: color,
                  weight: 2,
                  fillColor: color,
                  fillOpacity: w.current_risk_level === "CRITICAL" ? 0.35 : 0.15,
                }}
                eventHandlers={{
                  click: () => onSelectWard && onSelectWard(w),
                }}
              >
                <Popup>
                  <div className="p-1.5 space-y-1.5 text-xs text-slate-100 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <strong className="text-white font-bold">{w.name}</strong>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: `${color}33`, color: color }}
                      >
                        {w.current_risk_level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <div>Flood Hazard Score: <strong className="text-white">{w.current_risk_score} / 100</strong></div>
                      <div>Elevation: {w.elevation_meters}m | Drainage: {w.drainage_capacity_pct}%</div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {/* 2. Road Network Polylines */}
        {layers.roads &&
          roads.map((r) => {
            if (!r.coordinates || r.coordinates.length < 2) return null;
            const color = getRoadColor(r.status);
            return (
              <Polyline
                key={`r-${r.id}`}
                positions={r.coordinates}
                pathOptions={{
                  color: color,
                  weight: r.status === "CLOSED" || r.status === "FLOODED" ? 6 : 4,
                  opacity: 0.85,
                }}
                eventHandlers={{
                  click: () => onSelectRoad && onSelectRoad(r),
                }}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1 min-w-[170px]">
                    <div className="font-bold text-white">{r.road_name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Status:</span>
                      <span
                        className="font-bold uppercase px-1.5 py-0.5 rounded text-[10px]"
                        style={{ backgroundColor: `${color}33`, color: color }}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">Flood Inundation Risk: {r.flood_risk}%</div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* 3. Drainage Assets Layer */}
        {layers.drainage &&
          drainageAssets.map((d) => (
            <Marker
              key={`drain-${d.id}`}
              position={[d.latitude, d.longitude]}
              icon={d.condition === "POOR" || d.condition === "INSPECTION_REQUIRED" ? drainageLeakIcon : drainAssetIcon}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs min-w-[180px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <span className="font-bold text-cyan-400">{d.asset_code}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        d.condition === "GOOD" ? "bg-emerald-500/20 text-emerald-400" :
                        d.condition === "FAIR" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {d.condition}
                    </span>
                  </div>
                  <div className="text-white font-medium">{d.asset_type}</div>
                  <div className="text-[10px] text-slate-300">Capacity: {d.capacity}</div>
                  <div className="text-[10px] text-slate-400">{d.location}</div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 4. Active Safe Route Detour Line (Dual layer for vivid clarity) */}
        {activeRoute && activeRoute.route_geometry && (
          <>
            <Polyline
              positions={activeRoute.route_geometry}
              pathOptions={{
                color: "#1e3a8a",
                weight: 10,
                opacity: 0.85,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={activeRoute.route_geometry}
              pathOptions={{
                color: "#38bdf8",
                weight: 5,
                opacity: 1.0,
                dashArray: "10, 8",
                lineCap: "round",
                lineJoin: "round",
              }}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-bold text-sky-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Safest Lower-Risk Detour</span>
                  </div>
                  <div>Distance: <strong className="text-white">{activeRoute.distance_km} km</strong></div>
                  <div>Est. Travel: <strong className="text-white">{activeRoute.estimated_time_minutes} mins</strong></div>
                  <div className="text-emerald-400 font-semibold">{activeRoute.flood_avoidance_rating}</div>
                </div>
              </Popup>
            </Polyline>
          </>
        )}

        {/* 5. Avoided Hazard Markers (Shows why the route bypassed them) */}
        {activeRoute?.avoided_hazards &&
          activeRoute.avoided_hazards.map((h, idx) => (
            <Marker
              key={`av-haz-${idx}`}
              position={[h.latitude, h.longitude]}
              icon={h.hazard_type === "DRAINAGE_LEAKAGE" ? drainageLeakIcon : floodedHazardIcon}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs min-w-[190px]">
                  <div className="flex items-center gap-1 font-bold text-white border-b border-slate-700 pb-1">
                    <span>{h.hazard_type === "DRAINAGE_LEAKAGE" ? "💧" : "🚫"}</span>
                    <span className={h.hazard_type === "DRAINAGE_LEAKAGE" ? "text-cyan-400" : "text-rose-400"}>
                      {h.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">{h.description}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold pt-1">
                    ✓ Avoided by dynamic safe routing
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 6. Origin Marker (A) */}
        {origin && origin.lat && origin.lng && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <span>📍 Start / Origin</span>
                </div>
                <div className="text-white font-medium">{origin.name || "Selected Location"}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 7. Destination Marker (B) */}
        {destination && destination.lat && destination.lng && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <div className="font-bold text-rose-400 flex items-center gap-1">
                  <span>🎯 Destination</span>
                </div>
                <div className="text-white font-medium">{destination.name || "Selected Destination"}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 8. User Current Location Pin (if GPS active and different from origin) */}
        {userLocation && (!origin || Math.abs(userLocation.lat - origin.lat) > 0.0005) && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <strong className="text-blue-400">Your Detected Location (GPS)</strong>
                <div className="text-[10px] font-mono text-slate-400">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 9. Clicked Point on Map Context Popup */}
        {clickedPoint && (
          <Popup position={[clickedPoint.lat, clickedPoint.lng]}>
            <div className="p-2 space-y-2 text-xs min-w-[200px]">
              <div className="font-bold text-white border-b border-slate-700 pb-1">
                Selected Map Coordinates
              </div>
              <div className="font-mono text-slate-300 text-[11px]">
                {clickedPoint.lat}, {clickedPoint.lng}
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1">
                {onSetOriginFromMap && (
                  <button
                    onClick={() => {
                      onSetOriginFromMap({
                        name: `Map Point (${clickedPoint.lat}, ${clickedPoint.lng})`,
                        lat: clickedPoint.lat,
                        lng: clickedPoint.lng
                      });
                      setClickedPoint(null);
                    }}
                    className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                  >
                    📍 Set as Start
                  </button>
                )}
                {onSetDestinationFromMap && (
                  <button
                    onClick={() => {
                      onSetDestinationFromMap({
                        name: `Map Point (${clickedPoint.lat}, ${clickedPoint.lng})`,
                        lat: clickedPoint.lat,
                        lng: clickedPoint.lng
                      });
                      setClickedPoint(null);
                    }}
                    className="p-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                  >
                    🎯 Set as Dest
                  </button>
                )}
              </div>
            </div>
          </Popup>
        )}

        {/* 10. Critical Facilities */}
        {layers.facilities &&
          facilities.map((f) => (
            <Marker
              key={`fac-${f.id}`}
              position={[f.latitude, f.longitude]}
              icon={getFacilityIcon(f.facility_type)}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs min-w-[190px]">
                  <div className="font-bold text-white">{f.name}</div>
                  <div className="text-[10px] text-slate-400">{f.facility_type} • {f.address}</div>
                  <div className="mt-1 pt-1 border-t border-slate-700 flex justify-between">
                    <span>Access:</span>
                    <span
                      className={`font-bold uppercase text-[10px] ${
                        f.accessibility_status === "ACCESSIBLE"
                          ? "text-emerald-400"
                          : f.accessibility_status === "AT_RISK"
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {f.accessibility_status}
                    </span>
                  </div>
                  {onSetDestinationFromMap && (
                    <button
                      onClick={() => {
                        onSetDestinationFromMap({
                          name: `${f.name} (${f.facility_type})`,
                          lat: f.latitude,
                          lng: f.longitude,
                          type: f.facility_type
                        });
                      }}
                      className="w-full mt-1.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                    >
                      🎯 Navigate Here
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 11. Citizen Reports */}
        {layers.reports &&
          reports.map((rpt) => (
            <Marker
              key={`rpt-${rpt.id}`}
              position={[rpt.latitude, rpt.longitude]}
              icon={reportIcon}
              eventHandlers={{
                click: () => onSelectReport && onSelectReport(rpt),
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs min-w-[180px]">
                  <div className="font-bold text-amber-400">{rpt.report_code}</div>
                  <div className="text-slate-200">{rpt.description}</div>
                  <div className="text-[10px] text-slate-400">
                    Depth: <strong className="text-white">{rpt.reported_water_level}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};
