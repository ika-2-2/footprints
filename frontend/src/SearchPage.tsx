import BottomNav from "./BottomNav";
import type { LoginInfo } from "./App";
import "./css/common.css";

export default function SearchPage({onGoTimeline, onGoPost, onGoProfile, onGoNotify }: {
  login: LoginInfo;
  onGoTimeline: () => void;
  onGoPost: () => void;
  onGoProfile?: () => void;
  onGoNotify?: () => void;
}) {
  return (
    <div className="container">
      <header>
        <span className="header-logo">footprints</span>
      </header>
      <div className="junbi-tyu">
        <p>準備中です...</p>
      </div>
      <BottomNav active="search" onGoTimeline={onGoTimeline} onGoPost={onGoPost} onGoProfile={onGoProfile} onGoNotify={onGoNotify} />
    </div>
  );
}