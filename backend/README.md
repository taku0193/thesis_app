バックエンド（FastAPI）の最小構成です。

起動（ローカル）:
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r backend/requirements.txt
  uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

テンプレ一覧API:
  GET /api/templates

クエリ例:
  /api/templates?body_part=下半身&intensity=中
  /api/templates?exercise=スクワット・トゥタッチ
  /api/templates?q=スクワット
  /api/templates?min_difficulty=0.5&max_difficulty=1.2
  /api/templates?offset=0&limit=50

静的配信:
  /api/static
  - 既定で <repo>/data/outputs を配信
  - templates/index.json の assets は /api/static から参照可能

MusicGen BGM生成API:
  POST /api/generate-bgm
  - body: bpm, heart_rate, intensity, tags, duration, seed, prompt
  - 生成結果は /api/static/bgm に保存

例:
  curl -X POST http://localhost:8000/api/generate-bgm \
    -H 'Content-Type: application/json' \
    -d '{"heart_rate": 120, "intensity": "high", "tags": ["arms", "hiphop"], "duration": 15}'

環境変数:
  TEMPLATES_INDEX_PATH
    - 既定: <repo>/data/outputs/templates/index.json
    - 任意の index.json に差し替え可能
  MUSICGEN_MODEL
    - 既定: facebook/musicgen-large
  MUSICGEN_DEVICE
    - 既定: cuda
  MUSICGEN_MAX_AGE_SEC
    - 既定: 1800 (30分)
  MUSICGEN_MAX_FILES
    - 既定: 20

MusicGen依存:
  - GPU前提。CUDA対応のtorch/torchaudioを別途インストールしてください。
  - 例: https://pytorch.org/get-started/locally/
