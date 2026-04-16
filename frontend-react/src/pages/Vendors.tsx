import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { vendorApi, organizationApi } from "@/lib/api";
import { mockVendors } from "@/lib/mock-data";
import type { VendorStatus, VendorRequest } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Filter, Loader2, Send, Eye, Building2, UserCheck, X, Users, Globe } from "lucide-react";
import { toast } from "sonner";

const emptyForm: VendorRequest = { companyName: "", contactPerson: "", email: "", phone: "", address: "" };

export default function Vendors() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "ALL">("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<VendorRequest>({ ...emptyForm });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const isOrgUser = user?.role === "ADMIN" || user?.role === "PROCUREMENT";
  const isVendor = user?.role === "VENDOR";
  const isMasterAdmin = user?.role === "MASTER_ADMIN";
  const organizationId = user?.organizationId;

  const { data: myVendors = [], isLoading: loadingMyVendors } = useQuery({
    queryKey: ["my-vendors", organizationId],
    queryFn: () => vendorApi.getMyVendors(organizationId!),
    enabled: !!organizationId && (isOrgUser || isVendor),
  });

  const { data: allVendors = mockVendors, isLoading } = useQuery({
    queryKey: ["all-vendors"],
    queryFn: vendorApi.getAllGlobal,
    enabled: isOrgUser || isMasterAdmin,
  });

  const sendRequestMutation = useMutation({
    mutationFn: ({ vendorId, message }: { vendorId: string; message?: string }) =>
      organizationApi.sendRequest({ vendorId, message }),
    onSuccess: () => {
      toast.success("Partnership request sent to vendor!");
      queryClient.invalidateQueries({ queryKey: ["my-vendors"] });
      setShowRequestModal(false);
      setSelectedVendor(null);
      setRequestMessage("");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to send request"),
  });

  const createMutation = useMutation({
    mutationFn: (data: VendorRequest) => vendorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-vendors"] });
      toast.success("Vendor registered successfully");
      setShowAddForm(false);
      setForm({ ...emptyForm });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to register vendor"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) { toast.error("Company name is required"); return; }
    createMutation.mutate(form);
  };

  const filteredMyVendors = myVendors.filter((v: any) => {
    const matchSearch =
      v.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredAllVendors = allVendors.filter((v: any) => {
    const matchSearch =
      v.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
    const notYetPartner = !myVendors.some((mv: any) => mv.id === v.id);
    return matchSearch && matchStatus && notYetPartner;
  });

  return (
    <AppLayout title="Vendor Management" subtitle="Manage and monitor vendor relationships">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 pr-3 text-xs bg-card border border-input rounded-md w-56 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VendorStatus | "ALL")}
              className="h-8 px-2 text-xs bg-card border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
        {isVendor && (
          <a
            href="/register-vendor"
            className="flex items-center gap-1.5 h-8 px-3 bg-green-600 text-white text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Register as Vendor
          </a>
        )}
      </div>

      {/* My Vendors Section - for ORG users and VENDOR users */}
      {(isOrgUser || isVendor) && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-green-600" />
            <h2 className="text-sm font-semibold text-foreground">My Vendors</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {myVendors.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Vendors you have partnered with. You can create orders to these vendors.</p>

          {loadingMyVendors ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 size={18} className="animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <div className="bg-card border border-border rounded-md overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMyVendors.map((vendor: any) => (
                    <tr key={vendor.id}>
                      <td className="font-medium text-foreground">{vendor.companyName}</td>
                      <td>{vendor.contactPerson || "-"}</td>
                      <td className="text-muted-foreground">{vendor.email || "-"}</td>
                      <td className="text-muted-foreground">{vendor.phone || "-"}</td>
                      <td><StatusBadge status={vendor.status} /></td>
                      <td>
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMyVendors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted-foreground py-8">
                        No vendor partnerships yet. Browse available vendors below to send a request.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Vendors Section - for ORG users and MASTER_ADMIN */}
      {(isOrgUser || isMasterAdmin) && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isMasterAdmin ? <Users size={16} className="text-purple-600" /> : <Globe size={16} className="text-amber-600" />}
            <h2 className="text-sm font-semibold text-foreground">
              {isMasterAdmin ? "All Vendors" : "Available Vendors"}
            </h2>
            <span className="text-xs text-muted-foreground bg-amber-50 px-2 py-0.5 rounded-full">
              {filteredAllVendors.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {isMasterAdmin 
              ? "Manage and approve vendor registrations" 
              : "Browse and request partnerships with vendors. They will appear in My Vendors after accepting."}
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 size={18} className="animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <div className="bg-card border border-border rounded-md overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllVendors.map((vendor: any) => (
                    <tr key={vendor.id}>
                      <td className="font-medium text-foreground">{vendor.companyName}</td>
                      <td>{vendor.contactPerson || "-"}</td>
                      <td className="text-muted-foreground">{vendor.email || "-"}</td>
                      <td className="text-muted-foreground">{vendor.phone || "-"}</td>
                      <td><StatusBadge status={vendor.status} /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedVendor(vendor)}
                            className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                          >
                            <Eye size={12} /> View
                          </button>
                          {!isMasterAdmin && (
                            <button
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setShowRequestModal(true);
                              }}
                              className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
                            >
                              <Send size={12} /> Request
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAllVendors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted-foreground py-8">
                        No available vendors to request.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && !showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedVendor(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-b from-amber-50 to-white px-6 py-5 border-b border-amber-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-800">{selectedVendor.companyName}</h2>
                <p className="text-xs text-amber-600 mt-1">Vendor Details</p>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</span>
                  <StatusBadge status={selectedVendor.status} />
                </div>
                <div className="flex justify-between py-3 border-b border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Contact Person</span>
                  <span className="text-sm text-stone-800 font-medium">{selectedVendor.contactPerson || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Email</span>
                  <span className="text-sm text-stone-800 font-medium">{selectedVendor.email || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Phone</span>
                  <span className="text-sm text-stone-800 font-medium">{selectedVendor.phone || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Address</span>
                  <span className="text-sm text-stone-800 font-medium">{selectedVendor.address || "-"}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Registered</span>
                  <span className="text-sm text-stone-800 font-medium">{selectedVendor.createdAt || "-"}</span>
                </div>
              </div>
            </div>
            {isOrgUser && !isMasterAdmin && (
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full h-10 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Send Partnership Request
                </button>
              </div>
            )}
            {isMasterAdmin && selectedVendor?.status === "PENDING" && (
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex gap-3">
                <button
                  onClick={() => {
                    vendorApi.reject(selectedVendor.id).then(() => {
                      toast.success("Vendor rejected");
                      queryClient.invalidateQueries({ queryKey: ["all-vendors"] });
                      setSelectedVendor(null);
                    }).catch((err: Error) => toast.error(err.message));
                  }}
                  className="flex-1 h-10 rounded-lg bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    vendorApi.approve(selectedVendor.id).then(() => {
                      toast.success("Vendor approved");
                      queryClient.invalidateQueries({ queryKey: ["all-vendors"] });
                      setSelectedVendor(null);
                    }).catch((err: Error) => toast.error(err.message));
                  }}
                  className="flex-1 h-10 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Request Modal */}
      {showRequestModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowRequestModal(false); setSelectedVendor(null); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-b from-amber-50 to-white px-6 py-5 border-b border-amber-100">
              <h2 className="text-xl font-serif font-bold text-stone-800">Send Partnership Request</h2>
              <p className="text-xs text-stone-500 mt-1">Request to partner with {selectedVendor.companyName}</p>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Building2 size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800">{selectedVendor.companyName}</p>
                    <p className="text-xs text-stone-500">{selectedVendor.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-2">Message (optional)</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Add a message to introduce your organization..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex gap-3">
              <button
                onClick={() => { setShowRequestModal(false); setSelectedVendor(null); setRequestMessage(""); }}
                className="flex-1 h-10 rounded-lg bg-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendRequestMutation.mutate({ vendorId: selectedVendor.id, message: requestMessage })}
                disabled={sendRequestMutation.isPending}
                className="flex-1 h-10 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendRequestMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
