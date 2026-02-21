from pydantic import BaseModel, Field
from datetime import datetime


# クライアント→サーバー
class PostCreate(BaseModel):
    user_id: int = Field(..., ge=1)
    body: str = Field(..., min_length=1, max_length=1000) #投稿文字数設定
    lat: float
    lng: float


# サーバー→クライアント(JSONにして返す)
class PostOut(BaseModel):
    id: int
    user_id: int
    body: str
    lat: float
    lng: float
    image_path: str
    place_name: str
    rating: int
    created_at: datetime

    class Config:
        from_attributes = True

class UnlockRequest(BaseModel):
    user_id: int = Field(..., ge=1)
    lat: float
    lng: float

class UnlockOut(BaseModel):
    already_unlocked: bool
    unlocked: bool
    distance_m: float

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginOut(BaseModel):
    user_id: int
    username: str

class CommentOut(BaseModel):
    id: int
    post_id: int
    user_id: int
    body: str
    created_at: datetime
    username: str = ""

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    user_id: int
    body: str = Field(..., min_length=1, max_length=500) #文字数制限