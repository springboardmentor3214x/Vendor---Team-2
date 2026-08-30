import React, { useState, useEffect } from "react";
import {
  Award, AlertTriangle, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, CheckCircle, Info, Sparkles
} from "lucide-react";

import type { ProcurementRecommendation } from "../../models/reliability";
import { reliabilityService } from "../../services/reliabilityService";

type PriorityType = "Low" | "Medium" | "High" | "Critical";

interface RecommendationsViewProps {
  roleColor: string;
  onSelectVendor: (vendorId: number | string) => void;
  onNavigateTab: (tab: string) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  roleColor,
  onSelectVendor,
  onNavigateTab
}) => {
  const [category, setCategory] = useState<string>("All");
  const [priority, setPriority] = useState<PriorityType>("High");
  const [recommendations, setRecommendations] = useState<ProcurementRecommendation[]>([]);
  const [showNotRecommended, setShowNotRecommended] = useState<boolean>(false);

  useEffect(() => {
    reliabilityService.getRecommendations(category, priority).subscribe((recs) => {
      setRecommendations(recs);
    });
  }, [category, priority]);

  const isExcluded = (rec: ProcurementRecommendation) => {
    if (rec.riskLevel === "High Risk") return true;
    if ((priority === "High" || priority === "Critical") && rec.riskLevel !== "Low Risk") return true;
    return false;
  };

  const recommendedVendors = recommendations.filter((r) => !isExcluded(r));
  const notRecommendedVendors = recommendations.filter((r) => isExcluded(r));

  const isHighOrCritical = priority === "High" || priority === "Critical";

  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #E4E7EC",
    padding: 24
  };

  const getRiskChip = (riskLevel: string) => {
    switch (riskLevel) {
      case "Low Risk":
        return { bg: "#E8F5E9", color: "#2E7D32" };
      case "Medium Risk":
        return { bg: "#FFF3E0", color: "#E65100" };
      case "High Risk":
        return { bg: "#FFEBEE", color: "#B71C1C" };
      default:
        return { bg: "#F1F5F9", color: "#475569" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "Inter, sans-serif" }}>
      {/* ─── TOP FILTER BAR: CATEGORY DROPDOWN & PRIORITY DROPDOWN ────────────── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={20} color={roleColor} />
              Intelligent Procurement Recommendations
            </h2>
            <p style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
              Select procurement criteria to compute weighted suitability rankings and risk exclusions.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Category Dropdown */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              PRODUCT CATEGORY
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                background: "#fff"
              }}
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Office Supplies">Office Supplies</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              PROCUREMENT PRIORITY
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityType)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 700,
                color: priority === "Critical" ? "#B71C1C" : priority === "High" ? "#E65100" : "#0F172A",
                background: "#fff"
              }}
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority (Strict Low Risk filtering)</option>
              <option value="Critical">Critical Priority (Zero High-Risk tolerance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── MANDATORY NOTE FOR HIGH / CRITICAL PRIORITY ──────────────────────── */}
      {isHighOrCritical && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: 10,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <Info size={20} color="#D97706" />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
            ⚠️ High Risk vendors are automatically excluded for {priority} priority procurement to protect project timelines and quality compliance.
          </div>
        </div>
      )}

      {/* ─── RECOMMENDED VENDORS LIST ───────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0 }}>
          Top Recommended Suppliers ({recommendedVendors.length})
        </h3>

        {recommendedVendors.map((rec) => {
          const riskChip = getRiskChip(rec.riskLevel);
          const recStatus = rec.recommendationRank === 1 ? "Recommended" : "Conditional";
          return (
            <div
              key={rec.vendorId}
              style={{
                ...cardStyle,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderLeft: rec.recommendationRank === 1 ? `6px solid ${roleColor}` : "1px solid #E4E7EC"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: rec.recommendationRank === 1 ? roleColor : "#F1F5F9",
                    color: rec.recommendationRank === 1 ? "#fff" : "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 900
                  }}
                >
                  #{rec.recommendationRank}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#0F172A" }}>{rec.vendorName}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2px 10px",
                        borderRadius: 100,
                        background: riskChip.bg,
                        color: riskChip.color
                      }}
                    >
                      {rec.riskLevel}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2px 10px",
                        borderRadius: 100,
                        background: recStatus === "Recommended" ? "#E8F5E9" : "#FFF3E0",
                        color: recStatus === "Recommended" ? "#2E7D32" : "#E65100"
                      }}
                    >
                      {recStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                    Category: <strong>{rec.category}</strong> &bull; Score: <strong style={{ color: roleColor }}>{rec.reliabilityScore}/100</strong>
                  </div>

                  <div style={{ fontSize: 12, color: "#334155", marginTop: 6, fontWeight: 600 }}>
                    💡 Rationale: {rec.reason}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { onSelectVendor(rec.vendorId); onNavigateTab("rel-details"); }}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: `1px solid ${roleColor}`,
                  background: "#fff",
                  color: roleColor,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                View Factor Details
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── NOT RECOMMENDED COLLAPSED/EXPANDABLE SECTION ───────────────────── */}
      {notRecommendedVendors.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowNotRecommended(!showNotRecommended)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "14px 18px",
              borderRadius: 10,
              border: "1px solid #FECACA",
              background: "#FEF2F2",
              color: "#991B1B",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={18} color="#B71C1C" />
              Not Recommended / Excluded Suppliers ({notRecommendedVendors.length})
            </span>
            {showNotRecommended ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showNotRecommended && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {notRecommendedVendors.map((v) => (
                <div
                  key={v.vendorId}
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #FECACA",
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{v.vendorName}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 100, background: "#FFEBEE", color: "#B71C1C" }}>
                        {v.riskLevel}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#B71C1C", marginTop: 4, fontWeight: 600 }}>
                      Reason for Exclusion: {v.reason}
                    </div>
                  </div>

                  <span style={{ fontSize: 13, fontWeight: 900, color: "#B71C1C" }}>
                    Score: {v.reliabilityScore}/100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
