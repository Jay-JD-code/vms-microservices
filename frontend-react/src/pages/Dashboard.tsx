import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { dashboardApi, orderApi, vendorApi, paymentApi, performanceApi } from "@/lib/api";
import { mockDashboardStats, mockOrders, mockVendors } from "@/lib/mock-data";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp, Users, ShoppingCart, CreditCard,
  Clock, DollarSign, BarChart2, ArrowUpRight, Activity,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function toArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

/* ── animated counter ── */
function AnimatedNumber({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef   = useRef<number>();
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof value !== "number" || isNaN(value)) return;
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(ease * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);
  return <>{display.toLocaleString("en-IN")}</>;
}

/* ── rupee display ── */
function Rupee({ value }: { value: number }) {
  return (
    <span style={{ fontFamily: "'Mulish', sans-serif", fontWeight: 700, fontSize: "inherit", letterSpacing: "-0.02em" }}>
      <span style={{ fontSize: "75%", fontWeight: 700, color: "var(--muted)", verticalAlign: "baseline", marginRight: 1 }}>₹</span>
      <AnimatedNumber value={value ?? 0} />
    </span>
  );
}

const STYLES = `
  .dash-root {
    font-family: 'Mulish', sans-serif;
    color: var(--ink);
  }

  .dash-loading {
    height: 2px; background: linear-gradient(90deg, var(--accent), rgba(200,169,110,0.3));
    margin-bottom: 28px; border-radius: 2px;
    animation: load-sweep 1.5s ease-in-out infinite; transform-origin: left;
  }
  @keyframes load-sweep { 0%{transform:scaleX(0);opacity:1} 60%{transform:scaleX(1);opacity:1} 100%{transform:scaleX(1);opacity:0} }

  /* ── stat grid ── */
  .stat-grid {
    display: grid; gap: 1px;
    background: var(--border); border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden; margin-bottom: 28px;
    box-shadow: 0 2px 12px rgba(26,21,16,0.05);
  }
  .stat-grid-6 { grid-template-columns: repeat(6,1fr); }
  .stat-grid-4 { grid-template-columns: repeat(4,1fr); }

  .stat-card {
    background: var(--white); padding: 24px 22px;
    position: relative; cursor: default;
    transition: background 0.2s; overflow: hidden;
  }
  .stat-card:hover { background: var(--cream); }
  .stat-card::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg, rgba(200,169,110,0.04) 0%, transparent 60%);
    opacity:0; transition:opacity 0.3s;
  }
  .stat-card:hover::after { opacity:1; }

  .sc-label {
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    font-weight: 700; color: var(--muted); margin-bottom: 18px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .sc-icon {
    width: 26px; height: 26px; border-radius: 7px;
    background: var(--cream-2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center; color: var(--muted);
  }
  .sc-value {
    font-family: 'Mulish', sans-serif;
    font-size: 30px; font-weight: 700; letter-spacing: -0.02em;
    line-height: 1; color: var(--ink); margin-bottom: 8px;
    font-variant-numeric: tabular-nums;
  }
  .sc-sub {
    font-size: 11px; color: var(--muted-2); font-weight: 500;
    display: flex; align-items: center; gap: 4px;
  }

  .sc-accent-bar {
    position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: var(--accent); transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .stat-card:hover .sc-accent-bar { transform: scaleX(1); }

  /* ── perf panel ── */
  .perf-panel {
    border: 1px solid var(--border); border-radius: 16px;
    background: var(--white); padding: 28px 32px; margin-bottom: 28px;
    position: relative; overflow: hidden;
    box-shadow: 0 2px 12px rgba(26,21,16,0.05);
  }
  .perf-panel::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, var(--accent), rgba(200,169,110,0.3), transparent);
  }
  .perf-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
  .perf-title {
    font-size: 11px; font-weight: 700; letter-spacing: 0.07em;
    text-transform: uppercase; color: var(--muted);
    display: flex; align-items: center; gap: 7px;
  }
  .perf-grid { display:grid; grid-template-columns:repeat(4,1fr); }
  .perf-metric {
    padding: 16px 0; text-align: center;
    border-right: 1px solid var(--border); position: relative;
  }
  .perf-metric:last-child { border-right: none; }
  .perf-score {
    font-family: 'Mulish', sans-serif;
    font-size: 44px; font-weight: 800; letter-spacing: -0.03em;
    line-height: 1; margin-bottom: 6px;
  }
  .perf-score.high { color: var(--green); }
  .perf-score.mid  { color: var(--amber); }
  .perf-score.low  { color: var(--red);   }
  .perf-label { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); }
  .perf-bar-wrap { margin:10px auto 0; height:3px; background:var(--cream-3); border-radius:2px; width:60%; overflow:hidden; }
  .perf-bar-fill { height:100%; border-radius:2px; transition:width 1.5s cubic-bezier(0.16,1,0.3,1); }

  /* ── two column layout ── */
  .dash-columns { display:grid; grid-template-columns:1fr 340px; gap:16px; }

  /* ── panel ── */
  .panel {
    border: 1px solid var(--border); border-radius: 16px;
    background: var(--white); overflow: hidden;
    box-shadow: 0 2px 12px rgba(26,21,16,0.05);
  }
  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--border);
  }
  .panel-title {
    font-size: 11px; font-weight: 700; letter-spacing: 0.07em;
    text-transform: uppercase; color: var(--ink);
    display: flex; align-items: center; gap: 8px;
  }
  .panel-count {
    font-size: 10px; padding: 2px 8px; border-radius: 100px;
    background: var(--cream-2); color: var(--muted); font-weight: 600;
  }
  .panel-link {
    font-size: 11px; font-weight: 700; color: var(--accent);
    text-decoration: none; display: flex; align-items: center; gap: 3px;
    letter-spacing: 0.04em; cursor: pointer; transition: color 0.15s;
  }
  .panel-link:hover { color: var(--ink); }

  /* ── data table ── */
  .dt { width:100%; border-collapse:collapse; }
  .dt thead tr { border-bottom:1px solid var(--border); }
  .dt th {
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); padding: 11px 24px; text-align:left; font-weight: 700;
  }
  .dt td {
    padding: 13px 24px; font-size: 13px; font-weight: 500;
    color: var(--ink); border-bottom: 1px solid var(--border-2); vertical-align: middle;
  }
  .dt tbody tr:last-child td { border-bottom: none; }
  .dt tbody tr { transition: background 0.15s; }
  .dt tbody tr:hover { background: var(--cream); }

  .dt-id     { font-size:11px; color:var(--accent); font-weight:700; }
  .dt-mono   { font-size:11px; color:var(--muted);  font-weight:500; }
  .dt-amount {
    font-family: 'Mulish', sans-serif;
    font-weight: 700; font-size: 14px; letter-spacing: -0.01em;
    display: inline-flex; align-items: baseline; gap: 2px;
  }
  .dt-rupee  { font-size: 12px; font-weight: 700; color: var(--muted); vertical-align: baseline; }
  .dt-empty  { text-align:center; color:var(--muted); padding:48px !important; font-size:12px; }

  /* ── status badges ── */
  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 100px;
    font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
  }
  .badge::before { content:''; display:inline-block; width:5px; height:5px; border-radius:50%; }
  .badge-CREATED::before   { background: var(--muted-2); }
  .badge-APPROVED::before  { background: var(--green); box-shadow: 0 0 4px var(--green); }
  .badge-PENDING::before   { background: var(--amber); }
  .badge-COMPLETED::before { background: var(--accent); }
  .badge-REJECTED::before  { background: var(--red); }
  .badge-ACTIVE::before    { background: var(--green); }
  .badge-INACTIVE::before  { background: var(--muted-2); }
  .badge-CREATED   { background:rgba(122,114,104,0.1); color:var(--muted);  border:1px solid rgba(122,114,104,0.2); }
  .badge-APPROVED  { background:var(--green-bg);       color:var(--green);  border:1px solid var(--green-border);  }
  .badge-PENDING   { background:var(--amber-bg);       color:var(--amber);  border:1px solid var(--amber-border);  }
  .badge-COMPLETED { background:rgba(200,169,110,0.12);color:var(--accent); border:1px solid var(--accent-border); }
  .badge-REJECTED  { background:var(--red-bg);         color:var(--red);    border:1px solid var(--red-border);    }
  .badge-ACTIVE    { background:var(--green-bg);       color:var(--green);  border:1px solid var(--green-border);  }
  .badge-INACTIVE  { background:rgba(122,114,104,0.1); color:var(--muted);  border:1px solid rgba(122,114,104,0.2);}

  /* ── vendor cards ── */
  .vendor-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px; border-bottom: 1px solid var(--border-2);
    transition: background 0.15s; cursor: default;
  }
  .vendor-card:last-child { border-bottom: none; }
  .vendor-card:hover { background: var(--cream); }

  .vendor-avatar {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), #e8c98e);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: var(--white);
    flex-shrink: 0; margin-right: 12px;
    font-family: 'Playfair Display', serif;
  }
  .vendor-info { flex: 1; min-width: 0; }
  .vendor-name {
    font-size: 13px; font-weight: 700; color: var(--ink);
    margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vendor-meta {
    font-size: 10px; color: var(--muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;
  }
  .no-pending {
    padding: 48px 24px; text-align: center;
    font-size: 12px; color: var(--muted); font-weight: 600; letter-spacing: 0.04em;
  }

  /* ── animations ── */
  @keyframes fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .anim   { animation: fade-up 0.45s cubic-bezier(0.16,1,0.3,1) both; }
  .anim-1 { animation-delay: 0.06s; }
  .anim-2 { animation-delay: 0.12s; }
  .anim-3 { animation-delay: 0.18s; }

  @media (max-width:1200px) {
    .stat-grid-6  { grid-template-columns: repeat(3,1fr); }
    .dash-columns { grid-template-columns: 1fr; }
  }
  @media (max-width:768px) {
    .stat-grid-6, .stat-grid-4 { grid-template-columns: repeat(2,1fr); }
    .perf-grid                  { grid-template-columns: repeat(2,1fr); }
  }
`;

