Template browser (static frontend).

Usage
- Start backend: uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
- Serve this folder on the same host (so /api/* resolves):
  python3 -m http.server 8080 --directory frontend
- Open: http://localhost:8080/

Notes
- Static assets are fetched from /api/static (backend serves data/outputs).
- If you serve frontend on a different host/port, enable CORS on the backend.
