import math
import os, shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from db import test_connection, get_db
from models import Post, UnlockedPost, User, Comment, Like
from schemas import PostCreate, PostOut, UnlockRequest, UnlockOut, LoginRequest, LoginOut, CommentCreate, CommentOut, LikeOut

app = FastAPI()

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.get("/posts/{post_id}/comments", response_model=list[CommentOut])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).all()
    result = []
    for c in comments:
        result.append(CommentOut(
            id=c.id,
            post_id=c.post_id,
            user_id=c.user_id,
            body=c.body,
            created_at=c.created_at,
            username=c.user.username,
        ))
    return result


@app.post("/posts/{post_id}/comments", response_model=CommentOut)
def create_comment(post_id: int, payload: CommentCreate, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    comment = Comment(post_id=post_id, user_id=payload.user_id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentOut(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        body=comment.body,
        created_at=comment.created_at,
        username=comment.user.username,
    )


@app.post("/posts/{post_id}/like", response_model=LikeOut)
def toggle_like(post_id: int, user_id: int, db: Session = Depends(get_db)):
    existing = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == user_id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        db.add(Like(post_id=post_id, user_id=user_id))
        db.commit()
        liked = True

    count = db.query(Like).filter(Like.post_id == post_id).count()
    return LikeOut(post_id=post_id, liked=liked, count=count)


@app.get("/posts/{post_id}/like", response_model=LikeOut)
def get_like(post_id: int, user_id: int, db: Session = Depends(get_db)):
    liked = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == user_id,
    ).first() is not None
    count = db.query(Like).filter(Like.post_id == post_id).count()
    return LikeOut(post_id=post_id, liked=liked, count=count)
