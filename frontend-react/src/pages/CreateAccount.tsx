import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { UserPlus, Mail, Shield, CheckCircle2 } from "lucide-react";

type StaffRole = "PROCUREMENT" | "FINANCE";

const ROLES: { value: StaffRole; label: string; description: string; color: string }[] = [
  {
    value: "PROCUREMENT",
    label: "Procurement",
    description: "Manage vendors, create orders, review documents",
    color: "#0369a1",
  },
  {
    value: "FINANCE",
    label: "Finance",
    description: "Process payments, review invoices, view orders",
    color: "#047857",
  },
];

export default function CreateAccount() {
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState<StaffRole>("PROCUREMENT");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) { setError("Email address is required."); return; }

    setLoading(true);
    try {
      await authApi.registerStaff({ name: "", email: email.trim(), role });
      setSuccess(`${role} account created for ${email}. Login credentials have been sent to their inbox.`);
      setEmail("");
      setRole("PROCUREMENT");
      toast.success("Account created successfully");
    } catch (err: any) {
      const msg = err?.message || "Failed to create account. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Create Account" subtitle="Create staff accounts for Procurement or Finance">
      <div className="max-w-xl">

        {/* Success banner */}
        {success && (
          <div className="flex items-start gap-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <Shield size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          {/* Form header */}
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <UserPlus size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">New Staff Account</h2>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setRole(r.value); setError(""); }}
                    className="text-left p-3 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: role === r.value ? r.color : "var(--border)",
                      background: role === r.value ? `${r.color}10` : "transparent",
                    }}
                  >
                    <p
                      className="text-xs font-bold mb-0.5"
                      style={{ color: role === r.value ? r.color : "var(--foreground)" }}
                    >
                      {r.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {r.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); setSuccess(""); }}
                  placeholder="e.g. sarah@company.com"
                  className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                A temporary access key will be sent to this address. The user must change it on first login.
              </p>
            </div>

          </div>

          {/* Form footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Credentials are emailed automatically upon creation.
            </p>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex items-center gap-2 h-8 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <UserPlus size={13} />
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>

        {/* Info card */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-800 mb-1">How it works</p>
          <ul className="text-[11px] text-amber-700 space-y-1 list-disc list-inside">
            <li>A secure temporary access key is auto-generated</li>
            <li>Login credentials are emailed to the staff member</li>
            <li>They will be prompted to change their password on first login</li>
            <li>Only Procurement and Finance roles can be created here</li>
          </ul>
        </div>

      </div>
    </AppLayout>
  );
}