import React, { useState, useEffect, useMemo } from "react";
import {
  Users, Truck, Award, Clock, CheckCircle, AlertTriangle,
  TrendingUp, BarChart2, ChevronRight, ExternalLink, ShieldAlert,
  MessageSquare, Star, FileText, Medal, ArrowRight
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell
} from "recharts";
import { performanceService, formatDurationHours } from "../../services/performanceService";
import type {
  DeliveryPerformance,
  VendorPerformanceMetrics,
  VendorRanking
} from "../../models/performance";

interface VendorPerformanceDashboardViewProps {
  roleColor: string;
  onNavigateTab: (tab: string, vendorName?: string) => void;
}

export function VendorPerformanceDashboardView({
  roleColor,
  onNavigateTab
}: VendorPerformanceDashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<DeliveryPerformance[]>([]);
  const [metrics, setMetrics] = useState<VendorPerformanceMetrics[]>([]);
  const [rankings, setRankings] = useState<VendorRanking[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<{ month: string; TechCorp: number; GlobalLog: number; Aggregate: number }[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const [dList, mList, rList] = await Promise.all([
      performanceService.getDeliveries(),
      performanceService.getMetrics(),
      performanceService.getRankings()
    ]);

    setDeliveries(dList);
    setMetrics(mList);
    setRankings(rList);

    // Build multi-series trend line data (Aggregate vs Key Vendors)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const trendData = months.map((month, idx) => {
      // TechCorp trend
      const techScore = 90 + Math.min(5, idx);
      // GlobalLog trend
      const globScore = 84 + Math.min(5, idx);
      // Aggregate average trend
      const aggScore = Math.round((techScore + globScore + 80 + idx) / 3);
      return {
        month,
        "TechCorp Solutions": techScore,
        "Global Logistics": globScore,
        "Overall Aggregate": aggScore
      };
    });

    setMonthlyTrendData(trendData as any);
    setLoading(false);
  };

  // 1. SIX STAT CARDS CALCULATIONS
  const statCardsData = useMemo(() => {
    const totalVendors = metrics.length || 8;
    const avgDelivery = metrics.length ? Math.round(metrics.reduce((acc, m) => acc + m.onTimeDeliveryRate, 0) / metrics.length) : 85;
    const avgQuality = metrics.length ? Number((metrics.reduce((acc, m) => acc + m.avgQualityRating, 0) / metrics.length).toFixed(1)) : 4.3;
    const avgRespHours = metrics.length ? metrics.reduce((acc, m) => acc + m.avgResponseTimeHours, 0) / metrics.length : 2.8;
    const completedOrders = deliveries.filter(d => d.deliveryStatus === "On-Time" || d.deliveryStatus === "Early").length || 6;
    const delayedDeliveries = deliveries.filter(d => d.deliveryStatus === "Delayed").length || 5;

    return {
      totalVendors,
      avgDelivery,
      avgQuality,
      avgResponseFormatted: formatDurationHours(avgRespHours),
      completedOrders,
      delayedDeliveries
    };
  }, [metrics, deliveries]);

  // 2. TOP 5 VS BOTTOM 5 DATA FOR BAR CHART
  const topVsBottomBarData = useMemo(() => {
    if (rankings.length === 0) return [];
    const sorted = [...rankings].sort((a, b) => b.overallScore - a.overallScore);
    const top5 = sorted.slice(0, 5);
    const bottom5 = sorted.slice(-5).reverse();

    // Map for visualization
    const barData: { name: string; score: number; group: "Top 5" | "Bottom 5"; fullName: string }[] = [];

    top5.forEach(r => {
      barData.push({
        name: r.vendorName.split(" ")[0],
        score: r.overallScore,
        group: "Top 5",
        fullName: r.vendorName
      });
    });

    bottom5.forEach(r => {
      // Avoid duplicate if total vendors <= 5
      if (!barData.some(b => b.fullName === r.vendorName)) {
        barData.push({
          name: r.vendorName.split(" ")[0],
          score: r.overallScore,
          group: "Bottom 5",
          fullName: r.vendorName
        });
      }
    });

    return barData;
  }, [rankings]);

  // 3. TOP PERFORMING VENDORS (TOP 5)
  const topPerformingVendors = useMemo(() => {
    return [...rankings].sort((a, b) => b.overallScore - a.overallScore).slice(0, 5);
  }, [rankings]);

  // 4. VENDORS NEEDING ATTENTION (Lowest score / most delays)
  const vendorsNeedingAttention = useMemo(() => {
    return rankings
      .filter(r => {
        const vDeliv = deliveries.filter(d => d.vendorName === r.vendorName);
        const hasDelays = vDeliv.some(d => d.deliveryStatus === "Delayed" || (d.delayDays && d.delayDays > 0));
        return r.overallScore < 83 || hasDelays;
      })
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 4);
  }, [rankings, deliveries]);

  // 5. QUICK-LINK CARDS
  const quickLinks = [
    {
      id: "perf-delivery",
      title: "Delivery Performance",
      description: "Logistics tracking, delay logs, & SLA shipping compliance.",
      icon: Truck,
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      id: "perf-quality",
      title: "Quality Evaluation",
      description: "Inspect raw materials, specification match, & defect reports.",
      icon: Award,
      color: "bg-amber-50 text-amber-600 border-amber-200"
    },
    {
      id: "perf-communication",
      title: "Communication Tracking",
      description: "Audit inquiry response latencies & vendor SLA breach logs.",
      icon: MessageSquare,
      color: "bg-teal-50 text-teal-600 border-teal-200"
    },
    {
      id: "perf-service",
      title: "Service Rating Matrix",
      description: "Evaluate customer support, flexibility, & documentation quality.",
      icon: Star,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200"
    },
    {
      id: "perf-history",
      title: "Performance History",
      description: "Deep historical trend charts & tabbed 6-category record ledger.",
      icon: FileText,
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      id: "perf-ranking",
      title: "Vendor Ranking",
      description: "Ranked leaderboard with medal badges & weighted score metrics.",
      icon: Medal,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200"
    }
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* ── 1. SIX STAT CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Vendors Evaluated */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluated Vendors</span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{statCardsData.totalVendors}</div>
          <span className="text-[10px] text-slate-400 mt-1">Active benchmark profiles</span>
        </div>

        {/* Card 2: Avg Delivery Performance % */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Delivery %</span>
            <Truck size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2">{statCardsData.avgDelivery}%</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1">On-time shipping SLA</span>
        </div>

        {/* Card 3: Avg Product Quality Rating */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Quality Rating</span>
            <Award size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">{statCardsData.avgQuality}★</div>
          <span className="text-[10px] text-amber-600 font-bold mt-1">Material audit score</span>
        </div>

        {/* Card 4: Avg Response Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</span>
            <Clock size={16} className="text-teal-500" />
          </div>
          <div className="text-2xl font-extrabold text-teal-600 mt-2">{statCardsData.avgResponseFormatted}</div>
          <span className="text-[10px] text-teal-600 font-bold mt-1">Communication response</span>
        </div>

        {/* Card 5: Total Completed Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Orders</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{statCardsData.completedOrders}</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1">Fulfilled without delay</span>
        </div>

        {/* Card 6: Delayed Deliveries */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delayed Deliveries</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">{statCardsData.delayedDeliveries}</div>
          <span className="text-[10px] text-rose-600 font-bold mt-1">Shipping SLA breaches</span>
        </div>
      </div>

      {/* ── 2. CHARTS SECTION (LINE CHART + BAR CHART) ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Line Chart: Multi-series Aggregate Trends */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Overall Vendor Performance Trends Over Time</h3>
              <span className="text-xs text-slate-400">Monthly aggregate index trajectory (Jan - Jun 2026)</span>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Multi-Series View
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 15, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Overall Aggregate" stroke="#1565C0" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="TechCorp Solutions" stroke="#2E7D32" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Global Logistics" stroke="#E65100" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Top 5 vs Bottom 5 Vendors Comparison */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Top 5 vs Bottom 5 Vendors Comparison</h3>
              <span className="text-xs text-slate-400">Comparing highest overall performers against lower tier suppliers</span>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Score out of 100
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVsBottomBarData} margin={{ top: 10, right: 15, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} / 100 (${item.payload.group})`,
                    item.payload.fullName
                  ]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={26}>
                  {topVsBottomBarData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.group === "Top 5" ? "#2E7D32" : "#E65100"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── 3. LEADERBOARD CARDS SECTION ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card A: Top Performing Vendors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Medal size={20} className="text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">Top Performing Vendors</h3>
              </div>
              <button
                onClick={() => onNavigateTab("perf-ranking")}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
              >
                Full Leaderboard <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {topPerformingVendors.map((vendor, idx) => (
                <div
                  key={vendor.vendorName}
                  onClick={() => onNavigateTab("perf-history", vendor.vendorName)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs ${
                      idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                      idx === 1 ? "bg-slate-200 text-slate-800 border border-slate-300" :
                      idx === 2 ? "bg-amber-900/10 text-amber-950 border border-amber-800/30" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 transition">
                        {vendor.vendorName}
                      </div>
                      <span className="text-[10px] text-slate-400">{vendor.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600 font-mono">
                      {vendor.overallScore} / 100
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">Top Tier Compliant</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card B: Vendors Needing Attention */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm bg-rose-50/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Vendors Needing Attention</h3>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Action Required
              </span>
            </div>

            <div className="space-y-3">
              {vendorsNeedingAttention.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  ✓ All vendors currently meet baseline SLA compliance.
                </div>
              ) : (
                vendorsNeedingAttention.map((vendor) => {
                  const vDeliv = deliveries.filter(d => d.vendorName === vendor.vendorName);
                  const delayCount = vDeliv.filter(d => d.deliveryStatus === "Delayed").length;

                  return (
                    <div
                      key={vendor.vendorName}
                      className="p-3 rounded-lg border border-rose-150 bg-white hover:bg-rose-50/30 transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                          <span>{vendor.vendorName}</span>
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                            Score: {vendor.overallScore}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Category: <b>{vendor.category}</b></span>
                          {delayCount > 0 && (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <AlertTriangle size={11} /> {delayCount} Delayed PO(s)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigateTab("perf-history", vendor.vendorName)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1 border border-rose-200"
                      >
                        Inspect <ChevronRight size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. QUICK-LINK CARDS ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Quick Performance Navigation</h3>
          <p className="text-xs text-slate-400">Direct shortcuts to specialized analytical views in Module 4</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <div
                key={link.id}
                onClick={() => onNavigateTab(link.id)}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group bg-slate-50/50 hover:bg-white"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold border ${link.color}`}>
                      <Icon size={18} />
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 transition">
                    {link.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {link.description}
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  Open Section →
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
