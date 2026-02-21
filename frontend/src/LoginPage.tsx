import { useState } from "react";
import type { LoginInfo } from "./App";
import "./css/App.css"
import "./css/common.css";
import "./css/LoginPage.css";

const API = import.meta.env.VITE_API_BASE_URL;

export default function LoginPage({ onLogin }: { onLogin: (info: LoginInfo) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const validateUsername = (val: string) => !val ? "ユーザー名を入力してください" : "";
  const validatePassword = (val: string) => {
    if (!val) return "パスワードを入力してください";
    if (val.length < 8) return "パスワードは8文字以上で入力してください";
    return "";
  };

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

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1>footprints</h1>
        <p className="login-sub">おかえりなさい</p>

        <div className="tab-row">
          <button className={`tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>ログイン</button>
          <button className={`tab-btn ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>新規登録</button>
        </div>

        {tab === "register" ? (
          <p className="register-placeholder">新規登録は現在準備中です。</p>
        ) : (
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
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              <p className="field-hint">半角英数字・8文字以上</p>
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