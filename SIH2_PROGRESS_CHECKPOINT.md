# SURAKSHA-FLOOD (SIH-2 Project) Progress Checkpoint

> **Resume Trigger Phrase**: `"continue my sih-2 project"`  
> When this phrase is received, resume working directly on this codebase with full context.

---

## 1. Project Overview & Location
* **Root Directory**: `C:\Users\sampa\smart-flood-website`
* **Git Repository**: Initialized with commit `41bbcf2` (branch: `master`).
* **Stack**:
  * **Backend**: FastAPI (`python run.py`, port 8000), SQLAlchemy, SQLite (`flood_system.db`), Open-Meteo Weather API, OSRM Public Routing API, OpenStreetMap Overpass & Nominatim Geocoders.
  * **Frontend**: React 19, Vite (`npm run dev`, port 5173), Tailwind CSS, Leaflet & React-Leaflet, Lucide React, Canvas Confetti.

---

## 2. Architecture & Completed Capabilities

### A. 5-Role Unified Operational Suite
1. **Live Map & Safe Route (`SimpleMapRouteView.jsx` + `RouteFinder.jsx`)**:
   * Exact street-level routing powered by public OSRM.
   * Real-time hazard avoidance (bypasses flooded roads, waterlogged culverts, and high-water hazards).
   * Rain deceleration and weather impact travel duration estimates.
   * Preset destination selector (Hospitals, Shelters, Metro Stations) and interactive click-to-pick on map.
   * Live GPS centering and auto-zoom.

2. **Citizen Reporting Portal (`SimpleReportForm.jsx` / `CitizenPortal.jsx`)**:
   * Community hazard submission with GPS coordinate stamping.
   * Water depth logging (cm), severity rating, and photo upload support.
   * Duplicate detection and nearest ward association.

3. **Authority Command Center (`AuthorityDashboard.jsx`)**:
   * 7 Operational sub-views: *Overview*, *Roads & Closures*, *Citizen Reports & Verification*, *Emergency Incidents*, *Critical Facilities*, *Drainage & Outfalls*, *Fleet & Strike Teams*.
   * Road closure controls with reason logging.
   * Report verification modal with automatic incident dispatch.
   * Live recalculate risk action (`POST /api/risk/recalculate`) and task dispatching.
   * Location-aware: auto-syncs with user's active GPS or searched city coordinates.

4. **Field Responder Terminal (`FieldWorkerDashboard.jsx`)**:
   * Offline mobile inspection mode (stores tasks and evidence in `localStorage`, auto-syncs on reconnect).
   * Live GPS stamping and photo evidence verification.
   * **"Safe Route"** button on task cards immediately loads the task coordinates into the routing engine and navigates to the map.

5. **Historical Analytics & Audit Trail (`HistoricalAnalytics.jsx`)**:
   * Longitudinal flood charts and recurring incident hotspot registries.
   * Searchable municipal audit trail with user actions, old values, and new values.
   * Instant CSV exports for *Reports*, *Roads*, and *Incidents* (`/api/analytics/export/csv`).

### B. Dynamic Regional Telemetry Engine (`backend/app/regional_data.py`)
* Solved the issue where dashboards outside Chennai showed default seed data.
* Now works seamlessly for **any location in India**:
  * Visakhapatnam, Mumbai, Bengaluru, Delhi NCR, Kolkata, Hyderabad, or any global GPS coordinates.
  * Dynamically queries Open-Meteo for live rain rates and OpenStreetMap for roads and hospitals.
  * Generates localized operational sectors, incident alerts, field responder tasks, and drainage assets.

---

## 3. Quick Startup Commands

### Start All Services (Batch Script)
```powershell
cd C:\Users\sampa\smart-flood-website
.\start.bat
```

### Or Start Individually
```powershell
# Backend (Port 8000)
cd C:\Users\sampa\smart-flood-website\backend
python run.py

# Frontend (Port 5173)
cd C:\Users\sampa\smart-flood-website\frontend
npm run dev
```

---

## 4. Key Files Reference
* `frontend/src/App.jsx` - Root layout and 5-dashboard navigation
* `frontend/src/services/api.js` - Unified API client with location queries
* `frontend/src/pages/AuthorityDashboard.jsx` - Municipal operations room
* `frontend/src/pages/FieldWorkerDashboard.jsx` - Field inspection terminal
* `frontend/src/pages/HistoricalAnalytics.jsx` - Analytics and audit trail
* `frontend/src/components/RouteFinder.jsx` - Real-world dynamic routing engine
* `backend/app/regional_data.py` - Localized data generator for any city
* `backend/app/routers/` - FastAPI endpoints (`risk.py`, `roads.py`, `tasks.py`, `incidents.py`, `reports.py`, `drainage.py`, `analytics.py`, `routes.py`, `facilities.py`)
