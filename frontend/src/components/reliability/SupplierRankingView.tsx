import React, { useState, useEffect } from "react";
import {
  Award, Shield, RefreshCw, Search, Filter, CheckCircle, AlertTriangle, AlertCircle, ArrowUpDown, ChevronRight
} from "lucide-react";

import type { VendorReliability, RiskLevel } from "../../models/reliability";
import { reliabilityService } from "../../services/reliabilityService";

interface SupplierRankingViewProps {
  roleColor: string;
  currentRole: string;
  onSelectVendor: (vendorId: number | string) => void;
  onNavigateTab: (tab: string) => void;
}

export const SupplierRankingView: React.FC<SupplierRankingViewProps> = ({
  roleColor,
  currentRole,
  onSelectVendor,
  onNavigateTab
}) => {
  const [reliabilities, setReliabilities] = useState<VendorReliability[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortField, setSortField] = useState<"rank" | "name" | "score" | "category">("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const canRecalculate = currentRole === "Administrator" || currentRole === "Procurement Manager";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    reliabilityService.generateRankings().subscribe((list) => {
      setReliabilities(list);
    });
  };

  const handleRecalculate = () => {
    setIsRecalculating(true);
    reliabilityService.recalculateAll().subscribe((list) => {
      setReliabilities(list);
      setTimeout(() => setIsRecalculating(false), 500);
    });
  };

  const handleSort = (field: "rank" | "name" | "score" | "category") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "rank" ? true : false);
    }
  };

  // Filter & Sort
  const processedVendors = [...reliabilities]
    .filter((v) => {
      const matchesSearch =
        v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vendorCategory.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === "All" || v.vendorCategory.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortField === "rank") comp = a.rankPosition - b.rankPosition;
      else if (sortField === "score") comp = b.reliabilityScore - a.reliabilityScore;
      else if (sortField === "name") comp = a.vendorName.localeCompare(b.vendorName);
      else if (sortField === "category") comp = a.vendorCategory.localeCompare(b.vendorCategory);
      return sortAsc ? comp : -comp;
    });

  const getMedalBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          label: "1",
          medalIcon: "🥇",
          bg: "#FEF3C7",
          border: "#F59E0B",
          color: "#92400E",
          shadow: "0 2px 8px rgba(245, 158, 11, 0.25)"
        };
      case 2:
        return {
          label: "2",
          medalIcon: "🥈",
          bg: "#F1F5F9",
          border: "#CBD5E1",
          color: "#334155",
          shadow: "0 2px 6px rgba(100, 116, 139, 0.15)"
        };
      case 3:
        return {
          label: "3",
          medalIcon: "🥉",
          bg: "#FFEDD5",
          border: "#F97316",
          color: "#9A3412",
          shadow: "0 2px 6px rgba(249, 115, 22, 0.15)"
        };
      default:
        return null;
    }
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

  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #E4E7EC",
    padding: 24
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "Inter, sans-serif" }}>
      {/* ─── HEADER BAR ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
            <Award size={24} color="#D97706" />
            Official Supplier Reliability Leaderboard
          </h1>
          <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
            Dynamic rankings calculated from real-time performance vector weights and fulfillment history.
          </p>
        </div>

        {canRecalculate && (
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 8,
              border: `1px solid ${roleColor}`,
              background: roleColor,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.2s"
            }}
          >
            <RefreshCw size={15} className={isRecalculating ? "animate-spin" : ""} />
            {isRecalculating ? "Recalculating Engine..." : "Recalculate Rankings"}
          </button>
        )}
      </div>

      {/* ─── PODIUM TOP 3 CARDS ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {reliabilities.slice(0, 3).map((vendor) => {
          const medal = getMedalBadge(vendor.rankPosition);
          const badge = getRiskBadge(vendor.riskLevel);
          return (
            <div
              key={vendor.vendorId}
              onClick={() => { onSelectVendor(vendor.vendorId); onNavigateTab("rel-details"); }}
              style={{
                ...cardStyle,
                background: medal?.bg || "#fff",
                border: `2px solid ${medal?.border || "#E2E8F0"}`,
                boxShadow: medal?.shadow,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{medal?.medalIcon}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: medal?.color }}>RANK #{vendor.rankPosition}</span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", height: 44, display: "flex", alignItems: "center" }}>
                {vendor.vendorName}
              </h3>

              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>{vendor.vendorCategory}</div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>{vendor.reliabilityScore}</div>
                  <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>Reliability Score</span>
                </div>

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
                  {vendor.riskLevel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── RANKINGS TABLE WITH MEDAL STYLING & SORTING ─────────────────────── */}
      <div style={cardStyle}>
        {/* Controls Bar */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search vendor name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 13,
                outline: "none"
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 600 }}
            >
              <option value="All">All Categories</option>
              <option value="IT Vendors">IT Vendors</option>
              <option value="Logistics Partners">Logistics Partners</option>
              <option value="Equipment Vendors">Equipment Vendors</option>
              <option value="Service Providers">Service Providers</option>
              <option value="Maintenance Vendors">Maintenance Vendors</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th
                  style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  onClick={() => handleSort("rank")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    RANK <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  onClick={() => handleSort("name")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    VENDOR NAME <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  onClick={() => handleSort("category")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    CATEGORY <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  onClick={() => handleSort("score")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    RELIABILITY SCORE <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700 }}>
                  PROCUREMENT RISK LEVEL
                </th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontSize: 11, fontWeight: 700 }}>
                  RECOMMENDATION STATUS
                </th>
                <th style={{ padding: "12px 16px", width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {processedVendors.map((v) => {
                const medal = getMedalBadge(v.rankPosition);
                const badge = getRiskBadge(v.riskLevel);
                return (
                  <tr
                    key={v.vendorId}
                    onClick={() => { onSelectVendor(v.vendorId); onNavigateTab("rel-details"); }}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      cursor: "pointer",
                      transition: "background 0.15s"
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      {medal ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 100,
                            background: medal.bg,
                            border: `1px solid ${medal.border}`,
                            color: medal.color,
                            fontWeight: 900,
                            fontSize: 12
                          }}
                        >
                          <span>{medal.medalIcon}</span> #{v.rankPosition}
                        </span>
                      ) : (
                        <span style={{ fontWeight: 800, fontSize: 13, color: "#64748B", paddingLeft: 6 }}>
                          #{v.rankPosition}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0F172A" }}>{v.vendorName}</td>
                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: 12 }}>{v.vendorCategory}</td>
                    <td style={{ padding: "14px 16px", minWidth: 160 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 900, fontSize: 14 }}>{v.reliabilityScore}</span>
                        <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${v.reliabilityScore}%`,
                              background: v.reliabilityScore >= 75 ? "#2E7D32" : v.reliabilityScore >= 50 ? "#E65100" : "#B71C1C"
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
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
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 100,
                          background: v.recommendationStatus === "Recommended" ? "#E8F5E9" : v.recommendationStatus === "Conditional" ? "#FFF3E0" : "#FFEBEE",
                          color: v.recommendationStatus === "Recommended" ? "#2E7D32" : v.recommendationStatus === "Conditional" ? "#E65100" : "#B71C1C",
                          fontSize: 11,
                          fontWeight: 800
                        }}
                      >
                        {v.recommendationStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#94A3B8" }}>
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                );
              })}

              {processedVendors.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#64748B" }}>
                    No ranked suppliers matching filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
