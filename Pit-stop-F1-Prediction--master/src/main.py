"""
Pit Stop - AI Data Engine v5.0 (MLOps Edition)
FastAPI Production Backend with robust caching and health monitoring.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import sys
import json
from pathlib import Path
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Optional

# Core Engine Imports (Siblings in src/)
try:
    import model_engine
    import data_fetcher
except ImportError:
    # Handle case where src is treated as a package from root
    from . import model_engine
    from . import data_fetcher

# --- Config ---
MODEL_CACHE = {}
CURRENT_YEAR = datetime.now().year
DATA_DIR = Path(__file__).parent.parent / "data" / "processed"

# --- Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Engine] Initializing MLOps Backend...")
    # Pre-load or train initial model for the current year
    model = model_engine.load_model(CURRENT_YEAR)
    if not model:
        model = model_engine.train_model(CURRENT_YEAR)
    MODEL_CACHE[CURRENT_YEAR] = model
    yield

app = FastAPI(title="Pit Stop: MLOps Backend", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- Routes ---

@app.get("/health")
async def health():
    """Consolidated health check with dependency verification."""
    model_ready = CURRENT_YEAR in MODEL_CACHE
    cache_count = len(list(DATA_DIR.glob("*.json")))
    
    return {
        "status": "online",
        "version": "5.0-mlops",
        "model_ready": model_ready,
        "cache_entries": cache_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/predict/race/{year}/{gp}")
async def predict_race(year: int, gp: str):
    """Predict podium finishers using cached data and current weather."""
    try:
        # 1. Fetch Race Data (Cached or Fresh via FastF1)
        race_data = data_fetcher.get_race_data(year, gp)
        
        # 2. Get Real-time Weather
        coords = data_fetcher.get_circuit_coords(gp)
        weather = await data_fetcher.fetch_weather(coords['lat'], coords['lon'])
        
        # 3. Load/Train Model
        if year not in MODEL_CACHE:
            model = model_engine.load_model(year)
            if not model:
                model = model_engine.train_model(year)
            MODEL_CACHE[year] = model
        
        model = MODEL_CACHE[year]
        
        # 4. Prepare Grid
        grid = {}
        if race_data and "results" in race_data:
            grid = {r['driver']: r['grid'] for r in race_data['results']}
        
        if not grid:
            # Fallback mock grid if no session data yet
            grid = {"VER": 1, "HAM": 2, "LEC": 3, "NOR": 4, "PIA": 5, "SAI": 6}
            
        podium = model_engine.predict_podium(model, grid, {
            "air_temp": weather.get("temp", 25.0),
            "track_temp": weather.get("temp", 25.0) + 5,
            "rain_prob": weather.get("rain", 0.0)
        })
        
        return {
            "year": year,
            "gp": gp,
            "weather": weather,
            "predictions": podium,
            "source": "cache" if race_data else "live_fallback"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calendar/{year}")
async def get_calendar(year: int):
    """Fetch the F1 calendar (leveraging FastF1)."""
    import fastf1
    try:
        schedule = fastf1.get_event_schedule(year)
        races = []
        for _, row in schedule.iterrows():
            if row['EventFormat'] == 'testing': continue
            races.append({
                "round": str(row['RoundNumber']),
                "raceName": row['EventName'],
                "date": row['EventDate'].strftime('%Y-%m-%d'),
                "location": row['Location']
            })
        return races
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather/{year}/{gp}")
async def get_weather_only(year: int, gp: str):
    """Direct weather lookup with coordinate mapping."""
    coords = data_fetcher.get_circuit_coords(gp)
    return await data_fetcher.fetch_weather(coords['lat'], coords['lon'])

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 for cloud deployment
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8888)))