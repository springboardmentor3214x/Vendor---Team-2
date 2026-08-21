import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, X, AlertTriangle, Star } from "lucide-react";
import { procurementService } from "../../services/procurementService";
import type { ProcurementRequest, ApprovedVendor } from "../../models/procurement";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 };

const PERF_COLORS: Record<string, string> = {
  Excellent: "#2E7D32",
  Good: "#1565C0",
  Average: "#E65100",
  Poor: "#C62828",
};

interface Props {
  requestId: number;
  roleColor: string;
  currentRole: string;
  userName: string;
  onBack: () => void;
  onAssigned?: (req: ProcurementRequest) => void;
}

function StarRating({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} fill={i <= value ? "#F59E0B" : "none"} color={i <= value ? "#F59E0B" : "#D1D5DB"} />
      ))}
    </div>
  );
}

function ReliabilityBar({ score }: { score: number }) {
  const color = score >= 90 ? "#2E7D32" : score >= 75 ? "#1565C0" : score >= 60 ? "#E65100" : "#C62828";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 100, overflow: "hidden", minWidth: 60 }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 100, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28 }}>{score}</span>
    </div>
  );
}

export function VendorAssignment({ requestId, roleColor, currentRole, userName, onBack, onAssigned }: Props) {
  const [req, setReq] = useState<ProcurementRequest | null>(null);
  const [vendors, setVendors] = useState<ApprovedVendor[]>([]);
  const [selected, setSelected] = useState<ApprovedVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("All");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      procurementService.getRequestById(requestId),
      procurementService.getApprovedVendors(),
    ]).then(([r, v]) => {
      setReq(r);
      setVendors(v);
      setLoading(false);
    });
  }, [requestId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAssign = async () => {
    if (!selected || !req) return;
    setSubmitting(true);
    await procurementService.assignVendor(req.id, selected.id, selected.name);
    const updated = { ...req, assignedVendorId: selected.id, assignedVendorName: selected.name };
    setReq(updated as ProcurementRequest);
    setShowConfirm(false);
    setSubmitting(false);
    showToast(`${selected.name} assigned to ${req.requestNumber} successfully.`);
    onAssigned?.(updated as ProcurementRequest);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>;

  if (!req) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Request not found.</div>;

  if (req.status !== "Approved") {
    return (
      <div style={{ padding: "24px 28px" }}>
        <button onClick={onBack} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", fontWeight: 600, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ background: "#FFF3E0", border: "1px solid #E65100", borderRadius: 12, padding: 24, maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <AlertTriangle size={32} color="#E65100" style={{ marginBottom: 12 }} />
          <h2 style={{ color: "#E65100", fontSize: 18, fontWeight: 800 }}>Vendor Assignment Not Available</h2>
          <p style={{ color: "#667085", fontSize: 13, marginTop: 8 }}>
            Vendor assignment is only available for requests with <strong>Approved</strong> status.<br />
            This request is currently <strong>{req.status}</strong>.
          </p>
        </div>
      </div>
    );
  }

  const categories = ["All", ...Array.from(new Set(vendors.map(v => v.category)))];
  const filtered = catFilter === "All" ? vendors : vendors.filter(v => v.category === catFilter);

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, background: "#E8F5E9", border: "1px solid #2E7D32", color: "#2E7D32", borderRadius: 8, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}>
          <CheckCircle size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Assign Vendor</h1>
          <span style={{ fontSize: 12, color: "#667085" }}>Select an approved vendor for this procurement request</span>
        </div>
      </div>

      {/* Request summary */}
      <div style={{ ...card, marginBottom: 20, borderLeft: `4px solid ${roleColor}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {[
            ["Request #", req.requestNumber],
            ["Title", req.requestTitle],
            ["Department", req.departmentName],
            ["Item", req.itemName],
            ["Budget", `₹${(req.estimatedBudget / 100000).toFixed(1)} L`],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
            </div>
          ))}
        </div>
        {req.assignedVendorName && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#E8F5E9", borderRadius: 8, fontSize: 12, color: "#2E7D32", fontWeight: 600 }}>
            ✓ Currently assigned: {req.assignedVendorName}
          </div>
        )}
      </div>

      {/* Filter + Assign button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#667085", fontWeight: 600 }}>Filter by category:</span>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "5px 12px", borderRadius: 100, border: `1px solid ${catFilter === c ? roleColor : "#E4E7EC"}`, background: catFilter === c ? roleColor : "#fff", color: catFilter === c ? "#fff" : "#374151", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {c}
            </button>
          ))}
        </div>
        <button
          disabled={!selected}
          onClick={() => setShowConfirm(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: selected ? roleColor : "#E4E7EC", color: selected ? "#fff" : "#9CA3AF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: selected ? "pointer" : "not-allowed", transition: "background 0.2s" }}
        >
          <CheckCircle size={15} /> Assign Vendor{selected ? `: ${selected.name.split(" ")[0]}…` : ""}
        </button>
      </div>

      {/* Vendors Table */}
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Select", "Vendor Name", "Category", "Contact Person", "Reliability", "Performance", "Delivery", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", textAlign: "left", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => {
              const isSelected = selected?.id === v.id;
              return (
                <tr key={v.id} onClick={() => setSelected(isSelected ? null : v)} style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", background: isSelected ? `${roleColor}08` : "transparent", transition: "background 0.15s" }}>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSelected ? roleColor : "#D1D5DB"}`, background: isSelected ? roleColor : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isSelected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{v.name}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{v.vendorCode} · {v.city}, {v.state}</div>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: "#374151" }}>{v.category}</td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{v.contactPerson}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{v.contactEmail}</div>
                  </td>
                  <td style={{ padding: "12px 12px", minWidth: 100 }}>
                    <ReliabilityBar score={v.reliabilityScore} />
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: PERF_COLORS[v.previousPerformance] ?? "#667085" }}>{v.previousPerformance}</span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <StarRating value={v.deliveryRating} />
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: v.status === "Active" ? "#E8F5E9" : "#FFF3E0", color: v.status === "Active" ? "#2E7D32" : "#E65100", borderRadius: 100, padding: "2px 8px" }}>{v.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 440, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 12px 0", color: "#111827" }}>Confirm Vendor Assignment</h3>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 16 }}>
              You are assigning <strong>{selected.name}</strong> to request <strong>{req.requestNumber}</strong> — {req.requestTitle}.
            </p>
            <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 12, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["Vendor Code", selected.vendorCode],
                  ["Category", selected.category],
                  ["Contact", selected.contactPerson],
                  ["Reliability Score", `${selected.reliabilityScore}/100`],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding: "8px 16px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={handleAssign} disabled={submitting} style={{ padding: "8px 20px", background: roleColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Assigning…" : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
