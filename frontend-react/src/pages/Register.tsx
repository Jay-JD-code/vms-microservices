import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { Loader2, Mail, User, Briefcase, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState<"PROCUREMENT" | "FINANCE">("PROCUREMENT");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Full name is required"); return; }
    setError("");
    setLoading(true);
    try {
      await authApi.registerStaff({ name: name.trim(), email, role });
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Account created!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Check <strong>{email}</strong> for your temporary password.<br />
            Log in and you'll be prompted to set a new password on first access.
          </p>
          <button
            onClick={() => navigate("/login", { state: { message: "Account created. Check your email for login credentials." } })}
            className="btn-primary w-full h-10 text-sm font-semibold"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-center p-12 text-white"
        style={{ background: "linear-gradient(135deg, hsl(225,73%,28%) 0%, hsl(225,73%,18%) 60%, hsl(250,60%,14%) 100%)" }}
      >
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20">
            <span className="text-white text-base font-black">V</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">VMS</span>
            <span className="block text-white/50 text-xs -mt-0.5">Vendor Management System</span>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold leading-tight mb-4">
          Join the team
        </h2>
        <p className="text-white/60 text-base leading-relaxed max-w-sm mb-8">
          Create your staff account. A temporary password will be emailed to you instantly — log in and set a new password to get started.
        </p>

        <div className="space-y-3">
          {[
            { step: "1", text: "Fill in your details & role below" },
            { step: "2", text: "Receive your temp password by email" },
            { step: "3", text: "Sign in & set your permanent password" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {step}
              </div>
              <span className="text-white/70 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[400px]">

          {/* Back link */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={14} /> Back to sign in
          </button>

          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Available for <strong>Procurement</strong> and <strong>Finance</strong> staff only.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/20 rounded-xl text-sm text-destructive">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Full name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
                  placeholder="Jane Doe"
                  className="form-input pl-9"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Work email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  placeholder="jane@company.com"
                  className="form-input pl-9"
                  required
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Department / Role</label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "PROCUREMENT" | "FINANCE")}
                  className="form-input pl-9 appearance-none cursor-pointer"
                >
                  <option value="PROCUREMENT">Procurement</option>
                  <option value="FINANCE">Finance</option>
                </select>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                A temporary password will be emailed to you. Admin users are managed separately.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-10 text-sm font-semibold shadow-md"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account...</> : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
