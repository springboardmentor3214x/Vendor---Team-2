import React, { useState, useEffect, useMemo } from "react";
import {
  Award, RefreshCw, Filter, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Sparkles, ExternalLink, ShieldCheck, Medal
} from "lucide-react";
import { performanceService } from "../../services/performanceService";
import type { VendorRanking } from "../../models/performance";

interface VendorRankingViewProps {
  roleColor: string;
  currentRole?: string;
  onNavigateVendorHistory?: (vendorName: string) => void;
  onSuccessToast?: (msg: string) => void;
}

type SortField = "rankPosition" | "vendorName" | "category" | "overallScore" | "deliveryScore" | "qualityScore" | "communicationScore" | "serviceScore";
type SortOrder = "asc" | "desc";

export function VendorRankingView({
  roleColor,
  currentRole,
  onNavigateVendorHistory,
  onSuccessToast
}: VendorRankingViewProps) {
  const [rankings, setRankings] = useState<VendorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("rankPosition");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const canRegenerate = currentRole === "Administrator" || currentRole === "Procurement Manager";

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setLoading(true);
    const list = await performanceService.getRankings();
    setRankings(list);
    setLoading(false);
  };

  const handleRegenerateRankings = async () => {
    setRegenerating(true);
    // Simulate re-calculating client-side rankings algorithm
    setTimeout(async () => {
      const updated = await performanceService.getRankings();
      setRankings(updated);
      setRegenerating(false);
      if (onSuccessToast) {
        onSuccessToast("⚡ Client-side ranking engine executed! Vendor SLA scores updated and re-sorted.");
      }
    }, 600);
  };

  const categories = useMemo(() => {
    const set = new Set(rankings.map(r => r.category));
    return Array.from(set).sort();
  }, [rankings]);

  // Filtered & Sorted Rankings
  const processedRankings = useMemo(() => {
    return rankings.filter(r => {
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = r.vendorName.toLowerCase().includes(q);
        const matchCat = r.category.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [rankings, selectedCategory, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "rankPosition" ? "asc" : "desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-400 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />;
  };

  // Medal styling helper for Top 3
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-xs font-black shadow-sm">
          🥇 Gold (#1)
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-900 border border-slate-350 px-2.5 py-1 rounded-full text-xs font-black shadow-sm">
          🥈 Silver (#2)
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-900/10 text-amber-950 border border-amber-800/30 px-2.5 py-1 rounded-full text-xs font-black shadow-sm">
          🥉 Bronze (#3)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold border border-slate-250">
        #{rank}
      </span>
    );
  };

  // Progress Bar renderer helper
  const renderProgressBar = (score: number, height = 6) => {
    let colorClass = "bg-emerald-500";
    if (score < 70) colorClass = "bg-rose-500";
    else if (score < 80) colorClass = "bg-amber-500";
    else if (score < 90) colorClass = "bg-blue-500";

    return (
      <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height }}>
        <div
          className={`h-full ${colorClass} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER & REGENERATE BUTTON BAR */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award size={22} className="text-amber-500" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Vendor Reliability Leaderboard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Weighted scoring: Delivery (30%), Quality (30%), Communication (20%), Service (20%).</p>
        </div>

        {/* Regenerate Rankings Button */}
        {canRegenerate && (
          <button
            onClick={handleRegenerateRankings}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: roleColor || "#1565C0" }}
          >
            <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
            <span>{regenerating ? "Calculating SLA Weights..." : "Regenerate Rankings"}</span>
          </button>
        )}
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor name or category..."
            className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Filter size={14} /> Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories ({rankings.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RANKING MATERIAL TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider select-none">
                <th onClick={() => handleSort("rankPosition")} className="p-3.5 text-center cursor-pointer hover:bg-slate-100 transition w-28">
                  <div className="flex items-center justify-center gap-1">
                    <span>Rank</span>
                    {getSortIcon("rankPosition")}
                  </div>
                </th>
                <th onClick={() => handleSort("vendorName")} className="p-3.5 cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center gap-1.5">
                    <span>Vendor Name</span>
                    {getSortIcon("vendorName")}
                  </div>
                </th>
                <th onClick={() => handleSort("category")} className="p-3.5 cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {getSortIcon("category")}
                  </div>
                </th>
                <th onClick={() => handleSort("overallScore")} className="p-3.5 cursor-pointer hover:bg-slate-100 transition min-w-[160px]">
                  <div className="flex items-center gap-1.5">
                    <span>Overall Performance Score</span>
                    {getSortIcon("overallScore")}
                  </div>
                </th>
                <th onClick={() => handleSort("deliveryScore")} className="p-3.5 text-center cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center justify-center gap-1">
                    <span>Delivery</span>
                    {getSortIcon("deliveryScore")}
                  </div>
                </th>
                <th onClick={() => handleSort("qualityScore")} className="p-3.5 text-center cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center justify-center gap-1">
                    <span>Quality</span>
                    {getSortIcon("qualityScore")}
                  </div>
                </th>
                <th onClick={() => handleSort("communicationScore")} className="p-3.5 text-center cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center justify-center gap-1">
                    <span>Comm</span>
                    {getSortIcon("communicationScore")}
                  </div>
                </th>
                <th onClick={() => handleSort("serviceScore")} className="p-3.5 text-center cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center justify-center gap-1">
                    <span>Service</span>
                    {getSortIcon("serviceScore")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading || regenerating ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-blue-600" />
                      <span>Evaluating supplier metrics and re-sorting leaderboard...</span>
                    </div>
                  </td>
                </tr>
              ) : processedRankings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">No vendor ranking records found matching your filters.</td>
                </tr>
              ) : (
                processedRankings.map((rank) => (
                  <tr
                    key={rank.vendorName}
                    onClick={() => {
                      if (onNavigateVendorHistory) {
                        onNavigateVendorHistory(rank.vendorName);
                      }
                    }}
                    className="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer transition group"
                    title={`Click to view ${rank.vendorName}'s Performance History`}
                  >
                    {/* Rank Position Badge */}
                    <td className="p-3.5 text-center">
                      {renderRankBadge(rank.rankPosition)}
                    </td>

                    {/* Vendor Name */}
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900 group-hover:text-blue-700 transition flex items-center gap-1.5">
                        <span>{rank.vendorName}</span>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-blue-600 transition" />
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-[11px] font-semibold border border-slate-200">
                        {rank.category}
                      </span>
                    </td>

                    {/* Overall Score with Progress Bar */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold font-mono text-slate-800">{rank.overallScore} / 100</span>
                          <span className={`text-[10px] font-bold ${
                            rank.overallScore >= 90 ? "text-emerald-600" :
                            rank.overallScore >= 80 ? "text-blue-600" : "text-amber-600"
                          }`}>
                            {rank.overallScore >= 90 ? "Top Tier" : rank.overallScore >= 80 ? "Good" : "Standard"}
                          </span>
                        </div>
                        {renderProgressBar(rank.overallScore, 7)}
                      </div>
                    </td>

                    {/* Delivery Score */}
                    <td className="p-3.5 text-center">
                      <div className="w-16 mx-auto space-y-1">
                        <div className="font-bold text-slate-700 text-[11px]">{rank.deliveryScore}%</div>
                        {renderProgressBar(rank.deliveryScore, 4)}
                      </div>
                    </td>

                    {/* Quality Score */}
                    <td className="p-3.5 text-center">
                      <div className="w-16 mx-auto space-y-1">
                        <div className="font-bold text-slate-700 text-[11px]">{rank.qualityScore}%</div>
                        {renderProgressBar(rank.qualityScore, 4)}
                      </div>
                    </td>

                    {/* Communication Score */}
                    <td className="p-3.5 text-center">
                      <div className="w-16 mx-auto space-y-1">
                        <div className="font-bold text-slate-700 text-[11px]">{rank.communicationScore}%</div>
                        {renderProgressBar(rank.communicationScore, 4)}
                      </div>
                    </td>

                    {/* Service Score */}
                    <td className="p-3.5 text-center">
                      <div className="w-16 mx-auto space-y-1">
                        <div className="font-bold text-slate-700 text-[11px]">{rank.serviceScore}%</div>
                        {renderProgressBar(rank.serviceScore, 4)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
          💡 Click on any vendor row to inspect detailed performance history ledger &amp; tab records.
        </div>
      </div>
    </div>
  );
}
