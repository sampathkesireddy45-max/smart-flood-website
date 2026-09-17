import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import FloodReport, Incident, Task, AuditLog, Ward
from ..schemas import FloodReportCreate, FloodReportVerify
from ..routing_engine import haversine_distance_m
from ..regional_data import is_regional, get_regional_reports

router = APIRouter(prefix="/reports", tags=["Citizen Reporting & Verification"])

@router.get("")
def list_reports(
    verification_status: Optional[str] = None,
    report_type: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        regional_rpts = get_regional_reports(lat, lng)
        if verification_status and verification_status.upper() != "ALL":
            regional_rpts = [r for r in regional_rpts if r["verification_status"] == verification_status.upper()]
        if report_type and report_type.upper() != "ALL":
            regional_rpts = [r for r in regional_rpts if r["report_type"] == report_type.upper()]
        return regional_rpts

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

@router.post("")
def create_citizen_report(payload: FloodReportCreate, db: Session = Depends(get_db)):
    # Validate coordinates
    if not (12.0 <= payload.latitude <= 14.5 and 79.5 <= payload.longitude <= 81.0):
        # Permissive for demo coordinates, but ensure floats exist
        if payload.latitude == 0 or payload.longitude == 0:
            raise HTTPException(status_code=400, detail="Invalid GPS location coordinates.")

    # Match nearest ward
    wards = db.query(Ward).all()
    nearest_ward = None
    min_dist = float("inf")
    for w in wards:
        d = haversine_distance_m(payload.latitude, payload.longitude, w.center_lat, w.center_lng)
        if d < min_dist:
            min_dist = d
            nearest_ward = w

    # Duplicate detection (Section 15): within 300 meters and 4 hours
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

    code_num = random.randint(100, 999)
    report_code = f"RPT-2026-{code_num}"

    new_report = FloodReport(
        report_code=report_code,
        reporter_name=payload.reporter_name or "Concerned Resident",
        reporter_phone=payload.reporter_phone or "+91 98400 00000",
        report_type=payload.report_type.upper(),
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        ward_id=nearest_ward.id if nearest_ward else 1,
        reported_water_level=payload.reported_water_level or "Ankle deep (15cm)",
        photo_url=payload.photo_url or "/uploads/demo_report.jpg",
        verification_status="PENDING",
        severity="HIGH" if "Waist" in str(payload.reported_water_level) or "Submerged" in str(payload.reported_water_level) else "MEDIUM",
        is_grouped_duplicate=is_duplicate,
        reported_at=datetime.utcnow()
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Log to audit
    audit = AuditLog(
        user=new_report.reporter_name,
        action="CITIZEN_REPORT_SUBMITTED",
        record=f"{new_report.report_code} ({new_report.report_type})",
        old_value=None,
        new_value="PENDING"
    )
    db.add(audit)
    db.commit()

    return {
        "report_id": new_report.id,
        "report_code": new_report.report_code,
        "status": "PENDING",
        "is_grouped_duplicate": is_duplicate,
        "duplicate_notice": "Multiple reports received in this area (grouped for verification)" if is_duplicate else None,
        "submission_timestamp": new_report.reported_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "message": f"Report {new_report.report_code} logged successfully in municipal registry."
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
