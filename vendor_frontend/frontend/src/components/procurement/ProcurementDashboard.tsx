import { useEffect, useState } from "react";
import { 
  ShoppingCart, FileText, Truck, Receipt, Clock, 
  CheckCircle, AlertTriangle, XCircle, ArrowRight, Activity 
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { procurementService } from "../../services/procurementService";
import type { ProcurementRequest, PurchaseOrder, StatusHistoryEntry } from "../../models/procurement";

const cardStyle = {
  background: "#fff",
  border: "1px solid #E4E7EC",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
} as React.CSSProperties;

const navCardStyle = (hovered: boolean, color: string) => ({
  background: "#fff",
  border: hovered ? `1px solid ${color}` : "1px solid #E4E7EC",
  borderRadius: 12,
  padding: 20,
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  boxShadow: hovered ? `0 4px 12px ${color}15` : "0 1px 3px rgba(0,0,0,0.02)",
  transform: hovered ? "translateY(-2px)" : "none",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
} as React.CSSProperties);

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Some time ago";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

interface Props {
  roleColor: string;
  setActiveTab: (tab: string) => void;
}

export function ProcurementDashboard({ roleColor, setActiveTab }: Props) {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [activities, setActivities] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const loadData = () => {
    Promise.all([
      procurementService.getRequests({ pageSize: 120 }),
      procurementService.getPurchaseOrders({ pageSize: 120 }),
      procurementService.getAllStatusHistory()
    ]).then(([reqResult, poResult, history]) => {
      setRequests(reqResult.items);
      setPOs(poResult.items);
      setActivities(history);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    // Refresh periodically for reactive changes
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#667085", fontSize: 14 }}>
        Loading procurement dashboard overview…
      </div>
    );
  }

  // Sourcing metrics
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const approvedCount = requests.filter(r => r.status === "Approved").length;
  const poCreatedCount = pos.length;
  const deliveredCount = requests.filter(r => r.status === "Delivered").length;
  const completedCount = requests.filter(r => r.status === "Completed").length;
  const cancelledCount = requests.filter(r => r.status === "Cancelled").length;

  const kpis = [
    { label: "Total Requests", value: totalRequests, icon: ShoppingCart, bg: `${roleColor}10`, color: roleColor },
    { label: "Pending Requests", value: pendingCount, icon: Clock, bg: "#FFF3E0", color: "#E65100" },
    { label: "Approved Requests", value: approvedCount, icon: CheckCircle, bg: "#E8F5E9", color: "#2E7D32" },
    { label: "POs Generated", value: poCreatedCount, icon: FileText, bg: "#EFF6FF", color: "#1565C0" },
    { label: "Delivered Orders", value: deliveredCount, icon: Truck, bg: "#F3E8FF", color: "#6A1B9A" },
    { label: "Completed Cycles", value: completedCount, icon: CheckCircle, bg: "#E8F5E9", color: "#1B5E20" },
    { label: "Cancelled", value: cancelledCount, icon: XCircle, bg: "#FFEBEE", color: "#B71C1C" },
  ];

  // Recharts Pie Chart Data
  const chartData = [
    { name: "Pending", value: pendingCount, color: "#E65100" },
    { name: "Approved", value: approvedCount, color: "#2E7D32" },
    { name: "Ordered", value: requests.filter(r => r.status === "Ordered").length, color: "#1565C0" },
    { name: "Delivered", value: deliveredCount, color: "#6A1B9A" },
    { name: "Completed", value: completedCount, color: "#1B5E20" },
    { name: "Cancelled", value: cancelledCount, color: "#B71C1C" },
  ].filter(item => item.value > 0);

  // Quick navigation data
  const navs = [
    { id: "proc-requests", label: "Procurement Requests", desc: "View and approve purchase requisitions", color: roleColor, icon: ShoppingCart },
    { id: "proc-purchase-orders", label: "Purchase Orders", desc: "Generate and sign off contracts", color: "#1565C0", icon: FileText },
    { id: "proc-tracking", label: "Order Tracking", desc: "Monitor shipment delivery & delays", color: "#6A1B9A", icon: Truck },
    { id: "proc-invoices", label: "Invoice Management", desc: "Verify billing & process transactions", color: "#E65100", icon: Receipt },
  ];

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin:0 }}>Procurement Control Center</h1>
        <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
          Live procurement lifecycle summary metrics and workflow navigation controls.
        </p>
      </div>

      {/* Seven KPI Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {kpis.map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} style={{ ...cardStyle, padding: "16px 18px", borderLeft: `4px solid ${color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.2px" }}>{label}</span>
              <div style={{ padding: 4, borderRadius: 6, background: bg, display: "flex", alignItems: "center" }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Main dashboard columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 24 }}>
        
        {/* Status Distribution (Pie Chart) */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin: 0 }}>Requests by Status</h2>
            <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>Distribution of requisitions across the supply chain</p>
          </div>
          <div style={{ height: 260, position: "relative" }}>
            {chartData.length === 0 ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>
                No active requests found
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 12 }} 
                    formatter={(value) => [`${value} Requests`, 'Count']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Timeline Activities list */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin: 0 }}>Recent Procurement Activities</h2>
            <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>Audit log timeline of status triggers</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 270, overflowY: "auto", paddingRight: 6 }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF", fontSize: 13 }}>
                No activities logged yet.
              </div>
            ) : (
              activities.slice(0, 10).map((act, index) => {
                const color = act.newStatus === "Approved" ? "#2E7D32" : act.newStatus === "Cancelled" || act.newStatus === "Rejected" ? "#B71C1C" : act.newStatus === "Pending" ? "#E65100" : "#1565C0";
                return (
                  <div key={act.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                    {/* Timeline line */}
                    {index < activities.slice(0, 10).length - 1 && (
                      <div style={{ position: "absolute", left: 13, top: 22, bottom: -14, width: 2, background: "#E4E7EC" }} />
                    )}
                    {/* Activity indicator */}
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, border: "2px solid #fff", flexShrink: 0 }}>
                      <Activity size={12} color={color} />
                    </div>
                    {/* Details content */}
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
                          Request status to <span style={{ color }}>{act.newStatus}</span>
                        </span>
                        <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 550 }}>{formatRelativeTime(act.changedAt)}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>
                        Action by <b>{act.changedByName || "System"}</b> {act.remarks ? `· "${act.remarks}"` : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 14 }}>Quick Navigation Controls</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {navs.map((n) => {
            const isHovered = hoveredNav === n.id;
            const Icon = n.icon;
            return (
              <div 
                key={n.id}
                style={navCardStyle(isHovered, n.color)}
                onMouseEnter={() => setHoveredNav(n.id)}
                onMouseLeave={() => setHoveredNav(null)}
                onClick={() => setActiveTab(n.id)}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ padding: 10, borderRadius: 10, background: `${n.color}12`, color: n.color }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 750, color: "#111827" }}>{n.label}</div>
                    <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{n.desc}</div>
                  </div>
                </div>
                <ArrowRight size={14} color="#9CA3AF" style={{ transform: isHovered ? "translateX(3px)" : "none", transition: "transform 0.15s" }} />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
