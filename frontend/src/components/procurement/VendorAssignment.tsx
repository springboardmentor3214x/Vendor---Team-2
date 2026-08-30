import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, X, AlertTriangle, Star, Shield, AlertCircle } from "lucide-react";
import { procurementService } from "../../services/procurementService";
import { reliabilityService } from "../../services/reliabilityService";
import type { ProcurementRequest, ApprovedVendor } from "../../models/procurement";
import type { VendorReliability } from "../../models/reliability";

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
  const color = score >= 75 ? "#2E7D32" : score >= 50 ? "#E65100" : "#C62828";
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
  const [vendors, setVendors] = useState<(ApprovedVendor & { reliabilityScore: number; riskLevel: string; recommendationStatus: string; isTopRecommended?: boolean })[]>([]);
  const [selected, setSelected] = useState<(ApprovedVendor & { reliabilityScore: number; riskLevel: string; recommendationStatus: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [highRiskAcknowledged, setHighRiskAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("All");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      procurementService.getRequestById(requestId),
      procurementService.getApprovedVendors(),
      reliabilityService.generateRankings().toPromise(),
    ]).then(([r, vList, relList]) => {
      setReq(r);
      const relMap: Record<string, VendorReliability> = {};
      (relList || []).forEach(rel => {
        relMap[rel.vendorName.toLowerCase()] = rel;
      });

      // Enrich approved vendors with LIVE ReliabilityService metrics
      const enriched = (vList || []).map(v => {
        const match = relMap[v.name.toLowerCase()] || Object.values(relMap).find(m => m.vendorName.toLowerCase().includes(v.name.toLowerCase()));
        return {
          ...v,
          reliabilityScore: match ? match.reliabilityScore : v.reliabilityScore,
          riskLevel: match ? match.riskLevel : (v.reliabilityScore >= 75 ? "Low Risk" : v.reliabilityScore >= 50 ? "Medium Risk" : "High Risk"),
          recommendationStatus: match ? match.recommendationStatus : "Recommended"
        };
      });

      // Sort recommended & high reliability vendors to the top
      enriched.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
      if (enriched.length > 0) {
        (enriched[0] as any).isTopRecommended = true;
      }

      setVendors(enriched);
      setLoading(false);
    });
  }, [requestId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAssign = async () => {
    if (!selected || !req) return;
    if (selected.riskLevel === "High Risk" && !highRiskAcknowledged) return;

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
          <span style={{ fontSize: 12, color: "#667085" }}>Select an approved vendor evaluated by live ReliabilityService metrics</span>
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
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 8, fontSize: 12, color: "#92400E", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} color="#D97706" />
            <span>
              <strong>Currently assigned:</strong> {req.assignedVendorName}. Re-selecting this already assigned vendor is <strong>disabled/invalid</strong>.
            </span>
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
          onClick={() => { setHighRiskAcknowledged(false); setShowConfirm(true); }}
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
              {["Select", "Vendor Name", "Category", "Reliability Score", "Risk Level", "Performance", "Delivery", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#667085", textAlign: "left", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => {
              const isAlreadyAssigned = Boolean(
                (req.assignedVendorId && req.assignedVendorId === v.id) ||
                (req.assignedVendorName && req.assignedVendorName.toLowerCase() === v.name.toLowerCase())
              );
              const isSelected = selected?.id === v.id;
              
              return (
                <tr
                  key={v.id}
                  onClick={() => {
                    if (isAlreadyAssigned) {
                      showToast(`Vendor ${v.name} is already assigned to this request.`);
                      return;
                    }
                    setSelected(isSelected ? null : v);
                  }}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    cursor: isAlreadyAssigned ? "not-allowed" : "pointer",
                    background: isAlreadyAssigned ? "#F8FAFC" : isSelected ? `${roleColor}08` : "transparent",
                    opacity: isAlreadyAssigned ? 0.75 : 1,
                    transition: "background 0.15s"
                  }}
                >
                  <td style={{ padding: "12px 12px" }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${isAlreadyAssigned ? "#CBD5E1" : isSelected ? roleColor : "#D1D5DB"}`,
                        background: isAlreadyAssigned ? "#E2E8F0" : isSelected ? roleColor : "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title={isAlreadyAssigned ? "Already Assigned (Invalid to re-select)" : undefined}
                    >
                      {isSelected && !isAlreadyAssigned && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                      {isAlreadyAssigned && <span style={{ fontSize: 10, color: "#64748B", fontWeight: 800 }}>✕</span>}
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isAlreadyAssigned ? "#64748B" : "#111827" }}>{v.name}</div>
                      {isAlreadyAssigned ? (
                        <span style={{ fontSize: 10, fontWeight: 800, background: "#E2E8F0", color: "#475569", padding: "2px 8px", borderRadius: 100, border: "1px solid #CBD5E1" }}>
                          ✓ Currently Assigned (Invalid to re-select)
                        </span>
                      ) : v.isTopRecommended ? (
                        <span style={{ fontSize: 10, fontWeight: 800, background: "#E8F5E9", color: "#2E7D32", padding: "2px 8px", borderRadius: 100, border: "1px solid #A5D6A7" }}>
                          ✓ Recommended Best Match
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{v.vendorCode} · {v.city}, {v.state}</div>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: "#374151" }}>{v.category}</td>
                  <td style={{ padding: "12px 12px", minWidth: 120 }}>
                    <ReliabilityBar score={v.reliabilityScore} />
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 100,
                        background: v.riskLevel === "Low Risk" ? "#E8F5E9" : v.riskLevel === "Medium Risk" ? "#FFF3E0" : "#FFEBEE",
                        color: v.riskLevel === "Low Risk" ? "#2E7D32" : v.riskLevel === "Medium Risk" ? "#E65100" : "#B71C1C"
                      }}
                    >
                      {v.riskLevel}
                    </span>
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

      {/* Confirm Dialog with HIGH RISK WARNING logic */}
      {showConfirm && selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 480, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)", border: selected.riskLevel === "High Risk" ? "2px solid #B71C1C" : "1px solid #E4E7EC" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px 0", color: selected.riskLevel === "High Risk" ? "#B71C1C" : "#111827", display: "flex", alignItems: "center", gap: 8 }}>
              {selected.riskLevel === "High Risk" ? <AlertCircle size={22} color="#B71C1C" /> : <CheckCircle size={20} color={roleColor} />}
              Confirm Vendor Assignment
            </h3>

            {/* CRITICAL: High Risk Warning Alert */}
            {selected.riskLevel === "High Risk" ? (
              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#991B1B", fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
                  ⚠️ This vendor is classified as High Risk. Additional approval is required. Proceed?
                </p>
                <p style={{ fontSize: 11, color: "#7F1D1D", marginTop: 6, margin: "6px 0 0 0" }}>
                  Selected supplier {selected.name} has a reliability score of <strong>{selected.reliabilityScore}/100</strong> and poses compliance or delivery risk.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#667085", marginBottom: 16 }}>
                You are assigning <strong>{selected.name}</strong> to request <strong>{req.requestNumber}</strong> — {req.requestTitle}.
              </p>
            )}

            <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 12, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["Vendor Code", selected.vendorCode],
                  ["Category", selected.category],
                  ["Reliability Score", `${selected.reliabilityScore}/100`],
                  ["Risk Classification", selected.riskLevel],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: l === "Risk Classification" && v === "High Risk" ? "#B71C1C" : "#111827" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra confirmation checkbox for High Risk Vendors */}
            {selected.riskLevel === "High Risk" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, padding: 12, background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={highRiskAcknowledged}
                  onChange={(e) => setHighRiskAcknowledged(e.target.checked)}
                  style={{ width: 16, height: 16, marginTop: 2 }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>
                  I acknowledge that this vendor is High Risk and confirm assignment.
                </span>
              </label>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding: "8px 16px", border: "1px solid #E4E7EC", background: "#fff", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button
                onClick={handleAssign}
                disabled={submitting || (selected.riskLevel === "High Risk" && !highRiskAcknowledged)}
                style={{
                  padding: "8px 20px",
                  background: selected.riskLevel === "High Risk" ? (highRiskAcknowledged ? "#B71C1C" : "#CBD5E1") : roleColor,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: (submitting || (selected.riskLevel === "High Risk" && !highRiskAcknowledged)) ? "not-allowed" : "pointer"
                }}
              >
                {submitting ? "Assigning…" : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

