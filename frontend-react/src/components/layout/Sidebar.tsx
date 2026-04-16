import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_PERMISSIONS } from "@/types";
import type { UserRole } from "@/types";
import {
  LayoutDashboard, Users, ShoppingCart, CreditCard,
  FileText, BarChart3, LogOut, ChevronLeft, Menu,
  Package, UserPlus, X, Building2, Settings, type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const allNavItems: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/dashboard",            label: "Dashboard",            icon: LayoutDashboard },
  { path: "/vendors",              label: "Vendors",              icon: Users           },
  { path: "/organizations",        label: "Organizations",        icon: Building2      },
  { path: "/organization-profile", label: "Org. Profile",         icon: Settings       },
  { path: "/orders",               label: "Purchase Orders",      icon: ShoppingCart    },
  { path: "/payments",             label: "Payments",             icon: CreditCard      },
  { path: "/documents",            label: "Documents",            icon: FileText        },
  { path: "/performance",          label: "Performance",          icon: BarChart3       },
  { path: "/create-account",       label: "Create Account",       icon: UserPlus        },
  { path: "/catalog",              label: "My Catalog",           icon: Package         },
  { path: "/invoices",             label: "Invoices",             icon: FileText        },
  { path: "/organization-requests", label: "Org. Requests",       icon: Building2       },
];

const W_OPEN      = 248;
const W_COLLAPSED = 64;

interface SidebarProps {
  onMobileClose?: () => void;
}

export default function Sidebar({ onMobileClose }: SidebarProps) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const role  = (user?.role || "ADMIN") as UserRole;
  const perms = ROLE_PERMISSIONS[role];
  const navItems = allNavItems.filter((item) =>
    perms.allowedRoutes.some((r) => item.path.startsWith(r))
  );

  const isMobileView = () => window.innerWidth < 768;

  // Keep --sidebar-current-w in sync for desktop margin-left
  useEffect(() => {
    const update = () => {
      document.documentElement.style.setProperty(
        "--sidebar-current-w",
        isMobileView() ? "0px" : `${collapsed ? W_COLLAPSED : W_OPEN}px`
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [collapsed]);

  const showLabel = !collapsed;

  return (
    <aside
      style={{
        width: isMobileView() ? W_OPEN : collapsed ? W_COLLAPSED : W_OPEN,
        transition: "width 0.2s cubic-bezier(0.16,1,0.3,1)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--white)",
        borderRight: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: (showLabel || isMobileView()) ? "space-between" : "center",
        height: "var(--topbar-h)",
        padding: (showLabel || isMobileView()) ? "0 16px" : "0 12px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {(showLabel || isMobileView()) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg viewBox="0 0 40 46" width="28" height="28" fill="none">
              <polygon points="20,2 38,12 38,34 20,44 2,34 2,12" fill="#1a1510" />
              <path
                d="M11 16 L20 32 L29 16"
                stroke="#c8a96e" strokeWidth="4.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none"
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{
                fontSize: 16, fontWeight: 700, color: "var(--ink)",
                letterSpacing: "-0.01em", fontFamily: "'Playfair Display', serif",
              }}>
                VMS
              </span>
              <span style={{
                fontSize: 9, letterSpacing: "0.15em",
                textTransform: "uppercase", color: "var(--accent)", fontWeight: 700,
              }}>
                Vendor Portal
              </span>
            </div>
          </div>
        )}

        {/* Mobile: X to close | Desktop: collapse toggle */}
        <button
          onClick={() => isMobileView() ? onMobileClose?.() : setCollapsed(!collapsed)}
          title={isMobileView() ? "Close menu" : collapsed ? "Expand" : "Collapse"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 6,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", cursor: "pointer", flexShrink: 0,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-dim)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          {isMobileView()
            ? <X size={15} />
            : collapsed ? <Menu size={15} /> : <ChevronLeft size={15} />
          }
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto", overflowX: "hidden" }}>
        {navItems.map((item) => {
          const isActive  = location.pathname.startsWith(item.path);
          const showLbl   = showLabel || isMobileView();
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={!showLbl ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                margin: "1px 8px",
                padding: showLbl ? "9px 12px" : "10px 0",
                justifyContent: showLbl ? "flex-start" : "center",
                borderRadius: 8, fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--ink)" : "var(--muted)",
                background: isActive ? "var(--accent-dim2)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--accent-dim)";
                  e.currentTarget.style.color = "var(--ink-2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
            >
              {isActive && showLbl && (
                <span style={{
                  position: "absolute", left: 8,
                  width: 3, height: 20, borderRadius: 2,
                  background: "var(--accent)",
                }} />
              )}
              <item.icon
                size={17}
                style={{ flexShrink: 0, color: isActive ? "var(--accent)" : "inherit" }}
              />
              {showLbl && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 8px", flexShrink: 0 }}>
        {(showLabel || isMobileView()) && user && (
          <div style={{
            padding: "8px 10px 10px", marginBottom: 4,
            borderRadius: 8, background: "var(--cream-2)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{
                  fontSize: 12, fontWeight: 600, color: "var(--ink)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {user.name}
                </p>
                <p style={{
                  fontSize: 11, color: "var(--muted)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {user.email}
                </p>
              </div>
            </div>
            <span style={{
              display: "inline-block", marginTop: 6,
              padding: "2px 7px", fontSize: 9, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              borderRadius: 4, background: "var(--accent-dim2)",
              color: "var(--accent)", border: "1px solid var(--accent-border)",
            }}>
              {perms.label}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          title="Sign out"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: (showLabel || isMobileView()) ? "flex-start" : "center",
            gap: 8, width: "100%",
            padding: (showLabel || isMobileView()) ? "9px 12px" : "10px 0",
            borderRadius: 8, border: "1px solid transparent",
            background: "transparent", color: "var(--muted)",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget;
            b.style.background  = "var(--red-bg)";
            b.style.color       = "var(--red)";
            b.style.borderColor = "var(--red-border)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget;
            b.style.background  = "transparent";
            b.style.color       = "var(--muted)";
            b.style.borderColor = "transparent";
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {(showLabel || isMobileView()) && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}