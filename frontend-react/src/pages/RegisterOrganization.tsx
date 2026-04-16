import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ROLE_PERMISSIONS } from "@/types";
import type { UserRole } from "@/types";

export default function RegisterOrganization() {
  const { registerOrganization } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName]   = useState("");
  const [slug, setSlug]         = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Auto-generate slug from org name
  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await registerOrganization(orgName, slug, adminEmail);
      const route = ROLE_PERMISSIONS[res.role as UserRole]?.defaultRoute ?? "/dashboard";
      window.location.href = route;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .reg-root {
          --cream: #faf8f4; --ink: #1a1510; --ink-2: #2d2820;
          --muted: #7a7268; --muted-2: #b5afa6;
          --accent: #c8a96e; --accent-dim: rgba(200,169,110,0.15);
          --accent-border: rgba(200,169,110,0.3);
          --border: rgba(26,21,16,0.1);
          --green: #059669; --red: #dc2626;
          min-height: 100vh; display: flex;
          font-family: 'Mulish', sans-serif;
          color: var(--ink); background: var(--cream);
        }

        .reg-brand {
          display: none; flex-direction: column;
          justify-content: space-between; padding: 48px;
          background: var(--ink); position: relative; overflow: hidden;
        }
        .reg-brand::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(200,169,110,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 20%, rgba(200,169,110,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        @media (min-width: 1024px) { .reg-brand { display: flex; width: 52%; } }

        .reg-auth {
          flex: 1; display: flex; align-items: center;
          justify-content: center; padding: 40px 24px;
          background: var(--cream);
        }
        .reg-box { width: 100%; max-width: 440px; }

        .reg-heading {
          font-family: 'Playfair Display', serif;
          font-size: 30px; font-weight: 700; color: var(--ink);
          margin-bottom: 6px; letter-spacing: -0.01em;
        }
        .reg-sub {
          font-size: 14px; color: var(--muted);
          margin-bottom: 28px; font-weight: 400;
        }
        .reg-divider {
          width: 32px; height: 2px; background: var(--accent);
          border-radius: 2px; margin-bottom: 28px; opacity: 0.7;
        }

        .reg-form { display: flex; flex-direction: column; gap: 18px; }

        .reg-label {
          display: block; font-size: 11px; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 5px;
        }
        .reg-input {
          background: white; border: 1px solid var(--border);
          border-radius: 10px; padding: 11px 14px;
          font-size: 14px; font-family: 'Mulish', sans-serif;
          color: var(--ink); outline: none; width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .reg-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .reg-input::placeholder { color: var(--muted-2); }

        .reg-slug-preview {
          font-size: 11px; color: var(--muted); margin-top: 4px;
          font-weight: 500;
        }
        .reg-slug-preview span { color: var(--accent); font-weight: 700; }

        .alert-error {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.2);
          border-radius: 12px; font-size: 13px; color: #dc2626;
          margin-bottom: 4px; font-weight: 500;
        }

        .reg-submit {
          background: var(--ink); color: var(--cream);
          border: none; border-radius: 10px;
          padding: 12px 24px; font-size: 14px; font-weight: 700;
          font-family: 'Mulish', sans-serif; cursor: pointer;
          width: 100%; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          transition: all 0.2s; letter-spacing: 0.02em; margin-top: 4px;
        }
        .reg-submit:hover:not(:disabled) {
          background: var(--ink-2); transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(26,21,16,0.2);
        }
        .reg-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .reg-login-link {
          text-align: center; margin-top: 20px;
          font-size: 13px; color: var(--muted);
        }
        .reg-login-link button {
          background: none; border: none; cursor: pointer;
          color: var(--accent); font-weight: 700;
          font-family: 'Mulish', sans-serif;
          font-size: 13px; padding: 0;
          transition: opacity 0.15s;
        }
        .reg-login-link button:hover { opacity: 0.7; }
      `}</style>

      {/* ── Brand panel ── */}
      <div className="reg-brand">
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "rgba(200,169,110,0.15)",
            border: "1px solid rgba(200,169,110,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 40 46" width="22" height="22" fill="none">
              <polygon points="20,2 38,12 38,34 20,44 2,34 2,12" fill="#1a1510" stroke="#c8a96e" strokeWidth="1.5" />
              <path d="M11 16 L20 32 L29 16" stroke="#c8a96e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div>
            <div style={{ color: "#faf8f4", fontWeight: 700, fontSize: 18, fontFamily: "'Playfair Display', serif" }}>VMS</div>
            <div style={{ color: "rgba(200,169,110,0.7)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Vendor Portal</div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: 40, height: 2, background: "var(--accent)", borderRadius: 2, marginBottom: 24, opacity: 0.6 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, lineHeight: 1.2, color: "#faf8f4", marginBottom: 16 }}>
            Start managing<br />
            <span style={{ color: "var(--accent)" }}>your vendors</span>
          </h2>
          <p style={{ color: "rgba(250,248,244,0.5)", fontSize: 14, lineHeight: 1.7, maxWidth: 320 }}>
            Create your organization account and get your entire vendor procurement workflow running in minutes.
          </p>
        </div>

        <p style={{ color: "rgba(250,248,244,0.2)", fontSize: 12, position: "relative", zIndex: 1 }}>
          © {new Date().getFullYear()} VMS. All rights reserved.
        </p>
      </div>

      {/* ── Auth panel ── */}
      <div className="reg-auth">
        <div className="reg-box">

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }} className="lg-hidden">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 40 46" width="18" height="18" fill="none">
                <polygon points="20,2 38,12 38,34 20,44 2,34 2,12" fill="#1a1510" />
                <path d="M11 16 L20 32 L29 16" stroke="#c8a96e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>VMS</span>
          </div>

          <h1 className="reg-heading">Create your organization</h1>
          <p className="reg-sub">Set up your VMS workspace in seconds</p>
          <div className="reg-divider" />

          {error && (
            <div className="alert-error" style={{ marginBottom: 16 }}>
              <svg style={{ width: 16, height: 16, marginTop: 1, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="reg-form">

            <div>
              <label className="reg-label">Organization name</label>
              <input
                type="text"
                placeholder="Acme Corporation"
                value={orgName}
                onChange={e => handleOrgNameChange(e.target.value)}
                className="reg-input"
                required
              />
              {slug && (
                <p className="reg-slug-preview">
                  Your workspace: <span>vms.app/{slug}</span>
                </p>
              )}
            </div>

            <div>
              <label className="reg-label">Workspace URL</label>
              <input
                type="text"
                placeholder="acme-corporation"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="reg-input"
                required
              />
            </div>

            <div>
              <label className="reg-label">Admin email</label>
              <input
                type="email"
                placeholder="admin@acme.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="reg-input"
                required
              />
            </div>

            <button type="submit" className="reg-submit" disabled={loading}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Creating workspace…</>
                : "Create organization →"
              }
            </button>
          </form>

          <div className="reg-login-link">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}