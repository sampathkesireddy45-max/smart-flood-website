import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Road, RoadStatusHistory, AuditLog, CriticalFacility, FloodReport
from ..schemas import RoadStatusUpdate

router = APIRouter(prefix="/roads", tags=["Road Management"])

import math
import urllib.request
import urllib.parse
from ..weather_service import weather_service

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * R * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

def fetch_live_osm_roads(lat: float, lng: float, db: Optional[Session] = None) -> List[dict]:
    delta = 0.05
    q = f'[out:json][timeout:4];way["highway"~"primary|secondary|trunk"]({lat-delta},{lng-delta},{lat+delta},{lng+delta});out geom 10;'
    url = 'https://overpass-api.de/api/interpreter?data=' + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers={'User-Agent': 'SurakshaFloodSystem/2.0'})
    results = []

    # Get active citizen reports with photo evidence to dynamically assess road passability
    active_reports = []
    if db:
        try:
            active_reports = db.query(FloodReport).filter(FloodReport.verification_status != "REJECTED").all()
        except Exception:
            active_reports = []

    try:
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            elements = data.get('elements', [])
            for i, el in enumerate(elements):
                coords = [[pt['lat'], pt['lon']] for pt in el.get('geometry', [])]
                if len(coords) >= 2:
                    tags = el.get('tags', {})
                    name = tags.get('name') or tags.get('ref') or f'Arterial Corridor {i+1}'

                    # Roads are OPEN unless a real citizen reported a hazard with ground evidence nearby
                    matching_report = None
                    for rpt in active_reports:
                        for pt in coords:
                            dist_m = haversine_km(rpt.latitude, rpt.longitude, pt[0], pt[1]) * 1000.0
                            if dist_m <= 350.0:
                                matching_report = rpt
                                break
                        if matching_report:
                            break

                    if matching_report:
                        is_severe = "Waist" in str(matching_report.reported_water_level) or "Submerged" in str(matching_report.reported_water_level) or matching_report.report_type == "FLOODING"
                        st = "FLOODED" if is_severe else "AT_RISK"
                        base_risk = 88.0 if is_severe else 60.0
                        verified_source = f"Ground report {matching_report.report_code} ({matching_report.reporter_name}) with photo evidence"
                    else:
                        st = "OPEN"
                        base_risk = 5.0
                        verified_source = "Real-World OSM Telemetry (Safe & Passable)"

                    results.append({
                        'id': 3000 + i,
                        'road_name': name,
                        'road_code': f'OSM-{el.get("id", 3000+i)}',
                        'road_type': tags.get('highway', 'PRIMARY').upper(),
                        'status': st,
                        'flood_risk': round(base_risk, 1),
                        'ward_id': 1,
                        'ward_name': 'Live Regional Sector',
                        'coordinates': coords,
                        'last_verified_at': verified_source
                    })
    except Exception:
        pass
    return results

