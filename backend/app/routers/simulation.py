import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import Ward, Road, CriticalFacility
from ..schemas import SimulationRequest
from ..risk_engine import risk_engine

router = APIRouter(prefix="/simulation", tags=["What-If Flood Simulation"])

@router.post("/run")
def run_what_if_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    """
    Computes What-If Flood Simulation scenario based on custom rainfall intensity and duration.
    Specification Rule: Must be explicitly labelled 'Scenario simulation'.
    """
    total_precip_mm = req.rainfall_rate * req.rainfall_duration_hours
    wards = db.query(Ward).all()
    if req.selected_ward_id:
        wards = [w for w in wards if w.id == req.selected_ward_id]

    simulation_results = []
    simulated_roads_affected = 0
    simulated_facilities_at_risk = 0

    for w in wards:
        calc = risk_engine.calculate_ward_risk(
            ward_name=w.name,
            ward_code=w.code,
            elevation_m=w.elevation_meters,
            drainage_capacity_pct=w.drainage_capacity_pct,
            historical_flood_count=w.historical_flood_count,
            rainfall_rate_mm_hr=req.rainfall_rate,
            cumulative_rainfall_mm=total_precip_mm,
            verified_reports_count=3 if req.rainfall_rate > 30 else 1,
            drainage_clog_factor=req.drainage_clog_factor,
            is_simulated=True
        )

        sim_score = calc["score"]
        sim_level = calc["risk_level"]

        # Estimate roads affected in this ward under this scenario
        w_roads = db.query(Road).filter(Road.ward_id == w.id).all()
        for r in w_roads:
            if sim_score > 60:
                simulated_roads_affected += 1

        # Estimate facility risk
        w_facilities = db.query(CriticalFacility).all()
        for f in w_facilities:
            if sim_score > 70:
                simulated_facilities_at_risk += 1

        simulation_results.append({
            "ward_id": w.id,
            "ward_name": w.name,
            "ward_code": w.code,
            "baseline_score": w.current_risk_score,
            "simulated_score": sim_score,
            "delta": round(sim_score - w.current_risk_score, 1),
            "simulated_risk_level": sim_level,
            "contributing_factors": calc["contributing_factors"]
        })

    return {
        "status": "SCENARIO_SIMULATION",
        "disclaimer": "Scenario simulation (prototype model) — not an actual forecast. For decision support.",
        "input_parameters": {
            "rainfall_rate_mm_hr": req.rainfall_rate,
            "rainfall_duration_hours": req.rainfall_duration_hours,
            "total_simulated_precipitation_mm": round(total_precip_mm, 1),
            "drainage_clog_factor_pct": int(req.drainage_clog_factor * 100)
        },
        "wards": simulation_results,
        "estimated_affected_roads": simulated_roads_affected,
        "estimated_facilities_at_risk": simulated_facilities_at_risk
    }
