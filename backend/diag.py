import urllib.request
import json

req = urllib.request.Request(
    'http://localhost:8000/api/auth/emergency-access',
    data=json.dumps({"latitude": 13.0827, "longitude": 80.2707}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        print("STATUS:", resp.getcode())
        print("BODY:", resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTP ERROR CODE:", e.code)
    print("HTTP ERROR BODY:", e.read().decode("utf-8"))
except Exception as e:
    print("OTHER ERROR:", e)
