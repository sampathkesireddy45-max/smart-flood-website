from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..seed_data import seed_database
from ..models import Road, FloodReport, Incident, Task, TaskEvidence, CriticalFacility, AuditLog, Ward
from ..risk_engine import risk_engine

router = APIRouter(prefix="/demo", tags=["SIH Demonstration Mode"])

class DemoStepRequest(BaseModel):
    step: int

@router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    """
    Resets all database tables back to default demonstration baseline state.
    """
    seed_database(db, force_reset=True)
    return {
        "status": "RESET_SUCCESSFUL",
        "message": "Database successfully restored to clean demonstration baseline state.",
        "data_mode": "DEMO_MODE",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

@router.post("/trigger-step")
def execute_demo_step(req: DemoStepRequest, db: Session = Depends(get_db)):
    """
    Executes an operational transition in the database according to Section 84 SIH Scenario.
    """
    step = req.step
    result_data = {}

    if step == 1:
        # Step 1: Normal / Baseline State
        result_data = {"step": 1, "title": "Baseline System State", "desc": "Wards operating with moderate rainfall (18mm/hr). All main corridors open."}

    elif step == 2:
        # Step 2: Torrential Monsoon Spell Injected (Rainfall climbs to 58 mm/hr)
        wards = db.query(Ward).all()
        for w in wards:
            calc = risk_engine.calculate_ward_risk(
                ward_name=w.name,
                ward_code=w.code,
                elevation_m=w.elevation_meters,
                drainage_capacity_pct=w.drainage_capacity_pct,
                historical_flood_count=w.historical_flood_count,
                rainfall_rate_mm_hr=58.0,
                cumulative_rainfall_mm=112.0,
                verified_reports_count=3 if "101" in w.code or "102" in w.code else 0
            )
            w.current_risk_score = calc["score"]
            w.current_risk_level = calc["risk_level"]
        db.commit()
        result_data = {"step": 2, "title": "Rainfall Intensity Spikes", "desc": "Rainfall telemetry enters system at 58 mm/hr. Risk engine auto-recalculates ward hazard indices."}

    elif step == 3:
        # Step 3: Citizen Submits Urgent Flood Report
        new_report = FloodReport(
            report_code="RPT-DEMO-999",
            reporter_name="Arun Kumar (Citizen)",
            reporter_phone="+91 98409 11111",
            report_type="FLOODING",
            description="Deep flood water surging across Central Hospital Link Way! Ambulances finding it difficult to enter emergency wing.",
            latitude=13.0825,
            longitude=80.2665,
            ward_id=2,
            reported_water_level="Waist deep (>75cm)",
            photo_url="/uploads/demo_hospital_flood.jpg",
            reported_at=datetime.utcnow(),
            verification_status="PENDING",
            severity="CRITICAL"
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        result_data = {"step": 3, "title": "Citizen Inundation Report Submitted", "desc": f"Report {new_report.report_code} received with photo and GPS coordinates outside Metropolitan Hospital."}

    elif step == 4:
        # Step 4: Authority Verifies Report & Creates Incident
        report = db.query(FloodReport).filter(FloodReport.report_code == "RPT-DEMO-999").first()
        if report:
            report.verification_status = "VERIFIED"
            report.verified_by = "Chief Disaster Officer Sharma"
            report.verified_at = datetime.utcnow()

        inc = Incident(
            incident_code="INC-DEMO-777",
            incident_type="ROAD_INUNDATION",
            title="Hospital Link Way Severe Submersion",
            description="Severe waterlogging on Central Hospital Link Way. Critical facility access threatened.",
            latitude=13.0825,
            longitude=80.2665,
            ward_id=2,
            priority="CRITICAL",
            system_recommended_priority="CRITICAL",
            status="ASSIGNED",
            source_report_id=report.id if report else None,
            created_by="Chief Disaster Officer Sharma",
            assigned_team_id=2
        )
        db.add(inc)
        db.commit()
        db.refresh(inc)

        # Assign task to Field Worker
        tsk = Task(
            task_code="TSK-DEMO-555",
            incident_id=inc.id,
            assigned_to="Field Worker Rajesh Kumar",
            title="Urgent Gauge Inspection & Barrier Placement at Hospital Way",
            description="Inspect submersion depth, place warning signs, and report pump requirements.",
            priority="CRITICAL",
            status="ASSIGNED",
            location="Central Hospital Link Way",
            latitude=13.0825,
            longitude=80.2665
        )
        db.add(tsk)
        db.commit()
        result_data = {"step": 4, "title": "Authority Verifies & Dispatches Task", "desc": f"Report verified. Incident {inc.incident_code} generated; Field Task {tsk.task_code} dispatched to Rajesh Kumar."}

    elif step == 5:
        # Step 5: Field Worker Uploads Evidence & Confirms Flooding
        tsk = db.query(Task).filter(Task.task_code == "TSK-DEMO-555").first()
        if tsk:
            tsk.status = "COMPLETED"
            tsk.completed_at = datetime.utcnow()
            ev = TaskEvidence(
                task_id=tsk.id,
                worker_id="Field Worker Rajesh Kumar",
                photo_url="/uploads/field_evidence_hospital.jpg",
                observation="Confirmed 80cm deep moving water. Road completely impassable for standard motor vehicles.",
                verification_result="CONFIRMED"
            )
            db.add(ev)

        # Authority marks road as CLOSED
        road = db.query(Road).filter(Road.road_code == "RD-CHL-08").first()
        if road:
            road.status = "CLOSED"
            road.flood_risk = 98.0
            road.last_verified_at = datetime.utcnow()

        # Recalculate hospital accessibility (Section 26)
        fac = db.query(CriticalFacility).filter(CriticalFacility.name.contains("General Metropolitan Hospital")).first()
        if fac:
            fac.accessibility_status = "AFFECTED"

        db.commit()
        result_data = {"step": 5, "title": "Field Verification & Road Closure", "desc": "Rajesh submits photographic evidence. Road RD-CHL-08 marked CLOSED. Hospital accessibility auto-updated to AFFECTED."}

    elif step == 6:
        # Step 6: Route Re-computation & Relief Resolution
        result_data = {
            "step": 6,
            "title": "Flood-Aware Safe Route Recomputed",
            "desc": "Routing algorithm automatically excludes closed Hospital Link Way and routes traffic through elevated Ring Road corridor."
        }

    return {
        "status": "STEP_EXECUTED",
        "step_details": result_data,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }
