import boto3
import os
from pathlib import Path

R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_ENDPOINT = os.getenv("R2_ENDPOINT")
R2_BUCKET = os.getenv("R2_BUCKET")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")

s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
)

def upload_to_r2(local_path: str, filename: str) -> str:
    """ファイルをR2にアップロードしてパブリックURLを返す"""
    import mimetypes
    mime_type, _ = mimetypes.guess_type(local_path)
    s3.upload_file(
        local_path,
        R2_BUCKET,
        filename,
        ExtraArgs={"ContentType": mime_type or "image/jpeg"},
    )
    return f"{R2_PUBLIC_URL}/{filename}"