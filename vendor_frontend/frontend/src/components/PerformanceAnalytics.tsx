import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList
} from "recharts";
import { Award, ShieldAlert, Sparkles, TrendingUp, Download, AlertTriangle, Star, CheckCircle, XCircle, Clock, DollarSign, Globe, Zap } from "lucide-react";
import { Contract, Vendor, toINR, toINRCompact } from "../data";

interface PerfProps {
  contracts: Contract[];
  vendors?: Vendor[];
  viewMode: "performance" | "analytics" | "reports" | "contracts";
}

const PERF_TRENDS = [
  { month: "Jan", delivery: 86, quality: 91, compliance: 93 },
  { month: "Feb", delivery: 88, quality: 93, compliance: 94 },
  { month: "Mar", delivery: 85, quality: 92, compliance: 93 },
  { month: "Apr", delivery: 89, quality: 94, compliance: 95 },
  { month: "May", delivery: 91, quality: 95, compliance: 96 },
  { month: "Jun", delivery: 90, quality: 95, compliance: 96 },
  { month: "Jul", delivery: 87, quality: 93, compliance: 95 },
  { month: "Aug", delivery: 88, quality: 94, compliance: 94 },
  { month: "Sep", delivery: 86, quality: 92, compliance: 95 },
  { month: "Oct", delivery: 89, quality: 94, compliance: 95 },
  { month: "Nov", delivery: 87, quality: 94, compliance: 96 },
  { month: "Dec", delivery: 88, quality: 94, compliance: 97 },
];

const TOP_VENDORS = [
  { rank: 1, name: "Deloitte Consulting",  score: 98, delivery: "99%", quality: "97%", compliance: "100%", spend: 15200000, stars: 5 },
  { rank: 2, name: "Accenture Federal",    score: 96, delivery: "98%", quality: "95%", compliance: "98%",  spend: 12400000, stars: 5 },
  { rank: 3, name: "ServiceNow Inc.",      score: 94, delivery: "96%", quality: "93%", compliance: "97%",  spend: 1800000,  stars: 5 },
  { rank: 4, name: "Oracle Corporation",   score: 91, delivery: "93%", quality: "90%", compliance: "95%",  spend: 8700000,  stars: 4.5 },
  { rank: 5, name: "SAP SE",               score: 89, delivery: "91%", quality: "88%", compliance: "93%",  spend: 6300000,  stars: 4.5 },
];

const UNDERPERFORMING = [
  { name: "CloudBridge Technologies", issue: "Financial instability detected",          risk: 41, color: "#C62828" },
  { name: "Apex Logistics Group",     issue: "Delivery delays — 68% on-time rate",      risk: 56, color: "#E65100" },
  { name: "Globex Manufacturing",     issue: "Quality non-conformances: 12 incidents",  risk: 63, color: "#E65100" },
];

// Analytics data
const SPEND_BY_CATEGORY = [
  { month: "Jan", IT: 18, Consulting: 12, Software: 8,  Hardware: 6  },
  { month: "Feb", IT: 22, Consulting: 14, Software: 9,  Hardware: 7  },
  { month: "Mar", IT: 20, Consulting: 13, Software: 10, Hardware: 8  },
  { month: "Apr", IT: 25, Consulting: 15, Software: 12, Hardware: 7  },
  { month: "May", IT: 28, Consulting: 18, Software: 11, Hardware: 9  },
  { month: "Jun", IT: 32, Consulting: 20, Software: 13, Hardware: 10 },
];

const VENDOR_GEOGRAPHY = [
  { country: "USA",     vendors: 96, spend: 38200000, pct: 42 },
  { country: "UK",      vendors: 34, spend: 12100000, pct: 28 },
  { country: "Germany", vendors: 28, spend: 9400000,  pct: 23 },
  { country: "India",   vendors: 41, spend: 7800000,  pct: 32 },
  { country: "Canada",  vendors: 18, spend: 4600000,  pct: 14 },
  { country: "China",   vendors: 13, spend: 3900000,  pct: 10 },
];

