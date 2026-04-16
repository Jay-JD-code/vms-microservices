import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetToken } = location.state || {};

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState("");
  const [isLoading, setIsLoading]             = useState(false);

  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;

  const handleReset = async () => {
    setError("");
    if (!password)           { setError("Please enter a new password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!passwordsMatch)     { setError("Passwords do not match."); return; }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword: password, confirmNewPassword: confirmPassword }),
      });
      const body = await res.text();
      if (!res.ok) {
        let message = "Reset failed. Please try again.";
        try {
          const parsed = JSON.parse(body);
          message = parsed.message ?? parsed.error ?? message;
        } catch {
          if (body && body.length < 200) message = body;
        }
        setError(message);
        return;
      }
      navigate("/login", { state: { message: "Password reset successful. Please log in." } });
    } catch {
      setError("Unable to reach server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .auth-root {
          --cream: #faf8f4;
          --ink: #1a1510;
          --ink-2: #2d2820;
          --muted: #7a7268;
          --muted-2: #b5afa6;
          --accent: #c8a96e;
          --accent-dim: rgba(200,169,110,0.15);
          --accent-border: rgba(200,169,110,0.3);
          --border: rgba(26,21,16,0.1);
          --border-2: rgba(26,21,16,0.06);
          --green: #059669;
          --red: #dc2626;
          min-height: 100vh;
          background: var(--cream);
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 36px 32px;
          width: 360px;
          box-shadow: 0 4px 40px rgba(26,21,16,0.06);
          animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .auth-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: var(--cream);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          margin-bottom: 20px;
        }

        .auth-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 6px;
          line-height: 1.2;
        }

        .auth-subtitle {
          font-size: 13px;
          color: var(--muted);
          margin: 0 0 28px;
          line-height: 1.5;
        }

        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 6px;
        }

        .form-input-wrap {
          position: relative;
          margin-bottom: 4px;
        }

        .form-input {
          width: 100%;
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 40px 10px 13px;
          font-size: 13px;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .form-input::placeholder { color: var(--muted-2); }
        .form-input.match   { border-color: rgba(5,150,105,0.5); }
        .form-input.mismatch { border-color: rgba(220,38,38,0.5); }
        .form-input.match:focus   { box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
        .form-input.mismatch:focus { box-shadow: 0 0 0 3px rgba(220,38,38,0.08); }

        .toggle-btn {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          color: var(--muted-2);
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .toggle-btn:hover { color: var(--muted); }

        .field-gap { margin-bottom: 18px; }

        .match-hint {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          margin: 5px 0 18px;
        }

        .auth-error {
          font-size: 12px;
          color: #dc2626;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.2);
          border-radius: 8px;
          padding: 9px 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .strength-row {
          display: flex;
          gap: 4px;
          margin: 6px 0 18px;
        }
        .strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 4px;
          background: var(--border);
          transition: background 0.3s;
        }

        .auth-btn {
          width: 100%;
          background: var(--ink);
          color: var(--cream);
          border: none;
          border-radius: 10px;
          padding: 11px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Mulish', sans-serif;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-btn:hover:not(:disabled) {
          background: var(--ink-2);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(26,21,16,0.2);
        }
        .auth-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>

      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-icon-wrap">🔒</div>

          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Choose a strong new password for your account.</p>

          {/* New password */}
          <label className="form-label">New Password</label>
          <div className="form-input-wrap">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Strength bars */}
          <div className="strength-row">
            {[1, 2, 3, 4].map(level => {
              const strength = password.length === 0 ? 0
                : password.length < 6 ? 1
                : password.length < 10 ? 2
                : /[^a-zA-Z0-9]/.test(password) ? 4
                : 3;
              const colors = ["var(--border)", "#dc2626", "#d97706", "#059669", "#059669"];
              return (
                <div
                  key={level}
                  className="strength-bar"
                  style={{ background: level <= strength ? colors[strength] : "var(--border)" }}
                />
              );
            })}
          </div>

          {/* Confirm password */}
          <label className="form-label">Confirm Password</label>
          <div className="form-input-wrap field-gap">
            <input
              type={showConfirm ? "text" : "password"}
              className={`form-input ${confirmTouched ? (passwordsMatch ? "match" : "mismatch") : ""}`}
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowConfirm(v => !v)}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Live match feedback */}
          {confirmTouched && (
            <div
              className="match-hint"
              style={{ color: passwordsMatch ? "var(--green)" : "var(--red)", marginTop: "-14px" }}
            >
              {passwordsMatch
                ? <><CheckCircle2 size={12} /> Passwords match</>
                : <><XCircle size={12} /> Passwords do not match</>}
            </div>
          )}

          {error && (
            <div className="auth-error">
              <span style={{ fontSize: "14px" }}>✕</span>
              {error}
            </div>
          )}

          <button
            className="auth-btn"
            onClick={handleReset}
            disabled={isLoading || !password || !confirmPassword}
          >
            {isLoading ? "Resetting…" : "Reset Password"}
          </button>
        </div>
      </div>
    </>
  );
}