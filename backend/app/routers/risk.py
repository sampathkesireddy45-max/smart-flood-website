import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from ..models import Ward, FloodReport
from ..schemas import WardRiskResponse, WardItem
from ..risk_engine import risk_engine
from ..weather_service import weather_service
from ..regional_data import is_regional, get_regional_wards, get_approx_city_name

router = APIRouter(prefix="/risk", tags=["Flood Risk Engine"])

@router.get("/areas")
def get_all_areas_risk(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        weather = weather_service.fetch_live_weather(lat, lng)
        rain_rate = weather.get("rainfall_rate", 0.0) if weather else 0.0
        return get_regional_wards(lat, lng, rain_rate)

    wards = db.query(Ward).all()
    results = []
    for w in wards:
        factors = json.loads(w.risk_factors_json) if w.risk_factors_json else []
        boundary = json.loads(w.boundary_geojson) if w.boundary_geojson else []
        results.append({
            "id": w.id,
            "name": w.name,
            "code": w.code,
            "center_lat": w.center_lat,
            "center_lng": w.center_lng,
            "elevation_meters": w.elevation_meters,
            "drainage_capacity_pct": w.drainage_capacity_pct,
            "historical_flood_count": w.historical_flood_count,
            "current_risk_score": w.current_risk_score,
            "current_risk_level": w.current_risk_level,
            "boundary": boundary,
            "contributing_factors": factors,
            "methodology_version": risk_engine.version
        })
    return results

@router.get("/wards/{ward_id}", response_model=WardRiskResponse)
def get_ward_risk_detail(
    ward_id: int,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if ward_id >= 800 or is_regional(lat, lng):
        ref_lat = lat or 17.6871
        ref_lng = lng or 83.2290
        city = get_approx_city_name(ref_lat, ref_lng)
        wth = weather_service.fetch_live_weather(ref_lat, ref_lng)
        rain_rate = wth.get("rainfall_rate", 0.0) if wth else 0.0
        reg_wards = get_regional_wards(ref_lat, ref_lng, rain_rate)
        matched = next((w for w in reg_wards if w["id"] == ward_id), reg_wards[0])
        return {
            "ward_id": matched["id"],
            "ward_name": matched["name"],
            "ward_code": matched["code"],
            "score": matched["current_risk_score"],
            "risk_level": matched["current_risk_level"],
            "calculated_at": "Just now (Regional Live)",
            "methodology_version": "2.4-Regional",
            "is_simulated": False,
            "contributing_factors": matched["contributing_factors"]
        }

    w = db.query(Ward).filter(Ward.id == ward_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Ward not found")

    factors = json.loads(w.risk_factors_json) if w.risk_factors_json else []
    return {
        "ward_id": w.id,
        "ward_name": w.name,
        "ward_code": w.code,
        "score": w.current_risk_score,
        "risk_level": w.current_risk_level,
        "calculated_at": w.updated_at.strftime("%Y-%m-%d %H:%M:%S UTC") if w.updated_at else "Just now",
        "methodology_version": risk_engine.version,
        "is_simulated": False,
        "contributing_factors": factors
    }

@router.post("/recalculate")
def recalculate_all_risks(db: Session = Depends(get_db)):
    weather = weather_service.fetch_live_weather()
    rain_rate = weather["rainfall_rate"]
    cum_rain = weather["cumulative_24h"]

    wards = db.query(Ward).all()
    for w in wards:
        # Count active verified reports in this ward
        verified_count = db.query(FloodReport).filter(
            FloodReport.ward_id == w.id,
            FloodReport.verification_status == "VERIFIED"
        ).count()

        calc = risk_engine.calculate_ward_risk(
            ward_name=w.name,
            ward_code=w.code,
            elevation_m=w.elevation_meters,
            drainage_capacity_pct=w.drainage_capacity_pct,
            historical_flood_count=w.historical_flood_count,
            rainfall_rate_mm_hr=rain_rate,
            cumulative_rainfall_mm=cum_rain,
            verified_reports_count=verified_count
        )
        w.current_risk_score = calc["score"]
        w.current_risk_level = calc["risk_level"]
        w.risk_factors_json = json.dumps(calc["contributing_factors"])

    db.commit()
    return {"message": "All ward risks successfully recalculated from live data", "rain_rate": rain_rate, "cumulative_24h": cum_rain}

@router.get("/config")
def get_risk_weights():
    return {
        "weights": risk_engine.weights,
        "model_version": risk_engine.version,
        "category_thresholds": {
            "LOW": "0 - 34",
            "MODERATE": "35 - 54",
            "HIGH": "55 - 74",
            "CRITICAL": "75 - 100"
        },
        "description": "Multi-criteria weighted flood hazard model configured for urban drainage basin."
    }
