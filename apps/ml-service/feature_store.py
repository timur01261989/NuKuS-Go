"""
Feature Store — Centralized feature computation for ML models
"""
import math
from datetime import datetime
from typing import Dict, Any, Optional

class FeatureStore:
    """
    Computes and caches features for ML model inference.
    In production: replace with Redis-backed feature store.
    """

    @staticmethod
    def ride_features(
        pickup_lat:  float,
        pickup_lng:  float,
        dropoff_lat: float,
        dropoff_lng: float,
        hour:        int,
        day_of_week: int,
        weather:     str = "clear",
        vehicle_type: str = "sedan",
        driver_score: float = 0.7,
    ) -> Dict[str, Any]:
        dist_km = FeatureStore._haversine(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
        return {
            "dist_km":           dist_km,
            "is_rush_hour":      int(7 <= hour < 10 or 17 <= hour < 21),
            "is_weekend":        int(day_of_week >= 5),
            "is_night":          int(22 <= hour or hour < 6),
            "is_rain":           int(weather in ["rain", "snow"]),
            "sin_hour":          math.sin(2 * math.pi * hour / 24),
            "cos_hour":          math.cos(2 * math.pi * hour / 24),
            "sin_day":           math.sin(2 * math.pi * day_of_week / 7),
            "cos_day":           math.cos(2 * math.pi * day_of_week / 7),
            "vehicle_speed_factor": {"sedan":1.0,"suv":0.95,"minivan":0.9,"truck":0.8,"electric":1.1}.get(vehicle_type,1.0),
            "driver_skill":      driver_score,
            "pickup_density":    FeatureStore._estimate_density(pickup_lat, pickup_lng),
        }

    @staticmethod
    def driver_features(
        driver_id:       str,
        trips_today:     int,
        online_hours:    float,
        rating:          float,
        acceptance_rate: float,
        cancel_rate:     float,
    ) -> Dict[str, Any]:
        return {
            "trips_today":        trips_today,
            "online_hours":       online_hours,
            "rating":             rating,
            "acceptance_rate":    acceptance_rate,
            "cancel_rate":        cancel_rate,
            "fatigue_score":      max(0.0, 1.0 - trips_today / 30.0),
            "reliability_score":  rating / 5.0 * acceptance_rate * (1 - cancel_rate),
            "earnings_momentum":  min(1.0, trips_today / 15.0),
        }

    @staticmethod
    def _haversine(lat1, lng1, lat2, lng2) -> float:
        R = 6371.0
        to_r = lambda x: x * math.pi / 180
        dl = to_r(lat2 - lat1)
        dg = to_r(lng2 - lng1)
        a  = math.sin(dl/2)**2 + math.cos(to_r(lat1))*math.cos(to_r(lat2))*math.sin(dg/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    @staticmethod
    def _estimate_density(lat: float, lng: float) -> float:
        # Simulate density — in production use H3 hexagon demand data
        center_lat, center_lng = 41.2995, 69.2401
        dist = FeatureStore._haversine(lat, lng, center_lat, center_lng)
        return max(0.1, 1.0 - dist / 30.0)
