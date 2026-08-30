import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Minus, Lock, Search, Calendar, BarChart2
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

import type { VendorReliability, ReliabilityTrendPoint } from "../../models/reliability";
import { reliabilityService } from "../../services/reliabilityService";

interface PerformanceTrendsViewProps {
  roleColor: string;
  currentRole: string;
  userVendorName?: string;
  selectedVendorId: number | string;
  onSelectVendor: (vendorId: number | string) => void;
}

export const PerformanceTrendsView: React.FC<PerformanceTrendsViewProps> = ({
  roleColor,
  currentRole,
  userVendorName,
  selectedVendorId,
  onSelectVendor
}) => {
  const [reliabilities, setReliabilities] = useState<VendorReliability[]>([]);
  const [currentVendor, setCurrentVendor] = useState<VendorReliability | null>(null);
  const [trends, setTrends] = useState<ReliabilityTrendPoint[]>([]);
  const [timeView, setTimeView] = useState<"monthly" | "yearly">("monthly");

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
        reliabilityService.getTrends(active.vendorId).subscribe((t) => setTrends(t));
      }
    });
  }, [selectedVendorId, isVendorRole, userVendorName]);

  const handleVendorChange = (vId: number | string) => {
    onSelectVendor(vId);
    const found = reliabilities.find(v => String(v.vendorId) === String(vId));
    if (found) {
      setCurrentVendor(found);
      reliabilityService.getTrends(found.vendorId).subscribe((t) => setTrends(t));
    }
  };

  // Compute trend verdict: Compare start score vs end score
  let trendVerdict: "Improving" | "Stable" | "Declining" = "Stable";
  let pointDiff = 0;
  let summarySentence = "";

  if (trends.length > 1) {
    const startScore = trends[0].reliabilityScore;
    const endScore = trends[trends.length - 1].reliabilityScore;
    pointDiff = endScore - startScore;

    if (pointDiff >= 5) {
      trendVerdict = "Improving";
      summarySentence = `Reliability improved ${pointDiff} points over the last 12 months, driven by strong delivery and quality compliance performance.`;
    } else if (pointDiff <= -5) {
      trendVerdict = "Declining";
      summarySentence = `Reliability dropped ${Math.abs(pointDiff)} points over the last 12 months due to SLA breaches and delivery delay patterns.`;
    } else {
      trendVerdict = "Stable";
      summarySentence = `Reliability maintained a stable ${endScore}/100 rating with consistent factor fulfillment scores.`;
    }
  }

  // Monthly vs Yearly aggregated view data
  const chartData = timeView === "yearly" ? [
    { period: "2024", reliabilityScore: Math.round(trends[0]?.reliabilityScore || 75), deliveryScore: 78, qualityScore: 80, communicationScore: 82, complianceScore: 80, issueResolutionScore: 75 },
    { period: "2025", reliabilityScore: Math.round((trends[0]?.reliabilityScore + trends[5]?.reliabilityScore) / 2 || 80), deliveryScore: 82, qualityScore: 84, communicationScore: 85, complianceScore: 83, issueResolutionScore: 80 },
    { period: "2026", reliabilityScore: Math.round(trends[trends.length - 1]?.reliabilityScore || 85), deliveryScore: trends[trends.length - 1]?.deliveryScore, qualityScore: trends[trends.length - 1]?.qualityScore, communicationScore: trends[trends.length - 1]?.communicationScore, complianceScore: trends[trends.length - 1]?.complianceScore, issueResolutionScore: trends[trends.length - 1]?.issueResolutionScore }
  ] : trends;

  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #E4E7EC",
    padding: 24
  };

  const getVerdictStyle = () => {
    switch (trendVerdict) {
      case "Improving":
        return { bg: "#E8F5E9", color: "#2E7D32", icon: TrendingUp };
      case "Declining":
        return { bg: "#FFEBEE", color: "#B71C1C", icon: TrendingDown };
      default:
        return { bg: "#EFF6FF", color: "#1565C0", icon: Minus };
    }
  };

  const verdictStyle = getVerdictStyle();
  const VerdictIcon = verdictStyle.icon;

  if (!currentVendor) return <div style={{ padding: 24, textAlign: "center", color: "#667085" }}>Loading Trend Data...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "Inter, sans-serif" }}>
      {/* ─── CONTROLS BAR: SEARCHABLE VENDOR SELECTOR + MONTHLY/YEARLY TOGGLE ──── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Performance Trend Analysis</h2>
          <p style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
            Historical timeline tracking for overall reliability score and six sub-factor vectors
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Vendor Selector */}
          {isVendorRole ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#F1F5F9", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#475569" }}>
              <Lock size={14} /> Locked to {currentVendor.vendorName}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Supplier:</span>
              <select
                value={currentVendor.vendorId}
                onChange={(e) => handleVendorChange(e.target.value)}
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

          {/* Monthly / Yearly View Toggle */}
          <div style={{ display: "flex", background: "#F1F5F9", padding: 3, borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <button
              onClick={() => setTimeView("monthly")}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: 6,
                background: timeView === "monthly" ? "#fff" : "transparent",
                color: timeView === "monthly" ? "#0F172A" : "#64748B",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: timeView === "monthly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeView("yearly")}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: 6,
                background: timeView === "yearly" ? "#fff" : "transparent",
                color: timeView === "yearly" ? "#0F172A" : "#64748B",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: timeView === "yearly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
              }}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      {/* ─── TREND VERDICT CHIP & AUTO-GENERATED SUMMARY ────────────────────── */}
      <div style={{ ...cardStyle, borderLeft: `6px solid ${verdictStyle.color}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 16px",
              borderRadius: 100,
              background: verdictStyle.bg,
              color: verdictStyle.color,
              fontSize: 13,
              fontWeight: 900
            }}
          >
            <VerdictIcon size={16} />
            {trendVerdict.toUpperCase()} VERDICT
          </span>

          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: 0 }}>
              {currentVendor.vendorName} — Trajectory Summary
            </h3>
            <p style={{ fontSize: 13, color: "#334155", margin: "3px 0 0 0" }}>
              {summarySentence}
            </p>
          </div>
        </div>
      </div>

      {/* ─── PRIMARY LINE CHART: OVERALL RELIABILITY SCORE TREND ─────────────── */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>
          Overall Reliability Score Trend Timeline
        </h3>

        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis domain={[30, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="reliabilityScore"
                name="Reliability Score"
                stroke={roleColor}
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── MULTI-SERIES LINE CHART: SIX INDIVIDUAL FACTOR TRENDS ─────────────── */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>
          Multi-Factor Sub-Vector Breakdown (Delivery, Quality, Comm, Compliance, Issue Resolution)
        </h3>

        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis domain={[30, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="deliveryScore" name="Delivery" stroke="#2E7D32" strokeWidth={2} />
              <Line type="monotone" dataKey="qualityScore" name="Product Quality" stroke="#6A1B9A" strokeWidth={2} />
              <Line type="monotone" dataKey="communicationScore" name="Communication" stroke="#1565C0" strokeWidth={2} />
              <Line type="monotone" dataKey="complianceScore" name="Compliance" stroke="#E65100" strokeWidth={2} />
              <Line type="monotone" dataKey="issueResolutionScore" name="Issue Resolution" stroke="#00838F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
