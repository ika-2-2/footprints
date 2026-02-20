import { useState } from "react";
import type { LoginInfo } from "./App";

const API = "http://localhost:8000";

export default function PostPage({ login, onBack }: { login: LoginInfo; onBack: () => void }) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  const handlePost = () => {
    if (!body.trim()) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await fetch(`${API}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: login.user_id, body, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      });
      setBody("");
      setStatus("投稿しました！");
    });
  };

  return (
    <div className="container">
      <header>
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <h1>投稿する</h1>
      </header>

      <section className="card">
        <div className="field-group">
          <label>内容</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="今いる場所について..."
            rows={5}
          />
        </div>
        <button onClick={handlePost}>現在地に投稿</button>
        {status && <p className="status">{status}</p>}
      </section>
    </div>
  );
}