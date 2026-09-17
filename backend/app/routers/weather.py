from fastapi import APIRouter
from ..weather_service import weather_service
from ..schemas import WeatherCurrentResponse, WeatherForecastResponse

router = APIRouter(prefix="/weather", tags=["Weather Integration"])

@router.get("/current", response_model=WeatherCurrentResponse)
def get_current_weather(lat: float = None, lng: float = None):
    return weather_service.fetch_live_weather(lat, lng)

@router.get("/forecast", response_model=WeatherForecastResponse)
def get_weather_forecast(lat: float = None, lng: float = None):
    return weather_service.fetch_forecast(lat, lng)
