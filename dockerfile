FROM python:3.12-slim

WORKDIR /app

# 先に依存だけ入れてキャッシュ効かせる
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# アプリ本体
COPY backend/ .

# RailwayがPORTを渡す。ローカル実行でも動くようにデフォルト8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]