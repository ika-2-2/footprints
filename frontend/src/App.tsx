import { useState } from "react";
import "./css/App.css";
import "./css/common.css";
import LoginPage from "./LoginPage";
import TimelinePage from "./TimelinePage";
import PostPage from "./PostPage";
import PostDetailPage from "./PostDetailPage";
import ProfilePage from "./ProfilePage";

export type LoginInfo = {
  user_id: number;
  username: string;
};

export type Post = {
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

type Screen = "timeline" | "post" | "detail" | "profile";

function App() {
  const [login, setLogin] = useState<LoginInfo | null>(null);
  const [screen, setScreen] = useState<Screen>("timeline");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  if (!login) return <LoginPage onLogin={setLogin} />;
  if (screen === "post") return <PostPage login={login} onBack={() => setScreen("timeline")} />;
  if (screen === "detail" && selectedPost) {
    return <PostDetailPage 
      login={login} 
      post={selectedPost} 
      onBack={() => setScreen("timeline")} 
      onGoPost={() => setScreen("post")}
      onGoProfile={() => setScreen("profile")} 
    />;
  }
  if (screen === "profile") {
    return <ProfilePage
      login={login}
      onGoPost={() => setScreen("post")}
      onGoTimeline={() => setScreen("timeline")}
      onGoDetail={(post) => { setSelectedPost(post); setScreen("detail"); }}
      onLogout={() => { setLogin(null); setScreen("timeline"); }}
    />
  }
  return (
    <TimelinePage
      login={login}
      onGoPost={() => setScreen("post")}
      onGoDetail={(post) => { setSelectedPost(post); setScreen("detail"); }}
      onGoProfile={() => setScreen("profile")}
    />
  );
}

export default App;