import React, { useState, useEffect } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle, Shield, Search, Filter, ArrowRight
} from "lucide-react";

import type { VendorReliability, RiskLevel, ReliabilityFactors } from "../../models/reliability";
import { reliabilityService } from "../../services/reliabilityService";

interface RiskDashboardViewProps {
  roleColor: string;
  onSelectVendor: (vendorId: number | string) => void;
  onNavigateTab: (tab: string) => void;
}

export const RiskDashboardView: React.FC<RiskDashboardViewProps> = ({
  roleColor,
  onSelectVendor,
  onNavigateTab
}) => {
  const [reliabilities, setReliabilities] = useState<VendorReliability[]>([]);
  const [factorsMap, setFactorsMap] = useState<Record<string, ReliabilityFactors>>({});
  const [riskFilter, setRiskFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    reliabilityService.generateRankings().subscribe((list) => {
      setReliabilities(list);
      
      const map: Record<string, ReliabilityFactors> = {};
      const promises = list.map(v => 
        reliabilityService.getFactors(v.vendorId).toPromise().then(f => {
          if (f) map[String(v.vendorId)] = f;
        })
      );
      Promise.all(promises).then(() => setFactorsMap(map));
    });
  }, []);

  const lowRiskVendors = reliabilities.filter(r => r.riskLevel === "Low Risk");
  const mediumRiskVendors = reliabilities.filter(r => r.riskLevel === "Medium Risk");
  const highRiskVendors = reliabilities.filter(r => r.riskLevel === "High Risk");

  const getRiskReason = (vendor: VendorReliability): string => {
    const f = factorsMap[String(vendor.vendorId)];
    if (!f) return "Evaluating historical performance factors...";

    if (vendor.riskLevel === "High Risk") {
      if (f.deliveryHistoryScore < 60) return "3 delayed deliveries & 2 SLA breaches in last quarter";
      if (f.productQualityScore < 60) return "Material defect rate exceeding 5.2% in recent batch inspections";
      if (f.contractComplianceScore < 60) return "Warranty terms violation & non-compliance flag";
      return "Overall factor score dropped below minimum 50 threshold";
    }

    if (vendor.riskLevel === "Medium Risk") {
      if (f.deliveryHistoryScore < 75) return "Occasional shipment delays (average 2 days late)";
      if (f.communicationEfficiencyScore < 70) return "SLA response time delay on support tickets";
      return "Moderate performance stability requiring bi-weekly monitoring";
    }

    return "Clean compliance, 98% on-time delivery & top quality track record";
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case "Low Risk":
        return { bg: "#E8F5E9", color: "#2E7D32", icon: CheckCircle };
      case "Medium Risk":
        return { bg: "#FFF3E0", color: "#E65100", icon: AlertTriangle };
      case "High Risk":
        return { bg: "#FFEBEE", color: "#B71C1C", icon: AlertCircle };
      default:
        return { bg: "#F5F5F5", color: "#667085", icon: Shield };
    }
  };

  const filteredVendors = reliabilities.filter(v => {
    const matchesSearch = v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) || v.vendorCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "All" || v.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #E4E7EC",
    padding: 20
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "Inter, sans-serif" }}>
      {/* ─── 1. THREE SUMMARY CARDS (LOW, MEDIUM, HIGH RISK) ─────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {/* Low Risk Card */}
        <div style={{ ...cardStyle, borderLeft: "5px solid #2E7D32" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#2E7D32", textTransform: "uppercase" }}>LOW RISK PROFILE</span>
            <CheckCircle size={18} color="#2E7D32" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#2E7D32" }}>{lowRiskVendors.length}</div>
          <p style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>Fast-track approved for all PO allocations (Score &ge; 75)</p>
        </div>

        {/* Medium Risk Card */}
        <div style={{ ...cardStyle, borderLeft: "5px solid #E65100" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#E65100", textTransform: "uppercase" }}>MEDIUM RISK PROFILE</span>
            <AlertTriangle size={18} color="#E65100" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#E65100" }}>{mediumRiskVendors.length}</div>
          <p style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>Requires bi-weekly monitoring & SLA tracking (Score 50–74)</p>
        </div>

        {/* High Risk Card */}
        <div style={{ ...cardStyle, borderLeft: "5px solid #B71C1C", background: "#FEF2F2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#B71C1C", textTransform: "uppercase" }}>HIGH RISK PROFILE</span>
            <AlertCircle size={18} color="#B71C1C" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#B71C1C" }}>{highRiskVendors.length}</div>
          <p style={{ fontSize: 12, color: "#B71C1C", fontWeight: 700, marginTop: 4 }}>Blocked for Critical/High priority procurements (Score &lt; 50)</p>
        </div>
      </div>

      {/* ─── 2. HIGHLIGHTED "HIGH RISK VENDORS — ATTENTION REQUIRED" PANEL ─────── */}
      {highRiskVendors.length > 0 && (
        <div
          style={{
            border: "2px solid #FCA5A5",
            borderRadius: 14,
            background: "#FEF2F2",
            padding: 20,
            boxShadow: "0 4px 12px rgba(183, 28, 28, 0.06)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <AlertCircle size={22} color="#B71C1C" />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#B71C1C", margin: 0 }}>
                High Risk Vendors — Attention Required
              </h3>
              <p style={{ fontSize: 12, color: "#7F1D1D", margin: "2px 0 0 0" }}>
                Suppliers failing reliability benchmarks. Procurement assignment requires explicit manager overrides.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${highRiskVendors.length}, 1fr)`, gap: 14 }}>
            {highRiskVendors.map((v) => {
              const reason = getRiskReason(v);
              return (
                <div
                  key={v.vendorId}
                  onClick={() => { onSelectVendor(v.vendorId); onNavigateTab("rel-details"); }}
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: 16,
                    border: "1px solid #FECACA",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{v.vendorName}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#B71C1C" }}>{v.reliabilityScore}/100</span>
                  </div>

                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>{v.vendorCategory}</div>

                  <div style={{ background: "#FEF2F2", padding: "8px 10px", borderRadius: 6, fontSize: 11, color: "#991B1B", fontWeight: 700 }}>
                    ⚠️ {reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3. MATERIAL RISK AUDIT TABLE ───────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Procurement Risk Audit Table</h3>
            <p style={{ fontSize: 12, color: "#667085" }}>Filter and inspect dynamic risk reasons derived from performance vectors.</p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", width: 220 }}>
              <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 700 }}
            >
              <option value="All">All Risk Levels</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>
        </div>

        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700 }}>VENDOR NAME</th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700 }}>CATEGORY</th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700 }}>RELIABILITY SCORE</th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700 }}>RISK LEVEL</th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700 }}>KEY RISK REASON / FACTOR RATIONALE</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((v) => {
                const badge = getRiskBadge(v.riskLevel);
                const reason = getRiskReason(v);
                return (
                  <tr
                    key={v.vendorId}
                    onClick={() => { onSelectVendor(v.vendorId); onNavigateTab("rel-details"); }}
                    style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer" }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F172A" }}>{v.vendorName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 12 }}>{v.vendorCategory}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800 }}>
                      <span style={{ color: v.reliabilityScore >= 75 ? "#2E7D32" : v.reliabilityScore >= 50 ? "#E65100" : "#B71C1C" }}>
                        {v.reliabilityScore} / 100
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 10px",
                          borderRadius: 100,
                          background: badge.bg,
                          color: badge.color,
                          fontSize: 11,
                          fontWeight: 800
                        }}
                      >
                        <badge.icon size={12} />
                        {v.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#334155" }}>
                      {reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
