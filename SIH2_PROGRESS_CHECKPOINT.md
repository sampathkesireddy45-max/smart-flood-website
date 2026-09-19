# Urban Flood Nowcasting System (SIH Project) Progress Checkpoint & State

> **Resume Trigger Phrases**: 
> * `"continue my sih project"`
> * `"continue my sih-2 project"`
> * `"continue sih"`
> * `agy --conversation=aa7ac748-3d5c-4ff2-b5fa-5a52bcf69f5b`
> * `agy --conversation=377466e7-8305-45b2-92f7-e318b7471f58`
> * `agy --conversation=e0958d5f-541d-45b3-849e-e860ab3675a2`
> * `agy --conversation=fc29755d-b611-4f4c-9c1d-e88e685bc986`
> * `agy --conversation=1c0f84c7-48d5-465b-b949-c6ea1773ed24`
> * `agy --conversation=e6344a04-d1d3-449d-89c2-d56e11481db6`
>
> When any of these phrases are received, resume immediately on this codebase with full context.

---

## 1. Project Directory & Core Information
* **Root Directory**: `C:\Users\sampa\smart-flood-website`
* **Project Name**: Urban Flood Nowcasting System (Smart Flood Management & Decision Support Platform)
* **Stack**:
  * **Backend**: FastAPI (`http://localhost:8000`, API docs: `/docs`), SQLAlchemy, SQLite (`flood_system.db`), Open-Meteo Weather API, OSRM Public Routing API, OpenStreetMap Overpass & Nominatim Geocoders.
  * **Frontend**: React 19, Vite (`http://localhost:5173`), Tailwind CSS, Leaflet & React-Leaflet, Lucide React, Canvas Confetti.
* **Startup Scripts**:
  * Run `start.bat` in `C:\Users\sampa\smart-flood-website`, or:
  * Backend: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
  * Frontend: `cd frontend && npm run dev`

---

## 2. All 5 Fully Integrated Dashboards & Terminals

1. **Authority Command Center (`/dashboard`)**:
   * Restricted to Municipal Authority Admin with confidential password login.
   * Real-time KPIs, live GIS layer map, Priority Operational Actions, Road Closure Management, Citizen Report Verification, Drainage Asset Inspection, and Field Task Dispatch.
2. **Live GIS Flood Map & Safe Route Navigation (`/map`)**:
   * Dynamic flood-aware routing engine avoiding impassable flooded roads and drainage leakages.
   * Dual-layer route geometry, avoided hazard pins with explanations, 1-click GPS detection, and map-point location picking.
3. **Citizen Ground Photo Hazard Reporting Portal (`/report`)**:
   * 100% Real ground photographic evidence required.
   * GPS coordinate locking, live severity classification, real-time report queue feed with click-to-enlarge photo modal.
4. **Field Response Inspection Terminal (`/field`)**:
   * Mobile response protocol with operator switcher (Sector Alpha / Bravo).
   * Offline inspection queueing in local storage with automatic cloud sync on network recovery.
   * Live GPS telemetry stamping and camera photo evidence capture directly into inspection notes.
   * 1-Click "Safe Route" button dynamically targets task location and computes route on Live Map.
5. **Historical Flood Analytics & Immutable Audit Trail (`/analytics`)**:
   * Longitudinal flood analysis across wards, hazard distribution charts, vulnerability hotspots, and 10-year flood event archive.
   * Tamper-evident municipal audit trail logging actor attribution, old vs new values, and status transitions.
   * Live CSV exports for verified reports, road networks, and emergency incidents with regional geocoding support.

---

## 3. UI Polish, Hover Effects, Scrolling & Color System
* **Refined Modern Dark Aesthetics**:
  * Slate-950 base with ambient electric cyan and royal violet radial background glow.
  * Glassmorphism panels with 14px backdrop blur and crisp `border-slate-800/80` borders.
* **Interactive Hover Effects**:
  * Smooth `.hover-lift` elevation (`translateY(-2.5px)`) with layered ambient glow shadows.
  * Contextual glow borders on hover: cyan (`hover-glow-brand`), purple (`hover-glow-purple`), emerald (`hover-glow-emerald`), amber (`hover-glow-amber`), rose (`hover-glow-rose`).
  * Micro-tactile active button scaling (`scale-97`).
* **Sleek Custom Scrollbars**:
  * Ultra-slim 7px track with rounded pill thumb that lights up in electric cyan on hover.
  * `.custom-scrollbar` for high-density tables, log feeds, and modals.
  * Native smooth scrolling (`scroll-behavior: smooth`).

---

## 4. Authentication & Privacy-First Flow
* **Citizen Emergency Evacuation Pass**:
  * 1-Click zero-data access. Immediately captures GPS distress beacon and routes citizen to closest accessible shelter/hospital while displaying critical beacon at Command Center.
* **Confidential Municipal Authority Admin**:
  * ID: `admin@floodauthority.gov.in` (or `admin`)
  * Password: `SurakshaAdmin@2026` (Masked input, toggleable eye visibility, protected in `backend/.env`).

---

## 5. Current Live Status of Services
* **Backend API**: `http://localhost:8000` (FastAPI Uvicorn - RUNNING)
* **Frontend UI**: `http://localhost:5173` (Vite dev server - RUNNING)
* **Unified Single-Port SPA**: `http://localhost:8000/` (FastAPI serves built React SPA directly)
* **Database**: `backend/flood_system.db` (SQLite + SQLAlchemy)
* **Uploads**: `backend/uploads/` (Static files served at `/uploads/...`)

---

## 6. Pre-Deployment Audit & Production Readiness
* **Automated Audit**: 24/24 Test Vectors **PASSED (100%)** (`backend/test_system.py`).
* **Clean URLs**: Hardcoded `localhost:8000` references removed across all React components; `VITE_BACKEND_URL` support configured.
* **Production Build**: `npm run build` generates production bundle in `frontend/dist`.
* **Container Packaging**: Multi-stage `Dockerfile` and `docker-compose.yml` configured.
* **Cloud Blueprints**: `render.yaml` (1-click Render blueprint) and `frontend/vercel.json` (Vercel Edge CDN).
* **Comprehensive Guide**: [DEPLOYMENT.md](file:///C:/Users/sampa/smart-flood-website/DEPLOYMENT.md) with step-by-step instructions for Render, Cloud Run, Railway, Vercel, and VPS.
