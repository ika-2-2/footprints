import { useState } from "react";
import "./css/App.css";
import LoginPage from "./LoginPage.tsx";
import TimelinePage from "./TimelinePage.tsx";
import PostPage from "./PostPage.tsx";

export type LoginInfo = {
  user_id: number;
  username: string;
};

type Screen = "timeline" | "post";

function App() {
  const [login, setLogin] = useState<LoginInfo | null>(null);
  const [screen, setScreen] = useState<Screen>("timeline");

  if (!login) {
    return <LoginPage onLogin={setLogin} />;
  }
  if (screen === "post") {
    return <PostPage login={login} onBack={() => setScreen("timeline")} />;
  }
  return <TimelinePage login={login} onGoPost={() => setScreen("post")} />;
}

export default App;