import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { invoiceApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Send, CheckCircle, XCircle, Loader2, Download, Eye } from "lucide-react";
import { toast } from "sonner";

const STATUS_META: Record<string, { color: string; bg: string; border: string; label: string; icon: any }> = {
  DRAFT:    { color: "#7a7268", bg: "rgba(122,114,104,0.1)",   border: "rgba(122,114,104,0.2)", label: "Draft",   icon: FileText },
  ISSUED:   { color: "#2563eb", bg: "rgba(37,99,235,0.08)",   border: "rgba(37,99,235,0.2)",   label: "Issued",  icon: FileText },
  SENT:     { color: "#d97706", bg: "rgba(217,119,6,0.1)",    border: "rgba(217,119,6,0.25)",  label: "Sent",    icon: Send },
  PAID:     { color: "#059669", bg: "rgba(5,150,105,0.08)",   border: "rgba(5,150,105,0.25)",  label: "Paid",    icon: CheckCircle },
  OVERDUE:  { color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)",   label: "Overdue", icon: XCircle },
  CANCELLED:{ color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)",   label: "Cancelled", icon: XCircle },
};

export default function Invoices() {
  const { canViewAllData, user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const { data: invoicesData, isLoading, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceApi.getAll(),
    retry: 1,
  });

  console.log("Invoices data:", invoicesData, "Error:", error);

  const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.content || []);

  const filtered = invoices.filter((inv: any) => {
    const matchSearch = 
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.organizationName?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalIssued = invoices.filter((i: any) => ["ISSUED", "SENT"].includes(i.status)).reduce((s: number, i: any) => s + i.total, 0);
  const totalPaid = invoices.filter((i: any) => i.status === "PAID").reduce((s: number, i: any) => s + i.total, 0);

  return (
    <AppLayout title="Invoices" subtitle="Manage and track all invoices">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .inv-root {
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

        .inv-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .inv-eyebrow {
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
        .inv-eyebrow::before {
          content: '';
          width: 18px;
          height: 1.5px;
          background: var(--accent);
        }
        .inv-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(24px, 3vw, 40px);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .stat-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 24px;
        }
        .stat-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--ink);
        }

        .inv-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .inv-search-wrap {
          position: relative;
        }
        .inv-search-wrap svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted-2);
          pointer-events: none;
        }
        .inv-search {
          height: 40px;
          padding: 0 14px 0 38px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--ink);
          font-family: 'Mulish', sans-serif;
          font-size: 13px;
          font-weight: 500;
          width: 260px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .inv-search:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .inv-search::placeholder {
          color: var(--muted-2);
        }

        .inv-count {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          padding: 4px 12px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 100px;
        }

        .inv-grid {
          display: grid;
          gap: 12px;
        }
        .inv-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: center;
          transition: all 0.2s;
          animation: inv-in 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .inv-card:hover {
          box-shadow: 0 4px 20px rgba(26,21,16,0.08);
          transform: translateY(-1px);
        }
        @keyframes inv-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .inv-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .inv-number {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: -0.01em;
        }
        .inv-party {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
        }
        .inv-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--muted);
        }
        .inv-status {
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
        .inv-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        .inv-amount {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--ink);
        }
        .inv-date {
          font-size: 11px;
          color: var(--muted-2);
        }
        .inv-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          font-family: 'Mulish', sans-serif;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }
        .inv-btn-view {
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid rgba(200,169,110,0.3);
        }
        .inv-btn-view:hover {
          background: rgba(200,169,110,0.25);
        }

        .inv-empty {
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
        .inv-empty h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink-2);
        }
        .inv-empty p {
          font-size: 13px;
          font-weight: 500;
        }

        /* Modal */
        .inv-modal-backdrop {
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
        .inv-modal {
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          max-height: 88vh;
          overflow-y: auto;
          box-shadow: 0 32px 64px rgba(26,21,16,0.18);
          animation: mdin 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes mdin { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .inv-modal-header {
          padding: 28px 32px 22px;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(180deg, var(--cream) 0%, white 100%);
        }
        .inv-modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--ink);
        }
        .inv-modal-sub {
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
        }
        .inv-modal-close {
          position: absolute;
          right: 24px;
          top: 24px;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: var(--cream);
          border: 1px solid var(--border);
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .inv-modal-close:hover {
          color: var(--ink);
          background: white;
        }
        .inv-modal-body {
          padding: 28px 32px;
        }
        .inv-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }
        .inv-detail-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .inv-detail-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
        }
        .inv-items-table {
          width: 100%;
          margin-top: 16px;
        }
        .inv-items-table th {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          text-align: left;
        }
        .inv-items-table td {
          padding: 10px 0;
          font-size: 13px;
          color: var(--ink);
          border-bottom: 1px solid var(--border);
        }
        .inv-total-row {
          display: flex;
          justify-content: space-between;
          padding: 16px 0 0;
          margin-top: 8px;
        }
        .inv-total-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
        }
        .inv-total-value {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--accent);
        }
      `}</style>

      <div className="inv-root">
        <div className="inv-header">
          <div>
            <div className="inv-eyebrow">Finance</div>
            <h1 className="inv-title">Invoices</h1>
          </div>
        </div>

        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-label">Total Invoices</div>
            <div className="stat-value">{invoices.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Issued / Pending</div>
            <div className="stat-value">₹{totalIssued.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Paid</div>
            <div className="stat-value" style={{ color: "#059669" }}>₹{totalPaid.toLocaleString()}</div>
          </div>
        </div>

        <div className="inv-toolbar">
          <div className="inv-search-wrap">
            <FileText size={14} />
            <input
              className="inv-search"
              placeholder="Search invoices or parties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="inv-count">{filtered.length} invoices</span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 12 }}>Loading invoices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="inv-empty">
            <FileText size={40} style={{ opacity: 0.2 }} />
            <h3>No invoices found</h3>
            <p>Invoices will appear here when orders are delivered</p>
          </div>
        ) : (
          <div className="inv-grid">
            {filtered.map((invoice: any, i: number) => {
              const meta = STATUS_META[invoice.status] || STATUS_META.DRAFT;
              return (
                <div
                  key={invoice.id}
                  className="inv-card"
                  style={{ animationDelay: `${i * 0.035}s` }}
                >
                  <div className="inv-info">
                    <div className="inv-number">{invoice.invoiceNumber}</div>
                    <div className="inv-party">{invoice.vendorName || invoice.organizationName}</div>
                    <div className="inv-meta">
                      <span>PO-{invoice.orderId}</span>
                      <span>•</span>
                      <span>{invoice.items?.length || 0} items</span>
                    </div>
                  </div>
                  <div className="inv-right">
                    <div className="inv-status" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </div>
                    <div className="inv-amount">₹{invoice.total?.toLocaleString()}</div>
                    <div className="inv-date">{invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</div>
                    <button className="inv-btn inv-btn-view" onClick={() => setSelectedInvoice(invoice)}>
                      <Eye size={12} /> View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedInvoice && (
          <div className="inv-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSelectedInvoice(null); }}>
            <div className="inv-modal" style={{ position: "relative" }}>
              <button className="inv-modal-close" onClick={() => setSelectedInvoice(null)}>✕</button>
              <div className="inv-modal-header">
                <div className="inv-modal-title">Invoice {selectedInvoice.invoiceNumber}</div>
                <div className="inv-modal-sub">Generated for Order #{selectedInvoice.orderId}</div>
              </div>
              <div className="inv-modal-body">
                <div className="inv-detail-row">
                  <span className="inv-detail-label">Status</span>
                  <span className="inv-detail-value" style={{ color: STATUS_META[selectedInvoice.status]?.color }}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="inv-detail-row">
                  <span className="inv-detail-label">Issued Date</span>
                  <span className="inv-detail-value">{selectedInvoice.issuedAt ? new Date(selectedInvoice.issuedAt).toLocaleDateString() : "—"}</span>
                </div>
                <div className="inv-detail-row">
                  <span className="inv-detail-label">Due Date</span>
                  <span className="inv-detail-value">{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : "—"}</span>
                </div>
                <div className="inv-detail-row">
                  <span className="inv-detail-label">Vendor</span>
                  <span className="inv-detail-value">{selectedInvoice.vendorName}</span>
                </div>
                <div className="inv-detail-row">
                  <span className="inv-detail-label">Organization</span>
                  <span className="inv-detail-value">{selectedInvoice.organizationName}</span>
                </div>

                <table className="inv-items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Price</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td>{item.description}</td>
                        <td style={{ textAlign: "right" }}>{item.quantity}</td>
                        <td style={{ textAlign: "right" }}>₹{item.unitPrice?.toLocaleString()}</td>
                        <td style={{ textAlign: "right" }}>₹{item.total?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="inv-total-row">
                  <span className="inv-total-label">Total Amount</span>
                  <span className="inv-total-value">₹{selectedInvoice.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
