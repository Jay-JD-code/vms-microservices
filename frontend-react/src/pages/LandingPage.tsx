import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Mulish:wght@300;400;500;600;700&display=swap');

  :root {
    --cream:   #faf8f4;
    --cream-2: #f3f0eb;
    --ink:     #1a1510;
    --ink-2:   #2d2820;
    --muted:   #7a7268;
    --accent:  #c8a96e;
    --accent2: #b8924a;
    --border:  rgba(26,21,16,0.09);
    --white:   #ffffff;
  }

  * { box-sizing: border-box; }

  .lp-root {
    font-family: 'Mulish', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 60px;
    background: rgba(250,248,244,0.92);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .lp-logo-mark { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: var(--ink); letter-spacing: -0.01em; }
  .lp-logo-sub  { font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
  .lp-nav-cta {
    padding: 8px 18px; background: var(--ink); color: var(--white);
    border: none; border-radius: 6px; font-size: 13px; font-weight: 600;
    font-family: 'Mulish', sans-serif; cursor: pointer;
    transition: background 0.2s, transform 0.15s; white-space: nowrap;
    display: flex; align-items: center; gap: 5px;
  }
  .lp-nav-cta:hover { background: var(--ink-2); transform: translateY(-1px); }

  /* ── HERO ── */
  .lp-hero {
    min-height: 100svh;
    padding: 80px 24px 60px;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: center;
  }
  .lp-hero-bg {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 80% 60% at 60% 30%, rgba(200,169,110,0.10) 0%, transparent 70%);
  }
  .lp-hero-grid {
    position: absolute; inset: 0; pointer-events: none; opacity: 0.04;
    background-image: linear-gradient(var(--ink) 1px, transparent 1px),
                      linear-gradient(90deg, var(--ink) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .lp-hero-inner {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: flex-start;
    gap: 0;
    max-width: 1200px; margin: 0 auto; width: 100%;
  }

  .lp-hero-visual-wrap {
    width: 100%;
    display: flex; justify-content: center; align-items: center;
    margin-bottom: 32px;
  }
  .lp-hero-visual-wrap svg {
    width: clamp(140px, 40vw, 200px);
    height: auto;
    opacity: 0.92;
  }

  .lp-hero-content { max-width: 560px; }

  .lp-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 5px 14px; border-radius: 50px;
    border: 1px solid var(--accent); color: var(--accent);
    font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; margin-bottom: 22px;
    animation: fade-up 0.6s 0.1s both;
  }
  .lp-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; flex-shrink: 0; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .lp-h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(36px, 8vw, 68px); font-weight: 800;
    line-height: 1.1; color: var(--ink);
    margin: 0 0 20px; letter-spacing: -0.02em;
    animation: fade-up 0.7s 0.2s both;
  }
  .lp-h1 em { font-style: italic; color: var(--accent); }

  .lp-lead {
    font-size: clamp(14px, 3vw, 17px); line-height: 1.7; color: var(--muted);
    margin: 0 0 32px;
    animation: fade-up 0.7s 0.3s both;
  }
  .lp-cta-row {
    display: flex; gap: 12px; flex-wrap: wrap;
    animation: fade-up 0.7s 0.4s both;
  }
  .lp-cta-primary {
    padding: 13px 28px; background: var(--ink); color: var(--white);
    border: none; border-radius: 8px; font-size: 14px; font-weight: 700;
    font-family: 'Mulish', sans-serif; cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    white-space: nowrap;
  }
  .lp-cta-primary:hover { background: var(--ink-2); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,21,16,0.18); }
  .lp-cta-secondary {
    padding: 13px 28px; background: transparent; color: var(--ink);
    border: 1px solid var(--border); border-radius: 8px; font-size: 14px; font-weight: 600;
    font-family: 'Mulish', sans-serif; cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .lp-cta-secondary:hover { border-color: var(--accent); background: rgba(200,169,110,0.06); transform: translateY(-2px); }

  /* ── STATS ── */
  .lp-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    background: var(--white);
  }
  .lp-stat {
    padding: 24px 20px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 4px;
  }
  .lp-stat:nth-child(2n) { border-right: none; }
  .lp-stat:nth-last-child(-n+2) { border-bottom: none; }
  .lp-stat-num { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: var(--ink); }
  .lp-stat-label { font-size: 11px; color: var(--muted); font-weight: 500; letter-spacing: 0.04em; }

  /* ── SECTIONS ── */
  .lp-section { padding: 64px 24px; }
  .lp-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 12px;
  }
  .lp-section-h2 {
    font-family: 'Playfair Display', serif; font-size: clamp(26px, 6vw, 42px); font-weight: 700;
    color: var(--ink); margin: 0 0 14px; letter-spacing: -0.02em; line-height: 1.2;
  }
  .lp-section-lead {
    font-size: clamp(13px, 3vw, 16px); color: var(--muted);
    line-height: 1.7; margin: 0 0 40px;
  }

  /* ── FEATURES ── */
  .lp-features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2px;
    background: var(--border);
    border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  }
  .lp-feature {
    background: var(--white); padding: 28px 24px;
    transition: background 0.2s;
  }
  .lp-feature:hover { background: var(--cream); }
  .lp-feature-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(200,169,110,0.12); border: 1px solid var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; margin-bottom: 16px;
  }
  .lp-feature-h3 { font-size: 15px; font-weight: 700; color: var(--ink); margin: 0 0 8px; }
  .lp-feature-p { font-size: 13px; color: var(--muted); line-height: 1.7; margin: 0; }

  /* ── ROLES ── */
  .lp-roles { background: var(--ink); padding: 64px 24px; }
  .lp-roles .lp-section-label { color: var(--accent); }
  .lp-roles .lp-section-h2 { color: var(--white); }
  .lp-roles .lp-section-lead { color: rgba(250,248,244,0.6); }
  .lp-roles-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .lp-role-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 22px 18px;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
  }
  .lp-role-card:hover { background: rgba(200,169,110,0.1); border-color: rgba(200,169,110,0.3); transform: translateY(-2px); }
  .lp-role-icon { font-size: 22px; margin-bottom: 12px; }
  .lp-role-title { font-size: 13px; font-weight: 700; color: var(--white); margin: 0 0 6px; }
  .lp-role-desc { font-size: 12px; color: rgba(250,248,244,0.55); line-height: 1.6; margin: 0; }

  /* ── STEPS ── */
  .lp-steps { display: flex; flex-direction: column; gap: 0; }
  .lp-step { display: flex; gap: 20px; position: relative; padding-bottom: 36px; }
  .lp-step:last-child { padding-bottom: 0; }
  .lp-step-left { display: flex; flex-direction: column; align-items: center; }
  .lp-step-num {
    width: 38px; height: 38px; border-radius: 50%;
    background: var(--ink); color: var(--white);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; flex-shrink: 0;
  }
  .lp-step-line { flex: 1; width: 1px; background: var(--border); margin: 6px 0; }
  .lp-step:last-child .lp-step-line { display: none; }
  .lp-step-content { padding-top: 8px; }
  .lp-step-h { font-size: 15px; font-weight: 700; color: var(--ink); margin: 0 0 6px; }
  .lp-step-p { font-size: 13px; color: var(--muted); line-height: 1.7; margin: 0; }

  /* ── CTA FOOTER ── */
  .lp-footer-cta {
    background: linear-gradient(135deg, var(--ink) 0%, #2d2820 100%);
    padding: 72px 24px; text-align: center;
    position: relative; overflow: hidden;
  }
  .lp-footer-cta::before {
    content: ''; position: absolute; top: -100px; left: 50%;
    transform: translateX(-50%);
    width: 400px; height: 240px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(200,169,110,0.12) 0%, transparent 70%);
  }
  .lp-footer-cta h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 7vw, 48px); font-weight: 700;
    color: var(--white); margin: 0 0 14px; letter-spacing: -0.02em;
    position: relative;
  }
  .lp-footer-cta p { font-size: clamp(13px, 3vw, 16px); color: rgba(250,248,244,0.6); margin: 0 0 36px; position: relative; }
  .lp-footer-cta button {
    padding: 14px 36px; background: var(--accent); color: var(--ink);
    border: none; border-radius: 8px; font-size: 15px; font-weight: 700;
    font-family: 'Mulish', sans-serif; cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    position: relative;
  }
  .lp-footer-cta button:hover { background: var(--accent2); transform: translateY(-2px); }
  .lp-footer-cta .vendor-cta {
    margin-top: 20px;
    padding: 12px 28px;
    background: transparent;
    color: rgba(250,248,244,0.8);
    border: 1px solid rgba(200,169,110,0.4);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Mulish', sans-serif;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    position: relative;
  }
  .lp-footer-cta .vendor-cta:hover { border-color: var(--accent); background: rgba(200,169,110,0.1); }

  /* ── PAGE FOOTER ── */
  .lp-page-footer {
    background: var(--ink); border-top: 1px solid rgba(255,255,255,0.06);
    padding: 24px; display: flex; align-items: center;
    justify-content: space-between; flex-wrap: wrap; gap: 12px;
  }
  .lp-page-footer p { font-size: 11px; color: rgba(250,248,244,0.4); margin: 0; }

  /* ── ANIMATIONS ── */
  @keyframes fade-up   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }

  /* ── TABLET ── */
  @media (min-width: 640px) {
    .lp-nav { padding: 0 40px; height: 64px; }
    .lp-hero { padding: 100px 40px 72px; }
    .lp-hero-visual-wrap svg { width: clamp(180px, 30vw, 260px); }
    .lp-stats { grid-template-columns: repeat(4, 1fr); }
    .lp-stat { border-bottom: none; }
    .lp-stat:nth-child(2n) { border-right: 1px solid var(--border); }
    .lp-stat:last-child { border-right: none; }
    .lp-stat-num { font-size: 32px; }
    .lp-section { padding: 80px 40px; }
    .lp-features-grid { grid-template-columns: repeat(2, 1fr); }
    .lp-roles { padding: 80px 40px; }
    .lp-footer-cta { padding: 88px 40px; }
    .lp-page-footer { padding: 28px 40px; }
  }

  /* ── DESKTOP ── */
  @media (min-width: 960px) {
    .lp-nav { padding: 0 60px; height: 68px; }
    .lp-hero { padding: 120px 60px 80px; flex-direction: row; align-items: center; }
    .lp-hero-inner { flex-direction: row; align-items: center; justify-content: space-between; gap: 40px; }
    .lp-hero-visual-wrap { margin-bottom: 0; width: auto; flex-shrink: 0; }
    .lp-hero-visual-wrap svg { width: clamp(260px, 28vw, 380px); }
    .lp-hero-content { max-width: 560px; }
    .lp-stat { padding: 32px 36px; }
    .lp-stat-num { font-size: 36px; }
    .lp-section { padding: 100px 60px; }
    .lp-features-grid { grid-template-columns: repeat(3, 1fr); }
    .lp-roles { padding: 100px 60px; }
    .lp-roles-grid { grid-template-columns: repeat(4, 1fr); }
    .lp-steps { max-width: 680px; margin: 0 auto; }
    .lp-footer-cta { padding: 100px 60px; }
    .lp-page-footer { padding: 32px 60px; }
  }
