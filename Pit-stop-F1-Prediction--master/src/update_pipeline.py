"""
Pit Stop - Automated Data Update Pipeline
Pre-fetches F1 Calendar and Weather into local cache for GitHub Actions.
"""

import fastf1
import os
import json
import pandas as pd
from datetime import datetime
from pathlib import Path
import sys

# Ensure src is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import model_engine

# --- Config ---
DATA_DIR = Path("data/processed")
CACHE_DIR = Path("f1_cache")
YEAR = datetime.now().year

def setup():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    fastf1.set_log_level('WARNING')
    fastf1.Cache.enable_cache(str(CACHE_DIR))

def update_calendar():
    print(f"Updating Calendar for {YEAR}...")
    try:
        schedule = fastf1.get_event_schedule(YEAR)
        print(f"✓ Calendar updated with {len(schedule)} events.")
    except Exception as e:
        print(f"Error updating calendar: {e}")

def warm_weather_cache():
    print("Warming Weather Cache for recent races...")
    try:
        schedule = fastf1.get_event_schedule(YEAR)
        now = datetime.now()
        
        # Get last 2 races and next race
        past_races = schedule[schedule['EventDate'] < now].tail(2)
        upcoming_races = schedule[schedule['EventDate'] > now].head(1)
        
        for _, race in pd.concat([past_races, upcoming_races]).iterrows():
            gp = race['EventName']
            if race['EventFormat'] == 'testing': continue
            
            print(f"  → Loading weather for {gp}...")
            for session_name in ['FP1', 'FP2', 'Qualifying', 'Race']:
                try:
                    sess = fastf1.get_session(YEAR, gp, session_name)
                    sess.load(laps=False, telemetry=False, weather=True)
                    
                    if not sess.weather_data.empty:
                        w = sess.weather_data.iloc[-1]
                        weather_data = {
                            "air_temp": round(float(w['AirTemp']), 1),
                            "track_temp": round(float(w['TrackTemp']), 1),
                            "rain_prob": float(w['Rainfall']),
                            "is_raining": bool(w['Rainfall'] > 0),
                            "status": "Rain" if w['Rainfall'] > 0 else "Clear",
                            "source": "automated_pipeline_update"
                        }
                        
                        safe_gp = gp.lower().replace(" ", "_")
                        safe_session = session_name.lower().replace(" ", "_")
                        cache_file = DATA_DIR / f"weather_{YEAR}_{safe_gp}_{safe_session}.json"
                        with open(cache_file, "w") as f:
                            json.dump(weather_data, f)
                except:
                    continue
        print("✓ Weather cache warmed.")
    except Exception as e:
        print(f"Error warming weather cache: {e}")

def update_models():
    print("Updating ML Models...")
    model_engine.train_model(YEAR)

if __name__ == "__main__":
    print(f"--- Starting Update Pipeline: {datetime.now()} ---")
    setup()
    update_calendar()
    warm_weather_cache()
    update_models()
    print("--- Pipeline Complete ---")
