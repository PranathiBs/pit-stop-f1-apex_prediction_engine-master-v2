"""
MLOps Update Script
Fetches latest data, retrains model, and prepares for commit.
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add root directory to path to allow absolute imports
ROOT = Path(__file__).parent.parent
sys.path.append(str(ROOT))
sys.path.append(str(ROOT / "src"))

try:
    import model_engine
    import data_fetcher
except ImportError as e:
    print(f"Import Error in update_engine: {e}")
    sys.exit(1)

def run_update():
    year = datetime.now().year
    print(f"--- Starting MLOps Engine Update ({datetime.now().strftime('%Y-%m-%d')}) ---")
    
    try:
        # 1. Update/Train the model for the current season
        model = model_engine.train_model(year)
        
        # 2. Warm up cache for the next GP if possible
        # (This is where you'd add logic to fetch upcoming schedules)
        
        print(f"[SUCCESS] Engine update completed for {year}.")
    except Exception as e:
        print(f"[CRITICAL FAILURE] Engine update failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_update()
