import React, { useState, useEffect } from "react";
import { ShieldCheck, TrendingUp, AlertTriangle, Star } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { performanceService } from "../../services/performanceService";
import { QualityEvaluationView } from "./QualityEvaluationView";
import { CommunicationTrackingView } from "./CommunicationTrackingView";
import { ServiceRatingView } from "./ServiceRatingView";
import { VendorPerformanceDashboardView } from "./VendorPerformanceDashboardView";
import { DeliveryPerformanceView } from "./DeliveryPerformanceView";
import { PerformanceHistoryView } from "./PerformanceHistoryView";
import { VendorRankingView } from "./VendorRankingView";
import type {
  DeliveryPerformance,
  VendorPerformanceMetrics,
  VendorRanking
} from "../../models/performance";

interface PerformanceProps {
  activeTab: string;
  roleColor: string;
  currentRole?: string;
  userVendorName?: string;
  onNavigateTab?: (tab: string, vendorName?: string) => void;
}

export function VendorPerformance({
  activeTab,
  roleColor,
  currentRole,
  userVendorName,
  onNavigateTab
}: PerformanceProps) {
  const [toastMsg, setToastMsg] = useState("");
  const [historySelectedVendor, setHistorySelectedVendor] = useState<string | undefined>(undefined);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleNavigateVendorHistory = (vendorName: string) => {
    setHistorySelectedVendor(vendorName);
    if (onNavigateTab) {
      onNavigateTab("perf-history", vendorName);
    }
  };

  const handleNavigateTabDirect = (tab: string, vendorName?: string) => {
    if (vendorName) {
      setHistorySelectedVendor(vendorName);
    }
    if (onNavigateTab) {
      onNavigateTab(tab, vendorName);
    }
  };

  // Header Title selector maps
  const getHeaderDetails = () => {
    switch (activeTab) {
      case "perf-dashboard":
        return { title: "Vendor Performance Dashboard", desc: "Aggregated performance scorecards, live metrics analytics, top vs bottom comparisons, and trend cycles across approved supply partners." };
      case "perf-delivery":
        return { title: "Delivery Performance Analytics", desc: "Track, audit, and filter vendor shipping logs, SLA adherence, and delivery delay metrics." };
      case "perf-quality":
        return { title: "Quality Evaluation Ledger", desc: "Monitor raw material inspection logs, compliance ratios, and packaging quality indexes." };
      case "perf-communication":
        return { title: "Communication SLA Tracking", desc: "Audit reply compliance records, response delays, and communication logs." };
      case "perf-service":
        return { title: "Service Rating Matrix", desc: "Measure and score general vendor relationship experiences, documentation, and support professionalism." };
      case "perf-history":
        return { title: "Operational Performance History", desc: "Deep-dive historical ledger per vendor featuring monthly trends and 6 detailed record categories." };
      case "perf-ranking":
        return { title: "Vendor Reliability Leaderboard", desc: "Leaderboards illustrating overall vendor reliability, calculated across key procurement modules." };
      default:
        return { title: "Performance Workspace", desc: "Evaluate supplier SLA compliance." };
    }
  };

  const header = getHeaderDetails();

  const renderedContent = () => {
    switch (activeTab) {
      case "perf-dashboard":
        return (
          <VendorPerformanceDashboardView
            roleColor={roleColor}
            onNavigateTab={handleNavigateTabDirect}
          />
        );

      case "perf-delivery":
        return <DeliveryPerformanceView roleColor={roleColor} currentRole={currentRole} userVendorName={userVendorName} onSuccessToast={triggerToast} />;

      case "perf-quality":
        return <QualityEvaluationView roleColor={roleColor} currentRole={currentRole} userVendorName={userVendorName} onSuccessToast={triggerToast} />;

      case "perf-communication":
        return <CommunicationTrackingView roleColor={roleColor} currentRole={currentRole} userVendorName={userVendorName} onSuccessToast={triggerToast} />;

      case "perf-service":
        return <ServiceRatingView roleColor={roleColor} currentRole={currentRole} userVendorName={userVendorName} onSuccessToast={triggerToast} />;

      case "perf-history":
        return (
          <PerformanceHistoryView
            roleColor={roleColor}
            currentRole={currentRole}
            userVendorName={userVendorName}
            initialSelectedVendor={historySelectedVendor}
          />
        );

      case "perf-ranking":
        return (
          <VendorRankingView
            roleColor={roleColor}
            currentRole={currentRole}
            onNavigateVendorHistory={handleNavigateVendorHistory}
            onSuccessToast={triggerToast}
          />
        );

      default:
        return <div>Invalid Tab</div>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-slate-800 z-50 animate-bounce text-xs font-semibold">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{header.title}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">{header.desc}</p>
        </div>
      </div>

      {/* DYNAMIC CONTENT */}
      <div>
        {renderedContent()}
      </div>
    </div>
  );
}
