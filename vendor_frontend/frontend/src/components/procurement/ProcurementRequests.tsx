import React, { useEffect, useState } from "react";
import { Search, Plus, Eye, Edit2, Trash2, CheckCircle, XCircle, FileText, Upload, ArrowUpDown, X, UserCheck } from "lucide-react";
import { procurementService } from "../../services/procurementService";
import type { ProcurementRequest, ProcurementStatus, ProcurementPriority } from "../../models/procurement";
import { ProcurementApproval } from "./ProcurementApproval";
import { VendorAssignment } from "./VendorAssignment";

const DEPARTMENTS = ["Engineering", "Operations", "Facilities", "Warehouse", "Product", "Design", "Health & Safety", "IT Infrastructure", "Admin", "Security", "Marketing"];
const CATEGORIES = ["IT Hardware", "Logistics Services", "Civil Works", "Heavy Equipment", "Professional Services", "IT Software", "Safety Equipment", "IT Services", "Office Furniture", "Security Systems", "Maintenance Services", "Print & Branding"];
const UNITS = ["Units", "Trips", "Contract", "Project", "Licenses", "Kits", "Service Contract", "Sets", "Annual Contract", "Pcs"];

const STATUS_COLORS: Record<ProcurementStatus, [string, string]> = {
  Pending:   ["#FFF3E0", "#E65100"],
  Approved:  ["#E8F5E9", "#2E7D32"],
  Ordered:   ["#EFF6FF", "#1565C0"],
  Delivered: ["#F3E8FF", "#6A1B9A"],
  Completed: ["#E8F5E9", "#1B5E20"],
  Cancelled: ["#FFEBEE", "#B71C1C"],
};

const PRIORITY_COLORS: Record<ProcurementPriority, [string, string]> = {
  Low:      ["#F9FAFB", "#667085"],
  Medium:   ["#EFF6FF", "#1565C0"],
  High:     ["#FFF3E0", "#E65100"],
  Critical: ["#FFEBEE", "#B71C1C"],
};

interface ProcurementRequestsProps {
  roleColor: string;
  currentRole?: string;
  userName?: string;
}

