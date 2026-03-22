"""
ML Model Monitoring — Drift detection, performance tracking
"""
import time
import statistics
from collections import defaultdict, deque
from datetime import datetime

class ModelMonitor:
    def __init__(self, model_name: str, window_size: int = 1000):
        self.model_name  = model_name
        self.window_size = window_size
        self.predictions = deque(maxlen=window_size)
        self.errors      = deque(maxlen=window_size)
        self.latencies   = deque(maxlen=window_size)
        self.start_time  = time.time()

    def record_prediction(self, predicted: float, actual: float = None, latency_ms: float = 0):
        self.predictions.append(predicted)
        self.latencies.append(latency_ms)
        if actual is not None:
            self.errors.append(abs(predicted - actual))

    def get_stats(self) -> dict:
        preds = list(self.predictions)
        lats  = list(self.latencies)
        errs  = list(self.errors)

        stats = {
            "model":          self.model_name,
            "total_preds":    len(preds),
            "uptime_hours":   round((time.time() - self.start_time) / 3600, 2),
            "latency_p50_ms": round(statistics.median(lats),  2) if lats else 0,
            "latency_p99_ms": round(sorted(lats)[int(len(lats)*0.99)-1], 2) if len(lats) > 1 else 0,
        }

        if preds:
            stats["prediction_mean"] = round(statistics.mean(preds), 4)
            stats["prediction_std"]  = round(statistics.stdev(preds) if len(preds) > 1 else 0, 4)

        if errs:
            stats["mae"] = round(statistics.mean(errs), 4)

        return stats

    def check_drift(self, threshold_std: float = 2.0) -> dict:
        preds = list(self.predictions)
        if len(preds) < 50:
            return {"drift_detected": False, "reason": "insufficient_data"}

        half = len(preds) // 2
        old_mean = statistics.mean(preds[:half])
        new_mean = statistics.mean(preds[half:])
        std      = statistics.stdev(preds) if len(preds) > 1 else 1

        z_score  = abs(new_mean - old_mean) / max(std, 0.001)
        drift    = z_score > threshold_std

        return {
            "drift_detected": drift,
            "z_score":        round(z_score, 3),
            "old_mean":       round(old_mean, 4),
            "new_mean":       round(new_mean, 4),
            "reason":         f"z-score {z_score:.2f} > {threshold_std}" if drift else "stable",
        }


monitors = {
    "eta":    ModelMonitor("eta"),
    "surge":  ModelMonitor("surge"),
    "fraud":  ModelMonitor("fraud"),
    "demand": ModelMonitor("demand"),
}
