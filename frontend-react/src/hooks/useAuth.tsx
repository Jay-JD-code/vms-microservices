import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type AuthUser, type UserRole, ROLE_PERMISSIONS } from "@/types";
import { ApiError } from "@/lib/api";

type LoginResult = { role: string; firstLogin: boolean };

interface AuthState {
  user: (AuthUser & { firstLogin?: boolean; organizationId?: number }) | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, demoRole?: UserRole) => Promise<LoginResult>;
  logout: () => void;
  hasRouteAccess: (route: string) => boolean;
  canApproveVendors: boolean;
  canProcessPayments: boolean;
  canRecordPayments: boolean;
  canManageVendors: boolean;
  canViewAllData: boolean;
  canCancelOrders: boolean;
  canUpdateOrderStatus: boolean;
  getDefaultRoute: () => string;
  registerOrganization: (orgName: string, slug: string, adminEmail: string) => Promise<LoginResult>;

}

const AuthContext = createContext<AuthState | null>(null);

const DEMO_USERS: Record<UserRole, AuthUser> = {
  MASTER_ADMIN: { id: "0",               email: "masteradmin@vms.com",  name: "Super Admin",  role: "MASTER_ADMIN" },
  ADMIN:       { id: "1",               email: "admin@vms.com",       name: "Admin User",   role: "ADMIN" },
  VENDOR:      { id: "vendor-demo-001", email: "vendor@acme.com",     name: "John Smith",   role: "VENDOR" },
  PROCUREMENT: { id: "3",               email: "procurement@vms.com", name: "Sarah Chen",   role: "PROCUREMENT" },
  FINANCE:     { id: "4",               email: "finance@vms.com",     name: "Mike Johnson", role: "FINANCE" },
};

function getStoredUser(): (AuthUser & { firstLogin?: boolean }) | null {
  try {
    const stored = localStorage.getItem("vms_user");
    if (!stored || stored === "undefined") return null;
    return JSON.parse(stored);
  } catch { return null; }
}

function getStoredToken(): string | null {
  const t = localStorage.getItem("vms_token");
  return t && t !== "undefined" ? t : null;
}

function getPerms(user: AuthUser | null) {
  if (!user) return ROLE_PERMISSIONS.VENDOR;
  return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.VENDOR;
}

function isNetworkFailure(err: unknown): boolean {
  if (err instanceof ApiError) return err.status === 0;
  return true;
}

