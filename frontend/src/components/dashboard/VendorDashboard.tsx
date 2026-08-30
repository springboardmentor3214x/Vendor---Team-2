import React, { useEffect, useState, useMemo } from "react";
import {
  ShoppingCart, CheckCircle, Clock, AlertTriangle, TrendingUp,
  FileText, MessageSquare, ShieldCheck, ArrowRight, FolderOpen,
  DollarSign, Package, RefreshCw, Star, Search, AlertCircle
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { performanceService } from "../../services/performanceService";
import { reliabilityService } from "../../services/reliabilityService";
import { contractService } from "../../services/contractService";
import { procurementService } from "../../services/procurementService";
import { communicationService } from "../../services/communicationService";
import { KPICard } from "./shared/KPICard";
import { ChartCard } from "./shared/ChartCard";
import { StatusPill, LoadingSkeleton, formatINR } from "./shared/DashboardUtils";
import type { PurchaseOrder } from "../../models/procurement";
import type { Contract, Certification } from "../../models/contract";
import type { Conversation, Discussion, SharedFile } from "../../models/communication";

const VENDOR_COLOR = "#006064";
const VENDOR_BG = "#E0F7FA";

interface VendorDashboardProps {
  roleColor?: string;
  currentRole: string;
  userName?: string;
  userVendorName?: string;
  onNavigateTab: (tab: string) => void;
}

export function VendorDashboard({
  roleColor = VENDOR_COLOR,
  currentRole,
  userName = "Vendor Representative",
  userVendorName,
  onNavigateTab,
}: VendorDashboardProps) {
  // Scoped vendor identification (JWT/Session derived only, never URL)
  const resolvedVendorName = userVendorName || "TechCorp Solutions Pvt Ltd";

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [reliabilityScore, setReliabilityScore] = useState<number>(85);
  const [performanceScore, setPerformanceScore] = useState<number>(88);
  const [trendData, setTrendData] = useState<{ period: string; reliabilityScore: number }[]>([]);
  const [trendDelta, setTrendDelta] = useState<number>(0);
  const [factors, setFactors] = useState<{
    deliveryAccuracy: number;
    productQuality: number;
    communicationEfficiency: number;
    issueResolution: number;
    contractCompliance: number;
  }>({
    deliveryAccuracy: 95,
    productQuality: 92,
    communicationEfficiency: 96,
    issueResolution: 90,
    contractCompliance: 98,
  });

  // Orders
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderPage, setOrderPage] = useState(1);

  // Contracts & Certifications
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Communication Summary
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState<number>(0);

  // Fetch Vendor-Scoped Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Reliability & Performance Scores
      const relObs = reliabilityService.calculateReliabilityScore(resolvedVendorName);
      const relData = await relObs.toPromise();
      if (relData) {
        setReliabilityScore(relData.reliabilityScore);
      }

      const perfMetrics = await performanceService.getMetrics(resolvedVendorName);
      if (perfMetrics.length > 0) {
        setPerformanceScore(perfMetrics[0].overallPerformanceScore);
      }

      // 2. Trend Data
      const trendObs = reliabilityService.getTrends(resolvedVendorName);
      const trends = await trendObs.toPromise();
      if (trends && trends.length > 0) {
        setTrendData(trends.map(t => ({ period: t.period, reliabilityScore: t.reliabilityScore })));
        if (trends.length >= 2) {
          const latest = trends[trends.length - 1].reliabilityScore;
          const prev = trends[trends.length - 2].reliabilityScore;
          setTrendDelta(latest - prev);
        }
      }

      // 3. Detailed Factors Breakdown
      const factorData = await reliabilityService.getFactors(resolvedVendorName).toPromise();
      if (factorData) {
        setFactors({
          deliveryAccuracy: factorData.deliveryHistoryScore,
          productQuality: factorData.productQualityScore,
          communicationEfficiency: factorData.communicationEfficiencyScore,
          issueResolution: factorData.issueResolutionScore,
          contractCompliance: factorData.contractComplianceScore,
        });
      }

      // 4. Orders for this Vendor
      const poRes = await procurementService.getPurchaseOrders({ pageSize: 100 });
      const vendorPOs = poRes.items.filter(p => p.vendorName === resolvedVendorName);
      setOrders(vendorPOs);

      // 5. Contracts & Certifications
      const contractRes = await contractService.getContracts({ pageSize: 100 }).toPromise();
      const vendorContracts = contractRes.items.filter(c => c.vendorName === resolvedVendorName);
      setContracts(vendorContracts);

      const certs = await contractService.getCertifications().toPromise();
      const vendorCerts = certs.filter(c => c.vendorName === resolvedVendorName);
      setCertifications(vendorCerts);

      // 6. Communication Summary
      const convs = await communicationService.getConversations({ vendorOnly: true }).toPromise();
      const vendorConvs = convs.filter(c => c.participants.some(p => p.userName === resolvedVendorName || p.userRole === "Vendor"));
      setConversations(vendorConvs);

      let totalUnread = 0;
      vendorConvs.forEach(c => { totalUnread += c.unreadCount; });
      setUnreadMsgCount(totalUnread);

      const discs = await communicationService.getDiscussions().toPromise();
      const vendorDiscs = discs.filter(d => d.participants.some(p => p.name === resolvedVendorName || p.role === "Vendor"));
      setDiscussions(vendorDiscs);

      const files = await communicationService.getFiles().toPromise();
      const vendorFiles = (files || []).filter((f: SharedFile) => f.uploadedBy === resolvedVendorName);
      setSharedFiles(vendorFiles);

    } catch (err: any) {
      console.error("Error fetching vendor dashboard data:", err);
      setError("Failed to load vendor portal metrics. Displaying cached data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedVendorName]);

  // Derived KPI metrics
  const activePOs = useMemo(() => orders.filter(o => o.poStatus === "Issued" || o.poStatus === "In Transit"), [orders]);
  const completedPOs = useMemo(() => orders.filter(o => o.poStatus === "Fulfilled"), [orders]);
  const pendingDeliveries = useMemo(() => orders.filter(o => o.poStatus === "Issued" || o.poStatus === "Awaiting Shipment"), [orders]);
  const totalSpendVal = useMemo(() => orders.reduce((sum, o) => sum + (o.totalCost || 0), 0), [orders]);
  const paidInvoiceCount = useMemo(() => orders.filter(o => o.poStatus === "Fulfilled").length, [orders]);

  // Filtered orders table
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = orderSearch === "" ||
        o.poNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.productDetails.toLowerCase().includes(orderSearch.toLowerCase());
      const matchStatus = orderStatusFilter === "All" || o.poStatus === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * 6;
    return filteredOrders.slice(start, start + 6);
  }, [filteredOrders, orderPage]);

  // Contract Expiring Warning (< 60 days)
  const expiringContracts = useMemo(() => {
    return contracts.filter(c => c.status === "Active" && c.daysToExpiry <= 60 && c.daysToExpiry >= 0);
  }, [contracts]);

  // Score Color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#2E7D32"; // Good
    if (score >= 60) return "#E65100"; // Warning
    return "#B71C1C"; // Poor
  };

  // Security Role Guard
  if (currentRole !== "Vendor" && currentRole !== "Administrator") {
    return (
      <div style={{ padding: 40, textAlign: "center", background: "#fff", margin: 24, borderRadius: 12, border: "1px solid #E4E7EC" }}>
        <AlertCircle size={48} color="#B71C1C" style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Access Restricted</h2>
        <p style={{ fontSize: 14, color: "#667085", maxWidth: 450, margin: "8px auto 20px auto" }}>
          The Vendor Dashboard portal is strictly restricted to authenticated Vendor representatives.
        </p>
        <button
          onClick={() => onNavigateTab("dashboard")}
          style={{ padding: "8px 16px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
        >
          Return to General Workbench
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", background: "#F9FAFB", minHeight: "100vh" }}>
      
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: `${roleColor}15`, color: roleColor, borderRadius: 100, padding: "3px 10px" }}>
              Vendor Portal
            </span>
            <span style={{ fontSize: 12, color: "#667085" }}>Enterprise Vendor IQ</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "4px 0 0 0" }}>
            {resolvedVendorName}
          </h1>
          <p style={{ fontSize: 13, color: "#667085", margin: "2px 0 0 0" }}>
            Real-time performance analytics, order tracking, contract compliance & communication status
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "#fff",
            border: "1px solid #E4E7EC",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Metrics
        </button>
      </div>

      {error && (
        <div style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", padding: "12px 16px", borderRadius: 8, color: "#B71C1C", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ── 1. HERO SCORES ROW & KPI CARDS ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
        
        {/* Overall Reliability Score Gauge Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E4E7EC",
            borderTop: `4px solid ${getScoreColor(reliabilityScore)}`,
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Vendor Reliability Score
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: getScoreColor(reliabilityScore) }}>
                {reliabilityScore}
              </span>
              <span style={{ fontSize: 14, color: "#667085" }}>/ 100</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: getScoreColor(reliabilityScore), background: `${getScoreColor(reliabilityScore)}15`, padding: "2px 8px", borderRadius: 100 }}>
                {reliabilityScore >= 80 ? "Low Risk / Preferred" : reliabilityScore >= 60 ? "Medium Risk / Conditional" : "High Risk Action Required"}
              </span>
            </div>
          </div>
          <div style={{ position: "relative", width: 70, height: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: `conic-gradient(${getScoreColor(reliabilityScore)} ${reliabilityScore * 3.6}deg, #E5E7EB 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={20} color={getScoreColor(reliabilityScore)} />
              </div>
            </div>
          </div>
        </div>

        {/* Active POs Card */}
        <KPICard
          title="Active Purchase Orders"
          value={activePOs.length}
          subtext="In progress & transit"
          icon={ShoppingCart}
          iconColor="#1565C0"
          accentColor="#1565C0"
          badgeText="Active"
          onClick={() => onNavigateTab("proc-purchase-orders")}
          loading={loading}
        />

        {/* Completed Orders Card */}
        <KPICard
          title="Completed Orders"
          value={completedPOs.length}
          subtext="Fulfilled POs"
          icon={CheckCircle}
          iconColor="#2E7D32"
          accentColor="#2E7D32"
          badgeText="Fulfilled"
          onClick={() => onNavigateTab("proc-purchase-orders")}
          loading={loading}
        />

        {/* Pending Deliveries Card */}
        <KPICard
          title="Pending Deliveries"
          value={pendingDeliveries.length}
          subtext="Shipments scheduled"
          icon={Clock}
          iconColor="#E65100"
          accentColor="#E65100"
          badgeText="Scheduled"
          onClick={() => onNavigateTab("proc-tracking")}
          loading={loading}
        />

        {/* Payment Summary Card */}
        <KPICard
          title="Paid Invoices"
          value={`${paidInvoiceCount} / ${orders.length}`}
          subtext={`Total Spend: ${formatINR(totalSpendVal)}`}
          icon={DollarSign}
          iconColor="#006064"
          accentColor="#006064"
          badgeText="Verified"
          onClick={() => onNavigateTab("proc-invoices")}
          loading={loading}
        />
      </div>

      {/* ── 2 & 3. RELIABILITY SCORE TREND & PERFORMANCE BREAKDOWN ────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
        
        {/* Reliability Score Trend Chart */}
        <ChartCard
          title="Reliability Score Trend Over Time"
          subtitle="Monthly historical trajectory with delta indicator"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: trendDelta >= 0 ? "#2E7D32" : "#B71C1C", background: trendDelta >= 0 ? "#E8F5E9" : "#FFEBEE", padding: "4px 10px", borderRadius: 100 }}>
              <TrendingUp size={14} style={{ transform: trendDelta < 0 ? "rotate(180deg)" : "none" }} />
              {trendDelta >= 0 ? `+${trendDelta} pts vs prev period` : `${trendDelta} pts vs prev period`}
            </div>
          }
          loading={loading}
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#667085" }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#667085" }} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12 }}
                formatter={(val: number) => [`${val} pts`, "Reliability Score"]}
              />
              <Line
                type="monotone"
                dataKey="reliabilityScore"
                name="Reliability Score"
                stroke={VENDOR_COLOR}
                strokeWidth={3}
                dot={{ r: 4, fill: VENDOR_COLOR }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* My Performance Breakdown (Progress Bars) */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E4E7EC",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
              My Performance Breakdown
            </h3>
            <p style={{ fontSize: 12, color: "#667085", margin: "2px 0 16px 0" }}>
              Key performance indicators & factor ratings
            </p>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <LoadingSkeleton h={16} />
                <LoadingSkeleton h={16} />
                <LoadingSkeleton h={16} />
                <LoadingSkeleton h={16} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                
                {/* Factor 1: Delivery Accuracy */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    <span>Delivery Accuracy</span>
                    <span style={{ color: getScoreColor(factors.deliveryAccuracy) }}>{factors.deliveryAccuracy}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${factors.deliveryAccuracy}%`, background: getScoreColor(factors.deliveryAccuracy), borderRadius: 10 }} />
                  </div>
                </div>

                {/* Factor 2: Product Quality Rating */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    <span>Product Quality</span>
                    <span style={{ color: getScoreColor(factors.productQuality) }}>{factors.productQuality}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${factors.productQuality}%`, background: getScoreColor(factors.productQuality), borderRadius: 10 }} />
                  </div>
                </div>

                {/* Factor 3: Communication Efficiency */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    <span>Communication Efficiency</span>
                    <span style={{ color: getScoreColor(factors.communicationEfficiency) }}>{factors.communicationEfficiency}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${factors.communicationEfficiency}%`, background: getScoreColor(factors.communicationEfficiency), borderRadius: 10 }} />
                  </div>
                </div>

                {/* Factor 4: Issue Resolution Performance */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    <span>Issue Resolution</span>
                    <span style={{ color: getScoreColor(factors.issueResolution) }}>{factors.issueResolution}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${factors.issueResolution}%`, background: getScoreColor(factors.issueResolution), borderRadius: 10 }} />
                  </div>
                </div>

                {/* Factor 5: Contract Compliance */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    <span>Contract Compliance</span>
                    <span style={{ color: getScoreColor(factors.contractCompliance) }}>{factors.contractCompliance}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${factors.contractCompliance}%`, background: getScoreColor(factors.contractCompliance), borderRadius: 10 }} />
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 4 & 6. CONTRACT STATUS PANEL & COMMUNICATION ACTIVITY SUMMARY ──────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        
        {/* Contract & Certification Panel */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E4E7EC",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
                Contract & Compliance Panel
              </h3>
              <p style={{ fontSize: 12, color: "#667085", margin: "2px 0 0 0" }}>
                Active agreements, renewals & certification statuses
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("cc-repository")}
              style={{ background: "none", border: "none", color: "#1565C0", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View Repository <ArrowRight size={13} />
            </button>
          </div>

          {expiringContracts.length > 0 && (
            <div style={{ background: "#FFF3E0", border: "1px solid #FFE0B2", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={18} color="#E65100" />
              <div style={{ flex: 1, fontSize: 12, color: "#E65100", fontWeight: 600 }}>
                {expiringContracts.length} contract(s) expiring within 60 days!
              </div>
              <button
                onClick={() => onNavigateTab("cc-renewals")}
                style={{ padding: "4px 8px", background: "#E65100", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                Renew Now
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contracts.slice(0, 3).map((c) => (
              <div
                key={c.contractId}
                onClick={() => onNavigateTab("cc-repository")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #F3F4F6",
                  background: "#F9FAFB",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{c.contractTitle}</div>
                  <div style={{ fontSize: 11, color: "#667085" }}>{c.contractNumber} • Val: {formatINR(c.contractValue)}</div>
                </div>
                <StatusPill status={c.status} />
              </div>
            ))}

            {certifications.slice(0, 2).map((cert) => (
              <div
                key={cert.certificationId}
                onClick={() => onNavigateTab("cc-certifications")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #F3F4F6",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={16} color="#006064" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{cert.certificationName}</div>
                    <div style={{ fontSize: 10, color: "#667085" }}>Expires: {cert.expiryDate}</div>
                  </div>
                </div>
                <StatusPill status={cert.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Communication Activity Summary */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E4E7EC",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
                Communication Activity
              </h3>
              <p style={{ fontSize: 12, color: "#667085", margin: "2px 0 0 0" }}>
                Unread messages, discussions & shared documents
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("comm-messages")}
              style={{ background: "none", border: "none", color: "#1565C0", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              Open Inbox <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div
              onClick={() => onNavigateTab("comm-messages")}
              style={{ background: "#EFF6FF", padding: 10, borderRadius: 8, textAlign: "center", cursor: "pointer" }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1565C0" }}>{unreadMsgCount}</div>
              <div style={{ fontSize: 11, color: "#1565C0", fontWeight: 600 }}>Unread Msgs</div>
            </div>
            <div
              onClick={() => onNavigateTab("comm-discussions")}
              style={{ background: "#F3E8FF", padding: 10, borderRadius: 8, textAlign: "center", cursor: "pointer" }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: "#6A1B9A" }}>{discussions.length}</div>
              <div style={{ fontSize: 11, color: "#6A1B9A", fontWeight: 600 }}>Discussions</div>
            </div>
            <div
              onClick={() => onNavigateTab("comm-files")}
              style={{ background: "#E0F7FA", padding: 10, borderRadius: 8, textAlign: "center", cursor: "pointer" }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: "#006064" }}>{sharedFiles.length}</div>
              <div style={{ fontSize: 11, color: "#006064", fontWeight: 600 }}>Shared Files</div>
            </div>
          </div>

          {/* Recent Conversations */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {conversations.slice(0, 3).map((conv) => (
              <div
                key={conv.conversationId}
                onClick={() => onNavigateTab("comm-messages")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #F3F4F6",
                  background: "#F9FAFB",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {conv.subject}
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {conv.lastMessagePreview}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <span style={{ background: "#C62828", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 100, padding: "2px 6px" }}>
                    {conv.unreadCount} new
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 5. ORDER HISTORY TABLE ──────────────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E4E7EC",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
              Vendor Order History & Fulfillment Tracker
            </h3>
            <p style={{ fontSize: 12, color: "#667085", margin: "2px 0 0 0" }}>
              Completed and active purchase orders with delivery timeline & payment statuses
            </p>
          </div>

          {/* Table Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: 200 }}>
              <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search PO number..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 30px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>

            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                fontSize: 12,
                background: "#fff",
                outline: "none",
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Issued">Issued</option>
              <option value="In Transit">In Transit</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Awaiting Shipment">Awaiting Shipment</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E4E7EC", color: "#667085", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                <th style={{ padding: "10px 14px" }}>PO Number</th>
                <th style={{ padding: "10px 14px" }}>Category / Item</th>
                <th style={{ padding: "10px 14px" }}>Issue Date</th>
                <th style={{ padding: "10px 14px" }}>Expected Delivery</th>
                <th style={{ padding: "10px 14px" }}>Total Amount</th>
                <th style={{ padding: "10px 14px" }}>PO Status</th>
                <th style={{ padding: "10px 14px" }}>Payment Status</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 20, textAlign: "center" }}>
                    <LoadingSkeleton h={30} />
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 30, textAlign: "center", color: "#667085", fontSize: 13 }}>
                    No purchase orders match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((po) => (
                  <tr
                    key={po.id}
                    style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.15s" }}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1565C0" }}>{po.poNumber}</td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{po.productDetails}</td>
                    <td style={{ padding: "12px 14px", color: "#667085" }}>{po.poDate || po.createdAt.slice(0, 10)}</td>
                    <td style={{ padding: "12px 14px", color: "#667085" }}>{po.expectedDeliveryDate || "N/A"}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#111827" }}>{formatINR(po.totalCost || 0)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusPill status={po.poStatus} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusPill status={po.poStatus === "Fulfilled" ? "Paid" : "Pending"} />
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => onNavigateTab("proc-purchase-orders")}
                        style={{ padding: "4px 10px", background: "#EFF6FF", color: "#1565C0", border: "1px solid #BFDBFE", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredOrders.length > 6 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #E4E7EC", fontSize: 12, color: "#667085" }}>
            <span>Showing {((orderPage - 1) * 6) + 1} to {Math.min(orderPage * 6, filteredOrders.length)} of {filteredOrders.length} orders</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={orderPage === 1}
                onClick={() => setOrderPage(p => p - 1)}
                style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #D1D5DB", background: "#fff", cursor: orderPage === 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button
                disabled={orderPage * 6 >= filteredOrders.length}
                onClick={() => setOrderPage(p => p + 1)}
                style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #D1D5DB", background: "#fff", cursor: orderPage * 6 >= filteredOrders.length ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
