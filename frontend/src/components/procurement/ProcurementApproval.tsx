import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, FileText, AlertTriangle, X, Clock } from "lucide-react";
import { procurementService } from "../../services/procurementService";
import type { ProcurementRequest, StatusHistoryEntry } from "../../models/procurement";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 };
const pill = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "3px 10px", display: "inline-block" });

const STATUS_COLORS: Record<string, [string, string]> = {
  Pending:   ["#FFF3E0", "#E65100"],
  Approved:  ["#E8F5E9", "#2E7D32"],
  Ordered:   ["#EFF6FF", "#1565C0"],
  Delivered: ["#F3E8FF", "#6A1B9A"],
  Completed: ["#E8F5E9", "#1B5E20"],
  Cancelled: ["#FFEBEE", "#B71C1C"],
};

const PRIORITY_COLORS: Record<string, [string, string]> = {
  Low:      ["#F9FAFB", "#667085"],
  Medium:   ["#EFF6FF", "#1565C0"],
  High:     ["#FFF3E0", "#E65100"],
  Critical: ["#FFEBEE", "#B71C1C"],
};

type DialogType = "approve" | "reject" | "sendback" | null;

interface Props {
  requestId: number;
  roleColor: string;
  currentRole: string;
  userName: string;
  onBack: () => void;
  onNavigateToAssign?: (id: number) => void;
}

