from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # "authority", "field_worker", "citizen"
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    boundary_geojson = Column(Text, nullable=False)  # JSON string of polygon coordinates
    elevation_meters = Column(Float, default=5.0)  # Lower elevation = higher flood factor
    drainage_capacity_pct = Column(Float, default=65.0)  # Percentage capacity
    historical_flood_count = Column(Integer, default=3)
    current_risk_score = Column(Float, default=35.0)  # 0 to 100
    current_risk_level = Column(String(30), default="LOW")  # LOW, MODERATE, HIGH, CRITICAL
    risk_factors_json = Column(Text, nullable=True)  # Explainable breakdown
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    road_name = Column(String(150), nullable=False)
    road_code = Column(String(50), unique=True, nullable=False)
    road_type = Column(String(50), default="PRIMARY")  # PRIMARY, SECONDARY, ARTERIAL, LOCAL
    coordinates_json = Column(Text, nullable=False)  # LineString coordinates JSON
    status = Column(String(30), default="OPEN")  # OPEN, AT_RISK, FLOODED, CLOSED, UNKNOWN
    flood_risk = Column(Float, default=20.0)  # 0 to 100
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ward = relationship("Ward")

class RoadStatusHistory(Base):
    __tablename__ = "road_status_history"

    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    old_status = Column(String(30), nullable=False)
    new_status = Column(String(30), nullable=False)
    changed_by = Column(String(100), nullable=False)
    reason = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    road = relationship("Road")

class DrainageAsset(Base):
    __tablename__ = "drainage_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String(50), unique=True, nullable=False)
    asset_type = Column(String(80), nullable=False)  # PUMPING_STATION, STORM_DRAIN, CULVERT, CANAL_OUTLET, SLUICE_GATE
    location = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(String(50), default="5000 L/min")
    condition = Column(String(50), default="GOOD")  # GOOD, FAIR, POOR, INSPECTION_REQUIRED, UNKNOWN
    last_inspection_at = Column(DateTime, default=datetime.utcnow)
    next_inspection_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ward = relationship("Ward")

class CriticalFacility(Base):
    __tablename__ = "critical_facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    facility_type = Column(String(50), nullable=False)  # HOSPITAL, FIRE_STATION, POLICE_STATION, SCHOOL, SHELTER, OTHER
    address = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_information = Column(String(100), nullable=True)
    direct_flood_risk = Column(String(30), default="LOW")  # LOW, MODERATE, HIGH, CRITICAL
    accessibility_status = Column(String(30), default="ACCESSIBLE")  # ACCESSIBLE, AT_RISK, AFFECTED, UNKNOWN
    nearby_primary_road_id = Column(Integer, ForeignKey("roads.id"), nullable=True)
    nearby_alt_road_id = Column(Integer, ForeignKey("roads.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    primary_road = relationship("Road", foreign_keys=[nearby_primary_road_id])
    alt_road = relationship("Road", foreign_keys=[nearby_alt_road_id])

class RainfallObservation(Base):
    __tablename__ = "rainfall_observations"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), default="Open-Meteo Sensor Network")
    observed_at = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rainfall_rate = Column(Float, default=0.0)  # mm/hr
    cumulative_rainfall = Column(Float, default=0.0)  # 24hr mm
    unit = Column(String(20), default="mm/hr")
    raw_source_reference = Column(String(100), default="MET-RAD-01")
    created_at = Column(DateTime, default=datetime.utcnow)

class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), default="Open-Meteo Live API")
    forecast_time = Column(DateTime, nullable=False)
    retrieved_at = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rainfall_probability = Column(Float, default=20.0)  # 0 to 100%
    forecast_rainfall = Column(Float, default=5.0)  # mm
    temperature = Column(Float, default=28.0)  # Celsius
    description = Column(String(100), default="Scattered precipitation")
    raw_source_reference = Column(String(100), default="OPEN_METEO_V1")

class FloodReport(Base):
    __tablename__ = "flood_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(50), unique=True, index=True, nullable=False)
    reporter_name = Column(String(100), default="Anonymous Citizen")
    reporter_phone = Column(String(20), nullable=True)
    report_type = Column(String(50), nullable=False)  # FLOODING, WATERLOGGING, BLOCKED_DRAIN, ROAD_OBSTRUCTION, OTHER
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    reported_water_level = Column(String(50), default="Not specified")
    photo_url = Column(String(255), nullable=True)
    reported_at = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String(30), default="PENDING")  # PENDING, VERIFIED, REJECTED
    severity = Column(String(30), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    linked_incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    is_grouped_duplicate = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ward = relationship("Ward")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, index=True, nullable=False)
    incident_type = Column(String(60), nullable=False)  # ROAD_INUNDATION, DRAIN_OVERFLOW, COMMUNITY_FLOOD, FACILITY_ISOLATION
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    priority = Column(String(30), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    system_recommended_priority = Column(String(30), default="MEDIUM")
    status = Column(String(30), default="NEW")  # NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
    source_report_id = Column(Integer, ForeignKey("flood_reports.id"), nullable=True)
    created_by = Column(String(100), default="Authority Command")
    assigned_team_id = Column(Integer, ForeignKey("emergency_teams.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    ward = relationship("Ward")
    team = relationship("EmergencyTeam")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(50), unique=True, index=True, nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    assigned_to = Column(String(100), nullable=False)  # Field worker name/email
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(30), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="ASSIGNED")  # NEW, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    location = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    incident = relationship("Incident")
    evidences = relationship("TaskEvidence", back_populates="task")

class TaskEvidence(Base):
    __tablename__ = "task_evidence"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    worker_id = Column(String(100), nullable=False)
    photo_url = Column(String(255), nullable=True)
    observation = Column(Text, nullable=False)
    verification_result = Column(String(50), default="CONFIRMED")  # CONFIRMED, NOT_CONFIRMED, NEEDS_FURTHER_INSPECTION
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="evidences")

class EmergencyTeam(Base):
    __tablename__ = "emergency_teams"

    id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String(100), nullable=False)
    team_type = Column(String(60), nullable=False)  # QUICK_RESPONSE, DRAINAGE_RESCUE, EVACUATION_CREW, PUMP_CREW
    current_status = Column(String(30), default="AVAILABLE")  # AVAILABLE, ASSIGNED, RESPONDING, OFFLINE
    current_location = Column(String(150), default="Central Depot")
    contact_information = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmergencyResource(Base):
    __tablename__ = "emergency_resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # DEWATERING_PUMP, AMBULANCE, RESCUE_BOAT, BARRICADE_KIT
    status = Column(String(30), default="AVAILABLE")  # AVAILABLE, DEPLOYED, MAINTENANCE
    location = Column(String(150), default="Municipal Workshop")
    assigned_incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)

class FloodEvent(Base):
    __tablename__ = "flood_events"

    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String(150), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    affected_area = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(30), default="SEVERE")
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    record = Column(String(150), nullable=False)
    old_value = Column(String(255), nullable=True)
    new_value = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
