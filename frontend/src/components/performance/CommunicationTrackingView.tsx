import React, { useState, useEffect } from "react";
import { MessageSquare, Plus, X, Search, Filter, Clock, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { performanceService, formatDurationHours } from "../../services/performanceService";
import type { CommunicationLog, DeliveryPerformance } from "../../models/performance";

interface CommunicationTrackingViewProps {
  roleColor: string;
  currentRole?: string;
  userVendorName?: string;
  onSuccessToast: (msg: string) => void;
}

export const CommunicationTrackingView: React.FC<CommunicationTrackingViewProps> = ({
  roleColor,
  currentRole = "Administrator",
  userVendorName,
  onSuccessToast,
}) => {
  const isVendor = currentRole === "Vendor";
  const canLog = currentRole === "Administrator" || currentRole === "Procurement Manager";

  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryPerformance[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Log Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedPONumber, setSelectedPONumber] = useState<string>("");
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");

  // Datetime pickers stored as ISO or local datetime strings e.g. "2026-07-23T10:00"
  const nowStr = new Date().toISOString().slice(0, 16);
  const [sentTime, setSentTime] = useState<string>(nowStr);
  const [respTime, setRespTime] = useState<string>(nowStr);
  const [commStatus, setCommStatus] = useState<"Responded" | "SLA Breach" | "Awaiting Response">("Responded");
  const [remarks, setRemarks] = useState<string>("Standard PO query response.");

  const [validationError, setValidationError] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    const logs = await performanceService.getCommunicationLogs();
    const dels = await performanceService.getDeliveries();
    const vendorObjs = await performanceService.getVendors();

    setCommLogs(logs);
    setDeliveries(dels);
    setVendors(vendorObjs.map((v) => v.name));

    if (dels.length > 0) {
      setSelectedPONumber(dels[0].poNumber);
      setSelectedVendorName(dels[0].vendorName);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openLogDialog = () => {
    const currentPO = deliveries.find((d) => d.poNumber === selectedPONumber) || deliveries[0];
    if (currentPO) {
      setSelectedPONumber(currentPO.poNumber);
      setSelectedVendorName(currentPO.vendorName);
    }
    const currentNow = new Date().toISOString().slice(0, 16);
    setSentTime(currentNow);
    setRespTime(currentNow);
    setCommStatus("Responded");
    setRemarks("Logged communication timeline.");
    setValidationError("");
    setIsModalOpen(true);
  };

  const handlePOChange = (poNum: string) => {
    setSelectedPONumber(poNum);
    const poObj = deliveries.find((d) => d.poNumber === poNum);
    if (poObj) {
      setSelectedVendorName(poObj.vendorName);
    }
  };

  // Compute duration in hours dynamically from sentTime and respTime
  const computeLiveDuration = (): { hours: number; formatted: string; isValid: boolean } => {
    if (!sentTime || (commStatus === "Responded" && !respTime)) {
      return { hours: 0, formatted: "N/A", isValid: true };
    }

    const tSent = new Date(sentTime).getTime();
    const tResp = new Date(respTime).getTime();

    if (isNaN(tSent) || isNaN(tResp)) {
      return { hours: 0, formatted: "N/A", isValid: true };
    }

    if (commStatus === "Responded" && tResp <= tSent) {
      return { hours: 0, formatted: "Invalid (Response <= Sent)", isValid: false };
    }

    const diffMs = tResp - tSent;
    const diffHours = diffMs / (1000 * 60 * 60);

    return {
      hours: Number(diffHours.toFixed(2)),
      formatted: formatDurationHours(diffHours),
      isValid: true,
    };
  };

  const liveDuration = computeLiveDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPONumber) {
      setValidationError("Please select a PO Number.");
      return;
    }

    if (commStatus === "Responded") {
      const tSent = new Date(sentTime).getTime();
      const tResp = new Date(respTime).getTime();

      if (tResp <= tSent) {
        setValidationError("Response Time must be after Message Sent Time.");
        return;
      }
    }

    setValidationError("");

    const durationHours =
      commStatus === "Responded" ? liveDuration.hours : undefined;
    const finalRespTime =
      commStatus === "Responded" ? new Date(respTime).toISOString() : undefined;
    const finalSentTime = new Date(sentTime).toISOString();

    await performanceService.addCommunicationLog({
      poNumber: selectedPONumber,
      vendorName: selectedVendorName,
      messageSentTime: finalSentTime,
      vendorResponseTime: finalRespTime,
      responseDurationHours: durationHours,
      communicationStatus: commStatus,
      remarks: remarks.trim() || "Logged SLA checkpoint",
    });

    onSuccessToast(
      `Communication log for ${selectedPONumber} recorded successfully!`
    );
    setIsModalOpen(false);
    await loadData();
  };

  // Filter logs
  const filteredLogs = commLogs.filter((c) => {
    const matchesVendorRole = !isVendor || (!!userVendorName && c.vendorName.toLowerCase().includes(userVendorName.toLowerCase()));
    if (!matchesVendorRole) return false;

    const matchesVendor = vendorFilter === "ALL" || c.vendorName === vendorFilter;
    const matchesSearch =
      c.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.remarks && c.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesVendor && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-600" />
              Vendor Communication &amp; Response SLA Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Track vendor responsiveness, reply turnarounds, and communication SLA breaches.
            </p>
          </div>

          {canLog && (
            <button
              onClick={openLogDialog}
              className="text-white text-xs font-bold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              style={{ backgroundColor: roleColor }}
            >
              <Plus size={16} /> Log Communication
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO, Vendor, Remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Vendor Filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Vendors</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Material Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
            Communication Records ({filteredLogs.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Vendor Name</th>
                <th className="p-3.5">Message Sent Time</th>
                <th className="p-3.5">Vendor Response Time</th>
                <th className="p-3.5">Response Duration</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading communication logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No communication logs found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((c) => {
                  const sentDisplay = c.messageSentTime
                    ? new Date(c.messageSentTime).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "—";

                  const respDisplay = c.vendorResponseTime
                    ? new Date(c.vendorResponseTime).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "—";

                  const durationDisplay = formatDurationHours(c.responseDurationHours);

                  return (
                    <tr key={c.id || c.poNumber} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-700">{c.poNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{c.vendorName}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">{sentDisplay}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">{respDisplay}</td>
                      <td className="p-3.5 font-extrabold text-slate-800 font-mono">
                        {durationDisplay}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            c.communicationStatus === "SLA Breach"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : c.communicationStatus === "Awaiting Response"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {c.communicationStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-[200px] truncate" title={c.remarks}>
                        {c.remarks || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── LOG COMMUNICATION DIALOG ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Clock size={18} style={{ color: roleColor }} />
                  Log Vendor Communication SLA
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record message timestamp and vendor response turnaround.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* PO Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">SELECT PURCHASE ORDER</label>
                <select
                  value={selectedPONumber}
                  onChange={(e) => handlePOChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs font-mono"
                >
                  {deliveries.map((d) => (
                    <option key={d.poNumber} value={d.poNumber}>
                      {d.poNumber} — {d.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Read-Only field */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase">Vendor Name</label>
                <input
                  type="text"
                  value={selectedVendorName}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 text-xs cursor-not-allowed mt-1"
                />
              </div>

              {/* Communication Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">COMMUNICATION STATUS</label>
                <select
                  value={commStatus}
                  onChange={(e) => setCommStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs"
                >
                  <option value="Responded">Responded (Turnaround Tracked)</option>
                  <option value="SLA Breach">SLA Breach (Late / Exceeded Max Response Time)</option>
                  <option value="Awaiting Response">Awaiting Response (Pending Reply)</option>
                </select>
              </div>

              {/* Datetime Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MESSAGE SENT TIME</label>
                  <input
                    type="datetime-local"
                    value={sentTime}
                    onChange={(e) => setSentTime(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  />
                </div>

                {commStatus === "Responded" && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">VENDOR RESPONSE TIME</label>
                    <input
                      type="datetime-local"
                      value={respTime}
                      onChange={(e) => setRespTime(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* LIVE Duration Preview Card */}
              {commStatus === "Responded" && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    liveDuration.isValid
                      ? "bg-blue-50/80 border-blue-200 text-blue-900"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                      Live Computed Response Duration
                    </span>
                    <div className="text-lg font-extrabold font-mono mt-0.5">
                      {liveDuration.formatted}
                    </div>
                  </div>
                  <Clock size={22} className={liveDuration.isValid ? "text-blue-500" : "text-rose-500"} />
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">REMARKS / COMMUNICATION SUMMARY</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter details on email, portal inquiry, or call response..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1.5 shadow-md"
                  style={{ backgroundColor: roleColor }}
                >
                  <CheckCircle size={15} /> Save Communication Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
