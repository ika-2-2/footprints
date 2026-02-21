import { useState } from "react";
import "./css/App.css";
import "./css/common.css";
import LoginPage from "./LoginPage";
import TimelinePage from "./TimelinePage";
import PostPage from "./PostPage";
import PostDetailPage from "./PostDetailPage";

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

type Screen = "timeline" | "post" | "detail";

function App() {
  const [login, setLogin] = useState<LoginInfo | null>(null);
  const [screen, setScreen] = useState<Screen>("timeline");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  if (!login) return <LoginPage onLogin={setLogin} />;
  if (screen === "post") return <PostPage login={login} onBack={() => setScreen("timeline")} />;
  if (screen === "detail" && selectedPost) {
    return <PostDetailPage login={login} post={selectedPost} onBack={() => setScreen("timeline")} onGoPost={() => setScreen("post")} />;
  }
  return (
    <TimelinePage
      login={login}
      onGoPost={() => setScreen("post")}
      onGoDetail={(post) => { setSelectedPost(post); setScreen("detail"); }}
    />
  );
}

export default App;