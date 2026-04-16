import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { vendorItemApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { VendorItem } from "@/types";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Package, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", description: "", unit: "", unitPrice: 0 };

export default function Catalog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const vendorId = user?.id ?? "";

  const [showAdd, setShowAdd]         = useState(false);
  const [editItem, setEditItem]       = useState<VendorItem | null>(null);
  const [form, setForm]               = useState({ ...emptyForm });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ── DATA ─────────────────────────────────────────────────────────── */

  const { data: items = [], isLoading, isError } = useQuery<VendorItem[]>({
    queryKey: ["catalog", vendorId],
    queryFn: () => vendorItemApi.getByVendor(vendorId) as Promise<VendorItem[]>,
    enabled: !!vendorId,
  });

  /* ── MUTATIONS ───────────────────────────────────────────────────── */

  const addMutation = useMutation({
    mutationFn: () =>
      vendorItemApi.add(vendorId, {
        name: form.name,
        description: form.description,
        unit: form.unit,
        unitPrice: form.unitPrice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", vendorId] });
      toast.success("Item added to catalog");
      setShowAdd(false);
      setForm({ ...emptyForm });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add item"),
  });

  const updateMutation = useMutation({
    mutationFn: (item: VendorItem) =>
      vendorItemApi.update(vendorId, item.id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", vendorId] });
      toast.success("Item updated");
      setEditItem(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update item"),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => vendorItemApi.remove(vendorId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", vendorId] });
      toast.success("Item removed from catalog");
      setConfirmDeleteId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete item");
      setConfirmDeleteId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (itemId: string) => vendorItemApi.toggle(vendorId, itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["catalog", vendorId] });
      const prev = queryClient.getQueryData<VendorItem[]>(["catalog", vendorId]);
      queryClient.setQueryData<VendorItem[]>(["catalog", vendorId], (old) =>
        (old ?? []).map((i) =>
          i.id === itemId ? { ...i, available: !i.available } : i
        )
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["catalog", vendorId], ctx.prev);
      toast.error("Failed to toggle availability");
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["catalog", vendorId] }),
  });

  /* ── HANDLERS ────────────────────────────────────────────────────── */

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Item name is required"); return; }
    if (form.unitPrice < 0) { toast.error("Unit price cannot be negative"); return; }
    addMutation.mutate();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editItem.name.trim()) { toast.error("Item name is required"); return; }
    updateMutation.mutate(editItem);
  };

  const openEdit = (item: VendorItem) => {
    setEditItem({ ...item });
    setShowAdd(false);
  };

  const closeForm = () => {
    setShowAdd(false);
    setEditItem(null);
  };

  /* ── DERIVED ─────────────────────────────────────────────────────── */

  const availableCount   = items.filter((i) => i.available).length;
  const unavailableCount = items.length - availableCount;

  /* ── RENDER ──────────────────────────────────────────────────────── */

  return (
    <AppLayout
      title="My Catalog"
      subtitle="Manage the items procurement can include in purchase orders"
    >
      {/* ── STAT CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Items
            </span>
            <Package size={16} className="text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold text-foreground">{items.length}</p>
          <p className="text-xs text-muted-foreground mt-1">In your catalog</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available
            </span>
            <CheckCircle2 size={16} className="text-success" />
          </div>
          <p className="text-2xl font-semibold" style={{ color: "hsl(var(--success))" }}>
            {availableCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Visible to procurement</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Unavailable
            </span>
            <ToggleLeft size={16} className="text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold text-muted-foreground">{unavailableCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Hidden from orders</p>
        </div>
      </div>

      {/* ── TOOLBAR ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Catalog Items</h2>
          <p className="text-xs text-muted-foreground">
            Items marked "Available" appear in purchase order forms
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditItem(null); }}
          className="btn-primary"
        >
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* ── ADD / EDIT FORM ──────────────────────────────────────── */}
      {(showAdd || editItem) && (
        <div className="bg-card border border-border rounded-xl p-5 mb-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {editItem ? "Edit Catalog Item" : "Add New Item"}
          </h3>

          <form onSubmit={editItem ? handleEditSubmit : handleAddSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Item Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={editItem ? editItem.name : form.name}
                  onChange={(e) =>
                    editItem
                      ? setEditItem({ ...editItem, name: e.target.value })
                      : setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Office Chair"
                  className="form-input"
                  required
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Unit</label>
                <input
                  value={editItem ? (editItem.unit ?? "") : form.unit}
                  onChange={(e) =>
                    editItem
                      ? setEditItem({ ...editItem, unit: e.target.value })
                      : setForm({ ...form, unit: e.target.value })
                  }
                  placeholder="e.g. piece, kg, box, set"
                  className="form-input"
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Unit Price (INR) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editItem ? editItem.unitPrice : form.unitPrice}
                  onChange={(e) =>
                    editItem
                      ? setEditItem({ ...editItem, unitPrice: Number(e.target.value) })
                      : setForm({ ...form, unitPrice: Number(e.target.value) })
                  }
                  className="form-input"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Description
                </label>
                <input
                  value={editItem ? (editItem.description ?? "") : form.description}
                  onChange={(e) =>
                    editItem
                      ? setEditItem({ ...editItem, description: e.target.value })
                      : setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional short description"
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {(addMutation.isPending || updateMutation.isPending) ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : editItem ? "Save Changes" : "Add Item"}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────────────── */}
      {isError && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          Failed to load catalog items. Please refresh and try again.
        </div>
      )}

      {/* ── LOADING ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2 size={18} className="animate-spin" /> Loading your catalog...
        </div>
      )}

      {/* ── TABLE ────────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Package size={24} className="text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">Your catalog is empty</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Add items to your catalog so procurement staff can select them when creating
                purchase orders.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="btn-primary mt-2"
              >
                <Plus size={14} /> Add Your First Item
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    {/* Name */}
                    <td className="font-medium text-foreground">{item.name}</td>

                    {/* Description */}
                    <td className="text-muted-foreground text-xs max-w-[200px] truncate">
                      {item.description || "—"}
                    </td>

                    {/* Unit */}
                    <td className="text-muted-foreground">{item.unit || "—"}</td>

                    {/* Price */}
                    <td className="font-semibold text-foreground">
                      ₹{item.unitPrice.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Availability toggle */}
                    <td>
                      <button
                        onClick={() => toggleMutation.mutate(item.id)}
                        disabled={toggleMutation.isPending}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-60 ${
                          item.available
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {item.available ? (
                          <><ToggleRight size={13} /> Available</>
                        ) : (
                          <><ToggleLeft size={13} /> Unavailable</>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit item"
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Delete with confirmation */}
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <span className="text-xs text-muted-foreground">Delete?</span>
                            <button
                              onClick={() => deleteMutation.mutate(item.id)}
                              disabled={deleteMutation.isPending}
                              className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                            >
                              {deleteMutation.isPending ? "..." : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-muted-foreground hover:underline"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer count */}
      {!isLoading && items.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          {items.length} item{items.length !== 1 ? "s" : ""} in catalog &nbsp;·&nbsp;
          {availableCount} available
        </p>
      )}
    </AppLayout>
  );
}