function Badge({ status }: { status: string }) {
  return <span className={`badge badge-${status ?? "CREATED"}`}>{status ?? "—"}</span>;
}
function scoreClass(v: number) { return v >= 8 ? "high" : v >= 5 ? "mid" : "low"; }
function scoreColor(v: number) { return v >= 8 ? "var(--green)" : v >= 5 ? "var(--amber)" : "var(--red)"; }

/* ── inline rupee for table cells ── */
function TableAmount({ value }: { value: number }) {
  return (
    <span className="dt-amount">
      <span className="dt-rupee">₹</span>
      {(value ?? 0).toLocaleString("en-IN")}
    </span>
  );
}

export default function Dashboard() {
  const { canViewAllData, user } = useAuth();
  const navigate = useNavigate();
  const isVendor = !canViewAllData && user?.role === "VENDOR";

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard"], queryFn: dashboardApi.getStats, retry: 1, enabled: canViewAllData,
  });
  const { data: ordersData } = useQuery({
    queryKey: ["orders"], queryFn: orderApi.getAll, retry: 1, enabled: canViewAllData,
  });
  const { data: vendorsData } = useQuery({
    queryKey: ["vendors"], queryFn: vendorApi.getAll, retry: 1, enabled: canViewAllData,
  });
  const { data: vendorOrdersRaw, isLoading: vendorOrdersLoading } = useQuery({
    queryKey: ["orders", "vendor", user?.id], queryFn: () => orderApi.getByVendor(user!.id),
    retry: 1, enabled: isVendor && !!user?.id,
  });
  const { data: vendorPaymentsRaw, isLoading: vendorPaymentsLoading } = useQuery({
    queryKey: ["payments", "vendor", user?.id], queryFn: () => paymentApi.getByVendor(user!.id),
    retry: 1, enabled: isVendor && !!user?.id,
  });
  const { data: vendorPerformanceData, isLoading: vendorPerfLoading } = useQuery({
    queryKey: ["performance", "vendor", user?.id], queryFn: () => performanceApi.get(user!.id),
    retry: 1, enabled: isVendor && !!user?.id,
  });

  const isLoading = canViewAllData
    ? statsLoading
    : vendorOrdersLoading || vendorPaymentsLoading || vendorPerfLoading;

  const vendorOrders: any[]   = toArray(vendorOrdersRaw);
  const vendorPayments: any[] = toArray(vendorPaymentsRaw);
  const vendorPerf            = vendorPerformanceData ?? null;

  const vendorStats = {
    totalOrders:     vendorOrders.length,
    pendingOrders:   vendorOrders.filter(o => o.status === "CREATED" || o.status === "APPROVED").length,
    completedOrders: vendorOrders.filter(o => o.status === "COMPLETED").length,
    pendingPayments: vendorPayments.filter(p => p.status === "PENDING").length,
    totalPaid:       vendorPayments
      .filter(p => p.status === "COMPLETED")
      .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0),
  };

  const orders         = toArray(ordersData).length ? toArray(ordersData) : mockOrders;
  const vendors        = toArray(vendorsData).length ? toArray(vendorsData) : mockVendors;
  const recentOrders   = orders.slice(0, 5);
  const pendingVendors = vendors.filter((v: any) => v.status === "PENDING");

  const dashStats = statsData
    ? (() => {
        const vsm = Object.fromEntries((statsData.vendorStatus  || []).map((v: any) => [v.status, v.value]));
        const psm = Object.fromEntries((statsData.paymentStatus || []).map((p: any) => [p.status, p.value]));
        return {
          totalVendors:        statsData.stats?.vendors  ?? 0,
          activeVendors:       vsm["APPROVED"]           ?? 0,
          pendingApprovals:    vsm["PENDING"]            ?? 0,
          totalOrders:         statsData.stats?.orders   ?? 0,
          pendingPayments:     psm["PENDING"]            ?? 0,
          totalPaymentsAmount: Number(statsData.stats?.payments) || 0,
        };
      })()
    : mockDashboardStats;

  useEffect(() => {
    const id = "dash-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  /* ── VENDOR VIEW ── */
  if (isVendor) {
    return (
      <AppLayout title="My Dashboard" subtitle="Orders, payments & performance">
        <div className="dash-root">
          {isLoading && <div className="dash-loading" />}

          <div className="stat-grid stat-grid-4 anim anim-1">
            {[
              { label: "Total Orders",     value: vendorStats.totalOrders,     icon: ShoppingCart, sub: `${vendorStats.pendingOrders} in progress` },
              { label: "Completed",        value: vendorStats.completedOrders, icon: TrendingUp,   sub: "Fulfilled orders" },
              { label: "Pending Payments", value: vendorStats.pendingPayments, icon: CreditCard,   sub: "Awaiting clearance" },
              { label: "Total Received",   value: null,                        icon: DollarSign,   sub: "Completed payments", money: vendorStats.totalPaid },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="sc-label">
                  {s.label}
                  <div className="sc-icon"><s.icon size={12} /></div>
                </div>
                <div className="sc-value">
                  {s.money !== undefined
                    ? <Rupee value={s.money} />
                    : <AnimatedNumber value={s.value ?? 0} />
                  }
                </div>
                <div className="sc-sub"><Activity size={10} />{s.sub}</div>
                <div className="sc-accent-bar" />
              </div>
            ))}
          </div>

          {vendorPerf && (
            <div className="perf-panel anim anim-2">
              <div className="perf-header">
                <div className="perf-title"><BarChart2 size={14} />Performance Score</div>
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Updated today</span>
              </div>
              <div className="perf-grid">
                {[
                  { label: "Overall",    value: vendorPerf.overallScore    },
                  { label: "Delivery",   value: vendorPerf.deliveryScore   },
                  { label: "Quality",    value: vendorPerf.qualityScore    },
                  { label: "Compliance", value: vendorPerf.complianceScore },
                ].map(m => (
                  <div className="perf-metric" key={m.label}>
                    <div className={`perf-score ${scoreClass(m.value ?? 0)}`}>
                      {(m.value ?? 0).toFixed(1)}
                    </div>
                    <div className="perf-label">{m.label}</div>
                    <div className="perf-bar-wrap">
                      <div
                        className="perf-bar-fill"
                        style={{
                          width: `${((m.value ?? 0) / 10) * 100}%`,
                          background: scoreColor(m.value ?? 0),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel anim anim-3">
            <div className="panel-header">
              <div className="panel-title">
                <ShoppingCart size={13} />Recent Orders
                <span className="panel-count">{vendorOrders.length}</span>
              </div>
              <span className="panel-link" onClick={() => navigate("/orders")}>
                View all <ArrowUpRight size={11} />
              </span>
            </div>
            <table className="dt">
              <thead>
                <tr><th>Order #</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {vendorOrders.slice(0, 5).map((order: any) => (
                  <tr key={order.id}>
                    <td><span className="dt-id">PO-{order.id}</span></td>
                    <td className="dt-mono">{toArray(order.items).length}</td>
                    <td><TableAmount value={order.totalAmount} /></td>
                    <td><Badge status={order.status} /></td>
                    <td className="dt-mono">{order.createdAt}</td>
                  </tr>
                ))}
                {vendorOrders.length === 0 && !isLoading && (
                  <tr><td colSpan={5} className="dt-empty">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ── ADMIN VIEW ── */
  const globalStats = [
    { label: "Total Vendors",     value: dashStats.totalVendors,        icon: Users,        sub: `${dashStats.activeVendors} active` },
    { label: "Active Vendors",    value: dashStats.activeVendors,       icon: TrendingUp,   sub: `${Math.round((dashStats.activeVendors / (dashStats.totalVendors || 1)) * 100)}% of total` },
    { label: "Pending Approvals", value: dashStats.pendingApprovals,    icon: Clock,        sub: "Requires action", warn: true },
    { label: "Total Orders",      value: dashStats.totalOrders,         icon: ShoppingCart, sub: "All time" },
    { label: "Pending Payments",  value: dashStats.pendingPayments,     icon: CreditCard,   sub: "Awaiting clearance", warn: dashStats.pendingPayments > 0 },
    { label: "Total Paid",        value: null,                          icon: DollarSign,   sub: "This period", money: dashStats.totalPaymentsAmount },
  ];

  return (
    <AppLayout title="Dashboard" subtitle="Overview of vendor management activities">
      <div className="dash-root">
        {statsLoading && <div className="dash-loading" />}

        <div className="stat-grid stat-grid-6 anim anim-1">
          {globalStats.map(stat => (
            <div
              className="stat-card"
              key={stat.label}
              style={stat.warn ? { borderTop: "2px solid var(--amber)" } : {}}
            >
              <div className="sc-label">
                {stat.label}
                <div className="sc-icon"><stat.icon size={12} /></div>
              </div>
              <div className="sc-value" style={stat.warn ? { color: "var(--amber)" } : {}}>
                {stat.money !== undefined
                  ? <Rupee value={stat.money} />
                  : <AnimatedNumber value={stat.value ?? 0} />
                }
              </div>
              <div className="sc-sub">
                <Activity size={10} style={{ opacity: 0.5 }} />
                {stat.sub}
              </div>
              <div
                className="sc-accent-bar"
                style={stat.warn ? { background: "var(--amber)" } : {}}
              />
            </div>
          ))}
        </div>

        <div className="dash-columns">
          {/* Recent Purchase Orders */}
          <div className="panel anim anim-2">
            <div className="panel-header">
              <div className="panel-title">
                <ShoppingCart size={13} />Recent Purchase Orders
                <span className="panel-count">{recentOrders.length}</span>
              </div>
              <span className="panel-link" onClick={() => navigate("/orders")}>
                View all <ArrowUpRight size={11} />
              </span>
            </div>
            <table className="dt">
              <thead>
                <tr><th>Order #</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td><span className="dt-id">PO-{order.id}</span></td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{order.vendorName}</td>
                    <td><TableAmount value={order.totalAmount} /></td>
                    <td><Badge status={order.status} /></td>
                    <td className="dt-mono">{order.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pending Approvals */}
          <div className="panel anim anim-3">
            <div className="panel-header">
              <div className="panel-title">
                <Clock size={13} />Pending Approvals
                {pendingVendors.length > 0 && (
                  <span className="panel-count" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
                    {pendingVendors.length}
                  </span>
                )}
              </div>
              <span className="panel-link" onClick={() => navigate("/vendors")}>
                Manage <ArrowUpRight size={11} />
              </span>
            </div>
            {pendingVendors.length === 0
              ? <div className="no-pending">✓ All caught up</div>
              : pendingVendors.map((vendor: any) => (
                  <div className="vendor-card" key={vendor.id}>
                    <div className="vendor-avatar">
                      {(vendor.companyName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="vendor-info">
                      <div className="vendor-name">{vendor.companyName}</div>
                      <div className="vendor-meta">{vendor.contactPerson} · {vendor.email}</div>
                    </div>
                    <Badge status={vendor.status} />
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </AppLayout>
  );
}