import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import type { UserRole } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import { Eye, EyeOff, Loader2, ShieldCheck, BarChart3, Users, ShoppingCart, ArrowLeft } from "lucide-react";

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [selectedRole]              = useState<UserRole>("ADMIN");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [successMsg, setSuccessMsg] = useState(location.state?.message ?? "");

  useEffect(() => {
    if (location.state?.message) window.history.replaceState({}, "", "/login");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await login(email, password, selectedRole);
      if (res.firstLogin) { window.location.href = "/change-password"; return; }
      const role = res.role as UserRole;
      window.location.href = ROLE_PERMISSIONS[role].defaultRoute;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : "Incorrect email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .login-root {
          --cream: #faf8f4;
          --ink: #1a1510;
          --ink-2: #2d2820;
          --ink-3: #3d3830;
          --muted: #7a7268;
          --muted-2: #b5afa6;
          --accent: #c8a96e;
          --accent-dim: rgba(200,169,110,0.15);
          --accent-border: rgba(200,169,110,0.3);
          --border: rgba(26,21,16,0.1);
          --border-2: rgba(26,21,16,0.06);
          --green: #059669;
          --amber: #d97706;
          --red: #dc2626;
          min-height: 100vh;
          display: flex;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          background: var(--cream);
        }

        .login-root .serif { font-family: 'Playfair Display', serif; }

        /* ── Brand panel ── */
        .login-brand {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: var(--ink);
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 1024px) { .login-brand { display: flex; width: 52%; } }

        .login-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(200,169,110,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 20%, rgba(200,169,110,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand-logo-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }
        .brand-logo-box {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: rgba(200,169,110,0.15);
          border: 1px solid rgba(200,169,110,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .brand-logo-box span {
          color: var(--accent);
          font-size: 18px;
          font-weight: 900;
          font-family: 'Playfair Display', serif;
        }
        .brand-name {
          color: #faf8f4;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.01em;
        }
        .brand-sub {
          color: rgba(250,248,244,0.4);
          font-size: 12px;
          margin-top: -2px;
        }

        .brand-hero {
          position: relative;
          z-index: 1;
        }
        .brand-tagline {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          font-weight: 700;
          line-height: 1.2;
          color: #faf8f4;
          margin-bottom: 16px;
        }
        .brand-tagline span {
          color: var(--accent);
        }
        .brand-desc {
          color: rgba(250,248,244,0.5);
          font-size: 14px;
          line-height: 1.7;
          max-width: 320px;
          margin-bottom: 32px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .feature-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          background: rgba(200,169,110,0.1);
          border: 1px solid rgba(200,169,110,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .feature-text {
          color: rgba(250,248,244,0.6);
          font-size: 13px;
          font-weight: 500;
        }

        /* Decorative accent line */
        .brand-accent-line {
          width: 40px;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
          margin-bottom: 24px;
          opacity: 0.6;
        }

        .brand-footer {
          color: rgba(250,248,244,0.2);
          font-size: 12px;
          position: relative;
          z-index: 1;
        }

        /* ── Auth panel ── */
        .login-auth {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: var(--cream);
        }
        .login-box {
          width: 100%;
          max-width: 400px;
        }

        /* Mobile logo */
        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .mobile-logo-box {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--ink);
          display: flex; align-items: center; justify-content: center;
        }
        .mobile-logo-box span {
          color: var(--accent);
          font-size: 15px;
          font-weight: 900;
          font-family: 'Playfair Display', serif;
        }
        .mobile-logo-name {
          font-weight: 700;
          font-size: 16px;
          color: var(--ink);
        }

        /* Heading */
        .login-heading {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }
        .login-subheading {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 32px;
          font-weight: 400;
        }

        /* Divider accent */
        .login-divider {
          width: 32px;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
          margin-bottom: 28px;
          opacity: 0.7;
        }

        /* Alerts */
        .alert-success {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(5,150,105,0.07);
          border: 1px solid rgba(5,150,105,0.2);
          border-radius: 12px;
          font-size: 13px;
          color: #059669;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .alert-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.2);
          border-radius: 12px;
          font-size: 13px;
          color: #dc2626;
          margin-bottom: 20px;
          font-weight: 500;
        }

        /* Form */
        .login-form { display: flex; flex-direction: column; gap: 20px; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }

        .login-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .login-input {
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .login-input::placeholder { color: var(--muted-2); }
        .login-input.error {
          border-color: rgba(220,38,38,0.5);
        }
        .login-input.error:focus {
          box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
        }

        .pass-wrap { position: relative; }
        .pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted-2);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .pass-toggle:hover { color: var(--ink); }

        .forgot-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: var(--accent);
          font-family: 'Mulish', sans-serif;
          padding: 0;
          align-self: flex-end;
          transition: opacity 0.15s;
          letter-spacing: 0.02em;
        }
        .forgot-btn:hover { opacity: 0.7; }

        .login-submit {
          background: var(--ink);
          color: var(--cream);
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Mulish', sans-serif;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          letter-spacing: 0.02em;
          margin-top: 4px;
        }
        .login-submit:hover:not(:disabled) {
          background: var(--ink-2);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(26,21,16,0.2);
        }
        .login-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .back-btn {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 6px;
          font-family: 'Mulish', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          z-index: 10;
        }
        .back-btn:hover {
          color: var(--ink);
          border-color: var(--accent);
        }
      `}</style>

      {/* ── Brand panel ── */}
      <div className="login-brand">
        <div className="brand-logo-wrap">
          <div className="brand-logo-box">
            <span>V</span>
          </div>
          <div>
            <div className="brand-name">VMS</div>
            <div className="brand-sub">Vendor Management System</div>
          </div>
        </div>

        <div className="brand-hero">
          <div className="brand-accent-line" />
          <h2 className="brand-tagline">
            Streamline your<br />
            <span>vendor relationships</span>
          </h2>
          <p className="brand-desc">
            One platform for procurement, payments, compliance documents, and real-time performance insights.
          </p>
          <div>
            {[
              { icon: Users,        text: "Centralised vendor registry & onboarding" },
              { icon: ShoppingCart, text: "Purchase order lifecycle management"       },
              { icon: BarChart3,    text: "Live performance analytics & scoring"      },
              { icon: ShieldCheck,  text: "Document compliance & payment tracking"    },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="feature-item">
                <div className="feature-icon">
                  <Icon size={15} color="var(--accent)" />
                </div>
                <span className="feature-text">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="brand-footer">© {new Date().getFullYear()} VMS. All rights reserved.</p>
      </div>

      {/* ── Auth panel ── */}
      <div className="login-auth" style={{ position: "relative" }}>
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={14} />
        </button>

        <div className="login-box">
          {/* Mobile logo */}
          <div className="mobile-logo">
            <div className="mobile-logo-box"><span>V</span></div>
            <span className="mobile-logo-name">VMS</span>
          </div>

          <h1 className="login-heading">Welcome back</h1>
          <p className="login-subheading">Sign in to your account to continue</p>
          <div className="login-divider" />

          {successMsg && (
            <div className="alert-success">
              <svg style={{ width: 16, height: 16, marginTop: 1, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMsg}
            </div>
          )}

          {error && (
            <div className="alert-error">
              <svg style={{ width: 16, height: 16, marginTop: 1, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="login-label">Email address</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) setError(""); if (successMsg) setSuccessMsg(""); }}
                placeholder="you@company.com"
                className={`login-input ${error ? "error" : ""}`}
                required
              />
            </div>

            <div className="form-group">
              <label className="login-label">Password</label>
              <div className="pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (error) setError(""); if (successMsg) setSuccessMsg(""); }}
                  placeholder="••••••••"
                  className={`login-input ${error ? "error" : ""}`}
                  style={{ paddingRight: 40 }}
                  required
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="button" className="forgot-btn" onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </button>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : "Sign in"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}