import { useEffect, useState, useRef } from "react";
import type { LoginInfo, Post } from "./App";
import BottomNav from "./BottomNav";
import "./css/common.css";
import "./css/ProfilePage.css";

const API = "http://localhost:8000";

type UserProfile = {
  id: number;
  username: string;
  icon_path: string | null;
  banner_path: string | null;
};

export default function ProfilePage({ login, onGoPost, onGoTimeline, onGoDetail }: {
  login: LoginInfo;
  onGoPost: () => void;
  onGoTimeline: () => void;
  onGoDetail: (post: Post) => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Post[]>([]);
  const [tab, setTab] = useState<"posts" | "likes">("posts");
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    const res = await fetch(`${API}/users/${login.user_id}`);
    setProfile(await res.json());
  };

  const fetchPosts = async () => {
    const res = await fetch(`${API}/users/${login.user_id}/posts`);
    setPosts(await res.json());
  };

  const fetchLikes = async () => {
    const res = await fetch(`${API}/users/${login.user_id}/likes`);
    setLikes(await res.json());
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchLikes();
  }, []);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    await fetch(`${API}/users/${login.user_id}/icon`, { method: "POST", body: form });
    fetchProfile();
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    await fetch(`${API}/users/${login.user_id}/banner`, { method: "POST", body: form });
    fetchProfile();
  };

  const displayPosts = tab === "posts" ? posts : likes;

  return (
    <div className="container">
      {/* バナー */}
      <div className="profile-banner" onClick={() => bannerInputRef.current?.click()}>
        {profile?.banner_path
          ? <img src={`${API}/uploads/${profile.banner_path}`} alt="banner" />
          : <div className="banner-placeholder"><i className="fa-solid fa-camera"></i></div>
        }
        <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: "none" }} />
      </div>

      {/* アイコン + ユーザー名 */}
      <div className="profile-info">
        <div className="profile-icon-wrap" onClick={() => iconInputRef.current?.click()}>
          {profile?.icon_path
            ? <img src={`${API}/uploads/${profile.icon_path}`} alt="icon" className="profile-icon" />
            : <div className="profile-icon-placeholder"><i className="fa-solid fa-user"></i></div>
          }
          <div className="icon-edit-badge"><i className="fa-solid fa-camera"></i></div>
          <input ref={iconInputRef} type="file" accept="image/*" onChange={handleIconUpload} style={{ display: "none" }} />
        </div>
        <div className="profile-meta">
          <span className="profile-username">{login.username}</span>
          <div className="profile-follow-row">
            <span className="follow-count"><b>0</b> フォロー中</span>
            <span className="follow-count"><b>0</b> フォロワー</span>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="tab-row">
        <button className={`tab-btn ${tab === "posts" ? "active" : ""}`} onClick={() => setTab("posts")}>
          投稿
        </button>
        <button className={`tab-btn ${tab === "likes" ? "active" : ""}`} onClick={() => setTab("likes")}>
          いいね
        </button>
      </div>

      {/* 投稿グリッド */}
      <div className="profile-grid">
        {displayPosts.length === 0 ? (
          <p className="empty" style={{ padding: "32px 16px" }}>
            {tab === "posts" ? "まだ投稿がありません" : "いいねした投稿がありません"}
          </p>
        ) : (
          displayPosts.map((post) => (
            <div key={post.id} className="grid-item" onClick={() => onGoDetail(post)}>
              <img src={`${API}/uploads/${post.image_path}`} alt={post.place_name} />
            </div>
          ))
        )}
      </div>

      <BottomNav active="mypage" onGoTimeline={onGoTimeline} onGoPost={onGoPost} />
    </div>
  );
}