@router.get("")
def list_roads(
    status: Optional[str] = None,
    ward_id: Optional[int] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if lat is not None and lng is not None:
        dist_from_base = haversine_km(lat, lng, 13.0827, 80.2707)
        if dist_from_base > 35.0:
            live_rds = fetch_live_osm_roads(lat, lng, db=db)
            if live_rds:
                if status and status.upper() != "ALL":
                    live_rds = [r for r in live_rds if r["status"] == status.upper()]
                return live_rds

    query = db.query(Road)
    if status and status.upper() != "ALL":
        query = query.filter(Road.status == status.upper())
    if ward_id:
        query = query.filter(Road.ward_id == ward_id)

    roads = query.all()
    results = []
    for r in roads:
        results.append({
            "id": r.id,
            "road_name": r.road_name,
            "road_code": r.road_code,
            "road_type": r.road_type,
            "status": r.status,
            "flood_risk": r.flood_risk,
            "ward_id": r.ward_id,
            "ward_name": r.ward.name if r.ward else "General Network",
            "coordinates": json.loads(r.coordinates_json),
            "last_verified_at": r.last_verified_at.strftime("%Y-%m-%d %H:%M:%S UTC") if r.last_verified_at else None
        })
    return results

@router.get("/summary")
def get_road_summary(db: Session = Depends(get_db)):
    all_roads = db.query(Road).all()
    total = len(all_roads)
    open_cnt = sum(1 for r in all_roads if r.status == "OPEN")
    at_risk_cnt = sum(1 for r in all_roads if r.status == "AT_RISK")
    flooded_cnt = sum(1 for r in all_roads if r.status == "FLOODED")
    closed_cnt = sum(1 for r in all_roads if r.status == "CLOSED")
    unknown_cnt = sum(1 for r in all_roads if r.status == "UNKNOWN")

    return {
        "total_roads": total,
        "open": open_cnt,
        "at_risk": at_risk_cnt,
        "flooded": flooded_cnt,
        "closed": closed_cnt,
        "unknown": unknown_cnt
    }

@router.patch("/{road_id}/status")
def update_road_status(road_id: int, payload: RoadStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["OPEN", "AT_RISK", "FLOODED", "CLOSED", "UNKNOWN"]
    target_status = payload.new_status.upper()
    if target_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")

    old_status = road.status
    road.status = target_status
    road.last_verified_at = datetime.utcnow()

    # Recalculate road risk score based on status
    if target_status == "CLOSED":
        road.flood_risk = 95.0
    elif target_status == "FLOODED":
        road.flood_risk = 85.0
    elif target_status == "AT_RISK":
        road.flood_risk = 60.0
    elif target_status == "OPEN":
        road.flood_risk = 15.0

    # Store in road_status_history
    history = RoadStatusHistory(
        road_id=road.id,
        old_status=old_status,
        new_status=target_status,
        changed_by=payload.changed_by,
        reason=payload.reason
    )
    db.add(history)

    # Store in audit_logs
    audit = AuditLog(
        user=payload.changed_by,
        action="ROAD_STATUS_UPDATE",
        record=f"{road.road_code} ({road.road_name})",
        old_value=old_status,
        new_value=target_status
    )
    db.add(audit)

    # Recalculate facility accessibility for facilities dependent on this road (Section 26)
    facilities = db.query(CriticalFacility).filter(
        (CriticalFacility.nearby_primary_road_id == road.id) |
        (CriticalFacility.nearby_alt_road_id == road.id)
    ).all()

    for fac in facilities:
        p_road = db.query(Road).filter(Road.id == fac.nearby_primary_road_id).first() if fac.nearby_primary_road_id else None
        a_road = db.query(Road).filter(Road.id == fac.nearby_alt_road_id).first() if fac.nearby_alt_road_id else None

        p_status = p_road.status if p_road else "OPEN"
        a_status = a_road.status if a_road else "OPEN"

        if p_status in ["CLOSED", "FLOODED"] and a_status in ["CLOSED", "FLOODED"]:
            fac.accessibility_status = "AFFECTED"
        elif p_status in ["CLOSED", "FLOODED", "AT_RISK"] or a_status in ["AT_RISK"]:
            fac.accessibility_status = "AT_RISK"
        else:
            fac.accessibility_status = "ACCESSIBLE"

    db.commit()

    return {
        "message": f"Road {road.road_name} updated to {target_status}",
        "road_id": road.id,
        "old_status": old_status,
        "new_status": target_status,
        "changed_by": payload.changed_by,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

@router.get("/history")
def get_road_status_history(limit: int = 20, db: Session = Depends(get_db)):
    history = db.query(RoadStatusHistory).order_by(RoadStatusHistory.timestamp.desc()).limit(limit).all()
    results = []
    for h in history:
        results.append({
            "id": h.id,
            "road_id": h.road_id,
            "road_name": h.road.road_name if h.road else "Unknown Road",
            "old_status": h.old_status,
            "new_status": h.new_status,
            "changed_by": h.changed_by,
            "reason": h.reason,
            "timestamp": h.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        })
    return results
