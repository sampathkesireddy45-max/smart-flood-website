import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(method, path, payload=None, expected_status=200):
    url = BASE_URL + path
    headers = {"Content-Type": "application/json", "User-Agent": "DeployTest/1.0"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.getcode()
            body = resp.read()
            if status == expected_status or (expected_status == 200 and 200 <= status < 300):
                print(f"  [PASS] {method} {path} -> {status}", flush=True)
                return True, body
            else:
                print(f"  [FAIL] {method} {path} -> Expected {expected_status}, got {status}", flush=True)
                return False, body
    except urllib.error.HTTPError as e:
        print(f"  [FAIL] {method} {path} -> HTTPError {e.code}: {e.read().decode('utf-8')[:150]}", flush=True)
        return False, None
    except Exception as e:
        print(f"  [FAIL] {method} {path} -> Exception: {e}", flush=True)
        return False, None

print("=== STARTING COMPREHENSIVE SURAKSHA-FLOOD SYSTEM AUDIT ===", flush=True)

tests = [
    # 1. System Health & Root
    ("GET", "/", None, 200),
    ("GET", "/api/health", None, 200),

    # 2. Auth Endpoints
    ("GET", "/api/auth/config", None, 200),
    ("POST", "/api/auth/emergency-access", {"latitude": 13.0827, "longitude": 80.2707}, 200),
    ("POST", "/api/auth/admin-login", {"username": "admin@floodauthority.gov.in", "password": "SurakshaAdmin@2026"}, 200),
    ("POST", "/api/auth/request-otp", {"phone": "9573198929", "portal": "citizen"}, 200),

    # 3. Weather & Risk
    ("GET", "/api/weather/current?lat=13.0827&lng=80.2707", None, 200),
    ("GET", "/api/weather/forecast?lat=13.0827&lng=80.2707", None, 200),
    ("GET", "/api/risk/areas?lat=13.0827&lng=80.2707", None, 200),
    ("POST", "/api/risk/recalculate", {}, 200),

    # 4. Roads & Routing
    ("GET", "/api/roads?lat=13.0827&lng=80.2707", None, 200),
    ("POST", "/api/routes", {
        "origin_lat": 13.0815, "origin_lng": 80.2850,
        "dest_lat": 13.0835, "dest_lng": 80.2690,
        "avoid_floods": True, "avoid_drainage_leakage": True
    }, 200),

    # 5. Facilities & Drainage
    ("GET", "/api/facilities?lat=13.0827&lng=80.2707", None, 200),
    ("GET", "/api/drainage?lat=13.0827&lng=80.2707", None, 200),

    # 6. Reports & Incidents & Tasks
    ("GET", "/api/reports?lat=13.0827&lng=80.2707", None, 200),
    ("GET", "/api/incidents?lat=13.0827&lng=80.2707", None, 200),
    ("GET", "/api/tasks?lat=13.0827&lng=80.2707", None, 200),

    # 7. Analytics, Audit & CSV
    ("GET", "/api/analytics/summary?lat=13.0827&lng=80.2707", None, 200),
    ("GET", "/api/analytics/charts?lat=13.0827&lng=80.2707", None, 200),
    ("GET", "/api/analytics/audit?limit=10", None, 200),
    ("GET", "/api/analytics/export/csv?dataset=reports", None, 200),
    ("GET", "/api/analytics/export/csv?dataset=roads", None, 200),
    ("GET", "/api/analytics/export/csv?dataset=incidents", None, 200),

    # 8. Simulation
    ("POST", "/api/simulation/run", {
        "rainfall_rate": 50.0,
        "rainfall_duration_hours": 3.0,
        "drainage_clog_factor": 0.3
    }, 200),
]

passed = 0
failed = 0

for method, path, payload, status in tests:
    ok, _ = test_endpoint(method, path, payload, status)
    if ok:
        passed += 1
    else:
        failed += 1

print("\n=== AUDIT SUMMARY ===")
print(f"Total Tests: {len(tests)}")
print(f"Passed: {passed}")
print(f"Failed: {failed}")
if failed == 0:
    print("ALL BACKEND TEST VECTORS PASSED 100%!")
else:
    print(f"WARNING: {failed} tests failed.")
