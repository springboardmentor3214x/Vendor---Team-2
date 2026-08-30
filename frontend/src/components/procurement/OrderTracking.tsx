import { useEffect, useState } from "react";
import { 
  Truck, AlertTriangle, CheckCircle, Clock, 
  Package, Search, Edit2, Calendar, FileText, X 
} from "lucide-react";
import { procurementService } from "../../services/procurementService";
import type { OrderTracking, DeliveryStatus } from "../../models/procurement";

const cardStyle = { 
  background: "#fff", 
  border: "1px solid #E4E7EC", 
  borderRadius: 12, 
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
};

const STATUS_META: Record<DeliveryStatus, { color: string; bg: string; icon: React.ElementType }> = {
  "Awaiting Shipment": { bg: "#F3F4F6", color: "#4B5563", icon: Package },
  "In Transit":        { bg: "#E0F2FE", color: "#0369A1", icon: Truck },
  "Delivered":         { bg: "#ECFDF5", color: "#047857", icon: CheckCircle },
  "Delayed":           { bg: "#FEF2F2", color: "#B91C1C", icon: AlertTriangle },
  "Completed":         { bg: "#F0FDF4", color: "#166534", icon: CheckCircle },
};

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 300,
      background: "#ECFDF5", border: "1px solid #04785730", color: "#047857",
      borderRadius: 8, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    }}>
      <CheckCircle size={16} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={14} /></button>
    </div>
  );
}

const getDelayDays = (expectedStr?: string, actualStr?: string) => {
  if (!expectedStr) return 0;
  const exp = new Date(expectedStr);
  const end = actualStr ? new Date(actualStr) : new Date();
  exp.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end.getTime() > exp.getTime()) {
    const diffTime = end.getTime() - exp.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
};

interface OrderTrackingProps {
  roleColor: string;
  currentRole?: string;
  userName?: string;
  userVendorName?: string;
}

