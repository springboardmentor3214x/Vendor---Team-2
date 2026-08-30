import React, { useState, useEffect } from "react";
import { User, Key, Building2, MapPin, Phone, Mail, CreditCard, FileText, CheckCircle, Clock, XCircle, Upload, Edit, Eye, Save, X, ExternalLink } from "lucide-react";
import { Role, Vendor, VendorDocument, VendorCategory, VendorStatus } from "../data";

interface ProfileProps {
  currentRole: Role;
  userEmail: string;
  userName: string;
  currentVendor?: Vendor | null;   // populated when role === "Vendor"
  onUpdateProfile: (name: string, mobile: string) => void;
  onUpdateVendor?: (v: Vendor) => void;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Active:     { bg: "#E8F5E9", color: "#2E7D32" },
  Pending:    { bg: "#FFF3E0", color: "#E65100" },
  Inactive:   { bg: "#F5F5F5", color: "#616161" },
  Suspended:  { bg: "#F3E5F5", color: "#6A1B9A" },
  Rejected:   { bg: "#FFEBEE", color: "#C62828" },
  Approved:   { bg: "#E3F2FD", color: "#1565C0" },
};

function Badge({ label }: { label: string }) {
  const s = STATUS_STYLE[label] ?? { bg: "#F5F5F5", color: "#616161" };
  return (
    <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {label}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ color: "#667085", minWidth: 140 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#111827", fontFamily: mono ? "monospace" : "inherit", textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

export function UserProfile({ currentRole, userEmail, userName, currentVendor, onUpdateProfile, onUpdateVendor }: ProfileProps) {
  const [name, setName] = useState(userName);
  const [mobile, setMobile] = useState("+91 99888 77766");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [activeVendorTab, setActiveVendorTab] = useState<"overview" | "contact" | "banking" | "documents">("overview");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const v = currentVendor;

  // Vendor editing states
  const [isEditing, setIsEditing] = useState(false);
  const [vName, setVName] = useState(v?.name || "");
  const [vCategory, setVCategory] = useState(v?.category || "IT Vendors");
  const [contactName, setContactName] = useState(v?.contacts[0]?.name || "");
  const [contactDesignation, setContactDesignation] = useState(v?.contacts[0]?.designation || "");
  const [contactEmail, setContactEmail] = useState(v?.contacts[0]?.email || "");
  const [contactPhone, setContactPhone] = useState(v?.contacts[0]?.phone || "");
  const [contactAltPhone, setContactAltPhone] = useState(v?.contacts[0]?.altPhone || "");
  const [vEmail, setVEmail] = useState(v?.email || "");
  const [vPhone, setVPhone] = useState(v?.phone || "");
  const [gstNum, setGstNum] = useState(v?.gstNumber || "");
  const [panNum, setPanNum] = useState(v?.panNumber || "");
  const [regNum, setRegNum] = useState(v?.registrationNumber || "");
  const [addr1, setAddr1] = useState(v?.address.line1 || "");
  const [addr2, setAddr2] = useState(v?.address.line2 || "");
  const [city, setCity] = useState(v?.address.city || "");
  const [stateName, setStateName] = useState(v?.address.state || "");
  const [country, setCountry] = useState(v?.address.country || "");
  const [pincode, setPincode] = useState(v?.address.pincode || "");
  const [website, setWebsite] = useState(v?.website || "");
  const [desc, setDesc] = useState(v?.description || "");
  const [bankAcc, setBankAcc] = useState(v?.bankDetails.accountNumber || "");
  const [bankIfsc, setBankIfsc] = useState(v?.bankDetails.ifscCode || "");
  const [bankName, setBankName] = useState(v?.bankDetails.bankName || "");
  const [payTerms, setPayTerms] = useState(v?.paymentTerms || "Net 30");
  const [vStatus, setVStatus] = useState(v?.status || "Pending");

  // Document modal and uploader states
  const [selectedMockDocType, setSelectedMockDocType] = useState<string | null>(null);
  const [viewingMockDocType, setViewingMockDocType] = useState<string | null>(null);
  const [viewingDocName, setViewingDocName] = useState<string>("");

  useEffect(() => {
    if (v) {
      setVName(v.name);
      setVCategory(v.category);
      setContactName(v.contacts[0]?.name || "");
      setContactDesignation(v.contacts[0]?.designation || "");
      setContactEmail(v.contacts[0]?.email || "");
      setContactPhone(v.contacts[0]?.phone || "");
      setContactAltPhone(v.contacts[0]?.altPhone || "");
      setVEmail(v.email);
      setVPhone(v.phone);
      setGstNum(v.gstNumber);
      setPanNum(v.panNumber);
      setRegNum(v.registrationNumber);
      setAddr1(v.address.line1);
      setAddr2(v.address.line2 || "");
      setCity(v.address.city);
      setStateName(v.address.state);
      setCountry(v.address.country);
      setPincode(v.address.pincode);
      setWebsite(v.website || "");
      setDesc(v.description || "");
      setBankAcc(v.bankDetails.accountNumber);
      setBankIfsc(v.bankDetails.ifscCode);
      setBankName(v.bankDetails.bankName || "");
      setPayTerms(v.paymentTerms);
      setVStatus(v.status);
    }
  }, [v]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      setErrorMsg("Name and mobile are mandatory.");
      return;
    }
    setErrorMsg("");
    onUpdateProfile(name, mobile);
    setSuccessMsg("Profile details saved successfully.");
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const handlePassChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass.trim()) { setErrorMsg("New password cannot be empty."); return; }
    if (newPass !== confirmPass) { setErrorMsg("New passwords do not match."); return; }
    if (newPass.length < 6) { setErrorMsg("Password must be at least 6 characters."); return; }
    setErrorMsg("");
    setSuccessMsg("Password updated successfully.");
    setOldPass(""); setNewPass(""); setConfirmPass("");
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v) return;

    if (!vName.trim()) {
      setErrorMsg("Company Name is required.");
      return;
    }
    if (!vEmail.trim()) {
      setErrorMsg("Main Email Address is required.");
      return;
    }
    if (!vPhone.trim()) {
      setErrorMsg("Main Phone Number is required.");
      return;
    }

    const updatedVendor: Vendor = {
      ...v,
      name: vName,
      category: vCategory as any,
      email: vEmail,
      phone: vPhone,
      gstNumber: gstNum,
      panNumber: panNum,
      registrationNumber: regNum,
      address: {
        line1: addr1,
        line2: addr2,
        city: city,
        state: stateName,
        country: country,
        pincode: pincode
      },
      website: website,
      description: desc,
      bankDetails: {
        accountNumber: bankAcc,
        ifscCode: bankIfsc,
        bankName: bankName || v.bankDetails.bankName
      },
      paymentTerms: payTerms,
      status: vStatus as any,
      contacts: [
        {
          name: contactName,
          designation: contactDesignation,
          email: contactEmail,
          phone: contactPhone,
          altPhone: contactAltPhone
        },
        ...(v.contacts.slice(1))
      ]
    };

    if (onUpdateVendor) {
      onUpdateVendor(updatedVendor);
    }
    setIsEditing(false);
    setErrorMsg("");
    setSuccessMsg("Vendor Company Profile updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const loadPic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !v) return;

    // Create a new mock VendorDocument
    const newDoc: VendorDocument = {
      id: "doc-" + Math.floor(100 + Math.random() * 900),
      name: file.name,
      type: type,
      fileUrl: "#", // Click will open our interactive modal modal
      uploadDate: new Date().toISOString().slice(0, 10),
      size: (file.size / 1024 >= 1024)
        ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
        : (file.size / 1024).toFixed(0) + " KB"
    };

    // Filter out previous documents of the same type if replacing, and add new
    let updatedDocs = v.documents.filter(d => d.type !== type);
    updatedDocs.push(newDoc);

    const updatedVendor: Vendor = {
      ...v,
      documents: updatedDocs
    };

    if (onUpdateVendor) {
      onUpdateVendor(updatedVendor);
    }

    setSuccessMsg(`Document ${file.name} uploaded successfully as ${type}!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>
          {currentRole === "Vendor" ? "Vendor Company Profile" : "Edit User Profile Details"}
        </h2>
        <span style={{ fontSize: 13, color: "#667085" }}>
          {currentRole === "Vendor"
            ? "Your company registration details, contacts, banking, and documents"
            : "Configure your personal preferences and credentials"}
        </span>
      </div>

      {errorMsg && (
        <div style={{ background: "#FFEBEE", border: "1px solid #C6282830", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#C62828", marginBottom: 20 }}>{errorMsg}</div>
      )}
      {successMsg && (
        <div style={{ background: "#E8F5E9", border: "1px solid #2E7D3230", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#2E7D32", marginBottom: 20 }}>{successMsg}</div>
      )}

      {/* ═══════ VENDOR ROLE — rich company profile ═══════ */}
      {currentRole === "Vendor" && v && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Identity Banner */}
          <div style={{ background: "linear-gradient(135deg,#1565C0 0%,#0D47A1 100%)", borderRadius: 14, padding: "20px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 size={28} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{v.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{v.id} · {v.category}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge label={v.status} />
              <Badge label={v.approvalStatus} />
              <button type="button" onClick={() => setIsEditing(true)} style={{ marginLeft: 10, display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#1565C0", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <Edit size={13} /> Edit Profile
              </button>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveVendor} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E7EC", paddingBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Edit Corporate Profile Info</span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "6px 14px", background: "#F5F5F5", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#374151" }}>Cancel</button>
                  <button type="submit" style={{ padding: "6px 14px", background: "#1565C0", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 4 }}><Save size={13} /> Save Details</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {/* 22 Required Fields */}
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>COMPANY NAME</label>
                  <input type="text" value={vName} onChange={e => setVName(e.target.value)} required style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>VENDOR CATEGORY</label>
                  <select value={vCategory} onChange={e => setVCategory(e.target.value as any)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }}>
                    <option value="Raw Material Suppliers">Raw Material Suppliers</option>
                    <option value="Equipment Vendors">Equipment Vendors</option>
                    <option value="IT Vendors">IT Vendors</option>
                    <option value="Service Providers">Service Providers</option>
                    <option value="Logistics Partners">Logistics Partners</option>
                    <option value="Maintenance Vendors">Maintenance Vendors</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>VENDOR STATUS</label>
                  <select value={vStatus} onChange={e => setVStatus(e.target.value as any)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }}>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>CONTACT PERSON NAME</label>
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>DESIGNATION</label>
                  <input type="text" value={contactDesignation} onChange={e => setContactDesignation(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>EMAIL ADDRESS</label>
                  <input type="email" value={vEmail} onChange={e => setVEmail(e.target.value)} required style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>PHONE NUMBER</label>
                  <input type="text" value={vPhone} onChange={e => setVPhone(e.target.value)} required style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>ALTERNATE PHONE</label>
                  <input type="text" value={contactAltPhone} onChange={e => setContactAltPhone(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>GST NUMBER</label>
                  <input type="text" value={gstNum} onChange={e => setGstNum(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>PAN NUMBER</label>
                  <input type="text" value={panNum} onChange={e => setPanNum(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>COMPANY REG NUMBER</label>
                  <input type="text" value={regNum} onChange={e => setRegNum(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>WEBSITE</label>
                  <input type="text" value={website} onChange={e => setWebsite(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>ADDRESS LINE 1</label>
                  <input type="text" value={addr1} onChange={e => setAddr1(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>ADDRESS LINE 2</label>
                  <input type="text" value={addr2} onChange={e => setAddr2(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>CITY</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>STATE</label>
                  <input type="text" value={stateName} onChange={e => setStateName(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>COUNTRY</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>PINCODE</label>
                  <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>BANK NAME</label>
                  <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>BANK ACCOUNT NO.</label>
                  <input type="text" value={bankAcc} onChange={e => setBankAcc(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>IFSC CODE</label>
                  <input type="text" value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>PAYMENT TERMS</label>
                  <select value={payTerms} onChange={e => setPayTerms(e.target.value)} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12 }}>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>CORPORATE DESCRIPTION</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} style={{ width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 12, resize: "none", fontFamily: "inherit" }} />
                </div>
              </div>
            </form>
          ) : (
            <>
              {/* Tab Switcher */}
              <div style={{ display: "flex", gap: 0, background: "#F1F5F9", borderRadius: 10, padding: 4, width: "fit-content" }}>
                {(["overview", "contact", "banking", "documents"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveVendorTab(tab)} style={{
                    padding: "6px 18px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                    background: activeVendorTab === tab ? "#fff" : "transparent",
                    color: activeVendorTab === tab ? "#1565C0" : "#667085",
                    boxShadow: activeVendorTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
                  }}>{tab}</button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeVendorTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 12, fontWeight: 700, color: "#1565C0" }}>
                      <Building2 size={14} /> COMPANY DETAILS
                    </div>
                    <InfoRow label="Company Name"        value={v.name} />
                    <InfoRow label="Vendor Category"     value={v.category} />
                    <InfoRow label="Vendor ID"           value={v.id} mono />
                    <InfoRow label="GST Number"          value={v.gstNumber || "Not provided"} mono />
                    <InfoRow label="PAN Number"          value={v.panNumber || "Not provided"} mono />
                    <InfoRow label="Reg Number"          value={v.registrationNumber || "Not provided"} mono />
                    <InfoRow label="Website"             value={v.website} />
                    {v.description && (
                      <div style={{ marginTop: 10, fontSize: 11, color: "#667085", lineHeight: 1.5 }}>{v.description}</div>
                    )}
                  </div>

                  <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 12, fontWeight: 700, color: "#1565C0" }}>
                      <MapPin size={14} /> REGISTERED ADDRESS
                    </div>
                    <InfoRow label="Address Line 1"  value={v.address.line1} />
                    {v.address.line2 && <InfoRow label="Address Line 2" value={v.address.line2} />}
                    <InfoRow label="City"            value={v.address.city} />
                    <InfoRow label="State"           value={v.address.state} />
                    <InfoRow label="Country"         value={v.address.country} />
                    <InfoRow label="Pincode"         value={v.address.pincode} mono />

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 18, fontSize: 12, fontWeight: 700, color: "#1565C0" }}>
                      <Phone size={14} /> GENERAL CONTACT
                    </div>
                    <InfoRow label="Email"     value={v.email} />
                    <InfoRow label="Phone"     value={v.phone} />
                  </div>

                  {/* Registered/Log-In details box to resolve "First constant name" dashboard issue */}
                  <div style={{ background: "#EEF4FF", border: "1px solid #1565C040", borderRadius: 12, padding: 18, gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={20} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1565C0", letterSpacing: "0.08em" }}>AUTHORIZED LOGGED IN REPRESENTATIVE</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginTop: 2 }}>{userName}</div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 1 }}>Account Email: <span style={{ fontFamily: "monospace" }}>{userEmail}</span> • Access Level: <span style={{ fontWeight: 600 }}>Vendor Corporate Representative</span></div>
                    </div>
                  </div>

                  {/* Audit trail */}
                  <div style={{ background: "#F9FAFB", border: "1px solid #E4E7EC", borderRadius: 12, padding: 16, gridColumn: "1 / -1" }}>
                    <div style={{ display: "flex", gap: 32, fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={13} color="#9CA3AF" />
                        <span style={{ color: "#667085" }}>Registered:</span>
                        <span style={{ fontWeight: 700 }}>{v.auditInfo.createdBy} • {v.auditInfo.createdDate}</span>
                      </div>
                      {v.auditInfo.approvedBy && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle size={13} color="#2E7D32" />
                          <span style={{ color: "#667085" }}>Approved by:</span>
                          <span style={{ fontWeight: 700, color: "#2E7D32" }}>{v.auditInfo.approvedBy} • {v.auditInfo.approvedDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeVendorTab === "contact" && (
                <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #E4E7EC", display: "flex", alignItems: "center", gap: 6 }}>
                    <Mail size={14} color="#1565C0" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Contact Persons</span>
                    <span style={{ marginLeft: "auto", background: "#EEF4FF", color: "#1565C0", borderRadius: 100, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>{v.contacts.length} contact{v.contacts.length !== 1 ? "s" : ""}</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Name", "Designation", "Email", "Phone", "Alt Phone"].map((h, i) => (
                          <th key={i} style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {v.contacts.map((c, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "13px 18px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{c.name}</td>
                          <td style={{ padding: "13px 18px", fontSize: 12, color: "#374151" }}>{c.designation || "—"}</td>
                          <td style={{ padding: "13px 18px", fontSize: 12, color: "#1565C0" }}>{c.email}</td>
                          <td style={{ padding: "13px 18px", fontSize: 12, color: "#374151" }}>{c.phone}</td>
                          <td style={{ padding: "13px 18px", fontSize: 12, color: "#374151" }}>{c.altPhone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Banking Tab */}
              {activeVendorTab === "banking" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 12, fontWeight: 700, color: "#1565C0" }}>
                      <CreditCard size={14} /> BANK ACCOUNT DETAILS
                    </div>
                    <InfoRow label="Bank Name"       value={v.bankDetails.bankName || "State Bank of India"} />
                    <InfoRow label="Account Number"  value={v.bankDetails.accountNumber} mono />
                    <InfoRow label="IFSC Code"       value={v.bankDetails.ifscCode} mono />
                    <div style={{ marginTop: 16, background: "#F9FAFB", borderRadius: 8, padding: 12, border: "1px solid #E4E7EC" }}>
                      <div style={{ fontSize: 11, color: "#667085", marginBottom: 4 }}>PAYMENT TERMS</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>{v.paymentTerms}</div>
                    </div>
                  </div>
                  <div style={{ background: "#EEF4FF", border: "1px solid #C7D7F7", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1565C0" }}>PAYMENT STATUS REMINDER</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                      Payments are processed as per your contractual <b>{v.paymentTerms}</b> terms after invoice approval.
                      Contact the Finance Officer for any disputes or discrepancies.
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab - Dynamic check for mandatory certificates with upload/replace and immersive viewer */}
              {activeVendorTab === "documents" && (
                <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #E4E7EC", display: "flex", alignItems: "center", gap: 6 }}>
                    <FileText size={14} color="#1565C0" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Supporting Corporate Documents</span>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { key: "GST Certificate", label: "GST Certificate", required: true },
                        { key: "PAN Card", label: "PAN Card (Permanent Account Number)", required: true },
                        { key: "Company Registration Certificate", label: "Company Registration Certificate", required: true },
                        { key: "ISO Certificate", label: "ISO Quality Standards Certificate (if applicable)", required: false },
                        { key: "Other Supporting Documents", label: "Other Supporting / Credentials Documents", required: false }
                      ].map((docType) => {
                        const match = v.documents.find(d => d.type === docType.key);
                        return (
                          <div key={docType.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid #E4E7EC", borderRadius: 10, background: match ? "#fff" : "#F9FAFB" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: match ? "#EEF4FF" : "#F2F4F7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FileText size={18} color={match ? "#1565C0" : "#667085"} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
                                  {docType.label}
                                  {docType.required && <span style={{ color: "#D92D20", fontSize: 10 }}>* REQUIRED</span>}
                                </div>
                                {match ? (
                                  <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                                    <span style={{ fontWeight: 600, color: "#344054" }}>{match.name}</span> ({match.size}) • Uploaded: {match.uploadDate}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>Not uploaded yet</div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              {match && (
                                <button type="button" onClick={() => { setViewingMockDocType(docType.key); setViewingDocName(match.name); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "#EEF4FF", border: "1px solid #C7D7F7", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#1565C0", cursor: "pointer" }}>
                                  <Eye size={12} /> View
                                </button>
                              )}
                              <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#344054", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                <Upload size={12} /> {match ? "Replace" : "Upload"}
                                <input type="file" onChange={(e) => handleDocUpload(e, docType.key)} style={{ display: "none" }} />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Immersive Document Modal */}
          {viewingMockDocType && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 650, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
                
                {/* Modal Header */}
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>{viewingMockDocType} Preview</h3>
                    <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>File Name: {viewingDocName}</p>
                  </div>
                  <button onClick={() => setViewingMockDocType(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748B", padding: 4 }} title="Close">
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Preview Area */}
                <div style={{ padding: 24, background: "#F1F5F9", display: "flex", justifyContent: "center", overflowY: "auto", flex: 1 }}>
                  {viewingMockDocType === "GST Certificate" && (
                    <div style={{ background: "#FFFDF6", width: "100%", maxWidth: 500, padding: 30, border: "2px solid #D97706", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", position: "relative", fontFamily: "Georgia, serif" }}>
                      <div style={{ position: "absolute", top: 10, right: 10, fontSize: 8, color: "#D97706", border: "1px solid #D97706", padding: "2px 6px" }}>FORM GST REG-06</div>
                      <div style={{ textAlign: "center", borderBottom: "2px solid #1E293B", paddingBottom: 15 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#1E3A8A" }}>GOVERNMENT OF INDIA</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginTop: 2 }}>DEPARTMENT OF REVENUE • GST GOODS AND SERVICES TAX</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#B45309", marginTop: 6 }}>REGISTRATION CERTIFICATE</div>
                      </div>
                      <table style={{ width: "100%", marginTop: 15, borderCollapse: "collapse", fontSize: 9, textAlign: "left" }}>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid #E5E7EB" }}><td style={{ padding: "6px 0", fontWeight: 700 }}>Registration Number / GSTIN:</td><td style={{ fontFamily: "monospace" }}>{gstNum || "27AAAAA1111A1Z1"}</td></tr>
                          <tr style={{ borderBottom: "1px solid #E5E7EB" }}><td style={{ padding: "6px 0", fontWeight: 700 }}>Legal Name:</td><td>{vName}</td></tr>
                          <tr style={{ borderBottom: "1px solid #E5E7EB" }}><td style={{ padding: "6px 0", fontWeight: 700 }}>Trade Name:</td><td>{vName} Private Limited</td></tr>
                          <tr style={{ borderBottom: "1px solid #E5E7EB" }}><td style={{ padding: "6px 0", fontWeight: 700 }}>Constitution of Business:</td><td>Private Limited Company</td></tr>
                          <tr style={{ borderBottom: "1px solid #E5E7EB" }}><td style={{ padding: "6px 0", fontWeight: 700 }}>Registered Address:</td><td>{addr1}, {city}, {stateName}, {country} - {pincode}</td></tr>
                          <tr style={{ borderBottom: "1px solid #E5E7EB" }}><td style={{ padding: "6px 0", fontWeight: 700 }}>Date of Liability:</td><td>01/04/2022</td></tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: 25, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ border: "2px double #059669", color: "#059669", borderRadius: "50%", width: 60, height: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 6, fontWeight: 900, transform: "rotate(-10deg)" }}>
                          <span>GST SERVICE</span>
                          <span style={{ fontSize: 8 }}>VERIFIED</span>
                        </div>
                        <div style={{ textAlign: "right", fontSize: 8, color: "#64748B" }}>
                          <div>Digitally signed by GST System Officer</div>
                          <div style={{ fontFamily: "monospace", fontSize: 7 }}>Date: {new Date().toISOString().slice(0, 10)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewingMockDocType === "PAN Card" && (
                    <div style={{ background: "linear-gradient(135deg, #065F46 0%, #064E3B 100%)", width: "100%", maxWidth: 420, height: 255, borderRadius: 14, padding: 20, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
                      <div style={{ position: "absolute", top: 12, right: 16, fontSize: 8, opacity: 0.7 }}>INCOME TAX DEPARTMENT • GOVT OF INDIA</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.05em" }}>आयकर विभाग CARD</div>
                        <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>PERMANENT ACCOUNT NUMBER CARD</div>
                      </div>
                      <div style={{ display: "flex", gap: 16, margin: "14px 0" }}>
                        <div style={{ width: 60, height: 70, background: "rgba(255,255,255,0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <User size={32} color="rgba(255,255,255,0.7)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 8, opacity: 0.7 }}>NAME IN FULL / REGISTRANT</div>
                          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>{vName}</div>
                          <div style={{ fontSize: 8, opacity: 0.7, marginTop: 8 }}>PRIMARY DIRECT REPRESENTATIVE</div>
                          <div style={{ fontSize: 10, fontWeight: 700 }}>{contactName || "FOUNDING MEMBER"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                        <div>
                          <div style={{ fontSize: 8, opacity: 0.7 }}>PERMANENT ACCOUNT NUMBER (PAN)</div>
                          <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", letterSpacing: "1.5px", color: "#FBBF24" }}>{panNum || "ABCDE1234F"}</div>
                        </div>
                        <div style={{ width: 40, height: 40, background: "#fff", padding: 2, borderRadius: 4 }}>
                          <div style={{ width: "100%", height: "100%", background: "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: "#fff", fontWeight: 905 }}>QR CODE</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewingMockDocType === "Company Registration Certificate" && (
                    <div style={{ background: "#FCFAF2", width: "100%", maxWidth: 500, padding: 30, border: "2px dashed #0369A1", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", position: "relative", fontFamily: "Times New Roman, serif" }}>
                      <div style={{ textAlign: "center", borderBottom: "1px solid #0369A1", paddingBottom: 15 }}>
                        <div style={{ fontSize: 13, fontWeight: 900 }}>भारत सरकार (GOVERNMENT OF INDIA)</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#0284C7", marginTop: 2 }}>MINISTRY OF CORPORATE AFFAIRS</div>
                        <div style={{ fontSize: 9, color: "#475569" }}>Registrar of Companies, Mumbai</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0369A1", marginTop: 10 }}>CERTIFICATE OF INCORPORATION</div>
                      </div>
                      <div style={{ fontSize: 10, lineHeight: 1.6, color: "#1E293B", marginTop: 16 }}>
                        <p style={{ textIndent: 20 }}>I hereby certify that <b>{vName}</b> is this day incorporated under the Companies Act, 2013 and that the company is limited by shares.</p>
                        <p style={{ marginTop: 10 }}>The Corporate Identity Number (CIN) of the company is:</p>
                        <p style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11, textAlign: "center", margin: "8px 0", color: "#0369A1" }}>{regNum || "U72200MH2022PTC384812"}</p>
                        <p>Given under my hand at Mumbai this {new Date().getDate()}th day of {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}.</p>
                      </div>
                      <div style={{ marginTop: 25, display: "flex", justifyContent: "flex-end" }}>
                        <div style={{ textTransform: "uppercase", fontSize: 8, color: "#475569", border: "1px solid #94A3B8", padding: 8, background: "#fff", textAlign: "center" }}>
                          <div style={{ fontWeight: 900, color: "#0369A1" }}>MCA DIGITAL SEAL</div>
                          <div>Registrar of Companies</div>
                          <div style={{ fontSize: 6, marginTop: 2 }}>Date: {new Date().toISOString().slice(0, 10)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewingMockDocType === "ISO Certificate" && (
                    <div style={{ background: "#FAFDFE", width: "100%", maxWidth: 500, padding: 30, border: "3px double #0F766E", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", position: "relative", textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#0F766E", letterSpacing: "0.2em" }}>GLOBAL QA REGULATION STANDARDS</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginTop: 10 }}>CERTIFICATE OF QUALITY</div>
                      <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>This is to certify that the Quality Management System of</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#0D9488", margin: "14px 0" }}>{vName}</div>
                      <div style={{ fontSize: 10, color: "#374151" }}>Has been assessed and found to comply with:</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#111827", margin: "10px 0", letterSpacing: "1px" }}>ISO 9001:2015</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>Scope: Provision of Software Engineering, Procurement & IT Support Operations.</div>
                      <div style={{ margin: "20px auto 0", width: 120, borderTop: "1px solid #E2E8F0", paddingTop: 10, fontSize: 8, color: "#64748B" }}>
                        <div>Certificate No: ISO-9098762</div>
                        <div style={{ marginTop: 2 }}>Expires: 31/12/2028</div>
                      </div>
                    </div>
                  )}

                  {viewingMockDocType === "Other Supporting Documents" && (
                    <div style={{ background: "#fff", width: "100%", maxWidth: 500, padding: 30, border: "1px solid #CBD5E1", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #0F172A", paddingBottom: 10, alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 900 }}>{vName}</div>
                        <div style={{ fontSize: 8, color: "#64748B" }}>CREDENTIAL DIRECT NOTE</div>
                      </div>
                      <div style={{ marginTop: 16, fontSize: 11, lineHeight: 1.6, color: "#334155" }}>
                        <p style={{ fontWeight: 700 }}>To Whom It May Concern:</p>
                        <p style={{ marginTop: 10 }}>This letter confirms that the registered vendor representative {contactName} ({contactDesignation}) has full signing authority for all procurement, bidding, and purchase order verification logs on the VendorIQ intelligence system.</p>
                        <p style={{ marginTop: 10 }}>All transactional activities logs are verified under the corporate signature register.</p>
                      </div>
                      <div style={{ marginTop: 30, borderTop: "1px solid #E2E8F0", paddingTop: 15, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 8, color: "#64748B" }}>
                        <div>SYSTEM: VENDORIQ CERTIFIED</div>
                        <div style={{ textAlign: "right" }}>
                          <div>Authorized Signature:</div>
                          <div style={{ fontWeight: 700, color: "#0F172A", marginTop: 4 }}>{contactName}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div style={{ padding: "12px 24px", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "flex-end", background: "#F8FAFC" }}>
                  <button onClick={() => setViewingMockDocType(null)} style={{ padding: "6px 16px", background: "#1E293B", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Close Preview</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ VENDOR ROLE — no vendor record matched ═══════ */}
      {currentRole === "Vendor" && !v && (
        <div style={{ background: "#FFF3E0", border: "1px solid #E6510040", borderRadius: 12, padding: 24, textAlign: "center", maxWidth: 600 }}>
          <Building2 size={32} color="#E65100" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E65100", marginBottom: 6 }}>Vendor Profile Not Linked</div>
          <div style={{ fontSize: 13, color: "#374151" }}>
            Your account is not yet linked to a vendor profile. Please contact the Administrator to complete your registration.
          </div>
        </div>
      )}

      {/* ═══════ NON-VENDOR ROLES — standard profile ═══════ */}
      {currentRole !== "Vendor" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: "100%" }}>

          {/* PERSONAL INFO */}
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1565C0", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <User size={16} /> Personal Information
            </h3>

            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
              <div style={{ position: "relative" }}>
                {profilePic ? (
                  <img src={profilePic} alt="profile" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EEF4FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={24} color="#1565C0" />
                  </div>
                )}
                <input type="file" id="pic-loader" onChange={loadPic} style={{ display: "none" }} />
                <button onClick={() => document.getElementById("pic-loader")?.click()}
                  style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", border: "2px solid #fff", background: "#1565C0", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, cursor: "pointer", fontWeight: 700 }} title="Upload pic">
                  <Upload size={10} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: "1.2" }}>{name}</span>
                <span style={{ fontSize: 11, color: "#667085" }}>Role: <b>{currentRole}</b></span>
                <span style={{ fontSize: 11, color: "#667085" }}>{userEmail}</span>
              </div>
            </div>

            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Registered Email</label>
                <input type="email" value={userEmail} disabled style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", background: "#F5F5F5", color: "#667085" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mobile Number</label>
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} required style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Department / Role</label>
                <input type="text" value={currentRole} disabled style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", background: "#F5F5F5", color: "#667085" }} />
              </div>
              <button type="submit" style={{ padding: "10px 20px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", width: "max-content", marginTop: 8, fontFamily: "Inter, sans-serif" }}>
                Save Details
              </button>
            </form>
          </div>

          {/* PASSWORD */}
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1565C0", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <Key size={16} /> Security &amp; Password
            </h3>
            <form onSubmit={handlePassChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Password</label>
                <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} required placeholder="••••••••" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required placeholder="••••••••" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm New Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required placeholder="••••••••" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>
              <button type="submit" style={{ padding: "10px 20px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", width: "max-content", marginTop: 8, fontFamily: "Inter, sans-serif" }}>
                Change Password
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
