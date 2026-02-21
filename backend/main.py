from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from db import test_connection, get_db
from models import Post, UnlockedPost, User
from schemas import PostCreate, PostOut, UnlockRequest, UnlockOut, LoginRequest, LoginOut
import math
import os, shutil

app = FastAPI()

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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


@app.post("/login", response_model=LoginOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == payload.username,
        User.password == payload.password,
    ).first()
    if user is None:
        raise HTTPException(status_code=401, detail="ユーザー名またはパスワードが違います")
    return LoginOut(user_id=user.id, username=user.username)


# 投稿作成
@app.post("/posts", response_model=PostOut)
def create_post(
    user_id: int = Form(...),
    body: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    place_name: str = Form(...),
    rating: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(image.filename)[1]
    filename = f"{user_id}_{int(__import__('time').time())}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)

    post = Post(
        user_id=user_id,
        body=body,
        lat=lat,
        lng=lng,
        place_name=place_name,
        rating=rating,
        image_path=filename,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


# 投稿解放
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


# 
@app.get("/posts/unlocked", response_model=list[PostOut])
def get_unlocked_posts(user_id: int, db: Session = Depends(get_db)):
    unlocked_ids = db.query(UnlockedPost.post_id).filter(
        UnlockedPost.user_id == user_id
    ).subquery()
    posts = db.query(Post).filter(Post.id.in_(unlocked_ids)).all()
    return posts


# 解放済みの投稿をTLに表示
@app.get("/posts/nearby", response_model=list[PostOut])
def get_nearby_posts(lat: float, lng: float, user_id: int, db: Session = Depends(get_db)):
    # 解放済みのpost_idを取得
    unlocked_ids = db.query(UnlockedPost.post_id).filter(
        UnlockedPost.user_id == user_id
    ).subquery()

    # 未解放の投稿を全取得
    posts = db.query(Post).filter(Post.id.notin_(unlocked_ids)).all()

    # 50m以内のものだけ返す
    nearby = [p for p in posts if haversine(lat, lng, p.lat, p.lng) <= 50]
    return nearby


# 
@app.get("/posts/{post_id}", response_model=PostOut)
def read_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@app.get("/timeline", response_model=list[PostOut])
def get_timeline(user_id: int, db: Session = Depends(get_db)):
    unlocked_ids = db.query(UnlockedPost.post_id).filter(
        UnlockedPost.user_id == user_id
    ).subquery()
    posts = db.query(Post).filter(Post.id.in_(unlocked_ids)).order_by(Post.created_at.desc()).all()
    return posts

