import { useEffect, useState } from "react";
import type { LoginInfo, Post } from "./App";
import BottomNav from "./BottomNav";
import "./css/common.css";
import "./css/TimelinePage.css";

const API = import.meta.env.VITE_API_BASE_URL;

export default function TimelinePage({ login, onGoPost, onGoDetail, onGoProfile}: { 
  login: LoginInfo; 
  onGoPost: () => void;
  onGoDetail: (post: Post) => void;
  onGoProfile?: () => void;
}) {
  const [timeline, setTimeline] = useState<Post[]>([]);

  const fetchTimeline = async () => {
    const res = await fetch(`${API}/timeline?user_id=${login.user_id}`);
    const data = await res.json();
    setTimeline(data);
  };
  

  const unlockNearby = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      // 近くの未解放投稿を取得
      const res = await fetch(
        `${API}/posts/nearby?lat=${latitude}&lng=${longitude}&user_id=${login.user_id}`
      );
      const nearby: Post[] = await res.json();

      // 全部unlock
      await Promise.all(
        nearby.map((post) =>
          fetch(`${API}/posts/${post.id}/unlock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: login.user_id, lat: latitude, lng: longitude }),
          })
        )
      );

      // TL更新
      fetchTimeline();
    });
  };

  useEffect(() => {
    unlockNearby(); // 近くの投稿を解放してからTL取得
  }, []);

  return (
    <div className="container">
      <header>
        <span className="header-logo">footprints</span>
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
            <PostCard key={post.id} post={post} onClick={() => onGoDetail(post)} userId={login.user_id} />
          ))
        )}
      </div>

      {/* 下メニューバー */}
      <BottomNav active="timeline" onGoTimeline={unlockNearby} onGoPost={onGoPost} onGoProfile={onGoProfile} />
    </div>
  );
}

function PostCard({ post, onClick, userId }: { post: Post; onClick: () => void; userId: number }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/posts/${post.id}/like?user_id=${userId}`)
      .then(r => r.json())
      .then(data => { setLiked(data.liked); setLikeCount(data.count); });
  }, []);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのonClickが発火しないように
    const res = await fetch(`${API}/posts/${post.id}/like?user_id=${userId}`, { method: "POST" });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.count);
  };

  const date = new Date(post.created_at).toLocaleDateString("ja-JP", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="post-card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="post-card-header">
        <div className="avatar" />
        <span className="post-username">user:{post.user_id}</span>
      </div>
      <img src={`${API}/uploads/${post.image_path}`} alt={post.place_name} className="post-image" />
      <div className="post-card-body">
        <div className="post-meta">
          <span className="post-place">
            {post.place_name.includes("\n") ? (
              <>
                <span className="post-place-main">{post.place_name.split("\n")[0]}</span>
                <span className="post-place-area">{post.place_name.split("\n")[1]}</span>
              </>
            ) : (
              <span className="post-place-main">{post.place_name}</span>
            )}
          </span>
          <span className="post-date">{date}</span>
        </div>
        <div className="tl-card-bottom">
          <div className="post-stars">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={s <= post.rating ? "star on" : "star"}>★</span>
            ))}
          </div>
          <button className={`action-btn ${liked ? "liked" : ""}`} onClick={handleLike}>
            <i className={liked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
        </div>
        <p className="post-body">{post.body}</p>
      </div>
    </div>
  );
}