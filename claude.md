# Claude Code Instructions

あなたはこのプロジェクトの開発アシスタントです。

## 目的

HEW用のMVPを10日以内に完成させること。

完成優先。過度な設計・抽象化は不要。

---

## 開発原則

1. MVP最優先
2. 大規模リファクタ禁止
3. ファイル変更は最小単位
4. 一度に大量ファイルを変更しない
5. 既存構造を壊さない

---

## 現在の構成

backend/
- main.py
- db.py
- models.py
- schemas.py

frontend/
- React + Vite

DB:
- users
- posts
- unlocked_posts

---

## 実装優先順位

1. 解放判定ロジック（ハバースイン距離）
2. unlocked_postsへのINSERT
3. 解放済みのみ取得API
4. フロント連携
5. 最後にログイン整備

---

## 禁止事項

- Docker化しない
- 認証を本格実装しない
- DIや抽象レイヤーを増やさない
- 過剰なフォルダ分割をしない

---

## 実装ルール

- ORMは既存modelsを使う
- SQLAlchemyの2.0記法を維持
- エンドポイントは明確に
- レスポンスモデルはschemas.pyで定義