export function OrderTrackingPage({ roleColor, currentRole = "Administrator", userName = "Test User", userVendorName }: OrderTrackingProps) {
  const [records, setRecords] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");

  // Sorting
  const [sortField, setSortField] = useState<keyof OrderTracking>("expectedDeliveryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dialog State
  const [activeRecord, setActiveRecord] = useState<OrderTracking | null>(null);
  const [dialogStatus, setDialogStatus] = useState<DeliveryStatus>("Awaiting Shipment");
  const [dialogDispatchDate, setDialogDispatchDate] = useState("");
  const [dialogActualDate, setDialogActualDate] = useState("");
  const [dialogRemarks, setDialogRemarks] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isVendor = currentRole === "Vendor";
  const canUpdate = currentRole === "Administrator" || currentRole === "Procurement Manager" || currentRole === "Vendor";

  const loadData = () => {
    setLoading(true);
    procurementService.getAllTracking().then(data => {
      // Refresh delay days computed client-side
      const computed = data.map(record => {
        const delay = getDelayDays(record.expectedDeliveryDate, record.actualDeliveryDate);
        return {
          ...record,
          delayDays: delay > 0 ? delay : undefined,
          deliveryStatus: (record.deliveryStatus !== "Delivered" && record.deliveryStatus !== "Completed" && delay > 0) 
            ? "Delayed" as const 
            : record.deliveryStatus
        };
      });
      setRecords(computed);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenEdit = (rec: OrderTracking) => {
    setActiveRecord(rec);
    setDialogStatus(rec.deliveryStatus);
    setDialogDispatchDate(rec.dispatchDate || "");
    setDialogActualDate(rec.actualDeliveryDate || "");
    setDialogRemarks(rec.remarks || "");
  };

  const handleSaveStatus = async () => {
    if (!activeRecord) return;
    const computedDelay = getDelayDays(activeRecord.expectedDeliveryDate, dialogActualDate);
    const updates: Partial<OrderTracking> = {
      deliveryStatus: dialogStatus,
      dispatchDate: dialogDispatchDate || undefined,
      actualDeliveryDate: dialogActualDate || undefined,
      remarks: dialogRemarks || undefined,
      delayDays: computedDelay > 0 ? computedDelay : undefined
    };

    await procurementService.updateTracking(activeRecord.poId, updates);
    setActiveRecord(null);
    triggerToast(`Order status for PO ${activeRecord.poNumber} updated to ${dialogStatus}.`);
    loadData();
  };

  const triggerSort = (field: keyof OrderTracking) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter logic
  const filtered = records.filter(r => {
    // Role filter
    const isOwner = !isVendor || (!!userVendorName && r.vendorName?.toLowerCase().includes(userVendorName.toLowerCase()));
    if (!isOwner) return false;

    // Filters UI
    const matchesSearch = !search 
      || r.poNumber?.toLowerCase().includes(search.toLowerCase()) 
      || r.vendorName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.deliveryStatus === statusFilter;
    const matchesVendor = vendorFilter === "All" || r.vendorName === vendorFilter;

    return matchesSearch && matchesStatus && matchesVendor;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField] ?? "";
    const bVal = b[sortField] ?? "";
    if (sortOrder === "asc") return String(aVal).localeCompare(String(bVal));
    return String(bVal).localeCompare(String(aVal));
  });

  // Unique vendors list for filtering
  const vendorOptions = ["All", ...Array.from(new Set(records.map(r => r.vendorName)))];

  // KPI Calculations
  const totalOrders = filtered.length;
  const inTransitCount = filtered.filter(f => f.deliveryStatus === "In Transit").length;
  const deliveredCount = filtered.filter(f => f.deliveryStatus === "Delivered" || f.deliveryStatus === "Completed").length;
  const delayedCount = filtered.filter(f => f.deliveryStatus === "Delayed" || getDelayDays(f.expectedDeliveryDate, f.actualDeliveryDate) > 0).length;

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {toastMsg && <Toast msg={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Order Tracking</h1>
          <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
            {isVendor ? `Supplier Delivery Desk for ${userVendorName}` : "Central control of shipping logistics and order delays"}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ ...cardStyle, borderLeft: `4px solid ${roleColor}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Total Shipments</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4, color: "#111827" }}>{totalOrders}</div>
        </div>
        <div style={{ ...cardStyle, borderLeft: "4px solid #0369A1" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>In Transit</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4, color: "#0369A1" }}>{inTransitCount}</div>
        </div>
        <div style={{ ...cardStyle, borderLeft: "4px solid #047857" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Delivered</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4, color: "#047857" }}>{deliveredCount}</div>
        </div>
        <div style={{ ...cardStyle, borderLeft: "4px solid #B91C1C" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Delayed Shipments</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4, color: "#B91C1C" }}>{delayedCount}</div>
        </div>
      </div>

      {/* Filter panel */}
      <div style={{ ...cardStyle, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} color="#9CA3AF" style={{ position: "absolute", left: 12, top: 11 }} />
          <input 
            type="text" 
            placeholder="Search by PO number or vendor..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 34px", border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none" }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#667085", fontWeight: 700, marginRight: 6 }}>STATUS</label>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, cursor: "pointer", outline: "none" }}
          >
            <option value="All">All statuses</option>
            <option value="Awaiting Shipment">Awaiting Shipment</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        {!isVendor && (
          <div>
            <label style={{ fontSize: 11, color: "#667085", fontWeight: 700, marginRight: 6 }}>VENDOR</label>
            <select 
              value={vendorFilter} 
              onChange={e => setVendorFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, cursor: "pointer", outline: "none" }}
            >
              {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Shipments Table */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Loading tracking records...</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No order shipments matching filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th onClick={() => triggerSort("poNumber")} style={{ cursor: "pointer", padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>PO #</th>
                  <th onClick={() => triggerSort("vendorName")} style={{ cursor: "pointer", padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Vendor</th>
                  <th onClick={() => triggerSort("dispatchDate")} style={{ cursor: "pointer", padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Dispatch Date</th>
                  <th onClick={() => triggerSort("expectedDeliveryDate")} style={{ cursor: "pointer", padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Expected Delivery</th>
                  <th onClick={() => triggerSort("actualDeliveryDate")} style={{ cursor: "pointer", padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Actual Delivery</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Delay Registry</th>
                  <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>Status</th>
                  {canUpdate && <th style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase", textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => {
                  const meta = STATUS_META[r.deliveryStatus] || STATUS_META["Awaiting Shipment"];
                  const Icon = meta.icon;
                  const delay = getDelayDays(r.expectedDeliveryDate, r.actualDeliveryDate);
                  
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px", fontSize: 12, fontFamily: "monospace", color: roleColor, fontWeight: 700 }}>{r.poNumber}</td>
                      <td style={{ padding: "12px", fontSize: 12, fontWeight: 600 }}>{r.vendorName}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#4B5563" }}>{r.dispatchDate ?? "—"}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#4B5563" }}>{r.expectedDeliveryDate ?? "—"}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#4B5563" }}>{r.actualDeliveryDate ?? "—"}</td>
                      <td style={{ padding: "12px" }}>
                        {delay > 0 ? (
                          <span style={{ background: "#FEF2F2", color: "#B91C1C", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "3px 8px" }}>
                            {delay} days delayed
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>On Time</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "2px 8px" }}>
                          <Icon size={12} />
                          {r.deliveryStatus}
                        </span>
                        {r.remarks && <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>{r.remarks}</div>}
                      </td>
                      {canUpdate && (
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          {/* Check ownership if Vendor */}
                          {(!isVendor || (!!userVendorName && r.vendorName?.toLowerCase().includes(userVendorName.toLowerCase()))) && (
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                              {!isVendor && r.deliveryStatus === "Delivered" && (
                                <button 
                                  onClick={async () => {
                                    await procurementService.updateTracking(r.poId, { deliveryStatus: "Completed" });
                                    triggerToast(`Delivery verified! Order ${r.poNumber} marked as Completed.`);
                                    loadData();
                                  }}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#E8F5E9", border: "1px solid #2E7D3250", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#2E7D32" }}
                                  title="Verify Delivery & Mark Completed"
                                >
                                  <CheckCircle size={11} /> Mark Completed
                                </button>
                              )}
                              <button 
                                onClick={() => handleOpenEdit(r)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "1px solid #E4E7EC", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#4B5563" }}
                                title="Update Status"
                              >
                                <Edit2 size={10} /> Update
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modern React Modal for Status Updates */}
      {activeRecord && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 440, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>Update Shipment Status</h3>
                <span style={{ fontSize: 11, color: "#667085" }}>PO Number: {activeRecord.poNumber} · Expected {activeRecord.expectedDeliveryDate}</span>
              </div>
              <button onClick={() => setActiveRecord(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Delivery Status</label>
                <select 
                  value={dialogStatus}
                  onChange={e => {
                    const newSt = e.target.value as DeliveryStatus;
                    setDialogStatus(newSt);
                    if ((newSt === "Delivered" || newSt === "Completed") && !dialogActualDate) {
                      setDialogActualDate(new Date().toISOString().slice(0, 10));
                    }
                  }}
                  style={{ width: "100%", padding: 9, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none", cursor: "pointer" }}
                >
                  <option value="Awaiting Shipment">Awaiting Shipment</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Delivered">Delivered</option>
                  {!isVendor && <option value="Completed">Completed (Verify & Close)</option>}
                </select>
                {isVendor && <span style={{ fontSize: 10, color: "#667085", marginTop: 4, display: "block" }}>* Final Completion verification is performed by Procurement Management.</span>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Dispatch Date</label>
                <input 
                  type="date" 
                  value={dialogDispatchDate}
                  onChange={e => setDialogDispatchDate(e.target.value)}
                  style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Actual Delivery Date</label>
                <input 
                  type="date" 
                  value={dialogActualDate}
                  onChange={e => setDialogActualDate(e.target.value)}
                  style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none" }}
                  placeholder="Only if delivered/completed"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 6 }}>Remarks / Delay Reason</label>
                <textarea 
                  value={dialogRemarks}
                  onChange={e => setDialogRemarks(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, outline: "none", resize: "vertical" }}
                  placeholder="Document truck breakdowns, customs holdups, etc."
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
              <button 
                onClick={() => setActiveRecord(null)}
                style={{ padding: "8px 14px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveStatus}
                style={{ padding: "8px 18px", background: roleColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
