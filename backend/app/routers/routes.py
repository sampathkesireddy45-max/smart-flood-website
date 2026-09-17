from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import Road, DrainageAsset, FloodReport
from ..schemas import RouteRequest, RouteResponse
from ..routing_engine import routing_engine

router = APIRouter(prefix="/routes", tags=["Flood-Aware Safe Routing"])

@router.post("", response_model=RouteResponse)
def calculate_route(req: RouteRequest, db: Session = Depends(get_db)):
    roads = db.query(Road).all()

    # 1. Collect drainage leakage & blocked drain hazards
    drainage_hazards: List[Dict[str, Any]] = []

    # Drainage assets with poor or compromised condition
    drain_assets = db.query(DrainageAsset).filter(
        DrainageAsset.condition.in_(["POOR", "INSPECTION_REQUIRED", "FAIR"])
    ).all()
    for d in drain_assets:
        drainage_hazards.append({
            "name": f"{d.asset_code} ({d.asset_type}) at {d.location}",
            "latitude": d.latitude,
            "longitude": d.longitude,
            "type": "DRAINAGE_ASSET",
            "condition": d.condition,
            "description": f"Compromised drain condition: {d.condition} (Capacity: {d.capacity})"
        })

    # Citizen-reported blocked drains and waterlogging
    blocked_reports = db.query(FloodReport).filter(
        FloodReport.report_type.in_(["BLOCKED_DRAIN", "WATERLOGGING"]),
        FloodReport.verification_status != "REJECTED"
    ).all()
    for r in blocked_reports:
        drainage_hazards.append({
            "name": f"Blocked Drain ({r.report_code}): {r.description[:35]}",
            "latitude": r.latitude,
            "longitude": r.longitude,
            "type": "CITIZEN_REPORT",
            "condition": r.reported_water_level or "CLOGGED",
            "description": r.description
        })

    # 2. Collect flood hazards (citizen active flooding reports)
    flood_hazards: List[Dict[str, Any]] = []
    flood_reports = db.query(FloodReport).filter(
        FloodReport.report_type == "FLOODING",
        FloodReport.verification_status != "REJECTED"
    ).all()
    for fr in flood_reports:
        flood_hazards.append({
            "name": f"Flood Incident ({fr.report_code}): {fr.description[:35]}",
            "latitude": fr.latitude,
            "longitude": fr.longitude,
            "type": "CITIZEN_FLOOD",
            "severity": "CRITICAL" if "submerged" in (fr.reported_water_level or "").lower() else "HIGH",
            "description": f"{fr.description} (Depth: {fr.reported_water_level})"
        })

    route_result = routing_engine.calculate_lower_risk_route(
        roads=roads,
        drainage_hazards=drainage_hazards,
        flood_hazards=flood_hazards,
        orig_lat=req.origin_lat,
        orig_lng=req.origin_lng,
        dest_lat=req.dest_lat,
        dest_lng=req.dest_lng,
        avoid_flooded=req.avoid_floods,
        avoid_drainage_leakage=req.avoid_drainage_leakage,
        mode=req.mode
    )

    return route_result
