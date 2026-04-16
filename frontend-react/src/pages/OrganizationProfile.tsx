import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { organizationApi } from "@/lib/api";
import { toast } from "sonner";
import { Building2, Mail, Phone, MapPin, Globe, Building, CreditCard, FileText, Users, Save, Loader2 } from "lucide-react";

interface OrganizationProfile {
  id: number;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  industry?: string;
  taxId?: string;
  logoUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  contactPersonName?: string;
  gstNumber?: string;
}

export default function OrganizationProfile() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<OrganizationProfile>>({});

  const { data: org, isLoading } = useQuery({
    queryKey: ["currentOrganization"],
    queryFn: () => organizationApi.getCurrent() as Promise<OrganizationProfile>,
    retry: 1,
  });

  useEffect(() => {
    if (org) {
      setFormData(org);
    }
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<OrganizationProfile>) => organizationApi.updateProfile(data),
    onSuccess: () => {
      toast.success("Organization profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update profile");
    },
  });

  const handleChange = (field: keyof OrganizationProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AppLayout title="Organization Profile" subtitle="Manage your organization details">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Organization Profile" subtitle="Manage your organization details">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .profile-root {
          --cream: #faf8f4;
          --ink: #1a1510;
          --ink-2: #2d2820;
          --ink-3: #3d3830;
          --muted: #7a7268;
          --muted-2: #b5afa6;
          --muted-3: #d4cfc6;
          --accent: #c8a96e;
          --accent-dim: rgba(200,169,110,0.15);
          --border: rgba(26,21,16,0.1);
          background: var(--cream);
          min-height: 100vh;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          padding: 32px;
        }

        .profile-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .profile-section {
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
        }

        .profile-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-section-title svg {
          color: var(--accent);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .profile-field {
          display: flex;
          flex-direction: column;
        }

        .profile-field.full {
          grid-column: span 2;
        }

        .profile-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-input {
          padding: 12px 16px;
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .profile-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }

        .profile-input::placeholder {
          color: var(--muted-2);
        }

        textarea.profile-input {
          resize: vertical;
          min-height: 100px;
        }

        .profile-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-save {
          padding: 12px 28px;
          border-radius: 10px;
          border: none;
          background: var(--ink);
          font-size: 14px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-save:hover {
          background: var(--ink-2);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-cancel {
          padding: 12px 28px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: white;
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
        }
      `}</style>

      <div className="profile-root">
        <form className="profile-form" onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              <Building2 size={20} />
              Basic Information
            </h3>
            <div className="profile-grid">
              <div className="profile-field">
                <label className="profile-label">Organization Name</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.name || ""}
                  onChange={e => handleChange("name", e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">Industry</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.industry || ""}
                  onChange={e => handleChange("industry", e.target.value)}
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
              <div className="profile-field full">
                <label className="profile-label">Description</label>
                <textarea
                  className="profile-input"
                  value={formData.description || ""}
                  onChange={e => handleChange("description", e.target.value)}
                  placeholder="Brief description of your organization"
                  rows={3}
                />
              </div>
              <div className="profile-field full">
                <label className="profile-label">Website</label>
                <input
                  type="url"
                  className="profile-input"
                  value={formData.website || ""}
                  onChange={e => handleChange("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              <Users size={20} />
              Contact Information
            </h3>
            <div className="profile-grid">
              <div className="profile-field">
                <label className="profile-label">Contact Person</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.contactPersonName || ""}
                  onChange={e => handleChange("contactPersonName", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">Email</label>
                <input
                  type="email"
                  className="profile-input"
                  value={formData.contactEmail || ""}
                  onChange={e => handleChange("contactEmail", e.target.value)}
                  placeholder="contact@organization.com"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">Phone</label>
                <input
                  type="tel"
                  className="profile-input"
                  value={formData.contactPhone || ""}
                  onChange={e => handleChange("contactPhone", e.target.value)}
                  placeholder="+91 1234567890"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              <MapPin size={20} />
              Address
            </h3>
            <div className="profile-grid">
              <div className="profile-field full">
                <label className="profile-label">Street Address</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.address || ""}
                  onChange={e => handleChange("address", e.target.value)}
                  placeholder="123 Business Street"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">City</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.city || ""}
                  onChange={e => handleChange("city", e.target.value)}
                  placeholder="Mumbai"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">State</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.state || ""}
                  onChange={e => handleChange("state", e.target.value)}
                  placeholder="Maharashtra"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">Country</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.country || ""}
                  onChange={e => handleChange("country", e.target.value)}
                  placeholder="India"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">Postal Code</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.postalCode || ""}
                  onChange={e => handleChange("postalCode", e.target.value)}
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          {/* Tax Info */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              <FileText size={20} />
              Tax Information
            </h3>
            <div className="profile-grid">
              <div className="profile-field">
                <label className="profile-label">Tax ID / PAN</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.taxId || ""}
                  onChange={e => handleChange("taxId", e.target.value)}
                  placeholder="ABCDE1234F"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">GST Number</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.gstNumber || ""}
                  onChange={e => handleChange("gstNumber", e.target.value)}
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              <CreditCard size={20} />
              Bank Details
            </h3>
            <div className="profile-grid">
              <div className="profile-field">
                <label className="profile-label">Bank Name</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.bankName || ""}
                  onChange={e => handleChange("bankName", e.target.value)}
                  placeholder="HDFC Bank"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">Account Number</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.bankAccountNumber || ""}
                  onChange={e => handleChange("bankAccountNumber", e.target.value)}
                  placeholder="123456789012"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">IFSC Code</label>
                <input
                  type="text"
                  className="profile-input"
                  value={formData.bankIfscCode || ""}
                  onChange={e => handleChange("bankIfscCode", e.target.value)}
                  placeholder="HDFC0001234"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setFormData(org || {})}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Saving...</>
              ) : (
                <><Save size={16} />Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
