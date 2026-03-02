import math
import mimetypes
import os, shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db import test_connection, get_db, engine
from geocoding import get_place_name
from models import Base, Post, UnlockedPost, User, Comment, Like
from r2 import upload_to_r2
from schemas import PostCreate, PostOut, UnlockRequest, UnlockOut, LoginRequest, LoginOut, CommentCreate, CommentOut, LikeOut, RegisterRequests, UserOut

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads" 
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()
Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 距離測定
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

# ログイン
@app.post("/login", response_model=LoginOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == payload.username,
        User.password == payload.password,
    ).first()
    if user is None:
        raise HTTPException(status_code=401, detail="ユーザー名またはパスワードが違います")
    return LoginOut(user_id=user.id, username=user.username)

# 新規登録
@app.post("/register", response_model=LoginOut)
def register(payload: RegisterRequests, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        User.username == payload.username
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="このユーザー名は既に使われています")
    user = User(username=payload.username, password=payload.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return LoginOut(user_id=user.id, username=user.username)

# 投稿作成
@app.post("/posts", response_model=PostOut)
def create_post(
    user_id: int = Form(...),
    body: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    rating: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    place_name = get_place_name(lat, lng)

    ext = os.path.splitext(image.filename)[1]
    filename = f"{user_id}_{int(__import__('time').time())}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)

    # R2にアップロード
    r2_url = upload_to_r2(str(filepath), filename)
    os.remove(filepath)  # 一時ファイル削除

    post = Post(
        user_id=user_id,
        body=body,
        lat=lat,
        lng=lng,
        place_name=place_name,
        rating=rating,
        image_path=r2_url,  # URLをそのまま保存
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
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # 既に解放済みなので正常扱い
    return UnlockOut(already_unlocked=False, unlocked=True, distance_m=round(dist, 2))


# *
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
    ).scalar_subquery()

    # 未解放の投稿を全取得
    posts = db.query(Post).filter(Post.id.notin_(unlocked_ids)).all()

    # 50m以内のものだけ返す
    nearby = [p for p in posts if haversine(lat, lng, p.lat, p.lng) <= 50]
    return nearby


# *
@app.get("/posts/{post_id}", response_model=PostOut)
def read_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

# TL
@app.get("/timeline", response_model=list[PostOut])
def get_timeline(user_id: int, db: Session = Depends(get_db)):
    unlocked_ids = db.query(UnlockedPost.post_id).filter(
        UnlockedPost.user_id == user_id
    ).scalar_subquery()
    posts = db.query(Post).filter(Post.id.in_(unlocked_ids)).order_by(Post.created_at.desc()).all()
    result = []
    for p in posts:
        out = PostOut.model_validate(p)
        out.username = p.user.username
        out.icon_path = p.user.icon_path
        result.append(out)
    return result

# コメント取得
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

# コメント投稿
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

# いいね
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

# いいね(取得)
@app.get("/posts/{post_id}/like", response_model=LikeOut)
def get_like(post_id: int, user_id: int, db: Session = Depends(get_db)):
    liked = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == user_id,
    ).first() is not None
    count = db.query(Like).filter(Like.post_id == post_id).count()
    return LikeOut(post_id=post_id, liked=liked, count=count)

# マイページ
@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# マイページ(アイコン設定)
@app.post("/users/{user_id}/icon", response_model=UserOut)
def upload_icon(user_id: int, image: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    ext = os.path.splitext(image.filename)[1]
    filename = f"icon_{user_id}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)

    # R2にアップロード
    r2_url = upload_to_r2(str(filepath), filename)
    os.remove(filepath)  # 一時ファイル削除

    user.icon_path = r2_url
    db.commit()
    db.refresh(user)
    return user

# マイページ(バナー設定)
@app.post("/users/{user_id}/banner", response_model=UserOut)
def upload_banner(user_id: int, image: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    ext = os.path.splitext(image.filename)[1]
    filename = f"banner_{user_id}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)

    # R2にアップロード
    r2_url = upload_to_r2(str(filepath), filename)
    os.remove(filepath)  # 一時ファイル削除
    
    user.banner_path = r2_url
    db.commit()
    db.refresh(user)
    return user

# マイページ(投稿取得)
@app.get("/users/{user_id}/posts", response_model=list[PostOut])
def get_user_posts(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.user_id == user_id).order_by(Post.created_at.desc()).all()
    result = []
    for p in posts:
        out = PostOut.model_validate(p)
        out.username = p.user.username
        out.icon_path = p.user.icon_path
        result.append(out)
    return result

# マイページ(いいね投稿取得) 
@app.get("/users/{user_id}/likes", response_model=list[PostOut])
def get_user_likes(user_id: int, db: Session = Depends(get_db)):
    liked_ids = db.query(Like.post_id).filter(Like.user_id == user_id).scalar_subquery()
    posts = db.query(Post).filter(Post.id.in_(liked_ids)).order_by(Post.created_at.desc()).all()
    result = []
    for p in posts:
        out = PostOut.model_validate(p)
        out.username = p.user.username
        out.icon_path = p.user.icon_path
        result.append(out)
    return result