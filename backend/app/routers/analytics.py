import io
import csv
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    Ward, Road, FloodReport, Incident, Task,
    CriticalFacility, EmergencyTeam, FloodEvent, AuditLog
)
from ..weather_service import weather_service
from ..config import settings
from ..schemas import DashboardKPI
from ..regional_data import is_regional, get_regional_summary, get_regional_charts, get_regional_audit_logs

router = APIRouter(prefix="/analytics", tags=["Historical Analytics & Summary KPIs"])

@router.get("/summary", response_model=DashboardKPI)
def get_dashboard_summary(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        weather = weather_service.fetch_live_weather(lat, lng)
        return get_regional_summary(lat, lng, weather)

    wards = db.query(Ward).all()
    avg_score = sum(w.current_risk_score for w in wards) / len(wards) if wards else 0.0
    high_wards = sum(1 for w in wards if w.current_risk_level == "HIGH")
    crit_wards = sum(1 for w in wards if w.current_risk_level == "CRITICAL")

    overall_risk = "LOW"
    if crit_wards > 0 or avg_score >= 70:
        overall_risk = "CRITICAL"
    elif high_wards > 0 or avg_score >= 50:
        overall_risk = "HIGH"
    elif avg_score >= 30:
        overall_risk = "MODERATE"

    active_incidents = db.query(Incident).filter(Incident.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS"])).count()
    pending_reports = db.query(FloodReport).filter(FloodReport.verification_status == "PENDING").count()
    affected_roads = db.query(Road).filter(Road.status.in_(["FLOODED", "CLOSED", "AT_RISK"])).count()
    facilities_at_risk = db.query(CriticalFacility).filter(CriticalFacility.accessibility_status.in_(["AT_RISK", "AFFECTED"])).count()
    open_tasks = db.query(Task).filter(Task.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS"])).count()
    avail_teams = db.query(EmergencyTeam).filter(EmergencyTeam.current_status == "AVAILABLE").count()

    weather = weather_service.fetch_live_weather()

    return {
        "current_overall_risk": overall_risk,
        "risk_score_average": round(avg_score, 1),
        "high_risk_wards_count": high_wards,
        "critical_wards_count": crit_wards,
        "active_incidents_count": active_incidents,
        "pending_reports_count": pending_reports,
        "affected_roads_count": affected_roads,
        "critical_facilities_at_risk_count": facilities_at_risk,
        "open_tasks_count": open_tasks,
        "available_emergency_teams": avail_teams,
        "weather_summary": f"{weather['description']} ({weather['rainfall_rate']} mm/hr)",
        "data_mode": settings.DATA_MODE.upper(),
        "last_updated": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

@router.get("/charts")
def get_historical_charts(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        return get_regional_charts(lat, lng)

    # Incidents by ward
    wards = db.query(Ward).all()
    incidents_by_ward = []
    for w in wards:
        c = db.query(Incident).filter(Incident.ward_id == w.id).count()
        incidents_by_ward.append({"ward": w.name.split(" - ")[-1], "count": c, "risk": w.current_risk_score})

    # Reports by type
    reports = db.query(FloodReport).all()
    type_counts = {}
    for r in reports:
        type_counts[r.report_type] = type_counts.get(r.report_type, 0) + 1
    reports_by_type = [{"type": k.replace("_", " ").title(), "count": v} for k, v in type_counts.items()]

    # Road condition breakdown
    roads = db.query(Road).all()
    road_statuses = {}
    for r in roads:
        road_statuses[r.status] = road_statuses.get(r.status, 0) + 1
    roads_breakdown = [{"status": k, "count": v} for k, v in road_statuses.items()]

    # Recurring hotspots (Section 44)
    hotspots = [
        {"name": "Ward 101 Estuary Outfall", "events": 5, "severity": "CRITICAL", "last_event": "2024 Monsoon", "ward_code": "WARD-101"},
        {"name": "Ward 103 Adyar Causeway", "events": 6, "severity": "CRITICAL", "last_event": "2025 Cyclone", "ward_code": "WARD-103"},
        {"name": "Ward 102 Central Commercial Sub-basin", "events": 4, "severity": "HIGH", "last_event": "2025 Flash Rain", "ward_code": "WARD-102"},
        {"name": "Ward 104 Railway Junction Underpass", "events": 2, "severity": "MODERATE", "last_event": "2025 Storm", "ward_code": "WARD-104"}
    ]

    # Historical timeline events
    events = db.query(FloodEvent).all()
    event_timeline = []
    for e in events:
        event_timeline.append({
            "id": e.id,
            "event_name": e.event_name,
            "date": e.start_time.strftime("%b %Y"),
            "affected_area": e.affected_area,
            "severity": e.severity,
            "description": e.description
        })

    return {
        "incidents_by_ward": incidents_by_ward,
        "reports_by_type": reports_by_type,
        "roads_breakdown": roads_breakdown,
        "hotspots": hotspots,
        "event_timeline": event_timeline,
        "avg_task_response_minutes": 24.5
    }

@router.get("/export/csv")
def export_csv_summary(
    dataset: str = "reports",
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    CSV export for operational reporting (Section 69)
    """
    output = io.StringIO()
    writer = csv.writer(output)

    if is_regional(lat, lng):
        if dataset == "roads":
            from .roads import fetch_live_osm_roads
            rds = fetch_live_osm_roads(lat, lng)
            writer.writerow(["Road ID", "Name", "Code", "Type", "Status", "Risk Score", "Ward Name", "Last Verified"])
            for r in rds:
                writer.writerow([r["id"], r["road_name"], r["road_code"], r["road_type"], r["status"], r["flood_risk"], r["ward_name"], r["last_verified_at"]])
            filename = "regional_roads_status.csv"
        elif dataset == "incidents":
            incs = get_regional_incidents(lat, lng)
            writer.writerow(["Incident ID", "Code", "Type", "Title", "Priority", "Status", "Ward Name", "Created At"])
            for i in incs:
                writer.writerow([i["id"], i["incident_code"], i["incident_type"], i["title"], i["priority"], i["status"], i["ward_name"], i["created_at"]])
            filename = "regional_incidents.csv"
        else:  # reports
            rpts = get_regional_reports(lat, lng)
            writer.writerow(["Report Code", "Type", "Severity", "Water Level", "Latitude", "Longitude", "Status", "Reported At"])
            for r in rpts:
                writer.writerow([r["report_code"], r["report_type"], r["severity"], r["reported_water_level"], r["latitude"], r["longitude"], r["verification_status"], r["reported_at"]])
            filename = "regional_citizen_reports.csv"
    else:
        if dataset == "roads":
            roads = db.query(Road).all()
            writer.writerow(["Road ID", "Name", "Code", "Type", "Status", "Risk Score", "Ward ID", "Last Verified"])
            for r in roads:
                writer.writerow([r.id, r.road_name, r.road_code, r.road_type, r.status, r.flood_risk, r.ward_id, r.last_verified_at])
            filename = "roads_operational_status.csv"
        elif dataset == "incidents":
            incidents = db.query(Incident).all()
            writer.writerow(["Incident ID", "Code", "Type", "Title", "Priority", "Status", "Ward ID", "Created At"])
            for i in incidents:
                writer.writerow([i.id, i.incident_code, i.incident_type, i.title, i.priority, i.status, i.ward_id, i.created_at])
            filename = "emergency_incidents.csv"
        else:  # reports
            reports = db.query(FloodReport).all()
            writer.writerow(["Report Code", "Type", "Severity", "Water Level", "Latitude", "Longitude", "Status", "Reported At"])
            for r in reports:
                writer.writerow([r.report_code, r.report_type, r.severity, r.reported_water_level, r.latitude, r.longitude, r.verification_status, r.reported_at])
            filename = "citizen_flood_reports.csv"

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/audit")
def get_audit_logs(
    limit: int = 25,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        return get_regional_audit_logs(lat, lng, limit)

    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user": l.user,
            "action": l.action,
            "record": l.record,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        }
        for l in logs
    ]
