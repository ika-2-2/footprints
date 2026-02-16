from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import test_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    test_connection()

@app.get("/")
def root():
    return {"ok": True}
