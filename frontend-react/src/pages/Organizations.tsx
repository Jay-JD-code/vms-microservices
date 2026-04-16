import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { organizationApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, Package, Clock, CheckCircle, XCircle, Loader2, Search, X, Globe, Phone, Mail, MapPin, Building, CreditCard, FileText } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  createdAt: string;
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
  updatedAt?: string;
}

export default function Organizations() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.getAll() as Promise<Organization[]>,
    retry: 1,
  });

  const filtered = organizations.filter((org: Organization) => {
    const matchSearch = 
      org.name?.toLowerCase().includes(search.toLowerCase()) ||
      org.slug?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <AppLayout title="Organizations" subtitle="Manage all registered organizations">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .org-root {
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
        }

        .org-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .org-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .org-stat-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .org-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .org-stat-icon.total {
          background: rgba(37,99,235,0.08);
          color: #2563eb;
        }

        .org-stat-icon.active {
          background: rgba(5,150,105,0.08);
          color: #059669;
        }

        .org-stat-icon.trial {
          background: rgba(217,119,6,0.08);
          color: #d97706;
        }

        .org-stat-content {
          flex: 1;
        }

        .org-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--ink);
          line-height: 1;
        }

        .org-stat-label {
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
          font-weight: 600;
        }

        .org-search {
          position: relative;
          width: 320px;
        }

        .org-search input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 13px;
          font-family: 'Mulish', sans-serif;
          background: white;
          color: var(--ink);
        }

        .org-search input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }

        .org-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }

        .org-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .org-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .org-card:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 12px rgba(26,21,16,0.06);
        }

        .org-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .org-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--accent-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }

        .org-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .org-card-badge.active {
          background: rgba(5,150,105,0.08);
          color: #059669;
        }

        .org-card-badge.inactive {
          background: rgba(220,38,38,0.08);
          color: #dc2626;
        }

        .org-card-badge.trial {
          background: rgba(217,119,6,0.08);
          color: #d97706;
        }

        .org-card-badge.enterprise {
          background: rgba(37,99,235,0.08);
          color: #2563eb;
        }

        .org-card-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }

        .org-card-slug {
          font-size: 12px;
          color: var(--muted);
          font-weight: 600;
        }

        .org-card-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          margin-top: 16px;
        }

        .org-card-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--muted);
          font-weight: 600;
        }

        .org-card-meta-item svg {
          width: 12px;
          height: 12px;
        }

        .org-empty {
          text-align: center;
          padding: 80px 20px;
          color: var(--muted);
        }

        .org-empty h3 {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--ink);
        }

        .field {
          margin-bottom: 16px;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(26,21,16,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(26,21,16,0.2);
        }

        .modal-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px 28px;
          border-bottom: 1px solid var(--border);
        }

        .modal-eyebrow {
          font-size: 10px;
          font-weight: 700;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }

        .modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--ink);
        }

        .modal-sub {
          font-size: 13px;
          color: var(--muted);
          margin-top: 4px;
        }

        .modal-close {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--muted);
        }

        .modal-body {
          padding: 24px 28px;
        }

        .modal-foot {
          padding: 16px 28px;
          border-top: 1px solid var(--border);
          background: var(--cream);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-cancel {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: white;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
        }

        .btn-submit {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: var(--ink);
          font-size: 13px;
          font-weight: 600;
          color: white;
          cursor: pointer;
        }
      `}</style>

      <div className="org-root">
        {/* Stats */}
        <div className="org-stats">
          <div className="org-stat-card">
            <div className="org-stat-icon total">
              <Building2 size={22} />
            </div>
            <div className="org-stat-content">
              <div className="org-stat-value">{organizations.length}</div>
              <div className="org-stat-label">Total Organizations</div>
            </div>
          </div>
          <div className="org-stat-card">
            <div className="org-stat-icon active">
              <CheckCircle size={22} />
            </div>
            <div className="org-stat-content">
              <div className="org-stat-value">{organizations.filter((o: Organization) => o.active).length}</div>
              <div className="org-stat-label">Active Organizations</div>
            </div>
          </div>
          <div className="org-stat-card">
            <div className="org-stat-icon trial">
              <Clock size={22} />
            </div>
            <div className="org-stat-content">
              <div className="org-stat-value">{organizations.filter((o: Organization) => o.plan === "TRIAL").length}</div>
              <div className="org-stat-label">Trial Plans</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="org-header">
          <div className="org-search">
            <Search size={16} className="org-search-icon" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="org-empty">
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 12 }}>Loading organizations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="org-empty">
            <Building2 size={48} style={{ opacity: 0.3 }} />
            <h3>No organizations found</h3>
            <p>{search ? "Try adjusting your search" : "No organizations have registered yet"}</p>
          </div>
        ) : (
          <div className="org-grid">
            {filtered.map((org: Organization) => (
              <div key={org.id} className="org-card" onClick={() => setSelectedOrg(org)} style={{ cursor: "pointer" }}>
                <div className="org-card-header">
                  <div className="org-card-icon">
                    <Building2 size={20} />
                  </div>
                  <span className={`org-card-badge ${org.active ? "active" : "inactive"}`}>
                    {org.active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {org.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="org-card-name">{org.name}</div>
                <div className="org-card-slug">@{org.slug}</div>
                <div className="org-card-meta">
                  <span className={`org-card-badge ${org.plan?.toLowerCase()}`}>
                    {org.plan || "TRIAL"}
                  </span>
                  <span className="org-card-meta-item">
                    <Clock />
                    Created {org.createdAt ? new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Organization Details Modal */}
        {selectedOrg && (
          <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setSelectedOrg(null); }}>
            <div className="modal" style={{ maxWidth: 600 }}>
              <div className="modal-top">
                <div>
                  <div className="modal-eyebrow">Organization Details</div>
                  <div className="modal-title">{selectedOrg.name}</div>
                  <div className="modal-sub">@{selectedOrg.slug}</div>
                </div>
                <button className="modal-close" onClick={() => setSelectedOrg(null)}><X size={14}/></button>
              </div>

              <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="field">
                    <span className="field-label">Status</span>
                    <span className={`org-card-badge ${selectedOrg.active ? "active" : "inactive"}`} style={{ display: "inline-flex" }}>
                      {selectedOrg.active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {selectedOrg.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="field">
                    <span className="field-label">Plan</span>
                    <span style={{ fontWeight: 600 }}>{selectedOrg.plan || "TRIAL"}</span>
                  </div>
                </div>

                {selectedOrg.description && (
                  <div className="field">
                    <span className="field-label">Description</span>
                    <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{selectedOrg.description}</span>
                  </div>
                )}

                <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact Information</h4>
                  
                  {selectedOrg.contactPersonName && (
                    <div className="field">
                      <span className="field-label"><Users size={12} /> Contact Person</span>
                      <span style={{ fontWeight: 600 }}>{selectedOrg.contactPersonName}</span>
                    </div>
                  )}
                  
                  {selectedOrg.contactEmail && (
                    <div className="field">
                      <span className="field-label"><Mail size={12} /> Email</span>
                      <span style={{ fontWeight: 600 }}>{selectedOrg.contactEmail}</span>
                    </div>
                  )}
                  
                  {selectedOrg.contactPhone && (
                    <div className="field">
                      <span className="field-label"><Phone size={12} /> Phone</span>
                      <span style={{ fontWeight: 600 }}>{selectedOrg.contactPhone}</span>
                    </div>
                  )}
                </div>

                {(selectedOrg.address || selectedOrg.city || selectedOrg.state || selectedOrg.country) && (
                  <div className="field" style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
                    <span className="field-label"><MapPin size={12} /> Address</span>
                    <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
                      {[selectedOrg.address, selectedOrg.city, selectedOrg.state, selectedOrg.postalCode, selectedOrg.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}

                {selectedOrg.industry && (
                  <div className="field">
                    <span className="field-label"><Building size={12} /> Industry</span>
                    <span style={{ fontWeight: 600 }}>{selectedOrg.industry}</span>
                  </div>
                )}

                {selectedOrg.website && (
                  <div className="field">
                    <span className="field-label"><Globe size={12} /> Website</span>
                    <a href={selectedOrg.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>{selectedOrg.website}</a>
                  </div>
                )}

                {(selectedOrg.taxId || selectedOrg.gstNumber) && (
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tax Information</h4>
                    
                    {selectedOrg.taxId && (
                      <div className="field">
                        <span className="field-label"><FileText size={12} /> Tax ID</span>
                        <span style={{ fontWeight: 600 }}>{selectedOrg.taxId}</span>
                      </div>
                    )}
                    
                    {selectedOrg.gstNumber && (
                      <div className="field">
                        <span className="field-label"><FileText size={12} /> GST Number</span>
                        <span style={{ fontWeight: 600 }}>{selectedOrg.gstNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {(selectedOrg.bankName || selectedOrg.bankAccountNumber) && (
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bank Details</h4>
                    
                    {selectedOrg.bankName && (
                      <div className="field">
                        <span className="field-label"><CreditCard size={12} /> Bank Name</span>
                        <span style={{ fontWeight: 600 }}>{selectedOrg.bankName}</span>
                      </div>
                    )}
                    
                    {selectedOrg.bankAccountNumber && (
                      <div className="field">
                        <span className="field-label"><CreditCard size={12} /> Account Number</span>
                        <span style={{ fontWeight: 600 }}>{selectedOrg.bankAccountNumber}</span>
                      </div>
                    )}
                    
                    {selectedOrg.bankIfscCode && (
                      <div className="field">
                        <span className="field-label"><CreditCard size={12} /> IFSC Code</span>
                        <span style={{ fontWeight: 600 }}>{selectedOrg.bankIfscCode}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-foot">
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setSelectedOrg(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
