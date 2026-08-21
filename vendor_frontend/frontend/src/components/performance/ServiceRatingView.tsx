import React, { useState, useEffect } from "react";
import { Star, CheckCircle, Lock, Award, Search, Filter, MessageSquare, AlertCircle } from "lucide-react";
import { StarRating } from "./StarRating";
import { performanceService } from "../../services/performanceService";
import type { DeliveryPerformance, ServiceRating } from "../../models/performance";

interface EligiblePOItem {
  delivery: DeliveryPerformance;
  isRated: boolean;
  rating?: ServiceRating;
}

interface ServiceRatingViewProps {
  roleColor: string;
  currentRole?: string;
  userVendorName?: string;
  onSuccessToast: (msg: string) => void;
}

export const ServiceRatingView: React.FC<ServiceRatingViewProps> = ({
  roleColor,
  currentRole = "Administrator",
  userVendorName,
  onSuccessToast,
}) => {
  const isVendor = currentRole === "Vendor";
  const canRate = currentRole === "Administrator" || currentRole === "Procurement Manager";

  const [eligibleList, setEligibleList] = useState<EligiblePOItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNRATED" | "RATED">("ALL");

  // Active Selected PO for Rating / Viewing
  const [selectedItem, setSelectedItem] = useState<EligiblePOItem | null>(null);

  // Form interactive rating states (1 to 5)
  const [professionalism, setProfessionalism] = useState<number>(5);
  const [customerSupport, setCustomerSupport] = useState<number>(5);
  const [documentationQuality, setDocumentationQuality] = useState<number>(5);
  const [flexibility, setFlexibility] = useState<number>(5);
  const [communicationEffectiveness, setCommunicationEffectiveness] = useState<number>(5);
  const [issueResolution, setIssueResolution] = useState<number>(5);
  const [comments, setComments] = useState<string>("Exceptional vendor service and responsiveness.");

  const loadData = async () => {
    setLoading(true);
    const items = await performanceService.getEligibleServicePOs();
    setEligibleList(items);

    if (items.length > 0) {
      // Select the first unrated PO, or default to the first PO
      const firstUnrated = items.find((i) => !i.isRated) || items[0];
      selectPOItem(firstUnrated);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectPOItem = (item: EligiblePOItem) => {
    setSelectedItem(item);
    if (item.isRated && item.rating) {
      // Read-only values from existing rating
      setProfessionalism(item.rating.professionalism);
      setCustomerSupport(item.rating.customerSupport);
      setDocumentationQuality(item.rating.documentationQuality);
      setFlexibility(item.rating.flexibility);
      setCommunicationEffectiveness(item.rating.communicationEffectiveness);
      setIssueResolution(item.rating.issueResolution);
      setComments(item.rating.comments || "");
    } else {
      // Default interactive values for new rating
      setProfessionalism(5);
      setCustomerSupport(5);
      setDocumentationQuality(5);
      setFlexibility(5);
      setCommunicationEffectiveness(5);
      setIssueResolution(5);
      setComments("Vendor delivered satisfactory customer service and professional execution.");
    }
  };

  // Live computed overall service rating average across all 6 categories
  const liveOverallServiceRating = Number(
    (
      (professionalism +
        customerSupport +
        documentationQuality +
        flexibility +
        communicationEffectiveness +
        issueResolution) /
      6
    ).toFixed(2)
  );

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || selectedItem.isRated || !canRate) return;

    const poNum = selectedItem.delivery.poNumber;
    const vName = selectedItem.delivery.vendorName;

    await performanceService.addServiceRating({
      poNumber: poNum,
      vendorName: vName,
      professionalism,
      customerSupport,
      documentationQuality,
      flexibility,
      communicationEffectiveness,
      issueResolution,
      comments: comments.trim() || "Service evaluated satisfactorily.",
    });

    onSuccessToast(`Service Rating for ${poNum} submitted! Vendor scores updated.`);
    await loadData();
  };

  // Filtered PO list
  const filteredList = eligibleList.filter((item) => {
    const matchesVendorRole = !isVendor || (!!userVendorName && item.delivery.vendorName.toLowerCase().includes(userVendorName.toLowerCase()));
    if (!matchesVendorRole) return false;

    const matchesSearch =
      item.delivery.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.delivery.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "RATED" && item.isRated) ||
      (statusFilter === "UNRATED" && !item.isRated);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── LEFT COLUMN: List of Completed POs Eligible for Rating (5 cols) ── */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            Completed Purchase Orders
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a completed PO to submit an interactive service evaluation or review existing rating.
          </p>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter PO or Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`flex-1 py-1 text-center rounded-md transition-colors ${
                statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
              }`}
            >
              All ({eligibleList.length})
            </button>
            <button
              onClick={() => setStatusFilter("UNRATED")}
              className={`flex-1 py-1 text-center rounded-md transition-colors ${
                statusFilter === "UNRATED" ? "bg-white text-amber-700 shadow-xs" : "text-slate-500"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("RATED")}
              className={`flex-1 py-1 text-center rounded-md transition-colors ${
                statusFilter === "RATED" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500"
              }`}
            >
              Rated
            </button>
          </div>
        </div>

        {/* List of Cards */}
        <div className="space-y-2.5 overflow-y-auto max-h-[550px] pr-1">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading orders...</div>
          ) : filteredList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
              No matching purchase orders.
            </div>
          ) : (
            filteredList.map((item) => {
              const isSelected = selectedItem?.delivery.poNumber === item.delivery.poNumber;

              return (
                <button
                  key={item.delivery.poNumber}
                  onClick={() => selectPOItem(item)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-400/20 shadow-xs"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-extrabold text-slate-800 text-xs">
                      {item.delivery.poNumber}
                    </span>
                    {item.isRated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle size={10} /> Rated ({item.rating?.overallServiceRating}★)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Eligible for Rating
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 truncate">
                    {item.delivery.vendorName}
                  </h4>

                  <div className="flex justify-between items-center mt-2.5 text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                    <span>Date: {item.delivery.actualDeliveryDate || item.delivery.expectedDeliveryDate}</span>
                    {item.isRated && item.rating && (
                      <StarRating rating={item.rating.overallServiceRating} readOnly size={12} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Service Rating Form / Read-Only View (7 cols) ── */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
        {!selectedItem ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Select a completed PO from the left panel to rate vendor service.
          </div>
        ) : (
          <form onSubmit={handleSubmitRating} className="space-y-5 text-xs">
            {/* Header & Status Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Star size={18} className="text-amber-500 fill-amber-500" />
                  Service Quality Evaluation Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluate professionalism, support, documentation, and problem resolution.
                </p>
              </div>

              {selectedItem.isRated && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  <Lock size={12} className="text-slate-500" /> Read-Only (Already Rated)
                </span>
              )}
            </div>

            {/* Read-Only PO details banner */}
            <div className="grid grid-cols-2 gap-3 bg-slate-100/70 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase">PO Number</label>
                <input
                  type="text"
                  value={selectedItem.delivery.poNumber}
                  readOnly
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono font-bold text-slate-800 text-xs cursor-not-allowed mt-1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase">Vendor Name</label>
                <input
                  type="text"
                  value={selectedItem.delivery.vendorName}
                  readOnly
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-bold text-slate-800 text-xs cursor-not-allowed mt-1 truncate"
                />
              </div>
            </div>

            {/* Prominent Live Computed Overall Service Rating Display */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/50 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                  {selectedItem.isRated ? "Submitted Overall Service Rating" : "Live Computed Overall Service Score"}
                </span>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">
                  {liveOverallServiceRating} / 5.0
                </div>
              </div>

              <div className="flex flex-col items-end">
                <StarRating rating={liveOverallServiceRating} readOnly size={24} />
                <span className="text-[10px] font-semibold text-slate-400 mt-1">Average of 6 categories</span>
              </div>
            </div>

            {/* 6 Interactive 1-5 Star Ratings Grid */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                Service Criteria (1 – 5 Stars)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "1. Professionalism", val: professionalism, set: setProfessionalism, desc: "Ethical conduct & commercial transparency" },
                  { label: "2. Customer Support", val: customerSupport, set: setCustomerSupport, desc: "Account manager availability & courtesy" },
                  { label: "3. Documentation Quality", val: documentationQuality, set: setDocumentationQuality, desc: "Accuracy of invoices, spec sheets & PO notes" },
                  { label: "4. Flexibility", val: flexibility, set: setFlexibility, desc: "Adaptability to schedule or quantity revisions" },
                  { label: "5. Communication Effectiveness", val: communicationEffectiveness, set: setCommunicationEffectiveness, desc: "Clarity, prompt updates & proactive alerts" },
                  { label: "6. Issue Resolution", val: issueResolution, set: setIssueResolution, desc: "Speed and satisfaction in resolving disputes/RMA" },
                ].map((crit) => (
                  <div
                    key={crit.label}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{crit.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{crit.desc}</div>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-slate-200/50">
                      <StarRating
                        rating={crit.val}
                        onChange={selectedItem.isRated ? undefined : crit.set}
                        readOnly={selectedItem.isRated}
                        size={18}
                      />
                      <span className="font-mono font-bold text-slate-700 text-xs">{crit.val}★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Textarea */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">SERVICE COMMENTS &amp; FEEDBACK</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={selectedItem.isRated}
                placeholder="Write detailed remarks regarding vendor partnership..."
                className={`w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-xs ${
                  selectedItem.isRated ? "bg-slate-100 cursor-not-allowed text-slate-600" : "bg-white"
                }`}
              />
            </div>

            {/* Submit Button (Only shown when not yet rated) */}
            {!selectedItem.isRated && (
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full text-white font-bold py-2.5 rounded-xl transition-opacity hover:opacity-90 flex items-center justify-center gap-2 shadow-md text-xs"
                  style={{ backgroundColor: roleColor }}
                >
                  <CheckCircle size={16} /> Submit Service Review &amp; Update Rankings
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
