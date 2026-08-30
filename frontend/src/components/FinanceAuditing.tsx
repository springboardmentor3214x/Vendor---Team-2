import React, { useState } from "react";
import { 
  Receipt, CreditCard, Search, ShieldCheck, CheckCircle2, Clock, 
  Plus, FileText, FileDown, X, Server, AlertCircle 
} from "lucide-react";
import { Invoice, AuditLog, toINR } from "../data";

interface FinProps {
  viewMode: "invoices" | "auditors";
  invoices: Invoice[];
  auditLogs: AuditLog[];
  onPayInvoice: (id: string) => void;
  onAddAuditLog?: (action: string, details: string) => void;
}

export function FinanceAuditing({ viewMode, invoices, auditLogs, onPayInvoice, onAddAuditLog }: FinProps) {
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Audit Logs Workspace Dashboard Filters and Modals state
  const [filterRole, setFilterRole] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<AuditLog | null>(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [newSimAction, setNewSimAction] = useState("Vendor Document Verification");
  const [newSimDetails, setNewSimDetails] = useState("Verified corporate PAN and GSTIN references for registry validation.");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePay = (id: string) => {
    onPayInvoice(id);
    alert(`Transfer of funds processed. Payment Ref: Ref-${Math.floor(100000 + Math.random() * 900000)}.`);
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.vendorName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.id.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const filteredAudits = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesRole = filterRole === "All" || log.role === filterRole;
    const matchesAction = filterAction === "All" || log.action === filterAction;
    return matchesSearch && matchesRole && matchesAction;
  });

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>

      {/* 1. FINANCE WORKSPACE - INVOICES */}
      {viewMode === "invoices" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>General Invoice Ledger & Payouts</h2>
              <span style={{ fontSize: 13, color: "#667085" }}>Process supplier payouts, view invoice payment statuses, and clear balances</span>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: 14, borderBottom: "1px solid #E4E7EC", display: "flex", gap: 10 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#667085" }} />
                <input
                  placeholder="Search invoices by Supplier Name or Reference Number..."
                  value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: 32, paddingRight: 10, height: 34, border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13 }}
                />
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Invoice Num", "PO Ref", "Supplier", "Amount Due", "Due Date", "Status", "Actions"].map((col, idx) => (
                    <th key={idx} style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid #E4E7EC", background: idx % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                    <td style={{ padding: "14px 18px", fontSize: 12, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{inv.invoiceNum}</td>
                    <td style={{ padding: "14px 18px", fontSize: 12, fontFamily: "monospace", color: "#667085" }}>{inv.poId}</td>
                    <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600 }}>{inv.vendorName}</td>
                    <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700 }}>{toINR(inv.amount)}</td>
                    <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>{inv.dueDate}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                        background: inv.status === "Paid" ? "#E8F5E9" : "#FFF3E0",
                        color: inv.status === "Paid" ? "#2E7D32" : "#FF6F00"
                      }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {inv.status !== "Paid" ? (
                        <button onClick={() => handlePay(inv.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#2E7D32", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          <CreditCard size={13} /> Process Payout
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: "#2E7D32", fontWeight: 600 }}>Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. AUDIT LOGS FOR AUDITORS */}
      {viewMode === "auditors" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>System Audit Trail & Security Logs</h2>
              <span style={{ fontSize: 13, color: "#667085" }}>Immutable compliance logs containing employee logs, actions, and network IP addresses</span>
            </div>
            
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button 
                onClick={() => setShowSimulateModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2E7D32", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
              >
                <Plus size={14} /> Simulate Event Log
              </button>
              
              <button
                onClick={() => {
                  triggerToast("Processing full cryptographic audit ledger compilation...");
                  setTimeout(() => {
                    const csvPayload = "data:text/csv;charset=utf-8," + 
                      ["ID,Timestamp,User,Role,Action,Details,IPAddress"].join(",") + "\n" +
                      auditLogs.map(l => `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.details}","${l.ipAddress}"`).join("\n");
                    const encodedUri = encodeURI(csvPayload);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Immutable_Audit_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    triggerToast("Success: Immutable compliance log exported as CSV!");
                  }, 1200);
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", color: "#374151", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}
              >
                <FileDown size={14} /> Export Logs
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#E8F5E9", color: "#2E7D32", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                <ShieldCheck size={14} /> Compliance Verified
              </div>
            </div>
          </div>

          {/* TELEMETRY STATS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
            {/* Total logs */}
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Total Events Audited</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#111827", margin: "4px 0" }}>{auditLogs.length}</div>
              <div style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={12} color="#2E7D32" /> 100% Telemetry Signed
              </div>
            </div>

            {/* Critical Alerts */}
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Critical Incidents</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#C62828", margin: "4px 0" }}>
                {auditLogs.filter(log => ["Termination", "Suspended", "Rejected", "Delete"].some(w => log.action.includes(w) || log.details.includes(w))).length}
              </div>
              <div style={{ fontSize: 11, color: "#C62828", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={12} color="#C62828" /> Requires compliance review
              </div>
            </div>

            {/* Unique Operators */}
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Active Operators</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#1565C0", margin: "4px 0" }}>
                {new Set(auditLogs.map(l => l.user)).size}
              </div>
              <div style={{ fontSize: 11, color: "#1565C0", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} color="#1565C0" /> Across multiple auth levels
              </div>
            </div>

            {/* Network Integrity nodes check */}
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Node Integrity Status</span>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#2E7D32", margin: "10px 0 6px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CAF50" }} />
                SECURED MASTER NODE
              </div>
              <div style={{ fontSize: 11, color: "#667085" }}>IP Node Reference: 192.168.3.1</div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            {/* SEARCH & FILTER CONTROLS */}
            <div style={{ padding: 14, borderBottom: "1px solid #E4E7EC", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#667085" }} />
                <input
                  placeholder="Search logs by operator user, event action, or details..."
                  value={auditSearch} onChange={e => setAuditSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: 32, paddingRight: 10, height: 34, border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              {/* Filter by Role */}
              <select 
                value={filterRole} 
                onChange={e => setFilterRole(e.target.value)} 
                style={{ padding: "0 10px", height: 34, border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 12, background: "#fff", fontWeight: 650, color: "#374151" }}
              >
                <option value="All">All Roles</option>
                <option value="Administrator">Administrator</option>
                <option value="Procurement Manager">Procurement Manager</option>
                <option value="Finance Officer">Finance Officer</option>
                <option value="Auditor">Auditor</option>
                <option value="Vendor">Vendor</option>
              </select>

              {/* Filter by Action Signature */}
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                style={{ padding: "0 10px", height: 34, border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 12, background: "#fff", fontWeight: 650, color: "#374151" }}
              >
                <option value="All">All Action Types</option>
                {Array.from(new Set(auditLogs.map(l => l.action))).map((act, idx) => (
                  <option key={idx} value={act}>{act}</option>
                ))}
              </select>

              {/* Reset Control */}
              {(auditSearch || filterRole !== "All" || filterAction !== "All") && (
                <button 
                  onClick={() => {
                    setAuditSearch("");
                    setFilterRole("All");
                    setFilterAction("All");
                  }} 
                  style={{ padding: "8px 16px", background: "#f5f6f8", color: "#374151", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Date & Time", "User Profile", "Role", "Action Type", "Details", "IP Address", "Actions"].map((col, idx) => (
                    <th key={idx} style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAudits.length > 0 ? (
                  filteredAudits.map((log, idx) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #E4E7EC", fontSize: 12, background: idx % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                      <td style={{ padding: "12px 18px", color: "#374151" }}>{log.timestamp}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 600 }}>{log.user}</td>
                      <td style={{ padding: "12px 18px", color: "#667085" }}>{log.role}</td>
                      <td style={{ padding: "12px 18px" }}>
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: "#EEF4FF", color: "#1565C0", fontWeight: 600, fontSize: 10 }}>{log.action}</span>
                      </td>
                      <td style={{ padding: "12px 18px", color: "#374151" }}>{log.details}</td>
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "#667085" }}>{log.ipAddress}</td>
                      <td style={{ padding: "12px 18px" }}>
                        <button 
                          onClick={() => setSelectedAuditDetail(log)}
                          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #1565C0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#1565C0", fontWeight: 700 }}
                        >
                          Inspect info
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#667085", fontSize: 13 }}>
                      No matching audit event records found. Try adjusting your query filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENDOR DETAILED AUDIT INSPECTOR MODAL */}
      {selectedAuditDetail && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "520px",
            border: "1px solid #E4E7EC",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Modal Header */}
            <div style={{ background: "#F8FAFC", padding: "18px 24px", borderBottom: "1px solid #E4E7EC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#1565C0" />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "#111827", margin: 0 }}>Audit Event Metadata Inspector</h3>
              </div>
              <button 
                onClick={() => setSelectedAuditDetail(null)}
                style={{ background: "none", border: "none", fontSize: 20, color: "#9CA3AF", cursor: "pointer", fontWeight: 700 }}
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Event cryptographic ID signature */}
              <div>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Immutable Record Registry Hash</div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", color: "#374151" }}>
                  SHA256: {btoa(selectedAuditDetail.id + selectedAuditDetail.timestamp).substring(0, 48).toLowerCase()}
                </div>
              </div>

              {/* Grid Metadata */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Audit Event ID</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedAuditDetail.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Timestamp</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedAuditDetail.timestamp}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Operator User</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedAuditDetail.user}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Security Role</div>
                  <div style={{ fontSize: 13, fontWeight: 750, color: "#1565C0", marginTop: 2 }}>{selectedAuditDetail.role}</div>
                </div>
              </div>

              {/* Action and description details */}
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Event Action Code</div>
                <span style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 4, background: "#EEF4FF", color: "#1565C0", fontWeight: 720, fontSize: 11 }}>
                  {selectedAuditDetail.action}
                </span>
                
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase", marginTop: 12 }}>Detailed Log Payload</div>
                <p style={{ fontSize: 12, color: "#374151", margin: "4px 0 0 0", background: "#FAFBFD", border: "1px solid #EAECF0", padding: "10px 14px", borderRadius: 8, lineHeight: 1.5 }}>
                  {selectedAuditDetail.details}
                </p>
              </div>

              {/* Host and node signature info */}
              <div style={{ display: "flex", gap: 12, background: "#F9FAFB", padding: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Operator IP Address</div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", marginTop: 2, fontWeight: 700 }}>{selectedAuditDetail.ipAddress}</div>
                </div>
                <div style={{ flex: 1, borderLeft: "1px solid #E2E8F0", paddingLeft: 12 }}>
                  <div style={{ fontSize: 9, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Node Integrity Check</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontSize: 11, fontWeight: 700, color: "#2E7D32" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4CAF50" }} />
                    Passed GFR Seal
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div style={{ background: "#F8FAFC", padding: "14px 24px", borderTop: "1px solid #E4E7EC", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button 
                onClick={() => setSelectedAuditDetail(null)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE EVENT MODAL */}
      {showSimulateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "480px",
            border: "1px solid #E4E7EC",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Modal Header */}
            <div style={{ background: "#F8FAFC", padding: "18px 24px", borderBottom: "1px solid #E4E7EC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Server size={18} color="#2E7D32" />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "#111827", margin: 0 }}>Simulate Sealed Audit Log Event</h3>
              </div>
              <button 
                onClick={() => setShowSimulateModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, color: "#9CA3AF", cursor: "pointer", fontWeight: 700 }}
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Action Signature</label>
                <select 
                  value={newSimAction} 
                  onChange={e => setNewSimAction(e.target.value)}
                  style={{ width: "100%", height: 36, border: "1px solid #E4E7EC", borderRadius: 8, padding: "0 10px", fontSize: 13, background: "#fff", color: "#374151" }}
                >
                  <option value="Document Approved">Document Approved</option>
                  <option value="Vendor Verification Audit">Vendor Verification Audit</option>
                  <option value="Contract Released">Contract Released</option>
                  <option value="Payment Settlement Initiated">Payment Settlement Initiated</option>
                  <option value="Vendor Suspended">Vendor Suspended</option>
                  <option value="ISO Registry Certified">ISO Registry Certified</option>
                  <option value="Security Policy checklist checked">Security Policy checklist checked</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Action Description Details</label>
                <textarea
                  value={newSimDetails}
                  onChange={e => setNewSimDetails(e.target.value)}
                  placeholder="Enter specific audit action details..."
                  style={{ width: "100%", height: 100, border: "1px solid #E4E7EC", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "none", color: "#374151" }}
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div style={{ background: "#F8FAFC", padding: "14px 24px", borderTop: "1px solid #E4E7EC", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button 
                onClick={() => {
                  if (onAddAuditLog) {
                    onAddAuditLog(newSimAction, newSimDetails);
                    triggerToast(`Sealed Event '${newSimAction}' successfully committed to audit registry ledger!`);
                  } else {
                    alert("Adding logs is not configured on this dashboard level!");
                  }
                  setShowSimulateModal(false);
                }}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#2E7D32", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Commit to Ledger
              </button>
              <button 
                onClick={() => setShowSimulateModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Dynamic Logs Toast Alerts */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "rgba(17, 24, 39, 0.95)",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 9999,
          fontSize: 12,
          fontWeight: 650,
          borderLeft: "4px solid #4CAF50",
        }}>
          <CheckCircle2 size={15} color="#4CAF50" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
