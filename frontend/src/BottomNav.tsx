import "./css/common.css";
 
type Props = {
  active: "timeline" | "post" | "detail" | "search" | "notify" | "mypage";
  onGoTimeline: () => void;
  onGoPost: () => void;
  onGoSearch?: () => void;
  onGoNotify?: () => void;
  onGoProfile?: () => void;
};

export default function BottomNav({ active, onGoTimeline, onGoPost, onGoSearch, onGoNotify, onGoProfile}: Props) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${active === "timeline" ? "active" : ""}`} onClick={onGoTimeline}>
        <i className="fa-solid fa-house"></i><span>TL</span>
      </button>
      <button className={`nav-item ${active === "search" ? "active" : ""}`} onClick={onGoSearch}>
        <i className="fa-solid fa-magnifying-glass"></i><span>検索</span>
      </button>
      <button className="nav-item post-btn" onClick={onGoPost}>
        <i className="fa-solid fa-plus"></i>
      </button>
      <button className={`nav-item ${active === "notify" ? "active" : ""}`} onClick={onGoNotify}>
        <i className="fa-solid fa-bell"></i><span>通知</span>
      </button>
      <button className={`nav-item ${active === "mypage" ? "active" : ""}`} onClick={onGoProfile}>
        <i className="fa-solid fa-user"></i><span>マイページ</span>
      </button>
    </nav>
  );
}