import BottomNav from "./BottomNav";
import type { LoginInfo } from "./App";
import "./css/common.css";

export default function NotifyPage({onGoTimeline, onGoPost, onGoProfile, onGoSearch }: {
  login: LoginInfo;
  onGoTimeline: () => void;
  onGoPost: () => void;
  onGoProfile?: () => void;
  onGoSearch?: () => void;
}) {
  return (
    <div className="container">
      <header>
        <span className="header-logo">footprints</span>
      </header>
      <div className="coming-soon">
        <p>準備中です...</p>
      </div>
      <BottomNav active="notify" onGoTimeline={onGoTimeline} onGoPost={onGoPost} onGoProfile={onGoProfile} onGoSearch={onGoSearch} />
    </div>
  );
}