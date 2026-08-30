/**
 * ProcurementPurchaseOrders – Module 3
 * Three sub-views: List | Create | Details
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Search, Plus, Eye, ArrowLeft, Printer, Download,
  CheckCircle, X, Truck, Package, AlertTriangle, Clock, FileText, AlertCircle
} from "lucide-react";
import { procurementService } from "../../services/procurementService";
import { reliabilityService } from "../../services/reliabilityService";
import type { PurchaseOrder, ProcurementRequest } from "../../models/procurement";

// ── Helpers ──────────────────────────────────────────────────────────────────

const toINR = (v: number) => `₹${v.toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().slice(0, 10);

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20,
};

const PO_STATUS_COLORS: Record<string, [string, string]> = {
  Draft:        ["#F9FAFB", "#667085"],
  Issued:       ["#EFF6FF", "#1565C0"],
  "In Transit": ["#FFF3E0", "#E65100"],
  Fulfilled:    ["#E8F5E9", "#2E7D32"],
  Cancelled:    ["#FFEBEE", "#B71C1C"],
};

const STEPPER_STAGES = ["Pending", "Approved", "Ordered", "Delivered", "Completed"] as const;

// ── Toast Helper ──────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 300,
      background: type === "success" ? "#E8F5E9" : "#FFEBEE",
      border: `1px solid ${type === "success" ? "#2E7D32" : "#C62828"}`,
      color: type === "success" ? "#2E7D32" : "#C62828",
      borderRadius: 8, padding: "12px 20px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
    }}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      <span style={{ fontSize: 13, fontWeight: 600 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={14} /></button>
    </div>
  );
}

// ── PO DETAILS ────────────────────────────────────────────────────────────────

function PODetails({ poId, roleColor, currentRole, userName, onBack }: {
  poId: number; roleColor: string; currentRole: string; userName: string; onBack: () => void;
}) {
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [req, setReq] = useState<ProcurementRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    procurementService.getPurchaseOrderById(poId).then(async p => {
      setPo(p);
      if (p) {
        const r = await procurementService.getRequestById(p.requestId);
        setReq(r);
      }
      setLoading(false);
    });
  }, [poId]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    showToast("PDF download requires html2canvas + jsPDF. Opening print dialog instead.");
    setTimeout(() => window.print(), 500);
  };

  const canUpdateStatus = currentRole === "Administrator" || currentRole === "Procurement Manager";

  const handleStatusUpdate = async () => {
    if (!po || !newStatus) return;
    await procurementService.updatePurchaseOrder(po.id, { poStatus: newStatus });
    setPo(prev => prev ? { ...prev, poStatus: newStatus } : null);
    setShowStatusDialog(false);
    showToast(`PO status updated to ${newStatus}.`);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>;
  if (!po) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Purchase order not found.</div>;

  const [pillBg, pillFg] = PO_STATUS_COLORS[po.poStatus] ?? ["#F9FAFB", "#667085"];
  const reqStatus = req?.status ?? "Ordered";
  const currentStageIdx = STEPPER_STAGES.indexOf(reqStatus as typeof STEPPER_STAGES[number]);

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #po-print-area, #po-print-area * { visibility: visible !important; }
          #po-print-area { position: fixed; inset: 0; background: white; padding: 32px; z-index: 9999; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Header */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Purchase Order Details</h1>
              <span style={{ fontSize: 12, color: "#667085" }}>Full document view</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {canUpdateStatus && (
              <button onClick={() => { setNewStatus(po.poStatus); setShowStatusDialog(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: `1px solid ${roleColor}`, color: roleColor, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Clock size={14} /> Update Status
              </button>
            )}
            <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
              <Printer size={14} /> Print
            </button>
            <button onClick={handleDownloadPDF} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: roleColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        {/* ── Document ── */}
        <div id="po-print-area" ref={printRef}>
          {/* Document Header */}
          <div style={{ ...card, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Purchase Order</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: roleColor, fontFamily: "monospace" }}>{po.poNumber}</div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>Date: {po.poDate ?? po.createdAt.slice(0, 10)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>VendorIQ</div>
              <div style={{ fontSize: 11, color: "#667085" }}>Enterprise Procurement Platform</div>
              <span style={{ marginTop: 8, display: "inline-block", background: pillBg, color: pillFg, fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "3px 12px" }}>{po.poStatus}</span>
            </div>
          </div>

          {/* Status Stepper */}
          {req && (
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#667085", marginBottom: 14 }}>REQUEST LIFECYCLE</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {STEPPER_STAGES.map((stage, idx) => {
                  const isCurrent = idx === currentStageIdx;
                  const isDone = idx < currentStageIdx;
                  const color = isDone ? "#2E7D32" : isCurrent ? roleColor : "#D1D5DB";
                  const textColor = isDone ? "#2E7D32" : isCurrent ? roleColor : "#9CA3AF";
                  return (
                    <React.Fragment key={stage}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: isDone ? "#E8F5E9" : isCurrent ? `${roleColor}15` : "#F9FAFB",
                          border: `2px solid ${color}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: 6,
                        }}>
                          {isDone
                            ? <CheckCircle size={16} color="#2E7D32" />
                            : <span style={{ fontSize: 12, fontWeight: 800, color }}>{idx + 1}</span>
                          }
                        </div>
                        <span style={{ fontSize: 10, fontWeight: isCurrent ? 800 : 600, color: textColor }}>{stage}</span>
                      </div>
                      {idx < STEPPER_STAGES.length - 1 && (
                        <div style={{ flex: 2, height: 2, background: idx < currentStageIdx ? "#2E7D32" : "#E4E7EC", marginBottom: 20 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Vendor Info */}
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 800, color: roleColor, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Vendor Information</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{po.vendorName}</div>
              {[
                ["PO Issued To", po.vendorName],
                ["Payment Terms", po.paymentTerms ?? "—"],
                ["Shipping Address", po.shippingAddress ?? "—"],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF", minWidth: 110 }}>{l}:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* PO Info */}
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 800, color: roleColor, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>PO Information</div>
              {[
                ["PO Number", po.poNumber],
                ["Request Number", po.requestNumber ?? `REQ-${po.requestId}`],
                ["PO Date", po.poDate ?? po.createdAt.slice(0, 10)],
                ["Expected Delivery", po.expectedDeliveryDate ?? "—"],
                ["Approved By", po.approvedByName ?? "—"],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF", minWidth: 120 }}>{l}:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", fontFamily: l === "PO Number" || l === "Request Number" ? "monospace" : "Inter, sans-serif" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ordered Products */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: roleColor, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Ordered Products</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["#", "Product / Service Description", "Qty", "Unit", "Unit Price", "Tax", "Total"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", fontSize: 10, fontWeight: 700, color: "#667085", textAlign: "left", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: "#667085" }}>01</td>
                  <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{po.productDetails}</td>
                  <td style={{ padding: "12px 12px", fontSize: 12 }}>{po.quantityOrdered}</td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: "#667085" }}>Units</td>
                  <td style={{ padding: "12px 12px", fontSize: 12, fontWeight: 700 }}>{toINR(po.unitPrice)}</td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: "#667085" }}>{po.taxDetails ?? "GST 18%"}</td>
                  <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 800, color: roleColor }}>{toINR(po.totalCost)}</td>
                </tr>
              </tbody>
            </table>

            {/* Total summary */}
            <div style={{ marginTop: 16, borderTop: "2px solid #E4E7EC", paddingTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <div style={{ minWidth: 260 }}>
                {[
                  ["Subtotal", toINR(po.unitPrice * po.quantityOrdered)],
                  ["Tax / GST", po.taxDetails ?? "18%"],
                  ["GRAND TOTAL", toINR(po.totalCost)],
                ].map(([l, v], i) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: i === 2 ? "2px solid #E4E7EC" : "none", marginTop: i === 2 ? 6 : 0 }}>
                    <span style={{ fontSize: i === 2 ? 13 : 12, fontWeight: i === 2 ? 800 : 600, color: i === 2 ? "#111827" : "#667085" }}>{l}</span>
                    <span style={{ fontSize: i === 2 ? 15 : 12, fontWeight: i === 2 ? 900 : 600, color: i === 2 ? roleColor : "#667085" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Request Info */}
          {req && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 800, color: roleColor, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Linked Procurement Request</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  ["Request Number", req.requestNumber],
                  ["Title", req.requestTitle],
                  ["Department", req.departmentName],
                  ["Requested By", req.requestedByName ?? `User ${req.requestedBy}`],
                  ["Priority", req.priority],
                  ["Est. Budget", toINR(req.estimatedBudget)],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Update Dialog */}
        {showStatusDialog && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
            <div style={{ background: "#fff", borderRadius: 14, width: 400, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Update PO Status</h3>
                <button onClick={() => setShowStatusDialog(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>SELECT NEW STATUS</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.keys(PO_STATUS_COLORS).map(s => (
                    <label key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1px solid ${newStatus === s ? roleColor : "#E4E7EC"}`, borderRadius: 8, cursor: "pointer", background: newStatus === s ? `${roleColor}08` : "#fff" }}>
                      <input type="radio" name="po-status" value={s} checked={newStatus === s} onChange={() => setNewStatus(s)} style={{ accentColor: roleColor }} />
                      <span style={{ fontSize: 13, fontWeight: newStatus === s ? 700 : 500 }}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setShowStatusDialog(false)} style={{ padding: "8px 16px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleStatusUpdate} style={{ padding: "8px 20px", background: roleColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Apply Status</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── PO CREATE FORM ────────────────────────────────────────────────────────────

interface VendorOption {
  id: number | string;
  name: string;
  category: string;
  reliabilityScore: number;
  riskLevel: string;
  recommendationStatus: string;
  code: string;
}

function POCreateForm({ roleColor, currentRole, userName, prefillRequestId, onSuccess, onCancel }: {
  roleColor: string; currentRole: string; userName: string;
  prefillRequestId?: number; onSuccess: (po: PurchaseOrder) => void; onCancel: () => void;
}) {
  const [approvedReqs, setApprovedReqs] = useState<ProcurementRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<ProcurementRequest | null>(null);
  const [allVendors, setAllVendors] = useState<VendorOption[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorOption | null>(null);
  const [isHighRiskVendor, setIsHighRiskVendor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Form fields
  const [productDetails, setProductDetails] = useState("");
  const [quantityOrdered, setQuantityOrdered] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxPct, setTaxPct] = useState(18);
  const [shippingAddress, setShippingAddress] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [poDate, setPoDate] = useState(today());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalCost = Math.round(quantityOrdered * unitPrice * (1 + taxPct / 100));

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    Promise.all([
      procurementService.getRequests({ status: "Approved", pageSize: 50 }),
      reliabilityService.generateRankings().toPromise(),
      procurementService.getApprovedVendors()
    ]).then(([r, rankings, approvedVendors]) => {
      const reqs = r.items;
      setApprovedReqs(reqs);

      // Build exhaustive list of all vendors in the system
      const vendorList: VendorOption[] = rankings.map(v => {
        const appV = approvedVendors.find(a => a.name.toLowerCase().includes(v.vendorName.toLowerCase()) || v.vendorName.toLowerCase().includes(a.name.toLowerCase()));
        return {
          id: v.vendorId,
          name: v.vendorName,
          category: v.vendorCategory || appV?.category || 'General',
          reliabilityScore: v.reliabilityScore,
          riskLevel: v.riskLevel,
          recommendationStatus: v.recommendationStatus,
          code: appV?.vendorCode || `VND-00${v.vendorId}`
        };
      });

      // Include any approved vendor not in rankings
      approvedVendors.forEach(appV => {
        if (!vendorList.some(v => v.name.toLowerCase().includes(appV.name.toLowerCase()))) {
          vendorList.push({
            id: appV.id,
            name: appV.name,
            category: appV.category,
            reliabilityScore: appV.reliabilityScore || 80,
            riskLevel: appV.reliabilityScore < 50 ? 'High Risk' : appV.reliabilityScore < 75 ? 'Medium Risk' : 'Low Risk',
            recommendationStatus: appV.reliabilityScore >= 85 ? 'Recommended' : 'Conditional',
            code: appV.vendorCode
          });
        }
      });

      setAllVendors(vendorList);

      const pref = prefillRequestId ? reqs.find(x => x.id === prefillRequestId) : reqs[0];
      if (pref) {
        applyRequest(pref, vendorList);
      } else if (vendorList.length > 0) {
        applyVendor(vendorList[0]);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillRequestId]);

  const applyVendor = (v: VendorOption) => {
    setSelectedVendor(v);
    setIsHighRiskVendor(v.riskLevel === "High Risk");
  };

  const applyRequest = (r: ProcurementRequest, vList: VendorOption[] = allVendors) => {
    setSelectedReq(r);
    setProductDetails(r.itemName);
    setQuantityOrdered(r.quantity);
    setUnitPrice(Math.round(r.estimatedBudget / Math.max(r.quantity, 1)));
    setExpectedDeliveryDate(r.requiredDeliveryDate);
    setShippingAddress("VendorIQ HQ, Hinjewadi Phase 2, Pune – 411057");

    if (r.assignedVendorName) {
      const match = vList.find(v => v.name.toLowerCase().includes(r.assignedVendorName!.toLowerCase()) || r.assignedVendorName!.toLowerCase().includes(v.name.toLowerCase()));
      if (match) {
        applyVendor(match);
      }
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedVendor) e.vendor = "Please select a target vendor from the vendor registry.";
    if (!productDetails.trim()) e.productDetails = "Product details are required.";
    if (quantityOrdered <= 0) e.qty = "Quantity must be > 0.";
    if (unitPrice <= 0) e.unitPrice = "Unit price must be > 0.";
    if (!expectedDeliveryDate) e.delivery = "Expected delivery date is required.";
    if (!paymentTerms) e.paymentTerms = "Select payment terms.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (draft = false) => {
    if (!validate() || !selectedVendor) return;
    setSubmitting(true);
    try {
      const po = await procurementService.createPurchaseOrder({
        requestId: selectedReq ? selectedReq.id : 0,
        requestNumber: selectedReq ? selectedReq.requestNumber : `REQ-DIRECT-${Date.now().toString().slice(-4)}`,
        vendorId: Number(selectedVendor.id) || 1,
        vendorName: selectedVendor.name,
        productDetails,
        quantityOrdered,
        unitPrice,
        totalCost,
        taxDetails: `GST ${taxPct}%`,
        shippingAddress,
        expectedDeliveryDate,
        paymentTerms,
        poStatus: draft ? "Draft" : "Issued",
        approvedBy: 1,
        approvedByName: userName,
        poDate,
      });
      showToast(draft ? `Draft saved — ${po.poNumber}` : `Purchase Order ${po.poNumber} generated!`);
      setTimeout(() => onSuccess(po), 1200);
    } catch {
      showToast("Failed to create PO. Please try again.", "error");
      setSubmitting(false);
    }
  };

  const inp = (err?: string): React.CSSProperties => ({
    width: "100%", padding: 9, boxSizing: "border-box",
    border: `1px solid ${err ? "#C62828" : "#E4E7EC"}`, borderRadius: 8,
    fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif",
  });
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading vendor registry & approved requests…</div>;

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onCancel} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Cancel
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Generate Purchase Order</h1>
          <span style={{ fontSize: 12, color: "#667085" }}>Create a PO by selecting any registered vendor or linking to an approved request</span>
        </div>
      </div>

      <div style={{ maxWidth: 820 }}>
        {/* Persistent High-Risk Vendor Warning Banner */}
        {isHighRiskVendor && selectedVendor && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 2px 8px rgba(183, 28, 28, 0.08)"
            }}
          >
            <AlertCircle size={22} color="#B71C1C" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#991B1B" }}>
                ⚠️ Warning: Selected vendor "{selectedVendor.name}" is classified as High Risk (Reliability: {selectedVendor.reliabilityScore}/100).
              </div>
              <div style={{ fontSize: 12, color: "#7F1D1D", marginTop: 2 }}>
                Additional manager authorization will be required upon submission.
              </div>
            </div>
          </div>
        )}

        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* PO Number & PO Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>PO NUMBER</label>
              <input readOnly value="Auto-generated on save" style={{ ...inp(), background: "#F9FAFB", color: "#9CA3AF" }} />
            </div>
            <div>
              <label style={lbl}>PO DATE</label>
              <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} style={inp()} />
            </div>
          </div>

          {/* Target Vendor (List of All Vendors) */}
          <div>
            <label style={lbl}>TARGET VENDOR (ALL VENDORS REGISTRY) <span style={{ color: "#C62828" }}>*</span></label>
            <select
              value={selectedVendor?.id ?? ""}
              onChange={e => {
                const v = allVendors.find(x => x.id === Number(e.target.value));
                if (v) applyVendor(v);
              }}
              style={{ ...inp(errors.vendor), cursor: "pointer", fontWeight: 600 }}
            >
              <option value="">— Select from all registered vendors —</option>
              {allVendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.category}) — Score: {v.reliabilityScore}/100 [{v.riskLevel}]
                </option>
              ))}
            </select>
            {errors.vendor && <span style={{ fontSize: 11, color: "#C62828", display: "block", marginTop: 4 }}>{errors.vendor}</span>}
          </div>

          {/* Selected Vendor Info Card */}
          {selectedVendor && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: selectedVendor.riskLevel === 'High Risk' ? '#FFEBEE' : selectedVendor.riskLevel === 'Medium Risk' ? '#FFF3E0' : '#E8F5E9', display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: selectedVendor.riskLevel === 'High Risk' ? '#C62828' : selectedVendor.riskLevel === 'Medium Risk' ? '#E65100' : '#2E7D32' }}>
                  {selectedVendor.reliabilityScore}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{selectedVendor.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{selectedVendor.code} · {selectedVendor.category}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "right", marginRight: 6 }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Reliability Score</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: selectedVendor.reliabilityScore >= 75 ? "#2E7D32" : selectedVendor.reliabilityScore >= 50 ? "#E65100" : "#C62828" }}>
                    {selectedVendor.reliabilityScore} / 100
                  </div>
                </div>

                <span style={{
                  padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: selectedVendor.riskLevel === 'High Risk' ? '#FFEBEE' : selectedVendor.riskLevel === 'Medium Risk' ? '#FFF3E0' : '#E8F5E9',
                  color: selectedVendor.riskLevel === 'High Risk' ? '#C62828' : selectedVendor.riskLevel === 'Medium Risk' ? '#E65100' : '#2E7D32',
                }}>
                  {selectedVendor.riskLevel}
                </span>

                <span style={{
                  padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: selectedVendor.recommendationStatus === 'Recommended' ? '#EEF4FF' : '#F5F5F5',
                  color: selectedVendor.recommendationStatus === 'Recommended' ? '#1565C0' : '#616161',
                }}>
                  {selectedVendor.recommendationStatus}
                </span>
              </div>
            </div>
          )}

          {/* Link to procurement request */}
          <div>
            <label style={lbl}>PROCUREMENT REQUEST LINK (OPTIONAL)</label>
            <select
              value={selectedReq?.id ?? ""}
              onChange={e => {
                const val = e.target.value;
                if (!val) {
                  setSelectedReq(null);
                } else {
                  const r = approvedReqs.find(x => x.id === Number(val));
                  if (r) applyRequest(r, allVendors);
                }
              }}
              style={{ ...inp(), cursor: "pointer" }}
            >
              <option value="">— Direct PO (No linked request) —</option>
              {approvedReqs.map(r => (
                <option key={r.id} value={r.id}>{r.requestNumber} — {r.requestTitle} ({r.assignedVendorName || 'Unassigned'})</option>
              ))}
            </select>
          </div>

          {selectedReq && (
            <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Linked Request</div><div style={{ fontSize: 12, fontWeight: 700 }}>{selectedReq.requestNumber}</div></div>
              <div><div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Dept</div><div style={{ fontSize: 12, fontWeight: 700 }}>{selectedReq.departmentName}</div></div>
              <div><div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Est. Budget</div><div style={{ fontSize: 12, fontWeight: 700 }}>{toINR(selectedReq.estimatedBudget)}</div></div>
            </div>
          )}

          {/* Product details */}
          <div>
            <label style={lbl}>PRODUCT / SERVICE DETAILS <span style={{ color: "#C62828" }}>*</span></label>
            <textarea value={productDetails} onChange={e => setProductDetails(e.target.value)} rows={2} style={{ ...inp(errors.productDetails), resize: "vertical" }} placeholder="Describe the ordered product or service" />
            {errors.productDetails && <span style={{ fontSize: 11, color: "#C62828", display: "block", marginTop: 4 }}>{errors.productDetails}</span>}
          </div>

          {/* Qty / Unit Price / Tax / Total */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.4fr", gap: 14, alignItems: "end" }}>
            <div>
              <label style={lbl}>QUANTITY <span style={{ color: "#C62828" }}>*</span></label>
              <input type="number" min={1} value={quantityOrdered} onChange={e => setQuantityOrdered(Number(e.target.value))} style={inp(errors.qty)} />
              {errors.qty && <span style={{ fontSize: 11, color: "#C62828", display: "block", marginTop: 4 }}>{errors.qty}</span>}
            </div>
            <div>
              <label style={lbl}>UNIT PRICE (INR) <span style={{ color: "#C62828" }}>*</span></label>
              <input type="number" min={0} value={unitPrice || ""} onChange={e => setUnitPrice(Number(e.target.value))} style={inp(errors.unitPrice)} placeholder="0" />
              {errors.unitPrice && <span style={{ fontSize: 11, color: "#C62828", display: "block", marginTop: 4 }}>{errors.unitPrice}</span>}
            </div>
            <div>
              <label style={lbl}>TAX (%)</label>
              <input type="number" min={0} max={100} value={taxPct} onChange={e => setTaxPct(Number(e.target.value))} style={inp()} />
            </div>
            <div>
              <label style={lbl}>TOTAL COST (LIVE)</label>
              <div style={{ padding: "9px 14px", background: `${roleColor}10`, border: `2px solid ${roleColor}`, borderRadius: 8, fontSize: 16, fontWeight: 900, color: roleColor }}>
                {toINR(totalCost)}
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>qty × unit price + tax</div>
            </div>
          </div>

          {/* Delivery / payment */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>EXPECTED DELIVERY <span style={{ color: "#C62828" }}>*</span></label>
              <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} style={inp(errors.delivery)} />
              {errors.delivery && <span style={{ fontSize: 11, color: "#C62828", display: "block", marginTop: 4 }}>{errors.delivery}</span>}
            </div>
            <div>
              <label style={lbl}>PAYMENT TERMS <span style={{ color: "#C62828" }}>*</span></label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} style={{ ...inp(errors.paymentTerms), cursor: "pointer" }}>
                {["Net 15", "Net 30", "Net 45", "Advance", "On Delivery"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>SHIPPING ADDRESS</label>
              <input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} style={inp()} placeholder="Delivery location" />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #E4E7EC", paddingTop: 16 }}>
            <button onClick={onCancel} style={{ padding: "9px 18px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            <button onClick={() => handleSubmit(true)} disabled={submitting} style={{ padding: "9px 18px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1565C0", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              <FileText size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Save Draft
            </button>
            <button onClick={() => handleSubmit(false)} disabled={submitting} style={{ padding: "9px 22px", background: roleColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle size={15} /> {submitting ? "Generating…" : "Generate Purchase Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PO LIST (main export) ─────────────────────────────────────────────────────

type ViewMode = "list" | "create" | "details";

interface Props {
  roleColor: string;
  currentRole?: string;
  userName?: string;
  userVendorName?: string;
}

export function ProcurementPurchaseOrders({ roleColor, currentRole = "Administrator", userName = "Test User", userVendorName }: Props) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [activePOId, setActivePOId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const PAGE_SIZE = 8;

  const isVendor = currentRole === "Vendor";
  const canCreate = currentRole === "Administrator" || currentRole === "Procurement Manager";

  const load = () => {
    setLoading(true);
    procurementService.getPurchaseOrders({ pageSize: 100 }).then(r => {
      setOrders(r.items);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = orders.filter(po => {
    const q = search.toLowerCase();
    const matchSearch = !q || po.poNumber.toLowerCase().includes(q) || po.vendorName.toLowerCase().includes(q) || (po.requestNumber ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || po.poStatus === statusFilter;
    const matchVendor = vendorFilter === "All" || po.vendorName === vendorFilter;
    const matchRole = !isVendor || (!!userVendorName && po.vendorName.toLowerCase().includes(userVendorName.toLowerCase()));
    return matchSearch && matchStatus && matchVendor && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const vendorOptions = ["All", ...Array.from(new Set(orders.map(o => o.vendorName)))];

  if (view === "create") {
    return (
      <POCreateForm
        roleColor={roleColor}
        currentRole={currentRole}
        userName={userName}
        onSuccess={po => {
          showToast(`PO ${po.poNumber} created successfully!`);
          load();
          setView("list");
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "details" && activePOId !== null) {
    return (
      <PODetails
        poId={activePOId}
        roleColor={roleColor}
        currentRole={currentRole}
        userName={userName}
        onBack={() => { setView("list"); load(); }}
      />
    );
  }

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Purchase Orders</h1>
          <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>View and manage all procurement purchase orders</p>
        </div>
        {canCreate && (
          <button onClick={() => setView("create")} style={{ display: "flex", alignItems: "center", gap: 6, background: roleColor, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> New PO
          </button>
        )}
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total POs",  val: filtered.length,                                        color: roleColor },
          { label: "Issued",     val: filtered.filter(p => p.poStatus === "Issued").length,   color: "#1565C0" },
          { label: "In Transit", val: filtered.filter(p => p.poStatus === "In Transit").length, color: "#E65100" },
          { label: "Fulfilled",  val: filtered.filter(p => p.poStatus === "Fulfilled").length, color: "#2E7D32" },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, marginTop: 6 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search PO number, vendor, request…" style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" }}>
          <option value="All">All Statuses</option>
          {Object.keys(PO_STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {!isVendor && (
          <select value={vendorFilter} onChange={e => { setVendorFilter(e.target.value); setCurrentPage(1); }} style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" }}>
            {vendorOptions.map(v => <option key={v} value={v}>{v === "All" ? "All Vendors" : v}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Loading purchase orders…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["PO Number", "Request #", "Vendor", "Total Cost", "Qty", "Expected Delivery", "PO Date", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", textAlign: "left", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>No purchase orders found.</td></tr>
                )}
                {paginated.map(po => {
                  const [bg, fg] = PO_STATUS_COLORS[po.poStatus] ?? ["#F9FAFB", "#667085"];
                  return (
                    <tr key={po.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 12px", fontSize: 11, fontFamily: "monospace", color: roleColor, fontWeight: 700 }}>{po.poNumber}</td>
                      <td style={{ padding: "12px 12px", fontSize: 11, color: "#667085" }}>{po.requestNumber ?? `—`}</td>
                      <td style={{ padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "#111827", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{po.vendorName}</td>
                      <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 800, color: "#111827" }}>{toINR(po.totalCost)}</td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#374151" }}>{po.quantityOrdered}</td>
                      <td style={{ padding: "12px 12px", fontSize: 11, color: "#667085" }}>{po.expectedDeliveryDate ?? "—"}</td>
                      <td style={{ padding: "12px 12px", fontSize: 11, color: "#9CA3AF" }}>{po.poDate ?? po.createdAt.slice(0, 10)}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ background: bg, color: fg, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "3px 9px" }}>{po.poStatus}</span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <button
                          onClick={() => { setActivePOId(po.id); setView("details"); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: roleColor, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
                          title="View PO Details"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 12, color: "#667085" }}>Page {currentPage} of {totalPages} · {filtered.length} orders</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: "5px 12px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Prev</button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: "5px 12px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
