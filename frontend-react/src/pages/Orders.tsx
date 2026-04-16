import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { orderApi, vendorApi, vendorItemApi } from "@/lib/api";
import type { OrderStatus, VendorItem } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Search, Loader2, X, Package, ShoppingCart,
  ChevronDown, Minus, ArrowRight, Truck, CheckCircle2,
  Clock, XCircle, Filter, FileText, Building2,
} from "lucide-react";

const ORDER_TRANSITIONS: Record<string, string[]> = {
  CREATED:   ["APPROVED", "CANCELLED"],
  APPROVED:  ["SHIPPED",  "CANCELLED"],
  SHIPPED:   ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
};

const PIPELINE = ["CREATED", "APPROVED", "SHIPPED", "DELIVERED", "COMPLETED"] as const;

const STATUS_META: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  CREATED:   { color:"#7a7268", bg:"rgba(122,114,104,0.1)",  border:"rgba(122,114,104,0.2)", icon:Clock,        label:"Created"   },
  APPROVED:  { color:"#059669", bg:"rgba(5,150,105,0.1)",    border:"rgba(5,150,105,0.25)",  icon:CheckCircle2, label:"Approved"  },
  SHIPPED:   { color:"#2563eb", bg:"rgba(37,99,235,0.08)",   border:"rgba(37,99,235,0.2)",   icon:Truck,        label:"Shipped"   },
  DELIVERED: { color:"#d97706", bg:"rgba(217,119,6,0.1)",    border:"rgba(217,119,6,0.25)",  icon:Package,      label:"Delivered" },
  COMPLETED: { color:"#c8a96e", bg:"rgba(200,169,110,0.12)", border:"rgba(200,169,110,0.3)", icon:CheckCircle2, label:"Completed" },
  CANCELLED: { color:"#dc2626", bg:"rgba(220,38,38,0.08)",   border:"rgba(220,38,38,0.2)",   icon:XCircle,      label:"Cancelled" },
};

