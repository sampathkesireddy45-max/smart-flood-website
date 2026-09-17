import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, Ward, Road, RoadStatusHistory, DrainageAsset,
    CriticalFacility, RainfallObservation, WeatherForecast,
    FloodReport, Incident, Task, TaskEvidence, EmergencyTeam,
    EmergencyResource, FloodEvent, AuditLog
)
from .risk_engine import risk_engine

def seed_database(db: Session, force_reset: bool = False):
    """
    Seeds the database with high-fidelity GIS wards, roads, drainage, facilities,
    and operational records for SIH and municipal flood disaster operations.
    """
    if not force_reset and db.query(Ward).count() > 0:
        return

    # Clear existing if force_reset
    if force_reset:
        db.query(TaskEvidence).delete()
        db.query(Task).delete()
        db.query(Incident).delete()
        db.query(FloodReport).delete()
        db.query(CriticalFacility).delete()
        db.query(DrainageAsset).delete()
        db.query(RoadStatusHistory).delete()
        db.query(Road).delete()
        db.query(Ward).delete()
        db.query(EmergencyResource).delete()
        db.query(EmergencyTeam).delete()
        db.query(FloodEvent).delete()
        db.query(AuditLog).delete()
        db.query(User).delete()
        db.commit()

    # 1. Users
    users_data = [
        User(name="Chief Disaster Officer Sharma", email="admin@floodcontrol.gov", password_hash="pbkdf2_demo_hash", role="authority", phone="+91 98401 23456"),
        User(name="Field Worker Rajesh Kumar", email="rajesh.worker@floodcontrol.gov", password_hash="pbkdf2_demo_hash", role="field_worker", phone="+91 98402 34567"),
        User(name="Field Worker Priya Mani", email="priya.worker@floodcontrol.gov", password_hash="pbkdf2_demo_hash", role="field_worker", phone="+91 98403 45678"),
        User(name="Citizen Ananya Sundaram", email="ananya.citizen@gmail.com", password_hash="pbkdf2_demo_hash", role="citizen", phone="+91 98404 56789"),
    ]
    db.add_all(users_data)
    db.commit()

    # 2. Wards (6 Urban Zones with coordinate polygons)
    # Base center: 13.0827, 80.2707
    wards_data = [
        Ward(
            name="Ward 101 - Coastal Harbour & Estuary",
            code="WARD-101",
            center_lat=13.0850,
            center_lng=80.2820,
            elevation_meters=2.1,  # Low-lying coastal zone
            drainage_capacity_pct=42.0,
            historical_flood_count=5,
            current_risk_score=78.5,
            current_risk_level="CRITICAL",
            boundary_geojson=json.dumps([
                [13.0780, 80.2750], [13.0920, 80.2750], [13.0920, 80.2920], [13.0780, 80.2920], [13.0780, 80.2750]
            ])
        ),
        Ward(
            name="Ward 102 - Central Commercial Basin",
            code="WARD-102",
            center_lat=13.0820,
            center_lng=80.2650,
            elevation_meters=3.8,
            drainage_capacity_pct=60.0,
            historical_flood_count=4,
            current_risk_score=64.0,
            current_risk_level="HIGH",
            boundary_geojson=json.dumps([
                [13.0750, 80.2550], [13.0900, 80.2550], [13.0900, 80.2750], [13.0750, 80.2750], [13.0750, 80.2550]
            ])
        ),
        Ward(
            name="Ward 103 - Riverbank Lowlands",
            code="WARD-103",
            center_lat=13.0680,
            center_lng=80.2600,
            elevation_meters=2.5,
            drainage_capacity_pct=50.0,
            historical_flood_count=6,
            current_risk_score=72.0,
            current_risk_level="HIGH",
            boundary_geojson=json.dumps([
                [13.0600, 80.2500], [13.0750, 80.2500], [13.0750, 80.2720], [13.0600, 80.2720], [13.0600, 80.2500]
            ])
        ),
        Ward(
            name="Ward 104 - Metro Railway Junction",
            code="WARD-104",
            center_lat=13.0750,
            center_lng=80.2400,
            elevation_meters=6.2,
            drainage_capacity_pct=72.0,
            historical_flood_count=2,
            current_risk_score=44.0,
            current_risk_level="MODERATE",
            boundary_geojson=json.dumps([
                [13.0650, 80.2300], [13.0850, 80.2300], [13.0850, 80.2520], [13.0650, 80.2520], [13.0650, 80.2300]
            ])
        ),
        Ward(
            name="Ward 105 - Tech Corridor & South Ridge",
            code="WARD-105",
            center_lat=13.0580,
            center_lng=80.2350,
            elevation_meters=9.5,
            drainage_capacity_pct=85.0,
            historical_flood_count=1,
            current_risk_score=26.0,
            current_risk_level="LOW",
            boundary_geojson=json.dumps([
                [13.0480, 80.2250], [13.0650, 80.2250], [13.0650, 80.2450], [13.0480, 80.2450], [13.0480, 80.2250]
            ])
        ),
        Ward(
            name="Ward 106 - Northern Highland Cantonment",
            code="WARD-106",
            center_lat=13.0980,
            center_lng=80.2550,
            elevation_meters=14.2,
            drainage_capacity_pct=88.0,
            historical_flood_count=0,
            current_risk_score=18.0,
            current_risk_level="LOW",
            boundary_geojson=json.dumps([
                [13.0900, 80.2450], [13.1050, 80.2450], [13.1050, 80.2700], [13.0900, 80.2700], [13.0900, 80.2450]
            ])
        )
    ]
    db.add_all(wards_data)
    db.commit()

    # Pre-calculate explainable risk breakdown for each ward
    for w in wards_data:
        calc = risk_engine.calculate_ward_risk(
            ward_name=w.name,
            ward_code=w.code,
            elevation_m=w.elevation_meters,
            drainage_capacity_pct=w.drainage_capacity_pct,
            historical_flood_count=w.historical_flood_count,
            rainfall_rate_mm_hr=24.5,
            cumulative_rainfall_mm=62.0,
            verified_reports_count=2 if "101" in w.code or "103" in w.code else 0
        )
        w.current_risk_score = calc["score"]
        w.current_risk_level = calc["risk_level"]
        w.risk_factors_json = json.dumps(calc["contributing_factors"])
    db.commit()

    # 3. Roads (Connecting network with real status)
    roads_data = [
        Road(
            road_name="Marina Coastal Arterial Expressway",
            road_code="RD-MAR-01",
            road_type="PRIMARY",
            status="FLOODED",  # Affected!
            flood_risk=86.0,
            ward_id=1,
            coordinates_json=json.dumps([[13.0780, 80.2800], [13.0840, 80.2810], [13.0910, 80.2830]])
        ),
        Road(
            road_name="Anna Central Boulevard",
            road_code="RD-ANN-02",
            road_type="PRIMARY",
            status="AT_RISK",
            flood_risk=62.0,
            ward_id=2,
            coordinates_json=json.dumps([[13.0840, 80.2810], [13.0820, 80.2650], [13.0790, 80.2520]])
        ),
        Road(
            road_name="Poonamallee High Road",
            road_code="RD-PMR-03",
            road_type="ARTERIAL",
            status="OPEN",
            flood_risk=24.0,
            ward_id=4,
            coordinates_json=json.dumps([[13.0820, 80.2650], [13.0800, 80.2450], [13.0780, 80.2320]])
        ),
        Road(
            road_name="Adyar River Bridge Causeway",
            road_code="RD-ADY-04",
            road_type="SECONDARY",
            status="CLOSED",  # Submerged bridge
            flood_risk=94.0,
            ward_id=3,
            coordinates_json=json.dumps([[13.0750, 80.2600], [13.0680, 80.2590], [13.0620, 80.2570]])
        ),
        Road(
            road_name="Jawaharlal Nehru Inner Ring Road",
            road_code="RD-IRR-05",
            road_type="PRIMARY",
            status="OPEN",  # Safe detour route!
            flood_risk=22.0,
            ward_id=4,
            coordinates_json=json.dumps([[13.0780, 80.2320], [13.0650, 80.2340], [13.0550, 80.2360]])
        ),
        Road(
            road_name="Sardar Patel Elevated Link",
            road_code="RD-SPL-06",
            road_type="ARTERIAL",
            status="OPEN",
            flood_risk=18.0,
            ward_id=5,
            coordinates_json=json.dumps([[13.0550, 80.2360], [13.0580, 80.2480], [13.0620, 80.2570]])
        ),
        Road(
            road_name="North Port Access Spine",
            road_code="RD-NPA-07",
            road_type="SECONDARY",
            status="OPEN",
            flood_risk=20.0,
            ward_id=6,
            coordinates_json=json.dumps([[13.0910, 80.2830], [13.0980, 80.2650], [13.0990, 80.2500]])
        ),
        Road(
            road_name="Central Hospital Link Way",
            road_code="RD-CHL-08",
            road_type="LOCAL",
            status="AT_RISK",
            flood_risk=58.0,
            ward_id=2,
            coordinates_json=json.dumps([[13.0820, 80.2650], [13.0835, 80.2690]])
        )
    ]
    db.add_all(roads_data)
    db.commit()

    # 4. Critical Facilities (with primary & alt access road relationships)
    facilities_data = [
        CriticalFacility(
            name="Government General Metropolitan Hospital",
            facility_type="HOSPITAL",
            address="14 Central Hospital Road, Ward 102",
            latitude=13.0835,
            longitude=80.2690,
            contact_information="Emergency Helpline: 044-25305000",
            direct_flood_risk="LOW",
            accessibility_status="AT_RISK",  # Because primary access road RD-CHL-08 is AT_RISK!
            nearby_primary_road_id=8,
            nearby_alt_road_id=2
        ),
        CriticalFacility(
            name="City Central Fire & Disaster Rescue HQ",
            facility_type="FIRE_STATION",
            address="Station 1, Poonamallee Road, Ward 104",
            latitude=13.0795,
            longitude=80.2440,
            contact_information="Command Dispatch: 101",
            direct_flood_risk="LOW",
            accessibility_status="ACCESSIBLE",
            nearby_primary_road_id=3,
            nearby_alt_road_id=5
        ),
        CriticalFacility(
            name="Harbour South Emergency Evacuation Shelter",
            facility_type="SHELTER",
            address="Community Hall Complex, Ward 101",
            latitude=13.0815,
            longitude=80.2850,
            contact_information="Capacity: 850 persons",
            direct_flood_risk="HIGH",
            accessibility_status="AFFECTED",  # Marina Coastal Arterial road is FLOODED
            nearby_primary_road_id=1,
            nearby_alt_road_id=2
        ),
        CriticalFacility(
            name="Metropolitan Police Commissionerate HQ",
            facility_type="POLICE_STATION",
            address="Vepery Police Plaza, Ward 102",
            latitude=13.0860,
            longitude=80.2610,
            contact_information="Control Room: 100",
            direct_flood_risk="LOW",
            accessibility_status="ACCESSIBLE",
            nearby_primary_road_id=2,
            nearby_alt_road_id=3
        ),
        CriticalFacility(
            name="St. Mary Higher Secondary Relief Camp",
            facility_type="SCHOOL",
            address="River Road, Ward 103",
            latitude=13.0670,
            longitude=80.2580,
            contact_information="Capacity: 500 persons",
            direct_flood_risk="HIGH",
            accessibility_status="AFFECTED",
            nearby_primary_road_id=4,
            nearby_alt_road_id=6
        ),
        CriticalFacility(
            name="Highland Civic Emergency Shelter",
            facility_type="SHELTER",
            address="North Hill Ground, Ward 106",
            latitude=13.0995,
            longitude=80.2560,
            contact_information="Capacity: 1200 persons",
            direct_flood_risk="LOW",
            accessibility_status="ACCESSIBLE",
            nearby_primary_road_id=7,
            nearby_alt_road_id=3
        )
    ]
    db.add_all(facilities_data)
    db.commit()

    # 5. Drainage Assets
    drainage_data = [
        DrainageAsset(
            asset_code="PS-EST-01",
            asset_type="PUMPING_STATION",
            location="Estuary Outfall Terminal, Ward 101",
            latitude=13.0865,
            longitude=80.2870,
            capacity="12,500 L/min",
            condition="INSPECTION_REQUIRED",
            notes="Trash rack blockage reported by coastal fishermen",
            ward_id=1
        ),
        DrainageAsset(
            asset_code="CUL-ADY-04",
            asset_type="CULVERT",
            location="Adyar River Link Bridge, Ward 103",
            latitude=13.0695,
            longitude=80.2595,
            capacity="8,000 L/min",
            condition="POOR",
            notes="Silt accumulation at 65% cross section",
            ward_id=3
        ),
        DrainageAsset(
            asset_code="STR-CEN-02",
            asset_type="STORM_DRAIN",
            location="Central Commercial Boulevard, Ward 102",
            latitude=13.0810,
            longitude=80.2640,
            capacity="6,200 L/min",
            condition="FAIR",
            notes="Regular flow monitored, discharge normal",
            ward_id=2
        ),
        DrainageAsset(
            asset_code="SLU-NTH-03",
            asset_type="SLUICE_GATE",
            location="North Canal Sluice, Ward 106",
            latitude=13.0970,
            longitude=80.2610,
            capacity="15,000 L/min",
            condition="GOOD",
            notes="Automated radial gate operational",
            ward_id=6
        )
    ]
    db.add_all(drainage_data)
    db.commit()

    # 6. Citizen Flood Reports
    reports_data = [
        FloodReport(
            report_code="RPT-2026-081",
            reporter_name="Ananya Sundaram",
            reporter_phone="+91 98404 56789",
            report_type="FLOODING",
            description="Severe waterlogging on Marina Coastal road near light house. Two vehicles stranded in knee-deep water.",
            latitude=13.0838,
            longitude=80.2815,
            ward_id=1,
            reported_water_level="Knee deep (35-45cm)",
            photo_url="/uploads/demo_flood_1.jpg",
            reported_at=datetime.utcnow() - timedelta(minutes=45),
            verification_status="VERIFIED",
            severity="HIGH",
            verified_by="Chief Disaster Officer Sharma",
            verified_at=datetime.utcnow() - timedelta(minutes=25),
            verification_notes="Confirmed via CCTV Feed #12 and local police report."
        ),
        FloodReport(
            report_code="RPT-2026-082",
            reporter_name="Karthik Venkatesh",
            reporter_phone="+91 98405 67890",
            report_type="BLOCKED_DRAIN",
            description="Storm culvert entrance completely clogged with plastic waste and tree branches. Water spilling onto pedestrian walkway.",
            latitude=13.0805,
            longitude=80.2645,
            ward_id=2,
            reported_water_level="Ankle deep (15cm)",
            photo_url="/uploads/demo_drain_block.jpg",
            reported_at=datetime.utcnow() - timedelta(minutes=20),
            verification_status="PENDING",
            severity="MEDIUM"
        ),
        FloodReport(
            report_code="RPT-2026-083",
            reporter_name="Sunil Natarajan",
            reporter_phone="+91 98406 78901",
            report_type="WATERLOGGING",
            description="Adyar river underpass flooded over 70cm deep. Impassable for small cars and two-wheelers.",
            latitude=13.0682,
            longitude=80.2592,
            ward_id=3,
            reported_water_level="Waist deep (>70cm)",
            photo_url="/uploads/demo_underpass.jpg",
            reported_at=datetime.utcnow() - timedelta(minutes=10),
            verification_status="PENDING",
            severity="CRITICAL"
        )
    ]
    db.add_all(reports_data)
    db.commit()

    # 7. Incidents
    incidents_data = [
        Incident(
            incident_code="INC-2026-101",
            incident_type="ROAD_INUNDATION",
            title="Marina Coastal Expressway Submersion",
            description="Water depth exceeds 40cm across 300m stretch. Traffic halted. Dewatering pump required.",
            latitude=13.0840,
            longitude=80.2810,
            ward_id=1,
            priority="HIGH",
            system_recommended_priority="HIGH",
            status="ASSIGNED",
            source_report_id=1,
            created_by="Chief Disaster Officer Sharma",
            assigned_team_id=1
        ),
        Incident(
            incident_code="INC-2026-102",
            incident_type="DRAIN_OVERFLOW",
            title="Culvert Backflow at Adyar Causeway",
            description="River levels swelling back into road culvert CUL-ADY-04. Road closure enacted.",
            latitude=13.0680,
            longitude=80.2590,
            ward_id=3,
            priority="CRITICAL",
            system_recommended_priority="CRITICAL",
            status="IN_PROGRESS",
            created_by="Chief Disaster Officer Sharma",
            assigned_team_id=2
        )
    ]
    db.add_all(incidents_data)
    db.commit()

    # 8. Tasks (Field Worker Tasks)
    tasks_data = [
        Task(
            task_code="TSK-2026-301",
            incident_id=1,
            assigned_to="Field Worker Rajesh Kumar",
            title="Inspect Marina Road Inundation & Deploy Barricades",
            description="Verify water level with gauge, secure perimeter, and direct traffic to Anna Boulevard detour.",
            priority="HIGH",
            status="IN_PROGRESS",
            location="Marina Coastal Expressway (Opp. Light House)",
            latitude=13.0840,
            longitude=80.2810,
            started_at=datetime.utcnow() - timedelta(minutes=15)
        ),
        Task(
            task_code="TSK-2026-302",
            incident_id=2,
            assigned_to="Field Worker Rajesh Kumar",
            title="Adyar Causeway Sluice Inspection & Silt Removal",
            description="Inspect culvert CUL-ADY-04. Clear trash rack blockage and report water flow rate.",
            priority="CRITICAL",
            status="ASSIGNED",
            location="Adyar River Bridge Causeway",
            latitude=13.0680,
            longitude=80.2590
        ),
        Task(
            task_code="TSK-2026-303",
            assigned_to="Field Worker Priya Mani",
            title="Routine Inspection of Central Pump Station PS-EST-01",
            description="Check diesel generator backup and suction pipe clearance.",
            priority="MEDIUM",
            status="ASSIGNED",
            location="Estuary Outfall Terminal, Ward 101",
            latitude=13.0865,
            longitude=80.2870
        )
    ]
    db.add_all(tasks_data)
    db.commit()

    # 9. Emergency Teams & Resources
    teams_data = [
        EmergencyTeam(
            team_name="Alpha Coastal Quick Response Unit",
            team_type="QUICK_RESPONSE",
            current_status="RESPONDING",
            current_location="Ward 101 - Coastal Harbour",
            contact_information="VHF Ch-14 / Capt. Mohan"
        ),
        EmergencyTeam(
            team_name="Bravo Drainage & Dewatering Taskforce",
            team_type="PUMP_CREW",
            current_status="ASSIGNED",
            current_location="Ward 103 - Riverbank Basin",
            contact_information="VHF Ch-16 / Eng. Murugan"
        ),
        EmergencyTeam(
            team_name="Charlie Evacuation & Relief Squadron",
            team_type="EVACUATION_CREW",
            current_status="AVAILABLE",
            current_location="Central Command Depot",
            contact_information="VHF Ch-12 / Lead Vikram"
        )
    ]
    db.add_all(teams_data)

    resources_data = [
        EmergencyResource(resource_name="High-Capacity Dewatering Pump 150HP", type="DEWATERING_PUMP", status="DEPLOYED", location="Ward 101 Outfall"),
        EmergencyResource(resource_name="Disaster Response Ambulance MED-03", type="AMBULANCE", status="AVAILABLE", location="General Hospital Staging Area"),
        EmergencyResource(resource_name="Inflatable Rescue Boat RB-02", type="RESCUE_BOAT", status="AVAILABLE", location="Adyar River Relief Station"),
        EmergencyResource(resource_name="Emergency Barricade & Warning Signs Kit #4", type="BARRICADE_KIT", status="DEPLOYED", location="Marina Expressway Jn")
    ]
    db.add_all(resources_data)

    # 10. Historical Flood Events (For Section 43 Analytics)
    events_data = [
        FloodEvent(
            event_name="Monsoon Cyclone Vardah Inundation",
            start_time=datetime.utcnow() - timedelta(days=720),
            end_time=datetime.utcnow() - timedelta(days=717),
            affected_area="Ward 101, Ward 102, Ward 103",
            description="Peak rainfall 280mm in 24h. Coastal storm surge and estuarine backflow.",
            severity="CRITICAL"
        ),
        FloodEvent(
            event_name="Northeast Monsoon Torrential Spell",
            start_time=datetime.utcnow() - timedelta(days=360),
            end_time=datetime.utcnow() - timedelta(days=358),
            affected_area="Ward 103 Riverbank Lowlands",
            description="Flash waterlogging due to breached secondary drainage canal.",
            severity="SEVERE"
        ),
        FloodEvent(
            event_name="Pre-Monsoon Cloudburst Event",
            start_time=datetime.utcnow() - timedelta(days=120),
            end_time=datetime.utcnow() - timedelta(days=119),
            affected_area="Ward 102 Commercial Basin",
            description="95mm rain in 2 hours causing commercial district gridlock.",
            severity="MODERATE"
        )
    ]
    db.add_all(events_data)

    # 11. Initial Audit Log
    logs_data = [
        AuditLog(user="System Initialization", action="DATABASE_SEED", record="SYSTEM", old_value=None, new_value="INITIALIZED_OK"),
        AuditLog(user="Chief Disaster Officer Sharma", action="ROAD_STATUS_CHANGE", record="RD-MAR-01", old_value="OPEN", new_value="FLOODED"),
        AuditLog(user="Chief Disaster Officer Sharma", action="ROAD_STATUS_CHANGE", record="RD-ADY-04", old_value="OPEN", new_value="CLOSED"),
        AuditLog(user="Chief Disaster Officer Sharma", action="REPORT_VERIFIED", record="RPT-2026-081", old_value="PENDING", new_value="VERIFIED"),
    ]
    db.add_all(logs_data)
    db.commit()

    print("[SUCCESS] Seeded database with complete realistic GIS and operational dataset.")
