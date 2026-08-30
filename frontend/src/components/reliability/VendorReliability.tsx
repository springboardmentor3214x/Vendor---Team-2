import React, { useState, useEffect } from "react";
import {
  Shield, Award, Activity, AlertTriangle, TrendingUp, CheckCircle,
  RefreshCw
} from "lucide-react";

import { reliabilityService } from "../../services/reliabilityService";
import type {
  VendorReliability as IVendorReliability
} from "../../models/reliability";

import { ReliabilityDashboardView } from "./ReliabilityDashboardView";
import { ReliabilityScoreDetailsView } from "./ReliabilityScoreDetailsView";
import { SupplierRankingView } from "./SupplierRankingView";
import { RiskDashboardView } from "./RiskDashboardView";
import { PerformanceTrendsView } from "./PerformanceTrendsView";
import { RecommendationsView } from "./RecommendationsView";

interface VendorReliabilityProps {
  activeTab: string;
  roleColor: string;
  currentRole: string;
  userVendorName?: string;
  onNavigateTab?: (tab: string) => void;
}

export const VendorReliabilityComponent: React.FC<VendorReliabilityProps> = ({
  activeTab,
  roleColor,
  currentRole,
  userVendorName,
  onNavigateTab
}) => {
  const [selectedVendorId, setSelectedVendorId] = useState<number | string>(1);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    reliabilityService.recalculateAll().subscribe(() => {
      setIsRecalculating(false);
    });
  };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Module Title Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={24} color={roleColor} />
            Vendor Reliability Management
          </h1>
          <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
            Automated reliability scoring, risk profiling, supplier rankings, and smart procurement recommendations.
          </p>
        </div>

        {currentRole !== "Vendor" && (
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 8,
              border: `1px solid ${roleColor}`,
              background: "#fff",
              color: roleColor,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <RefreshCw size={15} className={isRecalculating ? "animate-spin" : ""} />
            {isRecalculating ? "Calculating..." : "Recalculate Scores"}
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #E4E7EC", marginBottom: 24, paddingBottom: 2 }}>
        {[
          { id: "rel-dashboard", label: "Reliability Dashboard", icon: Shield },
          { id: "rel-details", label: "Reliability Score Details", icon: Activity },
          { id: "rel-ranking", label: "Supplier Ranking", icon: Award },
          { id: "rel-risk", label: "Risk Dashboard", icon: AlertTriangle },
          { id: "rel-trends", label: "Performance Trends", icon: TrendingUp },
          { id: "rel-recommendations", label: "Recommendations", icon: CheckCircle }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigateTab && onNavigateTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                border: "none",
                background: "none",
                borderBottom: `2px solid ${isActive ? roleColor : "transparent"}`,
                color: isActive ? roleColor : "#667085",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── PAGE 1: RELIABILITY DASHBOARD ───────────────────────────────────── */}
      {activeTab === "rel-dashboard" && (
        <ReliabilityDashboardView
          roleColor={roleColor}
          onSelectVendor={(vId) => setSelectedVendorId(vId)}
          onNavigateTab={(tab) => onNavigateTab && onNavigateTab(tab)}
        />
      )}

      {/* ─── PAGE 2: RELIABILITY SCORE DETAILS ────────────────────────────────── */}
      {activeTab === "rel-details" && (
        <ReliabilityScoreDetailsView
          roleColor={roleColor}
          currentRole={currentRole}
          userVendorName={userVendorName}
          selectedVendorId={selectedVendorId}
          onSelectVendor={(vId) => setSelectedVendorId(vId)}
        />
      )}

      {/* ─── PAGE 3: SUPPLIER RANKING ─────────────────────────────────────────── */}
      {activeTab === "rel-ranking" && (
        <SupplierRankingView
          roleColor={roleColor}
          currentRole={currentRole}
          onSelectVendor={(vId) => setSelectedVendorId(vId)}
          onNavigateTab={(tab) => onNavigateTab && onNavigateTab(tab)}
        />
      )}

      {/* ─── PAGE 4: RISK DASHBOARD ─────────────────────────────────────────── */}
      {activeTab === "rel-risk" && (
        <RiskDashboardView
          roleColor={roleColor}
          onSelectVendor={(vId) => setSelectedVendorId(vId)}
          onNavigateTab={(tab) => onNavigateTab && onNavigateTab(tab)}
        />
      )}

      {/* ─── PAGE 5: PERFORMANCE TRENDS ─────────────────────────────────────── */}
      {activeTab === "rel-trends" && (
        <PerformanceTrendsView
          roleColor={roleColor}
          currentRole={currentRole}
          userVendorName={userVendorName}
          selectedVendorId={selectedVendorId}
          onSelectVendor={(vId) => setSelectedVendorId(vId)}
        />
      )}

      {/* ─── PAGE 6: RECOMMENDATIONS ─────────────────────────────────────────── */}
      {activeTab === "rel-recommendations" && (
        <RecommendationsView
          roleColor={roleColor}
          onSelectVendor={(vId) => setSelectedVendorId(vId)}
          onNavigateTab={(tab) => onNavigateTab && onNavigateTab(tab)}
        />
      )}
    </div>
  );
};
