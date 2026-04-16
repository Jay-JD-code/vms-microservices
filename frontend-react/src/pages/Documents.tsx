import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { documentApi, vendorApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const DOC_TYPES = ["CONTRACT", "INSURANCE", "LICENSE", "TAX_FORM", "CERTIFICATE", "OTHER"];

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  CONTRACT:    { icon: "📋", color: "#1e40af", bg: "rgba(30,64,175,0.08)"  },
  INSURANCE:   { icon: "🛡️", color: "#065f46", bg: "rgba(6,95,70,0.08)"   },
  LICENSE:     { icon: "🪪", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  TAX_FORM:    { icon: "🧾", color: "#92400e", bg: "rgba(146,64,14,0.08)"  },
  CERTIFICATE: { icon: "🏅", color: "#b45309", bg: "rgba(180,83,9,0.08)"   },
  OTHER:       { icon: "📄", color: "#374151", bg: "rgba(55,65,81,0.08)"   },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  APPROVED: { label: "Approved", color: "#059669", bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.25)",  dot: "#059669" },
  REJECTED: { label: "Rejected", color: "#dc2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.25)",  dot: "#dc2626" },
  PENDING:  { label: "Pending",  color: "#d97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.25)",  dot: "#d97706" },
};

export default function Documents() {
  const queryClient = useQueryClient();
  const { canManageVendors, canViewAllData, user } = useAuth();

  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadVendorId, setUploadVendorId] = useState("");
  const [uploadOrgId, setUploadOrgId] = useState("");
  const [uploadDocType, setUploadDocType] = useState("CONTRACT");
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const { data: documents = [] } = useQuery({
    queryKey: canViewAllData ? ["documents"] : ["documents", "vendor", user?.id],
    queryFn: () => canViewAllData ? documentApi.getAll() : documentApi.getByVendor(user!.id),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: vendorApi.getAll,
    enabled: canManageVendors,
  });

  const { data: vendorPartnerships = [] } = useQuery({
    queryKey: ["vendor-partnerships", user?.id],
    queryFn: () => documentApi.getVendorPartnerships(user!.id),
    enabled: !canViewAllData && !!user?.id,
  });

  const { data: orgPartnershipVendorIds = [] } = useQuery({
    queryKey: ["org-partnership-vendors"],
    queryFn: () => documentApi.getOrgPartnershipVendors(),
    enabled: canViewAllData,
  });

  const approvedVendors = canViewAllData
    ? (vendors as any[]).filter((v: any) => 
        v.status === "APPROVED" && 
        (orgPartnershipVendorIds as any[]).includes(v.id)
      )
    : [];

  const grouped: any[] = canViewAllData
    ? (Object.values(
        (documents as any[]).reduce((acc: any, doc: any) => {
          if (!(orgPartnershipVendorIds as any[]).includes(doc.vendorId)) return acc;
          const vendor = (vendors as any[]).find((v: any) => v.id === doc.vendorId);
          const vendorName = doc.vendorName || vendor?.companyName || "Unknown Vendor";
          if (!acc[doc.vendorId]) acc[doc.vendorId] = { vendorId: doc.vendorId, vendorName, documents: [] };
          acc[doc.vendorId].documents.push(doc);
          return acc;
        }, {})
      ) as any[]).filter((v: any) => v.vendorName.toLowerCase().includes(search.toLowerCase()))
    : (documents as any[]).length > 0
    ? [{ vendorId: user!.id, vendorName: "My Documents", documents }]
    : [];

  useEffect(() => {
    if (!canViewAllData && grouped.length > 0 && !selectedVendor) {
      setSelectedVendor(grouped[0]);
    }
  }, [documents]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, vendorId, organizationId, docType }: any) => {
      const { uploadUrl, fileKey } = await documentApi.getUploadUrl({ fileName: file.name, contentType: file.type, vendorId, docType });
      await fetch(uploadUrl, { method: "PUT", body: file });
      await documentApi.saveMetadata({ vendorId, organizationId, docType, fileName: file.name, fileKey });
    },
    onSuccess: () => {
      toast.success("Document filed successfully");
      queryClient.invalidateQueries({ queryKey: canViewAllData ? ["documents"] : ["documents", "vendor", user?.id] });
      setShowUpload(false);
      setSelectedVendor(null);
      setUploadVendorId("");
      setUploadOrgId("");
      setDroppedFileName("");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: () => toast.error("Upload failed"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => documentApi.approve(id),
    onSuccess: () => { toast.success("Document approved"); queryClient.invalidateQueries({ queryKey: ["documents"] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => documentApi.reject(id),
    onSuccess: () => { toast.success("Document rejected"); queryClient.invalidateQueries({ queryKey: ["documents"] }); },
  });

  const handleUpload = (e: any) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    const effectiveVendorId = canViewAllData ? uploadVendorId : user!.id;
    const effectiveOrgId = canViewAllData ? "0" : uploadOrgId;
    if (!file) return toast.error("Select a file");
    if (canViewAllData && !uploadVendorId) return toast.error("Select a vendor");
    if (!canViewAllData && !uploadOrgId) return toast.error("Select an organization");
    uploadMutation.mutate({ file, vendorId: effectiveVendorId, organizationId: effectiveOrgId, docType: uploadDocType });
  };

  const handleDownload = async (id: number, fileName: string) => {
    const res = await documentApi.download(id);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalDocs = (documents as any[]).length;
  const pendingDocs = (documents as any[]).filter(d => !(d as any).status || (d as any).status === "PENDING").length;
  const approvedDocs = (documents as any[]).filter(d => (d as any).status === "APPROVED").length;

  return (
    <AppLayout title="Documents" subtitle="Vendor document management">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

        .doc-root {
          --cream: #faf8f4;
          --sand: #f3ede3;
          --sand-2: #ede5d8;
          --ink: #1a1510;
          --ink-2: #2d2820;
          --muted: #7a7268;
          --muted-2: #b5afa6;
          --accent: #c8a96e;
          --accent-dim: rgba(200,169,110,0.12);
          --accent-border: rgba(200,169,110,0.3);
          --border: rgba(26,21,16,0.1);
          --border-soft: rgba(26,21,16,0.06);
          background: var(--cream);
          min-height: 100vh;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
        }
        .doc-root .serif { font-family: 'Playfair Display', serif; }

        .tally-strip {
          display: flex;
          gap: 1px;
          background: var(--border);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 28px;
          border: 1px solid var(--border);
        }
        .tally-cell {
          flex: 1;
          background: white;
          padding: 16px 20px;
          text-align: center;
        }
        .tally-cell:first-child { border-radius: 11px 0 0 11px; }
        .tally-cell:last-child  { border-radius: 0 11px 11px 0; }

        .doc-search {
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
        .doc-search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
        .doc-search::placeholder { color: var(--muted-2); }

        .file-btn {
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
        }
        .file-btn:hover { background: var(--ink-2); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(26,21,16,0.2); }

        .folder-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .folder-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .folder-card:hover { box-shadow: 0 6px 28px rgba(26,21,16,0.1); transform: translateY(-2px); }
        .folder-card:hover::after { opacity: 1; }

        .folder-tab {
          position: absolute;
          top: -1px; left: 20px;
          background: var(--sand);
          border: 1px solid var(--border);
          border-bottom: none;
          border-radius: 6px 6px 0 0;
          padding: 3px 12px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .doc-paper {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 10px;
          display: grid;
          grid-template-columns: 44px 1fr auto;
          gap: 14px;
          align-items: center;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .doc-paper::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 22px; height: 22px;
          background: var(--sand);
          border-left: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          border-radius: 0 0 0 8px;
          clip-path: polygon(100% 0, 0 100%, 100% 100%);
        }
        .doc-paper:hover { box-shadow: 0 4px 20px rgba(26,21,16,0.08); transform: translateY(-1px); }

        .doc-type-badge {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .doc-action-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 7px;
          border: 1px solid;
          cursor: pointer;
          font-family: 'Mulish', sans-serif;
          letter-spacing: 0.03em;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .btn-dl       { background: rgba(26,21,16,0.05); color: var(--ink-2);  border-color: var(--border); }
        .btn-dl:hover { background: rgba(26,21,16,0.12); }
        .btn-ok       { background: rgba(5,150,105,0.08);  color: #059669; border-color: rgba(5,150,105,0.3); }
        .btn-ok:hover { background: rgba(5,150,105,0.18); }
        .btn-no       { background: rgba(220,38,38,0.06);  color: #dc2626; border-color: rgba(220,38,38,0.25); }
        .btn-no:hover { background: rgba(220,38,38,0.14); }

        .back-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--muted);
          background: none; border: none; cursor: pointer;
          padding: 0; margin-bottom: 20px;
          font-family: 'Mulish', sans-serif;
          transition: color 0.15s;
        }
        .back-link:hover { color: var(--ink); }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(20,15,10,0.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 50;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .modal-paper {
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 30px;
          width: 440px;
          animation: riseUp 0.22s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 24px 80px rgba(20,15,10,0.25), 0 0 0 1px rgba(200,169,110,0.15);
          position: relative;
          overflow: hidden;
        }
        .modal-paper::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            transparent, transparent 27px,
            rgba(26,21,16,0.04) 27px, rgba(26,21,16,0.04) 28px
          );
          pointer-events: none;
          border-radius: 20px;
        }
        @keyframes riseUp { from { opacity: 0; transform: translateY(18px) scale(0.97) } to { opacity: 1; transform: none } }

        .modal-field { margin-bottom: 14px; position: relative; z-index: 1; }
        .modal-label {
          display: block;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 5px;
        }
        .modal-select {
          width: 100%;
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-family: 'Mulish', sans-serif;
          color: var(--ink);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .modal-select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }

        .drop-zone {
          border: 2px dashed var(--accent-border);
          border-radius: 12px;
          padding: 28px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--accent-dim);
          position: relative; z-index: 1;
          margin-bottom: 16px;
        }
        .drop-zone.over { border-color: var(--accent); background: rgba(200,169,110,0.18); }
        .drop-zone:hover { border-color: var(--accent); }

        .modal-submit {
          background: var(--ink);
          color: var(--cream);
          border: none; border-radius: 10px;
          padding: 11px 0; width: 100%;
          font-size: 14px; font-weight: 700;
          font-family: 'Playfair Display', serif;
          cursor: pointer; transition: all 0.2s;
          letter-spacing: 0.02em;
          position: relative; z-index: 1;
        }
        .modal-submit:hover:not(:disabled) { background: var(--ink-2); box-shadow: 0 4px 20px rgba(26,21,16,0.25); }
        .modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .modal-cancel {
          background: transparent; color: var(--muted);
          border: 1px solid var(--border); border-radius: 10px;
          padding: 11px 0; width: 100%;
          font-size: 13px; font-weight: 600;
          font-family: 'Mulish', sans-serif;
          cursor: pointer; transition: all 0.15s;
          position: relative; z-index: 1;
        }
        .modal-cancel:hover { background: var(--sand); color: var(--ink); }

        @keyframes paperSlide {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .doc-paper { animation: paperSlide 0.3s ease both; }
        .doc-paper:nth-child(1) { animation-delay: 0.04s }
        .doc-paper:nth-child(2) { animation-delay: 0.09s }
        .doc-paper:nth-child(3) { animation-delay: 0.14s }
        .doc-paper:nth-child(4) { animation-delay: 0.19s }
        .doc-paper:nth-child(5) { animation-delay: 0.24s }

        @keyframes folderSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .folder-card { animation: folderSlide 0.3s ease both; }
        .folder-card:nth-child(1) { animation-delay: 0.04s }
        .folder-card:nth-child(2) { animation-delay: 0.09s }
        .folder-card:nth-child(3) { animation-delay: 0.14s }
        .folder-card:nth-child(4) { animation-delay: 0.19s }
        .folder-card:nth-child(5) { animation-delay: 0.24s }
      `}</style>

      <div className="doc-root">

        {/* ── TALLY STRIP ── */}
        <div className="tally-strip">
          {[
            { label: "Total Filed",     value: totalDocs,      color: "var(--ink)"  },
            { label: "Awaiting Review", value: pendingDocs,    color: "#d97706"     },
            { label: "Approved",        value: approvedDocs,   color: "#059669"     },
            { label: "Vendor Folders",  value: grouped.length, color: "var(--ink)"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="tally-cell">
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "4px" }}>{label}</p>
              <p className="serif" style={{ fontSize: "28px", fontWeight: 700, color, letterSpacing: "-0.02em", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px", gap: "12px", flexWrap: "wrap" }}>
          <div>
            {selectedVendor && canViewAllData && (
              <button className="back-link" onClick={() => setSelectedVendor(null)}>← All vendors</button>
            )}
            {!selectedVendor && (
              <div>
                <h2 className="serif" style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--ink)" }}>
                  {canViewAllData ? "Vendor Archive" : "My Documents"}
                </h2>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>
                  {grouped.length} folder{grouped.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
            {selectedVendor && (
              <div>
                <h2 className="serif" style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--ink)" }}>
                  {selectedVendor.vendorName}
                </h2>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>
                  {selectedVendor.documents.length} document{selectedVendor.documents.length !== 1 ? "s" : ""} on file
                </p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {canViewAllData && !selectedVendor && (
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)", fontSize: "13px" }}>⌕</span>
                <input
                  placeholder="Search vendors…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="doc-search"
                />
              </div>
            )}
            <button className="file-btn" onClick={() => setShowUpload(true)}>
              <span style={{ fontSize: "15px" }}>↑</span> File Document
            </button>
          </div>
        </div>

        {/* ── VENDOR FOLDER GRID ── */}
        {!selectedVendor && canViewAllData && (
          <>
            {grouped.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
                <div style={{ fontSize: "42px", marginBottom: "14px" }}>🗂️</div>
                <p className="serif" style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink-2)" }}>No folders found</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>Upload a document to create a vendor folder</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
                {grouped.map((v: any) => {
                  const pending  = v.documents.filter((d: any) => !d.status || d.status === "PENDING").length;
                  const approved = v.documents.filter((d: any) => d.status === "APPROVED").length;
                  const types = [...new Set(v.documents.map((d: any) => d.documentType))] as string[];
                  return (
                    <div key={v.vendorId} className="folder-card" onClick={() => setSelectedVendor(v)} style={{ paddingTop: "28px" }}>
                      <div className="folder-tab">Folder</div>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                        <div>
                          <p className="serif" style={{ fontWeight: 600, fontSize: "15px", color: "var(--ink)", margin: "0 0 3px", lineHeight: 1.3 }}>{v.vendorName}</p>
                          <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>{v.documents.length} documents</p>
                        </div>
                        <span style={{ color: "var(--muted-2)", fontSize: "18px", marginTop: "2px" }}>›</span>
                      </div>
                      <div style={{ display: "flex", gap: "4px", marginTop: "12px", flexWrap: "wrap" }}>
                        {types.slice(0, 4).map(t => (
                          <span key={t} style={{ fontSize: "16px", background: "var(--sand)", padding: "4px 6px", borderRadius: "6px", border: "1px solid var(--border-soft)" }}>
                            {TYPE_META[t]?.icon || "📄"}
                          </span>
                        ))}
                        {types.length > 4 && <span style={{ fontSize: "11px", color: "var(--muted)", alignSelf: "center", marginLeft: "2px" }}>+{types.length - 4}</span>}
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-soft)" }}>
                        {approved > 0 && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", background: "rgba(5,150,105,0.08)", padding: "2px 8px", borderRadius: "20px", border: "1px solid rgba(5,150,105,0.2)" }}>✓ {approved}</span>
                        )}
                        {pending > 0 && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", background: "rgba(217,119,6,0.08)", padding: "2px 8px", borderRadius: "20px", border: "1px solid rgba(217,119,6,0.2)" }}>⏳ {pending} pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── DOCUMENT PAPER STACK ── */}
        {selectedVendor && (
          <>
            {selectedVendor.documents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
                <div style={{ fontSize: "42px", marginBottom: "14px" }}>📭</div>
                <p className="serif" style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink-2)" }}>Empty folder</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>No documents have been filed yet</p>
              </div>
            ) : (
              <div>
                {(selectedVendor.documents as any[]).map((doc: any) => {
                  const status = doc.status || "PENDING";
                  const sm = STATUS_META[status] ?? STATUS_META.PENDING;
                  const tm = TYPE_META[doc.documentType] ?? TYPE_META.OTHER;
                  return (
                    <div key={doc.id} className="doc-paper">
                      <div className="doc-type-badge" style={{ background: tm.bg, border: `1px solid ${tm.color}20` }}>
                        {tm.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)", margin: "0 0 5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "24px" }}>
                          {doc.fileName}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", letterSpacing: "0.05em", textTransform: "uppercase", background: tm.bg, color: tm.color }}>
                            {doc.documentType}
                          </span>
                          <span className="status-pill" style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                            <span className="status-dot" style={{ background: sm.dot, boxShadow: `0 0 5px ${sm.dot}` }} />
                            {sm.label}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", flexShrink: 0 }}>
                        <button className="doc-action-btn btn-dl" onClick={() => handleDownload(doc.id, doc.fileName)}>↓ Download</button>
                        {canManageVendors && status === "PENDING" && (
                          <>
                            <button className="doc-action-btn btn-ok" onClick={() => approveMutation.mutate(doc.id)}>✓ Approve</button>
                            <button className="doc-action-btn btn-no" onClick={() => rejectMutation.mutate(doc.id)}>✕ Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{ textAlign: "center", padding: "20px 0 4px", color: "var(--muted-2)", fontSize: "12px", fontWeight: 500 }}>
                  {selectedVendor.documents.length} document{selectedVendor.documents.length !== 1 ? "s" : ""} on file
                </div>
              </div>
            )}
          </>
        )}

        {/* ── UPLOAD MODAL ── */}
        {showUpload && (
          <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <form className="modal-paper" onClick={e => e.stopPropagation()} onSubmit={handleUpload}>
              <div style={{ position: "relative", zIndex: 1, marginBottom: "20px" }}>
                <p className="serif" style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>File a Document</p>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>Attach a document to a vendor record</p>
              </div>

              {canViewAllData && (
                <div className="modal-field">
                  <label className="modal-label">Vendor (Partnership)</label>
                  <select value={uploadVendorId} onChange={e => setUploadVendorId(e.target.value)} className="modal-select">
                    <option value="">Choose a vendor with accepted partnership…</option>
                    {approvedVendors.map((v: any) => <option key={v.id} value={v.id}>{v.companyName}</option>)}
                  </select>
                </div>
              )}

              {!canViewAllData && (
                <div className="modal-field">
                  <label className="modal-label">Organization</label>
                  <select value={uploadOrgId} onChange={e => setUploadOrgId(e.target.value)} className="modal-select">
                    <option value="">Select an organization…</option>
                    {(vendorPartnerships as any[]).map((p: any) => (
                      <option key={p.organizationId} value={p.organizationId}>
                        {p.organizationName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-field">
                <label className="modal-label">Document Type</label>
                <select value={uploadDocType} onChange={e => setUploadDocType(e.target.value)} className="modal-select">
                  {DOC_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]?.icon} {t.replace("_", " ")}</option>)}
                </select>
              </div>

              <div
                className={`drop-zone${dragOver ? " over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f && fileRef.current) {
                    const dt = new DataTransfer(); dt.items.add(f);
                    fileRef.current.files = dt.files;
                    setDroppedFileName(f.name);
                  }
                }}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📎</div>
                {droppedFileName
                  ? <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>{droppedFileName}</p>
                  : <>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "0 0 2px" }}>Drop your file here</p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>or click to browse</p>
                  </>
                }
                <input
                  ref={fileRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={e => setDroppedFileName(e.target.files?.[0]?.name || "")}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", position: "relative", zIndex: 1 }}>
                <button type="button" className="modal-cancel" style={{ flex: 1 }} onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="modal-submit" style={{ flex: 2 }} disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Filing…" : "File Document"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}