`;

const FEATURES = [
  { icon: "🏢", title: "Vendor Onboarding", desc: "Streamlined registration with automated credential delivery and multi-stage approval workflows." },
  { icon: "📦", title: "Purchase Orders", desc: "Create, track, and advance orders through every stage from creation to completion." },
  { icon: "💳", title: "Payment Management", desc: "Record, track, and reconcile payments with full audit trail and status tracking." },
  { icon: "📄", title: "Document Control", desc: "Secure document uploads with S3 storage, approval workflows, and instant downloads." },
  { icon: "📊", title: "Performance Scoring", desc: "Multi-dimensional vendor scoring across delivery, quality, fulfillment, and compliance." },
  { icon: "🔐", title: "Role-Based Access", desc: "Granular permissions for Admin, Vendor, Procurement, and Finance with scoped data views." },
];

const ROLES = [
  { icon: "⚙️", title: "Administrator", desc: "Full system control, account creation, vendor approvals, and platform oversight." },
  { icon: "🏪", title: "Vendor", desc: "View own orders, payments, documents, and performance metrics securely." },
  { icon: "📋", title: "Procurement", desc: "Manage vendor relationships, create purchase orders, and review compliance docs." },
  { icon: "💰", title: "Finance", desc: "Process payments, review invoices, and access financial reporting." },
  { icon: "👑", title: "Master Admin", desc: "Cross-organization oversight, system configuration, and super-user privileges." },
];

const STEPS = [
  { title: "Register a vendor", desc: "Admin or Procurement adds a vendor. Credentials are auto-generated and emailed instantly." },
  { title: "Approve & onboard", desc: "Admin reviews documents and approves the vendor, unlocking portal access." },
  { title: "Create purchase orders", desc: "Procurement raises orders against approved vendors with line-item detail." },
  { title: "Track & advance", desc: "Orders move through Created → Approved → Shipped → Delivered → Completed." },
  { title: "Process payment", desc: "Finance records payment against delivered orders and marks completion." },
  { title: "Evaluate performance", desc: "Scores are calculated across delivery, quality, fulfillment and compliance dimensions." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const id = "lp-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = STYLES;
      document.head.appendChild(el);
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const ref = (i: number) => (el: HTMLElement | null) => { if (el) revealRefs.current[i] = el; };

  return (
    <div className="lp-root">
      {/* NAV */}
      <nav className="lp-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg viewBox="0 0 40 46" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="20,2 38,12 38,34 20,44 2,34 2,12" fill="#1a1510" />
            <path d="M11 16 L20 32 L29 16" stroke="#c8a96e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="lp-logo-mark">VMS</span>
            <span className="lp-logo-sub">Vendor Portal</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/register-vendor")}
            style={{ padding: "8px 16px", background: "transparent", color: "#c8a96e", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: "'Mulish', sans-serif", cursor: "pointer" }}
          >
            Register as Vendor
          </button>
          <button className="lp-nav-cta" onClick={() => navigate("/login")}>Sign In →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-grid" />
        <div className="lp-hero-inner">
          <div className="lp-hero-visual-wrap">
            <svg viewBox="0 0 340 380" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="170,18 310,95 310,285 170,362 30,285 30,95" fill="none" stroke="rgba(200,169,110,0.18)" strokeWidth="1.5" />
              <polygon points="170,44 286,110 286,260 170,336 54,260 54,110" fill="none" stroke="rgba(200,169,110,0.12)" strokeWidth="1" />
              <polygon points="170,68 268,122 268,238 170,292 72,238 72,122" fill="#1a1510" />
              <rect x="120" y="68" width="100" height="3" rx="1.5" fill="#c8a96e" opacity="0.6" />
              <path d="M112 148 L170 238 L228 148" stroke="rgba(200,169,110,0.25)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M112 148 L170 238 L228 148" stroke="#c8a96e" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              {[[170,68],[268,122],[268,238],[170,292],[72,238],[72,122]].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="3.5" fill="#c8a96e" opacity="0.5" />
              ))}
              <text x="170" y="334" textAnchor="middle" fontFamily="'Playfair Display', serif" fontSize="22" fontWeight="700" fill="#1a1510" letterSpacing="6">VMS</text>
              <text x="170" y="356" textAnchor="middle" fontFamily="'Mulish', sans-serif" fontSize="9" fontWeight="700" fill="#c8a96e" letterSpacing="4">VENDOR PORTAL</text>
              <line x1="40" y1="345" x2="130" y2="345" stroke="rgba(26,21,16,0.12)" strokeWidth="1" />
              <line x1="210" y1="345" x2="300" y2="345" stroke="rgba(26,21,16,0.12)" strokeWidth="1" />
            </svg>
          </div>

          <div className="lp-hero-content">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-dot" />
              Enterprise Vendor Management
            </div>
            <h1 className="lp-h1">
              Manage vendors<br />with <em>clarity</em><br />and control.
            </h1>
            <p className="lp-lead">
              A unified platform for onboarding, orders, payments, documents, and performance — built for teams that demand precision.
            </p>
            <div className="lp-cta-row">
              <button className="lp-cta-primary" onClick={() => navigate("/register")}>
                Get Started →
              </button>
              <button className="lp-cta-secondary" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="lp-stats">
        {[
          { num: "500+", label: "Vendors managed" },
          { num: "12,000+", label: "Orders processed" },
          { num: "99.9%", label: "Uptime SLA" },
          { num: "4 roles", label: "Access levels" },
        ].map((s) => (
          <div key={s.label} className="lp-stat">
            <span className="lp-stat-num">{s.num}</span>
            <span className="lp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section className="lp-section">
        <div ref={ref(1) as any} className="reveal">
          <div className="lp-section-label">Platform capabilities</div>
          <h2 className="lp-section-h2">Everything in one place.</h2>
          <p className="lp-section-lead">From vendor registration to payment reconciliation — every workflow your procurement team needs, unified.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`lp-feature reveal reveal-delay-${(i % 3) + 1}`} ref={ref(i + 2) as any}>
              <div className="lp-feature-icon">{f.icon}</div>
              <h3 className="lp-feature-h3">{f.title}</h3>
              <p className="lp-feature-p">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="lp-roles">
        <div className="lp-section-label">Role-based access</div>
        <h2 className="lp-section-h2" style={{ color: "var(--white)" }}>The right view for every team.</h2>
        <p className="lp-section-lead">Each role sees exactly what they need — nothing more, nothing less.</p>
        <div className="lp-roles-grid">
          {ROLES.map((r) => (
            <div key={r.title} className="lp-role-card">
              <div className="lp-role-icon">{r.icon}</div>
              <p className="lp-role-title">{r.title}</p>
              <p className="lp-role-desc">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="lp-section">
        <div className="lp-section-label">How it works</div>
        <h2 className="lp-section-h2">Six steps. Zero confusion.</h2>
        <p className="lp-section-lead">A clear, auditable workflow from vendor registration through final payment.</p>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className={`lp-step reveal reveal-delay-${(i % 3) + 1}`} ref={ref(i + 10) as any}>
              <div className="lp-step-left">
                <div className="lp-step-num">{i + 1}</div>
                <div className="lp-step-line" />
              </div>
              <div className="lp-step-content">
                <h4 className="lp-step-h">{s.title}</h4>
                <p className="lp-step-p">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="lp-footer-cta">
        <h2>Ready to get started?</h2>
        <p>Sign in to your VMS portal and take control of your vendor relationships.</p>
        <button onClick={() => navigate("/register")}>
          Create your workspace →
        </button>
        <button className="vendor-cta" onClick={() => navigate("/register-vendor")}>
          Register as a Vendor →
        </button>
      </section>

      {/* PAGE FOOTER */}
      <footer className="lp-page-footer">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="lp-logo-mark" style={{ color: "rgba(250,248,244,0.8)", fontSize: 14 }}>VMS</span>
          <span className="lp-logo-sub" style={{ color: "rgba(200,169,110,0.7)" }}>Vendor Portal</span>
        </div>
        <p>© 2026 Vendor Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