export function ProcurementApproval({ requestId, roleColor, currentRole, userName, onBack, onNavigateToAssign }: Props) {
  const [req, setReq] = useState<ProcurementRequest | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canAction = currentRole === "Administrator" || currentRole === "Procurement Manager";

  useEffect(() => {
    setLoading(true);
    procurementService.getRequestById(requestId).then(r => {
      setReq(r);
      setLoading(false);
    });
    procurementService.getStatusHistory(requestId).then(setHistory);
  }, [requestId]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const openDialog = (type: DialogType) => {
    setRemarks("");
    setRemarksError("");
    setDialog(type);
  };

  const handleConfirm = async () => {
    if ((dialog === "reject" || dialog === "sendback") && !remarks.trim()) {
      setRemarksError("Remarks are required for this action.");
      return;
    }
    if (!req) return;
    setSubmitting(true);
    try {
      if (dialog === "approve") {
        await procurementService.approveRequest(req.id, 1, userName, remarks || undefined);
        setReq(prev => prev ? { ...prev, status: "Approved" } : null);
        showToast(`Request ${req.requestNumber} approved successfully.`);
      } else if (dialog === "reject") {
        await procurementService.rejectRequest(req.id, 1, userName, remarks);
        setReq(prev => prev ? { ...prev, status: "Cancelled" } : null);
        showToast(`Request ${req.requestNumber} rejected.`, "error");
      } else if (dialog === "sendback") {
        await procurementService.sendBackRequest(req.id, 1, userName, remarks);
        setReq(prev => prev ? { ...prev, status: "Pending" } : null);
        showToast(`Request ${req.requestNumber} sent back for modification.`);
      }
      procurementService.getStatusHistory(req.id).then(setHistory);
      setDialog(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canAction) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <div style={{ background: "#FFEBEE", border: "1px solid #C62828", borderRadius: 12, padding: 24, maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <AlertTriangle size={32} color="#C62828" style={{ marginBottom: 12 }} />
          <h2 style={{ color: "#C62828", fontSize: 18, fontWeight: 800 }}>Access Denied</h2>
          <p style={{ color: "#667085", fontSize: 13, marginTop: 8 }}>Only Procurement Managers and Administrators can access Approval workflows.</p>
          <button onClick={onBack} style={{ marginTop: 16, padding: "8px 18px", background: "#C62828", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Go Back</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading request details…</div>;
  if (!req) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Request not found.</div>;

  const isPending = req.status === "Pending";

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, background: toast.type === "success" ? "#E8F5E9" : "#FFEBEE", border: `1px solid ${toast.type === "success" ? "#2E7D32" : "#C62828"}`, color: toast.type === "success" ? "#2E7D32" : "#C62828", borderRadius: 8, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Requests
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Approval Review</h1>
          <span style={{ fontSize: 12, color: "#667085" }}>Review and take action on procurement request</span>
        </div>
      </div>

      {/* Status Banner */}
      <div style={{ ...card, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", marginBottom: 4 }}>REQUEST NUMBER</div>
            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: roleColor }}>{req.requestNumber}</span>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", marginBottom: 4 }}>STATUS</div>
            <span style={pill(...(STATUS_COLORS[req.status] ?? ["#F9FAFB", "#667085"]))}>{req.status}</span>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", marginBottom: 4 }}>PRIORITY</div>
            <span style={pill(...(PRIORITY_COLORS[req.priority] ?? ["#F9FAFB", "#667085"]))}>{req.priority}</span>
          </div>
        </div>
        {isPending && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => openDialog("approve")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#2E7D32", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <CheckCircle size={15} /> Approve Request
            </button>
            <button onClick={() => openDialog("sendback")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#E65100", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <RotateCcw size={15} /> Send Back
            </button>
            <button onClick={() => openDialog("reject")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#C62828", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <XCircle size={15} /> Reject
            </button>
          </div>
        )}
        {req.status === "Approved" && !req.assignedVendorId && !req.assignedVendorName && onNavigateToAssign && (
          <button onClick={() => onNavigateToAssign(req.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: roleColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Assign Vendor →
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Request Details */}
          <div style={card}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: roleColor, margin: "0 0 14px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Request Information</h3>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{req.requestTitle}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              {[
                ["Department", req.departmentName],
                ["Requested By", req.requestedByName || `User ${req.requestedBy}`],
                ["Item / Product", req.itemName],
                ["Category", req.productCategory],
                ["Quantity", `${req.quantity} ${req.unitOfMeasurement}`],
                ["Required By", req.requiredDeliveryDate],
                ["Estimated Budget", `₹${req.estimatedBudget.toLocaleString("en-IN")}`],
                ["Created On", req.createdAt.slice(0, 10)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting Document */}
          <div style={card}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: roleColor, margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Supporting Document</h3>
            {req.supportingDocumentUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 14px" }}>
                <FileText size={18} color="#1565C0" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1565C0" }}>{req.supportingDocumentUrl}</div>
                  <div style={{ fontSize: 10, color: "#667085" }}>Attached document</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>No document attached.</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Justification */}
          <div style={card}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: roleColor, margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Business Justification</h3>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#F9FAFB", borderRadius: 8, padding: 12 }}>{req.businessJustification}</div>
            {req.additionalRemarks && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>Additional Remarks</div>
                <div style={{ fontSize: 12, color: "#667085", background: "#F9FAFB", borderRadius: 8, padding: 10 }}>{req.additionalRemarks}</div>
              </div>
            )}
          </div>

          {/* Status History */}
          <div style={{ ...card, flex: 1 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: roleColor, margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Audit Trail</h3>
            {history.length === 0 ? (
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>No history yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map(h => (
                  <div key={h.id} style={{ borderLeft: `3px solid ${roleColor}`, paddingLeft: 10, paddingBottom: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Clock size={11} color="#9CA3AF" />
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{h.changedAt.slice(0, 16).replace("T", " ")}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginTop: 2 }}>
                      {h.oldStatus ? `${h.oldStatus} → ` : ""}<span style={{ color: roleColor }}>{h.newStatus}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#667085" }}>by {h.changedByName || `User ${h.changedBy}`}</div>
                    {h.remarks && <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, fontStyle: "italic" }}>{h.remarks}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {dialog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: dialog === "approve" ? "#2E7D32" : dialog === "sendback" ? "#E65100" : "#C62828" }}>
                {dialog === "approve" ? "✓ Approve Request" : dialog === "sendback" ? "↩ Send Back for Modification" : "✕ Reject Request"}
              </h3>
              <button onClick={() => setDialog(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 16 }}>
              {dialog === "approve"
                ? `You are approving request ${req.requestNumber} — ${req.requestTitle}. This will move it to the Approved queue.`
                : dialog === "sendback"
                ? `Request ${req.requestNumber} will be returned to Pending status for the requester to amend and re-submit.`
                : `Request ${req.requestNumber} will be permanently rejected and moved to Cancelled status.`}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                REVIEWER REMARKS {(dialog === "reject" || dialog === "sendback") ? <span style={{ color: "#C62828" }}>*</span> : "(optional)"}
              </label>
              <textarea
                value={remarks}
                onChange={e => { setRemarks(e.target.value); setRemarksError(""); }}
                rows={3}
                placeholder={dialog === "approve" ? "Add notes about this approval (optional)…" : "Provide a clear reason…"}
                style={{ width: "100%", boxSizing: "border-box", padding: 10, border: `1px solid ${remarksError ? "#C62828" : "#E4E7EC"}`, borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "Inter, sans-serif" }}
              />
              {remarksError && <div style={{ fontSize: 11, color: "#C62828", marginTop: 4 }}>{remarksError}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setDialog(null)} style={{ padding: "8px 16px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                style={{ padding: "8px 20px", background: dialog === "approve" ? "#2E7D32" : dialog === "sendback" ? "#E65100" : "#C62828", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Processing…" : dialog === "approve" ? "Confirm Approval" : dialog === "sendback" ? "Send Back" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