const STYLES = `
  .ord-root { font-family:'Mulish',sans-serif; color:var(--ink); }

  /* header */
  .ord-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:40px; }
  .ord-eyebrow {
    font-size:9px; letter-spacing:0.18em; text-transform:uppercase;
    color:var(--accent); font-weight:700; margin-bottom:5px;
    display:flex; align-items:center; gap:8px;
  }
  .ord-eyebrow::before { content:''; width:18px; height:1.5px; background:var(--accent); }
  .ord-title { font-family:'Playfair Display',serif; font-size:clamp(24px,3vw,40px); font-weight:700; letter-spacing:-0.02em; line-height:1; }

  /* toolbar */
  .ord-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
  .ord-search-wrap { position:relative; }
  .ord-search-wrap svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted-2); pointer-events:none; }
  .ord-search {
    height:38px; padding:0 14px 0 36px;
    background:var(--white); border:1px solid var(--border);
    border-radius:10px; color:var(--ink);
    font-family:'Mulish',sans-serif; font-size:12px;
    width:220px; outline:none; transition:border-color 0.2s, box-shadow 0.2s;
    font-weight:500;
  }
  .ord-search::placeholder { color:var(--muted-2); }
  .ord-search:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }

  .ord-filter-wrap { position:relative; }
  .ord-filter-wrap .fi  { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted-2); pointer-events:none; }
  .ord-filter-wrap .chev { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--muted-2); pointer-events:none; }
  .ord-filter {
    height:38px; padding:0 32px 0 34px;
    background:var(--white); border:1px solid var(--border);
    border-radius:10px; color:var(--ink);
    font-family:'Mulish',sans-serif; font-size:12px; font-weight:600;
    appearance:none; outline:none; cursor:pointer; transition:border-color 0.2s;
  }
  .ord-filter:focus { border-color:var(--accent); }

  .ord-count {
    font-size:11px; font-weight:600; color:var(--muted);
    padding:4px 12px; background:var(--white); border:1px solid var(--border); border-radius:100px;
  }

  .btn-create {
    display:inline-flex; align-items:center; gap:8px;
    padding:0 20px; height:38px; border-radius:10px;
    background:var(--ink); color:var(--cream);
    font-family:'Mulish',sans-serif; font-size:12px; font-weight:700;
    letter-spacing:0.02em; border:none; cursor:pointer; white-space:nowrap;
    transition:all 0.2s;
  }
  .btn-create:hover { background:var(--ink-2); transform:translateY(-1px); box-shadow:0 6px 20px rgba(26,21,16,0.2); }

  /* ─── ORDER CARD ─────────────────────────────────────── */
  .ord-list { display:flex; flex-direction:column; gap:10px; }

  .ord-card {
    background:var(--white); border:1px solid var(--border);
    border-radius:14px; overflow:hidden;
    transition:border-color 0.2s, box-shadow 0.2s;
    animation: ord-in 0.4s cubic-bezier(0.16,1,0.3,1) both;
    box-shadow: 0 1px 6px rgba(26,21,16,0.04);
  }
  .ord-card:hover { box-shadow:0 4px 20px rgba(26,21,16,0.08); }
  .ord-card.cancelled { opacity:0.6; }
  .ord-card.cancelled:hover { opacity:0.8; }
  @keyframes ord-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  /*
   * Card body: 4 columns.
   *   1. ID strip   — fixed 108px
   *   2. Info       — flexible, takes remaining space
   *   3. Pipeline   — fixed 380px, never shrinks
   *   4. Actions    — fixed 160px, never shrinks
   * All cells stretch to match the tallest column (align-items:stretch).
   */
  .ord-card-body {
    display:grid;
    grid-template-columns: 108px 1fr 380px 160px;
    align-items:stretch;
    min-height:88px;
  }

  /* id strip */
  .ord-id-strip {
    display:flex; flex-direction:column; justify-content:center;
    padding:18px 16px; border-right:1px solid var(--border);
    background:var(--cream-2); flex-shrink:0;
  }
  .ord-po     { font-size:9px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted); margin-bottom:3px; }
  .ord-id-num { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; letter-spacing:-0.03em; line-height:1; color:var(--accent); }
  .ord-date   { font-size:9px; font-weight:600; color:var(--muted-2); margin-top:5px; letter-spacing:0.04em; }

  /* info */
  .ord-info { padding:18px 20px; display:flex; flex-direction:column; justify-content:center; gap:6px; }
  .ord-vendor { font-size:14px; font-weight:700; color:var(--ink); font-family:'Playfair Display',serif; }
  .ord-meta { display:flex; align-items:center; gap:10px; }
  .ord-meta-chip { font-size:10px; font-weight:600; color:var(--muted); display:flex; align-items:center; gap:4px; }

  /* ─── PIPELINE ───────────────────────────────────────── */
  /*
   * The pipeline column uses flex with a fixed bottom-padding zone for labels.
   * Labels are absolutely positioned INSIDE a per-step relative container that
   * has enough height to show them without clipping or overlapping the card below.
   */
  .ord-pipeline {
    display:flex;
    align-items:center;           /* vertically center the node row */
    padding:0 24px;
    border-right:1px solid var(--border);
    border-left:1px solid var(--border);
    /* Reserve 32px at the bottom for labels so they never clip */
    padding-bottom:32px;
    padding-top:18px;
    position:relative;
  }

  .pip-step {
    display:flex;
    align-items:center;
    position:relative;
    /* Each step needs enough width to center its label under its node */
    flex-shrink:0;
  }

  .pip-node {
    width:26px; height:26px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    border:1.5px solid var(--border); background:var(--cream-2);
    transition:all 0.3s; flex-shrink:0; position:relative; z-index:1;
  }
  .pip-node.done {
    background:var(--node-bg); border-color:var(--node-color);
    box-shadow:0 0 0 3px var(--node-bg);
  }
  .pip-node.active {
    background:var(--node-bg); border-color:var(--node-color);
    box-shadow:0 0 0 4px var(--node-bg);
    animation:pip-pulse 2.5s infinite;
  }
  @keyframes pip-pulse {
    0%,100%{ box-shadow:0 0 0 4px var(--node-bg) }
    50%    { box-shadow:0 0 0 8px var(--node-bg) }
  }

  .pip-connector { width:22px; height:1.5px; background:var(--border); flex-shrink:0; }
  .pip-connector.done { background:var(--node-color); }

  /* Label sits BELOW the node, centered, absolutely positioned */
  .pip-label-wrap {
    position:absolute;
    top:calc(100% + 6px);   /* 6px gap below the node */
    left:50%;
    transform:translateX(-50%);
    text-align:center;
    white-space:nowrap;
    pointer-events:none;
  }
  .pip-label {
    font-family:'Mulish',sans-serif;
    font-size:8px; font-weight:700; letter-spacing:0.07em;
    text-transform:uppercase; color:var(--muted-2);
  }
  .pip-label.active { font-weight:800; }

  /* Cancelled pill — centered inside the pipeline column */
  .pip-cancelled {
    display:flex; align-items:center; gap:7px;
    padding:6px 14px; border-radius:100px;
    background:var(--red-bg); border:1px solid var(--red-border);
    margin:auto;
  }

  /* ─── ACTIONS ────────────────────────────────────────── */
  /*
   * Actions column: fixed width, flex column so amount sits at top
   * and buttons sit at the bottom. This prevents height fighting with
   * the pipeline column regardless of how many transition buttons exist.
   */
  .ord-actions {
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    justify-content:space-between;   /* amount top, buttons bottom */
    padding:16px 18px;
    gap:8px;
    min-width:0;
  }
  .ord-amount {
    font-family:'Playfair Display',serif; font-size:19px; font-weight:700;
    letter-spacing:-0.03em; color:var(--ink); font-variant-numeric:tabular-nums;
    white-space:nowrap;
  }
  .ord-amount span { font-size:12px; color:var(--muted); margin-right:1px; }

  .ord-btns {
    display:flex; gap:5px; flex-wrap:wrap; justify-content:flex-end;
    /* Constrain to column width so buttons never push into pipeline */
    width:100%;
  }
  .ord-btn {
    flex:1 1 auto;                  /* each button fills available width evenly */
    min-width:0;
    height:28px; padding:0 10px; border-radius:7px;
    border:1px solid var(--border); background:var(--cream);
    color:var(--ink-3); font-family:'Mulish',sans-serif; font-size:9px;
    font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
    cursor:pointer; transition:all 0.15s;
    display:flex; align-items:center; justify-content:center; gap:4px;
    white-space:nowrap;
  }
  .ord-btn:hover         { border-color:var(--accent); color:var(--accent); background:var(--accent-dim); }
  .ord-btn.cancel:hover  { border-color:var(--red);    color:var(--red);    background:var(--red-bg); }
  .ord-btn:disabled      { opacity:0.4; cursor:not-allowed; }

  /* empty */
  .ord-empty {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:14px; padding:80px 40px; border:1px dashed var(--muted-3); border-radius:16px;
    color:var(--muted); text-align:center;
  }
  .ord-empty h3 { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--ink-2); }
  .ord-empty p  { font-size:12px; font-weight:500; }
  .ord-footer   { margin-top:18px; font-size:11px; font-weight:600; color:var(--muted-2); letter-spacing:0.04em; }

  /* ─── MODAL ──────────────────────────────────────────── */
  .modal-backdrop {
    position:fixed; inset:0; z-index:50; background:rgba(26,21,16,0.45);
    backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center;
    padding:24px; animation:bdin 0.15s ease both;
  }
  @keyframes bdin { from{opacity:0} to{opacity:1} }
  .modal {
    background:var(--white); border:1px solid var(--border);
    border-radius:20px; width:100%; max-width:580px; max-height:88vh;
    display:flex; flex-direction:column; overflow:hidden;
    box-shadow:0 32px 64px rgba(26,21,16,0.18);
    animation:mdin 0.3s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes mdin { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:none} }

  .modal-top {
    padding:28px 32px 22px; border-bottom:1px solid var(--border);
    display:flex; align-items:flex-start; justify-content:space-between; flex-shrink:0;
    background:linear-gradient(180deg, var(--cream-2) 0%, var(--white) 100%);
  }
  .modal-eyebrow { font-size:9px; letter-spacing:0.18em; text-transform:uppercase; color:var(--accent); font-weight:700; margin-bottom:5px; }
  .modal-title   { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; letter-spacing:-0.01em; color:var(--ink); }
  .modal-sub     { font-size:12px; color:var(--muted); margin-top:4px; font-weight:500; }
  .modal-close {
    width:32px; height:32px; border-radius:9px;
    background:var(--cream-3); border:1px solid var(--border);
    color:var(--muted); cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:all 0.15s;
  }
  .modal-close:hover { color:var(--ink); background:var(--cream-2); }

  .modal-body { flex:1; overflow-y:auto; padding:28px 32px; }
  .modal-body::-webkit-scrollbar       { width:4px; }
  .modal-body::-webkit-scrollbar-track { background:transparent; }
  .modal-body::-webkit-scrollbar-thumb { background:var(--muted-3); border-radius:4px; }

  .field        { margin-bottom:22px; }
  .field-label  { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; display:block; }
  .field-req    { color:var(--red); }
  .select-wrap  { position:relative; }
  .select-wrap .chev { position:absolute; right:14px; top:50%; transform:translateY(-50%); color:var(--muted-2); pointer-events:none; }
  .sel {
    width:100%; height:44px; padding:0 40px 0 16px;
    background:var(--cream); border:1px solid var(--border);
    border-radius:12px; color:var(--ink);
    font-family:'Mulish',sans-serif; font-size:13px; font-weight:600;
    appearance:none; outline:none; cursor:pointer; transition:border-color 0.2s, box-shadow 0.2s;
  }
  .sel:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
  .sel option { background:var(--white); }

  .catalog-section-title { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); }
  .catalog-header        { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .catalog-fetching      { font-size:11px; font-weight:600; color:var(--muted); display:flex; align-items:center; gap:6px; }
  .catalog-grid          { display:flex; flex-direction:column; gap:6px; }

  .cat-row {
    display:grid; grid-template-columns:1fr 88px 128px;
    border:1px solid var(--border); border-radius:12px; background:var(--cream); overflow:hidden; transition:all 0.15s;
  }
  .cat-row.selected  { border-color:var(--accent); background:var(--accent-dim); }
  .cat-info          { padding:13px 15px; }
  .cat-name          { font-size:13px; font-weight:700; color:var(--ink); }
  .cat-desc          { font-size:11px; color:var(--muted); margin-top:2px; font-weight:500; }
  .cat-unit          { font-size:9px; font-weight:700; color:var(--muted-2); margin-top:3px; text-transform:uppercase; letter-spacing:0.06em; }
  .cat-price         { padding:13px 12px; text-align:right; font-family:'Playfair Display',serif; font-size:14px; font-weight:700; color:var(--ink); border-left:1px solid var(--border); }
  .cat-price small   { font-size:11px; color:var(--muted); }
  .cat-qty           { display:flex; align-items:center; gap:6px; padding:13px 12px; border-left:1px solid var(--border); }
  .qty-btn {
    width:24px; height:24px; border-radius:7px; background:var(--white);
    border:1px solid var(--border); color:var(--ink); cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all 0.12s;
  }
  .qty-btn:hover    { border-color:var(--accent); color:var(--accent); }
  .qty-input        { width:36px; height:24px; background:transparent; border:none; color:var(--ink); font-family:'Mulish',sans-serif; font-size:12px; font-weight:600; text-align:center; outline:none; }

  .manual-warn {
    display:flex; align-items:flex-start; gap:10px; padding:12px 14px;
    background:rgba(217,119,6,0.06); border:1px solid rgba(217,119,6,0.2);
    border-radius:10px; margin-bottom:12px; font-size:12px; color:var(--amber); font-weight:600; line-height:1.5;
  }
  .manual-grid { display:flex; flex-direction:column; gap:6px; }
  .manual-row  { display:grid; grid-template-columns:1fr 60px 90px 32px; gap:8px; align-items:center; }
  .minp {
    height:38px; padding:0 12px; background:var(--cream); border:1px solid var(--border);
    border-radius:10px; color:var(--ink); font-family:'Mulish',sans-serif; font-size:12px; font-weight:600;
    outline:none; transition:border-color 0.2s; width:100%;
  }
  .minp::placeholder { color:var(--muted-2); }
  .minp:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
  .add-item-btn {
    margin-top:8px; background:none; border:none;
    color:var(--accent); font-family:'Mulish',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:0.06em; cursor:pointer; display:flex; align-items:center; gap:5px;
    padding:0; text-transform:uppercase;
  }
  .rm-btn {
    width:32px; height:32px; border-radius:8px; background:none;
    border:1px solid var(--border); color:var(--muted); cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all 0.12s;
  }
  .rm-btn:hover    { border-color:var(--red); color:var(--red); background:var(--red-bg); }
  .rm-btn:disabled { opacity:0.3; cursor:not-allowed; }

  .modal-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:48px 0; color:var(--muted); text-align:center; }
  .modal-empty p { font-size:12px; font-weight:600; letter-spacing:0.04em; }

  .modal-foot       { padding:20px 32px 24px; border-top:1px solid var(--border); flex-shrink:0; background:var(--cream-2); }
  .modal-total-row  { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:14px; }
  .modal-total-label{ font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); }
  .modal-total-val  { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; letter-spacing:-0.03em; color:var(--ink); }
  .modal-total-val small { font-size:14px; color:var(--muted); margin-right:2px; }

  .modal-actions { display:flex; gap:10px; }
  .btn-submit {
    flex:1; height:46px; border-radius:12px;
    background:var(--ink); color:var(--cream);
    font-family:'Mulish',sans-serif; font-size:13px; font-weight:700;
    letter-spacing:0.02em; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:all 0.2s;
  }
  .btn-submit:hover:not(:disabled) { background:var(--ink-2); box-shadow:0 6px 20px rgba(26,21,16,0.2); transform:translateY(-1px); }
  .btn-submit:disabled { opacity:0.4; cursor:not-allowed; }
  .btn-cancel {
    height:46px; padding:0 20px; border-radius:12px;
    background:transparent; border:1px solid var(--border);
    color:var(--muted); font-family:'Mulish',sans-serif; font-size:13px; font-weight:600;
    cursor:pointer; transition:all 0.15s;
  }
  .btn-cancel:hover { color:var(--ink); background:var(--cream-3); }

  /* ─── RESPONSIVE ─────────────────────────────────────── */
  @media (max-width:1100px) {
    .ord-card-body { grid-template-columns:108px 1fr 320px 150px; }
    .pip-connector { width:16px; }
  }
  @media (max-width:900px) {
    .ord-card-body { grid-template-columns:90px 1fr; }
    .ord-pipeline  { display:none; }
    .ord-actions   { border-left:1px solid var(--border); }
  }
`;

