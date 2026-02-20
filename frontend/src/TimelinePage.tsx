import { useEffect, useState } from "react";
import type { LoginInfo } from "./App";

const API = "http://localhost:8000";

type Post = { id: number; user_id: number; body: string; lat: number; lng: number; };

export default function TimelinePage({ login, onGoPost }: { login: LoginInfo; onGoPost: () => void }) {
  const [timeline, setTimeline] = useState<Post[]>([]);
  const [postId, setPostId] = useState("");
  const [unlockResult, setUnlockResult] = useState("");

  const fetchTimeline = async () => {
    const res = await fetch(`${API}/timeline?user_id=${login.user_id}`);
    const data = await res.json();
    setTimeline(data);
  };

  useEffect(() => { fetchTimeline(); }, []);

  const handleUnlock = () => {
    if (!postId) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API}/posts/${postId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: login.user_id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      });
      const data = await res.json();
      if (data.unlocked) {
        setUnlockResult(`✅ 解放！ 距離: ${data.distance_m}m`);
        fetchTimeline();
      } else {
        setUnlockResult(`❌ 範囲外 距離: ${data.distance_m}m`);
      }
    });
  };

  return (
    <div className="container">
      <header>
        <h1>Footprints</h1>
        <span className="username">{login.username}</span>
      </header>

      <button className="post-fab" onClick={onGoPost}>＋ 投稿する</button>

      <section className="card">
        <h2>投稿を解放する</h2>
        <div className="unlock-row">
          <input type="number" placeholder="post_id" value={postId} onChange={(e) => setPostId(e.target.value)} />
          <button onClick={handleUnlock}>現在地で解放</button>
        </div>
        {unlockResult && <p className="status">{unlockResult}</p>}
      </section>

      <section className="card">
        <div className="tl-header">
          <h2>タイムライン</h2>
          <button className="small" onClick={fetchTimeline}>更新</button>
        </div>
        {timeline.length === 0 ? (
          <p className="empty">解放済みの投稿がありません。現地へ行こう！</p>
        ) : (
          <ul className="timeline">
            {timeline.map((post) => (
              <li key={post.id} className="post-card">
                <p>{post.body}</p>
                <small>by user:{post.user_id} / {post.lat.toFixed(4)}, {post.lng.toFixed(4)}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}