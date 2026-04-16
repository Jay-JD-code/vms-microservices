import { useAuth } from "@/hooks/useAuth";
import { ROLE_PERMISSIONS } from "@/types";
import type { UserRole } from "@/types";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useAuth();
  const role      = user?.role as UserRole | undefined;
  const roleLabel = role ? ROLE_PERMISSIONS[role]?.label || role : "";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "0 20px",
        gap: 12,
        minWidth: 0,
      }}
    >
      {/* Page title */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        flex: 1,
        minWidth: 0,
      }}>
        <span style={{
          fontSize: 9, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "var(--accent)", fontWeight: 700,
        }}>
          {title.toLowerCase().replace(/\s+/g, "·")}
        </span>
        <h1 style={{
          fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em",
          lineHeight: 1.1, color: "var(--ink)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          fontFamily: "'Playfair Display', serif", margin: 0,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: 11, fontWeight: 500, color: "var(--muted)",
            marginTop: 2, whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 13, fontWeight: 700,
          fontFamily: "'Playfair Display', serif", flexShrink: 0,
        }}>
          {user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>

        {/* Hidden on mobile via .topbar-user-name CSS class */}
        <div className="topbar-user-name" style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>
            {user?.name}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--muted)",
          }}>
            {roleLabel}
          </span>
        </div>
      </div>
    </header>
  );
}