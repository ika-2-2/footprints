import "./css/common.css";

type Props = {
  active: "timeline" | "post" | "detail" | "search" | "notify" | "mypage";
  onGoTimeline: () => void;
  onGoPost: () => void;
};

export default function BottomNav({ active, onGoTimeline, onGoPost }: Props) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${active === "timeline" ? "active" : ""}`} onClick={onGoTimeline}>
        <i className="fa-solid fa-house"></i><span>TL</span>
      </button>
      <button className="nav-item">
        <i className="fa-solid fa-magnifying-glass"></i><span>検索</span>
      </button>
      <button className="nav-item post-btn" onClick={onGoPost}>
        <i className="fa-solid fa-plus"></i>
      </button>
      <button className="nav-item">
        <i className="fa-solid fa-bell"></i><span>通知</span>
      </button>
      <button className="nav-item">
        <i className="fa-solid fa-user"></i><span>マイページ</span>
      </button>
    </nav>
  );
}