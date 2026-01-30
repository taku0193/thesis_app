# thesis_app

Dockerでの起動（GPU前提）

```
docker compose up --build
```

- フロントエンド: http://localhost:8080
- バックエンドAPI: http://localhost:8000
- 静的配信: http://localhost:8000/api/static

メモ
- `data/outputs` をボリュームとしてマウントしています。
- GPU前提構成です（`MUSICGEN_DEVICE=cuda`）。
- NVIDIA Container Toolkit などのGPU設定が必要です。
