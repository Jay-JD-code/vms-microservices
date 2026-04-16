import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Users, ShoppingCart, BarChart3, ShieldCheck, Building2, Phone, MapPin, Mail, ArrowLeft } from "lucide-react";

export default function VendorRegistration() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.registerVendor({
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
      });

      localStorage.setItem("vms_token", response.accessToken);
      localStorage.setItem("vms_user", JSON.stringify({
        id: formData.email,
        email: formData.email,
        name: formData.companyName,
        role: "VENDOR",
        firstLogin: response.firstLogin,
      }));

      toast.success("Registration successful! Welcome to the platform.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .reg-root {
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

        .reg-root .serif { font-family: 'Playfair Display', serif; }

        /* ── Brand panel ── */
        .reg-brand {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: var(--ink);
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 1024px) { .reg-brand { display: flex; width: 52%; } }

        .reg-brand::before {
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
        .reg-auth {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 24px;
          background: var(--cream);
          overflow-y: auto;
        }
        .reg-box {
          width: 100%;
          max-width: 440px;
          padding-top: 20px;
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
        .reg-heading {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }
        .reg-subheading {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 28px;
          font-weight: 400;
        }

        .reg-divider {
          width: 32px;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
          margin-bottom: 24px;
          opacity: 0.7;
        }

        /* Form */
        .reg-form { display: flex; flex-direction: column; gap: 18px; }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }

        .form-group { display: flex; flex-direction: column; gap: 6px; }

        .reg-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .reg-label span {
          color: var(--red);
          margin-left: 2px;
        }

        .reg-input {
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
        .reg-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .reg-input::placeholder { color: var(--muted-2); }
        .reg-input.error {
          border-color: rgba(220,38,38,0.5);
        }
        .reg-input.error:focus {
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

        textarea.reg-input {
          resize: none;
          min-height: 80px;
        }

        .field-error {
          font-size: 11px;
          color: var(--red);
          font-weight: 500;
          margin-top: 2px;
        }

        .reg-submit {
          background: var(--ink);
          color: var(--cream);
          border: none;
          border-radius: 10px;
          padding: 13px 24px;
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
          margin-top: 8px;
        }
        .reg-submit:hover:not(:disabled) {
          background: var(--ink-2);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(26,21,16,0.2);
        }
        .reg-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .reg-divider-line {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 8px 0;
        }
        .reg-divider-line::before,
        .reg-divider-line::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .reg-divider-text {
          font-size: 11px;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .reg-footer-text {
          text-align: center;
          font-size: 13px;
          color: var(--muted);
          margin-top: 16px;
        }
        .reg-footer-text a {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .reg-footer-text a:hover {
          opacity: 0.7;
        }

        .reg-terms {
          text-align: center;
          font-size: 11px;
          color: var(--muted-2);
          margin-top: 16px;
          line-height: 1.5;
        }

        .section-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent);
          margin: 4px 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

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
      <div className="reg-brand">
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
            Join our<br />
            <span>vendor network</span>
          </h2>
          <p className="brand-desc">
            Register your company to connect with organizations, receive purchase orders, and manage your business operations seamlessly.
          </p>
          <div>
            {[
              { icon: Building2, text: "Company profile & contact management" },
              { icon: ShoppingCart, text: "Receive and manage purchase orders" },
              { icon: BarChart3, text: "Track performance & analytics" },
              { icon: ShieldCheck, text: "Secure payment processing" },
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
      <div className="reg-auth" style={{ position: "relative" }}>
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={14} />
        </button>

        <div className="reg-box">
          {/* Mobile logo */}
          <div className="mobile-logo">
            <div className="mobile-logo-box"><span>V</span></div>
            <span className="mobile-logo-name">VMS</span>
          </div>

          <h1 className="reg-heading">Register as Vendor</h1>
          <p className="reg-subheading">Create your vendor account to get started</p>
          <div className="reg-divider" />

          <form onSubmit={handleSubmit} className="reg-form">

            {/* Company Info */}
            <div>
              <div className="section-title">Company Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="reg-label">Company Name <span>*</span></label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`reg-input ${errors.companyName ? "error" : ""}`}
                    placeholder="Acme Corporation"
                  />
                  {errors.companyName && <span className="field-error">{errors.companyName}</span>}
                </div>
                <div className="form-group">
                  <label className="reg-label">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="reg-input"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <div className="section-title">Contact Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="reg-label">Email Address <span>*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`reg-input ${errors.email ? "error" : ""}`}
                    placeholder="contact@company.com"
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="reg-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="reg-input"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="reg-label">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="reg-input"
                  placeholder="123 Business Park, Sector 62, Noida, UP 201301"
                  rows={2}
                />
              </div>
            </div>

            {/* Credentials */}
            <div>
              <div className="section-title">Account Credentials</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="reg-label">Password <span>*</span></label>
                  <div className="pass-wrap">
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`reg-input ${errors.password ? "error" : ""}`}
                      placeholder="Min 6 characters"
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label className="reg-label">Confirm Password <span>*</span></label>
                  <div className="pass-wrap">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`reg-input ${errors.confirmPassword ? "error" : ""}`}
                      placeholder="Re-enter password"
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                      {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            <button type="submit" className="reg-submit" disabled={isLoading}>
              {isLoading
                ? <><Loader2 size={15} className="animate-spin" /> Registering…</>
                : "Create Vendor Account"
              }
            </button>

            <p className="reg-footer-text">
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>

            <p className="reg-terms">
              By registering, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
