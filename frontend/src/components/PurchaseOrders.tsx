import React, { useState } from "react";
import { Plus, Eye, Check, X, Printer, Receipt, Trash } from "lucide-react";
import { PurchaseOrder, Vendor, INITIAL_VENDORS, toINR } from "../data";

interface POProps {
  orders: PurchaseOrder[];
  vendors: Vendor[];
  currentRole: string;
  userVendorName?: string;
  onAddOrder: (po: PurchaseOrder) => void;
  onUpdateOrder: (po: PurchaseOrder) => void;
}

export function PurchaseOrders({ orders, vendors, currentRole, userVendorName, onAddOrder, onUpdateOrder }: POProps) {
  const isVendor = currentRole === "Vendor";
  const filteredOrders = isVendor
    ? orders.filter(po => {
        if (!userVendorName) return false;
        return po.vendorName.toLowerCase().includes(userVendorName.toLowerCase()) ||
               po.vendorId === (vendors.find(v => v.name.toLowerCase().includes(userVendorName.toLowerCase()))?.id);
      })
    : orders;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // New PO State
  const [vendorId, setVendorId] = useState("");
  const [poCategory, setPoCategory] = useState("Raw Material Suppliers");
  const [poItems, setPoItems] = useState<{ description: string; qty: number; unitPrice: number }[]>([
    { description: "", qty: 1, unitPrice: 0 }
  ]);

  // Allow selecting any supplier in the system registry
  const eligibleVendors = vendors && vendors.length > 0 ? vendors : INITIAL_VENDORS;

  const handleAddItemRow = () => {
    setPoItems([...poItems, { description: "", qty: 1, unitPrice: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (poItems.length === 1) return;
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, val: string | number) => {
    const copy = [...poItems];
    copy[index] = { ...copy[index], [field]: val };
    setPoItems(copy);
  };

  const calculateTotal = () => {
    return poItems.reduce((acc, current) => acc + (current.qty * current.unitPrice), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      alert("Please select a vendor.");
      return;
    }
    const vendorObj = eligibleVendors.find(v => v.id === vendorId);
    if (!vendorObj) return;

    if (poItems.some(item => !item.description.trim() || item.unitPrice <= 0)) {
      alert("Please check item descriptions and unit prices.");
      return;
    }

    const newPO: PurchaseOrder = {
      id: "PO-2026-" + Math.floor(1000 + Math.random() * 9000),
      vendorId: vendorObj.id,
      vendorName: vendorObj.name,
      amount: calculateTotal(),
      status: currentRole === "Procurement Manager" || currentRole === "Administrator" ? "Approved" : "Pending",
      date: new Date().toISOString().split("T")[0],
      category: poCategory,
      items: poItems,
      paymentStatus: "Unpaid"
    };

    onAddOrder(newPO);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setVendorId("");
    setPoCategory("Raw Material Suppliers");
    setPoItems([{ description: "", qty: 1, unitPrice: 0 }]);
  };

  const handleStatusChange = (id: string, newStatus: "Approved" | "Rejected") => {
    const orderObj = orders.find(o => o.id === id);
    if (!orderObj) return;
    const updated: PurchaseOrder = {
      ...orderObj,
      status: newStatus
    };
    onUpdateOrder(updated);
    if (selectedPO?.id === id) {
      setSelectedPO(updated);
    }
  };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Purchase Orders</h2>
          <span style={{ fontSize: 13, color: "#667085" }}>
            {currentRole === "Vendor"
              ? "View your incoming purchase orders and their status"
              : `${orders.length} active orders pending delivery`}
          </span>
        </div>
        {currentRole !== "Vendor" && currentRole !== "Auditor" && (
          <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> New Purchase Order
          </button>
        )}
      </div>

      {/* PO LIST TABLE */}
      <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["PO Number", "Vendor Name", "Category", "Amount", "Issued Date", "Status", "Actions"].map((col, idx) => (
                <th key={idx} style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((po, i) => (
              <tr key={po.id} style={{ borderBottom: "1px solid #E4E7EC", background: i % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                <td style={{ padding: "14px 18px", fontSize: 12, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{po.id}</td>
                <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{po.vendorName}</td>
                <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>{po.category}</td>
                <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{toINR(po.amount)}</td>
                <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>{po.date}</td>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                    background: po.status === "Approved" ? "#E8F5E9" : po.status === "Pending" ? "#FFF3E0" : po.status === "Rejected" ? "#FFEBEE" : "#F5F5F5",
                    color: po.status === "Approved" ? "#2E7D32" : po.status === "Pending" ? "#FF6F00" : po.status === "Rejected" ? "#C62828" : "#616161"
                  }}>{po.status}</span>
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <button onClick={() => { setSelectedPO(po); setShowViewModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#1565C0", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}>
                    <Eye size={14} /> View Items
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW PO FORM DIALOG */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 740, maxHeight: "90vh", overflowY: "auto", border: "1px solid #E4E7EC", padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 14 }}>Create Purchase Order</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>ASSIGN SUPPLIER (SYSTEM SUPPLIERS REGISTRY) *</label>
                <select value={vendorId} onChange={e => setVendorId(e.target.value)} required style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 6, fontWeight: 600 }}>
                  <option value="">Select Vendor...</option>
                  {eligibleVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.id}) — [{v.category}]</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>PROCUREMENT CATEGORY *</label>
                <select value={poCategory} onChange={e => setPoCategory(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 6, fontWeight: 600 }}>
                  <option value="Raw Material Suppliers">Raw Material Suppliers</option>
                  <option value="IT Services">IT Services</option>
                  <option value="IT Vendors">IT Vendors</option>
                  <option value="Logistics Partners">Logistics Partners</option>
                  <option value="Equipment Vendors">Equipment Vendors</option>
                  <option value="Service Providers">Service Providers</option>
                  <option value="Maintenance Vendors">Maintenance Vendors</option>
                  <option value="Civil Works & Construction">Civil Works & Construction</option>
                  <option value="Office Supplies & Stationery">Office Supplies & Stationery</option>
                  <option value="Print & Branding">Print & Branding</option>
                  <option value="Consulting & Professional Services">Consulting & Professional Services</option>
                  <option value="Security & Facility Management">Security & Facility Management</option>
                </select>
              </div>
            </div>

            {/* ITEM BUILDER CARD */}
            <div style={{ border: "1px solid #E4E7EC", borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1565C0" }}>LINE ITEMS</span>
                <button type="button" onClick={handleAddItemRow} style={{ padding: "4px 10px", background: "#EEF4FF", color: "#1565C0", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Add Line</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {poItems.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="text" placeholder="Description of goods/services" required
                      value={item.description} onChange={e => handleItemChange(idx, "description", e.target.value)}
                      style={{ flex: 3, padding: 6, border: "1px solid #E4E7EC", borderRadius: 4, fontSize: 12 }}
                    />
                    <input
                      type="number" min={1} placeholder="Qty" required
                      value={item.qty} onChange={e => handleItemChange(idx, "qty", parseInt(e.target.value) || 1)}
                      style={{ flex: 1, padding: 6, border: "1px solid #E4E7EC", borderRadius: 4, fontSize: 12, width: 60 }}
                    />
                    <input
                      type="number" min={0} placeholder="Price (₹)" required
                      value={item.unitPrice} onChange={e => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      style={{ flex: 1, padding: 6, border: "1px solid #E4E7EC", borderRadius: 4, fontSize: 12 }}
                    />
                    <button type="button" onClick={() => handleRemoveRow(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C62828" }}><Trash size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* TOTAL */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E4E7EC", paddingTop: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Total PO Value: {toINR(calculateTotal())}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Generate PO</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedPO && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 660, border: "1px solid #E4E7EC", padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E7EC", paddingBottom: 12, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Receipt size={20} color="#1565C0" />
                <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Purchase Order: {selectedPO.id}</span>
              </div>
              <button onClick={() => { setSelectedPO(null); setShowViewModal(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>SUPPLIER</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginTop: 2 }}>{selectedPO.vendorName}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>ISSUED DATE</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedPO.date}</div>
                </div>
              </div>

              {/* BAR ITEMS */}
              <div style={{ border: "1px solid #E4E7EC", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textTransform: "none", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F5F5F5", textAlign: "left" }}>
                      <th style={{ padding: 8 }}>Item Description</th>
                      <th style={{ padding: 8 }}>Qty</th>
                      <th style={{ padding: 8 }}>Unit Price</th>
                      <th style={{ padding: 8 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #E4E7EC" }}>
                        <td style={{ padding: 8, fontWeight: 600 }}>{item.description}</td>
                        <td style={{ padding: 8 }}>{item.qty}</td>
                        <td style={{ padding: 8 }}>{toINR(item.unitPrice)}</td>
                        <td style={{ padding: 8, fontWeight: 700 }}>{toINR(item.qty * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Total PO Value: {toINR(selectedPO.amount)}</span>
                <span style={{
                  padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: selectedPO.status === "Approved" ? "#E8F5E9" : selectedPO.status === "Pending" ? "#FFF3E0" : "#FFEBEE",
                  color: selectedPO.status === "Approved" ? "#2E7D32" : selectedPO.status === "Pending" ? "#FF6F00" : "#C62828"
                }}>{selectedPO.status}</span>
              </div>

              {selectedPO.status === "Pending" && currentRole !== "Vendor" && (currentRole === "Finance Officer" || currentRole === "Administrator" || currentRole === "Procurement Manager") && (
                <div style={{ display: "flex", gap: 8, borderTop: "1px solid #E4E7EC", paddingTop: 14, justifyContent: "flex-end" }}>
                  <button onClick={() => handleStatusChange(selectedPO.id, "Rejected")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#C62828", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <X size={14} /> Reject PO
                  </button>
                  <button onClick={() => handleStatusChange(selectedPO.id, "Approved")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#2E7D32", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <Check size={14} /> Approve PO
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
