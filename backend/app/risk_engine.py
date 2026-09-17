from typing import Dict, Any, List, Optional
from datetime import datetime
from .config import settings

class FloodRiskEngine:
    """
    Explainable Decision-Support Flood Risk Engine.
    Implements multi-criteria weighted factor decomposition:
    Risk = w_rain*S_rain + w_terrain*S_terrain + w_drain*S_drain + w_hist*S_hist + w_obs*S_obs
    """

    def __init__(self):
        self.weights = {
            "rainfall": settings.WEIGHT_RAINFALL,
            "terrain": settings.WEIGHT_TERRAIN,
            "drainage": settings.WEIGHT_DRAINAGE,
            "historical": settings.WEIGHT_HISTORICAL,
            "observation": settings.WEIGHT_OBSERVATION,
        }
        self.version = "v2.4-hybrid-configurable"

    def calculate_ward_risk(
        self,
        ward_name: str,
        ward_code: str,
        elevation_m: float,
        drainage_capacity_pct: float,
        historical_flood_count: int,
        rainfall_rate_mm_hr: float,
        cumulative_rainfall_mm: float,
        verified_reports_count: int,
        drainage_clog_factor: float = 0.0,
        is_simulated: bool = False
    ) -> Dict[str, Any]:
        
        # 1. Rainfall Factor (0 - 100)
        # 0 mm/hr -> 0; 25 mm/hr -> 50; 50+ mm/hr -> 100
        effective_rain = rainfall_rate_mm_hr + (cumulative_rainfall_mm * 0.2)
        rainfall_score = min(100.0, (effective_rain / 55.0) * 100.0)

        # 2. Terrain / Elevation Factor (0 - 100)
        # Low lying (< 3m) = 90+ risk; High elevation (> 20m) = 10 risk
        if elevation_m <= 2.0:
            terrain_score = 95.0
        elif elevation_m <= 4.0:
            terrain_score = 80.0
        elif elevation_m <= 8.0:
            terrain_score = 55.0
        elif elevation_m <= 15.0:
            terrain_score = 30.0
        else:
            terrain_score = 12.0

        # 3. Drainage Inefficiency Factor (0 - 100)
        # Lower capacity or clogged = higher risk
        effective_drain_capacity = max(0.0, drainage_capacity_pct * (1.0 - drainage_clog_factor))
        drainage_score = max(0.0, 100.0 - effective_drain_capacity)

        # 4. Historical Hotspot Factor (0 - 100)
        # 0 events -> 10; 5+ events -> 90+
        historical_score = min(100.0, 15.0 + (historical_flood_count * 16.0))

        # 5. Field & Citizen Observation Factor (0 - 100)
        # Active verified citizen reports elevate risk instantly
        observation_score = min(100.0, verified_reports_count * 30.0)

        # Normalize weights
        total_weight = sum(self.weights.values())
        w_rain = self.weights["rainfall"] / total_weight
        w_terr = self.weights["terrain"] / total_weight
        w_drain = self.weights["drainage"] / total_weight
        w_hist = self.weights["historical"] / total_weight
        w_obs = self.weights["observation"] / total_weight

        # Weighted score
        total_score = (
            w_rain * rainfall_score +
            w_terr * terrain_score +
            w_drain * drainage_score +
            w_hist * historical_score +
            w_obs * observation_score
        )

        total_score = round(min(100.0, max(0.0, total_score)), 1)
        risk_level = self.determine_level(total_score)

        factors = [
            {
                "name": "Precipitation & Inundation Index",
                "score": round(rainfall_score, 1),
                "weight": round(w_rain * 100, 1),
                "contribution": round(w_rain * rainfall_score, 1),
                "source": "Open-Meteo Telemetry (Live)" if not is_simulated else "Scenario Simulation Input",
                "description": f"Rainfall rate: {rainfall_rate_mm_hr:.1f} mm/hr, 24h cumulative: {cumulative_rainfall_mm:.1f} mm"
            },
            {
                "name": "Digital Elevation & Basin Relief",
                "score": round(terrain_score, 1),
                "weight": round(w_terr * 100, 1),
                "contribution": round(w_terr * terrain_score, 1),
                "source": "Municipal GIS Elevation Survey",
                "description": f"Mean ward elevation {elevation_m:.1f}m above sea level"
            },
            {
                "name": "Stormwater & Canal Drainage Capacity",
                "score": round(drainage_score, 1),
                "weight": round(w_drain * 100, 1),
                "contribution": round(w_drain * drainage_score, 1),
                "source": "Drainage Asset Database & Asset Condition",
                "description": f"Drain network capacity efficiency: {effective_drain_capacity:.1f}%"
            },
            {
                "name": "Historical Vulnerability Hotspot",
                "score": round(historical_score, 1),
                "weight": round(w_hist * 100, 1),
                "contribution": round(w_hist * historical_score, 1),
                "source": "Historical Flood Events Register (10-Year)",
                "description": f"Recorded recurring inundation incidents: {historical_flood_count} events"
            },
            {
                "name": "Verified Citizen & Field Observations",
                "score": round(observation_score, 1),
                "weight": round(w_obs * 100, 1),
                "contribution": round(w_obs * observation_score, 1),
                "source": "Citizen Ground Submissions & Field Inspections",
                "description": f"Active verified waterlogging/flood reports: {verified_reports_count}"
            }
        ]

        return {
            "ward_name": ward_name,
            "ward_code": ward_code,
            "score": total_score,
            "risk_level": risk_level,
            "calculated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "methodology_version": self.version,
            "is_simulated": is_simulated,
            "contributing_factors": factors
        }

    def determine_level(self, score: float) -> str:
        if score >= 75.0:
            return "CRITICAL"
        elif score >= 55.0:
            return "HIGH"
        elif score >= 35.0:
            return "MODERATE"
        else:
            return "LOW"

risk_engine = FloodRiskEngine()
