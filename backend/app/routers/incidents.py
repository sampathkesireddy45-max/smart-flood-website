import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import Incident, EmergencyTeam, AuditLog
from ..schemas import IncidentCreate
from ..regional_data import is_regional, get_regional_incidents

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

class IncidentStatusUpdate(BaseModel):
    status: str  # NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
    changed_by: str
    priority: Optional[str] = None
    assigned_team_id: Optional[int] = None

@router.get("")
def list_incidents(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        regional_incs = get_regional_incidents(lat, lng)
        if status and status.upper() != "ALL":
            regional_incs = [i for i in regional_incs if i["status"] == status.upper()]
        if priority and priority.upper() != "ALL":
            regional_incs = [i for i in regional_incs if i["priority"] == priority.upper()]
        return regional_incs

    query = db.query(Incident)
    if status and status.upper() != "ALL":
        query = query.filter(Incident.status == status.upper())
    if priority and priority.upper() != "ALL":
        query = query.filter(Incident.priority == priority.upper())

    incidents = query.order_by(Incident.created_at.desc()).all()
    results = []
    for inc in incidents:
        results.append({
            "id": inc.id,
            "incident_code": inc.incident_code,
            "incident_type": inc.incident_type,
            "title": inc.title,
            "description": inc.description,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "ward_name": inc.ward.name if inc.ward else "Urban Core",
            "priority": inc.priority,
            "system_recommended_priority": inc.system_recommended_priority,
            "status": inc.status,
            "created_by": inc.created_by,
            "assigned_team_name": inc.team.team_name if inc.team else "Unassigned",
            "created_at": inc.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if inc.created_at else "Now",
            "resolved_at": inc.resolved_at.strftime("%Y-%m-%d %H:%M:%S UTC") if inc.resolved_at else None
        })
    return results

@router.post("")
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    code_num = random.randint(100, 999)
    inc_code = f"INC-2026-{code_num}"

    incident = Incident(
        incident_code=inc_code,
        incident_type=payload.incident_type,
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        ward_id=payload.ward_id or 1,
        priority=payload.priority,
        system_recommended_priority=payload.priority,
        status="NEW",
        source_report_id=payload.source_report_id,
        created_by=payload.created_by,
        assigned_team_id=payload.assigned_team_id
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    audit = AuditLog(
        user=payload.created_by,
        action="INCIDENT_CREATED",
        record=f"{incident.incident_code} ({incident.title})",
        old_value=None,
        new_value=incident.priority
    )
    db.add(audit)
    db.commit()

    return {"message": "Incident logged successfully", "incident_id": incident.id, "incident_code": incident.incident_code}

@router.patch("/{incident_id}/status")
def update_incident_status(incident_id: int, payload: IncidentStatusUpdate, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = inc.status
    inc.status = payload.status.upper()
    if payload.priority:
        inc.priority = payload.priority.upper()
    if payload.assigned_team_id:
        inc.assigned_team_id = payload.assigned_team_id

    if payload.status.upper() in ["RESOLVED", "CLOSED"]:
        inc.resolved_at = datetime.utcnow()

    audit = AuditLog(
        user=payload.changed_by,
        action="INCIDENT_STATUS_CHANGE",
        record=inc.incident_code,
        old_value=old_status,
        new_value=inc.status
    )
    db.add(audit)
    db.commit()

    return {"message": f"Incident {inc.incident_code} updated to {inc.status}"}
