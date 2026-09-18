# SURAKSHA-FLOOD (SIH-2 Project) Progress Checkpoint

> **Resume Trigger Phrase**: `"continue my sih-2 project"`  
> When this phrase is received, resume working directly on this codebase with full context.

---

## 1. Project Overview & Location
* **Root Directory**: `C:\Users\sampa\smart-flood-website`
* **Stack**:
  * **Backend**: FastAPI (`python run.py`, port 8000), SQLAlchemy, SQLite (`flood_system.db`), Open-Meteo Weather API, OSRM Public Routing API, OpenStreetMap Overpass & Nominatim Geocoders.
  * **Frontend**: React 19, Vite (`npm run dev`, port 5173), Tailwind CSS, Leaflet & React-Leaflet, Lucide React, Canvas Confetti.

---

## 2. Completed Capabilities & Architecture

### A. Dual-Portal Mobile OTP Authentication (`LoginPage.jsx` + `backend/app/routers/auth.py` + `backend/app/sms_service.py`)
1. **Public / Citizen Access Portal**:
   * Open to any citizen with any valid 10-digit mobile number.
   * Real-time 6-digit OTP generation and verification flow with instant auto-fill code badge for seamless testing.
   * Grants immediate access to:
     * **Live Map & Safe Route Navigation** (real-time OSRM hazard avoidance).
     * **Citizen Hazard Reporting Portal** (with live GPS auto-capture and waterlogging logging).
2. **Restricted Municipal Authority Admin Portal**:
   * **Strict Access Control**: Opens **strictly and exclusively** when the designated Municipal Authority administrative mobile number (**`9573198929`**, or configured via `ADMIN_PHONE` environment variable) is entered.
   * Any unauthorized mobile number receives an immediate `403 Forbidden` rejection and alert banner: *"ACCESS DENIED: Mobile number (+91 ...) is not authorized for Municipal Authority Administration. Authorized administrator phone only (+91 9573198929)."*
   * On entering `9573198929`, sends authority clearance OTP, verifies and issues administrative session JWT.
   * Enters the **Authority Command Center** with full operational decision-support tooling.
3. **Real Telecom SMS OTP Dispatch (`sms_service.py`)**:
   * **Fast2SMS Integration**: Indian Quick OTP route (`https://www.fast2sms.com/dev/bulkV2`) for instant SMS delivery to Indian mobile numbers without DLT delay.
   * **Twilio Integration**: International SMS gateway integration.
   * **2Factor.in Integration**: Specialized Indian OTP SMS route.
   * **In-App SMS Gateway Configuration Modal**: Accessible directly on the login screen to enter / save Fast2SMS or Twilio keys at runtime (persisted to `.env`).
   * **Test / Fallback Mode**: When an SMS gateway is not yet connected, displays an informative guidance banner and backup code so testing is never blocked.
4. **Session Persistence & Logout**:
   * Stored in browser `localStorage` (`suraksha_token`, `suraksha_user`, `suraksha_role`).
   * Clean Logout button and user role identity badge displayed in the navigation bar to easily switch between Citizen and Admin views.

### B. Cleaned Navigation & Dashboards (Per User Directives)
* **Removed Field Responder section**: Eliminated the dedicated fieldworker tab and dispatch dependencies from the navigation and routing.
* **Removed Audit section**: Eliminated the audit trail tab from top-level navigation.
* **Streamlined Multi-Role Views**:
  * **Citizen View**: Live Map & Safe Route (`/map`), Citizen Report Portal (`/report`).
  * **Authority Admin View**: Authority Command Center (`/dashboard`), Live Map & Safe Route (`/map`), Citizen Reports & Hazard Queue (`/report`).

### C. 100% Real-World & Live Exact Details
* **Live Radar & Precipitation Telemetry**: Directly queries Open-Meteo API for real-time rain rates (mm/hr), weather codes, and precipitation probability.
* **Live Road Network & GIS**: Queries OpenStreetMap Overpass API for real-world primary and secondary road segments around the user's location.
* **Live Emergency Routing**: Computes street-level hazard-avoiding evacuation routes via OSRM.
* **Default Mode**: Backend `DATA_MODE` set to `"live"`.

---

## 3. Quick Credentials & Verification

* **Admin Mobile Number**: `9573198929` (Strictly Authorized)
* **Admin Verification OTP**: Dispatched via Real SMS (or backup displayed on screen if gateway pending)
* **Citizen Mobile Number**: Any 10-digit mobile number (e.g. `9876501234`)
* **Citizen OTP**: Dispatched via Real SMS (or backup displayed on screen if gateway pending)

---

## 4. Services

* **Backend**: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`)
* **Frontend**: `http://localhost:5173`
* **Startup Script**: Run `start.bat` from `C:\Users\sampa\smart-flood-website`
