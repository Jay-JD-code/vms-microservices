import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { paymentApi, orderApi } from "@/lib/api";
import { mockPayments, mockOrders } from "@/lib/mock-data";
import type { PaymentStatus } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const METHOD_META: Record<string, { icon: string; short: string }> = {
  BANK_TRANSFER: { icon: "🏦", short: "Bank" },
  CHECK:         { icon: "📝", short: "Check" },
  CREDIT_CARD:   { icon: "💳", short: "Card" },
  WIRE:          { icon: "⚡", short: "Wire" },
};

const STATUS_META: Record<string, { color: string; bg: string; border: string; label: string; icon: string }> = {
  PENDING:   { color: "#d97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.25)",  label: "Pending",   icon: "⏳" },
  COMPLETED: { color: "#059669", bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.25)",  label: "Completed", icon: "✓" },
  FAILED:    { color: "#dc2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.25)",  label: "Failed",    icon: "✕" },
};

function formatDate(raw: string): string {
  if (!raw) return "Unknown Date";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return raw;
  }
}

export default function Payments() {
  const { canProcessPayments, canRecordPayments, canViewAllData, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrderId, setNewOrderId]     = useState("");
  const [newAmount, setNewAmount]       = useState("");
  const [newMethod, setNewMethod]       = useState("BANK_TRANSFER");

  const { data: payments = mockPayments, isLoading } = useQuery({
    queryKey: canViewAllData ? ["payments"] : ["payments", "vendor", user?.id],
    queryFn: () => canViewAllData ? paymentApi.getAll() : paymentApi.getByVendor(user!.id),
    retry: 1,
  });

  const { data: orders = mockOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: orderApi.getAll,
    retry: 1,
    enabled: canProcessPayments,
  });

  const createMutation = useMutation({
    mutationFn: (data: { orderId: number; amount: number; method: string }) => paymentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment recorded");
      setShowCreateForm(false);
      setNewOrderId("");
      setNewAmount("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create payment"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => paymentApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Status updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update"),
  });

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderId || !newAmount) { toast.error("Fill all fields"); return; }
    createMutation.mutate({ orderId: Number(newOrderId), amount: Number(newAmount), method: newMethod });
  };

  const allPayments = payments as any[];
  const filtered = allPayments.filter((p) => {
    const matchSearch = p.vendorName?.toLowerCase().includes(search.toLowerCase()) || String(p.orderId).includes(search);
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending   = allPayments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalCompleted = allPayments.filter(p => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);
  const totalFailed    = allPayments.filter(p => p.status === "FAILED").reduce((s, p) => s + p.amount, 0);
  const grandTotal     = totalPending + totalCompleted + totalFailed || 1;

  // Group by formatted readable date
  const grouped: Record<string, any[]> = {};
  filtered.forEach(p => {
    const key = formatDate(p.createdAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  return (
    <AppLayout title="Payments" subtitle="Manage vendor payments and invoices">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .pay-root {
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
          background: var(--cream);
          min-height: 100vh;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
        }

        .meter-track {
          height: 5px;
          background: rgba(26,21,16,0.08);
          border-radius: 10px;
          overflow: hidden;
          margin-top: 8px;
        }
        .meter-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.8s cubic-bezier(0.16,1,0.3,1);
        }

        .pay-search {
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 9px 14px 9px 36px;
          font-size: 13px;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          width: 220px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pay-search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
        .pay-search::placeholder { color: var(--muted-2); }

        .record-btn {
          background: var(--ink);
          color: var(--cream);
          border: none;
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 13px;
          font-family: 'Mulish', sans-serif;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }
        .record-btn:hover { background: var(--ink-2); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(26,21,16,0.2); }

        .timeline-date {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0 14px;
        }
        .timeline-date::before {
          content: '';
          flex: none;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .timeline-date::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .pay-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 22px;
          margin-bottom: 10px;
          display: grid;
          grid-template-columns: 48px 1fr auto;
          gap: 16px;
          align-items: center;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .pay-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          border-radius: 14px 0 0 14px;
        }
        .pay-card.status-PENDING::before   { background: #d97706; }
        .pay-card.status-COMPLETED::before { background: #059669; }
        .pay-card.status-FAILED::before    { background: #dc2626; }
        .pay-card:hover { box-shadow: 0 4px 24px rgba(26,21,16,0.08); transform: translateY(-1px); }

        .method-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: var(--cream);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        /* Mulish for amounts — no more Playfair */
        .amount-display {
          font-family: 'Mulish', sans-serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
          color: var(--ink);
        }

       .currency-sign {
  font-size: 20px;
  font-weight: 700;
  color: var(--muted);
  vertical-align: baseline;
  margin-right: 1px;
  letter-spacing: 0;
}

.currency-sign-lg {
  font-size: 26px;
  font-weight: 700;
  color: var(--muted);
  vertical-align: baseline;
  margin-right: 1px;
  letter-spacing: 0;
}

        .status-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .act-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 7px;
          border: 1px solid;
          cursor: pointer;
          font-family: 'Mulish', sans-serif;
          letter-spacing: 0.03em;
          transition: all 0.15s;
        }
        .act-complete { background: rgba(5,150,105,0.08); color: #059669; border-color: rgba(5,150,105,0.3); }
        .act-complete:hover { background: rgba(5,150,105,0.18); }
        .act-fail { background: rgba(220,38,38,0.06); color: #dc2626; border-color: rgba(220,38,38,0.25); }
        .act-fail:hover { background: rgba(220,38,38,0.14); }

        .create-panel {
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          animation: expandIn 0.2s ease;
        }
        @keyframes expandIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }

        .form-input {
          width: 100%;
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 5px;
        }

        .submit-pay-btn {
          background: var(--ink);
          color: var(--cream);
          border: none;
          border-radius: 10px;
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Mulish', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.03em;
        }
        .submit-pay-btn:hover:not(:disabled) { background: var(--ink-2); box-shadow: 0 4px 16px rgba(26,21,16,0.2); }
        .submit-pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .cancel-pay-btn {
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Mulish', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cancel-pay-btn:hover { background: var(--cream); color: var(--ink); }

        .filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid var(--border);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          background: white;
          color: var(--muted);
          font-family: 'Mulish', sans-serif;
        }
        .filter-pill.active { background: var(--ink); color: var(--cream); border-color: var(--ink); }
        .filter-pill:not(.active):hover { border-color: var(--accent); color: var(--ink); }

        .empty-state { text-align: center; padding: 80px 20px; color: var(--muted); }

        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pay-card              { animation: fadeSlide 0.3s ease both; }
        .pay-card:nth-child(1) { animation-delay: 0.05s }
        .pay-card:nth-child(2) { animation-delay: 0.10s }
        .pay-card:nth-child(3) { animation-delay: 0.15s }
        .pay-card:nth-child(4) { animation-delay: 0.20s }
        .pay-card:nth-child(5) { animation-delay: 0.25s }
      `}</style>

      <div className="pay-root">

        {/* ── STAT METERS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
          {[
            { label: "Pending",   value: totalPending,   pct: (totalPending   / grandTotal) * 100, color: "#d97706" },
            { label: "Completed", value: totalCompleted, pct: (totalCompleted / grandTotal) * 100, color: "#059669" },
            { label: "Failed",    value: totalFailed,    pct: (totalFailed    / grandTotal) * 100, color: "#dc2626" },
          ].map(({ label, value, pct, color }) => (
            <div key={label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{label}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct)}%</span>
              </div>
              {/* Mulish font, rupee sign */}
              <p style={{ fontSize: "26px", fontWeight: 700, margin: "6px 0 0", letterSpacing: "-0.02em", color: "var(--ink)", fontFamily: "'Mulish', sans-serif" }}>
                <span className="currency-sign-lg">₹</span>
                {value.toLocaleString("en-IN")}
              </p>
              <div className="meter-track">
                <div className="meter-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)", fontSize: "13px" }}>⌕</span>
              <input
                placeholder="Vendor or order…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pay-search"
              />
            </div>
            {(["ALL", "PENDING", "COMPLETED", "FAILED"] as const).map(s => (
              <button key={s} className={`filter-pill ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
                {s === "ALL" ? "All" : STATUS_META[s]?.icon + " " + STATUS_META[s]?.label}
              </button>
            ))}
          </div>
          {canRecordPayments && (
            <button className="record-btn" onClick={() => setShowCreateForm(v => !v)}>
              <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span> Record Payment
            </button>
          )}
        </div>

        {/* ── CREATE FORM ── */}
        {showCreateForm && canRecordPayments && (
          <div className="create-panel">
            <p style={{ fontSize: "17px", fontWeight: 600, marginBottom: "16px", color: "var(--ink)", fontFamily: "'Playfair Display', serif" }}>
              New Payment Entry
            </p>
            <form onSubmit={handleCreatePayment}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label className="form-label">Order</label>
                  <select
                    value={newOrderId}
                    onChange={e => {
                      setNewOrderId(e.target.value);
                      const o = (orders as any[]).find(o => o.id === Number(e.target.value));
                      if (o) setNewAmount(String(o.totalAmount));
                    }}
                    className="form-input"
                    required
                  >
                    <option value="">Select order…</option>
                    {(orders as any[]).filter(o => o.status === "DELIVERED").map(o => (
                      <option key={o.id} value={o.id}>
                        PO-{o.id} — {o.vendorName} (₹{o.totalAmount})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="form-input"
                    min={0} step="0.01" placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Method</label>
                  <select value={newMethod} onChange={e => setNewMethod(e.target.value)} className="form-input">
                    {Object.entries(METHOD_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {k.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="submit-pay-btn" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Submitting…" : "Submit Payment"}
                </button>
                <button type="button" className="cancel-pay-btn" onClick={() => setShowCreateForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── LOADING ── */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>◌</div>
            <p style={{ fontSize: "14px" }}>Loading payments…</p>
          </div>
        )}

        {/* ── TIMELINE FEED ── */}
        {!isLoading && (
          <>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "42px", marginBottom: "14px" }}>💸</div>
                <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink-2)", fontFamily: "'Playfair Display', serif" }}>No payments found</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>Try adjusting your filters</p>
              </div>
            ) : (
              <>
                {Object.entries(grouped).map(([date, items]) => (
                  <div key={date}>
                    {/* Human readable date */}
                    <div className="timeline-date">
                      <span style={{
                        fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
                        textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap",
                      }}>
                        {date}
                      </span>
                    </div>

                    {items.map((payment: any) => {
                      const status = payment.status || "PENDING";
                      const sm     = STATUS_META[status] ?? STATUS_META.PENDING;
                      const mm     = METHOD_META[payment.method] ?? { icon: "💰", short: payment.method };
                      return (
                        <div key={payment.id} className={`pay-card status-${status}`}>

                          {/* Method icon */}
                          <div className="method-icon-wrap">{mm.icon}</div>

                          {/* Center info */}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                              {/* Rupee + Mulish amount */}
                              <span className="amount-display">
                                <span className="currency-sign">₹</span>
                                {payment.amount.toLocaleString("en-IN")}
                              </span>
                              <span className="status-tag" style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                                {sm.icon} {sm.label}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                                PAY-{payment.id} · PO-{payment.orderId}
                              </span>
                              {canViewAllData && payment.vendorName && (
                                <span style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600 }}>{payment.vendorName}</span>
                              )}
                              <span style={{ fontSize: "12px", color: "var(--muted-2)" }}>{mm.short} transfer</span>
                            </div>
                          </div>

                          {/* Right actions */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", flexShrink: 0 }}>
                            {canProcessPayments && status === "PENDING" && (
                              <>
                                <button
                                  className="act-btn act-complete"
                                  onClick={() => statusMutation.mutate({ id: payment.id, status: "COMPLETED" })}
                                  disabled={statusMutation.isPending}
                                >✓ Complete</button>
                                <button
                                  className="act-btn act-fail"
                                  onClick={() => statusMutation.mutate({ id: payment.id, status: "FAILED" })}
                                  disabled={statusMutation.isPending}
                                >✕ Fail</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                <div style={{ textAlign: "center", padding: "24px 0 4px", color: "var(--muted-2)", fontSize: "12px", fontWeight: 500 }}>
                  {filtered.length} payment{filtered.length !== 1 ? "s" : ""} shown
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}