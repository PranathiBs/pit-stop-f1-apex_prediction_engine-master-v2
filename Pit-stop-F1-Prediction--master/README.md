# Pit Stop — F1 Prediction Dashboard 🏎️ (MLOps v5.0)

[![Pit Stop MLOps Pipeline](https://github.com/PranathiBs/Pit-stop-F1-Prediction-and-Gran-Prix-calendar--master/actions/workflows/pipeline.yml/badge.svg)](https://github.com/PranathiBs/Pit-stop-F1-Prediction-and-Gran-Prix-calendar--master/actions/workflows/pipeline.yml)

A professional, self-sustaining F1 Prediction Engine. This system is designed for high availability and "forever" consistency by automatically updating data, re-training models, and verifying its own health.

## 🟢 System Status & Verification

To ensure the system is "Working" at all times, we use a multi-layered validation approach:

1.  **Automated 'Smoke Test'**: Run `python tests/check_system.py` locally. This script verifies F1 API connectivity, checks if the ML model is loaded/functional, and validates the Weather API key.
2.  **FastAPI Health Endpoint**: High-level status available at `/health`, reporting model readiness and cache depth.
3.  **GitHub Actions Guardrails**: The [pipeline.yml](.github/workflows/pipeline.yml) ensures that no broken code or corrupt data is ever pushed. If a test fails, the deployment stops.

## 🏗️ Project Architecture

```text
├── .github/workflows/
│   └── pipeline.yml         # CI/CD: Tests, Trains, and Commits updates
├── data/
│   └── processed/           # JSON Caching Layer (The 'Forever' storage)
├── models/                  # Versioned ML Model Binaries (.joblib)
├── src/
│   ├── data_fetcher.py      # FastF1 & OpenWeather integration logic
│   └── model_engine.py      # Podium Prediction ML logic
├── scripts/
│   └── update_engine.py     # Automation script for weekly retraining
├── tests/
│   └── check_system.py      # System validation & Smoke testing
├── main.py                  # Production FastAPI Backend
└── requirements.txt         # Optimized dependency list
```

## 🚀 The 'Forever' Data Engine

This project solves the "Data Decay" problem common in sports dashboards:
*   **JSON Caching**: Once a Grand Prix's results or weather are fetched, they are stored in `data/processed/`. The engine checks this local cache first, significantly reducing API latency and preventing "Breaking Changes" from external data providers.
*   **Automated Updates**: Every Monday (via GitHub Actions), the system pulls the latest race results, retrains the Random Forest model for the current season, and commits the updated binaries back to the repository.

## 📡 Core API Endpoints

- `GET /health`: Returns system status and model readiness.
- `GET /api/calendar/{year}`: Full season schedule.
- `GET /predict/race/{year}/{gp}`: AI-generated podium predictions based on grid and current weather.

## 🛠️ Setup & Secrets

1.  **Weather API**: Add `NEXT_PUBLIC_OPENWEATHER_API_KEY` to your `.env` file and GitHub Repository Secrets.
2.  **Local Dev**: 
    ```bash
    pip install -r requirements.txt
    python tests/check_system.py  # Verify setup
    uvicorn main:app --reload --port 8888
    ```

---
*Built with ❤️ for F1 fans and MLOps enthusiasts.*
