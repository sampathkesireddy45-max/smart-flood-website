import os
from pydantic_settings import BaseSettings

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DEFAULT_DB = os.path.join(_BASE_DIR, "flood_system.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Urban Flood Nowcasting System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DATA_MODE: str = os.getenv("DATA_MODE", "live")  # "live" or "mock"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_DEFAULT_DB}")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-flood-mgmt-key-2026")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    WEATHER_API_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    
    # Risk weights (Configurable per Section 8 & 14)
    WEIGHT_RAINFALL: float = 0.35
    WEIGHT_TERRAIN: float = 0.20
    WEIGHT_DRAINAGE: float = 0.20
    WEIGHT_HISTORICAL: float = 0.15
    WEIGHT_OBSERVATION: float = 0.10
    
    # City Center Coordinates (Default: Metro area, e.g. 13.0827, 80.2707 - Chennai flood-prone basin)
    CITY_NAME: str = "Greater Metropolitan Zone"
    DEFAULT_LAT: float = 13.0827
    DEFAULT_LNG: float = 80.2707

    # Designated Municipal Authority Admin Credentials (Restricted Access)
    ADMIN_PHONE: str = os.getenv("ADMIN_PHONE", "9573198929")
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin@floodauthority.gov.in")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "SurakshaAdmin@2026")

    # Real SMS Gateway Configurations for Real Mobile Delivery
    FAST2SMS_API_KEY: str = os.getenv("FAST2SMS_API_KEY", "")
    TWO_FACTOR_API_KEY: str = os.getenv("TWO_FACTOR_API_KEY", "")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")

    class Config:
        env_file = [
            os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
            ".env",
            "../.env"
        ]
        extra = "ignore"

settings = Settings()
