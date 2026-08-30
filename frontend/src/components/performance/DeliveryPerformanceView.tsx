import React, { useState, useEffect, useMemo } from "react";
import {
  Truck, CheckCircle, Clock, AlertTriangle, Search, Filter,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { performanceService } from "../../services/performanceService";
import type { DeliveryPerformance } from "../../models/performance";

interface DeliveryPerformanceViewProps {
  roleColor: string;
  currentRole?: string;
  userVendorName?: string;
  onSuccessToast?: (msg: string) => void;
}

type SortField = "poNumber" | "vendorName" | "expectedDeliveryDate" | "actualDeliveryDate" | "delayDays" | "deliveryStatus";
type SortOrder = "asc" | "desc";

export function DeliveryPerformanceView({ roleColor, currentRole = "Administrator", userVendorName, onSuccessToast }: DeliveryPerformanceViewProps) {
  const isVendor = currentRole === "Vendor";
  const [deliveries, setDeliveries] = useState<DeliveryPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Sorting states
  const [sortField, setSortField] = useState<SortField>("expectedDeliveryDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await performanceService.getDeliveries();
    setDeliveries(data);
    setLoading(false);
  };

  // Filtered deliveries for role
  const roleFilteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const matchesVendorRole = !isVendor || (!!userVendorName && d.vendorName.toLowerCase().includes(userVendorName.toLowerCase()));
      return matchesVendorRole;
    });
  }, [deliveries, isVendor, userVendorName]);

  // Summary Metrics computed from role filtered deliveries
  const summaryMetrics = useMemo(() => {
    const total = roleFilteredDeliveries.length;
    if (total === 0) return { total: 0, onTimePercent: 0, earlyCount: 0, delayedCount: 0 };

    const early = roleFilteredDeliveries.filter(d => d.deliveryStatus === "Early").length;
    const onTime = roleFilteredDeliveries.filter(d => d.deliveryStatus === "On-Time").length;
    const delayed = roleFilteredDeliveries.filter(d => d.deliveryStatus === "Delayed").length;

    // Fulfilled on time or early
    const onTimeRate = Math.round(((onTime + early) / total) * 100);

    return {
      total,
      onTimePercent: onTimeRate,
      earlyCount: early,
      delayedCount: delayed
    };
  }, [roleFilteredDeliveries]);

  // Unique vendor list for filter
  const vendorList = useMemo(() => {
    const set = new Set(roleFilteredDeliveries.map(d => d.vendorName));
    return Array.from(set).sort();
  }, [roleFilteredDeliveries]);

  // Filtered & Sorted deliveries
  const filteredDeliveries = useMemo(() => {
    return roleFilteredDeliveries.filter(d => {
      // Vendor filter
      if (selectedVendor !== "ALL" && d.vendorName !== selectedVendor) return false;
      // Status filter
      if (selectedStatus !== "ALL" && d.deliveryStatus !== selectedStatus) return false;
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchPo = d.poNumber.toLowerCase().includes(query);
        const matchVendor = d.vendorName.toLowerCase().includes(query);
        const matchRemarks = (d.remarks || "").toLowerCase().includes(query);
        if (!matchPo && !matchVendor && !matchRemarks) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField] ?? "";
      let valB: any = b[sortField] ?? "";

      if (sortField === "delayDays") {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [roleFilteredDeliveries, selectedVendor, selectedStatus, searchTerm, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredDeliveries.length / pageSize) || 1;
  const paginatedDeliveries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDeliveries.slice(start, start + pageSize);
  }, [filteredDeliveries, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-400 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* SUMMARY CHIPS AT TOP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chip 1: Total Deliveries */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Deliveries</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{summaryMetrics.total}</div>
            <span className="text-[11px] text-slate-400">Total shipment logs</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck size={20} />
          </div>
        </div>

        {/* Chip 2: On-Time % */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">On-Time Rate</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{summaryMetrics.onTimePercent}%</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Compliant deliveries</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Chip 3: Early Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Early Shipments</span>
            <div className="text-2xl font-extrabold text-teal-600 mt-1">{summaryMetrics.earlyCount}</div>
            <span className="text-[11px] text-teal-600 font-semibold">Before expected date</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        {/* Chip 4: Delayed Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delayed Deliveries</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">{summaryMetrics.delayedCount}</div>
            <span className="text-[11px] text-rose-600 font-semibold">SLA delay breaches</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search PO, Vendor, Remarks..."
            className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter size={14} /> Filter:
          </div>

          {/* Vendor Filter */}
          <select
            value={selectedVendor}
            onChange={(e) => { setSelectedVendor(e.target.value); setCurrentPage(1); }}
            className="border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Vendors</option>
            {vendorList.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="Early">Early</option>
            <option value="On-Time">On-Time</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>
      </div>

      {/* MATERIAL TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider select-none">
                <th onClick={() => handleSort("poNumber")} className="p-3.5 cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center gap-1.5">
                    <span>PO Number</span>
                    {getSortIcon("poNumber")}
                  </div>
                </th>
                <th onClick={() => handleSort("vendorName")} className="p-3.5 cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center gap-1.5">
                    <span>Vendor Name</span>
                    {getSortIcon("vendorName")}
                  </div>
                </th>
                <th onClick={() => handleSort("expectedDeliveryDate")} className="p-3.5 cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center gap-1.5">
                    <span>Expected Date</span>
                    {getSortIcon("expectedDeliveryDate")}
                  </div>
                </th>
                <th onClick={() => handleSort("actualDeliveryDate")} className="p-3.5 cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center gap-1.5">
                    <span>Actual Date</span>
                    {getSortIcon("actualDeliveryDate")}
                  </div>
                </th>
                <th onClick={() => handleSort("delayDays")} className="p-3.5 text-center cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Delay</span>
                    {getSortIcon("delayDays")}
                  </div>
                </th>
                <th onClick={() => handleSort("deliveryStatus")} className="p-3.5 text-center cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Delivery Status</span>
                    {getSortIcon("deliveryStatus")}
                  </div>
                </th>
                <th className="p-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading delivery performance data...</td>
                </tr>
              ) : paginatedDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No delivery performance records match your filters.</td>
                </tr>
              ) : (
                paginatedDeliveries.map((item) => {
                  const delay = item.delayDays ?? 0;
                  const isDelayed = delay > 0 || item.deliveryStatus === "Delayed";

                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                      {/* PO Number */}
                      <td className="p-3.5 font-mono text-blue-700 font-bold">{item.poNumber}</td>
                      {/* Vendor Name */}
                      <td className="p-3.5 font-bold text-slate-800">{item.vendorName}</td>
                      {/* Expected Date */}
                      <td className="p-3.5 text-slate-600">{item.expectedDeliveryDate}</td>
                      {/* Actual Date */}
                      <td className="p-3.5 text-slate-600">{item.actualDeliveryDate || "Pending"}</td>
                      {/* Delay (days) */}
                      <td className="p-3.5 text-center">
                        {isDelayed ? (
                          <span className="text-rose-600 font-extrabold font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            +{delay} {delay === 1 ? "day" : "days"}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-extrabold">—</span>
                        )}
                      </td>
                      {/* Delivery Status Chip */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          item.deliveryStatus === "Early"
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : item.deliveryStatus === "On-Time"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.deliveryStatus === "Early" ? "bg-teal-500" :
                            item.deliveryStatus === "On-Time" ? "bg-emerald-500" : "bg-rose-500"
                          }`} />
                          {item.deliveryStatus}
                        </span>
                      </td>
                      {/* Remarks */}
                      <td className="p-3.5 text-slate-500 max-w-xs truncate" title={item.remarks}>
                        {item.remarks || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-slate-250 rounded px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="ml-2 text-slate-400">
              Showing {filteredDeliveries.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to Math.min({currentPage * pageSize}, {filteredDeliveries.length}) of {filteredDeliveries.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-250 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-250 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
