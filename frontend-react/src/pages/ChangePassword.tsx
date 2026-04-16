import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";

/* Minimal password strength indicator */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = ["Weak", "Fair", "Good", "Strong"][score - 1] ?? "Weak";
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const color  = colors[score - 1] ?? "bg-red-400";
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
            i < score ? color : "bg-border"
          }`} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ChangePassword() {
  const { user } = useAuth();

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]               = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");

  const passwordsMatch  = !confirmPassword || password === confirmPassword;
  const isValid = password.length >= 6 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError("Both fields are required"); return; }
    if (password.length < 6)           { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword)  { setError("Passwords do not match"); return; }

    setError("");
    setLoading(true);

    try {
      await authApi.changePassword(user?.email ?? "", password);

      // Clear firstLogin flag in localStorage so we don't loop
      const updatedUser = { ...user, firstLogin: false };
      localStorage.setItem("vms_user", JSON.stringify(updatedUser));

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-center p-12 text-white"
        style={{
          background:
            "linear-gradient(135deg, hsl(225,73%,28%) 0%, hsl(225,73%,18%) 60%, hsl(250,60%,14%) 100%)",
        }}
      >
        {/* Logo */}
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
          Secure your account
        </h2>
        <p className="text-white/60 text-base leading-relaxed max-w-sm mb-8">
          You're logged in with a temporary password. Set a strong, permanent
          password to protect your account.
        </p>

        <div className="space-y-3">
          {[
            { icon: Lock,        text: "Use at least 6 characters" },
            { icon: ShieldCheck, text: "Mix letters, numbers and symbols for strength" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Icon size={13} className="text-white/80" />
              </div>
              <span className="text-white/70 text-sm">{text}</span>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs mt-12">
          © {new Date().getFullYear()} VMS. All rights reserved.
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-black">V</span>
            </div>
            <span className="font-bold text-foreground">VMS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Set your password</h1>
            <p className="text-sm text-muted-foreground">
              {user?.email
                ? <>Securing account for <strong>{user.email}</strong>.</>
                : "Create a permanent password to continue."}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/20 rounded-xl text-sm text-destructive">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                  placeholder="••••••••"
                  className="form-input pr-10"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }}
                  placeholder="••••••••"
                  className={`form-input pr-10 ${
                    confirmPassword && !passwordsMatch
                      ? "border-destructive focus:ring-destructive/30"
                      : ""
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-destructive mt-1">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && password && (
                <p className="text-[11px] text-green-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="btn-primary w-full h-10 text-sm font-semibold shadow-md"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Updating...</>
                : "Set password & continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
