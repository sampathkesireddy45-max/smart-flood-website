import requests
from datetime import datetime
from typing import Dict, Any, Optional
from .config import settings

class WeatherService:
    def __init__(self):
        self.cached_weather: Optional[Dict[str, Any]] = None
        self.cached_forecast: Optional[Dict[str, Any]] = None
        self.last_fetched_at: Optional[datetime] = None

    def fetch_live_weather(self, lat: float = None, lng: float = None) -> Dict[str, Any]:
        """
        Retrieves real-time weather & precipitation data from Open-Meteo API.
        Handles network drops gracefully and implements caching.
        """
        lat = lat or settings.DEFAULT_LAT
        lng = lng or settings.DEFAULT_LNG
        url = (
            f"{settings.WEATHER_API_BASE_URL}?"
            f"latitude={lat}&longitude={lng}&"
            f"current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&"
            f"hourly=temperature_2m,precipitation_probability,precipitation,rain&"
            f"timezone=auto&forecast_days=2"
        )

        try:
            response = requests.get(url, timeout=4.0)
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                hourly = data.get("hourly", {})
                
                # Precipitation rate in mm/hr
                rain_rate = float(current.get("rain", current.get("precipitation", 0.0)))
                temp = float(current.get("temperature_2m", 28.0))
                w_code = int(current.get("weather_code", 0))

                # Compute 24-hr cumulative rainfall from hourly
                precip_list = hourly.get("precipitation", [])[:24]
                cumulative_24h = sum(float(p) for p in precip_list if p is not None) if precip_list else rain_rate * 4

                desc = self._weather_code_to_desc(w_code, rain_rate)

                result = {
                    "temperature": temp,
                    "rainfall_rate": rain_rate,
                    "cumulative_24h": round(cumulative_24h, 2),
                    "precipitation_probability": float(hourly.get("precipitation_probability", [40])[0] if hourly.get("precipitation_probability") else 40),
                    "weather_code": w_code,
                    "description": desc,
                    "source": "Open-Meteo Live Sensor API",
                    "last_updated": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "status": "ONLINE_LIVE",
                    "is_live": True
                }

                self.cached_weather = result
                self.last_fetched_at = datetime.utcnow()

                # Cache forecast series
                forecast_items = []
                times = hourly.get("time", [])[:8]
                temps = hourly.get("temperature_2m", [])[:8]
                probs = hourly.get("precipitation_probability", [])[:8]
                rains = hourly.get("precipitation", [])[:8]

                for i in range(min(len(times), 8)):
                    r_val = float(rains[i]) if i < len(rains) and rains[i] is not None else 0.0
                    forecast_items.append({
                        "time": times[i].split("T")[-1] if "T" in times[i] else times[i],
                        "temperature": float(temps[i]) if i < len(temps) else 27.0,
                        "precipitation_probability": float(probs[i]) if i < len(probs) else 30.0,
                        "rainfall": r_val,
                        "description": "Rain Alert" if r_val > 10 else ("Light Showers" if r_val > 1 else "Cloudy")
                    })

                self.cached_forecast = {
                    "source": "Open-Meteo Global Forecasting Model",
                    "last_updated": self.cached_weather["last_updated"],
                    "status": "ONLINE_LIVE",
                    "forecasts": forecast_items
                }

                return result

        except Exception as e:
            # Fallback handling without crashing (Section 6 & 48)
            pass

        if self.cached_weather:
            fallback = self.cached_weather.copy()
            fallback["status"] = "CACHED_FALLBACK"
            fallback["source"] = f"{fallback['source']} (Cached)"
            return fallback

        # Safe default response when API is totally unreachable
        return {
            "temperature": 29.5,
            "rainfall_rate": 18.4,
            "cumulative_24h": 46.2,
            "precipitation_probability": 65.0,
            "weather_code": 61,
            "description": "Moderate Monsoon Rain",
            "source": "Simulated Weather Observation Station (Data Mode)",
            "last_updated": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "status": "DEMO_FALLBACK",
            "is_live": False
        }

    def fetch_forecast(self, lat: float = None, lng: float = None) -> Dict[str, Any]:
        self.fetch_live_weather(lat, lng)
        if self.cached_forecast:
            return self.cached_forecast
        
        # Fallback structured forecast
        return {
            "source": "Municipal Met Telemetry Model",
            "last_updated": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "status": "DEMO_FALLBACK",
            "forecasts": [
                {"time": "+2h", "temperature": 29.0, "precipitation_probability": 75.0, "rainfall": 22.5, "description": "Heavy Downpour"},
                {"time": "+4h", "temperature": 28.5, "precipitation_probability": 85.0, "rainfall": 35.0, "description": "Intense Inundation Risk"},
                {"time": "+6h", "temperature": 28.0, "precipitation_probability": 60.0, "rainfall": 14.0, "description": "Intermittent Showers"},
                {"time": "+8h", "temperature": 27.5, "precipitation_probability": 40.0, "rainfall": 5.0, "description": "Light Drizzle"},
                {"time": "+12h", "temperature": 27.0, "precipitation_probability": 25.0, "rainfall": 1.2, "description": "Overcast Conditions"},
            ]
        }

    def _weather_code_to_desc(self, code: int, rain: float) -> str:
        if rain > 35:
            return "Extreme Torrential Rainfall"
        elif rain > 15:
            return "Heavy Urban Rainfall"
        elif rain > 2:
            return "Moderate Rainfall"
        elif rain > 0:
            return "Light Rain Showers"

        codes = {
            0: "Clear Sky",
            1: "Mainly Clear",
            2: "Partly Cloudy",
            3: "Overcast",
            45: "Foggy",
            51: "Light Drizzle",
            61: "Slight Rain",
            63: "Moderate Rain",
            65: "Heavy Rain",
            80: "Rain Showers",
            95: "Thunderstorm"
        }
        return codes.get(code, "Monsoon Precipitation")

weather_service = WeatherService()
