from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import EmergencyResource, EmergencyTeam, Incident

router = APIRouter(prefix="/resources", tags=["Emergency Resources"])

class ResourceStatusUpdate(BaseModel):
    status: str  # AVAILABLE, DEPLOYED, MAINTENANCE
    location: Optional[str] = None
    assigned_incident_id: Optional[int] = None

@router.get("")
def list_resources(db: Session = Depends(get_db)):
    resources = db.query(EmergencyResource).all()
    results = []
    for r in resources:
        results.append({
            "id": r.id,
            "resource_name": r.resource_name,
            "type": r.type,
            "status": r.status,
            "location": r.location,
            "assigned_incident_id": r.assigned_incident_id
        })
    return results

@router.get("/teams")
def list_teams(db: Session = Depends(get_db)):
    teams = db.query(EmergencyTeam).all()
    results = []
    for t in teams:
        results.append({
            "id": t.id,
            "team_name": t.team_name,
            "team_type": t.team_type,
            "current_status": t.current_status,
            "current_location": t.current_location,
            "contact_information": t.contact_information
        })
    return results

@router.patch("/{resource_id}")
def update_resource(resource_id: int, payload: ResourceStatusUpdate, db: Session = Depends(get_db)):
    r = db.query(EmergencyResource).filter(EmergencyResource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")
    r.status = payload.status.upper()
    if payload.location:
        r.location = payload.location
    if payload.assigned_incident_id is not None:
        r.assigned_incident_id = payload.assigned_incident_id
    db.commit()
    return {"message": f"Resource {r.resource_name} status updated to {r.status}"}
