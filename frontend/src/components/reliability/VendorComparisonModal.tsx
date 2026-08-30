import React from "react";
import { X, Shield, Award, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

import type {
  VendorReliability,
  ReliabilityFactors
} from "../../models/reliability";
import { reliabilityService } from "../../services/reliabilityService";

interface VendorComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVendors: VendorReliability[];
  roleColor: string;
}

export const VendorComparisonModal: React.FC<VendorComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedVendors,
  roleColor
}) => {
  const [factorsMap, setFactorsMap] = React.useState<Record<string, ReliabilityFactors>>({});

  React.useEffect(() => {
    if (isOpen && selectedVendors.length > 0) {
      const map: Record<string, ReliabilityFactors> = {};
      const promises = selectedVendors.map(v => 
        reliabilityService.getFactors(v.vendorId).toPromise().then(f => {
          if (f) map[String(v.vendorId)] = f;
        })
      );
      Promise.all(promises).then(() => setFactorsMap(map));
    }
  }, [isOpen, selectedVendors]);

  if (!isOpen) return null;

  // Colors for comparison bars per vendor
  const vendorColors = ["#1565C0", "#2E7D32", "#E65100", "#6A1B9A"];

  // Prepare Grouped Bar Chart Data: 6 Factors as X-Axis categories, each vendor as a bar series
  const factorNames = [
    { key: "deliveryHistoryScore", label: "Delivery (25%)" },
    { key: "productQualityScore", label: "Quality (25%)" },
    { key: "communicationEfficiencyScore", label: "Comm (15%)" },
    { key: "contractComplianceScore", label: "Compliance (15%)" },
    { key: "purchaseHistoryScore", label: "Purchase (10%)" },
    { key: "issueResolutionScore", label: "Resolution (10%)" }
  ];

  const chartData = factorNames.map(f => {
    const entry: Record<string, any> = { factor: f.label };
    selectedVendors.forEach(v => {
      const vFactors = factorsMap[String(v.vendorId)];
      entry[v.vendorName] = vFactors ? (vFactors as any)[f.key] : 0;
    });
    return entry;
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: 20
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 960,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#F8FAFC"
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 10 }}>
              <Shield size={22} color={roleColor} />
              Side-by-Side Vendor Reliability Comparison
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              Comparing {selectedVendors.length} selected suppliers across overall reliability scores and six factor vectors.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#E2E8F0",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#475569"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Top Summary Metric Cards for Selected Vendors */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${selectedVendors.length}, 1fr)`, gap: 16 }}>
            {selectedVendors.map((v, idx) => {
              const color = vendorColors[idx % vendorColors.length];
              return (
                <div
                  key={v.vendorId}
                  style={{
                    border: `2px solid ${color}`,
                    borderRadius: 12,
                    padding: 16,
                    background: `${color}06`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>RANK #{v.rankPosition}</span>
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", height: 40, display: "flex", alignItems: "center" }}>
                    {v.vendorName}
                  </h3>

                  <div style={{ fontSize: 26, fontWeight: 800, color: color, margin: "8px 0" }}>
                    {v.reliabilityScore} <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>/ 100</span>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: v.riskLevel === "Low Risk" ? "#E8F5E9" : v.riskLevel === "Medium Risk" ? "#FFF3E0" : "#FFEBEE",
                        color: v.riskLevel === "Low Risk" ? "#2E7D32" : v.riskLevel === "Medium Risk" ? "#E65100" : "#B71C1C"
                      }}
                    >
                      {v.riskLevel}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: "#F1F5F9",
                        color: "#475569"
                      }}
                    >
                      {v.recommendationStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grouped Bar Chart Visualizing Six Factors */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, background: "#fff" }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>
              Factor-by-Factor Score Comparison (0–100)
            </h4>

            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="factor" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {selectedVendors.map((v, idx) => (
                    <Bar
                      key={v.vendorId}
                      dataKey={v.vendorName}
                      fill={vendorColors[idx % vendorColors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Factor Table Comparison */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 16px", color: "#64748B", fontWeight: 700 }}>RELIABILITY FACTOR</th>
                  {selectedVendors.map((v, idx) => (
                    <th key={v.vendorId} style={{ padding: "12px 16px", color: vendorColors[idx % vendorColors.length], fontWeight: 800 }}>
                      {v.vendorName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factorNames.map((f) => (
                  <tr key={f.key} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#334155" }}>{f.label}</td>
                    {selectedVendors.map((v) => {
                      const score = factorsMap[String(v.vendorId)] ? (factorsMap[String(v.vendorId)] as any)[f.key] : 0;
                      return (
                        <td key={v.vendorId} style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: score >= 75 ? "#2E7D32" : score >= 50 ? "#E65100" : "#B71C1C" }}>
                            {score}
                          </span>
                          <span style={{ color: "#94A3B8" }}> / 100</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: "16px 24px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: roleColor,
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
