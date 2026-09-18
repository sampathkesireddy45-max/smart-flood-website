# SURAKSHA-FLOOD (SIH Project) Progress Checkpoint & State

> **Resume Trigger Phrases**: 
> * `"continue my sih project"`
> * `"continue my sih-2 project"`
> * `"continue sih"`
>
> When any of these phrases are received, resume immediately on this codebase with full context.

---

## 1. Project Directory & Core Information
* **Root Directory**: `C:\Users\sampa\smart-flood-website`
* **Project Name**: SURAKSHA-FLOOD (Smart Urban Flood Management & Decision Support Platform)
* **Stack**:
  * **Backend**: FastAPI (`http://localhost:8000`, API docs: `/docs`), SQLAlchemy, SQLite (`flood_system.db`), Open-Meteo Weather API, OSRM Public Routing API, OpenStreetMap Overpass & Nominatim Geocoders.
  * **Frontend**: React 19, Vite (`http://localhost:5173`), Tailwind CSS, Leaflet & React-Leaflet, Lucide React, Canvas Confetti.
* **Startup Scripts**:
  * Run `start.bat` in `C:\Users\sampa\smart-flood-website`, or:
  * Backend: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
  * Frontend: `cd frontend && npm run dev`

---

## 2. Authentication & Real SMS OTP Architecture

### A. Dual Portal Flow
1. **Public / Citizen Portal**:
   * Open to any citizen with any valid 10-digit mobile number.
   * Accesses: Live Map & Evacuation Routing (`/map`), Citizen Hazard Reporting (`/report`).
2. **Restricted Municipal Authority Admin Portal**:
   * **Designated Phone**: `9573198929` (configured in `ADMIN_PHONE`).
   * Any unauthorized number receives strict `403 Forbidden`.
   * Accesses: Authority Command Center (`/dashboard`), Hazard Queue (`/report`), Full Sensor Telemetry.

### B. SMS Dispatch & Verification State
1. **Fast2SMS Telecom Gateway Integration (`backend/app/sms_service.py`)**:
   * API Key configured in `backend/.env`: `At6gmxAVZXxtOQelDkwHJoLKxmh57JQw2nSDSJZ3J47oFJZmLsvsrYXH5mOq`
   * Current wallet balance: ₹50 (200 SMS).
   * **To activate instant telecom delivery to physical phones**: Requires a ₹100 wallet recharge via UPI on [https://www.fast2sms.com/wallet](https://www.fast2sms.com/wallet) to fulfill TRAI anti-fraud DLT requirements. Once recharged, SMS arrives in 2-5 seconds.
2. **Google Firebase Integration (`frontend/src/services/firebase.js`)**:
   * Project ID: `suraksha-flood-7acce`
   * Set up with invisible reCAPTCHA.
3. **Interactive Live Dynamic Delivery**:
   * Generates secure cryptographically random 6-digit OTP stored in SQLite/memory with 10-minute expiry.
   * Dispatches incoming `VM-SURAKSHA TELECOM SMS` notification banner with incoming SMS audio chime, desktop notification, and 1-click Auto-Fill button.
   * Strict single-use replay protection.

---

## 3. Current Live Status of Services
* **Backend API**: `http://localhost:8000` (FastAPI Uvicorn)
* **Frontend UI**: `http://localhost:5173` (Vite)
* **Database**: `backend/flood_system.db`

---

## 4. Key Credentials & Access
* **Authority Admin Phone**: `9573198929`
* **Citizen Phone**: Any 10-digit number
