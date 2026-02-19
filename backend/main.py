from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import test_connection, get_db
from models import Post, UnlockedPost
from schemas import PostCreate, PostOut, UnlockRequest, UnlockOut
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def haversine(lat1, lng1, lat2, lng2) -> float:
    """2点間の距離をメートルで返す"""
    # ハバースイン距離計算
    R = 6371000  # 地球半径(m)
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    result = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return result

@app.on_event("startup")
def on_startup():
    test_connection()


@app.get("/")
def root():
    return {"ok": True}


@app.post("/posts", response_model=PostOut)
def create_post(payload: PostCreate, db:Session = Depends(get_db)):
    # id存在チェックまだ
    post = Post(
        user_id=payload.user_id,
        body=payload.body,
        lat=payload.lat,
        lng=payload.lng,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@app.post("/posts/{post_id}/unlock", response_model=UnlockOut)
def unlock_post(post_id: int, payload: UnlockRequest, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # 既に解放済みか確認
    already = db.query(UnlockedPost).filter(
        UnlockedPost.user_id == payload.user_id,
        UnlockedPost.post_id == post_id,
    ).first()
    if already:
        return UnlockOut(already_unlocked=True, unlocked=True, distance_m=0.0)

    # 距離判定
    dist = haversine(payload.lat, payload.lng, post.lat, post.lng)
    if dist > 50:   # ここで解放する距離を変えれる
        return UnlockOut(already_unlocked=False, unlocked=False, distance_m=round(dist, 2))

    # 開放範囲以内 → INSERT
    record = UnlockedPost(user_id=payload.user_id, post_id=post_id)
    db.add(record)
    db.commit()
    return UnlockOut(already_unlocked=False, unlocked=True, distance_m=round(dist, 2))


@app.get("/posts/unlocked", response_model=list[PostOut])
def get_unlocked_posts(user_id: int, db: Session = Depends(get_db)):
    unlocked_ids = db.query(UnlockedPost.post_id).filter(
        UnlockedPost.user_id == user_id
    ).subquery()
    posts = db.query(Post).filter(Post.id.in_(unlocked_ids)).all()
    return posts


@app.get("/posts/{post_id}", response_model=PostOut)
def read_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post