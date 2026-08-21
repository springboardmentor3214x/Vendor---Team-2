import React, { useState, useEffect, useMemo } from "react";
import {
  Building2, Search, Lock, TrendingUp, ShoppingCart, Truck,
  Award, MessageSquare, Star, AlertTriangle, FileText, CheckCircle
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { performanceService, formatDurationHours } from "../../services/performanceService";
import { INITIAL_ORDERS, toINR } from "../../data";
import type {
  DeliveryPerformance,
  QualityEvaluation,
  CommunicationLog,
  ServiceRating,
  VendorPerformanceMetrics
} from "../../models/performance";

interface PerformanceHistoryViewProps {
  roleColor: string;
  currentRole?: string;
  userVendorName?: string;
  initialSelectedVendor?: string;
}

export function PerformanceHistoryView({
  roleColor,
  currentRole,
  userVendorName,
  initialSelectedVendor
}: PerformanceHistoryViewProps) {
  const [vendorsList, setVendorsList] = useState<{ name: string; category: string }[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("TechCorp Solutions Pvt Ltd");
  const [vendorSearch, setVendorSearch] = useState("");

  // Data states for selected vendor
  const [deliveries, setDeliveries] = useState<DeliveryPerformance[]>([]);
  const [qualityEvals, setQualityEvals] = useState<QualityEvaluation[]>([]);
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([]);
  const [servRatings, setServRatings] = useState<ServiceRating[]>([]);
  const [metrics, setMetrics] = useState<VendorPerformanceMetrics | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; overallScore: number }[]>([]);

  // Active Tab for details (6 tabs)
  const [activeTabGroup, setActiveTabGroup] = useState<
    "orders" | "deliveries" | "quality" | "communication" | "service" | "issues"
  >("orders");

  const isVendorRole = currentRole === "Vendor";

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    const list = await performanceService.getVendors();
    setVendorsList(list);

    // Initial vendor selection check
    if (isVendorRole && userVendorName) {
      setSelectedVendor(userVendorName);
    } else if (initialSelectedVendor && list.some(v => v.name === initialSelectedVendor)) {
      setSelectedVendor(initialSelectedVendor);
    } else if (list.length > 0) {
      setSelectedVendor(list[0].name);
    }
  };

  useEffect(() => {
    if (selectedVendor) {
      loadVendorData(selectedVendor);
    }
  }, [selectedVendor]);

  const loadVendorData = async (vName: string) => {
    const [dList, qList, cList, sList, mList, trendData] = await Promise.all([
      performanceService.getDeliveries(vName),
      performanceService.getQualityEvaluations(vName),
      performanceService.getCommunicationLogs(vName),
      performanceService.getServiceRatings(vName),
      performanceService.getMetrics(vName),
      performanceService.getMonthlyTrends(vName)
    ]);

    setDeliveries(dList);
    setQualityEvals(qList);
    setCommLogs(cList);
    setServRatings(sList);
    setMetrics(mList.length > 0 ? mList[0] : null);
    setMonthlyTrend(trendData);
  };

  // Vendor POs from INITIAL_ORDERS
  const vendorOrders = useMemo(() => {
    return INITIAL_ORDERS.filter(o => o.vendorName === selectedVendor || (selectedVendor.includes("TechCorp") && o.vendorName.includes("TechCorp")));
  }, [selectedVendor]);

  // Aggregated Issues tab calculation
  const vendorIssues = useMemo(() => {
    const issuesList: {
      id: string;
      type: "Delivery Delay" | "Quality Defect" | "SLA Breach";
      poNumber: string;
      date: string;
      description: string;
      severity: "High" | "Medium" | "Low";
    }[] = [];

    // 1. Delivery delays
    deliveries.forEach(d => {
      if (d.deliveryStatus === "Delayed" || (d.delayDays && d.delayDays > 0)) {
        issuesList.push({
          id: `DEL-ISSUE-${d.id}`,
          type: "Delivery Delay",
          poNumber: d.poNumber,
          date: d.actualDeliveryDate || d.expectedDeliveryDate,
          description: `Delivery delayed by ${d.delayDays || 0} days. ${d.remarks || ""}`,
          severity: (d.delayDays || 0) >= 3 ? "High" : "Medium"
        });
      }
    });

    // 2. Quality defects
    qualityEvals.forEach(q => {
      if (q.productDefects && q.productDefects !== "None") {
        issuesList.push({
          id: `QUAL-ISSUE-${q.id}`,
          type: "Quality Defect",
          poNumber: q.poNumber,
          date: q.inspectionDate,
          description: `Defects flagged: ${q.productDefects}. Inspector notes: ${q.inspectorRemarks}`,
          severity: q.overallQualityRating < 3.5 ? "High" : "Medium"
        });
      }
    });

    // 3. Communication SLA breaches
    commLogs.forEach(c => {
      if (c.communicationStatus === "SLA Breach") {
        issuesList.push({
          id: `COMM-ISSUE-${c.id}`,
          type: "SLA Breach",
          poNumber: c.poNumber,
          date: c.messageSentTime.split("T")[0],
          description: `Failed to respond within SLA threshold. ${c.remarks || ""}`,
          severity: "High"
        });
      }
    });

    return issuesList;
  }, [deliveries, qualityEvals, commLogs]);

  // Filter vendors list by search term
  const filteredVendorsList = useMemo(() => {
    if (!vendorSearch.trim()) return vendorsList;
    const q = vendorSearch.toLowerCase();
    return vendorsList.filter(v => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q));
  }, [vendorsList, vendorSearch]);

  const renderStarRating = (val: number) => (
    <span className="font-extrabold text-amber-600 flex items-center gap-1">
      <Star size={13} fill="currentColor" />
      <span>{val.toFixed(2)} / 5.0</span>
    </span>
  );

  return (
    <div className="space-y-6 font-sans">
      {/* TOP HEADER & VENDOR SELECTOR */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-slate-700" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Performance History Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Deep-dive analytical trail &amp; historical SLA records per merchant.</p>
        </div>

        {/* Vendor Selector Dropdown */}
        <div className="w-full md:w-80">
          <div className="relative">
            {isVendorRole ? (
              <div className="flex items-center gap-2 p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700">
                <Lock size={14} className="text-amber-600" />
                <span>{selectedVendor}</span>
                <span className="ml-auto text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">My Org</span>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SELECT VENDOR PROFILE</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {filteredVendorsList.map(v => (
                    <option key={v.name} value={v.name}>{v.name} ({v.category})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OVERALL SUMMARY STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Purchase Orders</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {deliveries.length > 0 ? deliveries.length : vendorOrders.length}
            </div>
            <span className="text-[11px] text-slate-400">Total contracts issued</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShoppingCart size={18} />
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On-Time Delivery Rate</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {metrics ? `${metrics.onTimeDeliveryRate}%` : "92%"}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">SLA On-time adherence</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Truck size={18} />
          </div>
        </div>

        {/* Avg Quality */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Quality Rating</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">
              {metrics ? `${metrics.avgQualityRating.toFixed(1)}★` : "4.5★"}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">Inspection pass rate</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award size={18} />
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Response Duration</span>
            <div className="text-2xl font-extrabold text-teal-600 mt-1">
              {metrics ? formatDurationHours(metrics.avgResponseTimeHours) : "1h 48m"}
            </div>
            <span className="text-[11px] text-teal-600 font-semibold">Communication SLA</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
        </div>
      </div>

      {/* PERFORMANCE TREND LINE CHART */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Monthly Performance Trend: {selectedVendor}</h3>
            <span className="text-xs text-slate-400">Historical performance score trajectory (0 to 100 benchmark)</span>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Overall Score: {metrics?.overallPerformanceScore || 90} / 100
          </span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Line
                type="monotone"
                dataKey="overallScore"
                name="Performance Index"
                stroke={roleColor || "#1565C0"}
                strokeWidth={3}
                dot={{ r: 4, fill: roleColor || "#1565C0" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MATERIAL TAB GROUP (6 TABS) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Group Navigation Header */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 pt-3 gap-1 scrollbar-none">
          <button
            onClick={() => setActiveTabGroup("orders")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTabGroup === "orders"
                ? "bg-white text-blue-700 border-t-2 border-x border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShoppingCart size={14} /> Purchase Orders ({vendorOrders.length})
          </button>

          <button
            onClick={() => setActiveTabGroup("deliveries")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTabGroup === "deliveries"
                ? "bg-white text-blue-700 border-t-2 border-x border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Truck size={14} /> Delivery Records ({deliveries.length})
          </button>

          <button
            onClick={() => setActiveTabGroup("quality")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTabGroup === "quality"
                ? "bg-white text-blue-700 border-t-2 border-x border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award size={14} /> Quality Ratings ({qualityEvals.length})
          </button>

          <button
            onClick={() => setActiveTabGroup("communication")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTabGroup === "communication"
                ? "bg-white text-blue-700 border-t-2 border-x border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare size={14} /> Communication Records ({commLogs.length})
          </button>

          <button
            onClick={() => setActiveTabGroup("service")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTabGroup === "service"
                ? "bg-white text-blue-700 border-t-2 border-x border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Star size={14} /> Service Ratings ({servRatings.length})
          </button>

          <button
            onClick={() => setActiveTabGroup("issues")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTabGroup === "issues"
                ? "bg-white text-rose-700 border-t-2 border-x border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <AlertTriangle size={14} /> Issues &amp; Breaches ({vendorIssues.length})
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-4">
          {/* TAB 1: PURCHASE ORDERS */}
          {activeTabGroup === "orders" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Order Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorOrders.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-slate-400">No purchase order contracts recorded for this vendor.</td></tr>
                  ) : (
                    vendorOrders.map(po => (
                      <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-blue-700">{po.id}</td>
                        <td className="p-3 text-slate-600">{po.category}</td>
                        <td className="p-3 text-slate-600">{po.date}</td>
                        <td className="p-3 font-bold text-slate-800">{toINR(po.amount)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            po.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            po.status === "Completed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            po.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: DELIVERY RECORDS */}
          {activeTabGroup === "deliveries" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Expected Date</th>
                    <th className="p-3">Actual Date</th>
                    <th className="p-3 text-center">Delay</th>
                    <th className="p-3 text-center">Delivery Status</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-400">No delivery logs for this vendor.</td></tr>
                  ) : (
                    deliveries.map(d => {
                      const delay = d.delayDays ?? 0;
                      return (
                        <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-blue-700">{d.poNumber}</td>
                          <td className="p-3 text-slate-600">{d.expectedDeliveryDate}</td>
                          <td className="p-3 text-slate-600">{d.actualDeliveryDate || "Pending"}</td>
                          <td className="p-3 text-center font-bold">
                            {delay > 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">+{delay} days</span>
                            ) : (
                              <span className="text-emerald-600">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              d.deliveryStatus === "Early" ? "bg-teal-50 text-teal-700 border-teal-200" :
                              d.deliveryStatus === "On-Time" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {d.deliveryStatus}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{d.remarks || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: QUALITY RATINGS */}
          {activeTabGroup === "quality" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-3">Inspection Date</th>
                    <th className="p-3">PO Number</th>
                    <th className="p-3 text-center">Material</th>
                    <th className="p-3 text-center">Packaging</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-center">Spec Compliance</th>
                    <th className="p-3 text-center">Overall Quality</th>
                    <th className="p-3">Defects</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityEvals.length === 0 ? (
                    <tr><td colSpan={9} className="p-6 text-center text-slate-400">No quality inspections recorded.</td></tr>
                  ) : (
                    qualityEvals.map(q => (
                      <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 text-slate-600">{q.inspectionDate}</td>
                        <td className="p-3 font-mono text-blue-700 font-bold">{q.poNumber}</td>
                        <td className="p-3 text-center font-bold">{q.materialQuality}/5</td>
                        <td className="p-3 text-center font-bold">{q.packagingQuality}/5</td>
                        <td className="p-3 text-center font-bold">{q.quantityAccuracy}/5</td>
                        <td className="p-3 text-center font-bold">{q.specificationCompliance}/5</td>
                        <td className="p-3 text-center">{renderStarRating(q.overallQualityRating)}</td>
                        <td className="p-3 text-slate-600">
                          {q.productDefects === "None" ? (
                            <span className="text-emerald-600 font-semibold">None</span>
                          ) : (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">{q.productDefects}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">{q.inspectorRemarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: COMMUNICATION RECORDS */}
          {activeTabGroup === "communication" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Message Sent</th>
                    <th className="p-3">Vendor Response</th>
                    <th className="p-3 text-center">Duration</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {commLogs.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-400">No communication logs recorded.</td></tr>
                  ) : (
                    commLogs.map(c => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-blue-700">{c.poNumber}</td>
                        <td className="p-3 text-slate-600">{c.messageSentTime.replace("T", " ").slice(0, 16)}</td>
                        <td className="p-3 text-slate-600">{c.vendorResponseTime ? c.vendorResponseTime.replace("T", " ").slice(0, 16) : "—"}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{formatDurationHours(c.responseDurationHours)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.communicationStatus === "Responded" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            c.communicationStatus === "SLA Breach" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {c.communicationStatus}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{c.remarks || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: SERVICE RATINGS */}
          {activeTabGroup === "service" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-3">PO Number</th>
                    <th className="p-3 text-center">Prof.</th>
                    <th className="p-3 text-center">Support</th>
                    <th className="p-3 text-center">Doc. Quality</th>
                    <th className="p-3 text-center">Flexibility</th>
                    <th className="p-3 text-center">Comm. Eff.</th>
                    <th className="p-3 text-center">Resolution</th>
                    <th className="p-3 text-center">Overall Rating</th>
                    <th className="p-3">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {servRatings.length === 0 ? (
                    <tr><td colSpan={9} className="p-6 text-center text-slate-400">No service ratings logged for this vendor.</td></tr>
                  ) : (
                    servRatings.map(s => (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-blue-700">{s.poNumber}</td>
                        <td className="p-3 text-center font-bold">{s.professionalism}/5</td>
                        <td className="p-3 text-center font-bold">{s.customerSupport}/5</td>
                        <td className="p-3 text-center font-bold">{s.documentationQuality}/5</td>
                        <td className="p-3 text-center font-bold">{s.flexibility}/5</td>
                        <td className="p-3 text-center font-bold">{s.communicationEffectiveness}/5</td>
                        <td className="p-3 text-center font-bold">{s.issueResolution}/5</td>
                        <td className="p-3 text-center">{renderStarRating(s.overallServiceRating)}</td>
                        <td className="p-3 text-slate-500">{s.comments}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: ISSUES */}
          {activeTabGroup === "issues" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-3">Issue Type</th>
                    <th className="p-3">PO Reference</th>
                    <th className="p-3">Log Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorIssues.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-slate-400">✓ No open issues or SLA breaches logged for this vendor.</td></tr>
                  ) : (
                    vendorIssues.map(issue => (
                      <tr key={issue.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle size={13} className="text-rose-500" />
                            {issue.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-blue-700 font-bold">{issue.poNumber}</td>
                        <td className="p-3 text-slate-600">{issue.date}</td>
                        <td className="p-3 text-slate-700">{issue.description}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            issue.severity === "High" ? "bg-rose-100 text-rose-800 border-rose-300" :
                            issue.severity === "Medium" ? "bg-amber-100 text-amber-800 border-amber-300" :
                            "bg-slate-100 text-slate-700 border-slate-300"
                          }`}>
                            {issue.severity}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
