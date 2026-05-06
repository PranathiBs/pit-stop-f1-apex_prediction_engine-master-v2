"""
Pit Stop - ML Engine v2.0
Handles training, persistence, and podium predictions.
"""

import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Try relative import if called as part of package, else absolute
try:
    from . import data_fetcher
except (ImportError, ValueError):
    import data_fetcher

# --- Config ---
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def train_model(year: int):
    """Refined training logic focusing on podium prediction features."""
    print(f"Training ML model for {year} season...")
    
    # Feature columns: grid_pos, air_temp, track_temp, rain_prob
    feature_cols = ['grid', 'air_temp', 'track_temp', 'rain_prob']
    X = np.random.rand(100, len(feature_cols))
    # Target: Higher score = Better chance for podium
    # Simulated as a function of grid position and some noise
    y = 100 - (X[:, 0] * 50) + np.random.normal(0, 5, 100) 
    
    model = Pipeline([
        ('scaler', StandardScaler()),
        ('rf', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    model.fit(X, y)
    
    model_path = MODELS_DIR / f"podium_predictor_{year}.joblib"
    joblib.dump(model, model_path)
    print(f"[OK] Model saved to {model_path}")
    return model

def load_model(year: int):
    """Load the year-specific model."""
    model_path = MODELS_DIR / f"podium_predictor_{year}.joblib"
    if model_path.exists():
        return joblib.load(model_path)
    return None

def predict_podium(model, grid_positions: dict, weather_data: dict):
    """
    Predict top 3 finishers based on grid and current weather.
    grid_positions: { 'VER': 1, 'HAM': 2, ... }
    """
    if not model:
        return []
    
    results = []
    for driver, pos in grid_positions.items():
        features = [
            pos, 
            weather_data.get('air_temp', 25.0),
            weather_data.get('track_temp', 30.0),
            weather_data.get('rain_prob', 0.0)
        ]
        score = model.predict([features])[0]
        results.append({
            "driver": driver,
            "score": round(float(score), 2)
        })
    
    # Sort by score descending
    sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)
    return sorted_results[:3] # Return top 3
