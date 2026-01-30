import json
import math
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query

from ..config import templates_index_path

router = APIRouter()

_CACHE: Dict[str, Any] = {
    "path": None,
    "mtime": None,
    "data": None,
}


def _load_index(path: Path) -> Dict[str, Any]:
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"templates index not found: {path}")

    mtime = path.stat().st_mtime
    if _CACHE["path"] == str(path) and _CACHE["mtime"] == mtime:
        return _CACHE["data"]

    data = json.loads(path.read_text(encoding="utf-8"))
    _CACHE["path"] = str(path)
    _CACHE["mtime"] = mtime
    _CACHE["data"] = data
    return data


def _match_meta(meta: Dict[str, Any], exercise: Optional[str], body_part: Optional[str], intensity: Optional[str], q: Optional[str]) -> bool:
    if exercise and meta.get("exercise") != exercise:
        return False
    if body_part and meta.get("body_part") != body_part:
        return False
    if intensity and meta.get("intensity") != intensity:
        return False
    if q:
        name = str(meta.get("exercise") or "")
        if q not in name:
            return False
    return True


def _sanitize_metrics(metrics: Dict[str, Any]) -> Dict[str, Any]:
    def sanitize_value(value):
        if isinstance(value, float) and not math.isfinite(value):
            return None
        if isinstance(value, dict):
            return {k: sanitize_value(v) for k, v in value.items()}
        if isinstance(value, list):
            return [sanitize_value(v) for v in value]
        return value

    return sanitize_value(metrics) or {}


def _match_metrics(
    metrics: Dict[str, Any],
    min_difficulty: Optional[float],
    max_difficulty: Optional[float],
    min_speed: Optional[float],
    max_speed: Optional[float],
    min_rom: Optional[float],
    max_rom: Optional[float],
) -> bool:
    if not metrics:
        return False

    difficulty = metrics.get("difficulty_score")
    speed = metrics.get("speed_mean")
    rom = metrics.get("rom_mean")

    if min_difficulty is not None and (difficulty is None or difficulty < min_difficulty):
        return False
    if max_difficulty is not None and (difficulty is None or difficulty > max_difficulty):
        return False
    if min_speed is not None and (speed is None or speed < min_speed):
        return False
    if max_speed is not None and (speed is None or speed > max_speed):
        return False
    if min_rom is not None and (rom is None or rom < min_rom):
        return False
    if max_rom is not None and (rom is None or rom > max_rom):
        return False

    return True


@router.get("/templates")
def list_templates(
    exercise: Optional[str] = Query(None, description="統一動作名（完全一致）"),
    body_part: Optional[str] = Query(None, description="部位（完全一致）"),
    intensity: Optional[str] = Query(None, description="強度（完全一致）"),
    q: Optional[str] = Query(None, description="統一動作名の部分一致検索"),
    min_difficulty: Optional[float] = Query(None, description="難易度スコアの下限"),
    max_difficulty: Optional[float] = Query(None, description="難易度スコアの上限"),
    min_speed: Optional[float] = Query(None, description="速度平均の下限"),
    max_speed: Optional[float] = Query(None, description="速度平均の上限"),
    min_rom: Optional[float] = Query(None, description="可動域平均の下限"),
    max_rom: Optional[float] = Query(None, description="可動域平均の上限"),
    offset: int = Query(0, ge=0, description="取得開始位置"),
    limit: int = Query(100, ge=1, le=1000, description="取得件数"),
):
    path = templates_index_path()
    data = _load_index(path)
    templates = data.get("templates", [])

    metric_filters = any(
        v is not None
        for v in (min_difficulty, max_difficulty, min_speed, max_speed, min_rom, max_rom)
    )

    filtered = []
    for entry in templates:
        meta = entry.get("meta") or {}
        if not _match_meta(meta, exercise, body_part, intensity, q):
            continue

        if metric_filters:
            people = []
            for person in entry.get("people", []):
                if _match_metrics(
                    person.get("metrics") or {},
                    min_difficulty,
                    max_difficulty,
                    min_speed,
                    max_speed,
                    min_rom,
                    max_rom,
                ):
                    people.append(person)
            if not people:
                continue
            entry = dict(entry)
            entry["people"] = people

        for person in entry.get("people", []):
            if "metrics" in person:
                person["metrics"] = _sanitize_metrics(person["metrics"])

        filtered.append(entry)

    total = len(filtered)
    sliced = filtered[offset : offset + limit]
    return {"total": total, "offset": offset, "limit": limit, "templates": sliced}
