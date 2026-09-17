from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import DrainageAsset, AuditLog
from ..regional_data import is_regional, get_regional_drainage

router = APIRouter(prefix="/drainage", tags=["Drainage Management"])

class DrainageConditionUpdate(BaseModel):
    condition: str  # GOOD, FAIR, POOR, INSPECTION_REQUIRED, UNKNOWN
    notes: Optional[str] = None
    inspector_name: str

@router.get("")
def list_drainage_assets(
    ward_id: Optional[int] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        assets = get_regional_drainage(lat, lng)
        if ward_id:
            assets = [a for a in assets if a["ward_id"] == ward_id]
        return assets

    query = db.query(DrainageAsset)
    if ward_id:
        query = query.filter(DrainageAsset.ward_id == ward_id)
    assets = query.all()
    results = []
    for a in assets:
        results.append({
            "id": a.id,
            "asset_code": a.asset_code,
            "asset_type": a.asset_type,
            "location": a.location,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "capacity": a.capacity,
            "condition": a.condition,
            "notes": a.notes,
            "ward_id": a.ward_id,
            "ward_name": a.ward.name if a.ward else "General Zone",
            "last_inspection_at": a.last_inspection_at.strftime("%Y-%m-%d %H:%M:%S UTC") if a.last_inspection_at else "Never",
            "next_inspection_at": a.next_inspection_at.strftime("%Y-%m-%d %H:%M:%S UTC") if a.next_inspection_at else "Scheduled"
        })
    return results

@router.get("/summary")
def get_drainage_summary(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        all_assets = get_regional_drainage(lat, lng)
        return {
            "total_assets": len(all_assets),
            "inspection_required": sum(1 for a in all_assets if a["condition"] == "INSPECTION_REQUIRED"),
            "poor_condition": sum(1 for a in all_assets if a["condition"] == "POOR"),
            "fair_condition": sum(1 for a in all_assets if a["condition"] == "FAIR"),
            "good_condition": sum(1 for a in all_assets if a["condition"] == "GOOD")
        }

    all_assets = db.query(DrainageAsset).all()
    total = len(all_assets)
    inspection_required = sum(1 for a in all_assets if a.condition == "INSPECTION_REQUIRED")
    poor_condition = sum(1 for a in all_assets if a.condition == "POOR")
    fair_condition = sum(1 for a in all_assets if a.condition == "FAIR")
    good_condition = sum(1 for a in all_assets if a.condition == "GOOD")

    return {
        "total_assets": total,
        "inspection_required": inspection_required,
        "poor_condition": poor_condition,
        "fair_condition": fair_condition,
        "good_condition": good_condition
    }

@router.patch("/{asset_id}/condition")
def update_drainage_condition(asset_id: int, payload: DrainageConditionUpdate, db: Session = Depends(get_db)):
    asset = db.query(DrainageAsset).filter(DrainageAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Drainage asset not found")

    old_cond = asset.condition
    asset.condition = payload.condition.upper()
    if payload.notes:
        asset.notes = payload.notes
    asset.last_inspection_at = datetime.utcnow()

    audit = AuditLog(
        user=payload.inspector_name,
        action="DRAINAGE_CONDITION_UPDATE",
        record=f"{asset.asset_code} ({asset.location})",
        old_value=old_cond,
        new_value=payload.condition.upper()
    )
    db.add(audit)
    db.commit()

    return {"message": f"Asset {asset.asset_code} condition updated to {asset.condition}"}