const AI_SAVINGS = [
  { title: "Contract Renegotiation", detail: "Oracle, SAP SE",         amount: 1800000, priority: "High",   color: "#C62828", bg: "#FFEBEE" },
  { title: "Vendor Consolidation",   detail: "IT Support tier",        amount: 890000,  priority: "Medium", color: "#E65100", bg: "#FFF3E0" },
  { title: "Volume Discount Eligibility", detail: "Microsoft Azure",   amount: 1500000, priority: "High",   color: "#C62828", bg: "#FFEBEE" },
];

const PAST_CONTRACTS = [
  { id: "CON-2025-007", vendorName: "Nexus Systems Ltd",     title: "Annual Software License Agreement", startDate: "2025-01-01", endDate: "2025-12-31", value: 2400000,  status: "Expired",    reason: "Contract term completed" },
  { id: "CON-2025-012", vendorName: "Alpha Freight Co.",     title: "Q3 Logistics SLA",                  startDate: "2025-07-01", endDate: "2025-09-30", value: 1100000,  status: "Expired",    reason: "Project phase concluded" },
  { id: "CON-2024-031", vendorName: "SoftSolutions Inc",     title: "Custom Dev Retainer",              startDate: "2024-10-01", endDate: "2025-03-31", value: 3200000,  status: "Terminated", reason: "Vendor non-compliance — GST audit failure" },
  { id: "CON-2025-018", vendorName: "Vertex Engineering",    title: "Civil Infrastructure Scope 2",     startDate: "2025-04-01", endDate: "2025-12-31", value: 5600000,  status: "Terminated", reason: "Scope replaced by BuildRight Construction" },
  { id: "CON-2024-008", vendorName: "DataPrime Analytics",  title: "BI Dashboarding Subscription",     startDate: "2024-03-15", endDate: "2025-03-14", value: 780000,   status: "Expired",    reason: "Renewed under new CON-2026-011" },
];

// --- Custom Tooltip Components ---
const PerfTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: "#111827" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "#667085" }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: "#111827" }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

const SpendTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", fontSize: 12, minWidth: 200 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827", borderBottom: "1px solid #F1F5F9", paddingBottom: 6 }}>
        {label} Spend — Total: <span style={{ color: "#1565C0", fontWeight: 800 }}>{toINR(total * 100000)}</span>
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
            <span style={{ color: "#667085" }}>{p.name}</span>
          </div>
          <span style={{ fontWeight: 700, color: "#111827" }}>{toINR(p.value * 100000)}</span>
        </div>
      ))}
    </div>
  );
};

function StarRating({ score }: { score: number }) {
  const full = Math.floor(score);
  const half = score % 1 >= 0.5;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={12}
          fill={i <= full ? "#F59E0B" : (i === full + 1 && half ? "#F59E0B" : "none")}
          color="#F59E0B"
          style={{ opacity: i <= full || (i === full + 1 && half) ? 1 : 0.3 }}
        />
      ))}
    </span>
  );
}

