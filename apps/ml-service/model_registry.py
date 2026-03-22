"""
Model Registry — MLflow-style model versioning
"""
import os, json
from datetime import datetime
from pathlib import Path

MODEL_DIR = Path(os.getenv("MODEL_DIR", "/tmp/ml_models"))
MODEL_DIR.mkdir(parents=True, exist_ok=True)

class ModelRegistry:
    def __init__(self, name: str):
        self.name    = name
        self.dir     = MODEL_DIR / name
        self.dir.mkdir(exist_ok=True)
        self.meta_file = self.dir / "registry.json"
        self._meta = self._load()

    def _load(self) -> dict:
        if self.meta_file.exists():
            return json.loads(self.meta_file.read_text())
        return {"versions": [], "production": None, "staging": None}

    def _save(self):
        self.meta_file.write_text(json.dumps(self._meta, indent=2))

    def register_version(self, version: str, metrics: dict, config: dict = None):
        entry = {
            "version":    version,
            "metrics":    metrics,
            "config":     config or {},
            "registered": datetime.now().isoformat(),
            "stage":      "none",
        }
        self._meta["versions"].append(entry)
        self._save()
        return entry

    def promote(self, version: str, stage: str = "production"):
        for v in self._meta["versions"]:
            if v["version"] == version:
                v["stage"]       = stage
                self._meta[stage] = version
                self._save()
                return True
        return False

    def get_production(self) -> dict | None:
        prod = self._meta.get("production")
        if not prod:
            return None
        for v in self._meta["versions"]:
            if v["version"] == prod:
                return v
        return None

    def list_versions(self) -> list:
        return self._meta["versions"]


# Initialize registries
surge_registry  = ModelRegistry("surge_pricing")
eta_registry    = ModelRegistry("eta_model")
fraud_registry  = ModelRegistry("fraud_detector")
demand_registry = ModelRegistry("demand_predictor")

# Register baseline versions
for reg, metrics in [
    (surge_registry,  {"accuracy": 0.87, "mae": 0.08}),
    (eta_registry,    {"mae_minutes": 1.8, "rmse": 2.3}),
    (fraud_registry,  {"precision": 0.94, "recall": 0.91, "f1": 0.925}),
    (demand_registry, {"accuracy": 0.83, "mape": 0.12}),
]:
    if not reg.list_versions():
        reg.register_version("1.0.0", metrics)
        reg.promote("1.0.0")
