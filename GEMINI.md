# SURAKSHA-FLOOD (SIH Project) Rules & Guidelines

## Project Context
* **Project Name**: SURAKSHA-FLOOD (Smart India Hackathon)
* **Description**: Operational Flood Monitoring, Explainable Risk Assessment & Real-Time Decision Support Platform.
* **Checkpoint File**: `SIH2_PROGRESS_CHECKPOINT.md`

## Resume Trigger
When user says `"continue my sih project"` or `"continue my sih-2 project"`, inspect `SIH2_PROGRESS_CHECKPOINT.md` and resume from the latest checkpoint.

## Tech Stack & Conventions
* **Backend**: FastAPI, SQLAlchemy, SQLite (`flood_system.db`), Open-Meteo API, OSRM.
* **Frontend**: React 19, Vite, Tailwind CSS, Leaflet, Lucide icons.
* **Auth**: Dual-portal (Citizen and Admin: `9573198929`). Real SMS via Fast2SMS / dynamic verification.
