import { useEffect, useState } from "react";
import { 
  Search, CheckCircle, XCircle, Clock, IndianRupee, 
  Upload, FileText, Download, X, AlertTriangle, Eye, ShieldAlert 
} from "lucide-react";
import { procurementService } from "../../services/procurementService";
import type { Invoice, InvoicePaymentStatus, PurchaseOrder, OrderTracking } from "../../models/procurement";

const cardStyle = { 
  background: "#fff", 
  border: "1px solid #E4E7EC", 
  borderRadius: 12, 
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
};

const pillStyle = (bg: string, color: string): React.CSSProperties => ({ 
  background: bg, 
  color, 
  fontSize: 10, 
  fontWeight: 700, 
  borderRadius: 100, 
  padding: "3px 9px",
  display: "inline-flex",
  alignItems: "center",
  gap: 4
});

const STATUS_COLORS: Record<InvoicePaymentStatus, [string, string]> = {
  Pending:  ["#FFFAEB", "#B54708"],
  Verified: ["#EFF6FF", "#1565C0"],
  Approved: ["#F9F5FF", "#6941C6"],
  Paid:     ["#ECFDF5", "#047857"],
  Rejected: ["#FEF2F2", "#B91C1C"],
};

function toINR(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

interface Props {
  roleColor: string;
  currentRole?: string;
  userName?: string;
  userVendorName?: string;
}

export function ProcurementInvoices({ roleColor, currentRole = "Administrator", userName = "Test User", userVendorName }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [trackingRecords, setTrackingRecords] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoicePaymentStatus | "All">("All");

  // State Dialogs
  const [showUpload, setShowUpload] = useState(false);
  const [showRemarksDialog, setShowRemarksDialog] = useState<Invoice | null>(null);
  const [remarksReason, setRemarksReason] = useState("");
  const [remarksError, setRemarksError] = useState("");
  
  // Upload Fields Form
  const [selectedPOId, setSelectedPOId] = useState<number | "">("");
  const [invoiceNumberInput, setInvoiceNumberInput] = useState("");
  const [invoiceDateInput, setInvoiceDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [amountInput, setAmountInput] = useState<number>(0);
  const [taxPctInput, setTaxPctInput] = useState<number>(18); // Default GST 18%
  const [dueDateInput, setDueDateInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [toastMsg, setToastMsg] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const isVendor = currentRole === "Vendor";
  const isFinanceOrAdmin = currentRole === "Finance Officer" || currentRole === "Administrator";

  const loadData = () => {
    setLoading(true);
    Promise.all([
      procurementService.getInvoices(),
      procurementService.getPurchaseOrders({ pageSize: 150 }),
      procurementService.getAllTracking()
    ]).then(([invData, poData, trackData]) => {
      setInvoices(invData);
      setPurchaseOrders(poData.items);
      setTrackingRecords(trackData);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Find delivered POs for Vendor select option
  const deliveredPOsOptions = purchaseOrders.filter(po => {
    if (!userVendorName) return false;
    const isMine = po.vendorName.toLowerCase().includes(userVendorName.toLowerCase());
    const tracking = trackingRecords.find(t => t.poId === po.id);
    const isDelivered = tracking && (tracking.deliveryStatus === "Delivered" || tracking.deliveryStatus === "Completed" || po.poStatus === "Fulfilled");
    return isMine && isDelivered;
  });

  const handlePOSlowSelected = (poId: number) => {
    setSelectedPOId(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setAmountInput(po.totalCost);
      // Pre-calculate due date based on payment terms if possible, else default +30 days
      const terms = po.paymentTerms || "";
      const days = terms.toLowerCase().includes("15") ? 15 
                 : terms.toLowerCase().includes("30") ? 30 
                 : terms.toLowerCase().includes("45") ? 45 
                 : 30;
      const due = new Date();
      due.setDate(due.getDate() + days);
      setDueDateInput(due.toISOString().slice(0, 10));
    }
  };

  const handleUploadSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!selectedPOId) errs.po = "Please select a target purchase order.";
    if (!invoiceNumberInput.trim()) errs.invoiceNumber = "Invoice Number is required.";
    if (amountInput <= 0) errs.amount = "Invoice Amount must be positive.";
    if (!dueDateInput) errs.dueDate = "Due Date is required.";
    
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const matchedPO = purchaseOrders.find(p => p.id === Number(selectedPOId));
    if (!matchedPO) return;

    const baseAmount = Number(amountInput);
    const taxAmount = (baseAmount * Number(taxPctInput)) / 100;
    const totalAmount = baseAmount + taxAmount;

    const payload = {
      invoiceNumber: invoiceNumberInput.trim(),
      poId: matchedPO.id,
      poNumber: matchedPO.poNumber,
      vendorId: matchedPO.vendorId,
      vendorName: matchedPO.vendorName,
      invoiceDate: invoiceDateInput,
      invoiceAmount: baseAmount,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      dueDate: dueDateInput,
      paymentStatus: "Pending" as const,
      invoiceDocumentUrl: selectedFile?.name || "digitized_invoice_rec.pdf",
    };

    await procurementService.uploadInvoice(payload);
    // Reset Form
    setShowUpload(false);
    setSelectedPOId("");
    setInvoiceNumberInput("");
    setAmountInput(0);
    setSelectedFile(null);
    setFormErrors({});
    triggerToast("Invoice uploaded successfully in Pending Review status!");
    loadData();
  };

  const handleVerify = async (id: number) => {
    await procurementService.verifyInvoice(id, 4, userName || "Finance Officer");
    triggerToast("Invoice verified successfully.");
    loadData();
  };

  const handleApprove = async (id: number) => {
    await procurementService.approveInvoice(id);
    triggerToast("Payment approved. Invoice is marked as Approved.");
    loadData();
  };

  const handleProcessPayment = async (id: number) => {
    await procurementService.markInvoicePaid(id);
    triggerToast("Payment disbursed successfully. Invoice marked as Paid.", "success");
    loadData();
  };

  const handleOpenReject = (inv: Invoice) => {
    setShowRemarksDialog(inv);
    setRemarksReason("");
    setRemarksError("");
  };

  const handleConfirmReject = async () => {
    if (!showRemarksDialog) return;
    if (!remarksReason.trim()) {
      setRemarksError("Remarks/Rejection reason is required.");
      return;
    }

    await procurementService.rejectInvoice(showRemarksDialog.id, remarksReason.trim());
    setShowRemarksDialog(null);
    triggerToast("Invoice has been rejected.", "error");
    loadData();
  };

  // Filter list
  const filtered = invoices.filter(inv => {
    const isOwner = !isVendor || (!!userVendorName && inv.vendorName.toLowerCase().includes(userVendorName.toLowerCase()));
    if (!isOwner) return false;

    const q = search.toLowerCase();
    const matchSearch = !q 
      || inv.invoiceNumber.toLowerCase().includes(q) 
      || inv.vendorName.toLowerCase().includes(q) 
      || (inv.poNumber ?? "").toLowerCase().includes(q);

    const matchStatus = statusFilter === "All" || inv.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInvoicesValue = filtered.reduce((s, i) => s + i.totalAmount, 0);
  const pendingReviewCount = filtered.filter(i => i.paymentStatus === "Pending").length;
  const paidSum = filtered.filter(i => i.paymentStatus === "Paid").reduce((s, i) => s + i.totalAmount, 0);
  const awaitingPaymentSum = filtered.filter(i => i.paymentStatus === "Approved" || i.paymentStatus === "Verified").reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 300,
          background: toastMsg.type === "success" ? "#ECFDF5" : "#FEF2F2",
          border: `1px solid ${toastMsg.type === "success" ? "#04785730" : "#B91C1C30"}`,
          color: toastMsg.type === "success" ? "#047857" : "#B91C1C",
          borderRadius: 8, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        }}>
          {toastMsg.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toastMsg.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Procurement Invoices</h1>
          <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
            {isVendor ? `Supplier Invoice Portal · ${userVendorName}` : "Process, review Sourcing invoices, and disburse check payments"}
          </p>
        </div>
        {isVendor && (
          <button 
            onClick={() => setShowUpload(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: roleColor, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 650, cursor: "pointer" }}
          >
            <Upload size={14} /> Upload Invoice
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Total volume</span>
            <IndianRupee size={16} color={roleColor} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6, color: "#111827" }}>{toINR(totalInvoicesValue)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Pending review</span>
            <Clock size={16} color="#B54708" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6, color: "#B54708" }}>{pendingReviewCount} Invoices</div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Disbursed / Paid</span>
            <CheckCircle size={16} color="#047857" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6, color: "#047857" }}>{toINR(paidSum)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Awaiting Disbursal</span>
            <AlertTriangle size={16} color="#1565C0" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6, color: "#1565C0" }}>{toINR(awaitingPaymentSum)}</div>
        </div>
      </div>

      {/* Filter Options */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by invoice number, PO number or vendor..."
            style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 13, outline: "none" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as InvoicePaymentStatus | "All")}
          style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending Review</option>
          <option value="Verified">Verified</option>
          <option value="Approved">Approved</option>
          <option value="Paid">Paid</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Invoice Table */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Loading Billing Ledger...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No invoices found matching current criteria.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Invoice #</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>PO #</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Vendor</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Invoice Date</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Due Date</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Tax</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Total Amt</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const hasRemarks = !!inv.remarks;
                  return (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px", fontSize: 12, fontFamily: "monospace", color: roleColor, fontWeight: 700 }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: "12px", fontSize: 12, fontFamily: "monospace", color: "#667085" }}>{inv.poNumber ?? "—"}</td>
                      <td style={{ padding: "12px", fontSize: 12, fontWeight: 600 }}>{inv.vendorName}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#4B5563" }}>{inv.invoiceDate}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#4B5563" }}>{inv.dueDate ?? "—"}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#667085" }}>{toINR(inv.taxAmount)}</td>
                      <td style={{ padding: "12px", fontSize: 12, fontWeight: 750, color: "#111827" }}>{toINR(inv.totalAmount)}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={pillStyle(...STATUS_COLORS[inv.paymentStatus])}>
                          {inv.paymentStatus}
                        </span>
                        {hasRemarks && (
                          <div style={{ fontSize: 10, color: "#B91C1C", marginTop: 2, display: "flex", gap: 3, alignItems: "center" }}>
                            <ShieldAlert size={10} /> "{inv.remarks}"
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          {/* Sourcing Invoice Actions for Finance Officer & Admin */}
                          {isFinanceOrAdmin && inv.paymentStatus === "Pending" && (
                            <button 
                              onClick={() => handleVerify(inv.id)}
                              style={{ display: "inline-flex", alignItems: "center", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#1565C0", cursor: "pointer" }}
                            >
                              Verify
                            </button>
                          )}
                          {isFinanceOrAdmin && inv.paymentStatus === "Verified" && (
                            <button 
                              onClick={() => handleApprove(inv.id)}
                              style={{ display: "inline-flex", alignItems: "center", background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#6941C6", cursor: "pointer" }}
                            >
                              Approve Payment
                            </button>
                          )}
                          {isFinanceOrAdmin && inv.paymentStatus === "Approved" && (
                            <button 
                              onClick={() => handleProcessPayment(inv.id)}
                              style={{ display: "inline-flex", alignItems: "center", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#047857", cursor: "pointer" }}
                            >
                              Disburse & Pay
                            </button>
                          )}
                          {/* Reject Action */}
                          {isFinanceOrAdmin && inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Rejected" && (
                            <button 
                              onClick={() => handleOpenReject(inv)}
                              style={{ display: "inline-flex", alignItems: "center", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#B91C1C", cursor: "pointer" }}
                            >
                              Reject
                            </button>
                          )}
                          
                          {/* File Document visual chip */}
                          {inv.invoiceDocumentUrl && (
                            <a 
                              href="#" 
                              onClick={(e) => { e.preventDefault(); triggerToast(`Opening simulated doc: ${inv.invoiceDocumentUrl}`); }}
                              style={{ padding: 4, borderRadius: 6, border: "1px solid #E4E7EC", color: "#667085", display: "flex" }}
                              title="Download Digitized Copy"
                            >
                              <Download size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog Modal: Upload Sourcing Invoice (Vendor) */}
      {showUpload && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 480, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>Upload Invoice Ledger</h3>
                <span style={{ fontSize: 11, color: "#667085" }}>Sourcing Cycle · Select Delivered Purchase Orders</span>
              </div>
              <button onClick={() => setShowUpload(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>
                  Delivered Purchase Order <span style={{ color: "#B91C1C" }}>*</span>
                </label>
                {deliveredPOsOptions.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FEE2E2", padding: "8px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldAlert size={14} /> No delivered POs found in tracking desk for compilation.
                  </div>
                ) : (
                  <select 
                    value={selectedPOId}
                    onChange={e => handlePOSlowSelected(Number(e.target.value))}
                    style={{ width: "100%", padding: 9, border: formErrors.po ? "1.5px solid #span" : "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none", cursor: "pointer" }}
                  >
                    <option value="">— Choose Delivered PO —</option>
                    {deliveredPOsOptions.map(po => (
                      <option key={po.id} value={po.id}>
                        {po.poNumber} — {po.productDetails} ({toINR(po.totalCost)})
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.po && <span style={{ fontSize: 10, color: "#B91C1C", display: "block", marginTop: 4 }}>{formErrors.po}</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Invoice Number <span style={{ color: "#span" }}>*</span></label>
                  <input 
                    type="text" 
                    value={invoiceNumberInput}
                    onChange={e => setInvoiceNumberInput(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", border: formErrors.invoiceNumber ? "1.5px solid #B91C1C" : "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none" }}
                    placeholder="INV-XXXX"
                  />
                  {formErrors.invoiceNumber && <span style={{ fontSize: 10, color: "#B91C1C", display: "block", marginTop: 4 }}>{formErrors.invoiceNumber}</span>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Invoice Date</label>
                  <input 
                    type="date" 
                    value={invoiceDateInput}
                    onChange={e => setInvoiceDateInput(e.target.value)}
                    style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr", gap: 12, alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Base Amount (INR) <span style={{ color: "#B91C1C" }}>*</span></label>
                  <input 
                    type="number" 
                    value={amountInput || ""}
                    onChange={e => setAmountInput(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", border: formErrors.amount ? "1.5px solid #B91C1C" : "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none" }}
                    placeholder="0"
                  />
                  {formErrors.amount && <span style={{ fontSize: 10, color: "#B91C1C", display: "block", marginTop: 4 }}>{formErrors.amount}</span>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Tax (GST %)</label>
                  <input 
                    type="number" 
                    value={taxPctInput}
                    onChange={e => setTaxPctInput(Number(e.target.value))}
                    style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Live Net Payable</label>
                  <div style={{ padding: "8px 12px", background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: 8, fontSize: 13, fontWeight: 900, color: "#6941C6" }}>
                    {toINR(Number(amountInput) + (Number(amountInput) * Number(taxPctInput)) / 100)}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Due Date <span style={{ color: "#B91C1C" }}>*</span></label>
                <input 
                  type="date" 
                  value={dueDateInput}
                  onChange={e => setDueDateInput(e.target.value)}
                  style={{ width: "100%", padding: 8, border: formErrors.dueDate ? "1.5px solid #B91C1C" : "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none" }}
                />
                {formErrors.dueDate && <span style={{ fontSize: 10, color: "#B91C1C", display: "block", marginTop: 4 }}>{formErrors.dueDate}</span>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Upload PDF Invoice Copy</label>
                <div style={{ border: "2px dashed #E4E7EC", padding: 14, borderRadius: 8, textAlign: "center", cursor: "pointer", background: "#FDFDFD" }} onClick={() => setSelectedFile({ name: `${invoiceNumberInput || 'invoice'}_copy.pdf`, size: "324 KB" })}>
                  {selectedFile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#047857", fontSize: 12, fontWeight: 700 }}>
                      <FileText size={16} /> {selectedFile.name} ({selectedFile.size})
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                      Click to upload digitised invoice Copy (.pdf)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
              <button 
                onClick={() => setShowUpload(false)}
                style={{ padding: "8px 14px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadSubmit}
                disabled={deliveredPOsOptions.length === 0}
                style={{ padding: "8px 18px", background: deliveredPOsOptions.length === 0 ? "#9CA3AF" : roleColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: deliveredPOsOptions.length === 0 ? "not-allowed" : "pointer" }}
              >
                Upload & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Modal: Remarks for Rejection */}
      {showRemarksDialog && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 400, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin:0 }}>Reject Sourcing Invoice</h3>
                <span style={{ fontSize: 11, color: "#667085" }}>Invoice: {showRemarksDialog.invoiceNumber}</span>
              </div>
              <button onClick={() => setShowRemarksDialog(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#B91C1C", textTransform: "uppercase", marginBottom: 6 }}>
                REJECTION REMARKS / REASON <span style={{ color: "#B91C1C" }}>*</span>
              </label>
              <textarea 
                value={remarksReason}
                onChange={e => { setRemarksReason(e.target.value); setRemarksError(""); }}
                rows={3}
                style={{ width: "100%", padding: 8, border: remarksError ? "1.5px solid #B91C1C" : "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none", resize: "none" }}
                placeholder="Reason is required (e.g. quantity discrepancies, incorrect unit price, wrong taxation details...)"
              />
              {remarksError && <span style={{ fontSize: 10, color: "#B91C1C", display: "block", marginTop: 4 }}>{remarksError}</span>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button 
                onClick={() => setShowRemarksDialog(null)}
                style={{ padding: "8px 14px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 650, cursor: "pointer", color: "#374151" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmReject}
                style={{ padding: "8px 18px", background: "#B91C1C", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Reject Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
