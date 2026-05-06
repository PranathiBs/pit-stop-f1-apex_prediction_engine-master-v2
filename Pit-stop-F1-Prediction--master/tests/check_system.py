"""
Validation Script - System Health & Smoke Test
Ensures APIs are reachable and the ML model is functional.
"""

import sys
import os
from pathlib import Path
import fastf1
from datetime import datetime

# Standardize path for src imports
ROOT = Path(__file__).parent.parent
sys.path.append(str(ROOT))

try:
    import src.model_engine as model_engine
    import src.data_fetcher as data_fetcher
except ImportError as e:
    print(f"Import Error: {e}. Attempting direct imports...")
    import model_engine
    import data_fetcher

def check_f1_api():
    print("Checking FastF1 API...")
    year = datetime.now().year
    try:
        schedule = fastf1.get_event_schedule(year)
        if not schedule.empty:
            print(f"[OK] F1 {year} Schedule reachable.")
            return True
        else:
            print(f"[WARN] F1 {year} Schedule is empty.")
            return True 
    except Exception as e:
        print(f"[FAIL] F1 API Error: {e}")
    return False

def check_model_readiness():
    print("Checking ML Model readiness...")
    year = datetime.now().year
    model = model_engine.load_model(year)
    if not model:
        print("Model missing, attempting to train a baseline...")
        model = model_engine.train_model(year)
    
    if model:
        grid = {"VER": 1, "HAM": 2, "LEC": 3}
        weather = {"air_temp": 25.0, "track_temp": 30.0, "rain_prob": 0.0}
        podium = model_engine.predict_podium(model, grid, weather)
        if len(podium) > 0:
            print(f"[OK] Model functional. Sample Podium: {podium}")
            return True
    print("[FAIL] Model validation failed.")
    return False

def check_weather_api():
    print("Checking Weather API...")
    key = os.getenv("NEXT_PUBLIC_OPENWEATHER_API_KEY")
    if not key:
        print("[WARN] NEXT_PUBLIC_OPENWEATHER_API_KEY not found. This is expected if the key isn't provided yet.")
        return "SOFT_FAIL"
    
    import asyncio
    coords = data_fetcher.get_circuit_coords("monaco")
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        weather = loop.run_until_complete(data_fetcher.fetch_weather(coords['lat'], coords['lon']))
        loop.close()
        
        if weather.get("status") not in ["No API Key", "Error/Fallback", "Data Pending"]:
            print(f"[OK] Weather API functional. Status: {weather['status']}")
            return True
        else:
            print(f"[FAIL] Weather API returned unexpected status: {weather.get('status')}")
    except Exception as e:
        print(f"[FAIL] Weather API check failed: {e}")
    return False

if __name__ == "__main__":
    print(f"--- F1 MLOps System Check ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ---")
    
    tests = [
        ("F1 API", check_f1_api),
        ("ML Model", check_model_readiness),
        ("Weather API", check_weather_api)
    ]
    
    overall_success = True
    for name, test_func in tests:
        res = test_func()
        if res is False:
            overall_success = False
    
    if overall_success:
        print("\nSUMMARY: ALL SYSTEMS GO. [PASSED]")
        sys.exit(0)
    else:
        print("\nSUMMARY: SYSTEM CHECK FAILED (CRITICAL). Review logs above.")
        sys.exit(1)
