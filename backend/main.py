from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import test_connection, get_db
from models import Post
from schemas import PostCreate, PostOut

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

@app.get("/posts/{post_id}", response_model=PostOut)
def read_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post