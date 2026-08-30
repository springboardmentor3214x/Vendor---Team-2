import React, { useState } from "react";
import {
  FileBarChart, Download, Calendar, Filter, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, BarChart2, FileText, RefreshCw, ChevronDown,
  ArrowUpRight, ArrowDownRight, Printer, Mail, Building2
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { Vendor, PurchaseOrder, Contract, Invoice, toINR, toINRCompact } from "../data";

interface ReportsProps {
  vendors: Vendor[];
  orders: PurchaseOrder[];
  contracts: Contract[];
  invoices: Invoice[];
  currentRole: string;
  userEmail?: string;
}

const TABS = [
  { id: "vendor-performance", label: "Vendor Performance", icon: TrendingUp },
  { id: "spend-analysis",     label: "Spend Analysis",     icon: BarChart2 },
  { id: "compliance-audit",   label: "Compliance & Audit", icon: CheckCircle2 },
  { id: "po-summary",         label: "PO Summary",          icon: FileText },
  { id: "contract-expiry",    label: "Contract Expiry",     icon: Calendar },
];

const BADGE = (label: string, bg: string, color: string) => (
  <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: bg, color }}>{label}</span>
);

const KPI = ({ label, value, sub, trend, color }: { label: string; value: string; sub: string; trend?: "up" | "down"; color: string }) => (
  <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: "18px 20px" }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{value}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
      {trend === "up"   && <ArrowUpRight   size={13} color="#2E7D32" />}
      {trend === "down" && <ArrowDownRight size={13} color="#C62828" />}
      <span style={{ fontSize: 11, color: trend === "up" ? "#2E7D32" : trend === "down" ? "#C62828" : "#9CA3AF" }}>{sub}</span>
    </div>
    <div style={{ height: 3, background: color, borderRadius: 2, marginTop: 10, opacity: 0.6 }} />
  </div>
);

// Static rich data for each report section
const MONTHLY_SPEND = [
  { month: "Jan", IT: 18.2, Logistics: 12.4, Equipment: 9.0, Services: 7.5, Raw: 5.1 },
  { month: "Feb", IT: 20.1, Logistics: 11.8, Equipment: 11.2, Services: 8.3, Raw: 6.0 },
  { month: "Mar", IT: 17.5, Logistics: 14.2, Equipment: 8.5, Services: 9.1, Raw: 5.8 },
  { month: "Apr", IT: 22.3, Logistics: 13.5, Equipment: 10.4, Services: 7.9, Raw: 7.2 },
  { month: "May", IT: 25.4, Logistics: 15.1, Equipment: 12.1, Services: 10.0, Raw: 8.3 },
  { month: "Jun", IT: 23.8, Logistics: 14.7, Equipment: 11.8, Services: 9.4, Raw: 7.9 },
];

const VENDOR_SCORE_DATA = [
  { name: "TechCorp Solutions",    delivery: 92, quality: 95, compliance: 97 },
  { name: "Global Logistics",      delivery: 68, quality: 72, compliance: 88 },
  { name: "BuildRight Const.",     delivery: 85, quality: 89, compliance: 91 },
  { name: "EquipMax Machinery",    delivery: 90, quality: 87, compliance: 94 },
  { name: "SoftSolutions Inc",     delivery: 78, quality: 82, compliance: 79 },
  { name: "Apex Logistics",        delivery: 61, quality: 70, compliance: 83 },
];

const COMPLIANCE_DATA = [
  { category: "GST Compliance",        compliant: 18, non: 4 },
  { category: "PAN Verification",      compliant: 20, non: 2 },
  { category: "ISO / Cert Docs",       compliant: 14, non: 8 },
  { category: "SLA Adherence",         compliant: 16, non: 6 },
  { category: "Payment Term Adherence",compliant: 19, non: 3 },
];

const PIE_SPEND = [
  { name: "IT Vendors",         value: 38, color: "#1565C0" },
  { name: "Logistics Partners", value: 24, color: "#2E7D32" },
  { name: "Equipment Vendors",  value: 18, color: "#E65100" },
  { name: "Service Providers",  value: 13, color: "#6A1B9A" },
  { name: "Raw Material",       value: 7,  color: "#006064" },
];

const CONTRACT_RISK = [
  { id: "CON-2026-003", vendor: "EquipMax Machinery Ltd",    value: 1200000, expires: "2026-10-10", daysLeft: 89,  risk: "High" },
  { id: "CON-2026-001", vendor: "TechCorp Solutions Pvt Ltd", value: 1800000, expires: "2027-01-01", daysLeft: 171, risk: "Medium" },
  { id: "CON-2026-002", vendor: "Global Logistics & Freight", value: 4500000, expires: "2027-02-15", daysLeft: 216, risk: "Low" },
];

