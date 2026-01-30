Thetis App 再現手順（お手本映像完成後から）
==========================================

範囲
----
本書は「お手本映像・テンプレ出力が**既に完成している**」前提で再現します。
PyMAF によるテンプレ生成手順は含みません。

ゴール
------
- UI がテンプレ一覧を読み込める
- お手本動画（template.mp4）が UI で再生される
- スコア計算・指標表示まで UI が動作する
- API が `GET /api/templates` を返せる

必要な入力（生成済みデータ）
----------------------------
以下の構成で、**一つの outputs ルート配下**に配置してください。

```
<outputs_root>/
  templates/
    index.json
    <clip_id>/
      summary.json
      template.mp4
      person_0000/ または person_0001/
        pymaf_outputs.npz
        summary.json
        metrics.json
        joints3d_preview.json
        joints3d_series.json
```

例（このリポジトリ構成）:
```
data/outputs/templates/index.json
data/outputs/templates/<clip_id>/template.mp4
```

Backend は `index.json` を読み込み、`/api/static/*` で配信します。

Google Drive のお手本映像（配布）
---------------------------------
GitHubには動画を上げず、Google Driveから**ダウンロードして配置**する方式にします。

手順:
1) 共有フォルダからお手本動画をダウンロード
2) ローカルの `templates/<clip_id>/template.mp4` に配置
3) `index.json` の `assets.template_video` は **相対パス**のまま使用
   （例: `templates/[43ujp3KQ8kE]_0001/template.mp4`）

完全起動のためのデータ配置方針
------------------------------
- Google Drive に置く: `templates/<clip_id>/template.mp4`（配布用）
- GitHub/ローカルに置く: `index.json` と `person_*` 配下の各 JSON/NPZ

前提条件
--------
- Python 3.x
- （任意）MusicGen を使う場合は GPU + CUDA
- `localhost` のカメラ権限が有効なブラウザ

依存関係の最小構成（UI起動のみ）
------------------------------
必須:
- Python 3.x
- pip
- ブラウザ（Chrome推奨）

不要（UI起動には不要）:
- Docker / PyMAF
- SMPLモデル
- CUDA / GPU（MusicGenを使わないなら不要）

依存関係の補足（つまずきポイント）
------------------------------
- MediaPipeはCDN参照です。オフライン環境では動きません。
- カメラは `localhost` でのみ許可されることがあります。
- `index.json` の `assets.template_video` が
  `templates/<clip_id>/template.mp4` になっている必要があります。
- `template.mp4` は Google Drive からダウンロードして
  `data/outputs/templates/<clip_id>/template.mp4` に配置してください。

MediaPipe（フロントエンド）
--------------------------
- `frontend/index.html` で以下をCDN読み込みしています。
  - `@mediapipe/pose`
  - `@mediapipe/face_mesh`
  - `@mediapipe/camera_utils`
- オフライン環境で動かす場合は、これらのJSをローカルに配置し、
  `index.html` の読み込み先をローカルパスに変更してください。

MusicGen（バックエンド / 任意）
------------------------------
- `POST /api/generate-bgm` でBGMを生成します（`backend/routers/musicgen.py`）。
- 依存: `audiocraft`, `torch`（GPU推奨）
- モデル取得が必要なため、初回はネットワークが必要です。
- GPUなしで使う場合は環境変数で `MUSICGEN_DEVICE=cpu` を設定してください。

Backend セットアップ（API + 静的配信）
---------------------------------------
1) 仮想環境の作成と有効化:
```
python3 -m venv .venv
source .venv/bin/activate
```

2) 依存関係のインストール:
```
pip install -r backend/requirements.txt
```

3) API 起動:
```
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

4) outputs 配置が `data/outputs` 以外の場合は環境変数を設定:
```
export OUTPUTS_ROOT_PATH=/path/to/outputs_root
export TEMPLATES_INDEX_PATH=/path/to/outputs_root/templates/index.json
```

Frontend セットアップ（静的 UI）
-------------------------------
同一ホストで `frontend/` を配信します。
```
python3 -m http.server 8080 --directory frontend
```

アクセス:
```
http://localhost:8080/
```

注意点
------
- UI は `GET /api/templates?limit=1000` を呼びます。
- `index.json` 内のアセットパスは **`<outputs_root>` からの相対パス**である必要があります。
  （Backend が `<outputs_root>` を `/api/static` で配信するため）
- MediaPipe は CDN 読み込みのため、オフライン再現にはローカル配置が必要です。

簡易チェック
------------
```
curl http://localhost:8000/api/health
curl http://localhost:8000/api/templates?limit=1
```
