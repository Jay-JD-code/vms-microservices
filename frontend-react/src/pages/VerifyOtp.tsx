import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const [otp, setOtp]             = useState("");
  const [error, setError]         = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const parseMessage = (body: string, fallback: string): string => {
    try {
      const parsed = JSON.parse(body);
      return parsed.message ?? parsed.error ?? fallback;
    } catch {
      return body?.trim() || fallback;
    }
  };

  const handleVerify = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const body = await res.text();
      if (!res.ok) {
        setError(parseMessage(body, "Invalid OTP. Please try again."));
        return;
      }
      let resetToken: string;
      try {
        const parsed = JSON.parse(body);
        resetToken = parsed.resetToken ?? body;
      } catch {
        resetToken = body;
      }
      navigate("/reset-password", { state: { email, resetToken } });
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

        .email-chip {
          display: inline-block;
          font-weight: 700;
          color: var(--ink);
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          border-radius: 6px;
          padding: 1px 7px;
          font-size: 12px;
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

        .otp-input {
          width: 100%;
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 13px;
          font-size: 22px;
          font-family: 'Mulish', sans-serif;
          font-weight: 700;
          color: var(--ink);
          outline: none;
          box-sizing: border-box;
          letter-spacing: 0.25em;
          text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 20px;
        }
        .otp-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .otp-input::placeholder {
          color: var(--muted-2);
          letter-spacing: 0.1em;
          font-size: 14px;
          font-weight: 400;
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

        .auth-divider {
          height: 1px;
          background: var(--border-2);
          margin: 24px 0;
        }

        .auth-back {
          text-align: center;
          font-size: 12px;
          color: var(--muted);
        }
        .auth-back a {
          color: var(--ink);
          font-weight: 700;
          text-decoration: none;
          border-bottom: 1px solid var(--accent-border);
          padding-bottom: 1px;
          transition: border-color 0.15s;
        }
        .auth-back a:hover { border-color: var(--accent); }
      `}</style>

      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-icon-wrap">🔑</div>

          <h1 className="auth-title">Verify OTP</h1>
          <p className="auth-subtitle">
            Enter the one-time password sent to{" "}
            <span className="email-chip">{email}</span>
          </p>

          <label className="form-label">One-Time Password</label>
          <input
            className="otp-input"
            placeholder="· · · · · ·"
            value={otp}
            onChange={(e) => { setOtp(e.target.value); if (error) setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            maxLength={8}
            inputMode="numeric"
          />

          {error && (
            <div className="auth-error">
              <span style={{ fontSize: "14px" }}>✕</span>
              {error}
            </div>
          )}

          <button
            className="auth-btn"
            onClick={handleVerify}
            disabled={isLoading || !otp.trim()}
          >
            {isLoading ? "Verifying…" : "Verify OTP"}
          </button>

          <div className="auth-divider" />
          <p className="auth-back">
            Wrong email? <a href="/forgot-password">Go back</a>
          </p>
        </div>
      </div>
    </>
  );
}