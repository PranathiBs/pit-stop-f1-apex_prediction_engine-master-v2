"""
Pit Stop - Data Fetching & Caching Engine
Handles FastF1 data, OpenWeather integration, and JSON caching.
"""

import os
import json
import httpx
import fastf1
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any

# --- Config ---
IS_SERVERLESS = "VERCEL" in os.environ or "AWS_LAMBDA_FUNCTION_NAME" in os.environ

if IS_SERVERLESS:
    DATA_DIR = Path("/tmp/data/processed")
    CACHE_DIR = "/tmp/f1_cache"
else:
    DATA_DIR = Path("data/processed")
    CACHE_DIR = "f1_cache"

DATA_DIR.mkdir(parents=True, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

OPENWEATHER_API_KEY = os.getenv("NEXT_PUBLIC_OPENWEATHER_API_KEY", "")

# Simplified Circuit Database for Coordinates
CIRCUITS = {
    "albert_park": {"lat": -37.8497, "lon": 144.9683},
    "bahrain": {"lat": 26.0325, "lon": 50.5106},
    "jeddah": {"lat": 21.5028, "lon": 39.1050},
    "melbourne": {"lat": -37.8497, "lon": 144.9683},
    "monaco": {"lat": 43.7347, "lon": 7.4206},
    "silverstone": {"lat": 52.0786, "lon": -1.0169},
    "monza": {"lat": 45.6189, "lon": 9.2812},
    "spa": {"lat": 50.4372, "lon": 5.9714},
    "suzuka": {"lat": 34.8431, "lon": 136.5410},
    "interlagos": {"lat": -23.7036, "lon": -46.6997},
    "yas_marina": {"lat": 24.4672, "lon": 54.6031},
}

def get_cache_path(category: str, year: int, identifier: str) -> Path:
    return DATA_DIR / f"{category}_{year}_{identifier.lower().replace(' ', '_')}.json"

async def fetch_weather(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch current weather from OpenWeatherAPI."""
    if not OPENWEATHER_API_KEY:
        return {"status": "No API Key", "temp": 25.0, "rain": 0.0}
    
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "temp": data["main"]["temp"],
                    "rain": data.get("rain", {}).get("1h", 0.0),
                    "status": data["weather"][0]["main"]
                }
        except Exception:
            pass
    return {"status": "Error/Fallback", "temp": 25.0, "rain": 0.0}

def get_race_data(year: int, gp: str, force_refresh: bool = False):
    """Fetch race data with caching logic."""
    cache_path = get_cache_path("race", year, gp)
    
    if not force_refresh and cache_path.exists():
        with open(cache_path, "r") as f:
            return json.load(f)
    
    try:
        session = fastf1.get_session(year, gp, 'R')
        session.load(laps=True, weather=True)
        
        # Process and simplify for our ML needs
        data = {
            "year": year,
            "gp": gp,
            "date": session.date.isoformat() if session.date else None,
            "results": [],
            "weather": {
                "track_temp": float(session.weather_data["TrackTemp"].mean()) if not session.weather_data.empty else 25.0,
                "air_temp": float(session.weather_data["AirTemp"].mean()) if not session.weather_data.empty else 20.0,
                "rainfall": bool(session.weather_data["Rainfall"].any()) if not session.weather_data.empty else False
            }
        }
        
        if not session.results.empty:
            for _, row in session.results.iterrows():
                data["results"].append({
                    "driver": row["Abbreviation"],
                    "team": row["TeamName"],
                    "position": int(row["Position"]),
                    "grid": int(row["GridPosition"]),
                    "status": row["Status"]
                })
        
        with open(cache_path, "w") as f:
            json.dump(data, f)
            
        return data
    except Exception as e:
        print(f"Error fetching FastF1 data: {e}")
        return None

def get_circuit_coords(gp_name: str) -> Dict[str, float]:
    """Get coordinates for a GP name."""
    key = gp_name.lower().replace(" ", "_").replace("grand_prix", "").strip("_")
    return CIRCUITS.get(key, {"lat": 0.0, "lon": 0.0})
