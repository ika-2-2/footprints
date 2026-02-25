# Footprints

位置情報ベースのSNSアプリ（HEW制作発表用）

## 概要

footprintsは、
「実際にその場所に行かないと投稿が見れない」
さんぽがTLになるSNSです。

ユーザーが投稿した場所から50m以内に近づくと、
投稿が解放され、タイムラインに追加されます。

---

## 技術スタック

### Frontend
- React
- TypeScript
- Vite (v5系)
- ブラウザ Geolocation API

### Backend
- FastAPI
- SQLAlchemy (ORM)
- PyMySQL

### Database
- MySQL (WSL環境)

---

## 機能概要

- ログイン
- 投稿作成（テキスト + 緯度経度 + 星5評価）
- 投稿詳細取得
- プロフィール
- 50m以内判定
- 解放済み投稿の永続化
- 解放済みのみTL表示
- いいね
- コメント

---

## セットアップ

### Backend

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

### Frontend

cd frontend
npm install
npm run dev

## データベース

DB名: footprints
テーブル: 
    - users
    - posts
    - unlocked_posts
    - comments
    - likes