export function ProcurementRequests({ roleColor, currentRole = "Administrator", userName = "Test User" }: ProcurementRequestsProps) {
  const [items, setItems] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<"list" | "form" | "approve" | "assign">("list");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  
  // Sorting & Paging
  const [sortField, setSortField] = useState<keyof ProcurementRequest>("requestNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);

  // Form State
  const [editingRequest, setEditingRequest] = useState<ProcurementRequest | null>(null);
  const [requestTitle, setRequestTitle] = useState("");
  const [departmentName, setDepartmentName] = useState("Engineering");
  const [itemName, setItemName] = useState("");
  const [productCategory, setProductCategory] = useState("IT Hardware");
  const [quantity, setQuantity] = useState<number>(0);
  const [unitOfMeasurement, setUnitOfMeasurement] = useState("Units");
  const [estimatedBudget, setEstimatedBudget] = useState<number>(0);
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState("");
  const [priority, setPriority] = useState<ProcurementPriority>("Medium");
  const [businessJustification, setBusinessJustification] = useState("");
  const [additionalRemarks, setAdditionalRemarks] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dialogs & Messaging
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null);
  const [selectedReqForView, setSelectedReqForView] = useState<ProcurementRequest | null>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [confirmDeleteReq, setConfirmDeleteReq] = useState<ProcurementRequest | null>(null);
  const [confirmApproveReq, setConfirmApproveReq] = useState<ProcurementRequest | null>(null);
  const [confirmRejectReq, setConfirmRejectReq] = useState<ProcurementRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("Budget exceeded or vendor unavailable.");

  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const refreshList = () => {
    setLoading(true);
    procurementService.getRequests({ pageSize: 150 }).then(r => {
      setItems(r.items);
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshList();
  }, []);

  const triggerToast = (msg: string, type: "success" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!requestTitle.trim()) errs.requestTitle = "Request title is required";
    if (!itemName.trim()) errs.itemName = "Item/Product name is required";
    if (quantity <= 0) errs.quantity = "Quantity must be greater than 0";
    if (estimatedBudget <= 0) errs.estimatedBudget = "Budget must be positive numeric";
    if (!requiredDeliveryDate) {
      errs.requiredDeliveryDate = "Delivery date is required";
    } else if (requiredDeliveryDate < getTodayDateString()) {
      errs.requiredDeliveryDate = "Delivery date cannot be in the past";
    }
    if (!businessJustification.trim()) errs.businessJustification = "Business justification is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      requestTitle,
      departmentName,
      requestedBy: 1, // Simulated current user ID
      requestedByName: userName,
      itemName,
      productCategory,
      quantity,
      unitOfMeasurement,
      estimatedBudget,
      requiredDeliveryDate,
      priority,
      businessJustification,
      additionalRemarks,
      supportingDocumentUrl: uploadedFile ? uploadedFile.name : undefined
    };

    if (editingRequest) {
      procurementService.updateRequest(editingRequest.id, payload).then(r => {
        if (r) {
          triggerToast(`Request ${r.requestNumber} updated successfully!`);
          setViewState("list");
          refreshList();
        }
      });
    } else {
      procurementService.createRequest(payload).then(r => {
        triggerToast(`${isDraft ? "Draft saved" : "Request submitted"} successfully! Request Number: ${r.requestNumber}`);
        setViewState("list");
        refreshList();
      });
    }
  };

  const handleDelete = () => {
    if (!confirmDeleteReq) return;
    procurementService.deleteRequest(confirmDeleteReq.id).then(success => {
      if (success) {
        triggerToast(`Request ${confirmDeleteReq.requestNumber} deleted successfully.`, "info");
        setConfirmDeleteReq(null);
        refreshList();
      }
    });
  };

  const executeApprove = () => {
    if (!confirmApproveReq) return;
    procurementService.approveRequest(confirmApproveReq.id, 1, `Approved by ${userName}`).then(() => {
      triggerToast(`Request ${confirmApproveReq.requestNumber} has been approved.`);
      if (selectedReqForView?.id === confirmApproveReq.id) {
        setSelectedReqForView(prev => prev ? { ...prev, status: "Approved" } : null);
      }
      setConfirmApproveReq(null);
      refreshList();
    });
  };

  const executeReject = () => {
    if (!confirmRejectReq) return;
    procurementService.rejectRequest(confirmRejectReq.id, 1, rejectReason).then(() => {
      triggerToast(`Request ${confirmRejectReq.requestNumber} has been rejected.`, "info");
      if (selectedReqForView?.id === confirmRejectReq.id) {
        setSelectedReqForView(prev => prev ? { ...prev, status: "Cancelled" } : null);
      }
      setConfirmRejectReq(null);
      refreshList();
    });
  };

  const startNew = () => {
    setEditingRequest(null);
    setRequestTitle("");
    setDepartmentName("Engineering");
    setItemName("");
    setProductCategory("IT Hardware");
    setQuantity(1);
    setUnitOfMeasurement("Units");
    setEstimatedBudget(50000);
    setRequiredDeliveryDate(getTodayDateString());
    setPriority("Medium");
    setBusinessJustification("");
    setAdditionalRemarks("");
    setUploadedFile(null);
    setErrors({});
    setViewState("form");
  };

  const startEdit = (req: ProcurementRequest) => {
    setEditingRequest(req);
    setRequestTitle(req.requestTitle);
    setDepartmentName(req.departmentName);
    setItemName(req.itemName);
    setProductCategory(req.productCategory);
    setQuantity(req.quantity);
    setUnitOfMeasurement(req.unitOfMeasurement);
    setEstimatedBudget(req.estimatedBudget);
    setRequiredDeliveryDate(req.requiredDeliveryDate);
    setPriority(req.priority);
    setBusinessJustification(req.businessJustification);
    setAdditionalRemarks(req.additionalRemarks || "");
    setUploadedFile(req.supportingDocumentUrl ? { name: req.supportingDocumentUrl, size: "N/A" } : null);
    setErrors({});
    setViewState("form");
  };

  const handleOpenView = (req: ProcurementRequest) => {
    setSelectedReqForView(req);
    procurementService.getStatusHistory(req.id).then(h => setStatusHistory(h));
  };

  const triggerSort = (field: keyof ProcurementRequest) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const canAction = currentRole === "Administrator" || currentRole === "Procurement Manager";

  // Filter lists & sort
  const filtered = items.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q || r.requestNumber.toLowerCase().includes(q) || r.requestTitle.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || r.priority === priorityFilter;
    const matchesDept = deptFilter === "All" || r.departmentName === deptFilter;
    const matchesOwner = canAction || !userName || (r.requestedByName?.toLowerCase() ?? "") === userName.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority && matchesDept && matchesOwner;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField] ?? "";
    let bVal = b[sortField] ?? "";
    if (typeof aVal === "number" && typeof bVal === "number") return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    return sortOrder === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 };
  const pillStyle = (bg: string, fontColor: string): React.CSSProperties => ({ background: bg, color: fontColor, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "2px 8px", whiteSpace: "nowrap", display: "inline-block" });

  // Sub-view: Approval
  if (viewState === "approve" && selectedRequestId !== null) {
    return (
      <ProcurementApproval
        requestId={selectedRequestId}
        roleColor={roleColor}
        currentRole={currentRole}
        userName={userName}
        onBack={() => { setViewState("list"); refreshList(); }}
        onNavigateToAssign={id => { setSelectedRequestId(id); setViewState("assign"); }}
      />
    );
  }

  // Sub-view: Vendor Assignment
  if (viewState === "assign" && selectedRequestId !== null) {
    return (
      <VendorAssignment
        requestId={selectedRequestId}
        roleColor={roleColor}
        currentRole={currentRole}
        userName={userName}
        onBack={() => { setViewState("list"); refreshList(); }}
        onAssigned={() => { setViewState("list"); refreshList(); }}
      />
    );
  }

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Toast popup */}
      {toast && (
        <div style={{ zIndex: 99, position: "fixed", top: 20, right: 20, background: toast.type === "success" ? "#E8F5E9" : "#EFF6FF", border: `1px solid ${toast.type === "success" ? "#2E7D32" : "#1565C0" }`, color: toast.type === "success" ? "#2E7D32" : "#1565C0", borderRadius: 8, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
          <CheckCircle size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}><X size={14} /></button>
        </div>
      )}

      {viewState === "list" ? (
        <div>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Procurement Requests</h1>
              <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>Manage and track all sourcing requests across departments</p>
            </div>
            <button onClick={startNew} style={{ display: "flex", alignItems: "center", gap: 6, background: roleColor, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> New Request
            </button>
          </div>

          {/* Filters Bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search by request number, title or item..."
                style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }} style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" }}>
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }} style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" }}>
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" }}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Ordered">Ordered</option>
                <option value="Delivered">Delivered</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div style={cardStyle}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Loading requests...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {[
                        { label: "Request #", field: "requestNumber" },
                        { label: "Title", field: "requestTitle" },
                        { label: "Department", field: "departmentName" },
                        { label: "Requested By", field: "requestedByName" },
                        { label: "Vendor", field: "assignedVendorName" },
                        { label: "Priority", field: "priority" },
                        { label: "Budget (Est)", field: "estimatedBudget" },
                        { label: "Status", field: "status" },
                        { label: "Date", field: "createdAt" },
                        { label: "Actions", field: null }
                      ].map(h => (
                        <th
                          key={h.label}
                          onClick={() => h.field && triggerSort(h.field as keyof ProcurementRequest)}
                          style={{
                            padding: "10px 14px",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#667085",
                            textAlign: "left",
                            borderBottom: "1px solid #E4E7EC",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            cursor: h.field ? "pointer" : "default"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center" }}>
                            {h.label}
                            {h.field && <ArrowUpDown size={10} style={{ marginLeft: 4, color: sortField === h.field ? roleColor : "#9CA3AF" }} />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>No procurement requests matched your filters.</td></tr>
                    ) : (
                      paginated.map(r => {
                        const isPending = r.status === "Pending";
                        const isOwner = (r.requestedByName?.toLowerCase() ?? "") === userName.toLowerCase() || canAction;
                        const canEditOrDelete = isPending && isOwner && currentRole !== "Auditor" && currentRole !== "Vendor";
                        return (
                          <tr key={r.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td onClick={() => handleOpenView(r)} style={{ padding: "12px 14px", fontSize: 11, fontFamily: "monospace", color: roleColor, fontWeight: 700, cursor: "pointer" }}>{r.requestNumber}</td>
                            <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "#111827", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.requestTitle}>{r.requestTitle}</td>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>{r.departmentName}</td>
                            <td style={{ padding: "12px 14px", fontSize: 11, color: "#667085" }}>{r.requestedByName || `User ${r.requestedBy}`}</td>
                            <td style={{ padding: "12px 14px", fontSize: 11, color: "#667085", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.assignedVendorName || "—"}</td>
                            <td style={{ padding: "12px 14px" }}><span style={pillStyle(...PRIORITY_COLORS[r.priority])}>{r.priority}</span></td>
                            <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700 }}>₹{(r.estimatedBudget / 100000).toFixed(1)} L</td>
                            <td style={{ padding: "12px 14px" }}><span style={pillStyle(...STATUS_COLORS[r.status])}>{r.status}</span></td>
                            <td style={{ padding: "12px 14px", fontSize: 11, color: "#9CA3AF" }}>{r.createdAt.slice(0, 10)}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <button onClick={() => handleOpenView(r)} style={{ background: "none", border: "none", cursor: "pointer", color: roleColor }} title="View details"><Eye size={14} /></button>
                                <button
                                  disabled={!canEditOrDelete}
                                  onClick={() => startEdit(r)}
                                  style={{ background: "none", border: "none", cursor: canEditOrDelete ? "pointer" : "not-allowed", color: canEditOrDelete ? "#667085" : "#D1D5DB" }}
                                  title={canEditOrDelete ? "Edit" : "Only Pending requests owned by you can be edited"}
                                ><Edit2 size={13} /></button>
                                <button
                                  disabled={!canEditOrDelete}
                                  onClick={() => setConfirmDeleteReq(r)}
                                  style={{ background: "none", border: "none", cursor: canEditOrDelete ? "pointer" : "not-allowed", color: canEditOrDelete ? "#C62828" : "#F3B1B1" }}
                                  title={canEditOrDelete ? "Delete" : "Only Pending requests owned by you can be deleted"}
                                ><Trash2 size={13} /></button>
                                {canAction && isPending && (
                                  <div style={{ display: "flex", gap: 6, borderLeft: "1px solid #E4E7EC", paddingLeft: 8 }}>
                                    <button
                                      onClick={() => { setSelectedRequestId(r.id); setViewState("approve"); }}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#2E7D32" }}
                                      title="Open Approval Page"
                                    ><CheckCircle size={14} /></button>
                                    <button
                                      onClick={() => { setSelectedRequestId(r.id); setViewState("approve"); }}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#B71C1C" }}
                                      title="Open Approval Page (Reject)"
                                    ><XCircle size={14} /></button>
                                  </div>
                                )}
                                {canAction && r.status === "Approved" && (
                                  <div style={{ borderLeft: "1px solid #E4E7EC", paddingLeft: 8 }}>
                                    <button
                                      onClick={() => { setSelectedRequestId(r.id); setViewState("assign"); }}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: roleColor }}
                                      title="Assign Vendor"
                                    ><UserCheck size={14} /></button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 12, color: "#667085" }}>Page {currentPage} of {totalPages} (Showing {paginated.length} of {sorted.length} entries)</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ padding: "5px 12px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Prev</button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ padding: "5px 12px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Form view */
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>
                {editingRequest ? `Edit Request: ${editingRequest.requestNumber}` : "Create Sourcing Request"}
              </h1>
              <p style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>Submit operational details for budget and supplier authorization</p>
            </div>
            <button onClick={() => setViewState("list")} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Back to list</button>
          </div>

          <form onSubmit={e => handleSave(e, false)} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Title / Department */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>REQUEST TITLE *</label>
                <input
                  type="text" value={requestTitle} onChange={e => setRequestTitle(e.target.value)}
                  placeholder="e.g. Developer Workstations refresh"
                  style={{ width: "100%", padding: 9, boxSizing: "border-box", border: `1px solid ${errors.requestTitle ? "#B71C1C" : "#E4E7EC"}`, borderRadius: 6, fontSize: 13, outline: "none" }}
                />
                {errors.requestTitle && <span style={{ fontSize: 11, color: "#B71C1C", marginTop: 4, display: "block" }}>{errors.requestTitle}</span>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>DEPARTMENT NAME *</label>
                <select value={departmentName} onChange={e => setDepartmentName(e.target.value)} style={{ width: "100%", padding: 9, border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13 }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Requested By - read-only */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>REQUESTED BY</label>
                <input
                  type="text" value={userName} readOnly
                  style={{ width: "100%", padding: 9, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, background: "#F9FAFB", color: "#667085", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>PRODUCT CATEGORY *</label>
                <select value={productCategory} onChange={e => setProductCategory(e.target.value)} style={{ width: "100%", padding: 9, border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13 }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>ITEM/PRODUCT DETAILS *</label>
              <input
                type="text" value={itemName} onChange={e => setItemName(e.target.value)}
                placeholder="Product SKU, model, or description detail"
                style={{ width: "100%", padding: 9, boxSizing: "border-box", border: `1px solid ${errors.itemName ? "#B71C1C" : "#E4E7EC"}`, borderRadius: 6, fontSize: 13, outline: "none" }}
              />
              {errors.itemName && <span style={{ fontSize: 11, color: "#B71C1C", marginTop: 4, display: "block" }}>{errors.itemName}</span>}
            </div>

            {/* Quantity / Unit of measurement / Estimated budget */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>QUANTITY *</label>
                <input
                  type="number" value={quantity || ""} onChange={e => setQuantity(Number(e.target.value))}
                  style={{ width: "100%", padding: 9, boxSizing: "border-box", border: `1px solid ${errors.quantity ? "#B71C1C" : "#E4E7EC"}`, borderRadius: 6, fontSize: 13, outline: "none" }}
                />
                {errors.quantity && <span style={{ fontSize: 11, color: "#B71C1C", marginTop: 4, display: "block" }}>{errors.quantity}</span>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>UNIT OF MEASUREMENT *</label>
                <select value={unitOfMeasurement} onChange={e => setUnitOfMeasurement(e.target.value)} style={{ width: "100%", padding: 9, border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13 }}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>EST BUDGET (INR) *</label>
                <input
                  type="number" value={estimatedBudget || ""} onChange={e => setEstimatedBudget(Number(e.target.value))}
                  style={{ width: "100%", padding: 9, boxSizing: "border-box", border: `1px solid ${errors.estimatedBudget ? "#B71C1C" : "#E4E7EC"}`, borderRadius: 6, fontSize: 13, outline: "none" }}
                />
                <span style={{ fontSize: 10, color: "#667085", marginTop: 2, display: "block" }}>
                  {estimatedBudget > 0 ? `₹${estimatedBudget.toLocaleString("en-IN")} (${(estimatedBudget / 100000).toFixed(2)} L)` : "Type value"}
                </span>
                {errors.estimatedBudget && <span style={{ fontSize: 11, color: "#B71C1C", marginTop: 4, display: "block" }}>{errors.estimatedBudget}</span>}
              </div>
            </div>

            {/* Delivery Date / Priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>REQUIRED DELIVERY DATE *</label>
                <input
                  type="date" value={requiredDeliveryDate} min={getTodayDateString()} onChange={e => setRequiredDeliveryDate(e.target.value)}
                  style={{ width: "100%", padding: 9, boxSizing: "border-box", border: `1px solid ${errors.requiredDeliveryDate ? "#B71C1C" : "#E4E7EC"}`, borderRadius: 6, fontSize: 13, outline: "none" }}
                />
                {errors.requiredDeliveryDate && <span style={{ fontSize: 11, color: "#B71C1C", marginTop: 4, display: "block" }}>{errors.requiredDeliveryDate}</span>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>PRIORITY *</label>
                <select value={priority} onChange={e => setPriority(e.target.value as ProcurementPriority)} style={{ width: "100%", padding: 9, border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13 }}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Business Justification */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>BUSINESS JUSTIFICATION *</label>
              <textarea
                value={businessJustification} onChange={e => setBusinessJustification(e.target.value)}
                placeholder="Details on why this purchase is needed for company operations"
                rows={3}
                style={{ width: "100%", padding: 9, boxSizing: "border-box", border: `1px solid ${errors.businessJustification ? "#B71C1C" : "#E4E7EC"}`, borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical" }}
              />
              {errors.businessJustification && <span style={{ fontSize: 11, color: "#B71C1C", marginTop: 4, display: "block" }}>{errors.businessJustification}</span>}
            </div>

            {/* Remarks */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>ADDITIONAL REMARKS</label>
              <textarea
                value={additionalRemarks} onChange={e => setAdditionalRemarks(e.target.value)}
                placeholder="Spec requirements, vendor constraints, or shipment notes"
                rows={2}
                style={{ width: "100%", padding: 9, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical" }}
              />
            </div>

            {/* Document Upload */}
            <div style={{ background: "#F9FAFB", border: "1px dashed #B2C3DE", borderRadius: 8, padding: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#1565C0", marginBottom: 6 }}>SUPPORTING DOCUMENTS (Max 2MB)</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button type="button" onClick={() => document.getElementById("file-upload")?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #B2C3DE", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                  <Upload size={13} /> {uploadedFile ? "Change file" : "Upload document"}
                </button>
                <input
                  type="file" id="file-upload" style={{ display: "none" }}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setUploadedFile({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` });
                  }}
                />
                {uploadedFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "4px 8px", border: "1px solid #E4E7EC", borderRadius: 4 }}>
                    <FileText size={12} color="#1565C0" />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{uploadedFile.name} ({uploadedFile.size})</span>
                    <button type="button" onClick={() => setUploadedFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C62828" }}><X size={12} /></button>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: "#8E98A8" }}>Upload tender quotes, specs, or invoices</span>
                )}
              </div>
            </div>

            {/* Actions row */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10, borderTop: "1px solid #E4E7EC", paddingTop: 14 }}>
              <button type="button" onClick={() => setViewState("list")} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={(e) => handleSave(e, true)} style={{ padding: "8px 16px", background: "#EFF6FF", border: "1px solid #B2C3DE", color: "#1565C0", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Save Draft</button>
              <button type="submit" style={{ padding: "8px 20px", background: roleColor, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Submit Request</button>
            </div>
          </form>
        </div>
      )}

      {/* View Modal details dialog */}
      {selectedReqForView && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 750, maxHeight: "90vh", overflowY: "auto", border: "1px solid #E4E7EC", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E4E7EC", background: "#F9FAFB" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#111827" }}>{selectedReqForView.requestTitle}</h3>
                <span style={{ fontSize: 11, color: "#667085", fontFamily: "monospace" }}>ID: {selectedReqForView.requestNumber}</span>
              </div>
              <button onClick={() => setSelectedReqForView(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Approval status banner */}
              <div style={{ background: "#F9FAFB", border: "1px solid #E4E7EC", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 18 }}>
                  <div>
                    <span style={{ fontSize: 9, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>System Status</span>
                    <div style={{ marginTop: 2 }}><span style={pillStyle(...STATUS_COLORS[selectedReqForView.status])}>{selectedReqForView.status}</span></div>
                  </div>
                  <div>
                    <span style={{ fontSize: 9, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Priority</span>
                    <div style={{ marginTop: 2 }}><span style={pillStyle(...PRIORITY_COLORS[selectedReqForView.priority])}>{selectedReqForView.priority}</span></div>
                  </div>
                </div>

                {canAction && selectedReqForView.status === "Pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setConfirmApproveReq(selectedReqForView)} style={{ background: "#2E7D32", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={12} /> Approve</button>
                    <button onClick={() => { setConfirmRejectReq(selectedReqForView); setRejectReason("Budget exceeded or vendor unavailable."); }} style={{ background: "#C62828", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><XCircle size={12} /> Reject</button>
                  </div>
                )}
              </div>

              {/* Core Information Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 12, color: roleColor, fontWeight: 700, borderBottom: "1px solid #F1F5F9", paddingBottom: 4, marginBottom: 8 }}>PRODUCT & BUDGET</h4>
                  <table style={{ fontSize: 12, width: "100%" }}>
                    <tbody>
                      <tr><td style={{ color: "#667085", width: "40%", padding: "4px 0" }}>Product/Item</td><td style={{ fontWeight: 600 }}>{selectedReqForView.itemName}</td></tr>
                      <tr><td style={{ color: "#667085", padding: "4px 0" }}>Category</td><td>{selectedReqForView.productCategory}</td></tr>
                      <tr><td style={{ color: "#667085", padding: "4px 0" }}>UoM / Quantity</td><td style={{ fontWeight: 600 }}>{selectedReqForView.quantity} {selectedReqForView.unitOfMeasurement}</td></tr>
                      <tr><td style={{ color: "#667085", padding: "4px 0" }}>Estimated Budget</td><td style={{ fontWeight: 700 }}>₹{selectedReqForView.estimatedBudget.toLocaleString("en-IN")}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 style={{ fontSize: 12, color: roleColor, fontWeight: 700, borderBottom: "1px solid #F1F5F9", paddingBottom: 4, marginBottom: 8 }}>LOGISTICS & USER</h4>
                  <table style={{ fontSize: 12, width: "100%" }}>
                    <tbody>
                      <tr><td style={{ color: "#667085", width: "40%", padding: "4px 0" }}>Dept Name</td><td>{selectedReqForView.departmentName}</td></tr>
                      <tr><td style={{ color: "#667085", padding: "4px 0" }}>Requested By</td><td>{selectedReqForView.requestedByName || `ID: ${selectedReqForView.requestedBy}`}</td></tr>
                      <tr><td style={{ color: "#667085", padding: "4px 0" }}>Delivery Target</td><td style={{ fontWeight: 600 }}>{selectedReqForView.requiredDeliveryDate}</td></tr>
                      <tr><td style={{ color: "#667085", padding: "4px 0" }}>Assigned Vendor</td><td>{selectedReqForView.assignedVendorName || "No vendor assigned yet"}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Justification / Remarks */}
              <div>
                <h4 style={{ fontSize: 12, color: roleColor, fontWeight: 700, borderBottom: "1px solid #F1F5F9", paddingBottom: 4, marginBottom: 8 }}>JUSTIFICATION & REMARKS</h4>
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#667085" }}>BUSINESS JUSTIFICATION</div>
                  <div style={{ fontSize: 12, color: "#111827", marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedReqForView.businessJustification}</div>
                </div>
                {selectedReqForView.additionalRemarks && (
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#667085" }}>ADDITIONAL REMARKS</div>
                    <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>{selectedReqForView.additionalRemarks}</div>
                  </div>
                )}
              </div>

              {/* Supporting Document */}
              <div>
                <h4 style={{ fontSize: 12, color: roleColor, fontWeight: 700, borderBottom: "1px solid #F1F5F9", paddingBottom: 4, marginBottom: 8 }}>SUPPORTING ATTACHMENTS</h4>
                {selectedReqForView.supportingDocumentUrl ? (
                  <div style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: 8, display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", width: "fit-content" }}>
                    <FileText size={14} color="#1565C0" />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{selectedReqForView.supportingDocumentUrl}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>No attachment provided.</span>
                )}
              </div>

              {/* Status History Logs */}
              {statusHistory.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 12, color: roleColor, fontWeight: 700, borderBottom: "1px solid #F1F5F9", paddingBottom: 4, marginBottom: 8 }}>AUDIT TRAIL & STATUS HISTORY</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {statusHistory.map(h => (
                      <div key={h.id} style={{ fontSize: 11, color: "#374151", background: "#F9FAFB", padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E7EC" }}>
                        <span style={{ fontWeight: 700 }}>{h.newStatus}</span> by <b>{h.changedByName || `User ${h.changedBy}`}</b> on {h.changedAt.slice(0, 16).replace("T", " ")}
                        {h.remarks && <div style={{ fontSize: 10, color: "#667085", marginTop: 2 }}>Note: {h.remarks}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Timeline Metadata */}
              <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "right", borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
                Created: {selectedReqForView.createdAt.replace("T", " ").slice(0, 16)}
                {selectedReqForView.updatedAt && ` | Updated: ${selectedReqForView.updatedAt.replace("T", " ").slice(0, 16)}`}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px", borderTop: "1px solid #E4E7EC", background: "#F9FAFB", borderRadius: "0 0 16px 16px" }}>
              <button onClick={() => setSelectedReqForView(null)} style={{ background: roleColor, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Close Window</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      {confirmDeleteReq && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, width: "100%", maxWidth: 400, border: "1px solid #E4E7EC", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px 0" }}>Confirm Delete</h3>
            <p style={{ fontSize: 13, color: "#667085", margin: "0 0 20px 0" }}>
              Are you sure you want to delete request <b>{confirmDeleteReq.requestNumber}</b> ({confirmDeleteReq.requestTitle})? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmDeleteReq(null)} style={{ padding: "6px 14px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: "6px 14px", background: "#C62828", border: "none", color: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Delete Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Approve */}
      {confirmApproveReq && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, width: "100%", maxWidth: 420, border: "1px solid #E4E7EC", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px 0" }}>Confirm Sourcing Approval</h3>
            <p style={{ fontSize: 13, color: "#667085", margin: "0 0 20px 0" }}>
              Are you sure you want to authorize approval for request <b>{confirmApproveReq.requestNumber}</b> ({confirmApproveReq.requestTitle})? This moves the request to the approved queue.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmApproveReq(null)} style={{ padding: "6px 14px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={executeApprove} style={{ padding: "6px 14px", background: "#2E7D32", border: "none", color: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Approve Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Reject */}
      {confirmRejectReq && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, width: "100%", maxWidth: 420, border: "1px solid #E4E7EC", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px 0" }}>Confirm Sourcing Rejection</h3>
            <p style={{ fontSize: 13, color: "#667085", margin: "0 0 12px 0" }}>
              Please provide a brief reason for rejecting request <b>{confirmRejectReq.requestNumber}</b>:
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, outline: "none", display: "block", marginBottom: 20, resize: "none", fontFamily: "Inter, sans-serif" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmRejectReq(null)} style={{ padding: "6px 14px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={executeReject} style={{ padding: "6px 14px", background: "#C62828", border: "none", color: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Reject Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
