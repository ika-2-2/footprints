from pydantic import BaseModel, Field


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

    # ORM(Post)をそのまま返してもOK
    class Config:
        from_attributes = True