const PO_TREND = [
  { month: "Jan", created: 12, approved: 10, rejected: 2 },
  { month: "Feb", created: 15, approved: 13, rejected: 2 },
  { month: "Mar", created: 11, approved: 9,  rejected: 2 },
  { month: "Apr", created: 18, approved: 16, rejected: 2 },
  { month: "May", created: 22, approved: 19, rejected: 3 },
  { month: "Jun", created: 20, approved: 17, rejected: 3 },
];

export function Reports({ vendors, orders, contracts, invoices, currentRole, userEmail = "" }: ReportsProps) {
  const [activeTab, setActiveTab] = useState("vendor-performance");
  const [dateRange, setDateRange] = useState("Q2 2026");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info" | "warning">("success");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReportVendor, setSelectedReportVendor] = useState<{
    name: string;
    delivery: number;
    quality: number;
    compliance: number;
    avg: number;
    risk: string;
    riskBg: string;
    riskColor: string;
    id: string;
    category: string;
  } | null>(null);

  const totalSpend      = orders.reduce((a, o) => a + o.amount, 0);
  const approvedVendors = vendors.filter(v => v.approvalStatus === "Approved").length;
  const pendingPOs      = orders.filter(o => o.status === "Pending").length;
  const paidInvoices    = invoices.filter(i => i.status === "Paid").length;

  const getFilteredMonthlySpend = () => {
    switch (dateRange) {
      case "Q1 2026":
        return [
          { month: "Jan", IT: 18.2, Logistics: 12.4, Equipment: 9.0, Services: 7.5, Raw: 5.1 },
          { month: "Feb", IT: 20.1, Logistics: 11.8, Equipment: 11.2, Services: 8.3, Raw: 6.0 },
          { month: "Mar", IT: 17.5, Logistics: 14.2, Equipment: 8.5, Services: 9.1, Raw: 5.8 },
        ];
      case "Q2 2026":
        return [
          { month: "Apr", IT: 22.3, Logistics: 13.5, Equipment: 10.4, Services: 7.9, Raw: 7.2 },
          { month: "May", IT: 25.4, Logistics: 15.1, Equipment: 12.1, Services: 10.0, Raw: 8.3 },
          { month: "Jun", IT: 23.8, Logistics: 14.7, Equipment: 11.8, Services: 9.4, Raw: 7.9 },
        ];
      case "Q3 2026":
        return [
          { month: "Jul", IT: 24.1, Logistics: 16.0, Equipment: 13.2, Services: 8.8, Raw: 8.1 },
          { month: "Aug", IT: 25.8, Logistics: 17.2, Equipment: 12.8, Services: 9.2, Raw: 7.8 },
          { month: "Sep", IT: 27.5, Logistics: 18.1, Equipment: 14.0, Services: 10.1, Raw: 8.5 },
        ];
      case "Q4 2026":
        return [
          { month: "Oct", IT: 30.5, Logistics: 19.4, Equipment: 15.1, Services: 10.7, Raw: 9.0 },
          { month: "Nov", IT: 32.1, Logistics: 21.0, Equipment: 16.4, Services: 11.3, Raw: 9.8 },
          { month: "Dec", IT: 35.8, Logistics: 23.5, Equipment: 18.2, Services: 12.5, Raw: 11.2 },
        ];
      default:
        return [
          { month: "Jan", IT: 18.2, Logistics: 12.4, Equipment: 9.0, Services: 7.5, Raw: 5.1 },
          { month: "Feb", IT: 20.1, Logistics: 11.8, Equipment: 11.2, Services: 8.3, Raw: 6.0 },
          { month: "Mar", IT: 17.5, Logistics: 14.2, Equipment: 8.5, Services: 9.1, Raw: 5.8 },
          { month: "Apr", IT: 22.3, Logistics: 13.5, Equipment: 10.4, Services: 7.9, Raw: 7.2 },
          { month: "May", IT: 25.4, Logistics: 15.1, Equipment: 12.1, Services: 10.0, Raw: 8.3 },
          { month: "Jun", IT: 23.8, Logistics: 14.7, Equipment: 11.8, Services: 9.4, Raw: 7.9 },
        ];
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setToastType("info");
    setToastMessage("Data synchronization triggered with cloud registry databases...");
    
    setTimeout(() => {
      setIsRefreshing(false);
      setToastType("success");
      setToastMessage("Database verified! All reports have been updated to the latest telemetry.");
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }, 1000);
  };

  const handleExport = (format: string) => {
    setShowExportMenu(false);
    setToastType("info");
    setToastMessage(`Processing dynamic report payload for ${dateRange} inside ${format} container...`);

    setTimeout(() => {
      const emailDest = userEmail || "admin@vendoriq.com";
      if (format === "PDF") {
        setToastType("success");
        setToastMessage(`Success: ${dateRange.replace(" ", "_")}_Procurement_Report.pdf downloaded & copy sent to ${emailDest}!`);
      } else if (format === "CSV") {
        setToastType("success");
        setToastMessage(`Success: ${dateRange.replace(" ", "_")}_SpendData.csv downloaded & copy sent to ${emailDest}!`);
      } else if (format === "Email") {
        setToastType("success");
        setToastMessage(`Success: Report successfully queued & mailed to ${emailDest}!`);
      } else if (format === "Print") {
        window.print();
        setToastMessage(null);
        return;
      }
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }, 1200);
  };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Procurement Reports & Analytics</h2>
          <span style={{ fontSize: 13, color: "#667085" }}>Enterprise-grade reporting · Vendor intelligence · Regulatory compliance</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={dateRange} onChange={e => {
            setDateRange(e.target.value);
            setToastType("info");
            setToastMessage(`Switching reporting workspace context to: ${e.target.value}`);
            setTimeout(() => setToastMessage(null), 2500);
          }}
            style={{ height: 36, border: "1px solid #E4E7EC", borderRadius: 8, fontSize: 12, padding: "0 10px", background: "#fff" }}>
            {["Q1 2026","Q2 2026","Q3 2026","Q4 2026","FY 2025-26","Custom Range"].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <div style={{ position: "relative" }}>
            <button onClick={() => setShowExportMenu(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 36, border: "1px solid #E4E7EC", borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Download size={14} /> Export <ChevronDown size={12} />
            </button>
            {showExportMenu && (
              <div style={{ position: "absolute", top: 40, right: 0, background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, zIndex: 99, minWidth: 160, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
                {[
                  { label: "Export as PDF",  format: "PDF",  icon: <Printer size={13}/> },
                  { label: "Export as CSV",  format: "CSV",  icon: <Download size={13}/> },
                  { label: "Email Report",   format: "Email", icon: <Mail size={13}/> },
                  { label: "Print Report",   format: "Print", icon: <Printer size={13}/> },
                ].map((opt, i) => (
                  <button key={i} onClick={() => handleExport(opt.format)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", border: "none", background: "none", fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "Inter" }}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleRefresh} disabled={isRefreshing} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 36, border: "1px solid #E4E7EC", borderRadius: 8, background: "#fff", fontSize: 12, cursor: "pointer", opacity: isRefreshing ? 0.7 : 1 }}>
            <RefreshCw size={13} className={isRefreshing ? "spin-animate" : ""} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* TOP KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <KPI label="Total YTD Spend"      value={toINR(totalSpend)} sub="+12.4% vs last quarter" trend="up"   color="#1565C0" />
        <KPI label="Approved Vendors"     value={String(approvedVendors)} sub="of 22 registered"           color="#2E7D32" />
        <KPI label="Pending PO Actions"   value={String(pendingPOs)} sub="Requires approval" trend="down" color="#E65100" />
        <KPI label="Invoices Settled"     value={String(paidInvoices)} sub={`of ${invoices.length} total`} trend="up" color="#6A1B9A" />
      </div>

      {/* TAB BAR */}
      <div style={{ display: "flex", gap: 0, background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
              borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "Inter",
              background: isSel ? "#fff" : "transparent",
              color: isSel ? "#1565C0" : "#667085",
              boxShadow: isSel ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
            }}>
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── VENDOR PERFORMANCE ── */}
      {activeTab === "vendor-performance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Vendor Score Comparison — Delivery · Quality · Compliance</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>Score out of 100 · Portfolio average across {dateRange}</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={VENDOR_SCORE_DATA} margin={{ top: 0, right: 20, left: -15, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#667085" }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  <Bar dataKey="delivery"   name="Delivery Score"   fill="#1565C0" radius={[4,4,0,0]} />
                  <Bar dataKey="quality"    name="Quality Score"    fill="#2E7D32" radius={[4,4,0,0]} />
                  <Bar dataKey="compliance" name="Compliance Score" fill="#6A1B9A" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E4E7EC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>Detailed Vendor Performance Register</span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>Scores auto-calculated from PO & delivery data</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Vendor ID","Company Name","Category","Delivery %","Quality %","Compliance %","Risk Level","Action"].map((h,i) => (
                    <th key={i} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VENDOR_SCORE_DATA.map((v, i) => {
                  const avg = Math.round((v.delivery + v.quality + v.compliance) / 3);
                  const risk = avg >= 88 ? "Low" : avg >= 74 ? "Medium" : "High";
                  const riskColor = risk === "Low" ? "#2E7D32" : risk === "Medium" ? "#E65100" : "#C62828";
                  const riskBg   = risk === "Low" ? "#E8F5E9" : risk === "Medium" ? "#FFF3E0" : "#FFEBEE";
                  const vendor   = vendors[i] ?? vendors[0];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9", background: i%2===0 ? "#fff":"#F9FAFB" }}>
                      <td style={{ padding: "12px 16px", fontSize: 11, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{vendor?.id ?? `VND-00${i+1}`}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700 }}>{v.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#667085" }}>{vendor?.category ?? "IT Vendors"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 3, maxWidth: 60 }}>
                            <div style={{ height: "100%", width: `${v.delivery}%`, background: v.delivery>=80?"#2E7D32":"#C62828", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 700 }}>{v.delivery}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 3, maxWidth: 60 }}>
                            <div style={{ height: "100%", width: `${v.quality}%`, background: v.quality>=80?"#1565C0":"#E65100", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 700 }}>{v.quality}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 3, maxWidth: 60 }}>
                            <div style={{ height: "100%", width: `${v.compliance}%`, background: "#6A1B9A", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 700 }}>{v.compliance}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: riskBg, color: riskColor }}>{risk}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button 
                          onClick={() => setSelectedReportVendor({
                            name: v.name,
                            delivery: v.delivery,
                            quality: v.quality,
                            compliance: v.compliance,
                            avg,
                            risk,
                            riskBg,
                            riskColor,
                            id: vendor?.id ?? `VND-00${i+1}`,
                            category: vendor?.category ?? "IT Vendors"
                          })}
                          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E4E7EC", background: "#fff", fontSize: 11, cursor: "pointer", color: "#1565C0", fontWeight: 700 }}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SPEND ANALYSIS ── */}
      {activeTab === "spend-analysis" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Monthly Spend by Category (₹ Lakhs)</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>Stacked breakdown across all procurement categories · {dateRange}</div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getFilteredMonthlySpend()} margin={{ top:0, right:10, left:-10, bottom:0 }}>
                    <defs>
                      <linearGradient id="repIT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1565C0" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#1565C030" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="repLog" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#2E7D3230" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="repEquip" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E65100" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#E6510030" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="repServ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6A1B9A" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#6A1B9A30" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="repRaw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#006064" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#00606430" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={v => toINRCompact(v * 100000)} />
                    <Tooltip 
                      formatter={(v: number, name: string) => [toINR(Math.round(v * 100000)), name]} 
                      contentStyle={{ fontSize: 11, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid #E4E7EC" }} 
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="IT"        name="IT Services"    stackId="a" fill="url(#repIT)" stroke="#1565C0" strokeWidth={0.5} animationDuration={1000} animationEasing="ease-out" />
                    <Bar dataKey="Logistics" name="Logistics"       stackId="a" fill="url(#repLog)" stroke="#2E7D32" strokeWidth={0.5} animationDuration={1200} animationEasing="ease-out" />
                    <Bar dataKey="Equipment" name="Equipment"       stackId="a" fill="url(#repEquip)" stroke="#E65100" strokeWidth={0.5} animationDuration={1400} animationEasing="ease-out" />
                    <Bar dataKey="Services"  name="Service Provs"  stackId="a" fill="url(#repServ)" stroke="#6A1B9A" strokeWidth={0.5} animationDuration={1600} animationEasing="ease-out" />
                    <Bar dataKey="Raw"       name="Raw Material"   stackId="a" fill="url(#repRaw)" stroke="#006064" strokeWidth={0.5} radius={[4,4,0,0]} animationDuration={1800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Category Distribution</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10 }}>% of total spend</div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PIE_SPEND} cx="50%" cy="50%" innerRadius={44} outerRadius={72} dataKey="value" paddingAngle={3}>
                      {PIE_SPEND.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v:number)=>[`${v}%`]} contentStyle={{fontSize:11,borderRadius:8}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {PIE_SPEND.map((d,i)=>(
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                      <span style={{ color: "#374151" }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SPEND INSIGHTS TABLE */}
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E4E7EC" }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>Spend Concentration & Savings Opportunities</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead><tr style={{ background: "#F9FAFB" }}>
                {["Category","Top Vendor","Q2 Spend","YoY Change","Budget Utilization","Savings Potential","Priority"].map((h,i)=>(
                  <th key={i} style={{ padding:"10px 16px", fontSize:10, fontWeight:700, color:"#667085", borderBottom:"1px solid #E4E7EC", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  { cat:"IT Services",    top:"TechCorp Solutions", spend:"₹23.8 L", yoy:"+14%", util:"82%", sav:"₹3.8L",  pri:"High" },
                  { cat:"Logistics",      top:"Global Logistics",   spend:"₹14.7 L", yoy:"+8%",  util:"76%", sav:"₹2.1L",  pri:"Medium" },
                  { cat:"Equipment",      top:"EquipMax Machinery",  spend:"₹11.8 L", yoy:"-3%",  util:"68%", sav:"₹1.4L",  pri:"Low" },
                  { cat:"Service Provs",  top:"BuildRight Const.",  spend:"₹9.4 L",  yoy:"+21%", util:"91%", sav:"₹1.8L",  pri:"High" },
                  { cat:"Raw Material",   top:"Apex Logistics",      spend:"₹7.9 L",  yoy:"+5%",  util:"59%", sav:"₹0.9L",  pri:"Low" },
                ].map((row,i)=>(
                  <tr key={i} style={{ borderBottom:"1px solid #F1F5F9", background: i%2===0?"#fff":"#F9FAFB" }}>
                    <td style={{ padding:"12px 16px", fontSize:12, fontWeight:700 }}>{row.cat}</td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:"#374151" }}>{row.top}</td>
                    <td style={{ padding:"12px 16px", fontSize:12, fontWeight:700 }}>{row.spend}</td>
                    <td style={{ padding:"12px 16px", fontSize:12 }}>
                      <span style={{ color: row.yoy.startsWith("+") ? "#C62828":"#2E7D32", fontWeight:700 }}>{row.yoy}</span>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:60, height:6, background:"#F1F5F9", borderRadius:3 }}>
                          <div style={{ height:"100%", width:row.util, background:"#1565C0", borderRadius:3 }} />
                        </div>
                        <span style={{ fontWeight:700 }}>{row.util}</span>
                      </div>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12, fontWeight:700, color:"#2E7D32" }}>{row.sav}</td>
                    <td style={{ padding:"12px 16px" }}>
                      {BADGE(row.pri, row.pri==="High"?"#FFEBEE":row.pri==="Medium"?"#FFF3E0":"#E8F5E9", row.pri==="High"?"#C62828":row.pri==="Medium"?"#E65100":"#2E7D32")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── COMPLIANCE & AUDIT ── */}
      {activeTab === "compliance-audit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[
              { label:"GST Compliance Rate",   value:"81%", status:"warning" },
              { label:"ISO-Certified Vendors",  value:"64%", status:"danger" },
              { label:"SLA Adherence",          value:"73%", status:"warning" },
              { label:"Fully Audit-Ready",      value:"18/22", status:"ok" },
            ].map((s,i)=>(
              <div key={i} style={{ background:"#fff", border:`1px solid ${s.status==="ok"?"#C7D7F7":s.status==="warning"?"#FFE0B2":"#FFCDD2"}`, borderRadius:12, padding:"16px 18px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#667085", marginBottom:8 }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:900, color: s.status==="ok"?"#1565C0":s.status==="warning"?"#E65100":"#C62828" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background:"#fff", border:"1px solid #E4E7EC", borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>Compliance Heatmap by Category</div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:16 }}>Compliant vs Non-Compliant vendor count · {dateRange}</div>
            <div style={{ height:220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={COMPLIANCE_DATA} layout="vertical" margin={{ left:140, right:30, top:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize:11, fill:"#374151" }} width={140} />
                  <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="compliant" name="Compliant"     fill="#2E7D32" radius={[0,4,4,0]} />
                  <Bar dataKey="non"       name="Non-Compliant" fill="#C62828" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background:"#fff", border:"1px solid #E4E7EC", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #E4E7EC", display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, fontWeight:800 }}>Vendor Compliance Checklist Register</span>
              <span style={{ fontSize:11, color:"#9CA3AF" }}>Regulatory · GST · ISO · Payment</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", textAlign:"left" }}>
              <thead><tr style={{ background:"#F9FAFB" }}>
                {["Vendor","GST","PAN","Reg Doc","ISO Cert","SLA ≥90%","Audit Status"].map((h,i)=>(
                  <th key={i} style={{ padding:"10px 16px", fontSize:10, fontWeight:700, color:"#667085", borderBottom:"1px solid #E4E7EC", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {vendors.map((v,i)=>{
                  const checks = [!!v.gstNumber, !!v.panNumber, !!v.registrationNumber, i<3, v.contacts.length>0];
                  const allOk = checks.every(Boolean);
                  const Tick = ({ok}:{ok:boolean}) => <span style={{ fontSize:16, color: ok?"#2E7D32":"#C62828" }}>{ok?"✓":"✗"}</span>;
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid #F1F5F9", background: i%2===0?"#fff":"#F9FAFB" }}>
                      <td style={{ padding:"12px 16px", fontSize:12, fontWeight:700 }}>{v.name}</td>
                      <td style={{ padding:"12px 16px" }}><Tick ok={!!v.gstNumber} /></td>
                      <td style={{ padding:"12px 16px" }}><Tick ok={!!v.panNumber} /></td>
                      <td style={{ padding:"12px 16px" }}><Tick ok={!!v.registrationNumber} /></td>
                      <td style={{ padding:"12px 16px" }}><Tick ok={i<3} /></td>
                      <td style={{ padding:"12px 16px" }}><Tick ok={v.contacts.length>0} /></td>
                      <td style={{ padding:"12px 16px" }}>
                        {BADGE(allOk?"Fully Compliant":"Action Required", allOk?"#E8F5E9":"#FFEBEE", allOk?"#2E7D32":"#C62828")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PO SUMMARY ── */}
      {activeTab === "po-summary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
            <div style={{ background:"#fff", border:"1px solid #E4E7EC", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>PO Volume Trend — Created · Approved · Rejected</div>
              <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:16 }}>Monthly movement across {dateRange}</div>
              <div style={{ height:220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PO_TREND} margin={{ top:0, right:20, left:-15, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize:11, fill:"#9CA3AF" }} />
                    <YAxis tick={{ fontSize:10, fill:"#9CA3AF" }} />
                    <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                    <Legend wrapperStyle={{ fontSize:11 }} />
                    <Line type="monotone" dataKey="created"  name="Created"  stroke="#1565C0" strokeWidth={2.5} dot={{ r:4 }} />
                    <Line type="monotone" dataKey="approved" name="Approved" stroke="#2E7D32" strokeWidth={2.5} dot={{ r:4 }} />
                    <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#C62828" strokeWidth={2.5} dot={{ r:4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background:"#fff", border:"1px solid #E4E7EC", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:800, marginBottom:16 }}>PO Status Snapshot</div>
              {[
                { label:"Pending",   count: orders.filter(o=>o.status==="Pending").length,   color:"#E65100", bg:"#FFF3E0" },
                { label:"Approved",  count: orders.filter(o=>o.status==="Approved").length,  color:"#2E7D32", bg:"#E8F5E9" },
                { label:"Rejected",  count: orders.filter(o=>o.status==="Rejected").length,  color:"#C62828", bg:"#FFEBEE" },
                { label:"Draft",     count: orders.filter(o=>o.status==="Draft").length,     color:"#6A1B9A", bg:"#F3E5F5" },
                { label:"Completed", count: orders.filter(o=>o.status==="Completed").length, color:"#006064", bg:"#E0F7FA" },
              ].map((s,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i<4?"1px solid #F1F5F9":"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:s.color }} />
                    <span style={{ fontSize:12, color:"#374151" }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize:18, fontWeight:900, color:s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:"#fff", border:"1px solid #E4E7EC", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #E4E7EC" }}>
              <span style={{ fontSize:13, fontWeight:800 }}>All Purchase Orders Ledger</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", textAlign:"left" }}>
              <thead><tr style={{ background:"#F9FAFB" }}>
                {["PO Number","Vendor","Category","Amount","Issued","Status","Payment"].map((h,i)=>(
                  <th key={i} style={{ padding:"10px 16px", fontSize:10, fontWeight:700, color:"#667085", borderBottom:"1px solid #E4E7EC", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {orders.map((o,i)=>(
                  <tr key={i} style={{ borderBottom:"1px solid #F1F5F9", background: i%2===0?"#fff":"#F9FAFB" }}>
                    <td style={{ padding:"12px 16px", fontSize:11, fontFamily:"monospace", color:"#1565C0", fontWeight:700 }}>{o.id}</td>
                    <td style={{ padding:"12px 16px", fontSize:12, fontWeight:700 }}>{o.vendorName}</td>
                    <td style={{ padding:"12px 16px", fontSize:11, color:"#667085" }}>{o.category}</td>
                    <td style={{ padding:"12px 16px", fontSize:12, fontWeight:700 }}>{toINR(o.amount)}</td>
                    <td style={{ padding:"12px 16px", fontSize:11, color:"#9CA3AF" }}>{o.date}</td>
                    <td style={{ padding:"12px 16px" }}>
                      {BADGE(o.status,
                        o.status==="Approved"?"#E8F5E9":o.status==="Pending"?"#FFF3E0":o.status==="Rejected"?"#FFEBEE":"#F5F5F5",
                        o.status==="Approved"?"#2E7D32":o.status==="Pending"?"#E65100":o.status==="Rejected"?"#C62828":"#616161"
                      )}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      {BADGE(o.paymentStatus==="Paid"?"Paid":"Unpaid", o.paymentStatus==="Paid"?"#E8F5E9":"#FFF3E0", o.paymentStatus==="Paid"?"#2E7D32":"#E65100")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CONTRACT EXPIRY ── */}
      {activeTab === "contract-expiry" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {[
              { label:"Expiring in 90 days",  value:"1", note:"Immediate renewal required",  color:"#C62828", bg:"#FFEBEE" },
              { label:"Expiring in 180 days", value:"1", note:"Begin negotiations",          color:"#E65100", bg:"#FFF3E0" },
              { label:"Active & Healthy",     value:"1", note:"No action needed",            color:"#2E7D32", bg:"#E8F5E9" },
            ].map((s,i)=>(
              <div key={i} style={{ background:"#fff", border:`2px solid ${s.color}20`, borderRadius:12, padding:"18px 20px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#667085", marginBottom:8 }}>{s.label}</div>
                <div style={{ fontSize:36, fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>{s.note}</div>
              </div>
            ))}
          </div>

          <div style={{ background:"#fff", border:"1px solid #E4E7EC", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #E4E7EC", display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, fontWeight:800 }}>Contract Renewal Pipeline</span>
              <span style={{ fontSize:11, color:"#9CA3AF" }}>Sorted by urgency · SLA-bound agreements</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", textAlign:"left" }}>
              <thead><tr style={{ background:"#F9FAFB" }}>
                {["Contract ID","Vendor","Contract Value","Expiry Date","Days Left","Risk Level","Recommended Action"].map((h,i)=>(
                  <th key={i} style={{ padding:"10px 16px", fontSize:10, fontWeight:700, color:"#667085", borderBottom:"1px solid #E4E7EC", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {CONTRACT_RISK.map((c,i)=>{
                  const riskColor = c.risk==="High"?"#C62828":c.risk==="Medium"?"#E65100":"#2E7D32";
                  const riskBg   = c.risk==="High"?"#FFEBEE":c.risk==="Medium"?"#FFF3E0":"#E8F5E9";
                  const action   = c.risk==="High"?"Initiate renewal NOW":c.risk==="Medium"?"Schedule negotiation":"Monitor & review";
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid #F1F5F9" }}>
                      <td style={{ padding:"14px 16px", fontSize:11, fontFamily:"monospace", color:"#1565C0", fontWeight:700 }}>{c.id}</td>
                      <td style={{ padding:"14px 16px", fontSize:12, fontWeight:700 }}>{c.vendor}</td>
                      <td style={{ padding:"14px 16px", fontSize:12, fontWeight:700 }}>{toINR(c.value)}</td>
                      <td style={{ padding:"14px 16px", fontSize:12, color:"#374151" }}>{c.expires}</td>
                      <td style={{ padding:"14px 16px", fontSize:14, fontWeight:900, color:riskColor }}>{c.daysLeft}</td>
                      <td style={{ padding:"14px 16px" }}>{BADGE(c.risk, riskBg, riskColor)}</td>
                      <td style={{ padding:"14px 16px", fontSize:12, color:riskColor, fontWeight:600 }}>{action}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAST CONTRACTS */}
          <div style={{ background:"#FFF3E0", border:"1px solid #FFE0B2", borderRadius:12, padding:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <AlertTriangle size={16} color="#E65100" />
              <span style={{ fontSize:13, fontWeight:800, color:"#E65100" }}>Terminated & Expired Contracts — Audit Reference</span>
            </div>
            {[
              { id:"CON-2025-007", vendor:"Nexus Systems Ltd",       value:"₹24.0 L", period:"2025-01-01 → 2025-12-31", status:"Expired",    reason:"Contract term completed" },
              { id:"CON-2024-031", vendor:"SoftSolutions Inc",        value:"₹32.0 L", period:"2024-10-01 → 2025-03-31", status:"Terminated", reason:"Vendor non-compliance — GST failure" },
              { id:"CON-2025-018", vendor:"Vertex Engineering",        value:"₹56.0 L", period:"2025-04-01 → 2025-12-31", status:"Terminated", reason:"Scope replaced by BuildRight" },
            ].map((c,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i<2?"1px solid #FFE0B2":"none" }}>
                <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                  <span style={{ fontSize:11, fontFamily:"monospace", color:"#E65100", fontWeight:700 }}>{c.id}</span>
                  <span style={{ fontSize:12, fontWeight:700 }}>{c.vendor}</span>
                  <span style={{ fontSize:11, color:"#667085" }}>{c.period}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, color:"#374151" }}>{c.reason}</span>
                  {BADGE(c.status, c.status==="Terminated"?"#FFEBEE":"#F5F5F5", c.status==="Terminated"?"#C62828":"#616161")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "rgba(17, 24, 39, 0.95)",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 9999,
          fontSize: 12,
          fontWeight: 650,
          borderLeft: `4px solid ${toastType === "success" ? "#4CAF50" : toastType === "warning" ? "#FFC107" : "#2196F3"}`,
          transition: "all 0.3s ease",
        }}>
          {toastType === "success" ? <CheckCircle2 size={15} color="#4CAF50" /> : <Clock size={15} color="#2196F3" />}
          <span>{toastMessage}</span>
        </div>
      )}
      {/* VENDOR DETAILED REPORT PREVIEW MODAL */}
      {selectedReportVendor && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "560px",
            border: "1px solid #E4E7EC",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Modal Header */}
            <div style={{ background: "#F8FAFC", padding: "18px 24px", borderBottom: "1px solid #E4E7EC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "#111827", margin: 0 }}>Vendor Performance Audit Report</h3>
                <span style={{ fontSize: 11, color: "#667085" }}>Workspace ID: {selectedReportVendor.id} · Generated Live</span>
              </div>
              <button 
                onClick={() => setSelectedReportVendor(null)}
                style={{ background: "none", border: "none", fontSize: 20, color: "#9CA3AF", cursor: "pointer", fontWeight: 700 }}
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Vendor General Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 900, color: "#111827", margin: "0 0 4px 0" }}>{selectedReportVendor.name}</h4>
                  <span style={{ fontSize: 12, color: "#667085" }}>Category: <strong style={{ color: "#374151" }}>{selectedReportVendor.category}</strong></span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#1565C0", lineHeight: 1 }}>{selectedReportVendor.avg}%</div>
                  <span style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Overall Score</span>
                </div>
              </div>

              {/* Status and Risk Indicator */}
              <div style={{ display: "flex", gap: 12, background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Compliance Risk Level</div>
                  <span style={{ display: "inline-block", marginTop: 4, padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: selectedReportVendor.riskBg, color: selectedReportVendor.riskColor }}>{selectedReportVendor.risk} Risk</span>
                </div>
                <div style={{ flex: 1, borderLeft: "1px solid #E2E8F0", paddingLeft: 12 }}>
                  <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Audit Telemetry Status</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, fontWeight: 700, color: "#2E7D32" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4CAF50" }} />
                    Verified & Active
                  </div>
                </div>
              </div>

              {/* Metrics Progress bars */}
              <div>
                <h5 style={{ fontSize: 12, fontWeight: 800, color: "#374151", margin: "0 0 12px 0", textTransform: "uppercase" }}>Performance Metrics Breakdown</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Delivery Performance", val: selectedReportVendor.delivery, fill: "#1565C0", desc: "Reliability of supply schedules" },
                    { label: "Material/Service Quality", val: selectedReportVendor.quality, fill: "#2E7D32", desc: "Compliances with standards & checklists" },
                    { label: "Regulatory Compliance", val: selectedReportVendor.compliance, fill: "#6A1B9A", desc: "GST validation & PAN correctness" }
                  ].map((m, idx) => (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{m.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 900, color: m.fill }}>{m.val}%</span>
                      </div>
                      <div style={{ background: "#F1F5F9", height: 8, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${m.val}%`, background: m.fill, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{m.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auditor Summary notes */}
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                <h5 style={{ fontSize: 12, fontWeight: 800, color: "#374151", margin: "0 0 6px 0", textTransform: "uppercase" }}>Auditor Verification Details</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#475569" }}>
                  <div>• <strong>Verification Officer:</strong> Priya Sharma (Auditor)</div>
                  <div>• <strong>Last Document Check:</strong> July 12, 2026</div>
                  <div>• <strong>Audit Status:</strong> Compliant with Corporate GFR & tax guidelines.</div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div style={{ background: "#F8FAFC", padding: "14px 24px", borderTop: "1px solid #E4E7EC", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button 
                onClick={() => {
                  setToastType("success");
                  setToastMessage(`Performance Report PDF successfully sent to logged-in email: ${userEmail || "hrithik@vendoriq.com"}!`);
                  setTimeout(() => setToastMessage(null), 3000);
                  setSelectedReportVendor(null);
                }}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#1565C0", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Send to Mail
              </button>
              <button 
                onClick={() => setSelectedReportVendor(null)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
