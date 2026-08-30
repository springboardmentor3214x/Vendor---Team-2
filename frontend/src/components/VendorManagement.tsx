import React, { useState } from "react";
import { Search, Filter, Plus, Eye, Edit2, CheckCircle, XCircle, Download, FileText, Upload, AlertCircle, Trash2, X } from "lucide-react";
import { Vendor, VendorCategory, VendorStatus, ApprovalStatus, VendorContact, VendorDocument } from "../data";

interface VendorMgmtProps {
  vendors: Vendor[];
  currentRole: string;
  currentUser: string;
  onAddVendor: (v: Vendor) => void;
  onUpdateVendor: (v: Vendor) => void;
  onDeleteVendor: (id: string) => void;
}

export function VendorManagement({ vendors, currentRole, currentUser, onAddVendor, onUpdateVendor, onDeleteVendor }: VendorMgmtProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedApproval, setSelectedApproval] = useState<string>("All");
  const [sortBy, setSortBy] = useState<keyof Vendor>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVendorForView, setSelectedVendorForView] = useState<Vendor | null>(null);

  // Add / Edit form fields
  const [editMode, setEditMode] = useState(false);
  const [targetVendorId, setTargetVendorId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("Raw Material Suppliers");
  const [contactName, setContactName] = useState("");
  const [designation, setDesignation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gstNum, setGstNum] = useState("");
  const [panNum, setPanNum] = useState("");
  const [regNum, setRegNum] = useState("");
  const [addrL1, setAddrL1] = useState("");
  const [addrL2, setAddrL2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [bankAcc, setBankAcc] = useState("");
  const [bankIFSC, setBankIFSC] = useState("");
  const [bankName, setBankName] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [vendorStatusField, setVendorStatusField] = useState<VendorStatus>("Active");

  // Document Uploads state
  const [uploadedDocs, setUploadedDocs] = useState<VendorDocument[]>([]);
  const [docUploadError, setDocUploadError] = useState("");

  const categories: VendorCategory[] = [
    "Raw Material Suppliers", "Equipment Vendors", "IT Vendors", "Service Providers", "Logistics Partners", "Maintenance Vendors"
  ];

  // Helper validation
  const validateForm = () => {
    if (!companyName.trim()) return "Company Name is required.";
    if (!emailAddress.includes("@")) return "Invalid company general email.";
    if (!contactName.trim() || !contactEmail.includes("@")) return "A valid primary contact is required.";
    
    // GST validation: 15 chars, PAN validation: 10 chars
    const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
    if (gstNum.trim() && !gstRegex.test(gstNum)) {
      return "Invalid GSTIN format (e.g. 27AAAAA1111A1Z1).";
    }
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    if (panNum.trim() && !panRegex.test(panNum)) {
      return "Invalid PAN Format (e.g. AAAAA1111A).";
    }
    if (!bankAcc.trim() || !bankIFSC.trim()) {
      return "Bank account details are required.";
    }
    return "";
  };

  // Document handling
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Type validation
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setDocUploadError("Unsupported format. Please upload PDF, JPG, or PNG.");
      return;
    }

    // Size validation - 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setDocUploadError("File size exceeds 2MB limit.");
      return;
    }

    // Add to list
    const newDoc: VendorDocument = {
      id: "doc-" + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.includes("pdf") ? "GST" : "PAN",
      fileUrl: "#",
      uploadDate: new Date().toISOString().split("T")[0],
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    };
    setUploadedDocs([...uploadedDocs, newDoc]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    const payload: Vendor = {
      id: editMode ? targetVendorId : "VND-" + Math.floor(100 + Math.random() * 900),
      name: companyName,
      category,
      contacts: [
        { name: contactName, designation, email: contactEmail, phone: contactPhone, altPhone }
      ],
      email: emailAddress,
      phone: phoneNumber,
      gstNumber: gstNum,
      panNumber: panNum,
      registrationNumber: regNum,
      address: { line1: addrL1, line2: addrL2, city, state, country, pincode },
      website,
      description,
      bankDetails: { accountNumber: bankAcc, ifscCode: bankIFSC, bankName },
      paymentTerms,
      status: vendorStatusField,
      approvalStatus: editMode ? (vendors.find(v => v.id === targetVendorId)?.approvalStatus ?? "Pending") : "Pending",
      documents: uploadedDocs,
      auditInfo: {
        createdBy: editMode ? (vendors.find(v => v.id === targetVendorId)?.auditInfo?.createdBy ?? currentUser) : currentUser,
        createdDate: editMode ? (vendors.find(v => v.id === targetVendorId)?.auditInfo?.createdDate ?? new Date().toISOString()) : new Date().toISOString(),
        lastUpdatedBy: currentUser,
        lastUpdatedDate: new Date().toISOString()
      }
    };

    if (editMode) {
      onUpdateVendor(payload);
    } else {
      onAddVendor(payload);
    }

    resetForm();
    setShowAddModal(false);
  };

  const resetForm = () => {
    setEditMode(false);
    setTargetVendorId("");
    setCompanyName("");
    setCategory("Raw Material Suppliers");
    setContactName("");
    setDesignation("");
    setContactEmail("");
    setContactPhone("");
    setAltPhone("");
    setEmailAddress("");
    setPhoneNumber("");
    setGstNum("");
    setPanNum("");
    setRegNum("");
    setAddrL1("");
    setAddrL2("");
    setCity("");
    setState("");
    setPincode("");
    setWebsite("");
    setDescription("");
    setBankAcc("");
    setBankIFSC("");
    setBankName("");
    setPaymentTerms("Net 30");
    setVendorStatusField("Active");
    setUploadedDocs([]);
    setDocUploadError("");
  };

  const startEdit = (v: Vendor) => {
    setEditMode(true);
    setTargetVendorId(v.id);
    setCompanyName(v.name);
    setCategory(v.category);
    setContactName(v.contacts[0]?.name || "");
    setDesignation(v.contacts[0]?.designation || "");
    setContactEmail(v.contacts[0]?.email || "");
    setContactPhone(v.contacts[0]?.phone || "");
    setAltPhone(v.contacts[0]?.altPhone || "");
    setEmailAddress(v.email);
    setPhoneNumber(v.phone);
    setGstNum(v.gstNumber);
    setPanNum(v.panNumber);
    setRegNum(v.registrationNumber);
    setAddrL1(v.address.line1);
    setAddrL2(v.address.line2 || "");
    setCity(v.address.city);
    setState(v.address.state);
    setPincode(v.address.pincode);
    setWebsite(v.website || "");
    setDescription(v.description || "");
    setBankAcc(v.bankDetails.accountNumber);
    setBankIFSC(v.bankDetails.ifscCode);
    setBankName(v.bankDetails.bankName);
    setPaymentTerms(v.paymentTerms);
    setVendorStatusField(v.status);
    setUploadedDocs(v.documents);
    setShowAddModal(true);
  };

  const handleApproval = (id: string, action: ApprovalStatus) => {
    const v = vendors.find(item => item.id === id);
    if (!v) return;
    const updated: Vendor = {
      ...v,
      approvalStatus: action,
      status: action === "Approved" ? "Active" : action === "Rejected" ? "Rejected" : v.status,
      auditInfo: {
        ...v.auditInfo,
        approvedBy: currentUser,
        approvedDate: new Date().toISOString()
      }
    };
    onUpdateVendor(updated);
    if (selectedVendorForView?.id === id) {
      setSelectedVendorForView(updated);
    }
  };

  // KPI Calculations
  const totalCount = vendors.length;
  const approvedCount = vendors.filter(v => v.approvalStatus === "Approved").length;
  const pendingCount = vendors.filter(v => v.approvalStatus === "Pending").length;
  const activeCount = vendors.filter(v => v.status === "Active").length;
  const suspendedCount = vendors.filter(v => v.status === "Suspended").length;
  const rejectedCount = vendors.filter(v => v.status === "Rejected" || v.approvalStatus === "Rejected").length;

  // Filter & Search Logic
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.contacts.some(c => c.name.toLowerCase().includes(search.toLowerCase())) ||
      v.gstNumber.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || v.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || v.status === selectedStatus;
    const matchesApproval = selectedApproval === "All" || v.approvalStatus === selectedApproval;

    return matchesSearch && matchesCategory && matchesStatus && matchesApproval;
  });

  // Sorting
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    let valA = a[sortBy] ?? "";
    let valB = b[sortBy] ?? "";
    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return 0;
  });

  // Pagination
  const paginatedVendors = sortedVendors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(sortedVendors.length / rowsPerPage);

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>

      {/* DASHBOARD WIDGETS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total", value: totalCount, color: "#1565C0", bg: "#EEF4FF" },
          { label: "Active", value: activeCount, color: "#2E7D32", bg: "#E8F5E9" },
          { label: "Approved", value: approvedCount, color: "#006064", bg: "#E0F7FA" },
          { label: "Pending", value: pendingCount, color: "#FF6F00", bg: "#FFF3E0" },
          { label: "Suspended", value: suspendedCount, color: "#6A1B9A", bg: "#F3E5F5" },
          { label: "Rejected", value: rejectedCount, color: "#C62828", bg: "#FFEBEE" }
        ].map((stat, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>{stat.label}</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#212121" }}>{stat.value}</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: stat.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* LIST HEADER ACTIONS */}
      <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid #E4E7EC" }}>
          
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#667085" }} />
            <input
              placeholder="Search by ID, Company Name, Contact, or GST Number..."
              value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, height: 36, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 13, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }} style={{ height: 36, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 13, padding: "0 10px" }}>
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }} style={{ height: 36, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 13, padding: "0 10px" }}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select value={selectedApproval} onChange={e => { setSelectedApproval(e.target.value); setCurrentPage(1); }} style={{ height: 36, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 13, padding: "0 10px" }}>
              <option value="All">All Approvals</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button onClick={() => { resetForm(); setShowAddModal(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", height: 36 }}>
              <Plus size={15} /> Add Vendor
            </button>
          </div>
        </div>

        {/* TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Vendor ID", "Company Name", "Category", "Primary Contact", "Status", "Approval", "Actions"].map((col, idx) => (
                <th key={idx} style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedVendors.length > 0 ? (
              paginatedVendors.map((v, i) => (
                <tr key={v.id} style={{ borderBottom: "1px solid #E4E7EC", background: i % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                  <td style={{ padding: "14px 18px", fontSize: 12, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{v.id}</td>
                  <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{v.name}</td>
                  <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>{v.category}</td>
                  <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>
                    <div>{v.contacts[0]?.name || "N/A"}</div>
                    <div style={{ fontSize: 10, color: "#667085" }}>{v.contacts[0]?.designation}</div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: v.status === "Active" ? "#E8F5E9" : v.status === "Pending" ? "#FFF3E0" : "#F5F5F5",
                      color: v.status === "Active" ? "#2E7D32" : v.status === "Pending" ? "#FF6F00" : "#616161"
                    }}>{v.status}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: v.approvalStatus === "Approved" ? "#E3F2FD" : v.approvalStatus === "Pending" ? "#FFF3E0" : "#FFEBEE",
                      color: v.approvalStatus === "Approved" ? "#1565C0" : v.approvalStatus === "Pending" ? "#FF6F00" : "#C62828"
                    }}>{v.approvalStatus}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => { setSelectedVendorForView(v); setShowViewModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#1565C0" }} title="View details"><Eye size={15} /></button>
                      <button onClick={() => startEdit(v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#667085" }} title="Edit"><Edit2 size={13} /></button>
                      {currentRole === "Administrator" && (
                        <button onClick={() => { if(confirm("Are you sure?")) onDeleteVendor(v.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#C62828" }} title="Delete"><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#667085", fontSize: 13 }}>No vendors found matching selection.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E4E7EC", background: "#F9FAFB" }}>
            <span style={{ fontSize: 12, color: "#667085" }}>Page {currentPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E4E7EC", background: "#fff", fontSize: 12, cursor: "pointer" }}>Prev</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E4E7EC", background: "#fff", fontSize: 12, cursor: "pointer" }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedVendorForView && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", border: "1px solid #E4E7EC", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #E4E7EC" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 2 }}>{selectedVendorForView.name}</h3>
                <span style={{ fontSize: 12, color: "#667085" }}>Vendor Profile & Details</span>
              </div>
              <button onClick={() => { setSelectedVendorForView(null); setShowViewModal(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* STATUS ACTION SLAT */}
              <div style={{ background: "#F9FAFB", border: "1px solid #E4E7EC", borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>APPROVAL STATUS</div>
                    <div style={{ marginTop: 2 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{selectedVendorForView.approvalStatus}</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>SYSTEM STATUS</div>
                    <div style={{ marginTop: 2 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{selectedVendorForView.status}</span></div>
                  </div>
                </div>

                {(currentRole === "Administrator" || currentRole === "Procurement Manager") && selectedVendorForView.approvalStatus === "Pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleApproval(selectedVendorForView.id, "Approved")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#2E7D32", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <CheckCircle size={14} /> Approve General Registry
                    </button>
                    <button onClick={() => handleApproval(selectedVendorForView.id, "Rejected")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#C62828", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <XCircle size={14} /> Reject Vendor
                    </button>
                  </div>
                )}
              </div>

              {/* CORE INFO SUMMARY GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 12, color: "#1565C0", fontWeight: 700, borderBottom: "1px solid #EEF4FF", paddingBottom: 6, marginBottom: 10 }}>REGISTRATION & TAX</h4>
                  <table style={{ fontSize: 12, width: "100%" }}>
                    <tbody>
                      <tr><td style={{ color: "#667085", width: "40%", paddingTop: 4, paddingBottom: 4 }}>Vendor ID</td><td style={{ fontFamily: "monospace", fontWeight: 600 }}>{selectedVendorForView.id}</td></tr>
                      <tr><td style={{ color: "#667085", paddingTop: 4, paddingBottom: 4 }}>GSTIN</td><td style={{ fontWeight: 600 }}>{selectedVendorForView.gstNumber || "N/A"}</td></tr>
                      <tr><td style={{ color: "#667085", paddingTop: 4, paddingBottom: 4 }}>PAN Card</td><td style={{ fontWeight: 600 }}>{selectedVendorForView.panNumber || "N/A"}</td></tr>
                      <tr><td style={{ color: "#667085", paddingTop: 4, paddingBottom: 4 }}>Reg Number</td><td style={{ fontWeight: 600 }}>{selectedVendorForView.registrationNumber || "N/A"}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 style={{ fontSize: 12, color: "#1565C0", fontWeight: 700, borderBottom: "1px solid #EEF4FF", paddingBottom: 6, marginBottom: 10 }}>BANK SETTINGS</h4>
                  <table style={{ fontSize: 12, width: "100%" }}>
                    <tbody>
                      <tr><td style={{ color: "#667085", width: "40%", paddingTop: 4, paddingBottom: 4 }}>Bank Name</td><td style={{ fontWeight: 600 }}>{selectedVendorForView.bankDetails.bankName || "Axis Bank"}</td></tr>
                      <tr><td style={{ color: "#667085", paddingTop: 4, paddingBottom: 4 }}>Account No</td><td style={{ fontFamily: "monospace", fontWeight: 600 }}>{selectedVendorForView.bankDetails.accountNumber}</td></tr>
                      <tr><td style={{ color: "#667085", paddingTop: 4, paddingBottom: 4 }}>IFSC Code</td><td style={{ fontFamily: "monospace", fontWeight: 600 }}>{selectedVendorForView.bankDetails.ifscCode}</td></tr>
                      <tr><td style={{ color: "#667085", paddingTop: 4, paddingBottom: 4 }}>Payment Terms</td><td style={{ fontWeight: 600 }}>{selectedVendorForView.paymentTerms}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CONTACTS COLUMN */}
              <div>
                <h4 style={{ fontSize: 12, color: "#1565C0", fontWeight: 700, borderBottom: "1px solid #EEF4FF", paddingBottom: 6, marginBottom: 10 }}>CONTACT PERSONS</h4>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F5F5", textAlign: "left" }}>
                      <th style={{ padding: 6 }}>Name</th>
                      <th style={{ padding: 6 }}>Designation</th>
                      <th style={{ padding: 6 }}>Email</th>
                      <th style={{ padding: 6 }}>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVendorForView.contacts.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #E4E7EC" }}>
                        <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: 6 }}>{c.designation}</td>
                        <td style={{ padding: 6 }}>{c.email}</td>
                        <td style={{ padding: 6 }}>{c.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DOCUMENTS */}
              <div>
                <h4 style={{ fontSize: 12, color: "#1565C0", fontWeight: 700, borderBottom: "1px solid #EEF4FF", paddingBottom: 6, marginBottom: 10 }}>SUPPORTING VERIFIED DOCUMENTS</h4>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {selectedVendorForView.documents.length > 0 ? (
                    selectedVendorForView.documents.map((doc, idx) => (
                      <div key={idx} style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: 8, display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB" }}>
                        <FileText size={15} color="#1565C0" />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{doc.name}</div>
                          <div style={{ fontSize: 9, color: "#667085" }}>{doc.size} · {doc.uploadDate}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 11, color: "#667085" }}>No documents uploaded.</span>
                  )}
                </div>
              </div>

              {/* AUDIT TIMESTAMPS */}
              <div style={{ fontSize: 11, color: "#667085", borderTop: "1px solid #E4E7EC", paddingTop: 14 }}>
                <div>Created by: <b>{selectedVendorForView.auditInfo.createdBy}</b> on {selectedVendorForView.auditInfo.createdDate}</div>
                {selectedVendorForView.auditInfo.approvedBy && (
                  <div style={{ marginTop: 2 }}>Approved by: <b>{selectedVendorForView.auditInfo.approvedBy}</b> on {selectedVendorForView.auditInfo.approvedDate}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT VENDOR MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", padding: 20 }}>
          <form onSubmit={handleSave} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 840, maxHeight: "90vh", overflowY: "auto", border: "1px solid #E4E7EC" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #E4E7EC", background: "#F9FAFB" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{editMode ? "Edit Vendor Profile" : "Register New Supplier Profile"}</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>COMPANY/LEGAL ENTITY NAME *</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Acmecorp Pvt Ltd" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>VENDOR CATEGORY *</label>
                  <select value={category} onChange={e => setCategory(e.target.value as VendorCategory)} style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 6 }}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ border: "1px solid #EEF4FF", borderRadius: 8, padding: 12 }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: "#1565C0", marginBottom: 10, textTransform: "uppercase" }}>Primary Point of Contact</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#374151", marginBottom: 2 }}>Contact Name *</label>
                    <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required placeholder="John Doe" style={{ width: "100%", padding: 6, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#374151", marginBottom: 2 }}>Designation</label>
                    <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Sales Exec" style={{ width: "100%", padding: 6, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#374151", marginBottom: 2 }}>Email *</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required placeholder="john@acme.com" style={{ width: "100%", padding: 6, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#374151", marginBottom: 2 }}>Phone *</label>
                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required placeholder="+91 98888 77777" style={{ width: "100%", padding: 6, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#374151", marginBottom: 2 }}>Alternate Phone</label>
                    <input type="tel" value={altPhone} onChange={e => setAltPhone(e.target.value)} placeholder="+91 98888 77776" style={{ width: "100%", padding: 6, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 4 }} />
                  </div>
                </div>
              </div>

              {/* TAX DETAILS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>General Email *</label>
                  <input type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} required placeholder="info@acme.com" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>General Phone *</label>
                  <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="+91 22 4567 8901" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>GSTIN Number</label>
                  <input type="text" value={gstNum} onChange={e => setGstNum(e.target.value)} placeholder="27AAAAA1111A1Z1" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>PAN Card Number</label>
                  <input type="text" value={panNum} onChange={e => setPanNum(e.target.value)} placeholder="AAAAA1111A" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Company Reg Number</label>
                  <input type="text" value={regNum} onChange={e => setRegNum(e.target.value)} placeholder="U72200MH2018PTC123456" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Pincode *</label>
                  <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} required placeholder="400001" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
              </div>

              {/* ADDRESS */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Address Line 1 *</label>
                  <input type="text" value={addrL1} onChange={e => setAddrL1(e.target.value)} required placeholder="Office No 401" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>City *</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} required placeholder="Mumbai" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>State *</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} required placeholder="Maharashtra" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
              </div>

              {/* BANK ACCOUNT & REMAINING FIELDS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Bank Account Number *</label>
                  <input type="text" value={bankAcc} onChange={e => setBankAcc(e.target.value)} required placeholder="9180200..." style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Bank IFSC Code *</label>
                  <input type="text" value={bankIFSC} onChange={e => setBankIFSC(e.target.value)} required placeholder="UTIB0000010" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Bank Name *</label>
                  <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} required placeholder="Axis Bank" style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Payment Terms *</label>
                  <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 6 }}>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
              </div>

              {/* DOCUMENT UPLOAD */}
              <div style={{ border: "1px dashed #B2C3DE", borderRadius: 8, padding: 14, background: "#F5F8FC" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#1565C0", marginBottom: 8, textTransform: "uppercase" }}>Supporting Document Upload (PDF, PNG, JPG / Max 2MB)</label>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <button type="button" onClick={() => document.getElementById("file-loader")?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #B2C3DE", background: "#fff", cursor: "pointer", borderRadius: 6, fontSize: 12 }}>
                    <Upload size={14} /> Choose File
                  </button>
                  <input type="file" id="file-loader" onChange={handleDocUpload} style={{ display: "none" }} />
                  {docUploadError ? (
                    <span style={{ fontSize: 12, color: "#C62828", display: "flex", alignItems: "center", gap: 4 }}><AlertCircle size={14} /> {docUploadError}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: "#667085" }}>Upload GST Certificate / PAN Card</span>
                  )}
                </div>

                {uploadedDocs.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    {uploadedDocs.map(doc => (
                      <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E7EC" }}>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{doc.name} ({doc.size})</span>
                        <button type="button" onClick={() => setUploadedDocs(uploadedDocs.filter(d => d.id !== doc.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#C62828" }}><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SAVE CANCEL */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #E4E7EC", paddingTop: 14 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save Vendor Profile</button>
              </div>

            </div>
          </form>
        </div>
      )}

    </div>
  );
}
