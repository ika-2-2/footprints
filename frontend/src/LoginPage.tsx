import { useState } from "react";
import type { LoginInfo } from "./App";
import "./css/App.css"
import "./css/common.css";
import "./css/LoginPage.css";

const API = import.meta.env.VITE_API_BASE_URL;
if (!API) {
  throw new Error("VITE_API_BASE_URL is missing");
}

export default function LoginPage({ onLogin }: { onLogin: (info: LoginInfo) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regUsernameError, setRegUsernameError] = useState("");
  const [regPasswordError, setRegPasswordError] = useState("");
  const [regError, setRegError] = useState("");

  const validateUsername = (val: string) => !val ? "ユーザー名を入力してください" : "";
  const validatePassword = (val: string) => {
    if (!val) return "パスワードを入力してください";
    if (val.length < 4) return "パスワードは4文字以上で入力してください";
    return "";
  };

  // ログイン
  const handleLogin = async () => {
    const uErr = validateUsername(username);
    const pErr = validatePassword(password);
    setUsernameError(uErr);
    setPasswordError(pErr);
    if (uErr || pErr) return;

    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setLoginError("ユーザー名またはパスワードが正しくありません");
      return;
    }
    const data = await res.json();
    onLogin({ user_id: data.user_id, username: data.username });
  };

  // 新規登録
  const handleRegister = async () => {
    const uErr = validateUsername(regUsername);
    const pErr = validatePassword(regPassword);
    setRegUsernameError(uErr);
    setRegPasswordError(pErr);
    if (uErr || pErr) return;

    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: regUsername, password: regPassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      setRegError(data.detail ?? "登録に失敗しました");
      return;
    }
    const data = await res.json();
    onLogin({ user_id: data.user_id, username: data.username });
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1>footprints</h1>
        <h3 className="poem">あなたの足跡が、誰かの明日となる。</h3>
        <p className="login-sub">その場所に行くと見える、新しいSNS。</p>

        <div className="tab-row">
          <button className={`tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>ログイン</button>
          <button className={`tab-btn ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>新規登録</button>
        </div>

        {tab === "register" ? (
          <>
            <div className="field-group">
              <label>👤 ユーザー名</label>
              <input
                type="text"
                placeholder="username"
                value={regUsername}
                onChange={(e) => { setRegUsername(e.target.value); setRegError(""); }}
                onBlur={() => setRegUsernameError(validateUsername(regUsername))}
              />
              {regUsernameError && <p className="field-error">⚠ {regUsernameError}</p>}
            </div>

            <div className="field-group">
              <label>🔒 パスワード</label>
              <div className="password-row">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワードを入力"
                  value={regPassword}
                  onChange={(e) => { setRegPassword(e.target.value); setRegError(""); }}
                  onBlur={() => setRegPasswordError(validatePassword(regPassword))}
                />
                <button type="button" className="toggle-pw" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                </button>
              </div>
              <p className="field-hint">半角英数字・4文字以上</p>
              {regPasswordError && <p className="field-error">⚠ {regPasswordError}</p>}
            </div>

            {regError && <p className="login-error">⚠ {regError}</p>}
            <button className="login-btn" onClick={handleRegister}>新規登録</button>
          </>
        ) : (
          // 既存のログインフォーム
          <>
            <div className="field-group">
              <label>👤 ユーザー名</label>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                onBlur={() => setUsernameError(validateUsername(username))}
              />
              {usernameError && <p className="field-error">⚠ {usernameError}</p>}
            </div>

            <div className="field-group">
              <label>🔒 パスワード</label>
              <div className="password-row">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button type="button" className="toggle-pw" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                </button>
              </div>
              <p className="field-hint">半角英数字・4文字以上</p>
              {passwordError && <p className="field-error">⚠ {passwordError}</p>}
            </div>

            {loginError && <p className="login-error">⚠ {loginError}</p>}
            <button className="login-btn" onClick={handleLogin}>ログイン</button>
          </>
        )}
      </div>
    </div>
  );
}