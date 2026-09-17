from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

# Auth schemas
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Weather schemas
class WeatherCurrentResponse(BaseModel):
    temperature: float
    rainfall_rate: float  # mm/hr
    cumulative_24h: float
    precipitation_probability: float
    weather_code: int
    description: str
    source: str
    last_updated: str
    status: str
    is_live: bool

class WeatherForecastItem(BaseModel):
    time: str
    temperature: float
    precipitation_probability: float
    rainfall: float
    description: str

class WeatherForecastResponse(BaseModel):
    source: str
    last_updated: str
    status: str
    forecasts: List[WeatherForecastItem]

# Risk schemas
class ContributingFactor(BaseModel):
    name: str
    score: float
    weight: float
    contribution: float
    source: str
    description: str

class WardRiskResponse(BaseModel):
    ward_id: int
    ward_name: str
    ward_code: str
    score: float
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    calculated_at: str
    methodology_version: str = "v2.4-hybrid-configurable"
    is_simulated: bool = False
    contributing_factors: List[ContributingFactor]

# Ward schema
class WardItem(BaseModel):
    id: int
    name: str
    code: str
    center_lat: float
    center_lng: float
    elevation_meters: float
    drainage_capacity_pct: float
    historical_flood_count: int
    current_risk_score: float
    current_risk_level: str
    boundary_geojson: Any
    class Config:
        from_attributes = True

# Road schemas
class RoadStatusUpdate(BaseModel):
    new_status: str  # OPEN, AT_RISK, FLOODED, CLOSED, UNKNOWN
    changed_by: str
    reason: str

class RoadItem(BaseModel):
    id: int
    road_name: str
    road_code: str
    road_type: str
    coordinates: List[List[float]]
    status: str
    flood_risk: float
    ward_id: Optional[int] = None
    last_verified_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Drainage schemas
class DrainageItem(BaseModel):
    id: int
    asset_code: str
    asset_type: str
    location: str
    latitude: float
    longitude: float
    capacity: str
    condition: str
    last_inspection_at: Optional[datetime] = None
    notes: Optional[str] = None
    ward_id: Optional[int] = None
    class Config:
        from_attributes = True

# Critical Facility schemas
class FacilityItem(BaseModel):
    id: int
    name: str
    facility_type: str
    address: str
    latitude: float
    longitude: float
    contact_information: Optional[str] = None
    direct_flood_risk: str
    accessibility_status: str
    nearby_primary_road_id: Optional[int] = None
    nearby_alt_road_id: Optional[int] = None
    class Config:
        from_attributes = True

# Citizen Flood Report schemas
class FloodReportCreate(BaseModel):
    reporter_name: Optional[str] = "Citizen User"
    reporter_phone: Optional[str] = None
    report_type: str  # FLOODING, WATERLOGGING, BLOCKED_DRAIN, ROAD_OBSTRUCTION, OTHER
    description: str
    latitude: float
    longitude: float
    reported_water_level: Optional[str] = "Ankle deep (10-15cm)"
    photo_url: Optional[str] = None

class FloodReportVerify(BaseModel):
    action: str  # VERIFY or REJECT
    verified_by: str
    notes: Optional[str] = None
    create_incident: Optional[bool] = False
    incident_type: Optional[str] = None
    incident_priority: Optional[str] = "HIGH"

class FloodReportItem(BaseModel):
    id: int
    report_code: str
    reporter_name: str
    reporter_phone: Optional[str] = None
    report_type: str
    description: str
    latitude: float
    longitude: float
    ward_id: Optional[int] = None
    reported_water_level: Optional[str] = None
    photo_url: Optional[str] = None
    reported_at: datetime
    verification_status: str
    severity: str
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    linked_incident_id: Optional[int] = None
    is_grouped_duplicate: bool = False
    class Config:
        from_attributes = True

# Incident schemas
class IncidentCreate(BaseModel):
    title: str
    incident_type: str
    description: str
    latitude: float
    longitude: float
    ward_id: Optional[int] = None
    priority: str = "HIGH"
    source_report_id: Optional[int] = None
    created_by: str = "Authority Command"
    assigned_team_id: Optional[int] = None

class IncidentItem(BaseModel):
    id: int
    incident_code: str
    incident_type: str
    title: str
    description: str
    latitude: float
    longitude: float
    ward_id: Optional[int] = None
    priority: str
    system_recommended_priority: str
    status: str
    source_report_id: Optional[int] = None
    created_by: str
    assigned_team_id: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Task schemas
class TaskCreate(BaseModel):
    title: str
    description: str
    assigned_to: str
    location: str
    latitude: float
    longitude: float
    priority: str = "HIGH"
    incident_id: Optional[int] = None

class TaskStatusUpdate(BaseModel):
    status: str  # IN_PROGRESS, COMPLETED, CANCELLED

class TaskEvidenceSubmit(BaseModel):
    worker_id: str
    observation: str
    verification_result: str  # CONFIRMED, NOT_CONFIRMED, NEEDS_FURTHER_INSPECTION
    photo_url: Optional[str] = None

class TaskItem(BaseModel):
    id: int
    task_code: str
    incident_id: Optional[int] = None
    assigned_to: str
    title: str
    description: str
    priority: str
    status: str
    location: str
    latitude: float
    longitude: float
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Safe Routing schemas
class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    mode: str = "citizen"  # citizen or emergency
    avoid_drainage_leakage: bool = True
    avoid_floods: bool = True
    origin_name: Optional[str] = None
    dest_name: Optional[str] = None

class RouteSegment(BaseModel):
    road_id: int
    road_name: str
    status: str
    risk_score: float
    distance_meters: float

class AvoidedHazard(BaseModel):
    name: str
    hazard_type: str  # "FLOODED_ROAD", "DRAINAGE_LEAKAGE", "BLOCKED_DRAIN", "WATERLOGGING"
    latitude: float
    longitude: float
    severity: str = "HIGH"
    description: Optional[str] = None

class RouteResponse(BaseModel):
    distance_km: float
    direct_distance_km: Optional[float] = None
    detour_delta_km: Optional[float] = 0.0
    is_detour_active: Optional[bool] = False
    estimated_time_minutes: int
    risk_exposure_score: float
    safety_label: str = "Lower-risk route based on available data"
    route_geometry: List[List[float]]
    avoided_roads: List[str]
    avoided_drainage_leakages: List[str] = []
    avoided_hazards: List[AvoidedHazard] = []
    flood_avoidance_rating: str = "Safe Detour"
    traversed_roads: List[RouteSegment]
    warnings: List[str]

# Simulation schema
class SimulationRequest(BaseModel):
    rainfall_rate: float = Field(..., ge=0, le=250, description="Rainfall intensity in mm/hr")
    rainfall_duration_hours: float = Field(..., ge=0.5, le=48, description="Rainfall duration in hours")
    selected_ward_id: Optional[int] = None
    drainage_clog_factor: float = Field(0.0, ge=0, le=1.0)

# Summary Dashboard KPI schema
class DashboardKPI(BaseModel):
    current_overall_risk: str
    risk_score_average: float
    high_risk_wards_count: int
    critical_wards_count: int
    active_incidents_count: int
    pending_reports_count: int
    affected_roads_count: int
    critical_facilities_at_risk_count: int
    open_tasks_count: int
    available_emergency_teams: int
    weather_summary: str
    data_mode: str
    last_updated: str
