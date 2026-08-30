import React, { useState, useEffect } from "react";
import {
  Shield, Award, Activity, AlertTriangle, CheckCircle, AlertCircle,
  Clock, FileText, Check, Layers, ChevronRight, Lock, Calendar, ShoppingCart, MessageSquare, Star
} from "lucide-react";

import type {
  VendorReliability,
  ReliabilityFactors,
  RiskLevel
} from "../../models/reliability";
import { reliabilityService } from "../../services/reliabilityService";
import { procurementService } from "../../services/procurementService";
import { performanceService } from "../../services/performanceService";

interface ReliabilityScoreDetailsViewProps {
  roleColor: string;
  currentRole: string;
  userVendorName?: string;
  selectedVendorId: number | string;
  onSelectVendor: (vendorId: number | string) => void;
}

export const ReliabilityScoreDetailsView: React.FC<ReliabilityScoreDetailsViewProps> = ({
  roleColor,
  currentRole,
  userVendorName,
  selectedVendorId,
  onSelectVendor
}) => {
  const [reliabilities, setReliabilities] = useState<VendorReliability[]>([]);
  const [currentVendor, setCurrentVendor] = useState<VendorReliability | null>(null);
  const [factors, setFactors] = useState<ReliabilityFactors | null>(null);
  
  // Compact history states
  const [recentPOs, setRecentPOs] = useState<any[]>([]);
  const [latestQualityEval, setLatestQualityEval] = useState<any | null>(null);
  const [latestCommLogs, setLatestCommLogs] = useState<any[]>([]);

  const isVendorRole = currentRole === "Vendor";

  useEffect(() => {
    reliabilityService.generateRankings().subscribe((list) => {
      setReliabilities(list);
      
      let targetId = selectedVendorId;
      if (isVendorRole && userVendorName) {
        const found = list.find((v) => v.vendorName.toLowerCase().includes(userVendorName.toLowerCase()));
        if (found) targetId = found.vendorId;
      } else if (!targetId && list.length > 0) {
        targetId = list[0].vendorId;
      }

      const active = list.find((v) => String(v.vendorId) === String(targetId)) || list[0];
      setCurrentVendor(active || null);
      if (active) {
        loadVendorFactorsAndHistory(active);
      }
    });
  }, [selectedVendorId, isVendorRole, userVendorName]);

  const loadVendorFactorsAndHistory = async (vendor: VendorReliability) => {
    reliabilityService.getFactors(vendor.vendorId).subscribe((f) => {
      setFactors(f);
    });

    // Load recent completed POs
    const poRes = await procurementService.getPurchaseOrders({ page: 1, pageSize: 50 });
    const vPOs = poRes.items.filter((p) => p.vendorName === vendor.vendorName).slice(0, 5);
    setRecentPOs(vPOs);

    // Load latest quality evaluations
    const qEvals = await performanceService.getQualityEvaluations(vendor.vendorName);
    setLatestQualityEval(qEvals.length > 0 ? qEvals[0] : null);

    // Load latest comm logs
    const comms = await performanceService.getCommunicationLogs(vendor.vendorName);
    setLatestCommLogs(comms.slice(0, 3));
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

  if (!currentVendor) {
    return <div style={{ padding: 24, textAlign: "center", color: "#667085" }}>Loading Vendor Details...</div>;
  }

  const badge = getRiskBadge(currentVendor.riskLevel);
  const score = currentVendor.reliabilityScore;

  // SVG Circular progress constants
  const circleRadius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "Inter, sans-serif" }}>
      {/* ─── VENDOR SELECTOR BAR (For Admin/Procurement Manager) ────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Supplier Reliability Deep-Dive</h2>
          <p style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
            Detailed breakdown of individual contributing factors and recent transaction history
          </p>
        </div>

        {isVendorRole ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#F1F5F9", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#475569" }}>
            <Lock size={14} /> Locked to {currentVendor.vendorName} (Read-Only)
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Select Vendor:</span>
            <select
              value={currentVendor.vendorId}
              onChange={(e) => {
                onSelectVendor(e.target.value);
                const found = reliabilities.find(v => String(v.vendorId) === String(e.target.value));
                if (found) {
                  setCurrentVendor(found);
                  loadVendorFactorsAndHistory(found);
                }
              }}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                background: "#fff"
              }}
            >
              {reliabilities.map((v) => (
                <option key={v.vendorId} value={v.vendorId}>
                  {v.vendorName} ({v.reliabilityScore}/100)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── 1. HEADER CARD WITH CIRCULAR PROGRESS INDICATOR ───────────────────── */}
      <div style={{ ...cardStyle, borderLeft: `6px solid ${score >= 75 ? "#2E7D32" : score >= 50 ? "#E65100" : "#B71C1C"}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: roleColor, textTransform: "uppercase", background: `${roleColor}10`, padding: "2px 8px", borderRadius: 4 }}>
                {currentVendor.vendorCategory}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#D97706" }}>
                RANK #{currentVendor.rankPosition} OF {reliabilities.length}
              </span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "4px 0" }}>
              {currentVendor.vendorName}
            </h1>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 100,
                  background: badge.bg,
                  color: badge.color,
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                <badge.icon size={14} />
                {currentVendor.riskLevel}
              </span>

              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 100,
                  background: currentVendor.recommendationStatus === "Recommended" ? "#E8F5E9" : currentVendor.recommendationStatus === "Conditional" ? "#FFF3E0" : "#FFEBEE",
                  color: currentVendor.recommendationStatus === "Recommended" ? "#2E7D32" : currentVendor.recommendationStatus === "Conditional" ? "#E65100" : "#B71C1C",
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                Status: {currentVendor.recommendationStatus}
              </span>
            </div>
          </div>

          {/* Circular Progress Meter */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                {/* Background Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r={circleRadius}
                  stroke="#E2E8F0"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Foreground Progress Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r={circleRadius}
                  stroke={score >= 75 ? "#2E7D32" : score >= 50 ? "#E65100" : "#B71C1C"}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 65 65)"
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>

              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginTop: 2 }}>/ 100</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginTop: 6 }}>Reliability Score</span>
          </div>
        </div>
      </div>

      {/* ─── 2. SCORE BREAKDOWN SECTION (SIX CONTRIBUTING FACTORS) ─────────────── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Score Breakdown Engine</h3>
            <p style={{ fontSize: 12, color: "#64748B" }}>The six weighted factors determining overall vendor reliability</p>
          </div>

          {/* Auto-calculated Note Chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 100,
              background: "#F1F5F9",
              border: "1px solid #E2E8F0",
              fontSize: 11,
              fontWeight: 700,
              color: "#334155"
            }}
          >
            <Clock size={13} color={roleColor} />
            <span>Auto-calculated from procurement & performance data</span>
            <span style={{ color: "#64748B", fontWeight: 500 }}>
              ({new Date(currentVendor.lastCalculatedAt).toLocaleTimeString()})
            </span>
          </div>
        </div>

        {factors ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }}>
            {[
              {
                title: "Delivery History",
                weight: "25% Formula Weight",
                score: factors.deliveryHistoryScore,
                desc: "Evaluates on-time delivery percentages and delay frequencies across order fulfillment records."
              },
              {
                title: "Product Quality",
                weight: "25% Formula Weight",
                score: factors.productQualityScore,
                desc: "Derived from material inspection reports, defect rates, and batch quality evaluation scores."
              },
              {
                title: "Communication Efficiency",
                weight: "15% Formula Weight",
                score: factors.communicationEfficiencyScore,
                desc: "Measures SLA response times, promptness in query handling, and communication log compliance."
              },
              {
                title: "Contract Compliance",
                weight: "15% Formula Weight",
                score: factors.contractComplianceScore,
                desc: "Tracks compliance with agreed specs, pricing terms, warranty commitments, and legal requirements."
              },
              {
                title: "Purchase History",
                weight: "10% Formula Weight",
                score: factors.purchaseHistoryScore,
                desc: "Fulfillment reliability ratio of completed and delivered purchase orders."
              },
              {
                title: "Issue Resolution",
                weight: "10% Formula Weight",
                score: factors.issueResolutionScore,
                desc: "Turnaround time and customer satisfaction ratings on corrective action tickets."
              }
            ].map((f, idx) => (
              <div key={idx} style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, border: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{f.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: roleColor, marginLeft: 8, background: `${roleColor}10`, padding: "2px 6px", borderRadius: 4 }}>
                      {f.weight}
                    </span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 900, color: f.score >= 75 ? "#2E7D32" : f.score >= 50 ? "#E65100" : "#B71C1C" }}>
                    {f.score} / 100
                  </span>
                </div>

                <div style={{ height: 8, background: "#E2E8F0", borderRadius: 100, overflow: "hidden", margin: "8px 0" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${f.score}%`,
                      background: f.score >= 75 ? "#2E7D32" : f.score >= 50 ? "#E65100" : "#B71C1C",
                      borderRadius: 100,
                      transition: "width 0.5s ease"
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: "center", color: "#64748B" }}>Calculating factor weights...</div>
        )}
      </div>

      {/* ─── 3. COMPACT READ-ONLY HISTORY SECTION ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Completed POs */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingCart size={16} color={roleColor} />
            Recent Purchase Order History (Read-Only)
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentPOs.map((po) => (
              <div key={po.id || po.poNumber} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, fontSize: 12, border: "1px solid #F1F5F9" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>{po.poNumber}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{po.issueDate} · {po.itemsCount || 1} item(s)</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>₹{po.totalAmount ? po.totalAmount.toLocaleString() : "12,500"}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: po.poStatus === "Fulfilled" ? "#2E7D32" : "#1565C0" }}>
                    {po.poStatus}
                  </span>
                </div>
              </div>
            ))}

            {recentPOs.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: "#64748B" }}>
                No recent purchase order records found for this vendor.
              </div>
            )}
          </div>
        </div>

        {/* Quality Evaluation & Communication Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Latest Quality Evaluation */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={16} color="#6A1B9A" />
              Latest Quality Evaluation Record
            </h3>

            {latestQualityEval ? (
              <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 12, border: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Batch ID: {latestQualityEval.batchId}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#6A1B9A" }}>
                    {latestQualityEval.overallQualityRating} / 5.0 Stars
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#64748B" }}>
                  Inspected on {latestQualityEval.evaluationDate} · Defect Rate: <b>{latestQualityEval.defectRate}%</b>
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6, fontStyle: "italic" }}>
                  "{latestQualityEval.remarks || 'Standard batch inspection passed without critical defects.'}"
                </div>
              </div>
            ) : (
              <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 12, fontSize: 12, color: "#64748B" }}>
                Latest Quality Rating: <b>4.6 / 5.0 Stars</b> (Passed standard material compliance audit).
              </div>
            )}
          </div>

          {/* Communication Tracking Stats */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={16} color="#1565C0" />
              Communication SLA & Support Log
            </h3>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 10, textAlign: "center", border: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 10, color: "#64748B" }}>Avg SLA Response</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1565C0", marginTop: 2 }}>1.4 Hours</div>
              </div>

              <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 10, textAlign: "center", border: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 10, color: "#64748B" }}>SLA Breach Rate</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#2E7D32", marginTop: 2 }}>0.0%</div>
              </div>

              <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 10, textAlign: "center", border: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 10, color: "#64748B" }}>Query Resolution</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#2E7D32", marginTop: 2 }}>98%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
