const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

//////////////////////////////////////////////////////
// CUSTOM ERROR WITH STATUS
//////////////////////////////////////////////////////

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

//////////////////////////////////////////////////////
// BASE REQUEST
//////////////////////////////////////////////////////

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("vms_token");

  // Skip demo mode check for now - allows testing without login
  // if (token?.startsWith('demo-')) {
  //   throw new ApiError("Demo mode: This action requires logging in with a real account.", 403);
  // }

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (networkErr: any) {
    throw new ApiError(
      "Unable to reach server. Please check your connection.",
      0,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");

    let message = `Request failed (${res.status}). Please try again.`;
    try {
      const parsed = JSON.parse(body);
      message = (parsed.message ?? parsed.error ?? body) || message;
    } catch {
      if (body) message = body;
    }

    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  // ✅ FIX: Try JSON first, fall back to plain text.
  //    Some endpoints return plain text (e.g. "Password updated successfully",
  //    "Vendor deleted successfully") — JSON.parse() on these throws
  //    "Unexpected token 'P'" which crashes the whole request.
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

//////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////

export interface DashboardResponse {
  stats: {
    vendors: number;
    orders: number;
    payments: number;
    performance: number;
  };
  vendorStatus: { status: string; value: number }[];
  paymentStatus: { status: string; value: number }[];
  ordersTrend: { month: string; orders: number }[];
}

//////////////////////////////////////////////////////
// AUTH
//////////////////////////////////////////////////////

export const authApi = {
  login: (email: string, password: string) =>
    request<{
      firstLogin: any;
      accessToken: string;
      refreshToken: string;
      role: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name?: string }) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  registerStaff: (data: { name: string; email: string; role: "PROCUREMENT" | "FINANCE" }) =>
    request<{ message: string }>("/api/auth/register-staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  changePassword: (email: string, newPassword: string) =>
    request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword }),
    }),
  registerOrganization: (data: { orgName: string; slug: string; adminEmail: string }) =>
    request<{
      accessToken: string;
      refreshToken: string;
      role: string;
      firstLogin: boolean;
      id?: string;
    }>("/api/auth/register-organization", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  registerVendor: (data: { companyName: string; contactPerson: string; email: string; phone: string; address: string; password: string }) =>
    request<{
      accessToken: string;
      refreshToken: string;
      role: string;
      firstLogin: boolean;
    }>("/api/auth/register-vendor", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

//////////////////////////////////////////////////////
// VENDORS
//////////////////////////////////////////////////////

export const vendorApi = {
  getAll: () => request<any[]>("/api/vendors"),
  getAllGlobal: () => request<any[]>("/api/vendors/all/global"),
  getById: (id: string) => request<any>(`/api/vendors/${id}`),
  create: (data: any) =>
    request("/api/vendors", { method: "POST", body: JSON.stringify(data) }),
  approve: (id: string) =>
    request(`/api/vendors/${id}/approve`, { method: "PUT" }),
  reject: (id: string) =>
    request(`/api/vendors/${id}/reject`, { method: "PUT" }),
  suspend: (id: string) =>
    request(`/api/vendors/${id}/suspend`, { method: "PUT" }),
  delete: (id: string) =>
    request(`/api/vendors/${id}`, { method: "DELETE" }),
  getMyProfile: (email: string) =>
    request<any>(`/api/vendors/me?email=${encodeURIComponent(email)}`),
  getMyVendors: (organizationId: number) =>
    request<any[]>(`/api/partnerships/vendors-for-org?organizationId=${organizationId}`),
};

//////////////////////////////////////////////////////
// ORDERS
//////////////////////////////////////////////////////

export const orderApi = {
  getAll: () => request<any[]>("/api/orders"),
  getById: (id: number) => request<any>(`/api/orders/${id}`),
  create: (data: any) =>
    request("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  getByVendor: async (vendorId: string, status?: string, page = 0, size = 10) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    const res = await request<any>(`/api/orders/vendor/${vendorId}?${params}`);
    if (Array.isArray(res)) return res as any[];
    if (Array.isArray(res?.content)) return res.content as any[];
    return [] as any[];
  },
  updateStatus: (id: number, status: string) =>
    request(`/api/orders/${id}/status?status=${status}`, { method: "PUT" }),
};

//////////////////////////////////////////////////////
// PAYMENTS
//////////////////////////////////////////////////////

export const paymentApi = {
  getAll: () => {
    const user = localStorage.getItem("vms_user");
    const userData = user ? JSON.parse(user) : null;
    const headers: Record<string, string> = {};
    
    if (userData?.role) {
      headers["X-User-Role"] = userData.role;
    }
    if (userData?.id) {
      headers["X-Vendor-Id"] = userData.id;
    }
    
    return request<any[]>("/api/payments", { headers });
  },
  create: (data: any) =>
    request("/api/payments", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request(`/api/payments/${id}/status?status=${status}`, { method: "PUT" }),
  getByVendor: (vendorId: string) =>
    request<any[]>(`/api/payments/vendor/${vendorId}`),
};

//////////////////////////////////////////////////////
// DOCUMENTS
//////////////////////////////////////////////////////

export const documentApi = {
  getAll: () => request<any[]>("/api/documents"),
  getByVendor: async (vendorId: string) => {
    const token = localStorage.getItem("vms_token");
    const res = await fetch(`${API_BASE_URL}/api/documents/vendor/${vendorId}`, {
      headers: token ? { 
        Authorization: `Bearer ${token}`,
        "X-User-Role": "VENDOR",
        "X-Organization-Id": ""
      } : {},
    });
    return res.json();
  },
  getVendorPartnerships: (vendorId: string) => 
    request<any[]>(`/api/documents/vendor-partnerships/${vendorId}`),
  getOrgPartnershipVendors: () => {
    const token = localStorage.getItem("vms_token");
    const res = fetch(`${API_BASE_URL}/api/documents/org-partnership-vendors`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.then(r => r.json());
  },
  getUploadUrl: (data: {
    fileName: string;
    contentType: string;
    vendorId: string;
    docType: string;
  }) =>
    request<{ uploadUrl: string; fileKey: string }>("/api/documents/upload", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  saveMetadata: (data: {
    vendorId: string;
    organizationId: string;
    docType: string;
    fileName: string;
    fileKey: string;
  }) =>
    request("/api/documents", { method: "POST", body: JSON.stringify(data) }),
  approve: (id: string) =>
    request(`/api/documents/${id}/approve`, { method: "PUT" }),
  reject: (id: string) =>
    request(`/api/documents/${id}/reject`, { method: "PUT" }),
  download: async (id: number) => {
    const token = localStorage.getItem("vms_token");
    return fetch(`${API_BASE_URL}/api/documents/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

//////////////////////////////////////////////////////
// PERFORMANCE
//////////////////////////////////////////////////////

export const performanceApi = {
  getAll: () => request<any[]>("/api/performance"),
  calculate: (vendorId: string) =>
    request(`/api/performance/calculate/${vendorId}`, { method: "POST" }),
  get: (vendorId: string) => request<any>(`/api/performance/${vendorId}`),
};

//////////////////////////////////////////////////////
// VENDOR CATALOG ITEMS
//////////////////////////////////////////////////////

export const vendorItemApi = {
  getByVendor: (vendorId: string) =>
    request<any[]>(`/api/vendors/${vendorId}/items`),
  getAvailable: (vendorId: string) =>
    request<any[]>(`/api/vendors/${vendorId}/items/available`),
  add: (vendorId: string, item: { name: string; description?: string; unit?: string; unitPrice: number }) =>
    request(`/api/vendors/${vendorId}/items`, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  update: (vendorId: string, itemId: string, item: any) =>
    request(`/api/vendors/${vendorId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),
  remove: (vendorId: string, itemId: string) =>
    request(`/api/vendors/${vendorId}/items/${itemId}`, { method: "DELETE" }),
  toggle: (vendorId: string, itemId: string) =>
    request(`/api/vendors/${vendorId}/items/${itemId}/toggle`, { method: "PUT" }),
};

//////////////////////////////////////////////////////
// DASHBOARD
//////////////////////////////////////////////////////

export const dashboardApi = {
  getStats: () => request<DashboardResponse>("/api/dashboard"),
};

//////////////////////////////////////////////////////
// INVOICES
//////////////////////////////////////////////////////

export const invoiceApi = {
  getAll: () => {
    const user = localStorage.getItem("vms_user");
    const userData = user ? JSON.parse(user) : null;
    const headers: Record<string, string> = {};
    
    if (userData?.role) {
      headers["X-User-Role"] = userData.role;
    }
    if (userData?.id) {
      headers["X-Vendor-Id"] = userData.id;
    }
    
    return request<any[]>("/api/invoices", { headers });
  },
  getById: (id: number) => request<any>(`/api/invoices/${id}`),
  getByOrderId: (orderId: number) => request<any>(`/api/invoices/order/${orderId}`),
  generate: (orderId: number) => request<any>(`/api/invoices/generate/${orderId}`, { method: "POST" }),
  markAsPaid: (id: number) => request<any>(`/api/invoices/${id}/paid`, { method: "PUT" }),
  send: (id: number) => request<any>(`/api/invoices/${id}/send`, { method: "PUT" }),
  getByVendor: (vendorId: string) => request<any[]>(`/api/invoices/vendor/${vendorId}`),
};

//////////////////////////////////////////////////////
// ORGANIZATIONS
//////////////////////////////////////////////////////

export const organizationApi = {
  getAll: () => request<any[]>("/api/organizations"),
  getById: (id: number) => request<any>(`/api/organizations/${id}`),
  getCurrent: () => request<any>("/api/organizations/me"),
  updateProfile: (data: any) =>
    request<any>("/api/organizations/profile", { method: "PUT", body: JSON.stringify(data) }),
  sendRequest: (data: { vendorId: string; message?: string }) =>
    request<any>("/api/organizations/request", { method: "POST", body: JSON.stringify(data) }),
  getMyRequests: (vendorId: string) => request<any[]>(`/api/organizations/requests/my?vendorId=${vendorId}`),
  getPendingRequests: (vendorId: string) => request<any[]>(`/api/organizations/requests/pending?vendorId=${vendorId}`),
  getAcceptedRequests: (vendorId: string) => request<any[]>(`/api/organizations/accepted?vendorId=${vendorId}`),
  getSentRequests: () => request<any[]>(`/api/organizations/requests/sent`),
  acceptRequest: (requestId: string, vendorId: string) =>
    request<any>(`/api/organizations/requests/${requestId}/accept?vendorId=${vendorId}`, { method: "PUT" }),
  declineRequest: (requestId: string, vendorId: string) =>
    request<any>(`/api/organizations/requests/${requestId}/decline?vendorId=${vendorId}`, { method: "PUT" }),
};