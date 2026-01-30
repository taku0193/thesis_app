import os
from pathlib import Path


def templates_index_path() -> Path:
    default_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "outputs"
        / "templates"
        / "index.json"
    )
    return Path(os.environ.get("TEMPLATES_INDEX_PATH", str(default_path)))


def outputs_root_path() -> Path:
    default_path = Path(__file__).resolve().parents[1] / "data" / "outputs"
    return Path(os.environ.get("OUTPUTS_ROOT_PATH", str(default_path)))
