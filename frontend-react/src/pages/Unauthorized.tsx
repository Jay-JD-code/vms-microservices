import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { getDefaultRoute, isAuthenticated } = useAuth();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--cream, #faf8f4)", fontFamily: "'Mulish', sans-serif",
      padding: "40px 20px",
    }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .unauth-lock { animation: float 3s ease-in-out infinite; }
        .unauth-card { animation: fade-up 0.5s both; }
        .unauth-btn {
          padding: 11px 28px; border-radius: 7px; font-size: 13px; font-weight: 600;
          font-family: inherit; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
          border: none;
        }
        .unauth-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(26,21,16,0.15); }
        .unauth-btn-primary { background: var(--ink, #1a1510); color: #fff; }
        .unauth-btn-secondary { background: transparent; color: var(--ink, #1a1510); border: 1px solid rgba(26,21,16,0.12) !important; }
        .unauth-btn-secondary:hover { background: rgba(200,169,110,0.08); border-color: var(--accent, #c8a96e) !important; }
      `}</style>

      <div className="unauth-card" style={{
        textAlign: "center", maxWidth: 480,
        background: "#fff", borderRadius: 16,
        border: "1px solid rgba(26,21,16,0.09)",
        padding: "60px 48px",
        boxShadow: "0 8px 40px rgba(26,21,16,0.07)",
      }}>
        {/* Lock icon */}
        <div className="unauth-lock" style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(200,169,110,0.10)", border: "1px solid rgba(200,169,110,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px", fontSize: 36,
        }}>🔒</div>

        {/* Code badge */}
        <div style={{
          display: "inline-block", marginBottom: 16,
          padding: "3px 12px", borderRadius: 50,
          background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          color: "#dc2626", textTransform: "uppercase",
        }}>403 Unauthorized</div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
          color: "var(--ink, #1a1510)", margin: "0 0 12px", letterSpacing: "-0.01em",
        }}>Access Denied</h1>

        <p style={{ fontSize: 14, color: "var(--muted, #7a7268)", lineHeight: 1.7, margin: "0 0 36px" }}>
          You don't have permission to view this page. This area is restricted to specific roles.
          If you believe this is a mistake, contact your administrator.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(26,21,16,0.07)", margin: "0 0 28px" }} />

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {isAuthenticated ? (
            <button className="unauth-btn unauth-btn-primary" onClick={() => navigate(getDefaultRoute())}>
              Go to Dashboard →
            </button>
          ) : (
            <button className="unauth-btn unauth-btn-primary" onClick={() => navigate("/login")}>
              Sign In →
            </button>
          )}
          <button className="unauth-btn unauth-btn-secondary" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}