import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, getDefaultRoute } = useAuth();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--cream, #faf8f4)", fontFamily: "'Mulish', sans-serif",
      padding: "40px 20px", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes drift { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-8px) rotate(1deg)} 66%{transform:translateY(4px) rotate(-0.5deg)} }
        @keyframes spin-slow { to{transform:rotate(360deg)} }
        .nf-card { animation: fade-up 0.5s 0.1s both; }
        .nf-num  { animation: fade-up 0.6s 0s both; }
        .nf-orb  { animation: drift 6s ease-in-out infinite; }
        .nf-ring { animation: spin-slow 20s linear infinite; }
        .nf-btn {
          padding: 11px 28px; border-radius: 7px; font-size: 13px; font-weight: 600;
          font-family: inherit; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
        }
        .nf-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(26,21,16,0.14); }
        .nf-btn-p { background: var(--ink,#1a1510); color: #fff; border: none; }
        .nf-btn-s { background: transparent; border: 1px solid rgba(26,21,16,0.12); color: var(--ink,#1a1510); }
        .nf-btn-s:hover { border-color: var(--accent,#c8a96e); background: rgba(200,169,110,0.06); }
      `}</style>

      {/* Decorative background rings */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
        <div className="nf-ring" style={{ width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(200,169,110,0.08)", position: "absolute", top: -300, left: -300 }} />
        <div className="nf-ring" style={{ width: 800, height: 800, borderRadius: "50%", border: "1px solid rgba(200,169,110,0.05)", position: "absolute", top: -400, left: -400, animationDirection: "reverse" }} />
      </div>

      {/* Floating orb */}
      <div className="nf-orb" style={{
        position: "absolute", top: "15%", right: "12%",
        width: 120, height: 120, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,169,110,0.12) 0%, transparent 70%)",
        border: "1px solid rgba(200,169,110,0.15)",
      }} />
      <div className="nf-orb" style={{
        position: "absolute", bottom: "20%", left: "8%",
        width: 80, height: 80, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)",
        border: "1px solid rgba(200,169,110,0.1)",
        animationDelay: "-2s",
      }} />

      <div style={{ textAlign: "center", maxWidth: 520, position: "relative" }}>
        {/* Big 404 */}
        <div className="nf-num" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(100px, 18vw, 160px)",
          fontWeight: 800, lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: "2px rgba(200,169,110,0.25)",
          marginBottom: -24,
          userSelect: "none",
        }}>404</div>

        <div className="nf-card" style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid rgba(26,21,16,0.09)",
          padding: "48px 48px 40px",
          boxShadow: "0 8px 40px rgba(26,21,16,0.07)",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-block", marginBottom: 16,
            padding: "3px 12px", borderRadius: 50,
            background: "rgba(200,169,110,0.10)", border: "1px solid rgba(200,169,110,0.25)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: "var(--accent,#c8a96e)", textTransform: "uppercase",
          }}>Page not found</div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
            color: "var(--ink,#1a1510)", margin: "0 0 12px", letterSpacing: "-0.01em",
          }}>Lost in the portal?</h1>

          <p style={{ fontSize: 14, color: "var(--muted,#7a7268)", lineHeight: 1.7, margin: "0 0 32px" }}>
            The page you're looking for doesn't exist or may have been moved.
            Let's get you back on track.
          </p>

          {/* Quick links */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center",
            marginBottom: 28, padding: "16px 0", borderTop: "1px solid rgba(26,21,16,0.07)", borderBottom: "1px solid rgba(26,21,16,0.07)",
          }}>
            {[
              { label: "Dashboard", path: "/dashboard" },
              { label: "Vendors", path: "/vendors" },
              { label: "Orders", path: "/orders" },
              { label: "Payments", path: "/payments" },
            ].map((l) => (
              <button key={l.label} onClick={() => navigate(l.path)} style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: "var(--cream,#faf8f4)", border: "1px solid rgba(26,21,16,0.09)",
                color: "var(--muted,#7a7268)", cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent,#c8a96e)"; e.currentTarget.style.color = "var(--ink,#1a1510)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(26,21,16,0.09)"; e.currentTarget.style.color = "var(--muted,#7a7268)"; }}
              >{l.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {isAuthenticated ? (
              <button className="nf-btn nf-btn-p" onClick={() => navigate(getDefaultRoute())}>
                Go to Dashboard →
              </button>
            ) : (
              <button className="nf-btn nf-btn-p" onClick={() => navigate("/login")}>
                Sign In →
              </button>
            )}
            <button className="nf-btn nf-btn-s" onClick={() => navigate(-1)}>← Go Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}