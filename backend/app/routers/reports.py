import os
import time
import json
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import FloodReport, Incident, Task, AuditLog, Ward, Road
from ..schemas import FloodReportCreate, FloodReportVerify
from ..routing_engine import haversine_distance_m

router = APIRouter(prefix="/reports", tags=["Citizen Reporting & Verification"])

@router.get("")
def list_reports(
    verification_status: Optional[str] = None,
    report_type: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FloodReport)
    if verification_status and verification_status.upper() != "ALL":
        query = query.filter(FloodReport.verification_status == verification_status.upper())
    if report_type and report_type.upper() != "ALL":
        query = query.filter(FloodReport.report_type == report_type.upper())

    reports = query.order_by(FloodReport.reported_at.desc()).all()
    results = []
    for r in reports:
        results.append({
            "id": r.id,
            "report_code": r.report_code,
            "reporter_name": r.reporter_name,
            "reporter_phone": r.reporter_phone,
            "report_type": r.report_type,
            "description": r.description,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "ward_name": r.ward.name if r.ward else "Unassigned Ward",
            "reported_water_level": r.reported_water_level,
            "photo_url": r.photo_url,
            "reported_at": r.reported_at.strftime("%Y-%m-%d %H:%M:%S UTC") if r.reported_at else "Just now",
            "verification_status": r.verification_status,
            "severity": r.severity,
            "verified_by": r.verified_by,
            "verification_notes": r.verification_notes,
            "is_grouped_duplicate": r.is_grouped_duplicate
        })
    return results

