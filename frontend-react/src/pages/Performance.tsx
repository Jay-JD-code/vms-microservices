import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { performanceApi, vendorApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

//////////////////////////////////////////////////////
// SCORE RING — SVG arc gauge
//////////////////////////////////////////////////////
function ScoreRing({ score, size = 80, strokeWidth = 7 }: { score: number; size?: number; strokeWidth?: number }) {
  const s = Math.min(100, Math.max(0, score ?? 0));
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (s / 100) * circumference;

  const color =
    s >= 90 ? "var(--green)" :
    s >= 75 ? "var(--accent)" :
    s >= 50 ? "var(--amber)" :
    "var(--red)";

  const colorRaw =
    s >= 90 ? "#059669" :
    s >= 75 ? "#c8a96e" :
    s >= 50 ? "#d97706" :
    "#dc2626";

  const glowId = `glow-${Math.round(s)}`;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--cream-3)" strokeWidth={strokeWidth} />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={colorRaw}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: size * 0.26,
          color: colorRaw,
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}>{Math.round(s)}</span>
        <span style={{
          fontFamily: "'Mulish', sans-serif",
          fontSize: size * 0.11,
          color: "var(--muted-2)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          marginTop: "2px",
          textTransform: "uppercase",
        }}>/ 100</span>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// METRIC BAR