/* ── pipeline track ── */
function PipelineTrack({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="ord-pipeline" style={{ justifyContent:"center", paddingBottom:"18px" }}>
        <div className="pip-cancelled">
          <XCircle size={12} color="var(--red)" />
          <span style={{ fontSize:10, fontWeight:700, color:"var(--red)", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'Mulish',sans-serif" }}>
            Cancelled
          </span>
        </div>
      </div>
    );
  }

  {/* on the wrapper */}
  const currentIdx = PIPELINE.indexOf(status as any);
  return (
    <div className="ord-pipeline" >
      {PIPELINE.map((step, i) => {
        const meta    = STATUS_META[step];
        const isDone   = i < currentIdx;
        const isActive = i === currentIdx;
        const nodeVars = (isActive || isDone)
          ? { "--node-color": meta.color, "--node-bg": meta.bg } as React.CSSProperties
          : {};
        return (
          <div className="pip-step" key={step}  style={{ minWidth: "60px" }}>
            {/* Node */}
            <div
              className={`pip-node ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
              style={nodeVars}
            >
              <meta.icon
                size={11}
                color={isActive || isDone ? meta.color : "var(--muted-2)"}
              />
            </div>

            {/* Label — absolutely positioned below the node */}
            <div className="pip-label-wrap">
              <span
                className={`pip-label ${isActive ? "active" : ""}`}
                style={isActive ? { color: meta.color } : {}}
              >
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </span>
            </div>

            {/* Connector to next step */}
         {i < PIPELINE.length - 1 && (
  <div
    className={`pip-connector ${isDone ? "done" : ""}`}
    style={{
      ...(isDone ? { background: meta.color } : {}),
      width: "34px",   // ← increase this value
    }}
  />
)}
          </div>
        );
      })}
    </div>
  ); 
}

export default function Orders() {
  const { canManageVendors, canViewAllData, canCancelOrders, canUpdateOrderStatus, user } = useAuth();
  const isVendor = user?.role === "VENDOR";
  const isOrgUser = user?.role === "ADMIN" || user?.role === "PROCUREMENT";
  const queryClient = useQueryClient();

  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState<OrderStatus | "ALL">("ALL");
  const [open, setOpen]                   = useState(false);
  const [vendorId, setVendorId]           = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [manualItems, setManualItems]     = useState([{ productName:"", quantity:1, price:0 }]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const id = "ord-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id = id; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const { data: ordersData = [] } = useQuery({
    queryKey: canViewAllData ? ["orders"] : ["orders","vendor",user?.id],
    queryFn:  () => canViewAllData ? orderApi.getAll() : orderApi.getByVendor(user!.id),
  });
  // Fetch "My Vendors" (accepted partnerships) for creating orders
  const { data: myVendors = [] } = useQuery({
    queryKey: ["my-vendors-for-orders", user?.organizationId],
    queryFn: () => vendorApi.getMyVendors(user?.organizationId!),
    enabled: !!user?.organizationId && isOrgUser,
  });
  const { data: catalogItems = [], isFetching: catalogFetching } = useQuery<VendorItem[]>({
    queryKey: ["vendor-catalog", vendorId],
    queryFn:  () => vendorItemApi.getAvailable(vendorId) as Promise<VendorItem[]>,
    enabled: !!vendorId, staleTime: 60_000,
  });

  const orders = (Array.isArray(ordersData) ? ordersData : (ordersData as any)?.content ?? []).map((o:any) => ({
    ...o, items: o.items||[], totalAmount: o.totalAmount??0,
  }));

  const handleVendorChange = (vid:string) => {
    setVendorId(vid); setSelectedItems({});
    setManualItems([{ productName:"", quantity:1, price:0 }]);
  };
  const setQty = (itemId:string, qty:number) => {
    if (qty <= 0) setSelectedItems(p => { const n={...p}; delete n[itemId]; return n; });
    else          setSelectedItems(p => ({...p,[itemId]:qty}));
  };
  const buildCatalogItems = () => Object.entries(selectedItems).map(([itemId,qty]) => {
    const item = catalogItems.find(i => i.id===itemId);
    return { productName:item?.name??"Item", quantity:qty, price:item?.unitPrice??0 };
  });
  const catalogTotal = Object.entries(selectedItems).reduce((sum,[id,qty]) => {
    const item = catalogItems.find(i => i.id===id); return sum+(item?.unitPrice??0)*qty;
  }, 0);
  const manualTotal  = manualItems.reduce((s,i) => s+(i.quantity||0)*(i.price||0), 0);
  const useCatalog   = catalogItems.length > 0;
  const canSubmit    = vendorId && (useCatalog ? Object.keys(selectedItems).length>0 : manualItems.some(i=>i.productName.trim()));

  const closeModal = () => {
    setOpen(false); setVendorId(""); setSelectedItems({});
    setManualItems([{ productName:"", quantity:1, price:0 }]);
  };

  const createMutation = useMutation({
    mutationFn: () => orderApi.create({ vendorId, items: useCatalog ? buildCatalogItems() : manualItems }),
    onSuccess: async (newOrder:any) => {
      toast.success("Order created successfully");
      queryClient.setQueryData(["orders"],(old:any) => {
        const existing = Array.isArray(old) ? old : [];
        return [...existing, {
          id: newOrder?.id??Date.now(), vendorId,
          vendorName: (myVendors as any[]).find((v:any)=>v.id===vendorId)?.companyName||"—",
          status:"CREATED", items: useCatalog?buildCatalogItems():manualItems,
          totalAmount: useCatalog?catalogTotal:manualTotal,
        }];
      });
      await queryClient.invalidateQueries({ queryKey:["orders"] });
      closeModal();
    },
    onError: (err:Error) => toast.error(err.message||"Failed to create order"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }:{ id:number; status:string }) => orderApi.updateStatus(id,status),
    onMutate: async ({ id, status }) => {
      const queryKey = canViewAllData ? ["orders"] : ["orders","vendor",user?.id];
      await queryClient.cancelQueries({ queryKey });
      const previousOrders = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey,(old:any)=>(old||[]).map((o:any)=>o.id===id?{...o,status}:o));
      return { previousOrders, queryKey };
    },
    onError: (err:any,_v,ctx) => {
      if (ctx?.queryKey && ctx?.previousOrders) queryClient.setQueryData(ctx.queryKey,ctx.previousOrders);
      toast.error(err?.response?.data?.message||"Invalid status transition");
    },
    onSuccess: async (_d,_v,ctx) => {
      toast.success("Order status updated");
      if (ctx?.queryKey) await queryClient.invalidateQueries({ queryKey:ctx.queryKey });
    },
  });

  const filtered = orders.filter((o:any) => {
    const matchSearch = o.vendorName?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
    return matchSearch && (statusFilter==="ALL" || o.status===statusFilter);
  });

  const addManualItem    = () => setManualItems([...manualItems,{productName:"",quantity:1,price:0}]);
  const removeManualItem = (idx:number) => setManualItems(manualItems.filter((_,i)=>i!==idx));
  const updateManualItem = (idx:number, field:string, value:any) => {
    const next=[...manualItems]; next[idx]={...next[idx],[field]:value}; setManualItems(next);
  };

  return (
    <AppLayout title="Purchase Orders" subtitle="Track lifecycle of every order">
      <div className="ord-root">

        {/* ── HEADER ── */}
        <div className="ord-header">
          <div>
            <div className="ord-eyebrow">Procurement</div>
            <h1 className="ord-title">Purchase Orders</h1>
          </div>
          {isOrgUser && (
            <button className="btn-create" onClick={() => setOpen(true)}>
              <Plus size={14} /> New Order
            </button>
          )}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="ord-toolbar">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className="ord-search-wrap">
              <Search size={13} />
              <input
                className="ord-search"
                placeholder="Search orders or vendors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="ord-filter-wrap">
              <Filter size={12} className="fi" />
              <select className="ord-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                <option value="ALL">All statuses</option>
                {Object.entries(STATUS_META).map(([k,v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="chev" />
            </div>
          </div>
          <span className="ord-count">{filtered.length} orders</span>
        </div>

        {/* ── ORDER LIST ── */}
        <div className="ord-list">
          {filtered.length === 0 ? (
            <div className="ord-empty">
              <ShoppingCart size={40} style={{ opacity:0.2 }} />
              <h3>No orders found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : filtered.map((order:any, i:number) => {
            const transitions = ORDER_TRANSITIONS[order.status] || [];
            return (
              <div
                key={order.id}
                className={`ord-card ${order.status==="CANCELLED" ? "cancelled" : ""}`}
                style={{ animationDelay:`${i*0.035}s` }}
              >
                <div className="ord-card-body">

                  {/* 1. ID strip */}
                  <div className="ord-id-strip" style={{ cursor: "pointer" }} onClick={() => setSelectedOrder(order)}>
                    <div className="ord-po">PO</div>
                    <div className="ord-id-num">#{order.id}</div>
                    <div className="ord-date">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})
                        : "—"}
                    </div>
                  </div>

                  {/* 2. Vendor / meta info */}
                  <div className="ord-info" style={{ cursor: "pointer" }} onClick={() => setSelectedOrder(order)}>
                    {canViewAllData && <div className="ord-vendor">{order.vendorName||"—"}</div>}
                    <div className="ord-meta">
                      {isVendor && order.items?.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {order.items.slice(0, 3).map((item: any, idx: number) => (
                            <span key={idx} className="text-xs font-medium" style={{ color: "var(--ink)" }}>
                              {item.quantity}x {item.productName}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-xs" style={{ color: "var(--muted)" }}>
                              +{order.items.length - 3} more items
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="ord-meta-chip">
                          <Package size={10}/>
                          {order.items?.length || 0} item{order.items?.length !== 1?"s":""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Pipeline track */}
                  <PipelineTrack status={order.status} />

                  {/* 4. Amount + action buttons */}
                  <div className="ord-actions">
                    <div className="ord-amount">
                      <span>₹</span>
                      {order.totalAmount.toLocaleString(undefined,{minimumFractionDigits:2})}
                    </div>
                    {transitions.length > 0 && (
                      <div className="ord-btns">
                        {transitions.map(s => {
                          // VENDOR can: APPROVE, SHIP, DELIVERED
                          const canPerformVendor = isVendor && (s === "APPROVED" || s === "SHIPPED" || s === "DELIVERED");
                          // ADMIN can: CANCEL (until shipped), COMPLETED (after delivery)
                          // PROCUREMENT can: CANCEL (until shipped), COMPLETED (after delivery)
                          const canPerformOrg = isOrgUser && (
                            (s === "CANCELLED" && canCancelOrders) || 
                            (s === "COMPLETED")
                          );
                          
                          if (!canPerformVendor && !canPerformOrg) return null;
                          
                          return (
                            <button
                              key={`${order.id}-${s}`}
                              className={`ord-btn ${s==="CANCELLED" ? "cancel" : ""}`}
                              onClick={() => statusMutation.mutate({id:order.id, status:s})}
                              disabled={statusMutation.isPending}
                            >
                              <ArrowRight size={9}/>
                              {s.charAt(0)+s.slice(1).toLowerCase()}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        <div className="ord-footer">Showing {filtered.length} of {orders.length} orders</div>

        {/* ── CREATE ORDER MODAL ── */}
        {open && (
          <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) closeModal(); }}>
            <div className="modal">
              <div className="modal-top">
                <div>
                  <div className="modal-eyebrow">New purchase order</div>
                  <div className="modal-title">Create Order</div>
                  <div className="modal-sub">Select a vendor and pick items from their catalog</div>
                </div>
                <button className="modal-close" onClick={closeModal}><X size={14}/></button>
              </div>

              <div className="modal-body">
                <div className="field">
                  <label className="field-label">Vendor <span className="field-req">*</span></label>
                  <div className="select-wrap">
                    <select className="sel" value={vendorId} onChange={e => handleVendorChange(e.target.value)}>
                      <option value="">— Choose a vendor —</option>
                      {(myVendors as any[]).filter((v:any)=>v.status==="APPROVED").map((v:any)=>(
                        <option key={v.id} value={v.id}>{v.companyName}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="chev"/>
                  </div>
                </div>

                {vendorId && (
                  <div className="field">
                    <div className="catalog-header">
                      <span className="catalog-section-title">{useCatalog?"Catalog Items":"Order Items"}</span>
                      {catalogFetching && (
                        <span className="catalog-fetching">
                          <Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>Loading…
                        </span>
                      )}
                    </div>
                    {useCatalog && (
                      <div className="catalog-grid">
                        {catalogItems.map(item => {
                          const qty = selectedItems[item.id] ?? 0;
                          return (
                            <div key={item.id} className={`cat-row ${qty>0?"selected":""}`}>
                              <div className="cat-info">
                                <div className="cat-name">{item.name}</div>
                                {item.description && <div className="cat-desc">{item.description}</div>}
                                {item.unit && <div className="cat-unit">per {item.unit}</div>}
                              </div>
                              <div className="cat-price">
                                <small>₹</small>{item.unitPrice.toLocaleString(undefined,{minimumFractionDigits:2})}
                              </div>
                              <div className="cat-qty">
                                <button className="qty-btn" type="button" onClick={()=>setQty(item.id,qty-1)}><Minus size={10}/></button>
                                <input className="qty-input" type="number" min={0} value={qty} onChange={e=>setQty(item.id,Number(e.target.value))}/>
                                <button className="qty-btn" type="button" onClick={()=>setQty(item.id,qty+1)}><Plus size={10}/></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!useCatalog && !catalogFetching && (
                      <>
                        <div className="manual-warn">
                          <Package size={13} style={{flexShrink:0,marginTop:1}}/>
                          <span>No catalog items yet. Enter items manually.</span>
                        </div>
                        <div className="manual-grid">
                          {manualItems.map((item,idx) => (
                            <div className="manual-row" key={idx}>
                              <input className="minp" placeholder="Product name" value={item.productName} onChange={e=>updateManualItem(idx,"productName",e.target.value)}/>
                              <input className="minp" type="number" placeholder="Qty" min={1} value={item.quantity} onChange={e=>updateManualItem(idx,"quantity",Number(e.target.value))}/>
                              <input className="minp" type="number" placeholder="0.00" min={0} step="0.01" value={item.price} onChange={e=>updateManualItem(idx,"price",Number(e.target.value))}/>
                              <button className="rm-btn" type="button" onClick={()=>removeManualItem(idx)} disabled={manualItems.length===1}><X size={12}/></button>
                            </div>
                          ))}
                          <button className="add-item-btn" type="button" onClick={addManualItem}><Plus size={11}/>Add item</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {!vendorId && (
                  <div className="modal-empty">
                    <ShoppingCart size={32} style={{opacity:0.2}}/>
                    <p>Select a vendor to browse their catalog</p>
                  </div>
                )}
              </div>

              <div className="modal-foot">
                {vendorId && (
                  <div className="modal-total-row">
                    <span className="modal-total-label">
                      {useCatalog
                        ? `${Object.keys(selectedItems).length} type${Object.keys(selectedItems).length!==1?"s":""} selected`
                        : `${manualItems.filter(i=>i.productName.trim()).length} item${manualItems.filter(i=>i.productName.trim()).length!==1?"s":""}`}
                    </span>
                    <div className="modal-total-val">
                      <small>₹</small>
                      {(useCatalog?catalogTotal:manualTotal).toLocaleString(undefined,{minimumFractionDigits:2})}
                    </div>
                  </div>
                )}
                <div className="modal-actions">
                  <button
                    className="btn-submit"
                    disabled={!canSubmit||createMutation.isPending}
                    onClick={() => createMutation.mutate()}
                  >
                    {createMutation.isPending
                      ? <><Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>Creating…</>
                      : <>Create Order <ArrowRight size={14}/></>}
                  </button>
                  <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDER DETAILS MODAL ── */}
        {selectedOrder && (
          <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setSelectedOrder(null); }}>
            <div className="modal" style={{ maxWidth: 640 }}>
              <div className="modal-top">
                <div>
                  <div className="modal-eyebrow">Order Details</div>
                  <div className="modal-title">PO #{selectedOrder.id}</div>
                  <div className="modal-sub">
                    Created {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setSelectedOrder(null)}><X size={14}/></button>
              </div>

              <div className="modal-body">
                {/* Order meta */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <span className="field-label">Status</span>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: STATUS_META[selectedOrder.status]?.bg, border: `1px solid ${STATUS_META[selectedOrder.status]?.border}` }}>
                      {React.createElement(STATUS_META[selectedOrder.status]?.icon, { size: 12, color: STATUS_META[selectedOrder.status]?.color })}
                      <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_META[selectedOrder.status]?.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {STATUS_META[selectedOrder.status]?.label}
                      </span>
                    </div>
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <span className="field-label">Total Amount</span>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
                      ₹{selectedOrder.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {canViewAllData && selectedOrder.vendorName && (
                  <div className="field">
                    <span className="field-label">Vendor</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10 }}>
                      <Building2 size={14} style={{ color: "var(--muted)" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{selectedOrder.vendorName}</span>
                    </div>
                  </div>
                )}

                {/* Order items */}
                <div className="field">
                  <span className="field-label">
                    <FileText size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                    Order Items ({selectedOrder.items?.length || 0})
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(selectedOrder.items || []).map((item: any, idx: number) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "12px 14px", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{item.productName}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                            Qty: {item.quantity}
                            {item.unit && ` × ${item.unit}`}
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "var(--ink)", textAlign: "right" }}>
                          ₹{((item.quantity || 0) * (item.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                      <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>
                        No items in this order
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-foot">
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setSelectedOrder(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}