from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import outputs_root_path
from .routers import health, musicgen, templates

app = FastAPI(title="Thetis App API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(health.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(musicgen.router, prefix="/api")
app.mount("/api/static", StaticFiles(directory=outputs_root_path()), name="static")
