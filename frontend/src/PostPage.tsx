import { useState } from "react";
import type { LoginInfo } from "./App";
import "./css/PostPage.css";

const API = "http://localhost:8000";

export default function PostPage({ login, onBack }: { login: LoginInfo; onBack: () => void }) {
  const [body, setBody] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // 本文の文字数設定
  const MAX_LENGTH = 1000;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handlePost = () => {
    if (!body.trim()) { setError("本文を入力してください"); return; }
    if (!placeName.trim()) { setError("場所名を入力してください"); return; }
    if (!image) { setError("画像を選択してください"); return; }
    if (rating === 0) { setError("評価を選択してください"); return; }
    setError("");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const form = new FormData();
      form.append("user_id", String(login.user_id));
      form.append("body", body);
      form.append("lat", String(pos.coords.latitude));
      form.append("lng", String(pos.coords.longitude));
      form.append("place_name", placeName);
      form.append("rating", String(rating));
      form.append("image", image);

      const res = await fetch(`${API}/posts`, { method: "POST", body: form });
      if (!res.ok) { setError("投稿に失敗しました"); return; }
      setStatus("投稿しました！");
      setTimeout(() => onBack(), 1000);
    }, () => {
      setError("位置情報の取得に失敗しました");
    });
  };

  return (
    <div className="container">
      <header>
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <span style={{ fontWeight: 700 }}>投稿する</span>
        <div style={{ width: 60 }} />
      </header>

      <div className="card">
        {/* 画像 */}
        <div className="field-group">
          <label>📷 画像 *</label>
          <label className="image-upload-area">
            {preview
              ? <img src={preview} alt="preview" className="image-preview" />
              : <span className="image-placeholder">タップして画像を選択</span>
            }
            <input type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
          </label>
        </div>

        {/* 場所名 */}
        <div className="field-group">
          <label>📍 場所名 *</label>
          <input
            type="text"
            placeholder="例: 名城公園"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
          />
        </div>

        {/* 評価 */}
        <div className="field-group">
          <label>⭐ 評価 *</label>
          <div className="star-row">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`star ${s <= rating ? "on" : ""}`}
                onClick={() => setRating(s)}
              >★</span>
            ))}
          </div>
        </div>

        {/* 本文 */}
        <div className="field-group">
          <label>📝 本文 *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="この場所について..."
            rows={4}
            maxLength={MAX_LENGTH}
          />
          {/* 本文の文字数を表示 (〇〇/1000) */}
          <p className={`char-count ${body.length >= MAX_LENGTH ? "over" : ""}`}>
            {body.length} / {MAX_LENGTH}
          </p>
        </div>

        {error && <p className="field-error">⚠ {error}</p>}
        {status && <p className="status">{status}</p>}

        <button onClick={handlePost}>投稿する</button>
      </div>
    </div>
  );
}