// Resolves the real vendor UUID from the backend after login.
// /api/vendors/me uses the JWT subject (email) to look up the vendor record.
async function resolveVendorId(email: string, token: string): Promise<string | null> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // Strategy 1: /api/vendors/me — backend reads JWT email and returns vendor profile
  try {
    const res = await fetch(`${API_BASE_URL}/api/vendors/me`, { headers });
    const data = await res.json();
    console.log("[resolveVendorId] /me →", res.status, data);
    if (res.ok && data?.id) return String(data.id);
  } catch (e) {
    console.warn("[resolveVendorId] /me failed:", e);
  }

  // Strategy 2: scan vendor list and match by email
  try {
    const res = await fetch(`${API_BASE_URL}/api/vendors`, { headers });
    const body = await res.json();
    console.log("[resolveVendorId] /vendors →", res.status, body);
    const vendors: any[] = Array.isArray(body) ? body : (body?.content ?? []);
    const match = vendors.find(
      (v: any) =>
        v.email?.toLowerCase() === email.toLowerCase() ||
        v.contactEmail?.toLowerCase() === email.toLowerCase()
    );
    console.log("[resolveVendorId] matched:", match);
    if (match?.id) return String(match.id);
  } catch (e) {
    console.warn("[resolveVendorId] /vendors failed:", e);
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(AuthUser & { firstLogin?: boolean }) | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(getStoredToken);

  const login = useCallback(async (
    email: string,
    password: string,
    demoRole?: UserRole,
  ): Promise<LoginResult> => {
    try {
      const { authApi } = await import("@/lib/api");
      const res = await authApi.login(email, password);
      const role = res.role as UserRole;

      let userId: string = email; // fallback — will be overwritten for VENDOR
      if (role === "VENDOR") {
        const resolvedId = await resolveVendorId(email, res.accessToken);
        if (resolvedId) {
          userId = resolvedId;
          console.log("[useAuth] Resolved vendor UUID:", resolvedId);
        } else {
          console.error(
            "[useAuth] Could not resolve vendor UUID — user.id will be email.\n" +
            "Check: 1) GET /api/vendors/me is accessible with the JWT token\n" +
            "       2) VendorResponse includes an 'id' field\n" +
            "       3) The vendor record exists in the DB for email:", email
          );
        }
      }

      // Extract organizationId from token payload
      let organizationId: number | undefined;
      try {
        const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
        organizationId = payload.organizationId;
      } catch (e) {
        console.warn("[useAuth] Could not parse organizationId from token:", e);
      }

      const loggedInUser: AuthUser & { firstLogin?: boolean; organizationId?: number } = {
        id: userId,
        email,
        name: (res as any).name ?? email,
        role,
        firstLogin: res.firstLogin,
        organizationId,
      };

      setToken(res.accessToken);
      setUser(loggedInUser);
      localStorage.setItem("vms_token", res.accessToken);
      localStorage.setItem("vms_user", JSON.stringify(loggedInUser));

      return { role: res.role, firstLogin: res.firstLogin };

    } catch (err: unknown) {
      if (demoRole && isNetworkFailure(err)) {
        console.warn("Backend unreachable — falling back to demo mode");
        const demoUser = { ...DEMO_USERS[demoRole], firstLogin: false, organizationId: 1 };
        const demoToken = `demo-${demoRole.toLowerCase()}`;
        setToken(demoToken);
        setUser(demoUser);
        localStorage.setItem("vms_token", demoToken);
        localStorage.setItem("vms_user", JSON.stringify(demoUser));
        return { role: demoRole, firstLogin: false };
      }

      const message =
        err instanceof ApiError ? err.message
        : err instanceof Error  ? err.message
        : "Incorrect email or password. Please try again.";
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("vms_token");
    localStorage.removeItem("vms_user");
      window.location.href = "/";
  }, []);

  const perms = getPerms(user);

  const hasRouteAccess = useCallback((route: string) => {
    if (!user) return false;
    const p = ROLE_PERMISSIONS[user.role];
    if (!p) return false;
    return p.allowedRoutes.some((r) => route.startsWith(r));
  }, [user]);

  const registerOrganization = useCallback(async (
  orgName: string,
  slug: string,
  adminEmail: string,
): Promise<LoginResult> => {
  const { authApi } = await import("@/lib/api");
  const res = await authApi.registerOrganization({ orgName, slug, adminEmail });

  let organizationId: number | undefined;
  try {
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    organizationId = payload.organizationId;
  } catch (e) {
    console.warn("[useAuth] Could not parse organizationId from token:", e);
  }

  const loggedInUser: AuthUser & { firstLogin?: boolean; organizationId?: number } = {
    id: res.id ?? adminEmail,
    email: adminEmail,
    name: adminEmail,
    role: "ADMIN" as UserRole,
    firstLogin: res.firstLogin,
    organizationId,
  };

  setToken(res.accessToken);
  setUser(loggedInUser);
  localStorage.setItem("vms_token", res.accessToken);
  localStorage.setItem("vms_user", JSON.stringify(loggedInUser));

  return { role: "ADMIN", firstLogin: res.firstLogin };
}, []);

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!user && !!token,
      login, logout, hasRouteAccess,
      canApproveVendors:    perms.canApproveVendors,
      canProcessPayments:   perms.canProcessPayments,
      canRecordPayments:    perms.canRecordPayments,
      canManageVendors:     perms.canManageVendors,
      canViewAllData:       perms.canViewAllData,
      canCancelOrders:      perms.canCancelOrders,
      canUpdateOrderStatus: perms.canUpdateOrderStatus,
      getDefaultRoute: () => perms.defaultRoute,
      registerOrganization,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}