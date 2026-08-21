import { useState, useEffect } from "react";
import {
  LayoutDashboard, Building2, ShoppingCart, Receipt,
  FileText, TrendingUp, FileBarChart, Bell, Settings,
  Shield, LogOut, User, DollarSign, Activity, Scale,
  Wallet, CheckCircle, RefreshCw, XCircle, AlertCircle,
  AlertTriangle, Play, Server, Lock, Award, MessageSquare,
  Star, History
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

import {
  Role, Vendor, PurchaseOrder, Contract, AuditLog, Invoice, Notification,
  INITIAL_VENDORS, INITIAL_ORDERS, INITIAL_CONTRACTS, INITIAL_AUDIT_LOGS, INITIAL_INVOICES, INITIAL_NOTIFICATIONS,
  toINR, toINRCompact
} from "./data";

import { RoleSelect } from "./components/RoleSelect";
import { VendorManagement } from "./components/VendorManagement";
import { PurchaseOrders } from "./components/PurchaseOrders";
import { PerformanceAnalytics } from "./components/PerformanceAnalytics";
import { FinanceAuditing } from "./components/FinanceAuditing";
import { UserProfile } from "./components/UserProfile";
import { Reports } from "./components/Reports";
import { Settings as PlatformSettings } from "./components/Settings";
import { ProcurementDashboard } from "./components/procurement/ProcurementDashboard";
import { ProcurementRequests } from "./components/procurement/ProcurementRequests";
import { ProcurementPurchaseOrders } from "./components/procurement/ProcurementPurchaseOrders";
import { OrderTrackingPage } from "./components/procurement/OrderTracking";
import { ProcurementInvoices } from "./components/procurement/ProcurementInvoices";
import { performanceService } from "./services/performanceService";
import { VendorPerformance } from "./components/performance/VendorPerformance";

const ROLE_SETTINGS: Record<Role, { color: string; bg: string; tabs: string[] }> = {
  "Administrator": {
    color: "#1565C0",
    bg: "#EEF4FF",
    tabs: ["dashboard", "vendors", "procurement", "purchase-orders", "contracts", "performance", "analytics", "reports", "notifications", "proc-dashboard", "proc-requests", "proc-purchase-orders", "proc-tracking", "proc-invoices", "perf-dashboard", "perf-delivery", "perf-quality", "perf-communication", "perf-service", "perf-history", "perf-ranking", "settings"]
  },
  "Procurement Manager": {
    color: "#2E7D32",
    bg: "#E8F5E9",
    tabs: ["dashboard", "vendors", "procurement", "purchase-orders", "contracts", "performance", "proc-dashboard", "proc-requests", "proc-purchase-orders", "proc-tracking", "proc-invoices", "perf-dashboard", "perf-delivery", "perf-quality", "perf-communication", "perf-service", "perf-history", "perf-ranking", "settings"]
  },
  "Supply Chain Manager": {
    color: "#6A1B9A",
    bg: "#F9FAFB",
    tabs: ["dashboard", "performance", "analytics", "reports", "proc-requests", "proc-tracking", "perf-dashboard", "perf-delivery", "perf-quality", "perf-communication", "perf-service", "perf-history", "perf-ranking", "settings"]
  },
  "Vendor": {
    color: "#006064",
    bg: "#E0F7FA",
    tabs: ["dashboard", "profile", "purchase-orders", "contracts", "notifications", "proc-purchase-orders", "proc-tracking", "proc-invoices", "settings"]
  },
  "Finance Officer": {
    color: "#E65100",
    bg: "#FFF3E0",
    tabs: ["dashboard", "purchase-orders", "invoices", "reports", "proc-invoices", "proc-purchase-orders", "settings"]
  },
  "Auditor": {
    color: "#B71C1C",
    bg: "#FFEBEE",
    tabs: ["dashboard", "reports", "auditors", "proc-requests", "settings"]
  }
};

export default function App() {
  const [screen, setScreen] = useState<"role-select" | "auth-app">("role-select");
  const [activeRole, setActiveRole] = useState<Role>("Administrator");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Hrithik");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Core Global States
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [orders, setOrders] = useState<PurchaseOrder[]>(INITIAL_ORDERS);
  const [contracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [notifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Dashboard Interactive States
  const [adminSandbox, setAdminSandbox] = useState(false);
  const [dashboardNotice, setDashboardNotice] = useState("");
  const [vendorInvoicePO, setVendorInvoicePO] = useState("");
  const [vendorInvoiceFile, setVendorInvoiceFile] = useState("");
  const [vendorInvoiceAmount, setVendorInvoiceAmount] = useState("");

  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const offsetMinutes = now.getTimezoneOffset();
      const offsetSign = offsetMinutes <= 0 ? "+" : "-";
      const absOffset = Math.abs(offsetMinutes);
      const offsetHours = Math.floor(absOffset / 60);
      const offsetMins = absOffset % 60;
      const offsetString = `GMT${offsetSign}${offsetHours}:${offsetMins.toString().padStart(2, '0')}`;
      
      let tzAbbrev = "";
      try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(now);
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        if (tzPart) {
          tzAbbrev = tzPart.value;
        }
      } catch (e) {}

      // If Kolkata/India or offset is exactly +5:30 (-330 minutes)
      const resolvedTz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolvedTz === "Asia/Kolkata" || resolvedTz?.includes("Calcutta") || offsetMinutes === -330) {
        tzAbbrev = "IST";
      }

      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      
      let fullTz = "";
      if (tzAbbrev) {
        if (tzAbbrev.includes("GMT") || tzAbbrev.includes("UTC")) {
          fullTz = tzAbbrev;
        } else {
          fullTz = `${tzAbbrev} ${offsetString}`;
        }
      } else {
        fullTz = offsetString;
      }
      setLiveTime(`${timeString} (${fullTz})`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check login on load
  useEffect(() => {
    const cachedToken = localStorage.getItem("token");
    if (cachedToken) {
      try {
        const payloadStr = atob(cachedToken.split(".")[1]);
        const data = JSON.parse(payloadStr);
        if (data.role && data.email) {
          setActiveRole(data.role);
          setUserEmail(data.email);
          
          let nameVal = "Hrithik";
          if (data.role === "Vendor") {
            const matchedVendor = INITIAL_VENDORS.find(
              v => v.email.toLowerCase() === data.email.toLowerCase() ||
                   v.contacts.some(c => c.email.toLowerCase() === data.email.toLowerCase())
            );
            if (matchedVendor) {
              const matchedContact = matchedVendor.contacts.find(c => c.email.toLowerCase() === data.email.toLowerCase());
              nameVal = matchedContact ? matchedContact.name : matchedVendor.name;
            }
          } else {
            const prefix = data.email.split("@")[0];
            nameVal = prefix.charAt(0).toUpperCase() + prefix.slice(1);
          }
          setUserName(nameVal);
          
          setScreen("auth-app");
          // Re-route to dashboard first
          setActiveTab("dashboard");
        }
      } catch (err) {
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleLoginSuccess = (r: Role, email: string, name: string) => {
    setActiveRole(r);
    setUserEmail(email);
    
    let resolvedName = name;
    if (r === "Vendor") {
      const matchedVendor = vendors.find(
        v => v.email.toLowerCase() === email.toLowerCase() ||
             v.contacts.some(c => c.email.toLowerCase() === email.toLowerCase())
      );
      if (matchedVendor) {
        const matchedContact = matchedVendor.contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
        resolvedName = matchedContact ? matchedContact.name : matchedVendor.name;
      }
    } else if (email && (!name || name === "Hrithik" || name === "")) {
      const prefix = email.split("@")[0];
      resolvedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    setUserName(resolvedName || "Hrithik");
    setScreen("auth-app");
    setActiveTab("dashboard");

    // Add audit entry
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: resolvedName || name || "Hrithik",
      role: r,
      action: "Sign In",
      details: `Successful JWT Login Authenticated as ${r}`,
      ipAddress: "192.168.1.1"
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setScreen("role-select");
  };

  // State manipulation functions
  const handleAddVendor = (v: Vendor) => {
    setVendors([v, ...vendors]);
    // Create Audit Log
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: userName,
      role: activeRole,
      action: "Vendor Created",
      details: `Created new vendor profile: ${v.name} (${v.id})`,
      ipAddress: "192.168.1.1"
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  const handleUpdateVendor = (v: Vendor) => {
    setVendors(vendors.map(item => item.id === v.id ? v : item));
    // Check if approved is updated
    const isApprovalUpdate = vendors.find(item => item.id === v.id)?.approvalStatus !== v.approvalStatus;

    // Create Audit Log
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: userName,
      role: activeRole,
      action: isApprovalUpdate ? "Vendor Approved" : "Vendor Updated",
      details: `${isApprovalUpdate ? "Updated approval status to " + v.approvalStatus : "Modified fields"} of ${v.name}`,
      ipAddress: "192.168.1.1"
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  const handleDeleteVendor = (id: string) => {
    if (activeRole !== "Administrator") return;
    setVendors(vendors.filter(v => v.id !== id));
    // Create Audit Log
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: userName,
      role: activeRole,
      action: "Vendor Deleted",
      details: `Removed vendor profile: ${id}`,
      ipAddress: "192.168.1.1"
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  const handleAddOrder = (po: PurchaseOrder) => {
    setOrders([po, ...orders]);
    // Create Audit Log
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: userName,
      role: activeRole,
      action: "PO Created",
      details: `Generated Purchase Order ${po.id} value ${toINR(po.amount)} to ${po.vendorName}`,
      ipAddress: "192.168.1.1"
    };
    setAuditLogs([newAudit, ...auditLogs]);

    // Create an Invoice as well in PENDING
    const newInvoice: Invoice = {
      id: "INV-" + Math.floor(1000 + Math.random() * 9000),
      poId: po.id,
      vendorName: po.vendorName,
      amount: po.amount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Pending Approval",
      invoiceNum: "TX-" + Math.floor(10000 + Math.random() * 90000)
    };
    setInvoices([newInvoice, ...invoices]);
  };

  const handleUpdateOrder = (po: PurchaseOrder) => {
    setOrders(orders.map(item => item.id === po.id ? po : item));
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: userName,
      role: activeRole,
      action: "PO Status Changed",
      details: `Updated Purchase Order ${po.id} status to ${po.status}`,
      ipAddress: "192.168.1.1"
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  const handlePayInvoice = (id: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "Paid" } : inv));
    const target = invoices.find(inv => inv.id === id);
    if (!target) return;
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: userName,
      role: activeRole,
      action: "Payment Disbursed",
      details: `Processed invoice payment reference ${target.invoiceNum} value ${toINR(target.amount)} to ${target.vendorName}`,
      ipAddress: "192.168.1.1"
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  const handleTriggerAuditLog = (action: string, details: string) => {
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: userName,
      role: activeRole,
      action,
      details,
      ipAddress: "192.168.3." + Math.floor(10 + Math.random() * 89)
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  const handleUpdateProfile = (name: string, mobile: string) => {
    setUserName(name);
    // Create Audit entry
    const newAudit: AuditLog = {
      id: "AUD-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      user: userName,
      role: activeRole,
      action: "Profile Updated",
      details: `Modified details: Changed name to ${name}, mobile number updated (${mobile})`,
      ipAddress: "192.168.1.1"
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  // Navigations Definitions
  const NAV_ITEMS = [
    { id: "dashboard",              label: "Dashboard",              icon: LayoutDashboard },
    { id: "vendors",                label: "Vendors",                icon: Building2 },
    { id: "procurement",            label: "Procurement",            icon: ShoppingCart },
    { id: "purchase-orders",        label: "Purchase Orders",        icon: Receipt },
    { id: "contracts",              label: "Contracts",              icon: FileText },
    { id: "performance",            label: "Performance",            icon: TrendingUp },
    { id: "analytics",              label: "Analytics",              icon: FileBarChart },
    { id: "invoices",               label: "Invoices & Payments",    icon: Receipt },
    { id: "auditors",               label: "Audit Trails",           icon: Shield },
    { id: "reports",                label: "Reports",                icon: FileBarChart },
    { id: "profile",                label: "My Profile",             icon: User },
    { id: "notifications",          label: "Notifications",          icon: Bell },
    // ── Module 3: Procurement Management ─────────────────────────────────
    { id: "proc-dashboard",         label: "  · Overview",           icon: LayoutDashboard },
    { id: "proc-requests",          label: "  · Requests",           icon: FileText },
    { id: "proc-purchase-orders",   label: "  · PO Management",      icon: Receipt },
    { id: "proc-tracking",          label: "  · Order Tracking",     icon: Activity },
    { id: "proc-invoices",          label: "  · Invoices",           icon: DollarSign },
    // ── Module 4: Vendor Performance Management ─────────────────────────
    { id: "perf-dashboard",         label: "Performance Dashboard",  icon: LayoutDashboard },
    { id: "perf-delivery",          label: "  · Delivery Performance",icon: Activity },
    { id: "perf-quality",           label: "  · Quality Evaluation",  icon: Award },
    { id: "perf-communication",     label: "  · Communication Tracking",icon: MessageSquare },
    { id: "perf-service",           label: "  · Service Rating",     icon: Star },
    { id: "perf-history",           label: "  · Performance History", icon: History },
    { id: "perf-ranking",           label: "  · Vendor Ranking",     icon: Award },
    { id: "settings",               label: "Settings",               icon: Settings },
  ];

  const currentRoleConfig = ROLE_SETTINGS[activeRole];

  // Route guarding check
  const renderNavTab = () => {
    // If not in role config, fallback
    if (!currentRoleConfig.tabs.includes(activeTab) && activeTab !== "dashboard" && activeTab !== "profile") {
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ background: "#FFEBEE", border: "1px solid #C62828", borderRadius: 8, padding: 16, display: "inline-block", maxWidth: 500 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#C62828" }}>🚫 Access Denied (Route Guard Enforced)</span>
            <p style={{ fontSize: 13, color: "#667085", marginTop: 8 }}>Your profile level <b>{activeRole}</b> does not own permissions to access tab: <b>{activeTab.toUpperCase()}</b>.</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard": {
        const cardStyle = { background: "#fff", borderRadius: 12, border: "1px solid #E4E7EC", padding: 20 };
        const kpiGridStyle = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 };
        const tblHeaderStyle = { padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" as const };
        const tblCellStyle = { padding: "12px 16px", fontSize: 12, color: "#111827" };
        const actionBtnStyle = (color: string) => ({ padding: "4px 10px", borderRadius: 6, border: `1px solid ${color}`, background: "#fff", color: color, fontSize: 11, fontWeight: 700, cursor: "pointer" });
        const pillStyle = (bg: string, fg: string) => ({ background: bg, color: fg, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "2px 8px", width: "fit-content" });
        const spendTrendData = [
          { m: "Jul", spend: 320000 },
          { m: "Aug", spend: 450000 },
          { m: "Sep", spend: 280000 },
          { m: "Oct", spend: 620000 },
          { m: "Nov", spend: 870000 },
          { m: "Dec", spend: 540000 }
        ];

        // Action Handlers
        const triggerApproveOrder = (id: string) => {
          setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "Approved" } : o));
          setDashboardNotice(`Purchase Order ${id} has been approved.`);
          setTimeout(() => setDashboardNotice(""), 3500);
        };
        const triggerRejectOrder = (id: string) => {
          setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "Rejected" } : o));
          setDashboardNotice(`Purchase Order ${id} has been rejected.`);
          setTimeout(() => setDashboardNotice(""), 3500);
        };
        const triggerApproveVendor = (id: string) => {
          setVendors(prev => prev.map(v => v.id === id ? { ...v, approvalStatus: "Approved", status: "Active" } : v));
          setDashboardNotice(`Vendor profile ${id} Approved and Activated.`);
          setTimeout(() => setDashboardNotice(""), 3500);
        };
        const triggerRejectVendor = (id: string) => {
          setVendors(prev => prev.map(v => v.id === id ? { ...v, approvalStatus: "Rejected", status: "Rejected" } : v));
          setDashboardNotice(`Vendor profile ${id} has been rejected.`);
          setTimeout(() => setDashboardNotice(""), 3500);
        };
        const triggerPayInvoiceLocal = (id: string) => {
          handlePayInvoice(id);
          setDashboardNotice(`Invoice ${id} cleared and payout scheduled.`);
          setTimeout(() => setDashboardNotice(""), 3500);
        };

        const handleAddInvoiceLocal = (e: React.FormEvent) => {
          e.preventDefault();
          if (!vendorInvoicePO || !vendorInvoiceAmount) return;
          const poObj = orders.find(o => o.id === vendorInvoicePO);
          const newInv: Invoice = {
            id: "INV-" + Math.floor(1000 + Math.random() * 9000),
            poId: vendorInvoicePO,
            vendorName: poObj ? poObj.vendorName : "TechCorp Solutions Pvt Ltd",
            amount: parseFloat(vendorInvoiceAmount),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            status: "Pending Approval",
            invoiceNum: "TX-" + Math.floor(10000 + Math.random() * 90000)
          };
          setInvoices([newInv, ...invoices]);
          setDashboardNotice(`Invoice submitted successfully for ${vendorInvoicePO}.`);
          setVendorInvoicePO("");
          setVendorInvoiceAmount("");
          setTimeout(() => setDashboardNotice(""), 3500);
        };

        // Vendor Matching logic
        const currentVendor = vendors.find(
          v => v.email.toLowerCase() === userEmail.toLowerCase() ||
               v.contacts.some(c => c.email.toLowerCase() === userEmail.toLowerCase())
        ) || vendors[0];

        return (
          <div style={{ padding: "24px 28px" }}>
            {/* Page Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                  {activeRole} Workbench
                </h1>
                <span style={{ fontSize: 13, color: "#667085" }}>Welcome back, {userName || "Superuser"} · Enterprise Intelligence View</span>
              </div>
            </div>

            {/* Dashboard Toast Alert */}
            {dashboardNotice && (
              <div style={{ background: "#E8F5E9", border: "1px solid #2E7D3230", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#2E7D32", marginBottom: 20 }}>
                ✓ {dashboardNotice}
              </div>
            )}

            {/* 1. ADMINISTRATOR DASHBOARD */}
            {activeRole === "Administrator" && (
              <div>
                <div style={kpiGridStyle}>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Registered Merchants</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{vendors.length}</div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>Total in database</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Pending Registrations</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: vendors.filter(v => v.approvalStatus === "Pending").length > 0 ? "#E65100" : "#111827" }}>
                      {vendors.filter(v => v.approvalStatus === "Pending").length}
                    </div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Applications queue</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Security Audit Logs</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{auditLogs.length}</div>
                    <span style={{ fontSize: 11, color: "#1565C0", fontWeight: 700 }}>Active trace audit entries</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Sandbox Environment</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: adminSandbox ? "#2E7D32" : "#B71C1C" }}>
                      {adminSandbox ? "ACTIVE" : "SHIELDED"}
                    </div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>System operational mode</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
                  {/* Approval Queue */}
                  <div style={{ ...cardStyle, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>Vendor Registration Requests</span>
                      <span style={pillStyle("#FFF3E0", "#E65100")}>{vendors.filter(v=>v.approvalStatus === "Pending").length} Pending</span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#F9FAFB" }}>
                          {["Company Name", "Category", "Contact", "Action"].map((h, i) => (
                            <th key={i} style={tblHeaderStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.filter(v => v.approvalStatus === "Pending").map(v => (
                          <tr key={v.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={tblCellStyle}><b>{v.name}</b></td>
                            <td style={tblCellStyle}>{v.category}</td>
                            <td style={tblCellStyle}>{v.email}</td>
                            <td style={{ ...tblCellStyle, display: "flex", gap: 6 }}>
                              <button onClick={() => triggerApproveVendor(v.id)} style={actionBtnStyle("#2E7D32")}>Approve</button>
                              <button onClick={() => triggerRejectVendor(v.id)} style={actionBtnStyle("#B71C1C")}>Reject</button>
                            </td>
                          </tr>
                        ))}
                        {vendors.filter(v => v.approvalStatus === "Pending").length === 0 && (
                          <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>All merchant registrations completed.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Infrastructure Health & Performance Insights */}
                  <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>System Health & Node Status</span>
                      <span style={pillStyle("#E8F5E9", "#2E7D32")}>Operational</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "#475569", fontWeight: 600 }}>API Gateway Load</span>
                          <span style={{ fontWeight: 700, color: "#1E293B" }}>24.8%</span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "24.8%", background: "#1565C0", borderRadius: 100 }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "#475569", fontWeight: 600 }}>Memory Heap (V8)</span>
                          <span style={{ fontWeight: 700, color: "#1E293B" }}>42.1%</span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "42.1%", background: "#6A1B9A", borderRadius: 100 }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "#475569", fontWeight: 600 }}>Database Connection Latency</span>
                          <span style={{ fontWeight: 700, color: "#2E7D32" }}>18 ms</span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "18%", background: "#2E7D32", borderRadius: 100 }} />
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px", textAlign: "center", border: "1px solid #F1F5F9" }}>
                          <div style={{ fontSize: 10, color: "#64748B", marginBottom: 2 }}>Error Rate</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#2E7D32" }}>0.00%</div>
                        </div>
                        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px", textAlign: "center", border: "1px solid #F1F5F9" }}>
                          <div style={{ fontSize: 10, color: "#64748B", marginBottom: 2 }}>Active Sessions</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B" }}>142</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit table */}
                <div style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>Audit System Feed</span>
                    <span style={{ fontSize: 12, color: "#667085" }}>Latest Logs</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Log ID", "Timestamp", "Operator Name", "Action Type", "Audit details"].map((h, i) => (
                          <th key={i} style={tblHeaderStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 5).map(alg => (
                        <tr key={alg.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ ...tblCellStyle, fontSize: 11, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{alg.id}</td>
                          <td style={{ ...tblCellStyle, fontSize: 11 }}>{alg.timestamp}</td>
                          <td style={tblCellStyle}><b>{alg.user}</b> <span style={{ fontSize: 10, color: "#9CA3AF" }}>({alg.role})</span></td>
                          <td style={tblCellStyle}><span style={pillStyle("#EFF6FF", "#1E40AF")}>{alg.action}</span></td>
                          <td style={{ ...tblCellStyle, fontSize: 11, color: "#667085" }}>{alg.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. PROCUREMENT MANAGER DASHBOARD */}
            {activeRole === "Procurement Manager" && (
              <div>
                <div style={kpiGridStyle}>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Awaiting Order Decisions</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: orders.filter(o=>o.status==="Pending").length > 0 ? "#E65100" : "#111827" }}>
                      {orders.filter(o=>o.status==="Pending").length}
                    </div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Pending approval queue</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Active PO Contracts</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{contracts.filter(c=>c.status==="Active").length}</div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>Active SLA coverage</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Total Spend volume</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{toINRCompact(orders.reduce((a,o)=>a+o.amount, 0))}</div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>YTD spent pool</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Average Compliance</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#1565C0" }}>94.8%</div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>SLA quality target</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 14 }}>Spend Distribution by Merchant Category</span>
                    <div style={{ height: 210 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "IT Services", val: 1250000 },
                          { name: "Logistics", val: 820000 },
                          { name: "Equipment", val: 1890000 },
                          { name: "Services", val: 650000 }
                        ]} margin={{ left: -10 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={v => toINRCompact(v)} />
                          <Tooltip formatter={(v: number) => [toINR(v), "Spent"]} />
                          <Bar dataKey="val" fill="#1565C0" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 12 }}>Procurement Alerts</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {orders.filter(o=>o.status === "Pending").map(o => (
                        <div key={o.id} style={{ padding: 10, background: "#FFF3E0", borderRadius: 8, borderLeft: "4px solid #E65100" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#E65100" }}>Awaiting Approval: {o.id}</div>
                          <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>{o.vendorName} is waiting for ₹{(o.amount/100000).toFixed(1)} L clearance.</div>
                        </div>
                      ))}
                      {orders.filter(o=>o.status === "Pending").length === 0 && (
                        <div style={{ fontSize: 12, color: "#667085" }}>✓ Sourcing dashboard clean. No alerts.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sourcing queue */}
                <div style={cardStyle}>
                  <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 12 }}>Sourcing Approval Queue</span>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["PO Number", "Vendor Name", "Category", "Date", "Amount", "Action"].map((h, i) => (
                          <th key={i} style={tblHeaderStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.status === "Pending").map(o => (
                        <tr key={o.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ ...tblCellStyle, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{o.id}</td>
                          <td style={tblCellStyle}><b>{o.vendorName}</b></td>
                          <td style={tblCellStyle}>{o.category}</td>
                          <td style={tblCellStyle}>{o.date}</td>
                          <td style={{ ...tblCellStyle, fontWeight: 700 }}>{toINR(o.amount)}</td>
                          <td style={tblCellStyle}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => triggerApproveOrder(o.id)} style={actionBtnStyle("#2E7D32")}>Approve</button>
                              <button onClick={() => triggerRejectOrder(o.id)} style={actionBtnStyle("#B71C1C")}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {orders.filter(o => o.status === "Pending").length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>Sourcing pipeline is cleared.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. SUPPLY CHAIN MANAGER DASHBOARD */}
            {activeRole === "Supply Chain Manager" && (
              <div>
                <div style={kpiGridStyle}>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Shipments Awaiting Routing</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#1565C0" }}>
                      {orders.filter(o=>o.status === "Approved").length}
                    </div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>In pre-logistics pipeline</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Delivery SLA Breaches</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: orders.filter(o=>o.status==="Draft").length > 0 ? "#B71C1C" : "#111827" }}>
                      {orders.filter(o=>o.status === "Draft").length}
                    </div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Dispatch delays logged</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Settled Merchants</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{vendors.filter(v=>v.status==="Active").length}</div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>Active carriers setup</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Fulfillment Efficiency</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#2E7D32" }}>98.2%</div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Monthly completion SLA</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 20 }}>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 14 }}>Logistics Dispatch & Logistics Control Table</span>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#F9FAFB" }}>
                          {["PO Number", "Dispatch Partner", "Value", "Setup Date", "Logistics status"].map((h, i) => (
                            <th key={i} style={tblHeaderStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ ...tblCellStyle, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{o.id}</td>
                            <td style={tblCellStyle}><b>{o.vendorName}</b></td>
                            <td style={tblCellStyle}>{toINR(o.amount)}</td>
                            <td style={tblCellStyle}>{o.date}</td>
                            <td style={tblCellStyle}>
                              {o.status === "Completed" && <span style={pillStyle("#E8F5E9", "#2E7D32")}>Completed / Deliv</span>}
                              {o.status === "Approved" && <span style={pillStyle("#EFF6FF", "#1E40AF")}>Shipment Transit</span>}
                              {o.status === "Pending" && <span style={pillStyle("#FFF3E0", "#E65100")}>Pre-Dispatch routing</span>}
                              {o.status === "Draft" && <span style={pillStyle("#FFEBEE", "#B71C1C")}>SLA Delay Risk</span>}
                              {o.status === "Rejected" && <span style={pillStyle("#F5F5F5", "#667085")}>Cancelled PO</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 14 }}>Logistics Volume Distribution</span>
                    <div style={{ height: 210 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "IT", val: 3 },
                          { name: "Logistics", val: 5 },
                          { name: "Service", val: 2 },
                          { name: "Machinery", val: 4 }
                        ]}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="val" fill="#6A1B9A" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. FINANCE OFFICER DASHBOARD */}
            {activeRole === "Finance Officer" && (
              <div>
                <div style={kpiGridStyle}>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Unresolved Invoices</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: invoices.filter(i=>i.status==="Pending Approval").length > 0 ? "#E65100" : "#111827" }}>
                      {invoices.filter(i=>i.status==="Pending Approval").length}
                    </div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Pending auditing clearance</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Outstanding Accounts Payable</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#B71C1C" }}>
                      {toINRCompact(invoices.filter(i=>i.status==="Pending Approval").reduce((acc,c)=>acc+c.amount, 0))}
                    </div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Net liabilities portfolio</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Settled Payments</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#2E7D32" }}>
                      {toINRCompact(invoices.filter(i=>i.status==="Paid").reduce((acc,c)=>acc+c.amount, 0))}
                    </div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>Total payouts released</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Net Terms Adherence</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>100%</div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>0 Delayed payments</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
                  {/* Ledger queue */}
                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 12 }}>Accounts Payable Invoice Clearance</span>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#F9FAFB" }}>
                          {["Invoice Num", "Merchant", "Amount", "Due Date", "Operation"].map((h, i) => (
                            <th key={i} style={tblHeaderStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.filter(i => i.status === "Pending Approval").map(i => (
                          <tr key={i.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ ...tblCellStyle, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{i.invoiceNum}</td>
                            <td style={tblCellStyle}><b>{i.vendorName}</b></td>
                            <td style={{ ...tblCellStyle, fontWeight: 700 }}>{toINR(i.amount)}</td>
                            <td style={tblCellStyle}>{i.dueDate}</td>
                            <td style={tblCellStyle}>
                              <button onClick={() => triggerPayInvoiceLocal(i.id)} style={actionBtnStyle("#E65100")}>Release Payout</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* AreaChart */}
                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 14 }}>Spend Trend (Last 6 Months)</span>
                    <div style={{ height: 210 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spendTrendData}>
                          <defs>
                            <linearGradient id="financeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E65100" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#E65100" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="spend" stroke="#E65100" fill="url(#financeGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. VENDOR DASHBOARD */}
            {activeRole === "Vendor" && (
              <div>
                <div style={kpiGridStyle}>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Work Contracts</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>
                      {orders.filter(o=>o.vendorName.toLowerCase().includes(currentVendor?.name.toLowerCase() || "")).length}
                    </div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>Orders generated</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Receivables Outstanding</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#E65100" }}>
                      {toINR(invoices.filter(i=> (i.vendorName.toLowerCase().includes(currentVendor?.name.toLowerCase() || "")) && i.status === "Pending Approval").reduce((acc,c)=>acc+c.amount, 0))}
                    </div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Pending ledger audit</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Settled Ledger Collections</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#2E7D32" }}>
                      {toINR(invoices.filter(i=>(i.vendorName.toLowerCase().includes(currentVendor?.name.toLowerCase() || "")) && i.status === "Paid").reduce((acc,c)=>acc+c.amount, 0))}
                    </div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>Payouts fully settled</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Active SLA Contracts</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>
                      {contracts.filter(c=>c.vendorName.toLowerCase().includes(currentVendor?.name.toLowerCase() || "")).length}
                    </div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>Service agreements setup</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: 20 }}>
                  {/* Submit Invoice form */}
                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 12 }}>Submit Billing Invoice</span>
                    <form onSubmit={handleAddInvoiceLocal} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#667085", marginBottom: 4 }}>Select PO Number</label>
                        <select value={vendorInvoicePO} onChange={e => setVendorInvoicePO(e.target.value)} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #E4E7EC", outline: "none", fontSize: 12 }}>
                          <option value="">- Select Active Purchase Order -</option>
                          {orders.filter(o=>o.vendorName.toLowerCase().includes(currentVendor?.name.toLowerCase() || "")).map(o => (
                            <option key={o.id} value={o.id}>{o.id} - ({toINRCompact(o.amount)})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#667085", marginBottom: 4 }}>Requested Invoice Amount (INR)</label>
                        <input type="number" placeholder="50000" value={vendorInvoiceAmount} onChange={e => setVendorInvoiceAmount(e.target.value)} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #E4E7EC", outline: "none", fontSize: 12 }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#667085", marginBottom: 4 }}>Upload Invoice Document (PDF)</label>
                        <input type="file" required style={{ fontSize: 11 }} />
                      </div>
                      <button type="submit" style={{ ...actionBtnStyle("#1565C0"), width: "100%", padding: "8px 12px", background: "#1565C0", color: "#fff", border: "none" }}>Submit Billing File</button>
                    </form>
                  </div>

                  {/* Assigned POs & Contracts */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={cardStyle}>
                      <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 10 }}>Assigned Sourcing Agreements</span>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "#F9FAFB" }}>
                            {["Contract ID", "Title / Scope", "End Date", "Total Value"].map((h, i) => (
                              <th key={i} style={tblHeaderStyle}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {contracts.filter(c=>c.vendorName.toLowerCase().includes(currentVendor?.name.toLowerCase() || "")).map(c => (
                            <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ ...tblCellStyle, fontFamily: "monospace", color: "#006064", fontWeight: 700 }}>{c.id}</td>
                              <td style={tblCellStyle}><b>{c.title}</b></td>
                              <td style={tblCellStyle}>{c.endDate}</td>
                              <td style={{ ...tblCellStyle, fontWeight: 700 }}>{toINR(c.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. AUDITOR DASHBOARD */}
            {activeRole === "Auditor" && (
              <div>
                <div style={kpiGridStyle}>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Registered Merchants</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{vendors.filter(v=>v.status==="Active").length}</div>
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>Active and audited</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Audit Verification Logs</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{auditLogs.length}</div>
                    <span style={{ fontSize: 11, color: "#1565C0", fontWeight: 700 }}>Checked operations</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Reviewed Invoices</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{invoices.length}</div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Total ledger invoices</span>
                  </div>
                  <div style={cardStyle}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Pending Audit Tasks</span>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#E65100" }}>1 Item</div>
                    <span style={{ fontSize: 11, color: "#E65100", fontWeight: 700 }}>Cycle review pending</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 20 }}>
                  {/* Registry Review table */}
                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 12 }}>Compliance & Registry Auditor Checklist</span>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#F9FAFB" }}>
                          {["Company Name", "GST Standard", "PAN Standard", "Registration Code", "Audit status"].map((h, i) => (
                            <th key={i} style={tblHeaderStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map(v => (
                          <tr key={v.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={tblCellStyle}><b>{v.name}</b></td>
                            <td style={tblCellStyle}><span style={{ fontFamily: "monospace", fontSize: 11 }}>{v.gstNumber || "MOCK-GST-182"}</span></td>
                            <td style={tblCellStyle}><span style={{ fontFamily: "monospace", fontSize: 11 }}>{v.panNumber || "MOCK-PAN-012"}</span></td>
                            <td style={tblCellStyle}><span style={{ fontSize: 11, color: "#667085" }}>{v.registrationNumber || "Unregistered"}</span></td>
                            <td style={tblCellStyle}>
                              {v.approvalStatus === "Approved" ? (
                                <span style={pillStyle("#E8F5E9", "#2E7D32")}>Verified</span>
                              ) : (
                                <span style={pillStyle("#FFF3E0", "#E65100")}>Unreviewed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Audit Timeline */}
                  <div style={cardStyle}>
                    <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 12 }}>Audited Operations Timeline</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {auditLogs.slice(0, 4).map(alg => (
                        <div key={alg.id} style={{ borderLeft: "3px solid #B71C1C", paddingLeft: 10, paddingBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#B71C1C" }}>{alg.action}</span>
                          <span style={{ fontSize: 9, color: "#9CA3AF", marginLeft: 8 }}>{alg.timestamp}</span>
                          <p style={{ fontSize: 11, color: "#374151", margin: "2px 0 0 0" }}>{alg.details} <span style={{ color: "#9CA3AF" }}>by {alg.user}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case "vendors":
        return <VendorManagement vendors={vendors} currentRole={activeRole} currentUser={userName} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} onDeleteVendor={handleDeleteVendor} />;
      case "purchase-orders": {
        const currentVendorObj = activeRole === "Vendor" ? (vendors.find(
          v => v.email.toLowerCase() === userEmail.toLowerCase() ||
               v.contacts.some(c => c.email.toLowerCase() === userEmail.toLowerCase())
        ) || vendors[0]) : undefined;
        return (
          <PurchaseOrders
            orders={orders}
            vendors={vendors}
            currentRole={activeRole}
            userVendorName={currentVendorObj?.name}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
          />
        );
      }
      case "performance":
        return <PerformanceAnalytics contracts={contracts} vendors={vendors} viewMode="performance" />;
      case "analytics":
        return <PerformanceAnalytics contracts={contracts} vendors={vendors} viewMode="analytics" />;
      case "contracts":
        return <PerformanceAnalytics contracts={contracts} vendors={vendors} viewMode="contracts" />;
      case "reports":
        return <Reports vendors={vendors} orders={orders} contracts={contracts} invoices={invoices} currentRole={activeRole} userEmail={userEmail} />;
      case "invoices":
        return <FinanceAuditing viewMode="invoices" invoices={invoices} auditLogs={auditLogs} onPayInvoice={handlePayInvoice} onAddAuditLog={handleTriggerAuditLog} />;
      case "auditors":
        return <FinanceAuditing viewMode="auditors" invoices={invoices} auditLogs={auditLogs} onPayInvoice={handlePayInvoice} onAddAuditLog={handleTriggerAuditLog} />;
      case "profile": {
        // For Vendor role, find the matching vendor record by email, contact email, or name
        const currentVendor = activeRole === "Vendor"
          ? vendors.find(
              v => v.email.toLowerCase() === userEmail.toLowerCase() ||
                   v.contacts.some(c => c.email.toLowerCase() === userEmail.toLowerCase())
            ) ?? vendors.find(v => v.email.toLowerCase() === userEmail.toLowerCase() || v.name.toLowerCase().includes(userName.toLowerCase().split(" ")[0])) ?? vendors[0] ?? null
          : null;
        return <UserProfile currentRole={activeRole} userEmail={userEmail} userName={userName} currentVendor={currentVendor} onUpdateProfile={handleUpdateProfile} onUpdateVendor={handleUpdateVendor} />;
      }
      case "procurement": {
        const pendingApprovals = orders.filter(o => o.status === "Pending");
        const SPEND_TREND = [
          { m: "Jul", spend: 2.8 }, { m: "Aug", spend: 3.2 }, { m: "Sep", spend: 4.1 },
          { m: "Oct", spend: 5.0 }, { m: "Nov", spend: 6.1 }, { m: "Dec", spend: 5.4 }
        ];
        const handleApproveOrder = (id: string) => {
          setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "Approved" } : o));
        };
        const handleRejectOrder = (id: string) => {
          setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "Rejected" } : o));
        };
        return (
          <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Procurement Dashboard</h2>
                <span style={{ fontSize: 13, color: "#667085" }}>Live PO pipeline · Vendor order approvals · Spend tracking</span>
              </div>
            </div>

            {/* PIPELINE STATS */}
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: "16px 24px", marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
                {[
                  { label: "Pending",   count: orders.filter(o=>o.status==="Pending").length,   color: "#1565C0", active: true  },
                  { label: "Approved",  count: orders.filter(o=>o.status==="Approved").length,  color: "#374151", active: false },
                  { label: "Draft",     count: orders.filter(o=>o.status==="Draft").length,     color: "#374151", active: false },
                  { label: "Rejected",  count: orders.filter(o=>o.status==="Rejected").length,  color: "#374151", active: false },
                  { label: "Completed", count: orders.filter(o=>o.status==="Completed").length, color: "#374151", active: false },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 4 ? "1px solid #E4E7EC" : "none", padding: "6px 0" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.active ? s.color : "#374151" }}>{s.count}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: s.active ? s.color : "#9CA3AF", marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{s.count} PO{s.count !== 1 ? "s" : ""}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
              {[
                { label: "POs This Month",     value: orders.length.toString(),                    badge: `+${Math.max(0,orders.length-5)} from last month`, color: "#1565C0", bg: "#1565C025" },
                { label: "Pending Approvals", value: pendingApprovals.length.toString(),           badge: `${pendingApprovals.length} awaiting action`,  color: "#E65100", bg: "#E6510025" },
                { label: "Overdue Orders",     value: orders.filter(o=>o.status==="Draft").length.toString(), badge: "SLA breach risk", color: "#C62828", bg: "#C6282825" },
              ].map((k, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 8 }}>{k.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>{k.badge}</div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShoppingCart size={18} color={k.color} />
                  </div>
                </div>
              ))}
            </div>

            {/* APPROVALS TABLE + SPEND CHART */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
              <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #E4E7EC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Pending Approvals</span>
                  <span style={{ background: "#FFF3E0", color: "#E65100", fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "2px 10px" }}>{pendingApprovals.length} pending</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["PO NUMBER", "VENDOR", "AMOUNT", "REQUESTED", "ACTION"].map((h, i) => (
                        <th key={i} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#667085", borderBottom: "1px solid #E4E7EC", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => o.status === "Pending" ? (
                      <tr key={o.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "#1565C0", fontWeight: 700 }}>{o.id}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#111827" }}>{o.vendorName}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700 }}>{toINR(o.amount)}</td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#9CA3AF" }}>{o.date}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => handleApproveOrder(o.id)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #2E7D32", background: "#fff", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                            <button onClick={() => handleRejectOrder(o.id)}  style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #C62828", background: "#fff", color: "#C62828",  fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ) : null)}
                    {orders.every(o => o.status !== "Pending") && (
                      <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>✓ All POs have been processed</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* SPEND TREND */}
              <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Spend Trend</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>Last 6 months · ₹ millions</div>
                </div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SPEND_TREND} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1565C0" stopOpacity={0.18}/>
                          <stop offset="95%" stopColor="#1565C0" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}M`} />
                      <Tooltip formatter={(v: number) => [`₹${v}M`, "Spend"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Area type="monotone" dataKey="spend" stroke="#1565C0" strokeWidth={2.5} fill="url(#spendGrad)" dot={{ r: 4, fill: "#1565C0", strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={1200} animationEasing="ease-out" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14, borderTop: "1px solid #E4E7EC", paddingTop: 14 }}>
                  {[
                    { label: "Avg / month", value: toINR(orders.reduce((a,o)=>a+o.amount,0)/6) },
                    { label: "6M total",    value: toINR(orders.reduce((a,o)=>a+o.amount,0)) },
                    { label: "Growth",      value: "+12%" },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case "notifications": {
        const visibleNotifications = activeRole === "Auditor"
          ? notifications.filter(n => n.type === "info" && !n.title.toLowerCase().includes("approval") && !n.title.toLowerCase().includes("shipment") && !n.title.toLowerCase().includes("po") && !n.title.toLowerCase().includes("vendor"))
          : notifications;

        return (
          <div style={{ padding: "24px 28px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>System Notifications & Alerts</h2>
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 18 }}>
              {visibleNotifications.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#667085", fontSize: 13 }}>
                  ✓ No system compliance notifications active for Auditor monitoring. Operational alerts filtered.
                </div>
              ) : (
                visibleNotifications.map((not, idx) => (
                  <div key={idx} style={{ padding: "10px 0", borderBottom: idx < visibleNotifications.length - 1 ? "1px solid #E4E7EC" : "none", display: "flex", gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: not.type === "danger" ? "#C62828" : not.type === "warning" ? "#E65100" : "#1565C0", alignSelf: "center" }} />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{not.title}</span>
                      <p style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>{not.description}</p>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{not.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }
      case "settings":
        return <PlatformSettings currentRole={activeRole} userEmail={userEmail} userName={userName} />;

      // ── Module 3: Procurement Management tabs ──────────────────────────
      // ── Module 3: Procurement Management tabs ──────────────────────────
      case "proc-dashboard":
        return <ProcurementDashboard roleColor={currentRoleConfig.color} setActiveTab={setActiveTab} />;
      case "proc-requests":
        return <ProcurementRequests roleColor={currentRoleConfig.color} currentRole={activeRole} userName={userName} />;
      case "proc-purchase-orders": {
        const currentVendorObj = activeRole === "Vendor" ? (vendors.find(
          v => v.email.toLowerCase() === userEmail.toLowerCase() ||
               v.contacts.some(c => c.email.toLowerCase() === userEmail.toLowerCase())
        ) || vendors[0]) : undefined;
        return (
          <ProcurementPurchaseOrders
            roleColor={currentRoleConfig.color}
            currentRole={activeRole}
            userName={userName}
            userVendorName={currentVendorObj?.name}
          />
        );
      }
      case "proc-tracking": {
        const currentVendorObj = activeRole === "Vendor" ? (vendors.find(
          v => v.email.toLowerCase() === userEmail.toLowerCase() ||
               v.contacts.some(c => c.email.toLowerCase() === userEmail.toLowerCase())
        ) || vendors[0]) : undefined;
        return (
          <OrderTrackingPage
            roleColor={currentRoleConfig.color}
            currentRole={activeRole}
            userName={userName}
            userVendorName={currentVendorObj?.name}
          />
        );
      }
      case "proc-invoices": {
        const currentVendorObj = activeRole === "Vendor" ? (vendors.find(
          v => v.email.toLowerCase() === userEmail.toLowerCase() ||
               v.contacts.some(c => c.email.toLowerCase() === userEmail.toLowerCase())
        ) || vendors[0]) : undefined;
        return (
          <ProcurementInvoices
            roleColor={currentRoleConfig.color}
            currentRole={activeRole}
            userName={userName}
            userVendorName={currentVendorObj?.name}
          />
        );
      }
      case "perf-dashboard":
      case "perf-delivery":
      case "perf-quality":
      case "perf-communication":
      case "perf-service":
      case "perf-history":
      case "perf-ranking": {
        const currentVendorObj = activeRole === "Vendor" ? (vendors.find(
          v => v.email.toLowerCase() === userEmail.toLowerCase() ||
               v.contacts.some(c => c.email.toLowerCase() === userEmail.toLowerCase())
        ) || vendors[0]) : undefined;
        return (
          <VendorPerformance
            activeTab={activeTab}
            roleColor={currentRoleConfig.color}
            currentRole={activeRole}
            userVendorName={currentVendorObj?.name}
            onNavigateTab={(tab: string) => setActiveTab(tab)}
          />
        );
      }

      default:
        return <div>Blank Page</div>;
    }
  };

  // Return Auth screen
  if (screen === "role-select") {
    return <RoleSelect onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: "flex", fontFamily: "Inter, sans-serif", minHeight: "100vh", background: "#F9FAFB" }}>

      {/* SIDEBAR NAVIGATION with custom authorization guards */}
      <aside style={{ width: 240, background: "#F9FAFB", borderRight: "1px solid #E4E7EC", height: "100vh", position: "fixed", left: 0, top: 0, display: "flex", flexDirection: "column", zIndex: 50 }}>
        
        {/* LOGO */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #E4E7EC", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: currentRoleConfig.color, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>VendorIQ</div>
            <div style={{ fontSize: 9, color: "#667085", letterSpacing: "1px" }}>ENTERPRISE</div>
          </div>
        </div>

        {/* SIDEBAR LINKS */}
        <nav style={{ flex: 1, padding: "14px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const hasPerm = currentRoleConfig.tabs.includes(item.id);
            if (!hasPerm) return null;

            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 18px",
                  background: isSel ? `${currentRoleConfig.color}10` : "transparent",
                  border: "none",
                  borderLeft: `3px solid ${isSel ? currentRoleConfig.color : "transparent"}`,
                  color: isSel ? currentRoleConfig.color : "#374151",
                  fontSize: 13, fontWeight: isSel ? 600 : 400,
                  cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif"
                }}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* LOGOUT PROFILE BANNER */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #E4E7EC", display: "flex", flexDirection: "column", gap: 12, background: "#F8FAFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: currentRoleConfig.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{userName.slice(0,2).toUpperCase()}</span>
            </div>
            <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 750, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.2" }}>{userName}</div>
              <div style={{ fontSize: 10, color: "#667085", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1" }}>{activeRole}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "#FFEBEE", border: "1px solid #C6282820", padding: "8px 12px", borderRadius: 8, color: "#C62828", fontSize: 12, fontWeight: 600, cursor: "pointer", justifyContent: "center", transition: "background-color 0.15s" }}>
            <LogOut size={13} /> Sign Out (Token Clear)
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* HEADER BAR */}
        <header style={{ height: 62, background: "#fff", borderBottom: "1px solid #E4E7EC", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 40 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111827", textTransform: "capitalize" }}>{activeTab.replace("-", " ")} Workbench</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 12, color: "#667085" }}>2026 Procurement Cycle</span>
            {liveTime && (
              <>
                <div style={{ width: 1, height: 16, background: "#E4E7EC" }} />
                <span style={{ fontSize: 12, color: "#374151", fontWeight: 600, fontFamily: "monospace" }} id="dashboard-live-clock">{liveTime}</span>
              </>
            )}
            <div style={{ width: 1, height: 16, background: "#E4E7EC" }} />
            
            <button onClick={() => { setActiveTab("profile"); }} style={{ background: "none", border: "1px solid #E4E7EC", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Edit Profile Details">
              <User size={15} color="#667085" />
            </button>
            <button onClick={() => { setActiveTab("notifications"); }} style={{ background: "none", border: "1px solid #E4E7EC", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }} title="Notifications">
              <Bell size={15} color="#667085" />
              <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, background: "#C62828", borderRadius: "50%", border: "2px solid #fff" }} />
            </button>
          </div>
        </header>

        {/* INNER RENDER */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {renderNavTab()}
        </div>
      </main>

    </div>
  );
}
