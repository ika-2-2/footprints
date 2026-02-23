import { useEffect, useState } from "react";
import type { LoginInfo, Post } from "./App";
import  BottomNav  from "./BottomNav"
import "./css/common.css";
import "./css/PostDetailPage.css";

const API = import.meta.env.VITE_API_BASE_URL;

type Comment = {
  id: number;
  user_id: number;
  username: string;
  body: string;
  created_at: string;
};

export default function PostDetailPage({ login, post, onBack, onGoPost, onGoProfile }: {
  login: LoginInfo;
  post: Post;
  onBack: () => void;
  onGoPost: () => void;
  onGoProfile?: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchComments = async () => {
    const res = await fetch(`${API}/posts/${post.id}/comments`);
    const data = await res.json();
    setComments(data);
  };

  const fetchLike = async () => {
    const res = await fetch(`${API}/posts/${post.id}/like?user_id=${login.user_id}`);
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.count);
    };

  const handleLike = async () => {
    const res = await fetch(`${API}/posts/${post.id}/like?user_id=${login.user_id}`, {
        method: "POST",
    });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.count);
  };

  useEffect(() => { 
    fetchComments(); 
    fetchLike();
  }, []);

  const handleComment = async () => {
    if (!body.trim()) { setError("コメントを入力してください"); return; }
    setError("");
    await fetch(`${API}/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: login.user_id, body }),
    });
    setBody("");
    fetchComments();
  };

  const date = new Date(post.created_at).toLocaleDateString("ja-JP", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="container">
      <header>
        <button className="back-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <span style={{ fontWeight: 700 }}>投稿詳細</span>
        <div style={{ width: 40 }} />
      </header>

      <div className="detail-post">
        {/* アバター + ユーザー名 */}
        <div className="post-card-header">
          <div className="avatar" />
          <span className="post-username">{post.user_id}</span>
        </div>

        {/* 画像 */}
        <img src={`${API}/uploads/${post.image_path}`} alt={post.place_name} className="post-image" />

        {/* メタ情報 */}
        <div className="post-card-body">
          <div className="post-meta">
            <span className="post-place">📍 {post.place_name}</span>
            <span className="post-date">{date}</span>
          </div>
          <div className="detail-meta-row">
            <div className="post-stars">
              {[1,2,3,4,5].map((s) => (
                <span key={s} className={s <= post.rating ? "star on" : "star"}>★</span>
              ))}
            </div>
            <div className="detail-actions">
              <button className="action-btn">
                <i className="fa-regular fa-comment"></i>
                <span>{comments.length}</span>
              </button>
              <button className={`action-btn ${liked ? "liked" : ""}`} onClick={handleLike}>
                <i className={liked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
            </div>
          </div>
          <p className="post-body">{post.body}</p>
        </div>
      </div>

      {/* コメント一覧 */}
      <div className="comments-section">
        {comments.length === 0 ? (
          <p className="empty">まだコメントがありません</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="avatar small" />
              <div className="comment-body">
                <span className="comment-username">{c.username}</span>
                <p className="comment-text">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* コメント入力 */}
      <div className="comment-input-area">
        <div className="avatar small" />
        <input
          type="text"
          placeholder="コメントを追加..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleComment()}
        />
        <button className="send-btn" onClick={handleComment}>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>

      {error && <p className="field-error" style={{ padding: "0 16px" }}>⚠ {error}</p>}

      <BottomNav active="detail" onGoTimeline={onBack} onGoPost={onGoPost} onGoProfile={onGoProfile} />
    </div>
  );
}