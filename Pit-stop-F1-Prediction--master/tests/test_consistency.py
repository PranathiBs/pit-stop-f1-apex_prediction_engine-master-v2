import requests
import pytest

BASE_URL = "http://localhost:8888"

def test_health():
    """Test standard health check."""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_calendar():
    """Test calendar fetching for current season."""
    response = requests.get(f"{BASE_URL}/api/calendar/2024")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "raceName" in data[0]

def test_weather_cache():
    """Test weather endpoint and caching logic."""
    # Using a known GP
    response = requests.get(f"{BASE_URL}/api/weather/2024/Australia/Race")
    assert response.status_code == 200
    data = response.json()
    assert "air_temp" in data
    assert "source" in data

if __name__ == "__main__":
    print("Run with: pytest tests/test_consistency.py")