//////////////////////////////////////////////////////
function MetricBar({ label, score, icon, weight }: { label: string; score: number; icon: string; weight: string }) {
  const s = Math.min(100, Math.max(0, score ?? 0));

  const colorRaw =
    s >= 90 ? "#059669" :
    s >= 75 ? "#c8a96e" :
    s >= 50 ? "#d97706" :
    "#dc2626";

  const bgRaw =
    s >= 90 ? "rgba(5,150,105,0.10)" :
    s >= 75 ? "rgba(200,169,110,0.12)" :
    s >= 50 ? "rgba(217,119,6,0.10)" :
    "rgba(220,38,38,0.10)";

  return (
    <div style={{ marginBottom: "13px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ fontSize: "13px" }}>{icon}</span>
          <span style={{
            fontSize: "12px", fontWeight: 600, color: "var(--ink-2)",
            letterSpacing: "0.01em", fontFamily: "'Mulish', sans-serif",
          }}>{label}</span>
          <span style={{
            fontSize: "9px", color: "var(--muted)", fontWeight: 700,
            background: "var(--cream-3)", padding: "1px 6px", borderRadius: "4px",
            letterSpacing: "0.08em", textTransform: "uppercase",
            fontFamily: "'Mulish', sans-serif",
          }}>{weight}</span>
        </div>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "15px", color: colorRaw,
          fontWeight: 700, letterSpacing: "-0.01em",
        }}>{s.toFixed(1)}</span>
      </div>
      <div style={{ height: "5px", background: "var(--cream-3)", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "4px",
          width: `${s}%`,
          background: `linear-gradient(90deg, ${bgRaw.replace("0.10","0.4")}, ${colorRaw})`,
          transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// BADGE
//////////////////////////////////////////////////////
function Badge({ score }: { score: number }) {
  const cfg =
    score >= 90 ? { label: "Excellent",  bg: "var(--green-bg)",  color: "var(--green)", border: "var(--green-border)"  } :
    score >= 75 ? { label: "Good",       bg: "var(--accent-dim2)", color: "var(--accent)", border: "var(--accent-border)" } :
    score >= 50 ? { label: "Average",    bg: "var(--amber-bg)",  color: "var(--amber)", border: "var(--amber-border)"  } :
    score >  0  ? { label: "Needs Work", bg: "var(--red-bg)",    color: "var(--red)",   border: "var(--red-border)"   } :
                  { label: "No Data",    bg: "var(--cream-2)",   color: "var(--muted)", border: "var(--border)"       };

  return (
    <span style={{
      fontSize: "9px", fontWeight: 800, padding: "3px 9px", borderRadius: "20px",
      letterSpacing: "0.09em", textTransform: "uppercase",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontFamily: "'Mulish', sans-serif",
    }}>
      {cfg.label}
    </span>
  );
}

//////////////////////////////////////////////////////
// STAT CARD
//////////////////////////////////////////////////////
function StatCard({
  label, value, sub, accentColor, delay = 0,
}: { label: string; value: string | number; sub: string; accentColor: string; delay?: number }) {
  return (
    <div style={{
      background: "var(--white)",
      border: "1px solid var(--border)",
      borderRadius: "14px",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
      animation: `statIn 0.35s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
    }}>
      {/* Top accent stripe */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
      }} />
      <p style={{
        fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.18em", color: "var(--accent)", marginBottom: "10px",
        fontFamily: "'Mulish', sans-serif",
      }}>{label}</p>
      <p style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: typeof value === "string" && value.length > 6 ? "18px" : "34px",
        fontWeight: 700, color: accentColor,
        lineHeight: 1.15, letterSpacing: "-0.02em",
      }}>{value}</p>
      <p style={{
        fontSize: "11px", color: "var(--muted)", marginTop: "5px",
        fontWeight: 500, fontFamily: "'Mulish', sans-serif",
      }}>{sub}</p>
    </div>
  );
}

//////////////////////////////////////////////////////
// MAIN
//////////////////////////////////////////////////////
export default function Performance() {
  const { canViewAllData, user } = useAuth();
  const isVendor = !canViewAllData && user?.role === "VENDOR";
  const queryClient = useQueryClient();

  const { data: reviewsData = [], isLoading: allLoading, isError: allError, error: allErrorObj } = useQuery({
    queryKey: ["performance"],
    queryFn: async () => (await performanceApi.getAll()) ?? [],
    retry: 1, staleTime: 30_000, enabled: !isVendor,
  });

  const { data: vendorPerf, isLoading: vendorLoading, isError: vendorError, error: vendorErrorObj } = useQuery({
    queryKey: ["performance", "vendor", user?.id],
    queryFn: () => performanceApi.get(user!.id),
    retry: 1, staleTime: 30_000, enabled: isVendor && !!user?.id,
  });

  const isLoading = isVendor ? vendorLoading : allLoading;
  const isError   = isVendor ? vendorError   : allError;
  const error     = isVendor ? vendorErrorObj : allErrorObj;

  const normalize = (r: any) => ({
    ...r,
    deliveryScore:    r.deliveryScore    ?? 0,
    qualityScore:     r.qualityScore     ?? 0,
    complianceScore:  r.complianceScore  ?? 0,
    fulfillmentScore: r.fulfillmentScore ?? 0,
    overallScore:     r.overallScore     ?? 0,
    totalOrders:      r.totalOrders      ?? 0,
    completedOrders:  r.completedOrders  ?? 0,
    onTimeDeliveries: r.onTimeDeliveries ?? 0,
    averageDeliveryTime: r.averageDeliveryTime ?? 0,
  });

  const reviews = isVendor
    ? vendorPerf ? [normalize(vendorPerf)] : []
    : (reviewsData as any[]).map(normalize);

  const withFulfillment = reviews.map((r) => ({
    ...r,
    fulfillmentScore: r.fulfillmentScore > 0
      ? r.fulfillmentScore
      : r.totalOrders > 0 ? ((r.completedOrders / r.totalOrders) * 100) : 100,
  }));

  const recalcMutation = useMutation({
    mutationFn: (vendorId: string) => performanceApi.calculate(vendorId),
    onSuccess: () => { toast.success("Score recalculated"); queryClient.invalidateQueries({ queryKey: ["performance"] }); },
    onError: (err: any) => toast.error(`Failed: ${err?.message ?? "Unknown error"}`),
  });

  const recalcSelfMutation = useMutation({
    mutationFn: () => performanceApi.calculate(user!.id),
    onSuccess: () => { toast.success("Score refreshed"); queryClient.invalidateQueries({ queryKey: ["performance", "vendor", user?.id] }); },
    onError: (err: any) => toast.error(`Failed: ${err?.message ?? "Unknown error"}`),
  });

  const recalcAllMutation = useMutation({
    mutationFn: async () => {
      const vendors = await vendorApi.getAll();
      const approved = vendors.filter((v: any) => v.status === "APPROVED");
      if (approved.length === 0) throw new Error("No approved vendors found");
      const results = await Promise.allSettled(approved.map((v: any) => performanceApi.calculate(v.id)));
      const failed = results.filter(r => r.status === "rejected").length;
      return { succeeded: results.length - failed, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      if (failed > 0) toast.warning(`${succeeded} recalculated, ${failed} failed`);
      else toast.success(`All ${succeeded} vendors recalculated`);
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
    onError: (err: any) => toast.error(`Failed: ${err?.message ?? "Unknown error"}`),
  });

  const avgScore = withFulfillment.length > 0
    ? (withFulfillment.reduce((s, p) => s + p.overallScore, 0) / withFulfillment.length).toFixed(1)
    : "0";
  const topPerformer = withFulfillment.length > 0
    ? [...withFulfillment].sort((a, b) => b.overallScore - a.overallScore)[0]
    : null;
  const excellentCount = withFulfillment.filter(r => r.overallScore >= 90).length;

  return (
    <AppLayout
      title={isVendor ? "My Performance" : "Vendor Performance"}
      subtitle={isVendor ? "Your delivery, quality, fulfillment and compliance scores" : "Performance metrics and scorecards"}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Mulish:wght@300;400;500;600;700;800&display=swap');

        @keyframes statIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .perf-scorecard {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .perf-scorecard:hover {
          border-color: var(--accent-border);
          box-shadow: 0 4px 24px rgba(200,169,110,0.08);
        }
        .perf-recalc-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Mulish', sans-serif;
          color: var(--ink-2);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          letter-spacing: 0.02em;
        }
        .perf-recalc-btn:hover:not(:disabled) {
          background: var(--accent-dim);
          border-color: var(--accent-border);
          color: var(--accent);
        }
        .perf-recalc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .mini-recalc {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: var(--cream-2);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .mini-recalc:hover:not(:disabled) {
          background: var(--accent-dim);
          border-color: var(--accent-border);
        }
        .mini-recalc:disabled { opacity: 0.4; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
      `}</style>

      {/* ── ERROR ── */}
      {isError && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          marginBottom: "20px", padding: "12px 16px",
          background: "var(--red-bg)", border: "1px solid var(--red-border)",
          borderRadius: "10px", fontSize: "13px", color: "var(--red)",
        }}>
          ⚠ Failed to load: {(error as any)?.message ?? "Unknown error"}
        </div>
      )}

      {/* ── LOADING ── */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
          <div style={{ fontSize: "24px", marginBottom: "12px" }} className="spin">◌</div>
          <p style={{ fontSize: "13px", fontWeight: 500 }}>Loading performance data…</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── STAT STRIP ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <StatCard
              label={isVendor ? "Your Score" : "Avg. Score"}
              value={avgScore}
              sub="out of 100"
              accentColor="var(--green)"
              delay={0}
            />

            {!isVendor && (
              <StatCard
                label="Top Performer"
                value={topPerformer?.vendorName || "—"}
                sub={topPerformer ? `Score: ${topPerformer.overallScore.toFixed(1)}` : "no data"}
                accentColor="var(--accent)"
                delay={0.05}
              />
            )}

            <StatCard
              label={isVendor ? "Orders Tracked" : "Vendors Reviewed"}
              value={isVendor ? (withFulfillment[0]?.totalOrders ?? 0) : withFulfillment.length}
              sub={isVendor ? "total orders" : "active vendors"}
              accentColor="#2563eb"
              delay={0.1}
            />

            {!isVendor && (
              <StatCard
                label="Excellent Rating"
                value={excellentCount}
                sub={`of ${withFulfillment.length} vendors`}
                accentColor="var(--green)"
                delay={0.15}
              />
            )}

            {isVendor && (
              <StatCard
                label="Completed Orders"
                value={withFulfillment[0]?.completedOrders ?? 0}
                sub="fulfilled"
                accentColor="var(--accent)"
                delay={0.1}
              />
            )}

            {isVendor && (
              <StatCard
                label="On-Time Deliveries"
                value={withFulfillment[0]?.onTimeDeliveries ?? 0}
                sub="deliveries"
                accentColor="var(--amber)"
                delay={0.15}
              />
            )}
          </div>

          {/* ── METRIC LEGEND ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {[
              { icon: "⏱", label: "Delivery",    desc: "On-time ≤7 days",   color: "var(--blue)",   dot: "#2563eb" },
              { icon: "✦",  label: "Quality",     desc: "Completion rate",   color: "#9333ea",       dot: "#9333ea" },
              { icon: "📦", label: "Fulfillment", desc: "Non-cancellation",  color: "var(--green)",  dot: "#059669" },
              { icon: "↗",  label: "Compliance",  desc: "Payment success",   color: "var(--accent)", dot: "#c8a96e" },
            ].map(m => (
              <div key={m.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 10, padding: "10px 14px",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: m.dot,
                  boxShadow: `0 0 6px ${m.dot}88`,
                }} />
                <div>
                  <p style={{
                    fontSize: "12px", fontWeight: 700, color: m.color, margin: 0,
                    fontFamily: "'Mulish', sans-serif", letterSpacing: "0.01em",
                  }}>{m.label}</p>
                  <p style={{
                    fontSize: "10px", color: "var(--muted)", margin: 0,
                    fontFamily: "'Mulish', sans-serif", fontWeight: 500,
                  }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── ACTION ROW ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
            {isVendor ? (
              <button className="perf-recalc-btn" onClick={() => recalcSelfMutation.mutate()} disabled={recalcSelfMutation.isPending || isLoading}>
                <span className={recalcSelfMutation.isPending ? "spin" : ""} style={{ fontSize: "15px" }}>↺</span>
                {recalcSelfMutation.isPending ? "Refreshing…" : "Refresh My Score"}
              </button>
            ) : (
              <button className="perf-recalc-btn" onClick={() => recalcAllMutation.mutate()} disabled={recalcAllMutation.isPending || isLoading}>
                <span className={recalcAllMutation.isPending ? "spin" : ""} style={{ fontSize: "15px" }}>↺</span>
                {recalcAllMutation.isPending ? "Recalculating…" : "Recalculate All"}
              </button>
            )}
          </div>

          {/* ── EMPTY STATE ── */}
          {withFulfillment.length === 0 && !isError && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--cream-2)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: "24px",
              }}>◎</div>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "18px", fontWeight: 700, color: "var(--ink-3)",
                letterSpacing: "-0.01em", marginBottom: "8px",
              }}>No Performance Data</p>
              <p style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>
                {isVendor ? 'Click "Refresh My Score" to generate your metrics.' : 'Click "Recalculate All" to generate vendor scores.'}
              </p>
            </div>
          )}

          {/* ── SCORECARDS GRID ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "14px" }}>
            {withFulfillment.map((review: any, i: number) => {
              const overall = review.overallScore ?? 0;
              const isRecalcingThis = recalcMutation.isPending && recalcMutation.variables === review.vendorId;
              const avgDeliveryDays = review.averageDeliveryTime > 0
                ? (review.averageDeliveryTime / 24).toFixed(1)
                : null;

              const tierColor =
                overall >= 90 ? "#059669" :
                overall >= 75 ? "#c8a96e" :
                overall >= 50 ? "#d97706" :
                "#dc2626";

              return (
                <div
                  key={review.vendorId}
                  className="perf-scorecard"
                  style={{ animation: `cardIn 0.35s cubic-bezier(0.16,1,0.3,1) ${0.04 + i * 0.05}s both` }}
                >
                  {/* Tier stripe */}
                  <div style={{
                    height: "3px",
                    background: `linear-gradient(90deg, ${tierColor}80, transparent)`,
                  }} />

                  {/* Card Header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "16px",
                    padding: "18px 22px",
                    borderBottom: "1px solid var(--border-2)",
                    background: "var(--cream-2)",
                  }}>
                    <ScoreRing score={overall} size={72} strokeWidth={6} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
                        <h3 style={{
                          fontFamily: "'Playfair Display', serif",
                          fontWeight: 700, fontSize: "15px", color: "var(--ink)",
                          margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {isVendor ? "Your Performance" : (review.vendorName || "Unknown Vendor")}
                        </h3>
                        <Badge score={overall} />
                      </div>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500, fontFamily: "'Mulish', sans-serif" }}>
                          Updated: {review.calculatedAt ? new Date(review.calculatedAt).toLocaleDateString() : "Never"}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500, fontFamily: "'Mulish', sans-serif" }}>
                          {review.totalOrders} orders · {review.completedOrders} completed
                        </span>
                        {avgDeliveryDays && (
                          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500, fontFamily: "'Mulish', sans-serif" }}>
                            Avg {avgDeliveryDays}d delivery
                          </span>
                        )}
                      </div>
                    </div>

                    {!isVendor && (
                      <button
                        className="mini-recalc"
                        onClick={() => recalcMutation.mutate(review.vendorId)}
                        disabled={isRecalcingThis}
                        title="Recalculate"
                      >
                        <span
                          className={isRecalcingThis ? "spin" : ""}
                          style={{ fontSize: "14px", color: "var(--muted)" }}
                        >↺</span>
                      </button>
                    )}
                  </div>

                  {/* Metric bars */}
                  <div style={{ padding: "18px 22px", background: "var(--white)" }}>
                    <MetricBar label="Delivery"    score={review.deliveryScore}    icon="⏱" weight="40%" />
                    <MetricBar label="Quality"     score={review.qualityScore}     icon="✦"  weight="25%" />
                    <MetricBar label="Fulfillment" score={review.fulfillmentScore} icon="📦" weight="20%" />
                    <MetricBar label="Compliance"  score={review.complianceScore}  icon="↗"  weight="15%" />
                  </div>

                  {/* Score breakdown footer */}
                  <div style={{
                    padding: "12px 22px",
                    borderTop: "1px solid var(--border-2)",
                    background: "var(--cream-2)",
                    display: "flex", gap: "0", justifyContent: "space-around",
                  }}>
                    {[
                      { label: "Delivery",    val: review.deliveryScore,    color: "#2563eb"       },
                      { label: "Quality",     val: review.qualityScore,     color: "#9333ea"       },
                      { label: "Fulfillment", val: review.fulfillmentScore, color: "var(--green)"  },
                      { label: "Compliance",  val: review.complianceScore,  color: "var(--accent)" },
                    ].map((item, idx, arr) => (
                      <div key={item.label} style={{
                        textAlign: "center", flex: 1,
                        borderRight: idx < arr.length - 1 ? "1px solid var(--border)" : "none",
                        padding: "2px 0",
                      }}>
                        <p style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "17px", color: item.color, margin: 0,
                          lineHeight: 1, fontWeight: 700,
                        }}>
                          {Math.round(item.val)}
                        </p>
                        <p style={{
                          fontSize: "9px", color: "var(--muted)", margin: "3px 0 0",
                          textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700,
                          fontFamily: "'Mulish', sans-serif",
                        }}>
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
}