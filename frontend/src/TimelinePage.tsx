import { useEffect, useState } from "react";
import type { LoginInfo } from "./App";

const API = "http://localhost:8000";

type Post = {
  id: number;
  user_id: number;
  body: string;
  lat: number;
  lng: number;
  image_path: string;
  place_name: string;
  rating: number;
  created_at: string;
};

export default function TimelinePage({ login, onGoPost }: { login: LoginInfo; onGoPost: () => void }) {
  const [timeline, setTimeline] = useState<Post[]>([]);

  const fetchTimeline = async () => {
    const res = await fetch(`${API}/timeline?user_id=${login.user_id}`);
    const data = await res.json();
    setTimeline(data);
  };

  useEffect(() => { fetchTimeline(); }, []);

  return (
    <div className="container">
      <header>
        <span className="header-logo">Footprints</span>
        <span className="username">{login.username}</span>
      </header>

      <div className="tl-list">
        {timeline.length === 0 ? (
          <div className="empty-tl">
            <p>👣</p>
            <p>さんぽをして投稿を集めよう！</p>
          </div>
        ) : (
          timeline.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* 下メニューバー */}
      <nav className="bottom-nav">
        <button className="nav-item active">🏠<span>TL</span></button>
        <button className="nav-item">🔍<span>検索</span></button>
        <button className="nav-item post-btn" onClick={onGoPost}>＋</button>
        <button className="nav-item">🔔<span>通知</span></button>
        <button className="nav-item">👤<span>マイページ</span></button>
      </nav>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const date = new Date(post.created_at).toLocaleDateString("ja-JP", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="post-card">
      <div className="post-card-header">
        <div className="avatar" />
        <span className="post-username">user:{post.user_id}</span>
      </div>
      <img
        src={`${API}/uploads/${post.image_path}`}
        alt={post.place_name}
        className="post-image"
      />
      <div className="post-card-body">
        <div className="post-meta">
          <span className="post-place">📍 {post.place_name}</span>
          <span className="post-date">{date}</span>
        </div>
        <div className="post-stars">
          {[1,2,3,4,5].map((s) => (
            <span key={s} className={s <= post.rating ? "star on" : "star"}>★</span>
          ))}
        </div>
        <p className="post-body">{post.body}</p>
      </div>
    </div>
  );
}