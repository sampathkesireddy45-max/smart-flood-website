import React, { useState, useEffect, useCallback } from "react";
import { ToastProvider, useToast } from "./components/Toast";
import { Navbar } from "./components/Navbar";
import { SimpleMapRouteView } from "./components/SimpleMapRouteView";
import { SimpleReportForm } from "./components/SimpleReportForm";
import { AuthorityDashboard } from "./pages/AuthorityDashboard";
import { FieldWorkerDashboard } from "./pages/FieldWorkerDashboard";
import { HistoricalAnalytics } from "./pages/HistoricalAnalytics";
import { WhyRiskModal } from "./components/WhyRiskModal";
import { WhatIfSimulator } from "./components/WhatIfSimulator";
import { SihDemoWalkthrough } from "./components/SihDemoWalkthrough";
import { api } from "./services/api";

function AppContent() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("map"); // "map" | "report" | "dashboard" | "fieldworker" | "analytics"
  const [targetDestination, setTargetDestination] = useState(null);
  
  // Real-World Location State
  const [cityName, setCityName] = useState("Chennai Metro Zone");
  const [center, setCenter] = useState([13.0827, 80.2707]);
  const [zoom, setZoom] = useState(13);
  const [userLocation, setUserLocation] = useState(null);

  // Operational Database State
  const [weather, setWeather] = useState(null);
  const [wards, setWards] = useState([]);
  const [roads, setRoads] = useState([]);
  const [reports, setReports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [drainageAssets, setDrainageAssets] = useState([]);
  const [kpis, setKpis] = useState(null);

  // Modals
  const [selectedWardForExplain, setSelectedWardForExplain] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [isDemoResetting, setIsDemoResetting] = useState(false);
  const [reportInitialLocation, setReportInitialLocation] = useState(null);

  // 1. Initial Geolocation Detection on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          setUserLocation({ lat, lng });
          setCenter([lat, lng]);
          setZoom(14);
          setCityName("Your Current Location");
          addToast("📍 Exact location locked via GPS.", "success");
        },
        (err) => {
          console.log("Geolocation permission not granted or timeout; using regional metro center.");
        },
        { timeout: 8000 }
      );
    }
  }, []);

  // 2. Load Operational Database Records
  const loadData = useCallback(async (customLat, customLng) => {
    try {
      const cLat = customLat !== undefined ? customLat : center[0];
      const cLng = customLng !== undefined ? customLng : center[1];
      const [wth, wrds, rds, rpts, facs, incs, smy, drains] = await Promise.all([
        api.getCurrentWeather(cLat, cLng),
        api.getRiskAreas(cLat, cLng),
        api.getRoads(null, cLat, cLng),
        api.getReports(null, null, cLat, cLng),
        api.getFacilities(null, null, cLat, cLng),
        api.getIncidents(null, null, cLat, cLng),
        api.getDashboardSummary(cLat, cLng),
        api.getDrainageAssets(null, cLat, cLng),
      ]);
      setWeather(wth);
      setWards(wrds);
      setRoads(rds);
      setReports(rpts);
      setFacilities(facs);
      setIncidents(incs);
      setKpis(smy);
      setDrainageAssets(drains || []);
    } catch (err) {
      console.warn("API load error, running locally with resilient fallback:", err);
    }
  }, [center]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. Exact GPS Locator Handler
  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      addToast("Detecting your exact GPS coordinates...", "info");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          setUserLocation({ lat, lng });
          setCenter([lat, lng]);
          setZoom(15);
          setCityName("Your Exact Location");
          loadData(lat, lng);
          addToast(`📍 Location locked: ${lat}, ${lng}`, "success");
        },
        () => {
          // Default to high-risk basin zone
          const lat = 13.0835;
          const lng = 80.2810;
          setUserLocation({ lat, lng });
          setCenter([lat, lng]);
          setZoom(14);
          loadData(lat, lng);
          addToast("GPS access unavailable. Centered on Metro Harbour.", "info");
        }
      );
    }
  };

  // 4. Real-World City Geocoding Search
  const handleSearchCity = async (query) => {
    try {
      addToast(`Searching coordinates for ${query}...`, "info");
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const item = data.results[0];
          const newLat = item.latitude;
          const newLng = item.longitude;
          setCenter([newLat, newLng]);
          setZoom(13);
          setCityName(`${item.name}, ${item.admin1 || item.country || ""}`);
          loadData(newLat, newLng);
          addToast(`Map centered on ${item.name}!`, "success");
          return;
        }
      }
    } catch (err) {
      console.warn("Geocoding fetch failed:", err);
    }

    // Fallback dictionary for major Indian cities
    const CITY_COORDS = {
      chennai: [13.0827, 80.2707],
      mumbai: [19.0760, 72.8777],
      bengaluru: [12.9716, 77.5946],
      delhi: [28.6139, 77.2090],
      kolkata: [22.5726, 88.3639],
      hyderabad: [17.3850, 78.4867],
    };

    const key = query.toLowerCase().trim();
    if (CITY_COORDS[key]) {
      const coords = CITY_COORDS[key];
      setCenter(coords);
      setZoom(13);
      setCityName(query.charAt(0).toUpperCase() + query.slice(1));
      loadData(coords[0], coords[1]);
      addToast(`Map centered on ${query}!`, "success");
    } else {
      addToast(`Location "${query}" not found. Try Chennai, Mumbai, Delhi...`, "warning");
    }
  };

  // 5. Reset Baseline Demo State
  const handleResetDemo = async () => {
    try {
      setIsDemoResetting(true);
      await api.resetDemo();
      addToast("Database restored to clean demonstration baseline.", "success");
      loadData();
    } catch (err) {
      addToast("Failed to reset database.", "error");
    } finally {
      setIsDemoResetting(false);
    }
  };

  const handleReportAtLocation = (coords) => {
    setReportInitialLocation(coords);
    setActiveTab("report");
    addToast(`Ready to report at coordinates ${coords.lat}, ${coords.lng}`, "info");
  };

  const handleNavigateToTask = (task) => {
    setTargetDestination({
      name: `${task.task_code}: ${task.title}`,
      lat: task.latitude,
      lng: task.longitude,
    });
    setCenter([task.latitude, task.longitude]);
    setZoom(15);
    setActiveTab("map");
    addToast(`Plotting safe route to task location (${task.latitude.toFixed(4)}, ${task.longitude.toFixed(4)})`, "info");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      
      {/* Streamlined Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        weather={weather}
        cityName={cityName}
        onSearchCity={handleSearchCity}
        onUseMyLocation={handleUseMyLocation}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenDemoTour={() => setIsDemoTourOpen(true)}
        onResetDemo={handleResetDemo}
        isDemoResetting={isDemoResetting}
      />

      {/* Main Content View (5 Practical Real-Life Dashboards) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6">
        {activeTab === "map" && (
          <SimpleMapRouteView
            wards={wards}
            roads={roads}
            facilities={facilities}
            reports={reports}
            incidents={incidents}
            drainageAssets={drainageAssets}
            center={center}
            zoom={zoom}
            userLocation={userLocation}
            cityName={cityName}
            targetDestination={targetDestination}
            onUseMyLocation={handleUseMyLocation}
            onSelectWard={(w) => setSelectedWardForExplain(w)}
            onSelectRoad={(r) => {
              setActiveTab("dashboard");
            }}
            onReportAtLocation={handleReportAtLocation}
          />
        )}

        {activeTab === "report" && (
          <SimpleReportForm
            initialLocation={reportInitialLocation || userLocation}
            reports={reports}
            onReportSubmitted={() => loadData()}
          />
        )}

        {activeTab === "dashboard" && (
          <AuthorityDashboard
            weather={weather}
            center={center}
            userLocation={userLocation}
            cityName={cityName}
            onOpenWhyRisk={() => {
              if (wards.length > 0) setSelectedWardForExplain(wards[0]);
            }}
            selectedWardForExplain={selectedWardForExplain}
            onSelectWardForExplain={setSelectedWardForExplain}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}

        {activeTab === "fieldworker" && (
          <FieldWorkerDashboard
            center={center}
            userLocation={userLocation}
            cityName={cityName}
            onNavigateToTask={handleNavigateToTask}
          />
        )}

        {activeTab === "analytics" && (
          <HistoricalAnalytics
            center={center}
            userLocation={userLocation}
            cityName={cityName}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500 px-4 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-300">
              SURAKSHA-FLOOD • Decision Support Platform
            </p>
            <p className="text-[11px] text-slate-500">
              Real-World GIS Maps • Live Weather Telemetry • Smart India Hackathon
            </p>
          </div>
          <div className="text-[10px] text-slate-500 text-center sm:text-right">
            Decision-support output based on available radar telemetry and road reports.
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedWardForExplain && (
        <WhyRiskModal
          ward={selectedWardForExplain}
          onClose={() => setSelectedWardForExplain(null)}
        />
      )}

      {isSimulatorOpen && (
        <WhatIfSimulator
          wards={wards}
          onClose={() => setIsSimulatorOpen(false)}
          onSimulationComplete={() => loadData()}
        />
      )}

      {isDemoTourOpen && (
        <SihDemoWalkthrough
          onClose={() => setIsDemoTourOpen(false)}
          onStepTriggered={() => loadData()}
          onResetDemo={handleResetDemo}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
