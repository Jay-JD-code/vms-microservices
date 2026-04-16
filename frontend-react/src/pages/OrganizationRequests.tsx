import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { organizationApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Building2, CheckCircle, XCircle, Clock, Loader2, Eye, ArrowRight, Send, Users } from "lucide-react";

const STATUS_META: Record<string, { color: string; bg: string; border: string; label: string; icon: any }> = {
  PENDING:  { color: "#d97706", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.25)",  label: "Pending",   icon: Clock },
  ACCEPTED: { color: "#059669", bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.25)", label: "Accepted",  icon: CheckCircle },
  DECLINED: { color: "#dc2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.2)",  label: "Declined",  icon: XCircle },
};

export default function OrganizationRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "DECLINED">("ALL");

  const isVendor = user?.role === "VENDOR";

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["organization-requests", user?.id, isVendor ? "vendor" : "org"],
    queryFn: () => isVendor 
      ? organizationApi.getMyRequests(user?.id || "")
      : organizationApi.getSentRequests(),
    enabled: !!user?.id,
    retry: 1,
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => organizationApi.acceptRequest(requestId, user?.id || ""),
    onSuccess: () => {
      toast.success("Request accepted! You are now associated with this organization.");
      queryClient.invalidateQueries({ queryKey: ["organization-requests"] });
      setSelectedRequest(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to accept request"),
  });

  const declineMutation = useMutation({
    mutationFn: (requestId: string) => organizationApi.declineRequest(requestId, user?.id || ""),
    onSuccess: () => {
      toast.success("Request declined");
      queryClient.invalidateQueries({ queryKey: ["organization-requests"] });
      setSelectedRequest(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to decline request"),
  });

  const filtered = requests.filter((r: any) => filter === "ALL" || r.status === filter);

  const pendingCount = requests.filter((r: any) => r.status === "PENDING").length;

  return (
    <AppLayout 
      title={isVendor ? "Partnership Requests" : "Sent Requests"} 
      subtitle={isVendor ? "Manage organization partnership requests" : "Track your sent vendor requests"}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .req-root {
          --cream: #faf8f4;
          --ink: #1a1510;
          --ink-2: #2d2820;
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

        .req-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .req-eyebrow {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          font-weight: 700;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .req-eyebrow::before {
          content: '';
          width: 18px;
          height: 1.5px;
          background: var(--accent);
        }
        .req-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(24px, 3vw, 40px);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .req-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .req-stat {
          background: white;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
          text-align: center;
        }
        .req-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .req-stat-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-top: 4px;
        }

        .req-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }
        .req-tab {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid var(--border);
          background: white;
          color: var(--muted);
        }
        .req-tab:hover {
          border-color: var(--accent);
          color: var(--ink);
        }
        .req-tab.active {
          background: var(--ink);
          color: var(--cream);
          border-color: var(--ink);
        }
        .req-tab-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          font-size: 10px;
          font-weight: 700;
          margin-left: 6px;
        }

        .req-grid {
          display: grid;
          gap: 12px;
        }
        .req-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 24px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 20px;
          align-items: center;
          transition: all 0.2s;
          animation: req-in 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .req-card:hover {
          box-shadow: 0 4px 20px rgba(26,21,16,0.08);
        }
        @keyframes req-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .req-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-dim);
          color: var(--accent);
        }
        .req-info h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .req-info p {
          font-size: 13px;
          color: var(--muted);
        }
        .req-date {
          font-size: 11px;
          color: var(--muted-2);
          margin-top: 4px;
        }

        .req-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .req-actions {
          display: flex;
          gap: 8px;
        }
        .req-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 8px;
          font-family: 'Mulish', sans-serif;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }
        .req-btn-accept {
          background: rgba(5,150,105,0.1);
          color: #059669;
          border: 1px solid rgba(5,150,105,0.3);
        }
        .req-btn-accept:hover {
          background: rgba(5,150,105,0.2);
        }
        .req-btn-decline {
          background: rgba(220,38,38,0.06);
          color: #dc2626;
          border: 1px solid rgba(220,38,38,0.2);
        }
        .req-btn-decline:hover {
          background: rgba(220,38,38,0.12);
        }
        .req-btn-view {
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid rgba(200,169,110,0.3);
        }
        .req-btn-view:hover {
          background: rgba(200,169,110,0.25);
        }

        .req-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 80px 40px;
          border: 1px dashed var(--muted-3);
          border-radius: 16px;
          color: var(--muted);
          text-align: center;
        }
        .req-empty h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink-2);
        }

        /* Modal */
        .req-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(26,21,16,0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: bdin 0.15s ease both;
        }
        @keyframes bdin { from { opacity: 0; } to { opacity: 1; } }
        .req-modal {
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          overflow: hidden;
          box-shadow: 0 32px 64px rgba(26,21,16,0.18);
          animation: mdin 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes mdin { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .req-modal-header {
          padding: 28px 32px 22px;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(180deg, var(--cream) 0%, white 100%);
        }
        .req-modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--ink);
        }
        .req-modal-body {
          padding: 28px 32px;
        }
        .req-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .req-detail-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .req-detail-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          text-align: right;
        }
        .req-modal-footer {
          padding: 20px 32px;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 10px;
        }
        .req-modal-btn {
          flex: 1;
          height: 44px;
          border-radius: 10px;
          font-family: 'Mulish', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
        }
      `}</style>

      <div className="req-root">
        <div className="req-header">
          <div>
            <div className="req-eyebrow">
              {isVendor ? "Partnerships" : "Vendor Management"}
            </div>
            <h1 className="req-title">
              {isVendor ? "Incoming Requests" : "Sent Requests"}
            </h1>
            <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 14 }}>
              {isVendor 
                ? "Organizations want to partner with your company" 
                : "Track the status of vendor partnership requests"}
            </p>
          </div>
        </div>

        <div className="req-stats">
          <div className="req-stat">
            <div className="req-stat-value" style={{ color: "#d97706" }}>{pendingCount}</div>
            <div className="req-stat-label">Pending</div>
          </div>
          <div className="req-stat">
            <div className="req-stat-value" style={{ color: "#059669" }}>{requests.filter((r: any) => r.status === "ACCEPTED").length}</div>
            <div className="req-stat-label">Accepted</div>
          </div>
          <div className="req-stat">
            <div className="req-stat-value" style={{ color: "#dc2626" }}>{requests.filter((r: any) => r.status === "DECLINED").length}</div>
            <div className="req-stat-label">Declined</div>
          </div>
        </div>

        <div className="req-tabs">
          {(["ALL", "PENDING", "ACCEPTED", "DECLINED"] as const).map((tab) => (
            <button
              key={tab}
              className={`req-tab ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              {tab === "PENDING" && pendingCount > 0 && <span className="req-tab-badge">{pendingCount}</span>}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 12 }}>Loading requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="req-empty">
            {isVendor ? (
              <>
                <Building2 size={40} style={{ opacity: 0.2 }} />
                <h3>No pending requests</h3>
                <p>Organization partnership requests will appear here</p>
              </>
            ) : (
              <>
                <Send size={40} style={{ opacity: 0.2 }} />
                <h3>No sent requests</h3>
                <p>Go to Vendors page to send partnership requests</p>
              </>
            )}
          </div>
        ) : (
          <div className="req-grid">
            {filtered.map((request: any, i: number) => {
              const meta = STATUS_META[request.status] || STATUS_META.PENDING;
              const displayName = isVendor ? request.organizationName : request.vendorCompanyName;
              const displayEmail = isVendor ? request.organizationEmail : request.vendorEmail;
              return (
                <div
                  key={request.id}
                  className="req-card"
                  style={{ animationDelay: `${i * 0.035}s` }}
                >
                  <div className="req-icon">
                    {isVendor ? <Building2 size={24} /> : <Users size={24} />}
                  </div>
                  <div className="req-info">
                    <h3>{displayName}</h3>
                    <p>{request.message || (isVendor ? "Would like to partner with your company" : "Partnership request sent")}</p>
                    <div className="req-date">
                      {request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <div className="req-status" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                      <meta.icon size={10} />
                      {meta.label}
                    </div>
                    <div className="req-actions">
                      <button className="req-btn req-btn-view" onClick={() => setSelectedRequest(request)}>
                        <Eye size={12} /> View
                      </button>
                      {isVendor && request.status === "PENDING" && (
                        <>
                          <button
                            className="req-btn req-btn-accept"
                            onClick={() => acceptMutation.mutate(request.id)}
                            disabled={acceptMutation.isPending}
                          >
                            <CheckCircle size={12} /> Accept
                          </button>
                          <button
                            className="req-btn req-btn-decline"
                            onClick={() => declineMutation.mutate(request.id)}
                            disabled={declineMutation.isPending}
                          >
                            <XCircle size={12} /> Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedRequest && (
          <div className="req-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSelectedRequest(null); }}>
            <div className="req-modal">
              <div className="req-modal-header">
                <div className="req-modal-title">Request Details</div>
              </div>
              <div className="req-modal-body">
                <div className="req-detail-row">
                  <span className="req-detail-label">{isVendor ? "Organization" : "Vendor"}</span>
                  <span className="req-detail-value">
                    {isVendor ? selectedRequest.organizationName : selectedRequest.vendorCompanyName}
                  </span>
                </div>
                <div className="req-detail-row">
                  <span className="req-detail-label">Email</span>
                  <span className="req-detail-value">
                    {isVendor ? selectedRequest.organizationEmail : selectedRequest.vendorEmail}
                  </span>
                </div>
                <div className="req-detail-row">
                  <span className="req-detail-label">Status</span>
                  <span className="req-detail-value" style={{ color: STATUS_META[selectedRequest.status]?.color }}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="req-detail-row">
                  <span className="req-detail-label">Message</span>
                  <span className="req-detail-value">{selectedRequest.message || "No message"}</span>
                </div>
                <div className="req-detail-row">
                  <span className="req-detail-label">Requested On</span>
                  <span className="req-detail-value">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
                {selectedRequest.respondedAt && (
                  <div className="req-detail-row">
                    <span className="req-detail-label">Responded On</span>
                    <span className="req-detail-value">
                      {new Date(selectedRequest.respondedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              {isVendor && selectedRequest.status === "PENDING" && (
                <div className="req-modal-footer">
                  <button
                    className="req-modal-btn"
                    style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}
                    onClick={() => { declineMutation.mutate(selectedRequest.id); setSelectedRequest(null); }}
                    disabled={declineMutation.isPending}
                  >
                    <XCircle size={14} /> Decline
                  </button>
                  <button
                    className="req-modal-btn"
                    style={{ background: "#059669", color: "white" }}
                    onClick={() => { acceptMutation.mutate(selectedRequest.id); setSelectedRequest(null); }}
                    disabled={acceptMutation.isPending}
                  >
                    <CheckCircle size={14} /> Accept Partnership
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
