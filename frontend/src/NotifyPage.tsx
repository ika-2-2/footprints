import BottomNav from "./BottomNav";
import type { LoginInfo } from "./App";
import "./css/common.css";

export default function NotifyPage({ login, onGoTimeline, onGoPost, onGoProfile }: {
  login: LoginInfo;
  onGoTimeline: () => void;
  onGoPost: () => void;
  onGoProfile?: () => void;
}) {
  return (
    <div className="container">
      <header>
        <span className="header-logo">通知</span>
      </header>
      <div className="coming-soon">
        <p>準備中です...</p>
      </div>
      <BottomNav active="notify" onGoTimeline={onGoTimeline} onGoPost={onGoPost} onGoProfile={onGoProfile} />
    </div>
  );
}