# Urban Flood Nowcasting System: Smart Flood Management & Decision Support Platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/sampathkesireddy45-max/smart-flood-website)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sampathkesireddy45-max/smart-flood-website&root-directory=frontend)

> **Live Web Demo**: [https://fb31867be785c800-43-228-95-2.serveousercontent.com](https://fb31867be785c800-43-228-95-2.serveousercontent.com)
> 
> **Alternative Live Web Link**: [https://suraksha-flood-sih.loca.lt](https://suraksha-flood-sih.loca.lt) (Password: `43.228.95.2`)
> 
> **Production-Quality Municipal Prototype** built strictly adhering to the *Smart Urban Flood Nowcasting & Decision Support System Software Implementation Specification*.

Urban Flood Nowcasting System is an end-to-end operational platform designed for urban flood nowcasting, explainable multi-factor risk assessment, citizen ground reporting, road-condition lifecycle management, critical-facility accessibility evaluation, emergency task assignment, and flood-aware lower-risk route navigation.

---

## Key Highlights & Architectural Principles

1. **Strictly Data-Driven (Section 82)**:
   - **No Hardcoded Operational Numbers**: Every risk score, road status, facility status, task, and report originates from real API telemetry, database records, citizen submissions, or GIS calculations.
   - **Explainable Multi-Criteria Flood Risk Engine (Section 7 & 8)**:
     $$\text{Risk Score} = w_{\text{rain}} \cdot S_{\text{rain}} + w_{\text{terrain}} \cdot S_{\text{terrain}} + w_{\text{drain}} \cdot S_{\text{drain}} + w_{\text{hist}} \cdot S_{\text{hist}} + w_{\text{obs}} \cdot S_{\text{obs}}$$
     Includes a dedicated **"Why this risk?"** modal decomposing weights, raw scores, and data source citations.
2. **Real-Time Weather Integration (Section 6)**:
   - Connects to Open-Meteo live sensor telemetry for rainfall rate (mm/hr), 24-hr cumulative precipitation, and precipitation probability with resilient fallback caching.
3. **Interactive GIS Map (Section 10 & 32)**:
   - Leaflet-powered GIS engine with layer toggling: Ward Boundaries, Roads, Citizen Reports, Critical Facilities, Drainage Assets, Emergency Incidents, and Active Routing Path.
4. **Three Distinct Operational Roles (Section 2)**:
   - 🏛️ **Authority / Admin Command Center**: City-wide KPI dashboard, interactive GIS map, priority actions panel, incident creation & assignment, road status management with audit trails, and CSV export.
   - 👥 **Citizen Portal**: Public flood map, rainfall advisory banners, mobile-friendly flood/drainage report form with GPS & photo upload, tracking registry, and safe route navigator.
   - 👷 **Field Worker Terminal**: Task cards, GPS location view, photo evidence upload, verification result logging (`CONFIRMED`, `NOT_CONFIRMED`, `NEEDS_FURTHER_INSPECTION`), and offline queueing mode.
5. **Flood-Aware Safe Routing (Section 21–24)**:
   - NetworkX spatial graph dynamically avoiding closed and flooded roads, computing detour travel time and distance, and labelled strictly as: *"Lower-risk route based on available data"*.
6. **Critical Facility Accessibility Engine (Section 25 & 26)**:
   - Evaluates direct flood risk + nearby primary and alternative access road statuses to classify hospitals, fire stations, and shelters as `ACCESSIBLE`, `AT_RISK`, or `AFFECTED`.
7. **Interactive SIH Demonstration Walkthrough (Section 83 & 84)**:
   - 1-Click presentation tour that steps judges through the entire 6-phase disaster response loop with real database state changes.
8. **What-If Scenario Simulator (Section 62)**:
   - Sliders for rainfall intensity (mm/hr), duration, and drain silt blockage, computing hypothetical ward hazard shifts without claiming to be an actual forecast.
9. **Neat & Clean Motion (Emil Kowalski Philosophy)**:
   - Active press bounce (`transform: scale(0.97)`), hardware-accelerated GPU transitions, card hover lifts, animated pulse indicators, smooth counter increments, and celebratory confetti.

---

## System Architecture

```
DATA SOURCES
  ├─ Open-Meteo Live Rainfall API
  ├─ Municipal GIS Database (Wards, Roads, Drainage, Facilities)
  ├─ Citizen Ground Submissions (Photos + GPS)
  └─ Field Worker Inspections & Evidence
        │
        ▼
DATA PROCESSING LAYER
  ├─ Spatial Validation & Duplicate Detection (300m / 4hr window)
  ├─ Unit Normalization
  └─ Database Persistence (SQLAlchemy + SQLite / PostgreSQL)
        │
        ▼
FLOOD RISK & ROUTING ENGINE
  ├─ Explainable Weighted Risk Engine (v2.4-hybrid-configurable)
  ├─ Facility Accessibility Cascade (Road status -> Facility status)
  └─ NetworkX Spatial Graph Safe Route Calculator
        │
        ▼
USER INTERFACES
  ├─ Authority Command Center
  ├─ Citizen Portal & Report Tracker
  ├─ Field Worker Terminal
  └─ SIH Judge Demo Controller
```

---

## Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.12 verified)
- **Node.js 18+** (Node v24 verified) and npm

### 1-Click Launch (Windows)
Double-click `start.bat` in the project root:
```cmd
start.bat
```
This automatically launches the FastAPI backend on `http://localhost:8000`, the Vite React frontend on `http://localhost:5173`, and opens your default browser!

---

### Manual Launch

#### Step 1: Start Backend
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
- API Server: `http://localhost:8000`
- Interactive Swagger API Docs: `http://localhost:8000/docs`

#### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## Environment Variables (`.env`)

| Variable | Default Value | Description |
|---|---|---|
| `DATA_MODE` | `mock` (or `live`) | Displays clear DEMO MODE badge per Section 63/64 |
| `DATABASE_URL` | `sqlite:///./flood_system.db` | Database connection string |
| `JWT_SECRET` | `super-secret-flood-mgmt-key` | Auth secret key |
| `WEATHER_API_BASE_URL`| `https://api.open-meteo.com/v1/forecast` | Open-Meteo public endpoint |

---

## Demonstration Script for SIH Judges (Section 84)

1. Open the platform at `http://localhost:5173`.
2. Click **"Judge Demo Tour"** in the top navigation bar.
3. Walk through each step in sequence:
   - **Step 1: Baseline City Operations** — Observe normal ward risk scores and open roads on the GIS map.
   - **Step 2: Real-Time Rainfall Surge** — Trigger 58 mm/hr rainfall; watch the Risk Engine recalculate Ward 101 and 102 to CRITICAL.
   - **Step 3: Citizen Submits Flood Report** — Switch to Citizen Portal to see incoming report outside Metropolitan Hospital.
   - **Step 4: Authority Verifies & Dispatches Task** — In Authority Command, verify the report and dispatch an emergency inspection task to Field Worker Rajesh.
   - **Step 5: Field Worker Evidence & Road Closure** — In Field Worker Terminal, confirm 80cm flood depth with photo. Road RD-CHL-08 closes; Hospital access auto-flags as `AFFECTED`.
   - **Step 6: Safe Route Recomputation** — Open Safe Route Finder to see the algorithm automatically detour around the submerged road.
4. Open the **"Why this risk?"** button on any ward to prove factor explainability to the judges!

---

## Important Technical Limitations (Section 76)

1. **Decision Support Output**: Risk scores and simulation projections are decision-support outputs, not official emergency declarations.
2. **Human-in-the-Loop**: Road closures, official alerts, and incident priorities require authorized human confirmation.
3. **Routing Disclaimers**: Route suggestions cannot guarantee physical road passability; conditions may shift during active monsoon cloudbursts.
4. **Resilient Fallback**: If external weather APIs drop or experience network outages, cached telemetry is served without crashing the application.

---

## License
Built for the Smart India Hackathon (SIH) & Municipal Disaster Management authorities.
