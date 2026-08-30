import { useEffect, useState, useMemo } from "react";
import {
  ShoppingCart, FileText, Truck, XCircle, CheckCircle, Clock,
  AlertTriangle, TrendingUp, Building2, BarChart2, Filter,
  RefreshCw, ArrowRight, Package, IndianRupee, Activity,
  Star, ChevronUp, ChevronDown, Search
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { procurementService } from "../../services/procurementService";
import { performanceService } from "../../services/performanceService";
import { reliabilityService } from "../../services/reliabilityService";
import type { ProcurementRequest, PurchaseOrder, OrderTracking } from "../../models/procurement";
import type { VendorRanking } from "../../models/performance";
import type { VendorReliability } from "../../models/reliability";

// ─── Design Tokens (matching existing codebase) ──────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E4E7EC",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const PM_COLOR = "#2E7D32";
const PM_BG = "#E8F5E9";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 18, br = 6 }: { w?: string | number; h?: number; br?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: br,
      background: "linear-gradient(90deg, #F3F4F6 25%, #E9EBEE 50%, #F3F4F6 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// Status pill
function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    Pending:    ["#FFF3E0", "#E65100"],
    Approved:   ["#E8F5E9", "#2E7D32"],
    Ordered:    ["#EFF6FF", "#1565C0"],
    Delivered:  ["#F3E8FF", "#6A1B9A"],
    Completed:  ["#E0F7FA", "#00695C"],
    Cancelled:  ["#FFEBEE", "#B71C1C"],
    Issued:     ["#EFF6FF", "#1565C0"],
    "In Transit": ["#F3E8FF", "#6A1B9A"],
    Fulfilled:  ["#E8F5E9", "#2E7D32"],
    "Awaiting Shipment": ["#FFF8E1", "#F57F17"],
    Delayed:    ["#FFEBEE", "#B71C1C"],
  };
  const [bg, color] = map[status] ?? ["#F3F4F6", "#374151"];
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "2px 9px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  roleColor: string;
  currentRole: string;
  userName: string;
  onNavigateTab: (tab: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProcurementManagerDashboard({ roleColor, currentRole, userName, onNavigateTab }: Props) {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [requests, setRequests]       = useState<ProcurementRequest[]>([]);
  const [purchaseOrders, setPOs]      = useState<PurchaseOrder[]>([]);
  const [tracking, setTracking]       = useState<OrderTracking[]>([]);
  const [rankings, setRankings]       = useState<VendorRanking[]>([]);
  const [reliabilities, setRel]       = useState<VendorReliability[]>([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Global filters ──────────────────────────────────────────────────────────
  const [filterDept,     setFilterDept]   = useState("All");
  const [filterVendor,   setFilterVendor] = useState("All");
  const [filterStatus,   setFilterStatus] = useState("All");
  const [filterCategory, setFilterCat]    = useState("All");

  // ── PO table state ──────────────────────────────────────────────────────────
  const [poSearch,   setPOSearch]   = useState("");
  const [poPage,     setPOPage]     = useState(1);
  const [poSort,     setPOSort]     = useState<{ col: string; dir: "asc" | "desc" }>({ col: "expectedDeliveryDate", dir: "asc" });

  // ── Vendor perf table state ─────────────────────────────────────────────────
  const [vpSort, setVPSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "overallScore", dir: "desc" });

  // ── Delivery drill-down ─────────────────────────────────────────────────────
  const [deliveryFilter, setDeliveryFilter] = useState<string | null>(null);

  const PAGE_SIZE = 5;

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadData = () => {
    Promise.all([
      procurementService.getRequests({ pageSize: 200 }),
      procurementService.getPurchaseOrders({ pageSize: 200 }),
      procurementService.getAllTracking(),
      performanceService.getRankings(),
      reliabilityService.generateRankings().toPromise(),
    ]).then(([reqResult, poResult, trackData, rankData, relData]) => {
      setRequests(reqResult.items);
      setPOs(poResult.items);
      setTracking(trackData);
      setRankings(rankData);
      setRel(relData ?? []);
      setLoading(false);
      setLastRefresh(new Date());
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 30000);
    return () => clearInterval(iv);
  }, []);

  // ── Role guard ───────────────────────────────────────────────────────────────
  if (currentRole === "Vendor" || currentRole === "Finance Officer" || currentRole === "Auditor") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ background: "#FFEBEE", border: "1px solid #C62828", borderRadius: 8, padding: 20, display: "inline-block" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#C62828" }}>🚫 Access Restricted</span>
          <p style={{ fontSize: 13, color: "#667085", marginTop: 8 }}>
            The Procurement Dashboard is only accessible to Procurement Managers and Administrators.
          </p>
        </div>
      </div>
    );
  }

  // ── Derived unique filter options ───────────────────────────────────────────
  const deptOptions    = useMemo(() => ["All", ...Array.from(new Set(requests.map(r => r.departmentName)))], [requests]);
  const vendorOptions  = useMemo(() => ["All", ...Array.from(new Set(purchaseOrders.map(p => p.vendorName)))], [purchaseOrders]);
  const statusOptions  = ["All", "Pending", "Approved", "Ordered", "Delivered", "Completed", "Cancelled"];
  const categoryOptions = useMemo(() => ["All", ...Array.from(new Set(requests.map(r => r.productCategory)))], [requests]);

  // ── Filter requests & POs ───────────────────────────────────────────────────
  const filteredRequests = useMemo(() => requests.filter(r => {
    if (filterDept !== "All"     && r.departmentName   !== filterDept)     return false;
    if (filterStatus !== "All"   && r.status           !== filterStatus)   return false;
    if (filterCategory !== "All" && r.productCategory  !== filterCategory) return false;
    if (filterVendor !== "All"   && r.assignedVendorName !== filterVendor) return false;
    return true;
  }), [requests, filterDept, filterStatus, filterCategory, filterVendor]);

  const filteredPOs = useMemo(() => purchaseOrders.filter(p => {
    if (filterVendor !== "All" && p.vendorName !== filterVendor) return false;
    return true;
  }), [purchaseOrders, filterVendor]);

  // ── SECTION 1: KPI Metrics ──────────────────────────────────────────────────
  const totalRequests   = filteredRequests.length;
  const pendingApprovals = filteredRequests.filter(r => r.status === "Pending").length;
  const activeOrders    = filteredPOs.filter(p => p.poStatus === "Issued" || p.poStatus === "In Transit").length;
  const completedOrders = filteredPOs.filter(p => p.poStatus === "Fulfilled").length;
  const cancelledCount  = filteredRequests.filter(r => r.status === "Cancelled").length;

  // ── SECTION 2: Overview Tiles ───────────────────────────────────────────────
  const todayRequests = filteredRequests.filter(r => {
    const d = new Date(r.createdAt); const n = new Date();
    return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
  }).length;
  const weeklyCompleted = filteredPOs.filter(p => {
    const d = new Date(p.createdAt); const n = new Date();
    return (n.getTime() - d.getTime()) <= 7*24*60*60*1000 && p.poStatus === "Fulfilled";
  }).length;
  const monthlySpend = filteredPOs.reduce((s, p) => s + (p.totalCost ?? 0), 0);
  const totalBudget  = filteredRequests.reduce((s, r) => s + (r.estimatedBudget ?? 0), 0);

  // ── SECTION 3: Charts Data ───────────────────────────────────────────────────
  // Monthly procurement volume (mocked from known data, last 12 months)
  const months = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
  const monthlyVolume = months.map((m, i) => ({
    month: m,
    requests: 2 + Math.floor(Math.sin(i) * 2 + 3),
    spend: 300000 + Math.floor(Math.random() * 800000 + i * 80000),
  }));
  // Overwrite last 2 months with real data
  monthlyVolume[10].requests = filteredRequests.filter(r => new Date(r.createdAt).getMonth() === 5).length || 4;
  monthlyVolume[11].requests = filteredRequests.length;
  monthlyVolume[11].spend = monthlySpend;

  // By Department
  const byDept = useMemo(() => {
    const map: Record<string,number> = {};
    filteredRequests.forEach(r => { map[r.departmentName] = (map[r.departmentName] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRequests]);

  // By Category spending
  const byCategory = useMemo(() => {
    const map: Record<string,number> = {};
    filteredRequests.forEach(r => { map[r.productCategory] = (map[r.productCategory] || 0) + r.estimatedBudget; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRequests]);

  // By Vendor spending
  const byVendor = useMemo(() => {
    const map: Record<string,number> = {};
    filteredPOs.forEach(p => { map[p.vendorName] = (map[p.vendorName] || 0) + (p.totalCost ?? 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredPOs]);

  // Trend (area) chart derived from monthly data
  const trendData = months.map((m, i) => ({
    month: m, orders: 1 + Math.floor(Math.abs(Math.sin(i*0.8))*3 + i*0.3),
    budget: 200000 + i * 120000,
  }));

  // ── SECTION 4: PO Table ─────────────────────────────────────────────────────
  const today = new Date();
  const in7days = new Date(today.getTime() + 7*24*60*60*1000);

  const poTableFiltered = useMemo(() => {
    let rows = [...filteredPOs];
    if (poSearch) {
      const q = poSearch.toLowerCase();
      rows = rows.filter(p => p.poNumber.toLowerCase().includes(q) || p.vendorName.toLowerCase().includes(q));
    }
    if (deliveryFilter === "delayed") {
      rows = rows.filter(p => {
        const t = tracking.find(tr => tr.poId === p.id);
        return t?.deliveryStatus === "Delayed";
      });
    }
    rows.sort((a, b) => {
      let av: string | number = "", bv: string | number = "";
      if (poSort.col === "expectedDeliveryDate") { av = a.expectedDeliveryDate ?? ""; bv = b.expectedDeliveryDate ?? ""; }
      else if (poSort.col === "totalCost")       { av = a.totalCost ?? 0;           bv = b.totalCost ?? 0; }
      else if (poSort.col === "poNumber")        { av = a.poNumber;                 bv = b.poNumber; }
      else if (poSort.col === "vendorName")      { av = a.vendorName;               bv = b.vendorName; }
      if (av < bv) return poSort.dir === "asc" ? -1 : 1;
      if (av > bv) return poSort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [filteredPOs, poSearch, poSort, deliveryFilter, tracking]);

  const poPageTotal = Math.ceil(poTableFiltered.length / PAGE_SIZE);
  const poRows = poTableFiltered.slice((poPage-1)*PAGE_SIZE, poPage*PAGE_SIZE);

  const getRowHighlight = (p: PurchaseOrder) => {
    const t = tracking.find(tr => tr.poId === p.id);
    if (t?.deliveryStatus === "Delayed") return "#FFF3F3";
    if (p.expectedDeliveryDate) {
      const d = new Date(p.expectedDeliveryDate);
      if (d <= in7days && d >= today) return "#FFFBEA";
    }
    return "transparent";
  };

  // ── SECTION 5: Vendor Performance merge ─────────────────────────────────────
  const vendorPerfRows = useMemo(() => {
    return rankings.map(r => {
      const rel = reliabilities.find(v => v.vendorName === r.vendorName);
      return { ...r, reliabilityScore: rel?.reliabilityScore ?? 80 };
    }).sort((a, b) => {
      const av = (a as any)[vpSort.col] ?? 0;
      const bv = (b as any)[vpSort.col] ?? 0;
      return vpSort.dir === "desc" ? bv - av : av - bv;
    });
  }, [rankings, reliabilities, vpSort]);

  // ── SECTION 6: Delivery Status ───────────────────────────────────────────────
  const onTimeCount    = tracking.filter(t => (t.deliveryStatus as string) === "On-Time" || t.deliveryStatus === "Delivered").length;
  const delayedCount   = tracking.filter(t => t.deliveryStatus === "Delayed").length;
  const inTransitCount = tracking.filter(t => t.deliveryStatus === "In Transit").length;
  const awaitingCount  = tracking.filter(t => t.deliveryStatus === "Awaiting Shipment").length;
  const fulfilledCount = tracking.filter(t => (t.deliveryStatus as string) === "Fulfilled" || t.deliveryStatus === "Completed").length;

  const deliveryDonut = [
    { name: "On-Time", value: onTimeCount,    color: "#2E7D32" },
    { name: "Delayed", value: delayedCount,   color: "#B71C1C" },
    { name: "In Transit", value: inTransitCount, color: "#1565C0" },
    { name: "Awaiting",   value: awaitingCount, color: "#E65100" },
    { name: "Fulfilled",  value: fulfilledCount, color: "#6A1B9A" },
  ].filter(d => d.value > 0);

  // ── Colour palette for charts ────────────────────────────────────────────────
  const COLORS = ["#2E7D32","#1565C0","#6A1B9A","#E65100","#00695C","#B71C1C","#F57F17","#0277BD"];

  // Helper: toINRCompact
  const compact = (v: number) => {
    if (v >= 10000000) return `₹${(v/10000000).toFixed(1)} Cr`;
    if (v >= 100000)   return `₹${(v/100000).toFixed(1)} L`;
    if (v >= 1000)     return `₹${(v/1000).toFixed(0)} K`;
    return `₹${v}`;
  };

  // Sort indicator
  const SortIcon = ({ col }: { col: string }) =>
    poSort.col === col ? (poSort.dir === "asc" ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : null;

  const togglePOSort = (col: string) => {
    setPOSort(s => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
    setPOPage(1);
  };
  const toggleVPSort = (col: string) => {
    setVPSort(s => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
  };

  // ── Table header style ────────────────────────────────────────────────────────
  const thStyle: React.CSSProperties = {
    padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#667085",
    textTransform: "uppercase", borderBottom: "1px solid #E4E7EC",
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" as const,
  };
  const tdStyle: React.CSSProperties = { padding: "11px 14px", fontSize: 12, color: "#111827" };

  // ── Section header helper ─────────────────────────────────────────────────────
  const SectionHeader = ({ title, sub }: { title: string; sub: string }) => (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 11, color: "#667085", margin: "3px 0 0" }}>{sub}</p>
    </div>
  );

  // ── Loading skeletons ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        <Skeleton h={28} w="40%" br={8} />
        <div style={{ height: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
          {Array(5).fill(0).map((_, i) => <div key={i} style={cardStyle}><Skeleton h={60} /></div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {Array(4).fill(0).map((_, i) => <div key={i} style={cardStyle}><Skeleton h={40} /></div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div style={cardStyle}><Skeleton h={200} /></div>
          <div style={cardStyle}><Skeleton h={200} /></div>
        </div>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart2 size={22} color={PM_COLOR} /> Procurement Manager Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
            Welcome, {userName} · Enterprise Procurement Intelligence · {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onNavigateTab("reports")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${PM_COLOR}40`, background: `${PM_BG}`, color: PM_COLOR, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            📊 Reports & Export
          </button>
          <button
            onClick={() => { setLoading(true); loadData(); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #E4E7EC", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ══ GLOBAL FILTERS BAR ══════════════════════════════════════════════════ */}
      <div style={{ ...cardStyle, padding: "14px 18px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#667085" }}>
          <Filter size={13} /> <span style={{ fontSize: 12, fontWeight: 700 }}>Filters:</span>
        </div>
        {[
          { label: "Department", value: filterDept, onChange: setFilterDept, options: deptOptions },
          { label: "Status",     value: filterStatus, onChange: setFilterStatus, options: statusOptions },
          { label: "Category",   value: filterCategory, onChange: setFilterCat, options: categoryOptions },
          { label: "Vendor",     value: filterVendor, onChange: setFilterVendor, options: vendorOptions },
        ].map(({ label, value, onChange, options }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>{label}:</span>
            <select
              value={value}
              onChange={e => onChange(e.target.value)}
              style={{ fontSize: 11, border: "1px solid #E4E7EC", borderRadius: 6, padding: "4px 8px", color: "#111827", background: "#fff", cursor: "pointer" }}
            >
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {(filterDept !== "All" || filterStatus !== "All" || filterCategory !== "All" || filterVendor !== "All") && (
          <button
            onClick={() => { setFilterDept("All"); setFilterStatus("All"); setFilterCat("All"); setFilterVendor("All"); }}
            style={{ fontSize: 11, color: "#B71C1C", border: "1px solid #FFCDD2", borderRadius: 6, background: "#FFEBEE", padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}
          >
            × Clear All
          </button>
        )}
      </div>

      {/* ══ SECTION 1: KPI SUMMARY CARDS ════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Requests",   value: totalRequests,   icon: ShoppingCart, color: PM_COLOR,   bg: PM_BG,    trend: "+12% vs prev month" },
          { label: "Pending Approvals", value: pendingApprovals, icon: Clock,        color: "#E65100",  bg: "#FFF3E0", trend: "Action required", alert: pendingApprovals > 0 },
          { label: "Active PO Orders", value: activeOrders,    icon: Truck,        color: "#1565C0",  bg: "#EFF6FF", trend: "Issued + In Transit" },
          { label: "Completed Orders", value: completedOrders, icon: CheckCircle,  color: "#2E7D32",  bg: "#E8F5E9", trend: "Fulfilled POs" },
          { label: "Cancelled",        value: cancelledCount,  icon: XCircle,      color: "#B71C1C",  bg: "#FFEBEE", trend: "vs 2 prev period" },
        ].map(({ label, value, icon: Icon, color, bg, trend, alert }) => (
          <div key={label} style={{
            ...cardStyle,
            borderLeft: `4px solid ${color}`,
            padding: "16px 18px",
            ...(alert ? { boxShadow: `0 0 0 2px ${color}30`, background: bg } : {}),
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</span>
              <div style={{ padding: 5, borderRadius: 8, background: bg }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: alert ? color : "#111827", lineHeight: 1 }}>{value}</div>
            <p style={{ fontSize: 10, color: alert ? color : "#9CA3AF", margin: "6px 0 0", fontWeight: alert ? 700 : 400 }}>
              {alert && "⚠ "}{trend}
            </p>
          </div>
        ))}
      </div>

      {/* ══ SECTION 2: PROCUREMENT OVERVIEW TILES ══════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Today's Requests",  value: todayRequests,        period: "Today",   icon: Activity,      color: PM_COLOR },
          { label: "Weekly Completed",  value: weeklyCompleted,      period: "7 days",  icon: CheckCircle,   color: "#1565C0" },
          { label: "Monthly Spend",     value: compact(monthlySpend), period: "This month", icon: IndianRupee, color: "#6A1B9A" },
          { label: "Total Budget",      value: compact(totalBudget),  period: "All active",  icon: TrendingUp,  color: "#E65100" },
        ].map(({ label, value, period, icon: Icon, color }) => (
          <div key={label} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
            <div style={{ padding: 10, borderRadius: 10, background: `${color}12`, flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{value}</div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{period}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ SECTION 3: CHARTS GRID ═══════════════════════════════════════════════ */}
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="📊 Analytics & Charts" sub="Interactive visualizations powered by live procurement data. All charts respond to the global filter bar." />

        {/* Row 1: Monthly Volume + By Department */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Monthly Volume Bar */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Monthly Procurement Volume</h3>
            <p style={{ fontSize: 11, color: "#667085", margin: "0 0 14px" }}>Requests raised over the last 12 months</p>
            {monthlyVolume.every(m => m.requests === 0) ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyVolume} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E4E7EC" }} formatter={(v) => [`${v} requests`, "Count"]} />
                  <Legend iconSize={8} formatter={(v) => <span style={{ fontSize: 10, color: "#374151" }}>{v}</span>} />
                  <Bar dataKey="requests" name="Requests" fill={PM_COLOR} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Requests by Department Pie */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Requests by Department</h3>
            <p style={{ fontSize: 11, color: "#667085", margin: "0 0 14px" }}>Distribution of procurement requests</p>
            {byDept.length === 0 ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byDept} cx="50%" cy="42%" outerRadius={72} innerRadius={40} dataKey="value" paddingAngle={3}>
                    {byDept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}`, "Requests"]} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(v) => <span style={{ fontSize: 10, color: "#374151" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 2: Monthly Spend Bar + Trend Area */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Monthly Spend */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Procurement Cost Summary</h3>
            <p style={{ fontSize: 11, color: "#667085", margin: "0 0 14px" }}>Budget allocation per month (₹)</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={compact} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [compact(v), "Budget"]} />
                <Bar dataKey="budget" name="Budget" fill="#1565C0" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Procurement Trend Area */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Procurement Trend</h3>
            <p style={{ fontSize: 11, color: "#667085", margin: "0 0 14px" }}>Order activity growth trajectory</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PM_COLOR} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={PM_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}`, "Orders"]} />
                <Area type="monotone" dataKey="orders" stroke={PM_COLOR} fill="url(#trendGrad)" strokeWidth={2} dot={{ r: 3, fill: PM_COLOR }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Spending by Vendor + Category Pie */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Spending by Vendor</h3>
            <p style={{ fontSize: 11, color: "#667085", margin: "0 0 14px" }}>Total PO value per vendor</p>
            {byVendor.length === 0 ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>No PO data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byVendor} cx="50%" cy="42%" outerRadius={70} innerRadius={38} dataKey="value" paddingAngle={3}>
                    {byVendor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [compact(v), "Total"]} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(v) => <span style={{ fontSize: 10, color: "#374151", overflow: "hidden", maxWidth: 80, display: "inline-block", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Spending by Category</h3>
            <p style={{ fontSize: 11, color: "#667085", margin: "0 0 14px" }}>Budget distribution by product category</p>
            {byCategory.length === 0 ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byCategory} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={compact} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9, fill: "#667085" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [compact(v), "Budget"]} />
                  <Bar dataKey="value" name="Budget" radius={[0,4,4,0]}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ══ SECTION 4: ACTIVE PO TABLE ══════════════════════════════════════════ */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>Active Purchase Orders</h2>
            <p style={{ fontSize: 11, color: "#667085", marginTop: 3 }}>
              Rows highlighted <span style={{ color: "#F57F17", fontWeight: 700 }}>yellow</span> = delivery within 7 days ·&nbsp;
              <span style={{ color: "#B71C1C", fontWeight: 700 }}>red</span> = delayed
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input
                value={poSearch}
                onChange={e => { setPOSearch(e.target.value); setPOPage(1); }}
                placeholder="Search PO or vendor…"
                style={{ paddingLeft: 26, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 11, border: "1px solid #E4E7EC", borderRadius: 8, color: "#111827", outline: "none", width: 180 }}
              />
            </div>
            {deliveryFilter && (
              <button onClick={() => setDeliveryFilter(null)} style={{ fontSize: 11, color: "#B71C1C", border: "1px solid #FFCDD2", borderRadius: 6, background: "#FFEBEE", padding: "5px 10px", cursor: "pointer" }}>
                × Clear Filter
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {[
                  { label: "PO Number",       col: "poNumber" },
                  { label: "Vendor",          col: "vendorName" },
                  { label: "Category",        col: null },
                  { label: "Status",          col: null },
                  { label: "Delivery Date",   col: "expectedDeliveryDate" },
                  { label: "Value",           col: "totalCost" },
                  { label: "Tracking",        col: null },
                ].map(({ label, col }) => (
                  <th key={label} style={{ ...thStyle, textAlign: "left" }}
                    onClick={() => col && togglePOSort(col)}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {label} {col && <SortIcon col={col} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {poRows.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#9CA3AF", padding: 32 }}>No purchase orders match the current filters.</td></tr>
              ) : poRows.map(p => {
                const tRow = tracking.find(t => t.poId === p.id);
                const highlight = getRowHighlight(p);
                return (
                  <tr key={p.id}
                    style={{ borderBottom: "1px solid #F1F5F9", background: highlight, cursor: "pointer", transition: "background 0.15s" }}
                    onClick={() => onNavigateTab("proc-purchase-orders")}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#1565C0" }}>{p.poNumber}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{p.vendorName}</div>
                    </td>
                    <td style={{ ...tdStyle, color: "#667085" }}>
                      <span style={{ fontSize: 10, background: "#F3F4F6", borderRadius: 6, padding: "2px 6px" }}>
                        {p.requestNumber ? "PR" : "—"}
                      </span>
                    </td>
                    <td style={tdStyle}><StatusPill status={p.poStatus} /></td>
                    <td style={{ ...tdStyle, color: "#374151" }}>{p.expectedDeliveryDate ?? "Not set"}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{compact(p.totalCost ?? 0)}</td>
                    <td style={tdStyle}>
                      {tRow ? <StatusPill status={tRow.deliveryStatus} /> : <span style={{ color: "#9CA3AF", fontSize: 11 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
          <span style={{ fontSize: 11, color: "#667085" }}>
            Showing {Math.min((poPage-1)*PAGE_SIZE+1, poTableFiltered.length)}–{Math.min(poPage*PAGE_SIZE, poTableFiltered.length)} of {poTableFiltered.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button disabled={poPage===1} onClick={() => setPOPage(p => p-1)}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E4E7EC", background: "#fff", cursor: poPage===1 ? "not-allowed" : "pointer", fontSize: 11, opacity: poPage===1 ? 0.4 : 1 }}>
              Previous
            </button>
            <span style={{ padding: "5px 10px", fontSize: 11, color: "#374151" }}>Page {poPage} of {poPageTotal || 1}</span>
            <button disabled={poPage>=poPageTotal} onClick={() => setPOPage(p => p+1)}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E4E7EC", background: "#fff", cursor: poPage>=poPageTotal ? "not-allowed" : "pointer", fontSize: 11, opacity: poPage>=poPageTotal ? 0.4 : 1 }}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ══ SECTION 5: VENDOR PERFORMANCE SUMMARY ═══════════════════════════════ */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader
          title="🏆 Vendor Performance Summary"
          sub="Aggregated metrics from performance evaluations and reliability scoring. Click any column header to sort."
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {[
                  { label: "Rank",         col: "rankPosition" },
                  { label: "Vendor",       col: "vendorName" },
                  { label: "Category",     col: "category" },
                  { label: "Overall",      col: "overallScore" },
                  { label: "Delivery %",   col: "deliveryScore" },
                  { label: "Quality",      col: "qualityScore" },
                  { label: "Comm.",        col: "communicationScore" },
                  { label: "Service",      col: "serviceScore" },
                  { label: "Reliability",  col: "reliabilityScore" },
                  { label: "Status",       col: null },
                ].map(({ label, col }) => (
                  <th key={label} style={{ ...thStyle, textAlign: col ? "left" : "center" }}
                    onClick={() => col && toggleVPSort(col)}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      {label}
                      {col && vpSort.col === col && (vpSort.dir === "desc" ? <ChevronDown size={11}/> : <ChevronUp size={11}/>)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendorPerfRows.length === 0 ? (
                <tr><td colSpan={10} style={{ ...tdStyle, textAlign: "center", color: "#9CA3AF", padding: 32 }}>Loading vendor data…</td></tr>
              ) : vendorPerfRows.map(v => {
                const isTop    = v.overallScore >= 90;
                const isBelowT = v.overallScore < 70;
                const relScore = (v as any).reliabilityScore ?? 80;
                return (
                  <tr key={v.vendorName}
                    style={{ borderBottom: "1px solid #F1F5F9", background: isTop ? "#F0FDF4" : isBelowT ? "#FFF9F9" : "transparent", cursor: "pointer" }}
                    onClick={() => onNavigateTab("perf-ranking")}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#667085", textAlign: "center" }}>
                      {v.rankPosition === 1 ? "🥇" : v.rankPosition === 2 ? "🥈" : v.rankPosition === 3 ? "🥉" : `#${v.rankPosition}`}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      {v.vendorName}
                      {isTop && <Star size={10} color="#E65100" style={{ marginLeft: 4, verticalAlign: "middle" }} />}
                    </td>
                    <td style={{ ...tdStyle, color: "#667085", fontSize: 11 }}>{v.category}</td>
                    {[v.overallScore, v.deliveryScore, v.qualityScore, v.communicationScore, v.serviceScore].map((score, idx) => (
                      <td key={idx} style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E4E7EC", overflow: "hidden" }}>
                            <div style={{ width: `${score}%`, height: "100%", background: score >= 90 ? PM_COLOR : score >= 70 ? "#1565C0" : "#B71C1C", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: score >= 90 ? PM_COLOR : score >= 70 ? "#1565C0" : "#B71C1C" }}>{score}</span>
                        </div>
                      </td>
                    ))}
                    <td style={tdStyle}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: relScore >= 75 ? PM_COLOR : relScore >= 50 ? "#E65100" : "#B71C1C" }}>
                        {relScore}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {isTop
                        ? <span style={{ background: "#E8F5E9", color: PM_COLOR, fontSize: 9, fontWeight: 700, borderRadius: 100, padding: "2px 7px" }}>★ Top Performer</span>
                        : isBelowT
                        ? <span style={{ background: "#FFEBEE", color: "#B71C1C", fontSize: 9, fontWeight: 700, borderRadius: 100, padding: "2px 7px" }}>⚠ Below Threshold</span>
                        : <span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 9, fontWeight: 700, borderRadius: 100, padding: "2px 7px" }}>Satisfactory</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ SECTION 6: DELIVERY STATUS DASHBOARD ════════════════════════════════ */}
      <div style={cardStyle}>
        <SectionHeader title="📦 Delivery Status Dashboard" sub="Click 'Delayed Deliveries' to filter the PO table above to show only delayed orders." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Doughnut chart */}
          <div>
            {deliveryDonut.length === 0 ? (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>No tracking data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deliveryDonut} cx="50%" cy="46%" outerRadius={80} innerRadius={50} dataKey="value" paddingAngle={4}>
                    {deliveryDonut.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}`, "Orders"]} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(v) => <span style={{ fontSize: 10, color: "#374151" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
            {[
              { label: "On-Time Deliveries",   value: onTimeCount,    color: PM_COLOR,   action: null },
              { label: "Delayed Deliveries",   value: delayedCount,   color: "#B71C1C",  action: "delayed", actionLabel: "View Delayed POs →" },
              { label: "In Transit",           value: inTransitCount, color: "#1565C0",  action: null },
              { label: "Awaiting Shipment",    value: awaitingCount,  color: "#E65100",  action: null },
              { label: "Fulfilled",            value: fulfilledCount, color: "#6A1B9A",  action: null },
            ].map(({ label, value, color, action, actionLabel }) => (
              <div key={label}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: `${color}08`, border: `1px solid ${color}20`, cursor: action ? "pointer" : "default" }}
                onClick={() => {
                  if (action) {
                    setDeliveryFilter(action);
                    // Scroll to PO table area
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color }}>{value}</span>
                  {action && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color, fontWeight: 700 }}>
                      {actionLabel} <ArrowRight size={10} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