@router.post("/upload-photo")
async def upload_hazard_photo(file: UploadFile = File(...)):
    """
    Accepts real photographic evidence from the public of the flooded area.
    Saves the image directly to uploads/ directory and returns accessible URL.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WEBP) are accepted.")

    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"
    filename = f"hazard_{int(time.time())}_{random.randint(1000, 9999)}{ext}"
    dest_path = os.path.join(upload_dir, filename)

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded photo is empty.")

    with open(dest_path, "wb") as f:
        f.write(content)

    return {
        "photo_url": f"/uploads/{filename}",
        "full_url": f"http://localhost:8000/uploads/{filename}",
        "filename": filename,
        "size_bytes": len(content)
    }

@router.post("")
def create_citizen_report(payload: FloodReportCreate, db: Session = Depends(get_db)):
    # Validate real coordinates
    if payload.latitude == 0 or payload.longitude == 0:
        raise HTTPException(status_code=400, detail="Invalid GPS location coordinates.")

    # Enforce mandatory real photo evidence
    if not payload.photo_url or not payload.photo_url.strip():
        raise HTTPException(
            status_code=400,
            detail="Ground photographic evidence is mandatory. Please capture or upload a real photo of the flooded area."
        )

    # Match nearest ward
    wards = db.query(Ward).all()
    nearest_ward = None
    min_dist = float("inf")
    for w in wards:
        d = haversine_distance_m(payload.latitude, payload.longitude, w.center_lat, w.center_lng)
        if d < min_dist:
            min_dist = d
            nearest_ward = w

    # Duplicate detection: within 300 meters and 4 hours
    cutoff = datetime.utcnow() - timedelta(hours=4)
    recent_nearby = db.query(FloodReport).filter(
        FloodReport.reported_at >= cutoff,
        FloodReport.report_type == payload.report_type.upper()
    ).all()

    is_duplicate = False
    for r in recent_nearby:
        if haversine_distance_m(payload.latitude, payload.longitude, r.latitude, r.longitude) <= 300.0:
            is_duplicate = True
            break

    code_num = random.randint(1000, 9999)
    report_code = f"RPT-{code_num}"

    is_severe = "Waist" in str(payload.reported_water_level) or "Submerged" in str(payload.reported_water_level) or payload.report_type == "FLOODING"

    new_report = FloodReport(
        report_code=report_code,
        reporter_name=payload.reporter_name or "Concerned Citizen",
        reporter_phone=payload.reporter_phone or "Citizen App",
        report_type=payload.report_type.upper(),
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        ward_id=nearest_ward.id if nearest_ward else 1,
        reported_water_level=payload.reported_water_level or "Ankle deep (15cm)",
        photo_url=payload.photo_url.strip(),
        verification_status="VERIFIED",
        severity="CRITICAL" if "Submerged" in str(payload.reported_water_level) else ("HIGH" if is_severe else "MEDIUM"),
        is_grouped_duplicate=is_duplicate,
        reported_at=datetime.utcnow(),
        verified_by="Citizen Ground Evidence",
        verification_notes="Reported with real photographic evidence."
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Dynamically update the nearest road status to FLOODED based on this genuine citizen report!
    nearest_road = None
    min_road_dist = float("inf")
    for rd in db.query(Road).all():
        try:
            coords = json.loads(rd.coordinates_json)
            for pt in coords:
                d = haversine_distance_m(payload.latitude, payload.longitude, pt[0], pt[1])
                if d < min_road_dist:
                    min_road_dist = d
                    nearest_road = rd
        except Exception:
            continue

    if nearest_road and min_road_dist <= 350.0:
        nearest_road.status = "FLOODED" if is_severe else "AT_RISK"
        nearest_road.flood_risk = 85.0 if is_severe else 60.0
        nearest_road.last_verified_at = datetime.utcnow()
        db.commit()

    # Automatically create an active Incident for Municipal Authority Command Center
    inc_code = f"INC-{report_code}"
    new_incident = Incident(
        incident_code=inc_code,
        incident_type="ROAD_INUNDATION" if payload.report_type == "FLOODING" else "COMMUNITY_FLOOD",
        title=f"Citizen Verified Hazard: {payload.description[:50]}",
        description=f"{payload.description} (Water level: {payload.reported_water_level}). Ground photo verified.",
        latitude=payload.latitude,
        longitude=payload.longitude,
        ward_id=nearest_ward.id if nearest_ward else 1,
        priority="CRITICAL" if is_severe else "HIGH",
        system_recommended_priority="HIGH",
        status="ASSIGNED",
        source_report_id=new_report.id,
        created_by=new_report.reporter_name
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    new_report.linked_incident_id = new_incident.id

    # Log to audit
    audit = AuditLog(
        user=new_report.reporter_name,
        action="CITIZEN_PHOTO_REPORT_SUBMITTED",
        record=f"{new_report.report_code} ({new_report.report_type})",
        old_value=None,
        new_value="VERIFIED"
    )
    db.add(audit)
    db.commit()

    return {
        "report_id": new_report.id,
        "report_code": new_report.report_code,
        "status": "VERIFIED",
        "photo_url": new_report.photo_url,
        "is_grouped_duplicate": is_duplicate,
        "duplicate_notice": "Multiple reports received in this area (grouped for verification)" if is_duplicate else None,
        "submission_timestamp": new_report.reported_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "message": f"Report {new_report.report_code} with photo evidence logged in municipal registry."
    }

@router.patch("/{report_id}/verify")
def verify_citizen_report(report_id: int, payload: FloodReportVerify, db: Session = Depends(get_db)):
    report = db.query(FloodReport).filter(FloodReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    old_status = report.verification_status
    action = payload.action.upper()
    if action not in ["VERIFY", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be VERIFY or REJECT")

    report.verification_status = "VERIFIED" if action == "VERIFY" else "REJECTED"
    report.verified_by = payload.verified_by
    report.verified_at = datetime.utcnow()
    report.verification_notes = payload.notes or ("Field evidence and CCTV cross-checked" if action == "VERIFY" else "Unsubstantiated or resolved")

    created_incident_id = None
    created_task_id = None

    # Authority workflow: Can directly spawn an incident and assign field task!
    if action == "VERIFY" and payload.create_incident:
        inc_code = f"INC-2026-{random.randint(200, 899)}"
        new_incident = Incident(
            incident_code=inc_code,
            incident_type=payload.incident_type or "ROAD_INUNDATION",
            title=f"Verified Inundation: {report.description[:60]}...",
            description=report.description,
            latitude=report.latitude,
            longitude=report.longitude,
            ward_id=report.ward_id,
            priority=payload.incident_priority or "HIGH",
            system_recommended_priority=report.severity,
            status="ASSIGNED",
            source_report_id=report.id,
            created_by=payload.verified_by
        )
        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)
        created_incident_id = new_incident.id
        report.linked_incident_id = new_incident.id

        # Auto-create field task
        tsk_code = f"TSK-2026-{random.randint(400, 999)}"
        new_task = Task(
            task_code=tsk_code,
            incident_id=new_incident.id,
            assigned_to="Field Worker Rajesh Kumar",
            title=f"Field Inspection for {new_incident.incident_code}",
            description=f"Inspect water level, verify road passability and upload photographic evidence for {report.report_code}.",
            priority=payload.incident_priority or "HIGH",
            status="ASSIGNED",
            location=f"Coordinates ({report.latitude:.4f}, {report.longitude:.4f})",
            latitude=report.latitude,
            longitude=report.longitude
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        created_task_id = new_task.id

    # Audit log
    audit = AuditLog(
        user=payload.verified_by,
        action="REPORT_VERIFIED" if action == "VERIFY" else "REPORT_REJECTED",
        record=report.report_code,
        old_value=old_status,
        new_value=report.verification_status
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Report {report.report_code} updated to {report.verification_status}",
        "report_code": report.report_code,
        "verification_status": report.verification_status,
        "created_incident_id": created_incident_id,
        "created_task_id": created_task_id
    }