export function PerformanceAnalytics({ contracts, vendors = [], viewMode }: PerfProps) {
  const [reportType, setReportType] = useState("vendor-registry");
  const [reportFormat, setReportFormat] = useState("PDF");
  const [contractFilter, setContractFilter] = useState<"all" | "active" | "past">("all");

  // Dynamically map top performing vendors from the actual vendors state
  const defaultPerformanceData: Record<string, { score: number; delivery: string; quality: string; compliance: string; spend: number; stars: number }> = {
    "VND-001": { score: 95, delivery: "96%", quality: "94%", compliance: "97%", spend: 8200000, stars: 4.5 },
    "VND-002": { score: 72, delivery: "68%", quality: "72%", compliance: "88%", spend: 4500000, stars: 4 },
    "VND-003": { score: 92, delivery: "94%", quality: "91%", compliance: "93%", spend: 1200000, stars: 4.5 },
    "VND-004": { score: 79, delivery: "81%", quality: "78%", compliance: "82%", spend: 6300000, stars: 3.5 },
    "VND-005": { score: 91, delivery: "90%", quality: "87%", compliance: "94%", spend: 12000000, stars: 4.5 },
  };

  // If no vendors are passed, fall back to initial vendors list (to prevent breaking if rendering standalone)
  const activeVendorsList = vendors.length > 0 ? vendors : [
    { id: "VND-001", name: "TechCorp Solutions Pvt Ltd" },
    { id: "VND-002", name: "Global Logistics & Freight" },
    { id: "VND-003", name: "BuildRight Construction Pvt Ltd" },
    { id: "VND-004", name: "SoftSolutions Inc" },
    { id: "VND-005", name: "EquipMax Machinery Ltd" }
  ];

  const computedTopVendors = activeVendorsList.map((vendor, idx) => {
    const data = defaultPerformanceData[vendor.id] || {
      score: 85 - idx * 2,
      delivery: `${86 - idx}%`,
      quality: `${85 - idx}%`,
      compliance: `${87 - idx}%`,
      spend: 1500000 + idx * 500000,
      stars: 4
    };
    return {
      rank: idx + 1,
      name: vendor.name,
      ...data
    };
  })
  .sort((a, b) => b.score - a.score)
  .map((v, i) => ({ ...v, rank: i + 1 }));

  // Calculate underperforming list (scores < 90) dynamically from current vendors only
  const computedUnderperforming = computedTopVendors
    .filter(v => v.score < 90)
    .map(v => {
      let issue = "SLA breach risk - Performance warning";
      if (v.name.includes("Logistics")) {
        issue = "Delivery delays — 68% on-time rate";
      } else if (v.name.includes("SoftSolutions")) {
        issue = "Quality non-conformances registered";
      }
      return {
        name: v.name,
        issue,
        risk: 100 - v.score,
        color: v.score < 80 ? "#C62828" : "#E65100"
      };
    });

  // Dynamically constructed AI savings list using names from the active vendor list
  const techCorpName = activeVendorsList.find(v => v.id === "VND-001")?.name || "TechCorp Solutions Pvt Ltd";
  const globalLogName = activeVendorsList.find(v => v.id === "VND-002")?.name || "Global Logistics & Freight";
  const softSolName = activeVendorsList.find(v => v.id === "VND-004")?.name || "SoftSolutions Inc";
  const equipMaxName = activeVendorsList.find(v => v.id === "VND-005")?.name || "EquipMax Machinery Ltd";

  const computedAISavings = [
    { title: "Contract Renegotiation", detail: `${equipMaxName}, ${techCorpName}`, amount: 1800000, priority: "High", color: "#C62828", bg: "#FFEBEE" },
    { title: "Vendor Consolidation", detail: `Consolidate licensing of ${techCorpName} and ${softSolName}`, amount: 890000, priority: "Medium", color: "#E65100", bg: "#FFF3E0" },
    { title: "Volume Discount Eligibility", detail: `${globalLogName} corridor scaling`, amount: 1500000, priority: "High", color: "#C62828", bg: "#FFEBEE" },
  ];

  const triggerDownload = () => {
    alert(`Generating ${reportType.toUpperCase()} Report in ${reportFormat} format...`);
  };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>

      {/* ═══════════ 1. PERFORMANCE ═══════════ */}
      {viewMode === "performance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Vendor Performance</h2>
            <span style={{ fontSize: 13, color: "#667085" }}>Performance tracking · 232 active vendors · Last 6 months</span>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { label: "AVG DELIVERY SCORE", value: "87.4%", delta: "+2.1 pts",  color: "#2E7D32", bg: "#E8F5E9", icon: CheckCircle },
              { label: "AVG QUALITY SCORE",  value: "91.2%", delta: "+1.4 pts",  color: "#FF6F00", bg: "#FFF3E0", icon: Sparkles },
              { label: "AVG COMPLIANCE RATE",value: "94.8%", delta: "+0.6 pts",  color: "#1565C0", bg: "#EEF4FF", icon: ShieldAlert },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", letterSpacing: "0.08em" }}>{k.label}</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <k.icon size={18} color={k.color} />
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#111827", margin: "10px 0 4px" }}>{k.value}</div>
                <div style={{ fontSize: 12, color: k.color, fontWeight: 700 }}>↑ {k.delta} <span style={{ color: "#9CA3AF", fontWeight: 400 }}>vs last month</span></div>
              </div>
            ))}
          </div>

          {/* CHART + UNDERPERFORMING */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#111827", display: "block" }}>Performance Trends</span>
                  <span style={{ fontSize: 11, color: "#667085" }}>Portfolio average · Jan–Dec 2024</span>
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
                  {[{c:"#2E7D32",l:"Delivery"},{c:"#FF6F00",l:"Quality"},{c:"#1565C0",l:"Compliance"}].map((leg, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 18, height: 3, background: leg.c, borderRadius: 2 }} />
                      <span style={{ color: "#667085" }}>{leg.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PERF_TRENDS} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <defs>
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} domain={[80, 100]} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
                    <Tooltip content={<PerfTooltip />} />
                    <Line type="monotone" dataKey="delivery"   stroke="#2E7D32" strokeWidth={2.5} dot={{ r: 4, fill: "#2E7D32", strokeWidth: 0 }} activeDot={{ r: 6 }} name="Delivery"    animationDuration={1200} animationEasing="ease-out" />
                    <Line type="monotone" dataKey="quality"    stroke="#FF6F00" strokeWidth={2.5} dot={{ r: 4, fill: "#FF6F00", strokeWidth: 0 }} activeDot={{ r: 6 }} name="Quality"     animationDuration={1400} animationEasing="ease-out" />
                    <Line type="monotone" dataKey="compliance" stroke="#1565C0" strokeWidth={2.5} dot={{ r: 4, fill: "#1565C0", strokeWidth: 0 }} activeDot={{ r: 6 }} name="Compliance"  animationDuration={1600} animationEasing="ease-out" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Underperforming Vendors</span>
                <span style={{ fontSize: 10, background: "#FFEBEE", color: "#C62828", borderRadius: 100, padding: "2px 8px", fontWeight: 700 }}>{computedUnderperforming.length} at risk</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {computedUnderperforming.map((v, i) => (
                  <div key={i} style={{ borderBottom: i < computedUnderperforming.length - 1 ? "1px solid #F1F5F9" : "none", paddingBottom: i < computedUnderperforming.length - 1 ? 14 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{v.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: v.color }}>
                          <AlertTriangle size={11} />
                          {v.issue}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", marginLeft: 12 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: v.color }}>{v.risk}</div>
                        <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600 }}>risk score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TOP PERFORMING VENDORS TABLE */}
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E4E7EC" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Top Performing Vendors</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["", "Vendor", "Overall Score", "Delivery Rate", "Quality Score", "Compliance", "Annual Spend"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computedTopVendors.map((v) => (
                  <tr key={v.rank} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#374151" }}>{v.rank}</div>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{v.name}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#2E7D32" }}>{v.score}</span>
                        <StarRating score={v.stars} />
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#374151" }}>{v.delivery}</td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#374151" }}>{v.quality}</td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#374151" }}>{v.compliance}</td>
                    <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{toINR(v.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ 2. ANALYTICS ═══════════ */}
      {viewMode === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Analytics Dashboard</h2>
            <span style={{ fontSize: 13, color: "#667085" }}>Procurement intelligence &amp; spend analytics · FY 2024</span>
          </div>

          {/* KPI TILES */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: "YTD SPEND",         value: "₹8.29 Cr", delta: "+12.4%",    det: "vs last month",  color: "#1565C0", icon: DollarSign,   good: true  },
              { label: "ACTIVE CONTRACTS",  value: "184",       delta: "8 expiring", det: "vs last month", color: "#C62828", icon: TrendingUp,   good: false },
              { label: "VENDOR COUNTRIES",  value: "18",        delta: "+3 new",    det: "vs last month",  color: "#2E7D32", icon: Globe,        good: true  },
              { label: "COMPLIANCE RATE",   value: "94.8%",     delta: "+1.2%",     det: "vs last month",  color: "#2E7D32", icon: ShieldAlert,  good: true  },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", letterSpacing: "0.08em" }}>{k.label}</span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${k.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <k.icon size={15} color={k.color} />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#111827", marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: k.good ? "#2E7D32" : "#C62828", fontWeight: 700 }}>
                  {k.good ? "↑" : "▲"} {k.delta} <span style={{ color: "#9CA3AF", fontWeight: 400 }}>{k.det}</span>
                </div>
              </div>
            ))}
          </div>

          {/* STACKED BAR + GEOGRAPHY */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#111827", display: "block" }}>Spend by Category — Monthly</span>
                  <span style={{ fontSize: 11, color: "#667085" }}>Stacked ₹ Lakhs · Jan–Jun 2024</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {[{c:"#1565C0",l:"IT Services"},{c:"#2E7D32",l:"Consulting"},{c:"#FF6F00",l:"Software"},{c:"#9CA3AF",l:"Hardware"}].map((leg,i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: leg.c }} />
                      <span style={{ color: "#667085" }}>{leg.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: 240, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SPEND_BY_CATEGORY} barSize={38} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="gradIT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1565C0" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#1565C020" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="gradConsulting" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#2E7D3220" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="gradSoftware" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6F00" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#FF6F0020" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="gradHardware" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9CA3AF" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#9CA3AF20" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => toINRCompact(v * 100000)} />
                    <Tooltip content={<SpendTooltip />} cursor={{ fill: "#F8FAFC" }} />
                    <Bar dataKey="IT"          name="IT Services" stackId="a" fill="url(#gradIT)" stroke="#1565C0" strokeWidth={0.5} animationDuration={1000} animationEasing="ease-out" />
                    <Bar dataKey="Consulting"  name="Consulting"  stackId="a" fill="url(#gradConsulting)" stroke="#2E7D32" strokeWidth={0.5} animationDuration={1200} animationEasing="ease-out" />
                    <Bar dataKey="Software"    name="Software"    stackId="a" fill="url(#gradSoftware)" stroke="#FF6F00" strokeWidth={0.5} animationDuration={1400} animationEasing="ease-out" />
                    <Bar dataKey="Hardware"    name="Hardware"    stackId="a" fill="url(#gradHardware)" stroke="#9CA3AF" strokeWidth={0.5} radius={[4,4,0,0]} animationDuration={1600} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <Globe size={16} color="#374151" />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Vendor Geography</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {VENDOR_GEOGRAPHY.map((g, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{g.country}</span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ color: "#667085" }}>{g.vendors}v</span>
                        <span style={{ fontWeight: 700, color: "#111827" }}>{toINR(g.spend)}</span>
                      </div>
                    </div>
                    <div style={{ background: "#F1F5F9", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#1565C0", borderRadius: 4, width: `${g.pct}%`, transition: "width 0.8s ease-out" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI SAVINGS */}
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E4E7EC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <Zap size={15} color="#1565C0" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>AI-Identified Savings Opportunities</span>
                </div>
                <span style={{ fontSize: 11, color: "#667085" }}>Machine learning powered cost reduction insights</span>
              </div>
              <div style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "4px 12px" }}>
                ₹42 L potential
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
              {computedAISavings.map((s, i) => (
                <div key={i} style={{ padding: 20, borderRight: i < computedAISavings.length - 1 ? "1px solid #E4E7EC" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "#667085", marginBottom: 12 }}>{s.detail}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{toINR(s.amount)}</span>
                    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "2px 10px" }}>{s.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ 3. CONTRACTS ═══════════ */}
      {viewMode === "contracts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Vendor Contracts SLA</h2>
              <span style={{ fontSize: 13, color: "#667085" }}>View, track, and manage all agreements, SLAs, and past vendor contracts</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all","active","past"] as const).map(f => (
                <button key={f} onClick={() => setContractFilter(f)}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: contractFilter === f ? "#1565C0" : "#fff",
                    color: contractFilter === f ? "#fff" : "#374151",
                    borderColor: contractFilter === f ? "#1565C0" : "#E4E7EC" }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE CONTRACTS */}
          {(contractFilter === "all" || contractFilter === "active") && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <CheckCircle size={14} color="#2E7D32" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32" }}>Active Contracts ({contracts.length})</span>
              </div>
              <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Contract ID", "Supplier", "Agreement Title", "Value", "Start Date", "End Date", "Status"].map((col, idx) => (
                        <th key={idx} style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((con, idx) => (
                      <tr key={con.id} style={{ borderBottom: "1px solid #E4E7EC", background: idx % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                        <td style={{ padding: "14px 18px", fontSize: 12, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{con.id}</td>
                        <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600 }}>{con.vendorName}</td>
                        <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>{con.title}</td>
                        <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700 }}>{toINR(con.value)}</td>
                        <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>{con.startDate}</td>
                        <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>{con.endDate}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#E8F5E9", color: "#2E7D32" }}>Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAST / EXPIRED CONTRACTS */}
          {(contractFilter === "all" || contractFilter === "past") && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Clock size={14} color="#6B7280" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7280" }}>Past &amp; Terminated Contracts ({PAST_CONTRACTS.length})</span>
              </div>
              <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Contract ID", "Supplier", "Agreement Title", "Value", "Period", "Status", "Reason"].map((col, idx) => (
                        <th key={idx} style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PAST_CONTRACTS.map((con, idx) => (
                      <tr key={con.id} style={{ borderBottom: "1px solid #E4E7EC", background: idx % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                        <td style={{ padding: "14px 18px", fontSize: 12, fontFamily: "monospace", color: "#667085", fontWeight: 700 }}>{con.id}</td>
                        <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: "#374151" }}>{con.vendorName}</td>
                        <td style={{ padding: "14px 18px", fontSize: 12, color: "#374151" }}>{con.title}</td>
                        <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: "#374151" }}>{toINR(con.value)}</td>
                        <td style={{ padding: "14px 18px", fontSize: 11, color: "#9CA3AF" }}>{con.startDate} → {con.endDate}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                            background: con.status === "Terminated" ? "#FFEBEE" : "#F5F5F5",
                            color: con.status === "Terminated" ? "#C62828" : "#616161"
                          }}>{con.status}</span>
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 11, color: "#9CA3AF", maxWidth: 200 }}>{con.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ 4. REPORTS ═══════════ */}
      {viewMode === "reports" && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Compliance &amp; System Reports</h2>
          <span style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 24 }}>Select and export procurement or supplier databases</span>

          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 24, maxWidth: 540 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Export General Ledger &amp; Registry</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>REPORT TYPE</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #E4E7EC", borderRadius: 6 }}>
                  <option value="vendor-registry">Active Registered Suppliers Directory</option>
                  <option value="purchase-ledger">Quarterly Purchase Ledger (Q2 FY2026)</option>
                  <option value="compliance-audits">Operational SLA Compliance Audits</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>EXPORT AS</label>
                <div style={{ display: "flex", gap: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="radio" name="format" checked={reportFormat === "PDF"} onChange={() => setReportFormat("PDF")} /> PDF Document
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="radio" name="format" checked={reportFormat === "Excel CSV"} onChange={() => setReportFormat("Excel CSV")} /> Excel CSV
                  </label>
                </div>
              </div>
            </div>
            <button onClick={triggerDownload} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Download size={15} /> Export Audit Ledger
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
