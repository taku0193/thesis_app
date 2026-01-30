import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any, List, Optional

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..config import outputs_root_path

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


class GenerateBgmRequest(BaseModel):
    bpm: Optional[float] = Field(default=None, ge=30, le=220)
    heart_rate: Optional[float] = Field(default=None, ge=30, le=220)
    intensity: Optional[str] = None
    tags: Optional[List[str]] = None
    duration: float = Field(default=15.0, ge=4.0, le=60.0)
    seed: Optional[int] = Field(default=None, ge=0)
    prompt: Optional[str] = None


class GenerateBgmResponse(BaseModel):
    url: str
    path: str
    duration: float
    bpm: float
    model: str
    prompt: str
    cached: bool


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def _resolve_bpm(req: GenerateBgmRequest) -> float:
    if req.bpm:
        return float(req.bpm)
    if req.heart_rate:
        return float(req.heart_rate)
    return 120.0


def _build_prompt(req: GenerateBgmRequest, bpm: float) -> str:
    base = req.prompt or "High energy workout music"
    parts = [
        base,
        f"BPM {int(round(bpm))}",
    ]
    if req.intensity:
        parts.append(f"intensity {req.intensity}")
    if req.tags:
        parts.append("tags " + ", ".join(req.tags))
    return ". ".join(parts)


def _hash_payload(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, ensure_ascii=True, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


def _ensure_output_dir() -> Path:
    root = outputs_root_path() / "bgm"
    root.mkdir(parents=True, exist_ok=True)
    return root


def _cleanup_outputs(out_dir: Path, keep: set[str]) -> None:
    max_age = int(os.environ.get("MUSICGEN_MAX_AGE_SEC", "1800"))
    max_files = int(os.environ.get("MUSICGEN_MAX_FILES", "20"))
    entries = []
    for wav in out_dir.glob("musicgen_*.wav"):
        if wav.name in keep:
            continue
        try:
            entries.append((wav, wav.stat().st_mtime))
        except FileNotFoundError:
            continue

    now = time.time()
    entries.sort(key=lambda item: item[1], reverse=True)
    for idx, (wav, mtime) in enumerate(entries):
        if idx < max_files and now - mtime <= max_age:
            continue
        try:
            wav.unlink(missing_ok=True)
        except TypeError:
            if wav.exists():
                wav.unlink()
        meta = wav.with_suffix(".json")
        if meta.exists():
            meta.unlink()


def _load_musicgen(model_id: str, device: str):
    try:
        import torch
        from audiocraft.models import MusicGen
    except Exception as exc:  # pragma: no cover - optional dependency
        logger.exception("MusicGen dependency import failed")
        raise HTTPException(
            status_code=500,
            detail=f"MusicGen import failed: {exc}",
        ) from exc

    if device == "cuda" and not torch.cuda.is_available():
        raise HTTPException(status_code=500, detail="CUDA is not available on this host.")

    model = MusicGen.get_pretrained(model_id, device=device)
    return model


def _write_audio(path: Path, wav, sample_rate: int) -> None:
    try:
        from audiocraft.data.audio import audio_write
    except Exception as exc:  # pragma: no cover - optional dependency
        raise HTTPException(
            status_code=500,
            detail="MusicGen audio writer not available. Install audiocraft.",
        ) from exc

    audio_write(
        str(path.with_suffix("")),
        wav,
        sample_rate,
        strategy="loudness",
        loudness_compressor=True,
        format="wav",
    )


@router.post("/generate-bgm", response_model=GenerateBgmResponse)
def generate_bgm(req: GenerateBgmRequest) -> GenerateBgmResponse:
    try:
        bpm = _resolve_bpm(req)
        bpm = _clamp(bpm, 40, 200)
        prompt = _build_prompt(req, bpm)

        model_id = os.environ.get("MUSICGEN_MODEL", "facebook/musicgen-large")
        device = os.environ.get("MUSICGEN_DEVICE", "cuda")

        payload = {
            "bpm": bpm,
            "intensity": req.intensity,
            "tags": req.tags or [],
            "duration": req.duration,
            "seed": req.seed,
            "prompt": req.prompt,
            "model": model_id,
        }
        suffix = _hash_payload(payload)
        out_dir = _ensure_output_dir()
        filename = f"musicgen_{suffix}.wav"
        out_path = out_dir / filename
        meta_path = out_dir / f"musicgen_{suffix}.json"

        _cleanup_outputs(out_dir, {filename})
        if out_path.exists():
            logger.warning(
                "MusicGen cache hit: prompt=%s bpm=%s intensity=%s tags=%s duration=%s",
                prompt,
                bpm,
                req.intensity,
                req.tags or [],
                req.duration,
            )
            return GenerateBgmResponse(
                url=f"/api/static/bgm/{filename}",
                path=str(out_path),
                duration=req.duration,
                bpm=bpm,
                model=model_id,
                prompt=prompt,
                cached=True,
            )

        model = _load_musicgen(model_id, device)
        model.set_generation_params(duration=req.duration)

        if req.seed is not None:
            try:
                import torch
            except Exception as exc:  # pragma: no cover - optional dependency
                raise HTTPException(status_code=500, detail="torch is required for seeding.") from exc
            torch.manual_seed(req.seed)

        try:
            wavs = model.generate([prompt])
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"MusicGen failed: {exc}") from exc

        if wavs is None:
            raise HTTPException(status_code=500, detail="MusicGen returned empty audio.")

        wav = wavs[0].detach().cpu()
        _write_audio(out_path, wav, model.sample_rate)

        meta = {
            "created_at": time.time(),
            "bpm": bpm,
            "intensity": req.intensity,
            "tags": req.tags or [],
            "duration": req.duration,
            "seed": req.seed,
            "prompt": prompt,
            "model": model_id,
            "path": str(out_path),
        }
        meta_path.write_text(json.dumps(meta, ensure_ascii=True, indent=2) + "\n")

        _cleanup_outputs(out_dir, {filename})

        logger.warning(
            "MusicGen generated: prompt=%s bpm=%s intensity=%s tags=%s duration=%s",
            prompt,
            bpm,
            req.intensity,
            req.tags or [],
            req.duration,
        )
        return GenerateBgmResponse(
            url=f"/api/static/bgm/{filename}",
            path=str(out_path),
            duration=req.duration,
            bpm=bpm,
            model=model_id,
            prompt=prompt,
            cached=False,
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - unexpected
        logger.exception("Unhandled MusicGen error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
